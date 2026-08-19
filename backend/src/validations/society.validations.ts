import { z } from "zod";
import { SocietyStatus } from "../models/society.models";

const createSocietyValidation = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Society name must be at least 2 characters"),
    email: z.string().trim().toLowerCase().email().optional(),
    address: z.object({
      addressLine: z.string().trim().min(1, "Address line is required"),
      city: z.string().trim().min(1, "City is required"),
      state: z.string().trim().min(1, "State is required"),
      pincode: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Pincode must be 6 digits"),
    }),
    flats: z.number().min(20),
    status: z.enum(SocietyStatus),
  })
  .strict();

export { createSocietyValidation };
