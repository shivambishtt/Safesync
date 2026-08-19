import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  SECRETARY = "SECRETARY",
  RESIDENT = "RESIDENT",
  SECURITY = "SECURITY",
  MAINTENANCE = "MAINTENANCE",
}

interface User extends Document {
  name: string;
  email: string;
  password: string;
  refreshToken: string;
  role: Role;
  phoneNumber: string;
  society?: mongoose.Types.ObjectId;
  flat?: mongoose.Types.ObjectId;
  isVerified: boolean;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new mongoose.Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    refreshToken: {
      type: String,
    },

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.RESIDENT,
    },

    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      default: null,
    },

    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordValid = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" } as SignOptions,
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" } as SignOptions,
  );
};

export const User = mongoose.model("User", userSchema);
