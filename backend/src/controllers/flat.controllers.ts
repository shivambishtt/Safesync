import { Request, Response } from "express";
import { Role, User } from "../models/user.models";
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
      society: society._id,
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

export const getFlat = async (req: Request, res: Response) => {
  try {
    const { flatId } = req.params;
    const user = req.user;

    if (
      !user ||
      (user.role !== Role.SECRETARY && user.role !== Role.SUPER_ADMIN)
    ) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to view this flat",
      });
    }

    if (
      !flatId ||
      typeof flatId !== "string" ||
      !mongoose.Types.ObjectId.isValid(flatId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid flat ID",
      });
    }

    const flat = await Flat.findById(flatId);

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Flat details fetched successfully",
      flat,
    });
  } catch (error) {
    console.error("Something went wrong while fetching flat details", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getFlatByNumber = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { societyId } = req.params;
    const { flatNumber } = req.query

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    if (user.role !== Role.SECRETARY) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    if (
      !societyId ||
      typeof societyId !== "string" ||
      !mongoose.Types.ObjectId.isValid(societyId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid society Id",
      });
    }

    if (!flatNumber || typeof flatNumber !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid flat number",
      });
    }

    const society = await Society.findById(societyId).select("secretary");

    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Society not found" });
    }

    if (society.secretary?.toString() !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only search flats in your own society",
      });
    }

    const flat = await Flat.findOne({
      society: societyId,
      flatNumber,
    });

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Flat details fetched successfully",
      flat,
    });
  } catch (error) {
    console.error("Something went wrong while searching flat by number", error);
  }
};

export const getAllFlats = async (req: Request, res: Response) => {
  try {
    const { societyId } = req.params;
    const user = req.user;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication is required" });
    }
    if (user.role !== Role.SECRETARY && user.role) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view flats",
      });
    }

    if (
      !societyId ||
      typeof societyId !== "string" ||
      !mongoose.Types.ObjectId.isValid(societyId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid society ID",
      });
    }

    const flats = await Flat.find({
      society: societyId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Flats fetched successfully",
      count: flats.length,
      flats,
    });
  } catch (error) {
    console.error("Something went wrong while fetching all flats", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteFlat = async (req: Request, res: Response) => {
  try {
    const { flatId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    if (!user.role || user.role !== Role.SECRETARY) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete flats",
      });
    }

    if (
      !flatId ||
      typeof flatId !== "string" ||
      !mongoose.Types.ObjectId.isValid(flatId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid flat ID",
      });
    }

    const flat = await Flat.findById(flatId).populate("society", "secretary");

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    if (
      user.role === Role.SECRETARY &&
      (flat.society as any)?.secretary?.toString() !== user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only manage flats in your own society",
      });
    }

    if (flat.owner) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a flat that has an owner",
      });
    }

    const deletedFlat = await Flat.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Flat deleted successfully",
      deletedFlat,
    });
  } catch (error) {
    console.error("Something went wrong while deleting flat", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addFlatOwner = async (req: Request, res: Response) => {
  try {
    const { flatId } = req.params;
    const { ownerId } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    if (
      !flatId ||
      typeof flatId !== "string" ||
      !mongoose.Types.ObjectId.isValid(flatId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid flat ID",
      });
    }

    if (
      !ownerId ||
      typeof ownerId !== "string" ||
      !mongoose.Types.ObjectId.isValid(ownerId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid owner ID",
      });
    }

    const flat = await Flat.findById(flatId).populate("society", "secretary");
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    if (
      user.role === Role.SECRETARY &&
      (flat.society as any)?.secretary?.toString() !== user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only manage flats in your own society",
      });
    }

    const owner = await User.findById(ownerId).select("role");

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedFlat = await Flat.findOneAndUpdate(
      {
        _id: flatId,
        owner: null,
        flatStatus: FlatStatus.VACANT,
      },
      {
        owner: ownerId,
        flatStatus: FlatStatus.OCCUPIED,
      },
      {
        new: true,
      },
    );

    if (!updatedFlat) {
      return res.status(409).json({
        success: false,
        message: "Flat already has an owner",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Owner added to flat successfully",
      updatedFlat,
    });
  } catch (error) {
    console.error("Something went wrong while adding owner to flat", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const removeFlatOwner = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const { flatId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    if (user.role !== Role.SECRETARY) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    if (
      !flatId ||
      typeof flatId !== "string" ||
      !mongoose.Types.ObjectId.isValid(flatId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid flat ID",
      });
    }

    const flat = await Flat.findById(flatId).populate("society");
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    if ((flat.society as any)?.secretary?.toString() !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only manage flats in your own society",
      });
    }

    if (!flat.owner) {
      return res.status(400).json({
        success: false,
        message: "Flat owner does not exists",
      });
    }

    const ownerId = flat.owner;
    session.startTransaction();

    const updatedFlat = await Flat.findByIdAndUpdate(
      flat._id,
      {
        flatStatus: FlatStatus.VACANT,
        owner: null,
        resident: null,
      },
      {
        new: true,
        session,
      },
    );

    await User.findByIdAndUpdate(
      ownerId,
      {
        flat: null,
      },
      { new: true, session },
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Flat owner removed successfully",
      updatedFlat,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Something went wrong while removing owner from flat", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    session.endSession();
  }
};

export const updateFlatOwner = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    const user = req.user;
    const { flatId } = req.params;
    const { newOwnerId } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    if (user.role !== Role.SECRETARY) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    if (
      !flatId ||
      typeof flatId !== "string" ||
      !mongoose.Types.ObjectId.isValid(flatId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid flat ID",
      });
    }

    if (
      !newOwnerId ||
      typeof newOwnerId !== "string" ||
      !mongoose.Types.ObjectId.isValid(newOwnerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid new owner ID",
      });
    }

    const flat = await Flat.findById(flatId).populate("society");
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    if ((flat.society as any)?.secretary?.toString() !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only manage flats in your own society",
      });
    }

    if (!flat.owner) {
      return res.status(400).json({
        success: false,
        message: "This flat has no current owner to update",
      });
    }

    const oldOwnerId = flat.owner.toString();

    if (newOwnerId === oldOwnerId) {
      return res.status(409).json({
        success: false,
        message: "This resident is already the owner of this flat",
      });
    }

    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
      return res.status(404).json({
        success: false,
        message: "User does not exist",
      });
    }

    if (newOwner.flat) {
      return res.status(409).json({
        success: false,
        message: "This resident is already assigned to a flat",
      });
    }

    session.startTransaction();

    const updatedFlat = await Flat.findByIdAndUpdate(
      flat._id,
      { owner: newOwner._id },
      { new: true, session },
    );

    await User.findByIdAndUpdate(oldOwnerId, { flat: null }, { session });

    await User.findByIdAndUpdate(
      newOwner._id,
      { flat: updatedFlat?._id },
      { session },
    );

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Flat owner changed successfully",
      flat: updatedFlat,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Something went wrong while updating owner from flat", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    await session.endSession();
  }
};