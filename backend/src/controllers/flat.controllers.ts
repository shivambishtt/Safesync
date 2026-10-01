import { Request, Response } from "express";
import { Role } from "../models/user.models";
import { Society } from "../models/society.models";
import { Flat, FlatType, FlatStatus } from "../models/flat.models";
import mongoose from "mongoose";

export const createFlat = async (req: Request, res: Response) => {
  try {
    const { societyId } = req.params;
    const user = req.user;
    const { flatNumber, owner, block, floor, flatType, area, flatStatus } =
      req.body;

    if (!user || user.role !== Role.SECRETARY) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    if (
      typeof societyId !== "string" ||
      !mongoose.Types.ObjectId.isValid(societyId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid society ID",
      });
    }

    if (!flatNumber || !block || !floor || !flatType || !area || !flatStatus) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!Object.values(FlatStatus).includes(flatStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid flat status value",
      });
    }

    if (!Object.values(FlatType).includes(flatType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid flat type value",
      });
    }

    const society = await Society.findOne({
      _id: societyId,
      secretary: { $ne: null },
    });

    if (!society) {
      return res.status(404).json({
        success: false,
        message: "Society not found or no secretary assigned",
      });
    }

    if (user.role === Role.SECRETARY) {
      if (!society.secretary || society.secretary.toString() !== user.id) {
        return res.status(403).json({
          success: false,
          message: "You can only manage flats in your own society",
        });
      }
    }

    const flat = await Flat.create({
      flatNumber,
      block,
      floor,
      flatType,
      society: society.name,
      flatStatus,
      area,
      owner: null,
    });

    return res.status(201).json({
      success: true,
      message: "Flat created successfully",
      flat,
    });
  } catch (error) {
    console.error("Something went wrong while creating flat", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
