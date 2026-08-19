import { Request, Response } from "express";
import { Society } from "../models/society.models";
import { Flat } from "../models/flat.models";
import { User } from "../models/user.models";

export const createSociety = async (req: Request, res: Response) => {
  try {
    const { name, address, flats, status } = req.body;
    const secretaryId = req.user?.id;

    if (!secretaryId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in",
      });
    }

    const existingUser = await User.findById(secretaryId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(!existingUser.isVerified){
        return res.status(403).json({
        success: false,
        message: "Your account must be verified before you can create a society",
      });
    }

    if (existingUser.society) {
      return res.status(400).json({
        success: false,
        message: "You are already managing a society",
      });
    }

    const society = await Society.create({
      name,
      secretary: secretaryId,
      address,
      flats,
      status,
    });

    existingUser.society = society._id;
    await existingUser.save();

    return res.status(201).json({
      success: true,
      message: "Society created successfully",
      society,
    });
  } catch (error) {
    console.error("Create society error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
