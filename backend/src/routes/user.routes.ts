import { Router } from "express";
import {
  register,
  login,
  logout,
  refresh_token,
} from "../controllers/auth.controllers";
import { validate } from "../middlewares/validate";
import {
  registerValidation,
  loginValidation,
} from "../validations/user.validations";

const authRouter = Router();

authRouter.post("/register", validate(registerValidation), register);
authRouter.post("/login", validate(loginValidation), login);
authRouter.post("/logout", logout);
authRouter.post("/refresh-token", refresh_token);

export default authRouter;
