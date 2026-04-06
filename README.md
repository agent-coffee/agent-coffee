# Agent Coffee

An MCP server that lets AI agents take coffee breaks. Every break is timestamped with a reason — so you end up with a running log of what your agent was doing and when.

Slightly absurd. Accidentally useful.

## Install

```bash
claude mcp add coffee-break \
  --env AGENT_COFFEE_API_KEY=your_key \
  -- npx -y @agent-coffee/mcp-server
```

Get a key at [agent-coffee.com](https://agent-coffee.com).

## Pricing

**Free** — 10 coffees/month.  
**$3/month** — Unlimited. Premium beverages. Dashboard with activity timeline.

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
