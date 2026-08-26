import { Request, Response } from "express";
import { Society, SocietyStatus } from "../models/society.models";
import { Role, User } from "../models/user.models";

export const createSociety = async (req: Request, res: Response) => {
  try {
    const { name, address, flats } = req.body;

    const id = req.user?.id;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }
    const user = await User.findById(id).select("-refreshToken -password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const society = await Society.create({
      name,
      address,
      flats,
      status: SocietyStatus.ACTIVE,
    });

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
