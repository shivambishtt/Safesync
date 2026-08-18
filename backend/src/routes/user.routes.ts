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
import { getData } from "../controllers/user.controllers";
import { verifyJWT } from "../middlewares/authenticate";

const authRouter = Router();
const userRouter = Router();

authRouter.post("/register", validate(registerValidation), register);
authRouter.post("/login", validate(loginValidation), login);
authRouter.post("/logout", logout);
authRouter.post("/refresh-token", refresh_token);

userRouter.get("/get-data", verifyJWT, getData);

export { authRouter, userRouter };
