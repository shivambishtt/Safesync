import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

export enum VisitStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CHECKED_IN = "CHECKED_IN",
  CHECKED_OUT = "CHECKED_OUT",
}

export enum VisitPurpose {
  GUEST = "GUEST",
  SERVICE = "SERVICE",
  DELIVERY = "DELIVERY",
  SALES = "SALES",
}

interface IVisitor extends Document {
  name: string;
  email?: string;
  phoneNumber: string;
  purpose: VisitPurpose;
  visitTo: mongoose.Types.ObjectId;
  visitBy: mongoose.Types.ObjectId;
  visitStatus: VisitStatus;
  checkInTime?: Date;
  checkoutTime?: Date;
}

const visitorSchema = new mongoose.Schema<IVisitor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    purpose: {
      type: String,
      enum: Object.values(VisitPurpose),
      required: true,
      trim: true,
    },

    visitTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
    },

    visitBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    visitStatus: {
      type: String,
      enum: Object.values(VisitStatus),
      default: VisitStatus.PENDING,
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    checkoutTime: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const Visitor = mongoose.model("Visitor", visitorSchema);
