import { z } from "zod";

const registerValidation = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),

    password: z.string().min(6, "Password must be at least 6 characters"),

    phoneNumber: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Please provide a valid phone number"),

    role: z.enum(["SECRETARY", "RESIDENT", "SECURITY", "MAINTENANCE"]),

    society: z.string().optional(),

    flat: z.string().optional(),
  })
  .strict();

const loginValidation = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),

    password: z.string().min(6, "Password is less than 6 characters"),
  })
  .strict();

export { registerValidation, loginValidation };
