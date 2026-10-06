import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import type { Application } from "express";
import {
  adminRouter,
  authRouter,
  societyRouter,
  userRouter,
  flatRouter,
} from "./routes/user.routes";

dotenv.config();

const app: Application = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth/users/", authRouter);
app.use("/api/v1/", userRouter);
app.use("/api/v1/", societyRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/", flatRouter);

export default app;
