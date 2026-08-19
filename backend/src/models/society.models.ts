import mongoose, { Document, Schema } from "mongoose";

export enum SocietyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

interface Society extends Document {
  name: string;
  secretary: mongoose.Types.ObjectId;
  email?: string;
  address: {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  flats: number;
  status: SocietyStatus;
  createdAt: Date;
  updatedAt: Date;
}

const societySchema = new mongoose.Schema<Society>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    secretary: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    address: {
      addressLine: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },

    flats: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: Object.values(SocietyStatus),
      default: SocietyStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  },
);

export const Society = mongoose.model<Society>("Society", societySchema);
