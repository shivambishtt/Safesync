import { z } from "zod";
import type { SocietyAnalytics } from "./analytics.service";
import type { MonthlyNarrative } from "./monthlyReport.service";

const narrativeSchema = z
  .object({
    executiveSummary: z.string().trim().min(1).max(1200),
    observations: z.array(z.string().trim().min(1).max(400)).max(6),
    suggestedActions: z.array(z.string().trim().min(1).max(400)).max(6),
  })
  .strict();

function containsDigits(narrative: z.infer<typeof narrativeSchema>) {
  return [
    narrative.executiveSummary,
    ...narrative.observations,
    ...narrative.suggestedActions,
  ].some((text) => /\d/.test(text));
}

function aggregateOnlyInput(analytics: SocietyAnalytics) {
  return {
    societyName: analytics.society.name,
    reportingPeriod: analytics.period.label,
    overview: analytics.overview,
    complaints: {
      created: analytics.complaints.createdDuringPeriod,
      resolved: analytics.complaints.resolvedDuringPeriod,
      openAtPeriodEnd: analytics.complaints.openAtPeriodEnd,
      averageResolutionHours: analytics.complaints.averageResolutionHours,
      categoryCounts: analytics.complaints.categories,
    },
    billing: {
      billsGeneratedCount: analytics.billing.billsGeneratedDuringPeriod.count,
      paymentsRecordedCount:
        analytics.billing.paymentsRecordedDuringPeriod.count,
      paymentsRecordedAmount:
        analytics.billing.paymentsRecordedDuringPeriod.amount,
      currentOutstandingCount: analytics.billing.currentOutstanding.count,
      currentOutstandingAmount: analytics.billing.currentOutstanding.amount,
      collectionRate: analytics.billing.billsDueDuringPeriod.collectionRate,
    },
    visitors: {
      registered: analytics.visitors.registeredDuringPeriod,
      checkIns: analytics.visitors.checkInsDuringPeriod,
      purposes: analytics.visitors.purposes,
      statusCounts: analytics.visitors.currentStatusOfPeriodRegistrations,
    },
    security: {
      attendanceCheckIns: analytics.security.attendanceCheckInsDuringPeriod,
      completedShifts: analytics.security.completedShiftsDuringPeriod,
    },
  };
}

function responseText(payload: any) {
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string")
        return content.text;
    }
  }
  return "";
}

export async function generateAiNarrative(
  analytics: SocietyAnalytics,
): Promise<MonthlyNarrative | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 900,
      text: { format: { type: "json_object" } },
      instructions: [
        "Write a concise, cautious monthly society operations report using only the supplied precomputed aggregate metrics.",
        "Do not calculate, alter, or invent numbers. Do not include any digits in your prose; numeric values are shown separately by the application.",
        "Do not infer causes, absence, lateness, or comparisons with another period. Call out unavailable data when relevant.",
        "Do not include names, contact details, flat numbers, resident-level details, or payment references.",
        "Return JSON with exactly: executiveSummary (string), observations (array of strings), suggestedActions (array of strings).",
      ].join(" "),
      input: JSON.stringify(aggregateOnlyInput(analytics)),
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok)
    throw new Error(`OpenAI request failed with status ${response.status}`);
  const payload = await response.json();
  const parsedJson = JSON.parse(responseText(payload));
  const parsed = narrativeSchema.safeParse(parsedJson);
  if (!parsed.success || containsDigits(parsed.data))
    throw new Error("OpenAI narrative did not meet the required format");
  return { ...parsed.data, source: "OPENAI" };
}
