/**
 * Checkout route
 *
 * POST /checkout/free    — create a free account, returns API key
 * POST /checkout/pro     — create a Stripe Checkout session for $3/mo
 * POST /checkout/webhook — Stripe calls this after successful payment
 */

import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "../db/client.js";

export const checkoutRouter: IRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const emailSchema = z.object({
  email: z.string().email(),
});

// ─── POST /checkout/free ──────────────────────────────────────────────────────
// Creates a free account instantly. No Stripe involved.

checkoutRouter.post("/free", async (req, res) => {
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Valid email required." });
    return;
  }

  const { email } = parsed.data;

  // Check if they already have an account
  const [existing] = await db`SELECT api_key FROM users WHERE email = ${email}`;
  if (existing) {
    res.json({ api_key: existing.api_key, message: "Welcome back." });
    return;
  }

  const apiKey = `sk_free_${nanoid(32)}`;
  await db`
    INSERT INTO users (email, api_key, plan)
    VALUES (${email}, ${apiKey}, 'free')
  `;

  res.json({ api_key: apiKey });
});

// ─── POST /checkout/pro ───────────────────────────────────────────────────────
// Creates a Stripe Checkout session. User gets redirected to Stripe's
// hosted payment page. After payment, Stripe calls our webhook below.

checkoutRouter.post("/pro", async (req, res) => {
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Valid email required." });
    return;
  }

  const { email } = parsed.data;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/#pricing`,
    metadata: { email },
  });

  res.json({ url: session.url });
});

// ─── POST /checkout/webhook ───────────────────────────────────────────────────
// Stripe calls this URL after events happen (payment success, cancellation, etc.)
// We listen for checkout.session.completed to create the user's Pro account.

checkoutRouter.post(
  "/webhook",
  // Note: this route needs the raw body (not parsed JSON) for signature verification
  // That's handled in index.ts with express.raw()
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      res.status(400).json({ error: "Invalid webhook signature." });
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.metadata?.email ?? session.customer_email ?? "";

      if (!email) {
        res.status(400).json({ error: "No email on session." });
        return;
      }

      const apiKey = `sk_pro_${nanoid(32)}`;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      // Upsert user: create if new, upgrade if existing free account
      await db`
        INSERT INTO users (email, api_key, plan, stripe_customer_id, stripe_subscription_id)
        VALUES (${email}, ${apiKey}, 'pro', ${customerId}, ${subscriptionId})
        ON CONFLICT (email) DO UPDATE SET
          plan = 'pro',
          stripe_customer_id = EXCLUDED.stripe_customer_id,
          stripe_subscription_id = EXCLUDED.stripe_subscription_id
      `;
    }

    res.json({ received: true });
  }
);

// ─── GET /checkout/session/:sessionId ────────────────────────────────────────
// Called by the /success page to retrieve the API key after Pro checkout.
// Stripe webhook may still be in-flight, so the client retries a few times.

checkoutRouter.get("/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  const email = session.metadata?.email ?? session.customer_email ?? "";
  if (!email) {
    res.status(404).json({ error: "No email on session." });
    return;
  }

  const [user] = await db`SELECT api_key FROM users WHERE email = ${email}`;
  if (!user) {
    // Webhook hasn't fired yet — client should retry
    res.status(404).json({ error: "Account not ready yet." });
    return;
  }

  res.json({ api_key: user.api_key });
});
