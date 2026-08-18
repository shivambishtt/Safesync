import { Request, Response, NextFunction } from "express";
import { Role } from "../models/user.models";
import jwt from "jsonwebtoken";

export const verifyAccessToken = (token: string) => {
  return token
    ? jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string)
    : null;
};

export const verifyRefreshToken = (token: string) => {
  return token
    ? jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string)
    : null;
};

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please Log in",
      });
    }

    const decoded = verifyAccessToken(token) as {
      id: string;
      role: Role;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};
