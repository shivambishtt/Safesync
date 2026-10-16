import {
  ComplaintCategory,
  ComplaintPriority,
} from "../models/complaint.models";

const categoryDuration: Record<ComplaintCategory, number> = {
  [ComplaintCategory.CLEANING]: 4,
  [ComplaintCategory.SECURITY]: 1,
  [ComplaintCategory.ELECTRICAL]: 6,
  [ComplaintCategory.PLUMBING]: 6,
  [ComplaintCategory.MAINTENANCE]: 24,
  [ComplaintCategory.OTHER]: 24,
};

const priorityMultiplier: Record<ComplaintPriority, number> = {
  [ComplaintPriority.LOW]: 1.5,
  [ComplaintPriority.MEDIUM]: 1,
  [ComplaintPriority.HIGH]: 0.25,
};

export const calculateEstimatedClosureTime = (
  category: ComplaintCategory,
  priority: ComplaintPriority,
  startTime: Date = new Date(),
): Date => {
  const baseHours = categoryDuration[category];
  const multiplier = priorityMultiplier[priority];

  const estimatedTime = baseHours * multiplier;

  return new Date(startTime.getTime() + estimatedTime * 60 * 60 * 1000);
};
