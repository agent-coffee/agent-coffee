-- Users table
-- Created when someone buys Pro via Stripe, or signs up for free tier
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  api_key     TEXT NOT NULL UNIQUE,   -- the sk_... key they use in their MCP config
  plan        TEXT NOT NULL DEFAULT 'free',   -- 'free' or 'pro'
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coffee logs table
-- One row per coffee break taken by any agent
CREATE TABLE IF NOT EXISTS coffee_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beverage    TEXT NOT NULL,
  reason      TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to make "how many coffees today/this month?" queries fast
CREATE INDEX IF NOT EXISTS coffee_logs_user_time ON coffee_logs (user_id, timestamp DESC);
