import { z } from "zod";

const monthYearSchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2200),
  })
  .strict();

export const analyticsQueryValidation = monthYearSchema;
export const monthlyReportValidation = monthYearSchema;
