import mongoose, { Document } from "mongoose";

enum FlatStatus {
  OCCUPIED = "OCCUPIED",
  VACANT = "VACANT",
  UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
  UNDER_CONSTRUCTION = "UNDER_CONSTRUCTION",
}

enum FlatType {
  ONE_BHK = "1BHK",
  TWO_BHK = "2BHK",
  THREE_BHK = "3BHK",
  FOUR_BHK = "4BHK",
}

interface Flat extends Document {
  flatNumber: string;
  block: string;
  floor: number;
  flatType: FlatType;
  area?: number;
  society: mongoose.Schema.Types.ObjectId;
  status: FlatStatus;
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

    status: {
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