import mongoose, { Document } from "mongoose";

export enum ComplaintStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}
export enum ComplaintCategory {
  ELECTRICAL = "ELECTRICAL",
  PLUMBING = "PLUMBING",
  SECURITY = "SECURITY",
  MAINTENANCE = "MAINTENANCE",
  CLEANING = "CLEANING",
  OTHER = "OTHER",
}

export enum ComplaintPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface IComplaint extends Document {
  title: string;
  description: string;
  flat: mongoose.Types.ObjectId;
  society: mongoose.Types.ObjectId;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  registeredBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId | null;
  resolvedBy: mongoose.Types.ObjectId | null;
  estimatedClosureTime: Date | null;
  resolvedAt: Date | null;
}

const complaintSchema = new mongoose.Schema<IComplaint>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    flat: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Flat",
    },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Society",
    },
    category: {
      type: String,
      enum: Object.values(ComplaintCategory),
      default: ComplaintCategory.OTHER,
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.PENDING,
    },
    priority: {
      type: String,
      enum: Object.values(ComplaintPriority),
      default: ComplaintPriority.MEDIUM,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "User",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "User",
    },
    estimatedClosureTime: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Complaint = mongoose.model("Complaint", complaintSchema);

complaintSchema.index({ society: 1, status: 1, createdAt: -1 });

complaintSchema.index({ assignedTo: 1, status: 1 });

complaintSchema.index({ registeredBy: 1, createdAt: -1 });

complaintSchema.index({ flat: 1, createdAt: -1 });
