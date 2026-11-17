import { Request, Response } from "express";
import mongoose from "mongoose";
import { Notice, NoticeStatus } from "../models/notice.models";
import { Role, User } from "../models/user.models";
import { Society } from "../models/society.models";
import {
  noticeListQueryValidation,
  residentNoticeListQueryValidation,
} from "../validations/notice.validations";

async function resolveSocietyId(userId: string, role: Role) {
  if (role === Role.SECRETARY) {
    const society = await Society.findOne({ secretary: userId }).select("_id");
    return society?._id ?? null;
  }

  const user = await User.findById(userId).select("society");
  return user?.society ?? null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isExpired(expiresAt?: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

function getNoticeId(req: Request, res: Response) {
  const noticeId = req.params.noticeId;
  if (
    typeof noticeId !== "string" ||
    !mongoose.Types.ObjectId.isValid(noticeId)
  ) {
    res.status(400).json({ success: false, message: "Invalid notice ID" });
    return null;
  }
  return noticeId;
}

export const createNotice = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });

    const societyId = await resolveSocietyId(userId, Role.SECRETARY);
    if (!societyId)
      return res.status(400).json({
        success: false,
        message: "No society assigned to this secretary",
      });

    const status = req.body.status ?? NoticeStatus.DRAFT;
    if (status === NoticeStatus.PUBLISHED && isExpired(req.body.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "A notice cannot be published with an expiry date in the past",
      });
    }

    const notice = await Notice.create({
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      priority: req.body.priority,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      society: societyId,
      createdBy: userId,
      status,
      publishedAt: status === NoticeStatus.PUBLISHED ? new Date() : null,
    });

    return res
      .status(201)
      .json({ success: true, message: "Notice created successfully", notice });
  } catch (error) {
    console.error("Create notice error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getSocietyNotices = async (req: Request, res: Response) => {
  try {
    const parsed = noticeListQueryValidation.safeParse(req.query);
    if (!parsed.success)
      return res.status(400).json({
        success: false,
        message: "Invalid notice filters",
        errors: parsed.error.flatten(),
      });

    const societyId = await resolveSocietyId(req.user!.id, Role.SECRETARY);
    if (!societyId)
      return res.status(400).json({
        success: false,
        message: "No society assigned to this secretary",
      });

    const { page, limit, search, ...filters } = parsed.data;
    const query: Record<string, any> = {
      society: societyId,
      ...filters,
    };
    if (search)
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: "i" } },
        { content: { $regex: escapeRegex(search), $options: "i" } },
      ];
    const [notices, total] = await Promise.all([
      Notice.find(query)
        .populate("createdBy", "name")
        .sort({ isPinned: -1, updatedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notice.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Notices fetched successfully",
      notices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get society notices error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getPublishedNoticesForResident = async (
  req: Request,
  res: Response,
) => {
  try {
    const parsed = residentNoticeListQueryValidation.safeParse(req.query);
    if (!parsed.success)
      return res.status(400).json({
        success: false,
        message: "Invalid notice filters",
        errors: parsed.error.flatten(),
      });

    const societyId = await resolveSocietyId(req.user!.id, Role.RESIDENT);
    if (!societyId)
      return res.status(400).json({
        success: false,
        message: "No society assigned to this resident",
      });

    const { page, limit, search, ...filters } = parsed.data;
    const query: Record<string, any> = {
      society: societyId,
      status: NoticeStatus.PUBLISHED,
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
      ],
      ...filters,
    };
    if (search)
      query.$or = [
        { title: { $regex: escapeRegex(search), $options: "i" } },
        { content: { $regex: escapeRegex(search), $options: "i" } },
      ];
    const [notices, total] = await Promise.all([
      Notice.find(query)
        .populate("createdBy", "name")
        .sort({ isPinned: -1, publishedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notice.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Published notices fetched successfully",
      notices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get resident notices error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getNoticeById = async (req: Request, res: Response) => {
  try {
    const noticeId = getNoticeId(req, res);
    if (!noticeId) return;
    const role = req.user!.role;
    const societyId = await resolveSocietyId(req.user!.id, role);
    if (!societyId)
      return res
        .status(404)
        .json({ success: false, message: "Notice not found" });

    const query: Record<string, any> = {
      _id: noticeId,
      society: societyId,
    };
    if (role === Role.RESIDENT) {
      query.status = NoticeStatus.PUBLISHED;
      query.$and = [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
      ];
    }
    const notice = await Notice.findOne(query).populate("createdBy", "name");
    if (!notice)
      return res
        .status(404)
        .json({ success: false, message: "Notice not found" });
    return res
      .status(200)
      .json({ success: true, message: "Notice fetched successfully", notice });
  } catch (error) {
    console.error("Get notice error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const updateNotice = async (req: Request, res: Response) => {
  try {
    const noticeId = getNoticeId(req, res);
    if (!noticeId) return;
    const societyId = await resolveSocietyId(req.user!.id, Role.SECRETARY);
    if (!societyId)
      return res.status(400).json({
        success: false,
        message: "No society assigned to this secretary",
      });
    const update = { ...req.body };
    if (update.expiresAt !== undefined) {
      if (update.expiresAt && isExpired(update.expiresAt))
        return res.status(400).json({
          success: false,
          message: "Expiry date must be in the future",
        });
      update.expiresAt = update.expiresAt ? new Date(update.expiresAt) : null;
    }
    const notice = await Notice.findOneAndUpdate(
      {
        _id: noticeId,
        society: societyId,
        status: { $ne: NoticeStatus.ARCHIVED },
      },
      { $set: update },
      { new: true, runValidators: true },
    ).populate("createdBy", "name");
    if (!notice)
      return res
        .status(404)
        .json({ success: false, message: "Notice not found" });
    return res
      .status(200)
      .json({ success: true, message: "Notice updated successfully", notice });
  } catch (error) {
    console.error("Update notice error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const publishNotice = async (req: Request, res: Response) =>
  transitionNotice(
    req,
    res,
    NoticeStatus.DRAFT,
    { status: NoticeStatus.PUBLISHED, publishedAt: new Date() },
    "Notice published successfully",
  );

export const unpublishNotice = async (req: Request, res: Response) =>
  transitionNotice(
    req,
    res,
    NoticeStatus.PUBLISHED,
    { status: NoticeStatus.DRAFT, publishedAt: null },
    "Notice returned to drafts",
  );

export const archiveNotice = async (req: Request, res: Response) => {
  try {
    const noticeId = getNoticeId(req, res);
    if (!noticeId) return;
    const societyId = await resolveSocietyId(req.user!.id, Role.SECRETARY);
    if (!societyId)
      return res.status(400).json({
        success: false,
        message: "No society assigned to this secretary",
      });
    const notice = await Notice.findOneAndUpdate(
      {
        _id: noticeId,
        society: societyId,
        status: { $ne: NoticeStatus.ARCHIVED },
      },
      { $set: { status: NoticeStatus.ARCHIVED } },
      { new: true },
    );
    if (!notice)
      return res.status(404).json({
        success: false,
        message: "Notice not found or already archived",
      });
    return res
      .status(200)
      .json({ success: true, message: "Notice archived successfully", notice });
  } catch (error) {
    console.error("Archive notice error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const setNoticePinned = async (req: Request, res: Response) => {
  try {
    const noticeId = getNoticeId(req, res);
    if (!noticeId) return;
    const societyId = await resolveSocietyId(req.user!.id, Role.SECRETARY);
    if (!societyId)
      return res.status(400).json({
        success: false,
        message: "No society assigned to this secretary",
      });
    const notice = await Notice.findOneAndUpdate(
      {
        _id: noticeId,
        society: societyId,
        status: { $ne: NoticeStatus.ARCHIVED },
      },
      { $set: { isPinned: req.body.isPinned } },
      { new: true },
    );
    if (!notice)
      return res
        .status(404)
        .json({ success: false, message: "Notice not found" });
    return res.status(200).json({
      success: true,
      message: req.body.isPinned ? "Notice pinned" : "Notice unpinned",
      notice,
    });
  } catch (error) {
    console.error("Update notice pin error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

async function transitionNotice(
  req: Request,
  res: Response,
  expectedStatus: NoticeStatus,
  update: { status: NoticeStatus; publishedAt: Date | null },
  message: string,
) {
  try {
    const noticeId = getNoticeId(req, res);
    if (!noticeId) return;
    const societyId = await resolveSocietyId(req.user!.id, Role.SECRETARY);
    if (!societyId)
      return res.status(400).json({
        success: false,
        message: "No society assigned to this secretary",
      });
    const existing = await Notice.findOne({
      _id: noticeId,
      society: societyId,
    });
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Notice not found" });
    if (existing.status !== expectedStatus)
      return res.status(409).json({
        success: false,
        message: `Only ${expectedStatus.toLowerCase()} notices can use this action`,
      });
    if (
      update.status === NoticeStatus.PUBLISHED &&
      existing.expiresAt &&
      existing.expiresAt.getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be in the future before publishing",
      });
    }
    existing.status = update.status;
    existing.publishedAt = update.publishedAt;
    await existing.save();
    return res.status(200).json({ success: true, message, notice: existing });
  } catch (error) {
    console.error("Change notice status error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
