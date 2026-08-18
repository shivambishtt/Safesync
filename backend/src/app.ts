import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import type { Application } from "express";
import { authRouter, userRouter } from "./routes/user.routes";

dotenv.config();

const app: Application = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth/users/", authRouter);
app.use("/api/users/", userRouter);

export default app;
