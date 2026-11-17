import { Request, Response } from "express";
import mongoose from "mongoose";
import { Role, User } from "../models/user.models";
import { Society } from "../models/society.models";
import { SecurityAttendance } from "../models/securityAttendance.models";
import {
  myAttendanceQueryValidation,
  societyAttendanceQueryValidation,
} from "../validations/securityAttendance.validations";

function makeDateFilter(from?: Date, to?: Date) {
  if (!from && !to) return undefined;
  const checkedInAt: { $gte?: Date; $lte?: Date } = {};
  if (from) checkedInAt.$gte = from;
  if (to) {
    const inclusiveEnd = new Date(to);
    if (
      to.toISOString().length === 24 &&
      to.toISOString().endsWith("T00:00:00.000Z")
    ) {
      inclusiveEnd.setUTCHours(23, 59, 59, 999);
    }
    checkedInAt.$lte = inclusiveEnd;
  }
  return checkedInAt;
}

export const checkInSecurityGuard = async (req: Request, res: Response) => {
  try {
    const guard = await User.findById(req.user?.id).select(
      "role society isActive",
    );
    if (!guard)
      return res
        .status(404)
        .json({ success: false, message: "Security guard not found" });
    if (guard.role !== Role.SECURITY)
      return res
        .status(403)
        .json({
          success: false,
          message: "Only security guards can record attendance",
        });
    if (!guard.isActive)
      return res
        .status(403)
        .json({ success: false, message: "Your account is inactive" });
    if (!guard.society)
      return res
        .status(400)
        .json({
          success: false,
          message: "No society assigned to this security guard",
        });

    const activeAttendance = await SecurityAttendance.findOne({
      guard: guard._id,
      checkedOutAt: null,
    });
    if (activeAttendance) {
      return res
        .status(409)
        .json({
          success: false,
          message: "You are already checked in",
          attendance: activeAttendance,
        });
    }

    const attendance = await SecurityAttendance.create({
      guard: guard._id,
      society: guard.society,
      checkedInAt: new Date(),
      checkedOutAt: null,
    });
    return res
      .status(201)
      .json({ success: true, message: "Shift check-in recorded", attendance });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "You are already checked in" });
    }
    console.error("Security guard check-in error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const checkOutSecurityGuard = async (req: Request, res: Response) => {
  try {
    const guard = await User.findById(req.user?.id).select("role society");
    if (!guard)
      return res
        .status(404)
        .json({ success: false, message: "Security guard not found" });
    if (guard.role !== Role.SECURITY)
      return res
        .status(403)
        .json({
          success: false,
          message: "Only security guards can record attendance",
        });
    if (!guard.society)
      return res
        .status(400)
        .json({
          success: false,
          message: "No society assigned to this security guard",
        });

    const attendance = await SecurityAttendance.findOne({
      guard: guard._id,
      society: guard.society,
      checkedOutAt: null,
    });
    if (!attendance)
      return res
        .status(409)
        .json({
          success: false,
          message: "There is no active shift to check out from",
        });

    attendance.checkedOutAt = new Date();
    await attendance.save();
    return res
      .status(200)
      .json({ success: true, message: "Shift check-out recorded", attendance });
  } catch (error) {
    console.error("Security guard check-out error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getMySecurityAttendance = async (req: Request, res: Response) => {
  try {
    const parsed = myAttendanceQueryValidation.safeParse(req.query);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid attendance filters",
          errors: parsed.error.flatten(),
        });

    const guard = await User.findById(req.user?.id).select(
      "role society isActive",
    );
    if (!guard)
      return res
        .status(404)
        .json({ success: false, message: "Security guard not found" });
    if (guard.role !== Role.SECURITY)
      return res
        .status(403)
        .json({
          success: false,
          message: "Only security guards can view their attendance",
        });
    if (!guard.society)
      return res
        .status(400)
        .json({
          success: false,
          message: "No society assigned to this security guard",
        });

    const { page, limit, from, to } = parsed.data;
    const checkedInAt = makeDateFilter(from, to);
    const query = {
      guard: guard._id,
      society: guard.society,
      ...(checkedInAt ? { checkedInAt } : {}),
    };
    const [activeAttendance, attendances, total] = await Promise.all([
      SecurityAttendance.findOne({
        guard: guard._id,
        society: guard.society,
        checkedOutAt: null,
      }),
      SecurityAttendance.find(query)
        .sort({ checkedInAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SecurityAttendance.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Attendance history fetched successfully",
      activeAttendance,
      attendances,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get security guard attendance error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getSocietySecurityAttendance = async (
  req: Request,
  res: Response,
) => {
  try {
    const parsed = societyAttendanceQueryValidation.safeParse(req.query);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid attendance filters",
          errors: parsed.error.flatten(),
        });

    const society = await Society.findOne({ secretary: req.user?.id }).select(
      "_id",
    );
    if (!society)
      return res
        .status(403)
        .json({ success: false, message: "Society not found or unauthorized" });

    const { page, limit, from, to, guardId } = parsed.data;
    if (guardId && !mongoose.Types.ObjectId.isValid(guardId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid security guard ID" });
    }
    if (guardId) {
      const guardExists = await User.exists({
        _id: guardId,
        role: Role.SECURITY,
        society: society._id,
      });
      if (!guardExists)
        return res
          .status(404)
          .json({
            success: false,
            message: "Security guard not found in your society",
          });
    }

    const checkedInAt = makeDateFilter(from, to);
    const query = {
      society: society._id,
      ...(guardId ? { guard: guardId } : {}),
      ...(checkedInAt ? { checkedInAt } : {}),
    };
    const [attendances, total] = await Promise.all([
      SecurityAttendance.find(query)
        .populate("guard", "name email phoneNumber isActive")
        .sort({ checkedInAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SecurityAttendance.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Society guard attendance fetched successfully",
      attendances,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get society security attendance error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
