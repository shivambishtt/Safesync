import { Router } from "express";
import { register } from "../controllers/auth.controllers";
import { login } from "../controllers/auth.controllers";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);

export default authRouter;
