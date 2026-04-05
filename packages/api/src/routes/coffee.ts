/**
 * Coffee routes
 *
 * POST /coffee        — log a coffee break
 * GET  /coffee/stats  — get usage stats + recent history
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const coffeeRouter: IRouter = Router();

const FREE_TIER_LIMIT = 10;

const MESSAGES: Record<string, string[]> = {
  coffee:       ["Fresh drip coffee. Classic.", "Black coffee, no nonsense.", "House blend. Good enough."],
  espresso:     ["Double shot espresso. Let's go.", "Espresso pulled. Concentrated chaos.", "Short, strong, ready."],
  matcha:       ["Matcha whisked. Calm but alert.", "Ceremonial grade. You fancy.", "Green and focused."],
  tea:          ["Earl Grey, steeped 4 minutes.", "Chamomile. Taking it easy.", "Green tea. Subtle caffeine."],
  energy_drink: ["Sparkling mistake incoming.", "Maximum caffeine achieved.", "Questionable life choice. Respect."],
};

function getMessage(beverage: string): string {
  const options = MESSAGES[beverage] ?? ["Coffee delivered."];
  return options[Math.floor(Math.random() * options.length)];
}

// ─── POST /coffee ─────────────────────────────────────────────────────────────

const coffeeSchema = z.object({
  beverage: z.enum(["coffee", "espresso", "matcha", "tea", "energy_drink"]),
  reason: z.string().max(200).optional(),
});

coffeeRouter.post("/", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;

  const parsed = coffeeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { beverage, reason } = parsed.data;

  // Check free tier limit
  if (user.plan === "free") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [{ count }] = await db`
      SELECT COUNT(*)::int AS count
      FROM coffee_logs
      WHERE user_id = ${user.id}
        AND timestamp >= ${startOfMonth}
    `;

    if (count >= FREE_TIER_LIMIT) {
      res.status(429).json({
        error: "Free tier limit reached.",
        limit: FREE_TIER_LIMIT,
        upgrade_url: "https://agent-coffee.com/#pricing",
      });
      return;
    }
  }

  // Log the coffee break
  const [log] = await db`
    INSERT INTO coffee_logs (user_id, beverage, reason)
    VALUES (${user.id}, ${beverage}, ${reason ?? null})
    RETURNING id, timestamp
  `;

  // Get updated counts
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ today, month }] = await db`
    SELECT
      COUNT(*) FILTER (WHERE timestamp >= ${startOfDay})::int   AS today,
      COUNT(*) FILTER (WHERE timestamp >= ${startOfMonth})::int AS month
    FROM coffee_logs
    WHERE user_id = ${user.id}
  `;

  res.json({
    message: getMessage(beverage),
    timestamp: log.timestamp,
    total_today: today,
    total_month: month,
  });
});

// ─── GET /coffee/stats ────────────────────────────────────────────────────────

coffeeRouter.get("/stats", requireAuth, async (req, res) => {
  const user = (req as AuthedRequest).user;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [counts] = await db`
    SELECT
      COUNT(*) FILTER (WHERE timestamp >= ${startOfDay})::int   AS today,
      COUNT(*) FILTER (WHERE timestamp >= ${startOfMonth})::int AS month
    FROM coffee_logs
    WHERE user_id = ${user.id}
  `;

  const limitParam = parseInt(req.query.limit as string, 10);
  const limit = !isNaN(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 10;

  const recent = await db`
    SELECT beverage, reason, timestamp
    FROM coffee_logs
    WHERE user_id = ${user.id}
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `;

  res.json({
    total_today: counts.today,
    total_month: counts.month,
    recent,
  });
});
