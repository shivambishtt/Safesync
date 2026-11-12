import { Request, Response } from "express";
import { Visitor, VisitStatus } from "../models/visitor.models";
import { Role, User } from "../models/user.models";
import { Flat } from "../models/flat.models";

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
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: "Visitor Id is required",
      });
    }

    const visitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
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
        message: "No visitor found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitor entry allowed successfully",
      visitor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const checkInVisitor = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { visitorId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: "Visitor ID is required",
      });
    }

    const user = await User.findById(userId);

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

    const visitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
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
    const { visitorId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: "Visitor ID is required",
      });
    }

    const user = await User.findById(userId);

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

    const visitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
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
    const { visitorId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request",
      });
    }

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: "Visitor ID is required",
      });
    }

    const user = await User.findById(userId);

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

    const visitor = await Visitor.findOneAndUpdate(
      {
        _id: visitorId,
        visitStatus: VisitStatus.PENDING,
      },
      {
        $set: {
          visitStatus: VisitStatus.REJECTED,
          allowedBy: userId,
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
        message: "Visitor not found or already processed",
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
