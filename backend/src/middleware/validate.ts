import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Invalid request payload",
        code: "VALIDATION_ERROR",
        details: result.error.flatten(),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
