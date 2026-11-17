import { Request, Response } from "express";
import mongoose from "mongoose";
import { Flat } from "../models/flat.models";
import {
  MaintenanceBill,
  MaintenanceBillStatus,
  MaintenanceFrequency,
  MaintenancePaymentMethod,
  MaintenancePlan,
} from "../models/maintenanceBilling.models";
import { Society } from "../models/society.models";
import { Role, User } from "../models/user.models";
import {
  maintenanceBillsQueryValidation,
  maintenancePlanValidation,
  recordMaintenancePaymentValidation,
} from "../validations/maintenanceBilling.validations";

const monthsPerPeriod: Record<MaintenanceFrequency, number> = {
  [MaintenanceFrequency.MONTHLY]: 1,
  [MaintenanceFrequency.HALF_YEARLY]: 6,
  [MaintenanceFrequency.ANNUALLY]: 12,
};

function addMonths(date: Date, months: number) {
  const day = date.getUTCDate();
  const targetMonth = date.getUTCMonth() + months;
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), targetMonth + 1, 0),
  ).getUTCDate();
  return new Date(
    Date.UTC(date.getUTCFullYear(), targetMonth, Math.min(day, lastDay)),
  );
}

async function secretarySociety(userId?: string) {
  if (!userId) return null;
  return Society.findOne({ secretary: userId }).select("_id name");
}

function populateBill(query: any) {
  return query
    .populate("flat", "flatNumber block floor flatType")
    .populate("resident", "name email phoneNumber")
    .populate("recordedBy", "name");
}

