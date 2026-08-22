import { Request, Response } from "express";
import { User } from "../models/user.models";
import { Role } from "../models/user.models";

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
