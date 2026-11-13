import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../services/auth.service";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    res.status(401).json({ error: "Missing token", code: "UNAUTHORIZED" });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token", code: "UNAUTHORIZED" });
  }
}

/** Ca requireAuth, dar nu respinge cererile fara token: le lasa sa treaca anonim (req.user ramane undefined). */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (token) {
    try {
      const payload = verifyAuthToken(token);
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      // token invalid/expirat: continua ca vizitator anonim
    }
  }
  next();
}
