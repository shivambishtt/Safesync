import { JwtPayload } from "jsonwebtoken";
import { Role } from "../models/user.models";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        id: string;
        role: Role;
      };
    }
  }
}

export {};