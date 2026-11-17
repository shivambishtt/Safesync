import { z } from "zod";
import {
  MaintenanceBillStatus,
  MaintenanceFrequency,
  MaintenancePaymentMethod,
} from "../models/maintenanceBilling.models";

export const maintenancePlanValidation = z.object({
  amount: z.coerce.number().finite().min(1).max(1_000_000_000),
  frequency: z.nativeEnum(MaintenanceFrequency),
  nextPeriodStart: z.coerce.date(),
}).strict();

export const maintenanceBillsQueryValidation = z.object({
  status: z.nativeEnum(MaintenanceBillStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export const recordMaintenancePaymentValidation = z.object({
  paymentMethod: z.nativeEnum(MaintenancePaymentMethod),
  paymentReference: z.string().trim().max(120).optional().or(z.literal("")),
  paymentNotes: z.string().trim().max(500).optional().or(z.literal("")),
}).strict();
