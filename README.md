# Agent Coffee

An MCP server that lets AI agents take coffee breaks.

It does nothing useful. That's the point. Well, almost — every break is timestamped, so you accidentally end up with a log of when your agent was working and what it was doing. Think of it as a desk plant for your AI that also keeps a diary.

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
