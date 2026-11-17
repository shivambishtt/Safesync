const API_BASE_URL = "http://localhost:3000/api/v1/analytics";

export interface AnalyticsEntry {
  [key: string]: string | number;
  count: number;
}

export interface WeeklyMetric {
  week: string;
  created?: number;
  resolved?: number;
  count?: number;
  amount?: number;
}

export interface SocietyAnalytics {
  society: { name: string };
  period: {
    month: number;
    year: number;
    label: string;
    timezone: string;
    start: string;
    endExclusive: string;
    generatedAt: string;
  };
  overview: {
    totalResidents: number;
    totalFlats: number;
    occupiedFlats: number;
    vacantFlats: number;
    otherFlatStatuses: AnalyticsEntry[];
    visitorsRegistered: number;
    activeSecurityGuards: number;
  };
  complaints: {
    createdDuringPeriod: number;
    resolvedDuringPeriod: number;
    openAtPeriodEnd: number;
    createdCohortResolvedByPeriodEnd: number;
    createdCohortUnresolvedAtPeriodEnd: number;
    createdCohortResolvedTimestampUnavailable: number;
    averageResolutionHours: number | null;
    weeklyActivity: WeeklyMetric[];
    categories: AnalyticsEntry[];
    currentStaffWorkload: Array<{ name: string; count: number }>;
  };
  billing: {
    billsGeneratedDuringPeriod: { count: number; amount: number };
    paymentsRecordedDuringPeriod: { count: number; amount: number };
    currentOutstanding: { count: number; amount: number };
    billsDueDuringPeriod: {
      count: number;
      amount: number;
      paidByPeriodEndCount: number;
      paidByPeriodEndAmount: number;
      pendingAtPeriodEndCount: number;
      pendingAtPeriodEndAmount: number;
      paymentDateUnavailableCount: number;
      paymentDateUnavailableAmount: number;
      collectionRate: number | null;
      collectionRateDenominatorAmount: number;
    };
    weeklyPayments: WeeklyMetric[];
    nextBillingDate: string | null;
    frequency: string | null;
    partialPaymentsSupported: boolean;
  };
  visitors: {
    registeredDuringPeriod: number;
    checkInsDuringPeriod: number;
    currentStatusOfPeriodRegistrations: AnalyticsEntry[];
    purposes: AnalyticsEntry[];
    weeklyRegistrations: WeeklyMetric[];
    peakRegistrationWeek: string | null;
  };
  security: {
    attendanceCheckInsDuringPeriod: number;
    completedShiftsDuringPeriod: number;
    averageCompletedShiftHours: number | null;
    byGuard: Array<{ name: string; checkIns: number; completedShifts: number }>;
    weeklyCheckIns: WeeklyMetric[];
    absenceAndLateMetricsAvailable: boolean;
  };
  dataNotes: string[];
}

export interface MonthlyNarrative {
  executiveSummary: string;
  observations: string[];
  suggestedActions: string[];
  source: "DATA_DERIVED" | "OPENAI";
}

export interface AnalyticsResponse {
  success: boolean;
  message?: string;
  analytics: SocietyAnalytics;
  narrative: MonthlyNarrative;
  aiStatus: "NOT_REQUESTED" | "AVAILABLE" | "NOT_CONFIGURED" | "UNAVAILABLE";
}

async function request(
  path: string,
  month: number,
  year: number,
  method: "GET" | "POST",
) {
  const response = await fetch(
    `${API_BASE_URL}${path}${method === "GET" ? `?month=${month}&year=${year}` : ""}`,
    {
      method,
      credentials: "include",
      headers:
        method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: method === "POST" ? JSON.stringify({ month, year }) : undefined,
    },
  );
  const result = (await response.json()) as AnalyticsResponse;
  if (!response.ok || !result.success)
    throw new Error(result.message || `Request failed (${response.status})`);
  return result;
}

export const getMonthlyAnalytics = (month: number, year: number) =>
  request("/monthly", month, year, "GET");
export const generateMonthlyReport = (month: number, year: number) =>
  request("/generate-report", month, year, "POST");
