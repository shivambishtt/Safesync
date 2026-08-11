import mongoose, { Document } from "mongoose";

enum SocietyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

interface Society extends Document {
  societyName: string;
  registrationNumber?: string;
  email?: string;
  phoneNumber?: string;
  address: {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  totalFlats: number;
  status: SocietyStatus;
  createdAt: Date;
  updatedAt: Date;
}

const societySchema = new mongoose.Schema<Society>(
  {
    societyName: {
      type: String,
      required: true,
      trim: true,
    },

    registrationNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
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

    totalFlats: {
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

export const Society = mongoose.model<Society>(
  "Society",
  societySchema,
);