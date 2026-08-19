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
import { getPendingSecretaries } from "../controllers/admin.controllers";
import { authorize } from "../middlewares/authorize.middlewares";
import { Role } from "../models/user.models";

const authRouter = Router();
const userRouter = Router();
const societyRouter = Router();
const adminRouter = Router();

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

adminRouter.get(
  "/",
  verifyJWT,
  authorize(Role.SUPER_ADMIN),
  getPendingSecretaries,
);

export { authRouter, userRouter, societyRouter, adminRouter };
