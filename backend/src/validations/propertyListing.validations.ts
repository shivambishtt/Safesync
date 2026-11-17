import { z } from "zod";
import {
  PropertyListingStatus,
  PropertyListingType,
} from "../models/propertyListing.models";

const amountValidation = z.coerce.number().finite().min(1).max(1_000_000_000_000);

export const createPropertyListingValidation = z
  .object({
    listingType: z.nativeEnum(PropertyListingType),
    amount: amountValidation,
    showContact: z.boolean().default(false),
  })
  .strict();

export const updatePropertyListingValidation = z
  .object({
    listingType: z.nativeEnum(PropertyListingType).optional(),
    amount: amountValidation.optional(),
    showContact: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Provide at least one field to update",
  });

export const propertyListingFeedQueryValidation = z
  .object({
    listingType: z.nativeEnum(PropertyListingType).optional(),
    minAmount: amountValidation.optional(),
    maxAmount: amountValidation.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict()
  .refine(
    (value) => value.minAmount === undefined || value.maxAmount === undefined || value.minAmount <= value.maxAmount,
    { message: "Minimum price must not exceed maximum price" },
  );

export const myPropertyListingsQueryValidation = z
  .object({
    status: z.nativeEnum(PropertyListingStatus).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .strict();
