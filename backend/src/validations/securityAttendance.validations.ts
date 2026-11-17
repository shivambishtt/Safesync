import { z } from "zod";

const dateFilters = {
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const myAttendanceQueryValidation = z
  .object(dateFilters)
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "The start date must be before the end date",
  });

export const societyAttendanceQueryValidation = z
  .object({ ...dateFilters, guardId: z.string().optional() })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "The start date must be before the end date",
  });
