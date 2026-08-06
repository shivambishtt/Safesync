import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

enum Role {
  SECRETARY = "SECRETARY",
  RESIDENT = "RESIDENT",
  SECURITY = "SECURITY",
  MAINTENANCE = "MAINTENANCE",
}

interface User extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  phoneNumber: string;
  society: mongoose.Schema.Types.ObjectId;
  flat: mongoose.Schema.Types.ObjectId;
  isVerified: boolean;
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

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },

    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: function (this: User) {
        return this.role === Role.RESIDENT;
      },
    },

    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: function (this: User) {
        return this.role === Role.RESIDENT;
      },
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

export const UserModel = mongoose.model("User", userSchema);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isValid = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" },
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" },
  );
};
