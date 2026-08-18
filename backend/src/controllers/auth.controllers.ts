import { Request, Response } from "express";
import { User } from "../models/user.models";
import { verifyRefreshToken } from "../middlewares/authenticate";
import bcrypt from "bcrypt";
import { hashToken } from "../utils/token.utils";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber, role, society, flat } =
      req.body || {};

    if (!name || !email || !password || !phoneNumber || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide all the required fields",
      });
    }

    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phoneNumber }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists in the database",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      role,
      society,
      flat,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        society: user.society,
        flat: user.flat,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid password. Please try again",
      });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = hashToken(refreshToken);
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        society: user.society,
        flat: user.flat,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error occurred while logging in:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      const decoded = verifyRefreshToken(token) as {
        id: string;
      } | null;
      if (decoded) {
        await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      }
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "User Logged out successfully",
    });
  } catch (error) {
    console.error("Error occured while loggin out", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const refresh_token = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh Token is required" });
    }

    const decoded = verifyRefreshToken(token) as {
      id: string;
      role: string;
    };

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.refreshToken !== hashToken(token)) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid or has been revoked",
      });
    }

    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = hashToken(newRefreshToken);
    await user.save();

    res.cookie("accessToken", accessToken, {
      sameSite: "strict",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      sameSite: "strict",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};
