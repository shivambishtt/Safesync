import { Router } from "express";
import { register } from "../controllers/auth.controllers";
import { login } from "../controllers/auth.controllers";

const router = Router();

router.post("/register", register);
router.post("/login", login);

export default router;
