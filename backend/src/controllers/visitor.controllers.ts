import { Request, Response } from "express";
import { Visitor, VisitStatus } from "../models/visitor.models";
import { Role, User } from "../models/user.models";
import { Flat } from "../models/flat.models";
import mongoose from "mongoose";

export const registerVisitor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, email, phoneNumber, purpose, visitTo, resident } = req.body;

    if (!name || !phoneNumber || !purpose || !visitTo || !resident) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exists",
      });
    }

    if (user.role !== Role.SECURITY) {
      return res.status(403).json({
        success: false,
        message: "Only security personnel can register visitors",
      });
    }

    const flat = await Flat.findById(visitTo);

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    const checkResident = await User.findOne({
      _id: flat.owner,
      flat: visitTo,
      role: Role.RESIDENT,
    });

    if (!checkResident) {
      return res.status(404).json({
        success: false,
        message: "Resident does not belong to the selected flat",
      });
    }

    if (!user.society || flat.society.toString() !== user.society.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot register visitors for another society",
      });
    }

    const visitor = await Visitor.create({
      name,
      email:
        typeof email === "string" && email.trim() ? email.trim() : undefined,
      phoneNumber,
      purpose,
      visitTo,
      resident: checkResident._id,
    });

    return res.status(200).json({
      success: true,
      message: "Visitor entry created successfully",
      visitor,
    });
  } catch (error) {
    console.log("Error in register visitor controller", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getSecurityVisitorDestinations = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const user = await User.findById(userId).select("role society");
    if (!user || user.role !== Role.SECURITY) {
      return res.status(403).json({
        success: false,
        message: "Only security personnel can view visitor destinations",
      });
    }

    if (!user.society) {
      return res.status(400).json({
        success: false,
        message: "No society assigned to this security personnel",
      });
    }

    const occupiedFlats = await Flat.find({
      society: user.society,
      owner: { $ne: null },
    })
      .select("flatNumber block owner")
      .populate({
        path: "owner",
        select: "name email phoneNumber role flat",
      })
      .sort({ block: 1, flatNumber: 1 });

    const flats = occupiedFlats.flatMap((flat) => {
      const resident = flat.owner as unknown as {
        _id: { toString(): string };
        name: string;
        email?: string;
        phoneNumber?: string;
        role: Role;
        flat?: { toString(): string } | null;
      } | null;

      if (
        !resident ||
        resident.role !== Role.RESIDENT ||
        resident.flat?.toString() !== flat._id.toString()
      ) {
        return [];
      }

      return [
        {
          _id: flat._id,
          flatNumber: flat.flatNumber,
          block: flat.block,
          resident: {
            _id: resident._id,
            name: resident.name,
            email: resident.email,
            phoneNumber: resident.phoneNumber,
          },
        },
      ];
    });

    return res.status(200).json({
      success: true,
      message: "Visitor destinations fetched successfully",
      totalFlats: flats.length,
      flats,
    });
  } catch (error) {
    console.error("Get security visitor destinations error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const approveVisitorByResident = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { visitorId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (!mongoose.isValidObjectId(visitorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visitor ID",
      });
    }

    const user = await User.findById(userId).select("role flat");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.RESIDENT) {
      return res.status(403).json({
        success: false,
        message: "Only the resident being visited can approve this request",
      });
    }

    if (!user.flat)
      return res
        .status(400)
        .json({ success: false, message: "No flat assigned to this resident" });

    const visitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
        visitTo: user.flat,
        resident: userId,
        $or: [
          { visitStatus: VisitStatus.PENDING },
          { visitStatus: VisitStatus.APPROVED, allowedBy: { $ne: userId } },
        ],
      },
      {
        $set: {
          allowedBy: userId,
          visitStatus: VisitStatus.APPROVED,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Pending visitor request not found for your flat",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor request approved by resident",
      visitor,
    });
  } catch (error) {
    console.error("Resident visitor approval error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const checkInVisitor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { visitorId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (!mongoose.isValidObjectId(visitorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visitor ID",
      });
    }

    const user = await User.findById(userId).select("role society");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.SECURITY) {
      return res.status(403).json({
        success: false,
        message: "Only security personnel can check in visitors",
      });
    }

    if (!user.society) {
      return res.status(400).json({
        success: false,
        message: "No society assigned to this security personnel",
      });
    }

    const flatIds = await Flat.find({
      society: user.society,
    }).distinct("_id");

    const approvedVisitor = await Visitor.findOne({
      _id: visitorId,
      visitTo: { $in: flatIds },
      visitStatus: VisitStatus.APPROVED,
    }).select("visitTo resident allowedBy");

    if (!approvedVisitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found or not approved for entry",
      });
    }
    if (
      !approvedVisitor.allowedBy ||
      approvedVisitor.allowedBy.toString() !==
        approvedVisitor.resident.toString()
    ) {
      return res.status(409).json({
        success: false,
        message: "Resident approval is required before check-in",
      });
    }

    const [residentStillAssigned, flatStillBelongsToSecuritySociety] =
      await Promise.all([
        User.exists({
          _id: approvedVisitor.resident,
          role: Role.RESIDENT,
          flat: approvedVisitor.visitTo,
        }),
        Flat.exists({
          _id: approvedVisitor.visitTo,
          society: user.society,
          owner: approvedVisitor.resident,
        }),
      ]);
    if (!residentStillAssigned || !flatStillBelongsToSecuritySociety) {
      return res.status(409).json({
        success: false,
        message: "Resident approval could not be verified for this flat",
      });
    }

    const visitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
        visitTo: approvedVisitor.visitTo,
        resident: approvedVisitor.resident,
        allowedBy: approvedVisitor.resident,
        visitStatus: VisitStatus.APPROVED,
      },
      {
        $set: {
          visitStatus: VisitStatus.CHECKED_IN,
          checkInTime: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found or not approved for entry",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor checked in successfully",
      visitor,
    });
  } catch (error) {
    console.error("Check-in visitor error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const checkOutVisitor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { visitorId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (!mongoose.isValidObjectId(visitorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visitor ID",
      });
    }

    const user = await User.findById(userId).select("role society");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.SECURITY) {
      return res.status(403).json({
        success: false,
        message: "Only security personnel can check out visitors",
      });
    }

    if (!user.society) {
      return res.status(400).json({
        success: false,
        message: "No society assigned to this security personnel",
      });
    }

    const flatIds = await Flat.find({
      society: user.society,
    }).distinct("_id");

    const visitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
        visitTo: { $in: flatIds },
        visitStatus: VisitStatus.CHECKED_IN,
      },
      {
        $set: {
          visitStatus: VisitStatus.CHECKED_OUT,
          checkoutTime: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found or not currently checked in",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor checked out successfully",
      visitor,
    });
  } catch (error) {
    console.error("Check-out visitor error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const rejectVisitorByResident = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { visitorId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (!mongoose.isValidObjectId(visitorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visitor ID",
      });
    }

    const user = await User.findById(userId).select("role flat");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.RESIDENT) {
      return res.status(403).json({
        success: false,
        message: "Only the resident being visited can reject this request",
      });
    }

    if (!user.flat) {
      return res.status(400).json({
        success: false,
        message: "No flat assigned to this resident",
      });
    }

    const visitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
        visitTo: user.flat,
        resident: userId,
        $or: [
          { visitStatus: VisitStatus.PENDING },
          { visitStatus: VisitStatus.APPROVED, allowedBy: { $ne: userId } },
        ],
      },
      {
        $set: {
          rejectedBy: userId,
          visitStatus: VisitStatus.REJECTED,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Pending visitor request not found for your flat",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor request rejected by resident",
      visitor,
    });
  } catch (error) {
    console.error("Resident visitor rejection error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getVisitorById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { visitorId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (!mongoose.isValidObjectId(visitorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visitor ID",
      });
    }

    const user = await User.findById(userId).select("role society");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.SECRETARY && user.role !== Role.SECURITY) {
      return res.status(403).json({
        success: false,
        message: "Only secretary and security can view visitor details",
      });
    }

    if (!user.society) {
      return res.status(400).json({
        success: false,
        message: "No society assigned to this user",
      });
    }

    const flatIds = await Flat.find({
      society: user.society,
    }).distinct("_id");

    const visitor = await Visitor.findOne({
      _id: visitorId,
      visitTo: { $in: flatIds },
    })
      .populate("visitTo", "flatNumber block floor")
      .populate("resident", "name email phoneNumber")
      .populate("allowedBy", "name");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor details fetched successfully",
      visitor,
    });
  } catch (error) {
    console.error("Get visitor by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getAllVisitors = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.SECRETARY && user.role !== Role.SECURITY) {
      return res.status(403).json({
        success: false,
        message: "Only secretary and security personnel can view all visitors",
      });
    }

    if (!user.society) {
      return res.status(400).json({
        success: false,
        message: "This user is not assigned to the society",
      });
    }

    const visitors = await Visitor.find({
      visitTo: {
        $in: await Flat.find({ society: user.society }).distinct("_id"),
      },
    })
      .populate("visitTo", "flatNumber block floor")
      .populate("resident", "name email phoneNumber")
      .populate("allowedBy", "name")
      .populate("rejectedBy", "name")
      .sort({ updatedAt: -1 });

    const visitorRecords = visitors.map((visitor) => {
      const record = visitor.toObject();
      const previousApprover = record.allowedBy as unknown as
        { _id?: mongoose.Types.ObjectId } | mongoose.Types.ObjectId | null;
      const previousApproverId =
        previousApprover &&
        typeof previousApprover === "object" &&
        "_id" in previousApprover
          ? previousApprover._id?.toString()
          : previousApprover?.toString();
      return {
        ...record,
        requiresResidentApproval:
          record.visitStatus === VisitStatus.PENDING ||
          (record.visitStatus === VisitStatus.APPROVED &&
            previousApproverId !== user._id.toString()),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Visitors fetched successfully",
      totalVisitors: visitorRecords.length,
      visitors: visitorRecords,
    });
  } catch (error) {
    console.error("Get all visitors error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getMyVisitors = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.RESIDENT) {
      return res.status(403).json({
        success: false,
        message: "Only residents can view their visitors",
      });
    }

    if (!user.flat) {
      return res.status(400).json({
        success: false,
        message: "This user does not have a flat assigned",
      });
    }

    const visitors = await Visitor.find({
      visitTo: user.flat,
      resident: user._id,
    })
      .populate("allowedBy", "name")
      .populate("rejectedBy", "name")
      .sort({ createdAt: -1 });

    if (!visitors || visitors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No visitors found for this resident",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitors fetched successfully",
      totalVisitors: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error("Get my visitors error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getPendingVisitors = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const societyId = req.user?.society;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.SECRETARY && user.role !== Role.SECURITY) {
      return res.status(403).json({
        success: false,
        message:
          "Only secretary and security personnel can view pending visitors",
      });
    }

    if (!user.society) {
      return res.status(400).json({
        success: false,
        message: "No society assigned to this user",
      });
    }

    const flatIds = await Flat.find({
      society: user.society,
    }).distinct("_id");

    const pendingVisitors = await Visitor.find({
      visitTo: { $in: flatIds },
      $or: [
        { visitStatus: VisitStatus.PENDING },
        {
          visitStatus: VisitStatus.APPROVED,
          $expr: { $ne: ["$allowedBy", "$resident"] },
        },
      ],
    })
      .populate("visitTo", "flatNumber")
      .populate("resident", "name email phoneNumber")
      .populate("allowedBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Pending visitors fetched successfully",
      totalVisitors: pendingVisitors.length,
      visitors: pendingVisitors,
    });
  } catch (error) {
    console.error("Get pending visitors error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getVisitorStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized request" });
    }

    const user = await User.findById(userId).select("role flat society");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let visitorFilter: Record<string, any>;

    if (user.role === Role.RESIDENT) {
      if (!user.flat) {
        return res.status(400).json({
          success: false,
          message: "No flat assigned to this resident",
        });
      }

      visitorFilter = {
        visitTo: new mongoose.Types.ObjectId(user.flat.toString()),
      };
    } else if (user.role === Role.SECRETARY || user.role === Role.SECURITY) {
      if (!user.society) {
        return res.status(400).json({
          success: false,
          message: "No society assigned to this user",
        });
      }

      const flatIds = await Flat.find({
        society: user.society,
      }).distinct("_id");

      visitorFilter = {
        visitTo: {
          $in: flatIds,
        },
      };
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view visitor statistics",
      });
    }

    const stats = await Visitor.aggregate([
      { $match: visitorFilter },
      { $group: { _id: "$visitStatus", count: { $sum: 1 } } },
    ]);

    const legacyApprovalsNeedingResidentDecision = await Visitor.countDocuments(
      {
        ...visitorFilter,
        visitStatus: VisitStatus.APPROVED,
        $expr: { $ne: ["$allowedBy", "$resident"] },
      },
    );

    const keyByStatus: Record<
      string,
      "pending" | "approved" | "rejected" | "checkedIn" | "checkedOut"
    > = {
      [VisitStatus.PENDING]: "pending",
      [VisitStatus.APPROVED]: "approved",
      [VisitStatus.REJECTED]: "rejected",
      [VisitStatus.CHECKED_IN]: "checkedIn",
      [VisitStatus.CHECKED_OUT]: "checkedOut",
    };

    const visitorStats = {
      totalVisitors: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      checkedIn: 0,
      checkedOut: 0,
    };

    for (const stat of stats) {
      const key = keyByStatus[stat._id];
      if (key) {
        visitorStats[key] = stat.count;
        visitorStats.totalVisitors += stat.count;
      }
    }
    visitorStats.pending += legacyApprovalsNeedingResidentDecision;
    visitorStats.approved = Math.max(
      0,
      visitorStats.approved - legacyApprovalsNeedingResidentDecision,
    );

    return res.status(200).json({
      success: true,
      message: "Visitor statistics fetched successfully",
      visitorStats,
    });
  } catch (error) {
    console.error("Get visitor stats error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const getVisitorHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    const user = await User.findById(userId).select("role society");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== Role.SECRETARY && user.role !== Role.SECURITY) {
      return res.status(403).json({
        success: false,
        message:
          "Only secretary and security personnel can access visitor history",
      });
    }

    if (!user.society) {
      if (user.role === Role.SECRETARY) {
        return res.status(400).json({
          success: false,
          message: "No society assigned to secretary",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "No society assigned to this security personnel",
        });
      }
    }

    const flatIds = await Flat.find({
      society: user.society,
    }).distinct("_id");

    const visitors = await Visitor.find({
      visitTo: { $in: flatIds },
    })
      .populate("visitTo", "flatNumber block")
      .populate("resident", "name email phoneNumber")
      .populate("allowedBy", "name")
      .populate("rejectedBy", "name")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Visitor history fetched successfully",
      totalVisitors: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error("Get visitor history error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
