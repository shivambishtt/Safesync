import { Request, Response } from "express";
import { Visitor, VisitStatus } from "../models/visitor.models";
import { Role, User } from "../models/user.models";
import { Flat } from "../models/flat.models";
import mongoose from "mongoose";

export const registerVisitor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, phoneNumber, purpose, visitTo, resident } = req.body;

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

export const allowVisitorEntry = async (req: Request, res: Response) => {
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
        message: "Only security personnel can approve visitors",
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
        visitStatus: VisitStatus.PENDING,
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
        message: "Pending visitor not found in your society",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor entry allowed successfully",
      visitor,
    });
  } catch (error) {
    console.error("Allow visitor error:", error);

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

    const visitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
        visitTo: { $in: flatIds },
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

export const rejectVisitorEntry = async (req: Request, res: Response) => {
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
        message: "Only security personnel can reject visitors",
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
        visitStatus: VisitStatus.PENDING,
      },
      {
        $set: {
          allowedBy: userId,
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
        message: "Pending visitor not found in your society",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor entry rejected successfully",
      visitor,
    });
  } catch (error) {
    console.error("Reject visitor error:", error);

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
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Visitors fetched successfully",
      totalVisitors: visitors.length,
      visitors,
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
    }).sort({ createdAt: -1 });

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
      visitStatus: VisitStatus.PENDING,
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
      .populate("visitTo", "flatNumber")
      .populate("resident", "name")
      .sort({ createdAt: -1 });

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
