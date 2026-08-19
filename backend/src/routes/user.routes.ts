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
import { createSocietyValidation } from "../validations/society.validations";
import { getData } from "../controllers/user.controllers";
import { verifyJWT } from "../middlewares/authenticate";
import { createSociety } from "../controllers/society.controllers";

const authRouter = Router();
const userRouter = Router();
const societyRouter = Router();

authRouter.post("/register", validate(registerValidation), register);
authRouter.post("/login", validate(loginValidation), login);
authRouter.post("/logout", logout);
authRouter.post("/refresh-token", refresh_token);

userRouter.get("/get-data", verifyJWT, getData);

societyRouter.post(
  "/create-society",
  validate(createSocietyValidation),
  verifyJWT,
  createSociety,
);

export { authRouter, userRouter, societyRouter };
