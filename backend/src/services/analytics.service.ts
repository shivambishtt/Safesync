import mongoose from "mongoose";
import { Complaint, ComplaintCategory, ComplaintStatus } from "../models/complaint.models";
import { Flat, FlatStatus } from "../models/flat.models";
import { MaintenanceBill, MaintenanceBillStatus, MaintenancePlan } from "../models/maintenanceBilling.models";
import { SecurityAttendance } from "../models/securityAttendance.models";
import { Society } from "../models/society.models";
import { Role, User } from "../models/user.models";
import { VisitPurpose, VisitStatus, Visitor } from "../models/visitor.models";

export const REPORTING_TIME_ZONE = process.env.REPORTING_TIME_ZONE || "Asia/Kolkata";

export interface MonthPeriod {
  month: number;
  year: number;
  label: string;
  start: Date;
  end: Date;
  timezone: string;
}

function localDateTimeToUtc(year: number, month: number, day: number, timeZone: string) {
  const targetUtc = Date.UTC(year, month - 1, day);
  let guess = targetUtc;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const values = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]));
    const renderedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );
    const correction = targetUtc - renderedAsUtc;
    guess += correction;
    if (correction === 0) break;
  }
  return new Date(guess);
}

export function createMonthPeriod(month: number, year: number): MonthPeriod {
  const start = localDateTimeToUtc(year, month, 1, REPORTING_TIME_ZONE);
  const [nextMonth, nextYear] = month === 12 ? [1, year + 1] : [month + 1, year];
  const end = localDateTimeToUtc(nextYear, nextMonth, 1, REPORTING_TIME_ZONE);
  return {
    month,
    year,
    label: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: REPORTING_TIME_ZONE }).format(start),
    start,
    end,
    timezone: REPORTING_TIME_ZONE,
  };
}

function weekBucketExpression(dateField: string) {
  return {
    $dateToString: {
      format: "%Y-%m-%d",
      date: {
        $dateTrunc: {
          date: `$${dateField}`,
          unit: "week",
          startOfWeek: "monday",
          timezone: REPORTING_TIME_ZONE,
        },
      },
      timezone: REPORTING_TIME_ZONE,
    },
  };
}

