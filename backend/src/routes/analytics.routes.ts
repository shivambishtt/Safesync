import { Router } from "express";
import {
  getMonthlyAnalytics,
  generateMonthlyReport,
} from "../controllers/analytics.controllers";
import { verifyJWT } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { Role } from "../models/user.models";
import { validate } from "../middlewares/validate";
import { monthlyReportValidation } from "../validations/analytics.validations";

const analyticsRouter = Router();

analyticsRouter.get(
  "/analytics/monthly",
  verifyJWT,
  authorize(Role.SECRETARY),
  getMonthlyAnalytics,
);
analyticsRouter.post(
  "/analytics/generate-report",
  verifyJWT,
  authorize(Role.SECRETARY),
  validate(monthlyReportValidation),
  generateMonthlyReport,
);

export default analyticsRouter;
