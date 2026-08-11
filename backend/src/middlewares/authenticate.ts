import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyAccessToken = (token: string) => {
  return token
    ? jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string)
    : null;
};

const verifyRefreshToken = (token: string) => {
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
        message: "Access token is required",
      });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || typeof decoded === "string") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid access token" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};
