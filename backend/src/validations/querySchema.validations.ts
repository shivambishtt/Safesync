import { z } from "zod";
import { FlatStatus } from "../models/flat.models";
import { ApplicationStatus } from "../models/user.models";

export const getAllFlatsQuerySchema = z
  .object({
    flatNumber: z.string().trim().min(1).optional(),
    block: z.string().trim().min(1).optional(),
    floor: z.coerce.number().int().min(0).optional(),
    flatStatus: z.nativeEnum(FlatStatus).optional(),
    area: z.coerce.number().int().min(50).optional(),
  })
  .strict();

export const getPendingSecretariesQuerySchema = z
  .object({
    applicationStatus: z.nativeEnum(ApplicationStatus).optional(),
  })
  .strict();
