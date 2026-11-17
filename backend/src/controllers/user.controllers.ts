import { Request, Response } from "express";
import { Role, User } from "../models/user.models";
import { updateProfileValidation } from "../validations/user.validations";
import mongoose from "mongoose";
import { Society } from "../models/society.models";
import { Flat } from "../models/flat.models";
import bcrypt from "bcrypt";
import { generateCode } from "../utils/generateCode";
import { sendEmailChangeVerificationEmail } from "../emails/email.services";

export const getData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const user = await User.findById(userId).select(
      "-password -refreshToken -code -emailChangeCode -emailChangeCodeExpiry -pendingEmail -passwordResetToken -passwordResetTokenExpiry",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this ID not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const schema = updateProfileValidation.safeParse(req.body);

    if (!schema.success) {
      return res.status(400).json({
        message: "Invalid input value",
        errors: schema.error.issues,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (schema.data.name !== undefined) user.name = schema.data.name;
    if (schema.data.phoneNumber !== undefined) {
      const phoneInUse = await User.exists({
        phoneNumber: schema.data.phoneNumber,
        _id: { $ne: user._id },
      });
      if (phoneInUse) {
        return res.status(409).json({
          success: false,
          message: "Phone number already registered",
        });
      }
      user.phoneNumber = schema.data.phoneNumber;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user: await User.findById(user._id).select(
        "-password -refreshToken -code -emailChangeCode -emailChangeCodeExpiry -pendingEmail -passwordResetToken -passwordResetTokenExpiry",
      ),
    });
  } catch (error) {
    console.error("Error occured while updating the profile", error);
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const requestEmailChange = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    const email = String(req.body.email).trim().toLowerCase();
    if (email === user.email)
      return res
        .status(400)
        .json({
          success: false,
          message: "This is already your email address",
        });

    const isPasswordValid = await bcrypt.compare(
      String(req.body.currentPassword),
      user.password,
    );
    if (!isPasswordValid)
      return res
        .status(400)
        .json({ success: false, message: "Password is incorrect" });

    const emailInUse = await User.exists({
      $or: [{ email }, { pendingEmail: email }],
      _id: { $ne: user._id },
    });
    if (emailInUse)
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });

    const code = generateCode();
    user.pendingEmail = email;
    user.emailChangeCode = code;
    user.emailChangeCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendEmailChangeVerificationEmail(email, code);

    return res
      .status(200)
      .json({
        success: true,
        message: "Verification code sent to your new email address",
      });
  } catch (error) {
    console.error("Request email change error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Could not send the verification email",
      });
  }
};

export const verifyEmailChange = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (
      !user.pendingEmail ||
      !user.emailChangeCode ||
      !user.emailChangeCodeExpiry
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Request an email change first" });
    }
    if (user.emailChangeCodeExpiry.getTime() < Date.now()) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Verification code has expired. Request a new one.",
        });
    }

    const codeMatches = await bcrypt.compare(
      String(req.body.code),
      user.emailChangeCode,
    );
    if (!codeMatches)
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });

    const emailInUse = await User.exists({
      $or: [{ email: user.pendingEmail }, { pendingEmail: user.pendingEmail }],
      _id: { $ne: user._id },
    });
    if (emailInUse)
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });

    user.email = user.pendingEmail;
    user.isVerified = true;
    user.pendingEmail = null;
    user.emailChangeCode = null;
    user.emailChangeCodeExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully",
      user: await User.findById(user._id).select(
        "-password -refreshToken -code -emailChangeCode -emailChangeCodeExpiry -pendingEmail -passwordResetToken -passwordResetTokenExpiry",
      ),
    });
  } catch (error) {
    console.error("Verify email change error:", error);
    if ((error as { code?: number }).code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Could not update your email address" });
  }
};

export const getUserFlat = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (user?.role !== Role.RESIDENT) {
      return res.status(403).json({
        success: false,
        message: "You are not authroized to perform this action",
      });
    }

    const checkUser = await User.findById(user.id)
      .select("flat")
      .populate("flat");

    if (!checkUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Flat details fetched succesfully",
      checkUser,
    });
  } catch (error) {
    console.error("Error occured while fetching assigned complaints", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserSociety = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (
      !user ||
      ![Role.RESIDENT, Role.SECRETARY, Role.SECURITY].includes(user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view society details",
      });
    }

    const checkUser = await User.findById(user.id)
      .select("society")
      .populate("society");

    if (!checkUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Society details fetched succesfully",
      checkUser,
    });
  } catch (error) {
    console.error("Error occured while fetching user society", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const viewSocietyResidents = async (req: Request, res: Response) => {
  try {
    const { societyId } = req.params;
    const user = req.user;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: "Missing society Id",
      });
    }

    if (
      typeof societyId !== "string" ||
      !mongoose.Types.ObjectId.isValid(societyId)
    ) {
      return res.status(409).json({
        success: false,
        message: "Invalid society Id",
      });
    }

    const society = await Society.findById(societyId).select("secretary");

    if (!society) {
      return res.status(404).json({
        success: false,
        message: "Society not found",
      });
    }

    if (society?.secretary?.toString() !== user?.id) {
      return res.status(403).json({
        success: false,
        message: "You can only view residents in your society",
      });
    }

    const flats = await Flat.find({
      society: society._id,
      owner: {
        $ne: null,
      },
    })
      .select("flatNumber owner block floor society flatStatus")
      .populate({
        path: "owner",
        select: "name email phoneNumber",
      });

    if (flats.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No flat found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Society residents fetched successfully",
      flats,
    });
  } catch (error) {
    console.error("Error occured while fetching assigned complaints", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
