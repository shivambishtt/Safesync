import mongoose, { Document } from "mongoose";

export interface ISecurityAttendance extends Document {
  guard: mongoose.Types.ObjectId;
  society: mongoose.Types.ObjectId;
  checkedInAt: Date;
  checkedOutAt: Date | null;
}

const securityAttendanceSchema = new mongoose.Schema<ISecurityAttendance>(
  {
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },
    checkedInAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkedOutAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

securityAttendanceSchema.index(
  { guard: 1 },
  { unique: true, partialFilterExpression: { checkedOutAt: null } },
);
securityAttendanceSchema.index({ society: 1, checkedInAt: -1 });

export const SecurityAttendance = mongoose.model<ISecurityAttendance>(
  "SecurityAttendance",
  securityAttendanceSchema,
);
