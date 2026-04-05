/**
 * Auth middleware
 *
 * Reads the Bearer token from the Authorization header,
 * looks up the user in the database, and attaches them to the request.
 * Any route that needs an authenticated user uses this middleware.
 */

import type { Request, Response, NextFunction } from "express";
import { db } from "../db/client.js";

export interface AuthedRequest extends Request {
  user: {
    id: number;
    email: string;
    plan: "free" | "pro";
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing API key. Pass it as: Authorization: Bearer sk_..." });
    return;
  }

  const apiKey = header.slice(7);

  const [user] = await db`
    SELECT id, email, plan FROM users WHERE api_key = ${apiKey}
  `;

  if (!user) {
    res.status(401).json({ error: "Invalid API key." });
    return;
  }

  (req as AuthedRequest).user = user as AuthedRequest["user"];
  next();
}
