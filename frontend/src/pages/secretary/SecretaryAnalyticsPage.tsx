import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  LoaderCircle,
  RefreshCw,
  Users,
  UsersRound,
  UserRoundCheck,
} from "lucide-react";
import { generateMonthlyReport, getMonthlyAnalytics } from "./analyticsApi";
import type { AnalyticsResponse, AnalyticsEntry, SocietyAnalytics, WeeklyMetric } from "./analyticsApi";

const monthNames = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date(Date.UTC(2024, i, 1))),
);
const now = new Date();
const currentMonth = Number(
  new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(now),
);
const currentYear = Number(
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(now),
);
const years = Array.from(
  { length: Math.max(5, currentYear - 2024 + 1) },
  (_, i) => currentYear - i,
);

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(date);
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: typeof Building2;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#08090A]">
            {value}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0C8C5E]/10 text-[#0C8C5E]">
          <Icon size={21} />
        </span>
      </div>
      <p className="mt-4 text-xs leading-5 text-gray-500">{note}</p>
    </article>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[#08090A]">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function BarChart({
  rows,
  keys,
  currency = false,
  axisLabel = "week",
}: {
  rows: WeeklyMetric[];
  keys: Array<{ key: keyof WeeklyMetric; label: string; color: string }>;
  currency?: boolean;
  axisLabel?: string;
}) {
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => keys.map(({ key }) => Number(row[key] ?? 0))),
  );
  const magnitude = 10 ** Math.floor(Math.log10(maxValue));
  const chartMax = Math.ceil(maxValue / magnitude) * magnitude;
  const width = 640;
  const height = 260;
  const margin = { top: 16, right: 14, bottom: 42, left: 48 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const groupWidth = plotWidth / Math.max(rows.length, 1);
  const barWidth = Math.min(34, Math.max(7, (groupWidth - 14) / keys.length - 3));
  const valueLabel = (value: number) =>
    currency
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(value)
      : new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  if (!rows.some((row) => keys.some(({ key }) => Number(row[key] ?? 0) > 0)))
    return (
      <div className="flex min-h-44 items-center justify-center rounded-xl bg-gray-50 px-4 text-center text-sm text-gray-500">
        No records for this month.
      </div>
    );
  return (
    <figure>
      <div className="flex flex-wrap gap-x-4 gap-y-2 pb-3">
        {keys.map((item) => (
          <span
            className="inline-flex items-center gap-2 text-xs text-gray-600"
            key={item.key}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className="w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#f8fbf9] to-white px-1 pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${keys.map((key) => key.label).join(" and ")} by ${axisLabel}`} className="h-auto w-full overflow-visible">
          {[0, 1, 2, 3, 4].map((tick) => {
            const value = (chartMax * tick) / 4;
            const y = margin.top + plotHeight - (plotHeight * tick) / 4;
            return <g key={tick}>
              <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke={tick === 0 ? "#cbd5d1" : "#e8eeeb"} strokeDasharray={tick === 0 ? undefined : "3 5"} />
              <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#87918d" fontSize="10">{valueLabel(value)}</text>
            </g>;
          })}
          {rows.map((row, index) => {
            const xCenter = margin.left + groupWidth * (index + 0.5);
            const groupContentWidth = keys.length * barWidth + (keys.length - 1) * 4;
            const rawLabel = String(row.week ?? "");
            const axisText = rawLabel.length > 12 ? `${rawLabel.slice(0, 11)}…` : rawLabel;
            return <g key={`${String(row.week ?? index)}`}>
              {keys.map((series, seriesIndex) => {
                const value = Number(row[series.key] ?? 0);
                const barHeight = (value / chartMax) * plotHeight;
                const x = xCenter - groupContentWidth / 2 + seriesIndex * (barWidth + 4);
                const y = margin.top + plotHeight - barHeight;
                return <g key={String(series.key)}>
                  <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, value ? 2 : 0)} rx={Math.min(5, barWidth / 3)} fill={series.color} tabIndex={value > 0 ? 0 : undefined} className="transition-opacity hover:opacity-80 focus:opacity-80">
                    <title>{`${row.week ?? "Period"}: ${series.label} — ${currency ? formatCurrency(value) : value}`}</title>
                  </rect>
                </g>;
              })}
              <text x={xCenter} y={height - 12} textAnchor="middle" fill="#69746f" fontSize={rows.length > 5 ? 9 : 11}><title>{rawLabel}</title>{axisText}</text>
            </g>;
          })}
        </svg>
      </div>
      <figcaption className="mt-2 text-xs text-gray-400">Hover or focus a bar to see its value. Horizontal labels show {axisLabel}.</figcaption>
    </figure>
  );
}

function Breakdown({
  items,
  nameKey,
  totalLabel,
}: {
  items: AnalyticsEntry[];
  nameKey: string;
  totalLabel: string;
}) {
  const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);
  if (!total)
    return (
      <div className="flex min-h-36 items-center justify-center rounded-xl bg-gray-50 px-4 text-center text-sm text-gray-500">
        No {totalLabel.toLowerCase()} recorded for this month.
      </div>
    );
  return (
    <div className="space-y-4">
      {items
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((item) => {
          const label = String(item[nameKey] ?? "Other")
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
          return (
            <div key={label}>
              <div className="mb-1.5 flex justify-between gap-3 text-sm">
                <span className="truncate text-gray-700">{label}</span>
                <span className="font-medium text-gray-900">
                  {item.count}{" "}
                  <span className="font-normal text-gray-400">
                    ({Math.round((item.count / total) * 100)}%)
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#0C8C5E]"
                  style={{ width: `${(item.count / total) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}

function ReportContent({
  analytics,
  narrative,
  aiStatus,
}: {
  analytics: SocietyAnalytics;
  narrative: AnalyticsResponse["narrative"];
  aiStatus: AnalyticsResponse["aiStatus"];
}) {
  const statusMessage =
    aiStatus === "AVAILABLE"
      ? "AI-assisted narrative"
      : aiStatus === "NOT_CONFIGURED"
        ? "Data-derived narrative · Configure OPENAI_API_KEY in backend/.env to enable AI summaries"
        : aiStatus === "UNAVAILABLE"
          ? "Data-derived narrative · OpenAI request failed; check backend logs and configuration"
          : "Data-derived narrative";
  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#0C8C5E]">
            Secretary workspace · Monthly report
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#08090A] sm:text-3xl">
            Society Analytics
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {analytics.society.name} · {analytics.period.label} ·{" "}
            {analytics.period.timezone}
          </p>
        </div>
        <p className="text-xs text-gray-500">
          Report generated {formatDate(analytics.period.generatedAt)}
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total residents"
          value={analytics.overview.totalResidents}
          note="Current society account count"
          icon={Users}
        />
        <MetricCard
          label="Flats"
          value={`${analytics.overview.occupiedFlats} / ${analytics.overview.totalFlats}`}
          note={`${analytics.overview.vacantFlats} vacant · current flat status`}
          icon={Building2}
        />
        <MetricCard
          label="Complaints created"
          value={analytics.complaints.createdDuringPeriod}
          note={`${analytics.complaints.resolvedDuringPeriod} resolved during ${analytics.period.label}`}
          icon={ClipboardList}
        />
        <MetricCard
          label="Open complaints"
          value={analytics.complaints.openAtPeriodEnd}
          note="Open at the end of the reporting period"
          icon={Activity}
        />
        <MetricCard
          label="Visitor registrations"
          value={analytics.visitors.registeredDuringPeriod}
          note="Registered during this month"
          icon={UserRoundCheck}
        />
        <MetricCard
          label="Visitor check-ins"
          value={analytics.visitors.checkInsDuringPeriod}
          note="Check-in timestamps in this month"
          icon={UsersRound}
        />
        <MetricCard
          label="Maintenance collected"
          value={formatCurrency(
            analytics.billing.paymentsRecordedDuringPeriod.amount,
          )}
          note={`${analytics.billing.paymentsRecordedDuringPeriod.count} payments recorded in this month`}
          icon={IndianRupee}
        />
        <MetricCard
          label="Outstanding bills"
          value={formatCurrency(analytics.billing.currentOutstanding.amount)}
          note={`${analytics.billing.currentOutstanding.count} currently pending · live snapshot`}
          icon={IndianRupee}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Complaint activity"
          description={`Weekly complaint registrations and resolutions · ${analytics.period.label}`}
        >
          <BarChart
            rows={analytics.complaints.weeklyActivity}
            keys={[
              { key: "created", label: "Created", color: "#0C8C5E" },
              { key: "resolved", label: "Resolved", color: "#8BB7A8" },
            ]}
          />
        </Panel>
        <Panel
          title="Complaint categories"
          description="Category mix for complaints created during the selected month"
        >
          <Breakdown
            items={analytics.complaints.categories}
            nameKey="category"
            totalLabel="Complaint categories"
          />
        </Panel>
        <Panel
          title="Maintenance billing"
          description="Bills due this month and their payment state by month end"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Due this month</p>
              <p className="mt-2 text-xl font-semibold">
                {formatCurrency(analytics.billing.billsDueDuringPeriod.amount)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {analytics.billing.billsDueDuringPeriod.count} bills
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs text-emerald-800">Collected by month end</p>
              <p className="mt-2 text-xl font-semibold text-[#083D33]">
                {formatCurrency(
                  analytics.billing.billsDueDuringPeriod.paidByPeriodEndAmount,
                )}
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                {analytics.billing.billsDueDuringPeriod.collectionRate === null
                  ? "Rate unavailable"
                  : `${analytics.billing.billsDueDuringPeriod.collectionRate}% of bills with known payment dates`}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Paid by period end</p>
              <p className="mt-1 font-semibold">
                {analytics.billing.billsDueDuringPeriod.paidByPeriodEndCount}{" "}
                bills
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Pending at period end</p>
              <p className="mt-1 font-semibold">
                {analytics.billing.billsDueDuringPeriod.pendingAtPeriodEndCount}{" "}
                bills
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Next billing date</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {formatDate(analytics.billing.nextBillingDate)}
            </p>
            <p className="mt-1 text-xs capitalize text-gray-500">
              {analytics.billing.frequency
                ? `${analytics.billing.frequency.toLowerCase()} billing cycle`
                : "Billing cycle not set"}
            </p>
          </div>
          {analytics.billing.billsDueDuringPeriod.paymentDateUnavailableCount >
            0 && (
            <p className="mt-3 text-xs leading-5 text-amber-800">
              {
                analytics.billing.billsDueDuringPeriod
                  .paymentDateUnavailableCount
              }{" "}
              paid bill(s) have no payment date and are excluded from the
              collection rate.
            </p>
          )}
        </Panel>
        <Panel
          title="Maintenance payments"
          description="Recorded payments by week"
        >
          <BarChart
            rows={analytics.billing.weeklyPayments}
            keys={[{ key: "amount", label: "Collected", color: "#0C8C5E" }]}
            currency
          />
        </Panel>
        <Panel
          title="Visitor activity"
          description="Visitor registrations by week, purpose, and current status"
        >
          <BarChart
            rows={analytics.visitors.weeklyRegistrations}
            keys={[{ key: "count", label: "Registrations", color: "#0C8C5E" }]}
          />
          <div className="mt-6 grid gap-6 border-t border-gray-100 pt-5 sm:grid-cols-2">
            <div>
              <h3 className="mb-4 text-sm font-medium text-gray-700">Visit purpose</h3>
              <Breakdown items={analytics.visitors.purposes} nameKey="purpose" totalLabel="visitor purposes" />
            </div>
            <div>
              <h3 className="mb-4 text-sm font-medium text-gray-700">Current status of this month’s visitors</h3>
              <Breakdown items={analytics.visitors.currentStatusOfPeriodRegistrations} nameKey="status" totalLabel="visitor statuses" />
            </div>
          </div>
        </Panel>
        <Panel
          title="Security attendance"
          description={`Recorded attendance only · ${analytics.period.label}`}
        >
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Check-ins recorded</p>
              <p className="mt-1 text-xl font-semibold">
                {analytics.security.attendanceCheckInsDuringPeriod}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Completed shifts</p>
              <p className="mt-1 text-xl font-semibold">
                {analytics.security.completedShiftsDuringPeriod}
              </p>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">Attendance by guard</h3>
            <BarChart
              rows={analytics.security.byGuard.map((guard) => ({
                week: guard.name,
                count: guard.checkIns,
                created: guard.completedShifts,
              }))}
              keys={[
                { key: "count", label: "Check-ins", color: "#0C8C5E" },
                { key: "created", label: "Completed shifts", color: "#9CCDBB" },
              ]}
              axisLabel="guard"
            />
          </div>
          {analytics.security.byGuard.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[380px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                    <th className="pb-3 font-medium">Guard</th>
                    <th className="pb-3 font-medium">Check-ins</th>
                    <th className="pb-3 font-medium">Completed shifts</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.security.byGuard.map((guard) => (
                    <tr
                      className="border-b border-gray-100 last:border-0"
                      key={guard.name}
                    >
                      <td className="py-3 font-medium text-gray-800">
                        {guard.name}
                      </td>
                      <td className="py-3 text-gray-600">{guard.checkIns}</td>
                      <td className="py-3 text-gray-600">
                        {guard.completedShifts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
              No attendance records for this month.
            </p>
          )}
          <p className="mt-4 text-xs leading-5 text-gray-500">
            Average completed shift:{" "}
            {analytics.security.averageCompletedShiftHours === null
              ? "not available"
              : `${analytics.security.averageCompletedShiftHours.toFixed(1)} hours`}
            . Scheduled shifts, absence, and late metrics are not available in
            the current attendance records.
          </p>
        </Panel>
      </section>

      <Panel title="Monthly summary" description={statusMessage}>
        <p className="leading-7 text-gray-700">{narrative.executiveSummary}</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Observations
            </h3>
            <ul className="space-y-2">
              {narrative.observations.map((item, i) => (
                <li
                  className="flex gap-2 text-sm leading-6 text-gray-600"
                  key={`${i}-${item}`}
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0C8C5E]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Suggested follow-ups
            </h3>
            <ul className="space-y-2">
              {narrative.suggestedActions.map((item, i) => (
                <li
                  className="flex gap-2 text-sm leading-6 text-gray-600"
                  key={`${i}-${item}`}
                >
                  <span className="mt-1 text-[#0C8C5E]">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
      <Panel
        title="Data notes"
        description="Interpretation limits for this report"
      >
        <ul className="space-y-2">
          {analytics.dataNotes.map((note) => (
            <li
              key={note}
              className="flex gap-2 text-sm leading-6 text-gray-600"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
              {note}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export default function SecretaryAnalyticsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [result, setResult] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async (selectedMonth = month, selectedYear = year) => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      setResult(await getMonthlyAnalytics(selectedMonth, selectedYear));
    } catch (err) {
      setResult(null);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load society analytics.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(month, year);
  }, [month, year]);

  const reportTimestamp = useMemo(
    () => result?.analytics.period.generatedAt,
    [result],
  );

  const generate = async () => {
    setGenerating(true);
    setError("");
    setNotice("");
    try {
      const report = await generateMonthlyReport(month, year);
      setResult(report);
      setNotice(
        report.aiStatus === "AVAILABLE"
          ? "Monthly report generated with the configured AI summary."
          : report.aiStatus === "NOT_CONFIGURED"
            ? "AI summary was not generated because OPENAI_API_KEY is missing from the backend environment. Add it to backend/.env and restart the backend. Your report and data-derived summary are ready below."
            : "The report is ready with its data-derived summary, but the OpenAI request failed. Check the backend log for the request status and verify OPENAI_API_KEY and OPENAI_MODEL.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate the monthly report.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="secretary-analytics-page space-y-6">
      <div className="analytics-print-hide flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-[#0C8C5E]">
            <CalendarDays size={16} />
            Reporting period
          </p>
          <div className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="analytics-month">
              Month
            </label>
            <select
              id="analytics-month"
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {monthNames.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="analytics-year">
              Year
            </label>
            <select
              id="analytics-year"
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || generating}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading || generating || !result}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0C8C5E] px-3 text-sm font-medium text-white hover:bg-[#087750] disabled:opacity-60"
          >
            {generating ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {generating ? "Generating…" : "Generate monthly report"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!result || loading}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#0C8C5E]/30 px-3 text-sm font-medium text-[#083D33] hover:bg-emerald-50 disabled:opacity-60"
          >
            <ArrowDownToLine size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>
      {notice && (
        <p
          role="status"
          className="analytics-print-hide rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {notice}
        </p>
      )}
      {error && (
        <div
          className="analytics-print-hide rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          {error}
          <button
            className="ml-3 font-semibold underline"
            type="button"
            onClick={() => void load()}
          >
            Try again
          </button>
        </div>
      )}
      {loading && (
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-600">
          <LoaderCircle className="animate-spin text-[#0C8C5E]" size={20} />
          Loading society analytics…
        </div>
      )}
      {!loading && result && (
        <div className="analytics-print-root">
          <ReportContent
            analytics={result.analytics}
            narrative={result.narrative}
            aiStatus={result.aiStatus}
          />
        </div>
      )}
      {!loading && !result && !error && (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          No analytics available for this period.
        </div>
      )}
      {result && (
        <p className="analytics-print-hide text-right text-xs text-gray-400">
          Data refreshed {reportTimestamp ? formatDate(reportTimestamp) : ""}
        </p>
      )}
    </div>
  );
}
