import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten();
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: {
          fields: errors.fieldErrors,
          general: errors.formErrors,
        },
      });
    }
    req.body = result.data;
    next();
  };
