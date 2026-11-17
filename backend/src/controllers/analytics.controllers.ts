import { Request, Response } from "express";
import { getSocietyAnalytics } from "../services/analytics.service";
import { generateAiNarrative } from "../services/aiSummary.service";
import { getDataDerivedNarrative } from "../services/monthlyReport.service";
import {
  analyticsQueryValidation,
  monthlyReportValidation,
} from "../validations/analytics.validations";

function validatedMonthYear(input: unknown) {
  return analyticsQueryValidation.safeParse(input);
}

export const getMonthlyAnalytics = async (req: Request, res: Response) => {
  const parsed = validatedMonthYear(req.query);
  if (!parsed.success)
    return res
      .status(400)
      .json({
        success: false,
        message: "Invalid reporting month or year",
        errors: parsed.error.flatten(),
      });
  const secretaryId = req.user?.id;
  if (!secretaryId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized request" });

  try {
    const analytics = await getSocietyAnalytics(
      secretaryId,
      parsed.data.month,
      parsed.data.year,
    );
    return res.status(200).json({
      success: true,
      analytics,
      narrative: getDataDerivedNarrative(analytics),
      aiStatus: "NOT_REQUESTED",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SOCIETY_NOT_FOUND") {
      return res
        .status(403)
        .json({
          success: false,
          message: "No society is assigned to this secretary account",
        });
    }
    console.error("Get society analytics error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not load society analytics" });
  }
};

export const generateMonthlyReport = async (req: Request, res: Response) => {
  const parsed = monthlyReportValidation.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({
        success: false,
        message: "Invalid reporting month or year",
        errors: parsed.error.flatten(),
      });
  const secretaryId = req.user?.id;
  if (!secretaryId)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized request" });

  try {
    const analytics = await getSocietyAnalytics(
      secretaryId,
      parsed.data.month,
      parsed.data.year,
    );
    const fallback = getDataDerivedNarrative(analytics);
    try {
      const aiNarrative = await generateAiNarrative(analytics);
      return res.status(200).json({
        success: true,
        analytics,
        narrative: aiNarrative ?? fallback,
        aiStatus: aiNarrative ? "AVAILABLE" : "NOT_CONFIGURED",
      });
    } catch (error) {
      console.error(
        "OpenAI monthly narrative unavailable:",
        error instanceof Error ? error.message : "Unknown OpenAI error",
      );
      return res
        .status(200)
        .json({
          success: true,
          analytics,
          narrative: fallback,
          aiStatus: "UNAVAILABLE",
        });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "SOCIETY_NOT_FOUND") {
      return res
        .status(403)
        .json({
          success: false,
          message: "No society is assigned to this secretary account",
        });
    }
    console.error("Generate monthly analytics report error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Could not generate the monthly report",
      });
  }
};
