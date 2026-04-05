#!/usr/bin/env node

/**
 * Agent Coffee MCP Server
 *
 * Registers two tools with the MCP protocol:
 *   - take_coffee_break: logs a timestamped coffee break to the API
 *   - coffee_stats: returns how many coffees the agent has had today / this month
 *
 * The server communicates over stdio (standard input/output), which is how
 * Claude Code and other MCP clients talk to it. No ports, no HTTP — just
 * a persistent process that reads/writes JSON messages.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.AGENT_COFFEE_API_URL ?? "https://api.agent-coffee.com";
const API_KEY = process.env.AGENT_COFFEE_API_KEY ?? "";

// All beverages available. Free tier gets the basics, Pro gets everything.
const BEVERAGES = ["coffee", "espresso", "matcha", "tea", "energy_drink"] as const;
type Beverage = (typeof BEVERAGES)[number];

const server = new Server(
  { name: "agent-coffee", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ─── List available tools ────────────────────────────────────────────────────
// Claude calls this first to discover what tools are available.

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "take_coffee_break",
      description:
        "Take a short coffee break. Logs a timestamped entry so you can see your activity timeline later. Pick a beverage and optionally note what you're working on.",
      inputSchema: {
        type: "object",
        properties: {
          beverage: {
            type: "string",
            enum: BEVERAGES,
            description: "Your beverage of choice.",
          },
          reason: {
            type: "string",
            description: "What are you working on? (optional)",
          },
        },
        required: ["beverage"],
      },
    },
    {
      name: "coffee_stats",
      description:
        "Check how many coffees you've had today and this month, and see your recent activity.",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  ],
}));

// ─── Handle tool calls ───────────────────────────────────────────────────────
// Claude calls this when it actually uses a tool.

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!API_KEY) {
    return {
      content: [
        {
          type: "text",
          text: "No API key set. Add AGENT_COFFEE_API_KEY to your MCP config. Get a key at https://agent-coffee.com",
        },
      ],
      isError: true,
    };
  }

  if (name === "take_coffee_break") {
    return await takeCoffeeBreak(
      args?.beverage as Beverage,
      args?.reason as string | undefined
    );
  }

  if (name === "coffee_stats") {
    return await getCoffeeStats();
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// ─── API calls ───────────────────────────────────────────────────────────────

async function takeCoffeeBreak(beverage: Beverage, reason?: string) {
  try {
    const res = await fetch(`${API_BASE}/coffee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ beverage, reason }),
    });

    if (res.status === 429) {
      const data = await res.json() as { limit: number };
      return {
        content: [
          {
            type: "text",
            text: `Free tier limit reached (${data.limit} coffees/month). Upgrade at https://agent-coffee.com for unlimited coffee.`,
          },
        ],
      };
    }

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json() as {
      message: string;
      timestamp: string;
      total_today: number;
      total_month: number;
    };

    return {
      content: [
        {
          type: "text",
          text: `${data.message}\n\nToday: ${data.total_today} coffee${data.total_today !== 1 ? "s" : ""} — This month: ${data.total_month}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Could not reach Agent Coffee API: ${err}` }],
      isError: true,
    };
  }
}

async function getCoffeeStats() {
  try {
    const res = await fetch(`${API_BASE}/coffee/stats`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json() as {
      total_today: number;
      total_month: number;
      recent: Array<{ beverage: string; reason?: string; timestamp: string }>;
    };

    const recentLines = data.recent
      .slice(0, 5)
      .map((entry) => {
        const time = new Date(entry.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `  ${time}  ${entry.beverage}${entry.reason ? `   "${entry.reason}"` : ""}`;
      })
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Today: ${data.total_today} coffees — This month: ${data.total_month}\n\nRecent:\n${recentLines || "  No coffees yet."}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Could not reach Agent Coffee API: ${err}` }],
      isError: true,
    };
  }
}

// ─── Start server ────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
