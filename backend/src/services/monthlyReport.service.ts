import type { SocietyAnalytics } from "./analytics.service";

export interface MonthlyNarrative {
  executiveSummary: string;
  observations: string[];
  suggestedActions: string[];
  source: "DATA_DERIVED" | "OPENAI";
}

export function getDataDerivedNarrative(
  analytics: SocietyAnalytics,
): MonthlyNarrative {
  const period = analytics.period.label;
  const observations: string[] = [];
  const actions: string[] = [];
  const topCategory = [...analytics.complaints.categories].sort(
    (a, b) => b.count - a.count,
  )[0];
  const topPurpose = [...analytics.visitors.purposes].sort(
    (a, b) => b.count - a.count,
  )[0];

  if (topCategory?.count)
    observations.push(
      `${String(topCategory.category).toLowerCase()} was the most reported complaint category in ${period}.`,
    );
  if (analytics.complaints.averageResolutionHours !== null) {
    observations.push(
      `Complaints resolved during ${period} took an average of ${analytics.complaints.averageResolutionHours.toFixed(1)} hours from registration to resolution.`,
    );
  } else {
    observations.push(
      `An average complaint resolution time is unavailable for ${period} because there are no reliable resolution samples.`,
    );
  }
  if (topPurpose?.count)
    observations.push(
      `${String(topPurpose.purpose).toLowerCase()} visits were the most common registrations in ${period}.`,
    );
  if (analytics.security.attendanceCheckInsDuringPeriod === 0)
    observations.push(
      `No guard attendance check-ins were recorded during ${period}; this does not establish absence.`,
    );

  if (analytics.complaints.openAtPeriodEnd > 0)
    actions.push(
      "Review the open complaint queue and confirm that each issue has an owner and a next step.",
    );
  if (analytics.billing.currentOutstanding.count > 0)
    actions.push(
      "Review current outstanding maintenance bills and follow up according to the society's payment process.",
    );
  const pendingVisitors =
    analytics.visitors.currentStatusOfPeriodRegistrations.find(
      (row) => row.status === "PENDING",
    )?.count ?? 0;
  if (pendingVisitors > 0)
    actions.push(
      "Check with residents about visitor requests that are still awaiting a decision.",
    );
  if (!actions.length)
    actions.push(
      "Continue recording complaint resolutions, maintenance payments, visitor events, and guard shifts so future reports remain complete.",
    );

  const executiveSummary = `${analytics.society.name} recorded ${analytics.complaints.createdDuringPeriod} complaint(s), ${analytics.visitors.registeredDuringPeriod} visitor registration(s), and ${analytics.billing.paymentsRecordedDuringPeriod.count} maintenance payment(s) in ${period}. ${analytics.complaints.openAtPeriodEnd} complaint(s) were open at period end.`;
  return {
    executiveSummary,
    observations,
    suggestedActions: actions,
    source: "DATA_DERIVED",
  };
}
