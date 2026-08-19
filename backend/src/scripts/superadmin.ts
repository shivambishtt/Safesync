import mongoose from "mongoose";
import dotenv from "dotenv";
import { User, Role } from "../models/user.models";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);

    const existing = await User.findOne({ role: Role.SUPER_ADMIN });
    if (existing) {
      console.log("Superadmin already exists:", existing.email);
      process.exit(0);
    }

    const super_admin = await User.create({
      name: "Super Admin",
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      phoneNumber: process.env.SUPER_ADMIN_PHONE,
      role: Role.SUPER_ADMIN,
      isVerified: true,
    });

    console.log("Super admin created successfully", super_admin.name);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding superadmin:", error);
    process.exit(1);
  }
};

seedSuperAdmin();