function calendarWeekBuckets(period: MonthPeriod) {
  const output: { key: string; label: string }[] = [];
  const lastCalendarDay = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  const seen = new Set<string>();
  for (let day = 1; day <= lastCalendarDay; day += 1) {
    const weekday = new Date(Date.UTC(period.year, period.month - 1, day)).getUTCDay();
    const monday = day - ((weekday + 6) % 7);
    const keyDate = new Date(Date.UTC(period.year, period.month - 1, monday));
    const key = `${keyDate.getUTCFullYear()}-${String(keyDate.getUTCMonth() + 1).padStart(2, "0")}-${String(keyDate.getUTCDate()).padStart(2, "0")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const labelDate = localDateTimeToUtc(keyDate.getUTCFullYear(), keyDate.getUTCMonth() + 1, keyDate.getUTCDate(), REPORTING_TIME_ZONE);
    output.push({
      key,
      label: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: REPORTING_TIME_ZONE }).format(labelDate),
    });
  }
  return output;
}

function mergeWeeklyCounts(period: MonthPeriod, created: any[], resolved: any[] = []) {
  const buckets = calendarWeekBuckets(period);
  const createdByWeek = new Map(created.map((item) => [String(item._id), Number(item.count)]));
  const resolvedByWeek = new Map(resolved.map((item) => [String(item._id), Number(item.count)]));
  return buckets.map(({ key, label }) => ({
    week: label,
    created: createdByWeek.get(key) ?? 0,
    resolved: resolvedByWeek.get(key) ?? 0,
    count: createdByWeek.get(key) ?? 0,
    amount: Number(createdByWeek.get(key) ?? 0),
  }));
}

function amount(value: unknown) {
  return Number(value ?? 0);
}

function completeCategories(values: any[], categories: readonly string[], keyName: string) {
  const countMap = new Map(values.map((value) => [String(value._id), Number(value.count ?? 0)]));
  return categories.map((name) => ({ [keyName]: name, count: countMap.get(name) ?? 0 }));
}

async function societyForSecretary(secretaryId: string) {
  return Society.findOne({ secretary: secretaryId }).select("_id name flats").lean();
}

function visitorSocietyScopePipeline(societyId: mongoose.Types.ObjectId) {
  return [
    { $lookup: { from: Flat.collection.name, localField: "visitTo", foreignField: "_id", as: "flatScope" } },
    { $unwind: "$flatScope" },
    { $match: { "flatScope.society": societyId } },
  ];
}

export async function getSocietyAnalytics(secretaryId: string, month: number, year: number) {
  const society = await societyForSecretary(secretaryId);
  if (!society) throw new Error("SOCIETY_NOT_FOUND");
  const societyId = new mongoose.Types.ObjectId(society._id);
  const period = createMonthPeriod(month, year);
  const range = { $gte: period.start, $lt: period.end };

  const [
    residentCount,
    activeGuardCount,
    flatStatusRows,
    complaintCreated,
    complaintResolved,
    complaintOpenAtEnd,
    complaintCohort,
    complaintCategoryRows,
    complaintCreatedWeeks,
    complaintResolvedWeeks,
    staffWorkloadRows,
    billingGeneratedRows,
    paymentRows,
    currentOutstandingRows,
    duePeriodRows,
    paymentWeeks,
    plan,
    visitorRegistrationRows,
    visitorPurposeRows,
    visitorStatusRows,
    visitorWeekRows,
    visitorCheckInRows,
    attendanceRows,
    attendanceWeeks,
  ] = await Promise.all([
    User.countDocuments({ role: Role.RESIDENT, society: societyId }),
    User.countDocuments({ role: Role.SECURITY, society: societyId, isActive: true }),
    Flat.aggregate([
      { $match: { society: societyId } },
      { $group: { _id: "$flatStatus", count: { $sum: 1 } } },
    ]),
    Complaint.countDocuments({ society: societyId, createdAt: range }),
    Complaint.countDocuments({ society: societyId, resolvedAt: range }),
    Complaint.countDocuments({
      society: societyId,
      createdAt: { $lt: period.end },
      $or: [
        { resolvedAt: { $gte: period.end } },
        { resolvedAt: null, status: { $in: [ComplaintStatus.OPEN, ComplaintStatus.PENDING, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS] } },
      ],
    }),
    Complaint.aggregate([
      { $match: { society: societyId, createdAt: range } },
      { $group: {
        _id: null,
        created: { $sum: 1 },
        resolvedByPeriodEnd: { $sum: { $cond: [{ $and: [{ $ne: ["$resolvedAt", null] }, { $lt: ["$resolvedAt", period.end] }] }, 1, 0] } },
        unresolvedAtPeriodEnd: { $sum: { $cond: [{ $or: [
          { $gte: ["$resolvedAt", period.end] },
          { $and: [{ $eq: ["$resolvedAt", null] }, { $in: ["$status", [ComplaintStatus.OPEN, ComplaintStatus.PENDING, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS]] }] },
        ] }, 1, 0] } },
        missingResolutionTimestamp: { $sum: { $cond: [{ $and: [{ $in: ["$status", [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]] }, { $eq: ["$resolvedAt", null] }] }, 1, 0] } },
      } },
    ]),
    Complaint.aggregate([
      { $match: { society: societyId, createdAt: range } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Complaint.aggregate([
      { $match: { society: societyId, createdAt: range } },
      { $group: { _id: weekBucketExpression("createdAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Complaint.aggregate([
      { $match: { society: societyId, resolvedAt: range } },
      { $group: { _id: weekBucketExpression("resolvedAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Complaint.aggregate([
      { $match: { society: societyId, assignedTo: { $ne: null }, createdAt: { $lt: period.end } } },
      { $group: {
        _id: "$assignedTo",
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $in: ["$status", [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS]] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $in: ["$status", [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]] }, 1, 0] } },
      } },
      { $lookup: { from: User.collection.name, localField: "_id", foreignField: "_id", as: "staff" } },
      { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ["$staff.name", "Maintenance staff"] }, total: 1, active: 1, completed: 1 } },
      { $sort: { active: -1, total: -1 } },
    ]),
    MaintenanceBill.aggregate([
      { $match: { society: societyId, createdAt: range } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ]),
    MaintenanceBill.aggregate([
      { $match: { society: societyId, status: MaintenanceBillStatus.PAID, paidAt: range } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ]),
    MaintenanceBill.aggregate([
      { $match: { society: societyId, status: MaintenanceBillStatus.PENDING } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } },
    ]),
    MaintenanceBill.aggregate([
      { $match: { society: societyId, dueDate: range } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        totalDue: { $sum: "$amount" },
        paidCountByEnd: { $sum: { $cond: [{ $and: [{ $eq: ["$status", MaintenanceBillStatus.PAID] }, { $ne: ["$paidAt", null] }, { $lt: ["$paidAt", period.end] }] }, 1, 0] } },
        paidAmountByEnd: { $sum: { $cond: [{ $and: [{ $eq: ["$status", MaintenanceBillStatus.PAID] }, { $ne: ["$paidAt", null] }, { $lt: ["$paidAt", period.end] }] }, "$amount", 0] } },
        unknownPaidDateCount: { $sum: { $cond: [{ $and: [{ $eq: ["$status", MaintenanceBillStatus.PAID] }, { $eq: ["$paidAt", null] }] }, 1, 0] } },
        unknownPaidDateAmount: { $sum: { $cond: [{ $and: [{ $eq: ["$status", MaintenanceBillStatus.PAID] }, { $eq: ["$paidAt", null] }] }, "$amount", 0] } },
      } },
    ]),
    MaintenanceBill.aggregate([
      { $match: { society: societyId, status: MaintenanceBillStatus.PAID, paidAt: range } },
      { $group: { _id: weekBucketExpression("paidAt"), count: { $sum: 1 }, amount: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
    MaintenancePlan.findOne({ society: societyId }).select("nextPeriodStart amount frequency").lean(),
    Visitor.aggregate([
      ...visitorSocietyScopePipeline(societyId),
      { $match: { createdAt: range } },
      { $count: "count" },
    ]),
    Visitor.aggregate([
      ...visitorSocietyScopePipeline(societyId),
      { $match: { createdAt: range } },
      { $group: { _id: "$purpose", count: { $sum: 1 } } },
    ]),
    Visitor.aggregate([
      ...visitorSocietyScopePipeline(societyId),
      { $match: { createdAt: range } },
      { $group: { _id: "$visitStatus", count: { $sum: 1 } } },
    ]),
    Visitor.aggregate([
      ...visitorSocietyScopePipeline(societyId),
      { $match: { createdAt: range } },
      { $group: { _id: weekBucketExpression("createdAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Visitor.aggregate([
      ...visitorSocietyScopePipeline(societyId),
      { $match: { checkInTime: range } },
      { $count: "count" },
    ]),
    SecurityAttendance.aggregate([
      { $match: { society: societyId, checkedInAt: range } },
      { $group: {
        _id: "$guard",
        checkIns: { $sum: 1 },
        completedShifts: { $sum: { $cond: [{ $and: [{ $ne: ["$checkedOutAt", null] }, { $lt: ["$checkedOutAt", period.end] }] }, 1, 0] } },
        durationMilliseconds: { $avg: { $cond: [{ $and: [{ $ne: ["$checkedOutAt", null] }, { $lt: ["$checkedOutAt", period.end] }] }, { $subtract: ["$checkedOutAt", "$checkedInAt"] }, null] } },
      } },
      { $lookup: { from: User.collection.name, localField: "_id", foreignField: "_id", as: "guard" } },
      { $unwind: { path: "$guard", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ["$guard.name", "Security guard"] }, checkIns: 1, completedShifts: 1, durationMilliseconds: 1 } },
      { $sort: { checkIns: -1 } },
    ]),
    SecurityAttendance.aggregate([
      { $match: { society: societyId, checkedInAt: range } },
      { $group: { _id: weekBucketExpression("checkedInAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const flatCounts = new Map(flatStatusRows.map((row: any) => [String(row._id), Number(row.count)]));
  const complaintCohortValues = complaintCohort[0] ?? {};
  const billingDueValues = duePeriodRows[0] ?? {};
  const paymentTotal = paymentRows[0] ?? {};
  const generatedTotal = billingGeneratedRows[0] ?? {};
  const dueTotal = amount(billingDueValues.totalDue);
  const unknownPaidAmount = amount(billingDueValues.unknownPaidDateAmount);
  const knownCollectionDenominator = Math.max(0, dueTotal - unknownPaidAmount);
  const amountPaidByPeriodEnd = amount(billingDueValues.paidAmountByEnd);
  const categoryCounts = completeCategories(complaintCategoryRows, Object.values(ComplaintCategory), "category");
  const purposeCounts = completeCategories(visitorPurposeRows, Object.values(VisitPurpose), "purpose");
  const visitorStatuses = completeCategories(visitorStatusRows, Object.values(VisitStatus), "status");
  const registrationWeeks = mergeWeeklyCounts(period, visitorWeekRows);
  const complaintWeeks = mergeWeeklyCounts(period, complaintCreatedWeeks, complaintResolvedWeeks);
  const moneyWeeks = calendarWeekBuckets(period).map(({ key, label }) => {
    const row = paymentWeeks.find((item: any) => String(item._id) === key);
    return { week: label, amount: amount(row?.amount), count: amount(row?.count) };
  });
  const attendanceWeekRows = new Map(attendanceWeeks.map((row: any) => [String(row._id), Number(row.count)]));
  const attendanceTrend = calendarWeekBuckets(period).map(({ key, label }) => ({ week: label, count: attendanceWeekRows.get(key) ?? 0 }));
  const averageResolution = await Complaint.aggregate([
    { $match: { society: societyId, resolvedAt: range, createdAt: { $ne: null } } },
    { $group: { _id: null, averageMilliseconds: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } }, sampleCount: { $sum: 1 } } },
  ]);
  const visitorRegistrationsCount = amount(visitorRegistrationRows[0]?.count);
  const peakVisitorWeeks = [...registrationWeeks].sort((a, b) => b.count - a.count);
  const duePeriodPaidCount = amount(billingDueValues.paidCountByEnd);
  const duePeriodPendingCount = Math.max(0, amount(billingDueValues.count) - duePeriodPaidCount - amount(billingDueValues.unknownPaidDateCount));
  const duePeriodPendingAmount = Math.max(0, dueTotal - amount(billingDueValues.paidAmountByEnd) - unknownPaidAmount);

  return {
    society: { name: society.name },
    period: {
      month: period.month,
      year: period.year,
      label: period.label,
      timezone: period.timezone,
      start: period.start.toISOString(),
      endExclusive: period.end.toISOString(),
      generatedAt: new Date().toISOString(),
    },
    overview: {
      totalResidents: residentCount,
      totalFlats: [...flatCounts.values()].reduce((sum, count) => sum + count, 0),
      occupiedFlats: flatCounts.get(FlatStatus.OCCUPIED) ?? 0,
      vacantFlats: flatCounts.get(FlatStatus.VACANT) ?? 0,
      otherFlatStatuses: [...flatCounts.entries()].filter(([status]) => ![FlatStatus.OCCUPIED, FlatStatus.VACANT].includes(status as FlatStatus)).map(([status, count]) => ({ status, count })),
      visitorsRegistered: visitorRegistrationsCount,
      activeSecurityGuards: activeGuardCount,
    },
    complaints: {
      createdDuringPeriod: complaintCreated,
      resolvedDuringPeriod: complaintResolved,
      openAtPeriodEnd: complaintOpenAtEnd,
      createdCohortResolvedByPeriodEnd: amount(complaintCohortValues.resolvedByPeriodEnd),
      createdCohortUnresolvedAtPeriodEnd: amount(complaintCohortValues.unresolvedAtPeriodEnd),
      createdCohortResolvedTimestampUnavailable: amount(complaintCohortValues.missingResolutionTimestamp),
      averageResolutionHours: averageResolution[0]?.averageMilliseconds == null ? null : amount(averageResolution[0].averageMilliseconds) / 3_600_000,
      weeklyActivity: complaintWeeks,
      categories: categoryCounts,
      currentStaffWorkload: staffWorkloadRows,
    },
    billing: {
      billsGeneratedDuringPeriod: { count: amount(generatedTotal.count), amount: amount(generatedTotal.amount) },
      paymentsRecordedDuringPeriod: { count: amount(paymentTotal.count), amount: amount(paymentTotal.amount) },
      currentOutstanding: { count: amount(currentOutstandingRows[0]?.count), amount: amount(currentOutstandingRows[0]?.amount) },
      billsDueDuringPeriod: {
        count: amount(billingDueValues.count),
        amount: dueTotal,
        paidByPeriodEndCount: duePeriodPaidCount,
        paidByPeriodEndAmount: amountPaidByPeriodEnd,
        pendingAtPeriodEndCount: duePeriodPendingCount,
        pendingAtPeriodEndAmount: duePeriodPendingAmount,
        paymentDateUnavailableCount: amount(billingDueValues.unknownPaidDateCount),
        paymentDateUnavailableAmount: unknownPaidAmount,
        collectionRate: knownCollectionDenominator > 0 ? Math.round((amountPaidByPeriodEnd / knownCollectionDenominator) * 10000) / 100 : null,
        collectionRateDenominatorAmount: knownCollectionDenominator,
      },
      weeklyPayments: moneyWeeks,
      nextBillingDate: plan?.nextPeriodStart?.toISOString() ?? null,
      frequency: plan?.frequency ?? null,
      partialPaymentsSupported: false,
    },
    visitors: {
      registeredDuringPeriod: visitorRegistrationsCount,
      checkInsDuringPeriod: amount(visitorCheckInRows[0]?.count),
      currentStatusOfPeriodRegistrations: visitorStatuses,
      purposes: purposeCounts,
      weeklyRegistrations: registrationWeeks,
      peakRegistrationWeek: peakVisitorWeeks[0]?.count ? peakVisitorWeeks[0].week : null,
    },
    security: {
      attendanceCheckInsDuringPeriod: attendanceRows.reduce((sum: number, row: any) => sum + Number(row.checkIns ?? 0), 0),
      completedShiftsDuringPeriod: attendanceRows.reduce((sum: number, row: any) => sum + Number(row.completedShifts ?? 0), 0),
      averageCompletedShiftHours: (() => {
        const samples = attendanceRows.filter((row: any) => row.durationMilliseconds != null);
        if (!samples.length) return null;
        const weightedDuration = samples.reduce((sum: number, row: any) => sum + Number(row.durationMilliseconds) * Number(row.completedShifts), 0);
        const completedSamples = samples.reduce((sum: number, row: any) => sum + Number(row.completedShifts), 0);
        return completedSamples ? weightedDuration / completedSamples / 3_600_000 : null;
      })(),
      byGuard: attendanceRows.map((row: any) => ({ name: row.name, checkIns: Number(row.checkIns), completedShifts: Number(row.completedShifts) })),
      weeklyCheckIns: attendanceTrend,
      absenceAndLateMetricsAvailable: false,
    },
    dataNotes: [
      "All reporting-period metrics use the society reporting timezone, Asia/Kolkata by default, with inclusive start and exclusive end boundaries.",
      "Visitor status distribution reflects the current status of visitors registered during the selected period; registrations and check-ins use their own timestamps.",
      "Maintenance payments are manually recorded as full bill payments. The schema does not support partial payment transactions.",
      ...(amount(billingDueValues.unknownPaidDateCount) > 0 ? [`${amount(billingDueValues.unknownPaidDateCount)} paid bill(s) due in this period have no recorded payment date and are excluded from the collection-rate denominator.`] : []),
      "Security data counts recorded shifts only. No scheduled shifts, absences, or late states exist, so those values are not inferred.",
      ...(amount(complaintCohortValues.missingResolutionTimestamp) > 0 ? [`${amount(complaintCohortValues.missingResolutionTimestamp)} complaint(s) in this period are marked resolved/closed without a resolution timestamp; they are reported separately.`] : []),
    ],
  };
}

export type SocietyAnalytics = Awaited<ReturnType<typeof getSocietyAnalytics>>;
