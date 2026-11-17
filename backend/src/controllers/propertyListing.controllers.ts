import { Request, Response } from "express";
import mongoose from "mongoose";
import { Flat } from "../models/flat.models";
import {
  PropertyListing,
  PropertyListingStatus,
} from "../models/propertyListing.models";
import { Role, User } from "../models/user.models";
import {
  myPropertyListingsQueryValidation,
  propertyListingFeedQueryValidation,
} from "../validations/propertyListing.validations";

async function getResident(userId: string) {
  return User.findOne({ _id: userId, role: Role.RESIDENT }).select(
    "flat society",
  );
}

function getListingId(req: Request, res: Response) {
  const listingId = req.params.listingId;
  if (
    typeof listingId !== "string" ||
    !mongoose.Types.ObjectId.isValid(listingId)
  ) {
    res.status(400).json({ success: false, message: "Invalid listing ID" });
    return null;
  }
  return listingId;
}

function contactSafeListings(
  listings: Array<Record<string, any>>,
  viewerId: string,
) {
  return listings.map((listing) => {
    const owner = listing.owner;
    const isOwner = owner?._id?.toString() === viewerId;
    return {
      ...listing,
      owner: owner
        ? {
            _id: owner._id,
            name: owner.name,
            phoneNumber:
              listing.showContact || isOwner ? owner.phoneNumber : null,
          }
        : null,
    };
  });
}

function populateListing(query: any) {
  return query
    .populate("flat", "flatNumber block floor flatType area")
    .populate("owner", "name phoneNumber")
    .populate("society", "name");
}

export const createPropertyListing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });
    const resident = await getResident(userId);
    if (!resident)
      return res
        .status(404)
        .json({ success: false, message: "Resident account not found" });
    if (!resident.flat || !resident.society) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "You need an assigned flat in a society before creating a listing",
        });
    }

    const flat = await Flat.findOne({
      _id: resident.flat,
      owner: resident._id,
      society: resident.society,
    }).select("_id");
    if (!flat)
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only list a flat that you own",
        });

    const listing = await PropertyListing.create({
      flat: flat._id,
      owner: resident._id,
      society: resident.society,
      listingType: req.body.listingType,
      amount: req.body.amount,
      showContact: req.body.showContact,
      status: PropertyListingStatus.ACTIVE,
    });
    const populated = await populateListing(
      PropertyListing.findById(listing._id),
    );
    if (!populated)
      return res
        .status(500)
        .json({
          success: false,
          message: "Listing was created but could not be loaded",
        });
    return res.status(201).json({
      success: true,
      message: "Your flat is now listed",
      listing: contactSafeListings([populated.toObject()], userId)[0],
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res
        .status(409)
        .json({
          success: false,
          message: "This flat already has an active listing",
        });
    }
    console.error("Create property listing error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getSocietyPropertyListings = async (
  req: Request,
  res: Response,
) => {
  try {
    const parsed = propertyListingFeedQueryValidation.safeParse(req.query);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid listing filters",
          errors: parsed.error.flatten(),
        });
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });
    const resident = await getResident(userId);
    if (!resident)
      return res
        .status(404)
        .json({ success: false, message: "Resident account not found" });
    if (!resident.society)
      return res
        .status(400)
        .json({
          success: false,
          message: "No society assigned to this resident",
        });

    const { page, limit, listingType, minAmount, maxAmount } = parsed.data;
    const query: Record<string, any> = {
      society: resident.society,
      status: PropertyListingStatus.ACTIVE,
      ...(listingType ? { listingType } : {}),
    };
    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {
        ...(minAmount !== undefined ? { $gte: minAmount } : {}),
        ...(maxAmount !== undefined ? { $lte: maxAmount } : {}),
      };
    }
    const [documents, total] = await Promise.all([
      populateListing(PropertyListing.find(query))
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PropertyListing.countDocuments(query),
    ]);
    const listings = contactSafeListings(
      documents.map((listing: any) => listing.toObject()),
      userId,
    );
    return res.status(200).json({
      success: true,
      message: "Society listings fetched successfully",
      listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get society property listings error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getMyPropertyListings = async (req: Request, res: Response) => {
  try {
    const parsed = myPropertyListingsQueryValidation.safeParse(req.query);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid listing filters",
          errors: parsed.error.flatten(),
        });
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });
    const resident = await getResident(userId);
    if (!resident)
      return res
        .status(404)
        .json({ success: false, message: "Resident account not found" });
    if (!resident.society)
      return res
        .status(400)
        .json({
          success: false,
          message: "No society assigned to this resident",
        });
    const { page, limit, status } = parsed.data;
    const query = {
      owner: userId,
      society: resident.society,
      ...(status ? { status } : {}),
    };
    const [documents, total] = await Promise.all([
      populateListing(PropertyListing.find(query))
        .sort({ updatedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PropertyListing.countDocuments(query),
    ]);
    const listings = contactSafeListings(
      documents.map((listing: any) => listing.toObject()),
      userId,
    );
    return res.status(200).json({
      success: true,
      message: "Your listings fetched successfully",
      listings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get my property listings error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const updatePropertyListing = async (req: Request, res: Response) => {
  try {
    const listingId = getListingId(req, res);
    if (!listingId) return;
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });
    const resident = await getResident(userId);
    if (!resident?.society)
      return res
        .status(404)
        .json({ success: false, message: "Resident society not found" });
    const update = req.body;
    const listing = await PropertyListing.findOneAndUpdate(
      {
        _id: listingId,
        owner: userId,
        society: resident.society,
        status: PropertyListingStatus.ACTIVE,
      },
      { $set: update },
      { new: true, runValidators: true },
    );
    if (!listing)
      return res
        .status(404)
        .json({ success: false, message: "Active listing not found" });
    const populated = await populateListing(
      PropertyListing.findById(listing._id),
    );
    if (!populated)
      return res
        .status(500)
        .json({
          success: false,
          message: "Listing was updated but could not be loaded",
        });
    return res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      listing: contactSafeListings([populated.toObject()], userId)[0],
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res
        .status(409)
        .json({
          success: false,
          message: "This flat already has an active listing",
        });
    }
    console.error("Update property listing error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const closePropertyListing = async (req: Request, res: Response) => {
  try {
    const listingId = getListingId(req, res);
    if (!listingId) return;
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });
    const resident = await getResident(userId);
    if (!resident?.society)
      return res
        .status(404)
        .json({ success: false, message: "Resident society not found" });
    const listing = await PropertyListing.findOneAndUpdate(
      {
        _id: listingId,
        owner: userId,
        society: resident.society,
        status: PropertyListingStatus.ACTIVE,
      },
      { $set: { status: PropertyListingStatus.CLOSED, closedAt: new Date() } },
      { new: true },
    );
    if (!listing)
      return res
        .status(404)
        .json({ success: false, message: "Active listing not found" });
    return res
      .status(200)
      .json({ success: true, message: "Listing closed successfully", listing });
  } catch (error) {
    console.error("Close property listing error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
