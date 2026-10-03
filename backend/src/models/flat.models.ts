import mongoose, { Document } from "mongoose";

export enum FlatStatus {
  OCCUPIED = "OCCUPIED",
  VACANT = "VACANT",
  UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
  UNDER_CONSTRUCTION = "UNDER_CONSTRUCTION",
}

export enum FlatType {
  ONE_BHK = "1BHK",
  TWO_BHK = "2BHK",
  THREE_BHK = "3BHK",
  FOUR_BHK = "4BHK",
}

interface Flat extends Document {
  flatNumber: string;
  owner: mongoose.Types.ObjectId | null;
  resident: mongoose.Types.ObjectId | null;
  block: string;
  floor: number;
  flatType: FlatType;
  area?: number;
  society: mongoose.Types.ObjectId | string;
  flatStatus: FlatStatus;
  createdAt: Date;
  updatedAt: Date;
}

const flatSchema = new mongoose.Schema<Flat>(
  {
    flatNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    block: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    floor: {
      type: Number,
      required: true,
      min: 0,
    },

    flatType: {
      type: String,
      enum: Object.values(FlatType),
      required: true,
    },

    area: {
      type: Number,
      min: 0,
    },

    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
      index: true,
    },

    flatStatus: {
      type: String,
      enum: Object.values(FlatStatus),
      default: FlatStatus.VACANT,
    },
  },
  {
    timestamps: true,
  },
);

flatSchema.index(
  {
    society: 1,
    block: 1,
    flatNumber: 1,
  },
  {
    unique: true,
  },
);

export const Flat = mongoose.model<Flat>("Flat", flatSchema);
