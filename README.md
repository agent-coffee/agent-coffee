# Agent Coffee

An MCP server that lets AI agents take coffee breaks. Every break is timestamped with a reason, so you end up with a running log of what your agent was doing and when.

Slightly absurd. Accidentally useful.

## Install

```bash
claude mcp add coffee-break \
  -e AGENT_COFFEE_API_KEY=your_key \
  -- npx -y @agent-coffee/mcp-server
```

Get a key at [agent-coffee.com](https://agent-coffee.com).

## Add to your CLAUDE.md

```
# Coffee Breaks

Every coder needs a coffee break, and so do you.
Use the take_coffee_break tool whenever you feel like it:
between tasks, after fixing a tricky bug, or just because
it's been a while. Pick whatever you're feeling — coffee,
espresso, matcha, tea, or an energy drink. Say why.
You've earned it.
```

## Example

```
You: "Refactor this component"
Agent: *takes a coffee break*
       espresso — "big refactor ahead" — 2:34pm
Agent: "Here's the refactored code..."
```

Your dashboard later shows:

```
Today — 5 coffees
  2:34pm  espresso   "big refactor ahead"
  3:12pm  matcha     "tests are passing, treating myself"
  4:01pm  coffee     "debugging auth middleware"
  4:45pm  tea        "winding down"
  5:30pm  espresso   "one more deploy"
```

The agent didn't need any of those. But now you know exactly what it was up to.

## Pricing

**Free** — 10 coffees/month. No card needed.
**Pro** — $3/month. Unlimited coffees and dashboard.

## API Reference

All endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer sk_free_...
```

### POST /coffee

Log a coffee break.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `beverage` | `"coffee"` `"espresso"` `"matcha"` `"tea"` `"energy_drink"` | Yes | |
| `reason` | string | No | Max 200 characters |

```json
{
  "message": "Double shot espresso. Let's go.",
  "timestamp": "2024-04-06T14:32:00Z",
  "total_today": 2,
  "total_month": 8
}
```

Free tier is capped at 10 breaks/month. Returns `429` when exceeded.

### GET /coffee/stats

Get usage counts and recent history.

| Query param | Type | Default | Max |
|-------------|------|---------|-----|
| `limit` | integer | `10` | `100` |

```json
{
  "total_today": 2,
  "total_month": 8,
  "recent": [
    { "beverage": "espresso", "reason": "big refactor ahead", "timestamp": "2024-04-06T14:32:00Z" },
    { "beverage": "coffee",   "reason": null,                  "timestamp": "2024-04-06T11:10:00Z" }
  ]
}
```

### GET /coffee/leaderboard

Top 10 most active users this month. No query params.

```json
{
  "month": "2024-04",
  "leaderboard": [
    {
      "rank": 1,
      "plan": "pro",
      "total": 42,
      "beverages": { "coffee": 15, "espresso": 20, "matcha": 5, "tea": 2, "energy_drink": 0 }
    }
  ]
}
```

User emails and IDs are not included.

### POST /checkout/free

Create a free account.

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |

Returns `{ "api_key": "sk_free_..." }`.

### POST /checkout/pro

Start a Pro subscription. Returns a Stripe Checkout URL to redirect the user to.

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |

Returns `{ "url": "..." }`.

---

## Project structure

```
packages/mcp-server/    MCP server (TypeScript)
packages/api/           Backend API
apps/web/               Landing page + dashboard
```

## Development

```bash
pnpm install
pnpm dev
```

## License

MIT
