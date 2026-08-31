import { Request, Response } from "express";
import { Society, SocietyStatus } from "../models/society.models";
import { User } from "../models/user.models";

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

export const getSociety = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID missing from params",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const society = await Society.findById(id);

    if (!society) {
      return res.status(404).json({
        success: false,
        message: "Society not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Society Fetched Successfully",
      society,
    });
  } catch (error) {
    console.error("Something went wrong while fetching society", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteSociety = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID missing from params",
      });
    }

    const society = await Society.findById(id);

    if (!society) {
      return res.status(404).json({
        success: false,
        message: "Society not found",
      });
    }

    if (society.flats > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete society while flat exists",
      });
    }

    await Society.findByIdAndDelete({
      _id: id,
    });

    await User.findByIdAndUpdate({ society: id }, { $set: { society: null } });

    return res.status(200).json({
      success: true,
      message: "Society deleted successfully",
    });
  } catch (error) {
    console.error("Something went wrong while deleting society", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
