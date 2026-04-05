/**
 * API entry point
 *
 * Sets up the Express server, mounts all routes, and starts listening.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { coffeeRouter } from "./routes/coffee.js";
import { checkoutRouter } from "./routes/checkout.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Allow requests from the landing page (Vercel domain + local dev)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://agent-coffee.com",
    "https://www.agent-coffee.com",
  ],
}));

// Stripe webhooks need the raw body for signature verification
// Must be registered BEFORE express.json()
app.use("/checkout/webhook", express.raw({ type: "application/json" }));

// All other routes get parsed JSON
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/coffee", coffeeRouter);
app.use("/checkout", checkoutRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