export const getMaintenanceBillingPlan = async (
  req: Request,
  res: Response,
) => {
  try {
    const society = await secretarySociety(req.user?.id);
    if (!society)
      return res
        .status(403)
        .json({ success: false, message: "Society not found or unauthorized" });
    const plan = await MaintenancePlan.findOne({ society: society._id });
    return res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error("Get maintenance billing plan error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const saveMaintenanceBillingPlan = async (
  req: Request,
  res: Response,
) => {
  try {
    const parsed = maintenancePlanValidation.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid billing plan",
          errors: parsed.error.flatten(),
        });
    const society = await secretarySociety(req.user?.id);
    if (!society)
      return res
        .status(403)
        .json({ success: false, message: "Society not found or unauthorized" });

    const existingPlan = await MaintenancePlan.findOne({
      society: society._id,
    });
    if (existingPlan && existingPlan.nextPeriodStart.getTime() <= Date.now()) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "Generate the upcoming bills before changing the billing plan",
        });
    }
    const plan = await MaintenancePlan.findOneAndUpdate(
      { society: society._id },
      { $set: parsed.data, $setOnInsert: { society: society._id } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    return res
      .status(200)
      .json({ success: true, message: "Maintenance billing plan saved", plan });
  } catch (error) {
    console.error("Save maintenance billing plan error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const generateMaintenanceBills = async (req: Request, res: Response) => {
  try {
    const society = await secretarySociety(req.user?.id);
    if (!society)
      return res
        .status(403)
        .json({ success: false, message: "Society not found or unauthorized" });
    const plan = await MaintenancePlan.findOne({ society: society._id });
    if (!plan)
      return res
        .status(409)
        .json({
          success: false,
          message: "Set up the maintenance billing plan first",
        });

    const periodStart = plan.nextPeriodStart;
    if (periodStart.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) {
      return res
        .status(409)
        .json({
          success: false,
          message: "The next billing period is too far in the future",
        });
    }
    const periodEndExclusive = addMonths(
      periodStart,
      monthsPerPeriod[plan.frequency],
    );
    const periodEnd = new Date(
      Date.UTC(
        periodEndExclusive.getUTCFullYear(),
        periodEndExclusive.getUTCMonth(),
        periodEndExclusive.getUTCDate() - 1,
      ),
    );
    const residents = await User.find({
      role: Role.RESIDENT,
      society: society._id,
    }).select("_id");
    const residentIds = residents.map((resident) => resident._id);
    const flats = await Flat.find({
      society: society._id,
      owner: { $in: residentIds },
    }).select("_id owner");
    if (flats.length === 0)
      return res
        .status(409)
        .json({
          success: false,
          message: "There are no resident-owned flats to bill",
        });

    const residentById = new Map(
      residents.map((resident) => [resident._id.toString(), resident._id]),
    );
    const operations = flats.map((flat) => ({
      updateOne: {
        filter: { flat: flat._id, periodStart },
        update: {
          $setOnInsert: {
            society: society._id,
            flat: flat._id,
            resident: residentById.get(flat.owner!.toString()),
            amount: plan.amount,
            periodStart,
            periodEnd,
            dueDate: periodStart,
            status: MaintenanceBillStatus.PENDING,
          },
        },
        upsert: true,
      },
    }));
    const result = await MaintenanceBill.bulkWrite(operations, {
      ordered: false,
    });

    const nextPeriodStart = addMonths(
      periodStart,
      monthsPerPeriod[plan.frequency],
    );
    await MaintenancePlan.updateOne(
      { _id: plan._id, nextPeriodStart: periodStart },
      { $set: { nextPeriodStart } },
    );

    return res.status(201).json({
      success: true,
      message: "Maintenance bills generated",
      totalFlats: flats.length,
      billsCreated: result.upsertedCount,
      alreadyGenerated: flats.length - result.upsertedCount,
      period: { start: periodStart, end: periodEnd },
      nextPeriodStart,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res
        .status(409)
        .json({
          success: false,
          message: "Bills for this billing period are already being generated",
        });
    }
    console.error("Generate maintenance bills error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getSocietyMaintenanceBills = async (
  req: Request,
  res: Response,
) => {
  try {
    const parsed = maintenanceBillsQueryValidation.safeParse(req.query);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid bill filters",
          errors: parsed.error.flatten(),
        });
    const society = await secretarySociety(req.user?.id);
    if (!society)
      return res
        .status(403)
        .json({ success: false, message: "Society not found or unauthorized" });
    const { page, limit, status } = parsed.data;
    const query = { society: society._id, ...(status ? { status } : {}) };
    const [bills, total] = await Promise.all([
      populateBill(MaintenanceBill.find(query))
        .sort({ dueDate: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      MaintenanceBill.countDocuments(query),
    ]);
    const summary = await MaintenanceBill.aggregate([
      { $match: { society: society._id } },
      {
        $group: {
          _id: null,
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$status", MaintenanceBillStatus.PENDING] },
                "$amount",
                0,
              ],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [
                { $eq: ["$status", MaintenanceBillStatus.PENDING] },
                1,
                0,
              ],
            },
          },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$status", MaintenanceBillStatus.PAID] },
                "$amount",
                0,
              ],
            },
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ["$status", MaintenanceBillStatus.PAID] }, 1, 0],
            },
          },
        },
      },
    ]);
    return res.status(200).json({
      success: true,
      bills,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        pendingCount: summary[0]?.pendingCount ?? 0,
        pendingAmount: summary[0]?.pendingAmount ?? 0,
        paidCount: summary[0]?.paidCount ?? 0,
        paidAmount: summary[0]?.paidAmount ?? 0,
      },
    });
  } catch (error) {
    console.error("Get society maintenance bills error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const recordMaintenancePayment = async (req: Request, res: Response) => {
  try {
    const billId = req.params.billId;
    if (
      typeof billId !== "string" ||
      !mongoose.Types.ObjectId.isValid(billId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid bill ID" });
    }
    const parsed = recordMaintenancePaymentValidation.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid payment details",
          errors: parsed.error.flatten(),
        });
    const society = await secretarySociety(req.user?.id);
    if (!society)
      return res
        .status(403)
        .json({ success: false, message: "Society not found or unauthorized" });
    const bill = await MaintenanceBill.findOneAndUpdate(
      {
        _id: billId,
        society: society._id,
        status: MaintenanceBillStatus.PENDING,
      },
      {
        $set: {
          status: MaintenanceBillStatus.PAID,
          paidAt: new Date(),
          paymentMethod: parsed.data.paymentMethod,
          paymentReference: parsed.data.paymentReference || null,
          paymentNotes: parsed.data.paymentNotes || null,
          recordedBy: req.user?.id,
        },
      },
      { new: true, runValidators: true },
    );
    if (!bill)
      return res
        .status(404)
        .json({
          success: false,
          message: "Pending maintenance bill not found in your society",
        });
    return res
      .status(200)
      .json({ success: true, message: "Payment recorded", bill });
  } catch (error) {
    console.error("Record maintenance payment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getMyMaintenanceBills = async (req: Request, res: Response) => {
  try {
    const parsed = maintenanceBillsQueryValidation.safeParse(req.query);
    if (!parsed.success)
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid bill filters",
          errors: parsed.error.flatten(),
        });
    const resident = await User.findOne({
      _id: req.user?.id,
      role: Role.RESIDENT,
    }).select("flat society");
    if (!resident)
      return res
        .status(404)
        .json({ success: false, message: "Resident account not found" });
    if (!resident.flat || !resident.society)
      return res
        .status(400)
        .json({ success: false, message: "No flat assigned to this resident" });
    const flat = await Flat.exists({
      _id: resident.flat,
      owner: resident._id,
      society: resident.society,
    });
    if (!flat)
      return res
        .status(403)
        .json({
          success: false,
          message: "This resident does not own the assigned flat",
        });

    const { page, limit, status } = parsed.data;
    const query = {
      resident: resident._id,
      flat: resident.flat,
      society: resident.society,
      ...(status ? { status } : {}),
    };
    const [bills, total] = await Promise.all([
      populateBill(MaintenanceBill.find(query))
        .sort({ periodStart: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      MaintenanceBill.countDocuments(query),
    ]);
    const totals = await MaintenanceBill.aggregate([
      {
        $match: {
          resident: resident._id,
          flat: resident.flat,
          society: resident.society,
        },
      },
      {
        $group: {
          _id: null,
          pendingCount: {
            $sum: {
              $cond: [
                { $eq: ["$status", MaintenanceBillStatus.PENDING] },
                1,
                0,
              ],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$status", MaintenanceBillStatus.PENDING] },
                "$amount",
                0,
              ],
            },
          },
          paidCount: {
            $sum: {
              $cond: [{ $eq: ["$status", MaintenanceBillStatus.PAID] }, 1, 0],
            },
          },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$status", MaintenanceBillStatus.PAID] },
                "$amount",
                0,
              ],
            },
          },
        },
      },
    ]);
    return res.status(200).json({
      success: true,
      bills,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        pendingCount: totals[0]?.pendingCount ?? 0,
        pendingAmount: totals[0]?.pendingAmount ?? 0,
        paidCount: totals[0]?.paidCount ?? 0,
        paidAmount: totals[0]?.paidAmount ?? 0,
      },
    });
  } catch (error) {
    console.error("Get resident maintenance bills error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
