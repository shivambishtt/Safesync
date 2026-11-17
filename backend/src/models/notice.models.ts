import mongoose, { Document } from "mongoose";

export enum NoticeCategory {
  GENERAL = "GENERAL",
  MAINTENANCE = "MAINTENANCE",
  EVENT = "EVENT",
  EMERGENCY = "EMERGENCY",
  PAYMENT = "PAYMENT",
  OTHER = "OTHER",
}

export enum NoticePriority {
  NORMAL = "NORMAL",
  IMPORTANT = "IMPORTANT",
  URGENT = "URGENT",
}

export enum NoticeStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export interface INotice extends Document {
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  society: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: NoticeStatus;
  isPinned: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
}

const noticeSchema = new mongoose.Schema<INotice>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    category: {
      type: String,
      enum: Object.values(NoticeCategory),
      default: NoticeCategory.GENERAL,
    },
    priority: {
      type: String,
      enum: Object.values(NoticePriority),
      default: NoticePriority.NORMAL,
    },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(NoticeStatus),
      default: NoticeStatus.DRAFT,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

noticeSchema.index({ society: 1, status: 1, publishedAt: -1 });
noticeSchema.index({ society: 1, isPinned: -1, publishedAt: -1 });

export const Notice = mongoose.model<INotice>("Notice", noticeSchema);
