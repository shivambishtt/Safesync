import { Request, Response } from "express";
import { Role, User } from "../models/user.models";
import { updateProfileValidation } from "../validations/user.validations";
import mongoose from "mongoose";
import { Society } from "../models/society.models";

export const getData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const user = await User.findById(userId).select("-password -refreshToken");

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

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: schema.data,
      },
      {
        returnDocument: "after",
      },
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error occured while updating the profile", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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

    if (user?.role !== Role.RESIDENT) {
      return res.status(403).json({
        success: false,
        message: "You are not authroized to perform this action",
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

