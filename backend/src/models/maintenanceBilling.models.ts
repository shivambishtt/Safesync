import mongoose, { Document } from "mongoose";

export enum MaintenanceFrequency {
  MONTHLY = "MONTHLY",
  HALF_YEARLY = "HALF_YEARLY",
  ANNUALLY = "ANNUALLY",
}

export enum MaintenanceBillStatus {
  PENDING = "PENDING",
  PAID = "PAID",
}

export enum MaintenancePaymentMethod {
  CASH = "CASH",
  UPI = "UPI",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHEQUE = "CHEQUE",
  OTHER = "OTHER",
}

export interface IMaintenancePlan extends Document {
  society: mongoose.Types.ObjectId;
  amount: number;
  frequency: MaintenanceFrequency;
  nextPeriodStart: Date;
}

export interface IMaintenanceBill extends Document {
  society: mongoose.Types.ObjectId;
  flat: mongoose.Types.ObjectId;
  resident: mongoose.Types.ObjectId;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  status: MaintenanceBillStatus;
  paidAt: Date | null;
  paymentMethod: MaintenancePaymentMethod | null;
  paymentReference: string | null;
  paymentNotes: string | null;
  recordedBy: mongoose.Types.ObjectId | null;
}

const maintenancePlanSchema = new mongoose.Schema<IMaintenancePlan>(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      unique: true,
    },
    amount: { type: Number, required: true, min: 1 },
    frequency: {
      type: String,
      enum: Object.values(MaintenanceFrequency),
      required: true,
    },
    nextPeriodStart: { type: Date, required: true },
  },
  { timestamps: true },
);

const maintenanceBillSchema = new mongoose.Schema<IMaintenanceBill>(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    flat: { type: mongoose.Schema.Types.ObjectId, ref: "Flat", required: true },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(MaintenanceBillStatus),
      default: MaintenanceBillStatus.PENDING,
    },
    paidAt: { type: Date, default: null },
    paymentMethod: {
      type: String,
      enum: Object.values(MaintenancePaymentMethod),
      default: null,
    },
    paymentReference: { type: String, trim: true, default: null },
    paymentNotes: { type: String, trim: true, default: null },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

maintenanceBillSchema.index({ flat: 1, periodStart: 1 }, { unique: true });
maintenanceBillSchema.index({ society: 1, status: 1, dueDate: 1 });
maintenanceBillSchema.index({ resident: 1, periodStart: -1 });

export const MaintenancePlan = mongoose.model<IMaintenancePlan>(
  "MaintenancePlan",
  maintenancePlanSchema,
);
export const MaintenanceBill = mongoose.model<IMaintenanceBill>(
  "MaintenanceBill",
  maintenanceBillSchema,
);
