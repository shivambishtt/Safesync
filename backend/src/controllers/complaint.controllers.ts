import { Request, Response } from "express";
import {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from "../models/complaint.models";
import { Flat } from "../models/flat.models";
import mongoose from "mongoose";
import { Society } from "../models/society.models";
import { getComplaintByFilterQuerySchema } from "../validations/querySchema.validations";
import { success } from "zod";

export const registerComplaint = async (req: Request, res: Response) => {
  try {
    const { title, description, category, priority } = req.body;
    const { flatId } = req.params;
    const user = req.user;

    if (!title || !description || !category || !priority) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!flatId) {
      return res.status(402).json({
        success: false,
        message: "Flat Id not found",
      });
    }

    if (
      typeof flatId !== "string" ||
      !mongoose.Types.ObjectId.isValid(flatId)
    ) {
      return res.status(402).json({
        success: false,
        message: "Missing Flat Id",
      });
    }

    const flat = await Flat.findById(flatId).select("owner society");
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    const society = await Society.findById(flat.society).select("secretary");

    if (!society) {
      return res.status(404).json({
        success: false,
        message: "Society not found",
      });
    }

    const isOwner = flat.owner?.toString() === user?.id;
    const isSecretary = society.secretary?.toString() === user?.id;

    if (!isOwner && !isSecretary) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to register a complaint",
      });
    }

    const existingComplaint = await Complaint.findOne({
      flat: flat._id,
      category,
      status: {
        $in: [
          ComplaintStatus.PENDING,
          ComplaintStatus.ASSIGNED,
          ComplaintStatus.IN_PROGRESS,
        ],
      },
    });

    if (existingComplaint) {
      return res.status(409).json({
        success: false,
        message: "A similar active complaint already exists for this flat",
      });
    }
    const complaint = await Complaint.create({
      title,
      description,
      flat: flat._id,
      society: flat.society,
      category,
      priority,
      registeredBy: user?.id,
      assignedTo: null,
      resolvedBy: null,
      estimatedClosureTime: null,
      resolvedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Complaint registered successfully",
      complaint,
    });
  } catch (error) {
    console.error("Error occured while registering complaint", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getComplaint = async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.params;
    const user = req.user;

    if (!complaintId) {
      return res.status(400).json({
        success: false,
        message: "Missing Complaint Id",
      });
    }

    if (
      typeof complaintId !== "string" ||
      !mongoose.Types.ObjectId.isValid(complaintId)
    ) {
      return res.status(400).json({
        sucess: false,
        message: "Invalid Complaint Id",
      });
    }

    const complaint = await Complaint.findById(complaintId).select(
      "-flat -society -registeredBy -resolvedBy -resolvedAt",
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint details fetched successfully",
      complaint,
    });
  } catch (error) {
    console.error("Error occured while fetching complaint detail", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const { societyId } = req.params;
    const user = req.user;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: "Missing Society Id",
      });
    }

    if (
      typeof societyId !== "string" ||
      !mongoose.Types.ObjectId.isValid(societyId)
    ) {
      return res.status(400).json({
        sucess: false,
        message: "Invalid Society Id",
      });
    }

    const society = await Society.findById(societyId).select("secretary");

    if (!society) {
      return res.status(404).json({
        success: false,
        message: "Society not found",
      });
    }

    if (user?.id.toString() !== society?.secretary?.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view complaints for your society",
      });
    }

    const complaints = await Complaint.find({
      society: society._id,
    })
      .select("_id")
      .sort({
        createdAt: -1,
      })
      .limit(10);

    if (!complaints || complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No complaints found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully",
      complaints,
    });
  } catch (error) {
    console.error("Error occured while fetching complaints of Society", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getComplaintByFilter = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { societyId } = req.params;

    if (!societyId) {
      return res.status(401).json({
        success: false,
        message: "Society Id is required",
      });
    }

    if (
      typeof societyId !== "string" ||
      !mongoose.Types.ObjectId.isValid(societyId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid Society Id",
      });
    }

    const society = await Society.findById(societyId).select("secretary");

    if (!society) {
      return res.status(404).json({
        success: false,
        message: "Society not found",
      });
    }

    if (user?.id.toString() !== society?.secretary?.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view complaints for your society",
      });
    }

    const parsedSchema = getComplaintByFilterQuerySchema.safeParse(req.query);

    if (!parsedSchema.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: parsedSchema.error.flatten().fieldErrors,
      });
    }

    const { status } = parsedSchema.data;

    const filter: any = {
      status,
    };

    if (status) {
      filter.status = status;
    }

    const complaint = await Complaint.find(filter)
      .select("title description")
      .populate("flat", "flatNumber floor -_id");

    if (complaint.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No complaints found with this status",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint details fetched successfully",
      complaint,
    });
  } catch (error) {
    console.error("Error occured while getting complaints by filter", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
