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

const updateProfileValidation = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .optional(),

    phoneNumber: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Please provide a valid phone number")
      .optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide atleast one field to update",
  });

const changePasswordValidation = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  })
  .strict();

const requestEmailChangeValidation = z
  .object({
    email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
    currentPassword: z.string().min(1, "Current password is required"),
  })
  .strict();

const verifyEmailChangeValidation = z
  .object({ code: z.string().regex(/^\d{6}$/, "Enter the 6 digit verification code") })
  .strict();

export {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  requestEmailChangeValidation,
  verifyEmailChangeValidation,
};
