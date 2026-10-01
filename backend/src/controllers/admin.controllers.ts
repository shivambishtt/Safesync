import { Request, Response } from "express";
import { Society } from "../models/society.models";
import { ApplicationStatus, User, Role } from "../models/user.models";
import mongoose from "mongoose";

export const getPendingSecretaries = async (req: Request, res: Response) => {
  try {
    const pendingRequests = await User.find({
      role: Role.SECRETARY,
      isVerified: false,
    })
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });

    if (!pendingRequests) {
      return res.status(400).json({
        success: false,
        message: "No pending requests for secretary's role",
      });
    }

    return res.status(200).json({
      success: true,
      count: pendingRequests.length,
      users: pendingRequests,
    });
  } catch (error) {
    console.error("Get pending secretaries error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const approvePendingSecretary = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(401).json({
      success: false,
      message: "ID missing from params",
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.role !== Role.SECRETARY) {
    return res.status(400).json({
      success: false,
      message: "You are not an authorized person",
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "User is already managing a society",
    });
  }

  user.isVerified = true;
  user.applicationStatus = ApplicationStatus.ACCEPTED;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Secretary approved successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    },
  });
};

export const revokeSecretary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "ID missing from params",
      });
    }

    const user = await User.findById(id).select("-refreshToken -password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.SECRETARY) {
      return res.status(400).json({
        success: false,
        message: "Only secretary accounts can be revoked through this endpoint",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "This secretary is currently not verified",
      });
    }

    user.isVerified = false;
    user.applicationStatus = ApplicationStatus.PENDING;
    user.save();

    return res.status(200).json({
      success: true,
      message: "Secretary's Role revoked successfully",
      user,
    });
  } catch (error) {
    console.error("Revoke secretary error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while revoking the secretary",
    });
  }
};

export const disapproveSecretary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID missing from params",
      });
    }

    const user = await User.findById(id).select("-refreshToken -password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.applicationStatus !== ApplicationStatus.PENDING) {
      return res.status(401).json({
        success: false,
        message: "No pending application status found",
      });
    }

    user.applicationStatus = ApplicationStatus.REJECTED;
    user.isVerified = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Secretary's Application rejected",
    });
  } catch (error) {
    console.error("Disapprove secretary error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while disapproving the secretary",
    });
  }
};

export const assignSecretary = async (req: Request, res: Response) => {
  try {
    const { societyId } = req.params;
    const { secretaryId } = req.body;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: "ID missing from params",
      });
    }

    if (!secretaryId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });
    }

    if (
      typeof societyId !== "string" ||
      !mongoose.Types.ObjectId.isValid(societyId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid society ID" });
    }

    if (
      typeof secretaryId !== "string" ||
      !mongoose.Types.ObjectId.isValid(secretaryId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid secretary ID" });
    }

    const user = await User.findById(secretaryId).select("role");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role !== Role.SECRETARY) {
      return res.status(400).json({
        success: false,
        message: "User is not a secretary",
      });
    }

    const society = await Society.findOneAndUpdate(
      { _id: societyId, secretary: null },
      {
        secretary: new mongoose.Types.ObjectId(secretaryId),
      },
      { new: true },
    );

    if (!society) {
      const exists = await Society.exists({ _id: societyId });
      return exists
        ? res.status(409).json({
            success: false,
            message: "Secretary already exists for this society",
          })
        : res
            .status(404)
            .json({ success: false, message: "Society not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Secretary assigned successfully",
      society,
    });
  } catch (error) {
    console.error("Something went wrong while assigning secretary", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
