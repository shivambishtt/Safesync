import { Request, Response } from "express";
import mongoose from "mongoose";
import { User, Role, ApplicationStatus } from "../models/user.models";
import { Society } from "../models/society.models";

const getSecretarySociety = async (userId: string) => {
  const secretary = await User.findOne({
    _id: userId,
    role: Role.SECRETARY,
  }).select("_id");

  if (!secretary) return null;

  return Society.findOne({
    secretary: secretary._id,
  }).select("_id");
};

export const addSecurityGuard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const society = await getSecretarySociety(userId);

    if (!society) {
      return res.status(403).json({
        success: false,
        message: "Society not found or unauthorized",
      });
    }

    const { name, email, phoneNumber, password } = req.body;

    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email or phone number already registered",
      });
    }

    const guard = await User.create({
      name,
      email,
      phoneNumber,
      password,
      role: Role.SECURITY,
      society: society._id,
      applicationStatus: ApplicationStatus.ACCEPTED,
      isVerified: false,
      isActive: true,
    });

    const safeGuard = await User.findById(guard._id).select(
      "-password -refreshToken -code -passwordResetToken -passwordResetTokenExpiry -verificationCodeExpiry",
    );

    return res.status(201).json({
      success: true,
      message: "Security guard added successfully",
      guard: safeGuard,
    });
  } catch (error: any) {
    console.error("Add security guard error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone number already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllSecurityGuards = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const society = await getSecretarySociety(userId);

    if (!society) {
      return res.status(403).json({
        success: false,
        message: "Society not found or unauthorized",
      });
    }

    const guards = await User.find({
      role: Role.SECURITY,
      society: society._id,
    })
      .select(
        "-password -refreshToken -code -passwordResetToken -passwordResetTokenExpiry -verificationCodeExpiry",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Security guards fetched successfully",
      totalGuards: guards.length,
      guards,
    });
  } catch (error) {
    console.error("Get security guards error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSecurityGuardById = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const guardId = req.params.guardId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (
      typeof guardId !== "string" ||
      !mongoose.Types.ObjectId.isValid(guardId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid security guard ID",
      });
    }

    const society = await getSecretarySociety(userId);

    if (!society) {
      return res.status(403).json({
        success: false,
        message: "Society not found or unauthorized",
      });
    }

    const guard = await User.findOne({
      _id: guardId,
      role: Role.SECURITY,
      society: society._id,
    }).select(
      "-password -refreshToken -code -passwordResetToken -passwordResetTokenExpiry -verificationCodeExpiry",
    );

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: "Security guard not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Security guard fetched successfully",
      guard,
    });
  } catch (error) {
    console.error("Get security guard error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateSecurityGuard = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const guardId = req.params.guardId;
    const { name, email, phoneNumber } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (
      typeof guardId !== "string" ||
      !mongoose.Types.ObjectId.isValid(guardId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid security guard ID",
      });
    }

    if (!name && !email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const society = await getSecretarySociety(userId);

    if (!society) {
      return res.status(403).json({
        success: false,
        message: "Society not found or unauthorized",
      });
    }

    const guard = await User.findOne({
      _id: guardId,
      role: Role.SECURITY,
      society: society._id,
      isActive: { $ne: false },
    });

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: "Security guard not found",
      });
    }

    if (email && email.toLowerCase() !== guard.email) {
      const normalizedEmail = email.trim().toLowerCase();

      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: guard._id },
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      guard.email = normalizedEmail;
      guard.isVerified = false;
      guard.code = null;
      guard.verificationCodeExpiry = null;
    }

    if (phoneNumber && phoneNumber !== guard.phoneNumber) {
      const phoneExists = await User.findOne({
        phoneNumber,
        _id: { $ne: guard._id },
      });

      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: "Phone number already registered",
        });
      }

      guard.phoneNumber = phoneNumber.trim();
    }

    if (name) {
      guard.name = name.trim();
    }

    await guard.save();

    const safeGuard = await User.findById(guard._id).select(
      "-password -refreshToken -code -passwordResetToken -passwordResetTokenExpiry -verificationCodeExpiry",
    );

    return res.status(200).json({
      success: true,
      message: "Security guard updated successfully",
      guard: safeGuard,
    });
  } catch (error: any) {
    console.error("Update security guard error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone number already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const removeSecurityGuard = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const guardId = req.params.guardId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (
      typeof guardId !== "string" ||
      !mongoose.Types.ObjectId.isValid(guardId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid security guard ID",
      });
    }

    const society = await getSecretarySociety(userId);

    if (!society) {
      return res.status(403).json({
        success: false,
        message: "Society not found or unauthorized",
      });
    }

    const guard = await User.findOneAndUpdate(
      {
        _id: guardId,
        role: Role.SECURITY,
        society: society._id,
        isActive: { $ne: false },
      },
      {
        $set: {
          isActive: false,
          refreshToken: null,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    ).select(
      "-password -refreshToken -code -passwordResetToken -passwordResetTokenExpiry -verificationCodeExpiry",
    );

    if (!guard) {
      return res.status(404).json({
        success: false,
        message: "Security guard not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Security guard deactivated successfully",
      guard,
    });
  } catch (error) {
    console.error("Remove security guard error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
