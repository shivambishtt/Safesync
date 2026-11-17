import { z } from "zod";
import { NoticeCategory, NoticePriority, NoticeStatus } from "../models/notice.models";

const optionalExpiry = z.string().datetime().nullable().optional();

export const createNoticeValidation = z
  .object({
    title: z.string().trim().min(1).max(120),
    content: z.string().trim().min(1).max(10000),
    category: z.nativeEnum(NoticeCategory).optional(),
    priority: z.nativeEnum(NoticePriority).optional(),
    status: z.enum([NoticeStatus.DRAFT, NoticeStatus.PUBLISHED]).optional(),
    expiresAt: optionalExpiry,
  })
  .strict();

export const updateNoticeValidation = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    content: z.string().trim().min(1).max(10000).optional(),
    category: z.nativeEnum(NoticeCategory).optional(),
    priority: z.nativeEnum(NoticePriority).optional(),
    expiresAt: optionalExpiry,
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update",
  });

export const noticeListQueryValidation = z
  .object({
    status: z.nativeEnum(NoticeStatus).optional(),
    category: z.nativeEnum(NoticeCategory).optional(),
    priority: z.nativeEnum(NoticePriority).optional(),
    search: z.string().trim().max(120).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export const residentNoticeListQueryValidation = noticeListQueryValidation
  .omit({ status: true })
  .strict();

export const noticePinValidation = z.object({ isPinned: z.boolean() }).strict();
