import { Request, Response } from "express";
import { User } from "../models/user.models";
import { Role } from "../models/user.models";

export const getPendingSecretaries = async (req: Request, res: Response) => {
  try {
    const pendingRequests = await User.find({
      role: Role.SECRETARY,
      isVerified: false,
    }).select("-password -refreshToken");

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
