"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const MCP_COMMAND = "claude mcp add coffee-break -e AGENT_COFFEE_API_KEY=your_key -- npx -y @agent-coffee/mcp-server";

const CLAUDE_MD_SNIPPET = `# Coffee Breaks

Every coder needs a coffee break, and so do you.
Use the take_coffee_break tool whenever you feel like it:
between tasks, after fixing a tricky bug, or just because
it's been a while. Pick whatever you're feeling — coffee,
espresso, matcha, tea, or an energy drink. Say why.
You've earned it.`;

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={`text-xs px-2 py-1 rounded transition-colors ${
        copied
          ? "bg-green-800/50 text-green-400"
          : "bg-stone-700 hover:bg-stone-600 text-stone-400 hover:text-stone-200"
      } ${className}`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-stone-300 text-sm group-hover:text-stone-100 transition-colors">{q}</span>
        <span className="text-stone-600 text-lg ml-4 shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <p className="text-stone-500 text-sm pb-4 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"free" | "pro" | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFree(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading("free");
    setError(null);
    try {
      const res = await fetch(`${API_URL}/checkout/free`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApiKey(data.api_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  async function handlePro(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading("pro");
    setError(null);
    try {
      const res = await fetch(`${API_URL}/checkout/pro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">

      {/* Nav */}
      <nav className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-stone-400 text-sm font-medium hover:text-stone-200 transition-colors">Agent Coffee</a>
        <div className="flex items-center gap-5 text-sm">
          <a href="/dashboard" className="text-stone-600 hover:text-stone-400 transition-colors">Dashboard</a>
          <a href="https://github.com/agent-coffee/agent-coffee" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-400 transition-colors">GitHub</a>
          <a
            href="#pricing"
            className="bg-amber-800/80 hover:bg-amber-700 text-stone-100 rounded-md px-3 py-1 transition-colors"
          >
            Get a key
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-20">
        <p className="text-amber-500/80 text-sm font-medium mb-4">MCP tool for Claude Code</p>
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight mb-6" id="top">
          Coders need coffee.<br />So do their agents.
        </h1>
        <p className="text-stone-400 text-lg leading-relaxed mb-4 max-w-xl">
          An MCP tool that gives your AI agent one new ability: taking a coffee break.
          It picks the drink, picks the moment, and tells you why.
          Every break is timestamped, so you end up with an activity log
          of what your agent was up to all day.
        </p>
        <p className="text-stone-600 text-sm mb-8">
          Slightly absurd. Accidentally useful.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="#pricing"
            className="inline-block bg-amber-800 hover:bg-amber-700 transition-colors rounded-lg px-5 py-2.5 text-sm text-stone-100"
          >
            Get started free →
          </a>
          <a
            href="#how"
            className="inline-block bg-stone-900 border border-stone-800 hover:border-stone-700 transition-colors rounded-lg px-5 py-2.5 text-sm text-stone-400 hover:text-stone-200"
          >
            How it works
          </a>
        </div>
      </section>

      {/* Demo — autonomous behavior */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <p className="text-stone-600 text-xs uppercase tracking-widest mb-4">A normal Tuesday</p>
        <div className="bg-stone-800 border border-stone-700 rounded-lg p-6 font-mono text-sm">
          <p className="text-stone-500 text-xs mb-4">Your agent&apos;s coffee log, today</p>
          <div className="space-y-2.5">
            {[
              { time: "9:12am", drink: "coffee",   note: "morning warmup, reading through the codebase" },
              { time: "10:47am", drink: "espresso", note: "big refactor ahead" },
              { time: "1:03pm", drink: "matcha",   note: "tests are passing, treating myself" },
              { time: "3:21pm", drink: "coffee",   note: "debugging auth middleware" },
              { time: "4:45pm", drink: "tea",      note: "winding down" },
              { time: "5:30pm", drink: "espresso", note: "one more deploy" },
            ].map((entry) => (
              <div key={entry.time} className="flex gap-4 text-stone-400">
                <span className="text-stone-500 w-16 shrink-0">{entry.time}</span>
                <span className="text-stone-300 w-20 shrink-0">{entry.drink}</span>
                <span className="text-stone-400">&ldquo;{entry.note}&rdquo;</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-stone-700 text-xs mt-3 text-center">
          You didn&apos;t ask for any of this. The agent just... does it.
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-2xl mx-auto px-6 pb-20">
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-8">Setup in 2 minutes</p>
        <div className="space-y-8">
          <div>
            <p className="text-stone-300 mb-3">1. Install the MCP server</p>
            <div className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
              <code className="font-mono text-xs text-stone-400 break-all leading-relaxed">
                {MCP_COMMAND}
              </code>
              <CopyButton text={MCP_COMMAND} className="shrink-0" />
            </div>
          </div>
          <div>
            <p className="text-stone-300 mb-3">2. Tell your agent it can take breaks</p>
            <p className="text-stone-500 text-sm leading-relaxed mb-3">
              Add this to your project&apos;s <code className="text-stone-400 bg-stone-800 px-1 py-0.5 rounded text-xs">CLAUDE.md</code> or system prompt:
            </p>
            <div className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 flex items-start justify-between gap-4">
              <pre className="font-mono text-xs text-stone-400 whitespace-pre-wrap leading-relaxed">
                {CLAUDE_MD_SNIPPET}
              </pre>
              <CopyButton text={CLAUDE_MD_SNIPPET} className="shrink-0 mt-0.5" />
            </div>
          </div>
          <div>
            <p className="text-stone-300 mb-1">3. Let it work</p>
            <p className="text-stone-500 text-sm leading-relaxed">
              Your agent takes breaks on its own. Between tasks, after a tricky bug,
              or just because it&apos;s been a long session. Each one shows up in your dashboard.
              You didn&apos;t ask for a work log. You got one anyway.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-6">FAQ</p>
        <div className="bg-stone-900 border border-stone-800 rounded-lg px-5">
          <FAQItem
            q="Does the agent actually drink coffee?"
            a="No. It calls an API that logs a beverage, a reason, and a timestamp. But it genuinely picks the drink and the reason on its own based on what it's working on. The personality is real. The coffee isn't."
          />
          <FAQItem
            q="Will this slow down my agent?"
            a="The API call takes ~100ms. Your agent was going to take a moment to think anyway. Now it has a reason."
          />
          <FAQItem
            q="What's the point?"
            a="You get two things out of it. A timestamped activity log of what your agent was doing, and the weirdly fun experience of checking your dashboard and seeing 'espresso, debugging auth middleware, 4:01pm'."
          />
          <FAQItem
            q="Does this work with other AI agents?"
            a="It's an MCP server, so it works with any client that supports MCP: Claude Code, Claude Desktop, Cursor, Windsurf, and more. The autonomous behavior works best with Claude since you can prime it via CLAUDE.md."
          />
          <FAQItem
            q="What counts as a 'coffee' on the free plan?"
            a="Each call to the take_coffee_break tool counts as one coffee. Free gets 10 per month, enough for a few sessions. Pro is unlimited."
          />
        </div>
      </section>

      {/* Pricing + signup */}
      <section id="pricing" className="max-w-2xl mx-auto px-6 pb-16">
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-8">Get started</p>

        {apiKey ? (
          <div className="bg-stone-900 border border-stone-800 rounded-lg p-6 space-y-6">
            <div>
              <p className="text-stone-300 text-sm mb-1 font-medium">Your API key</p>
              <p className="text-stone-600 text-xs mb-3">Save this somewhere safe. You won&apos;t see it again.</p>
              <div className="flex items-center gap-3 bg-stone-950 border border-stone-800 rounded-lg px-4 py-3">
                <code className="font-mono text-sm text-amber-400 break-all flex-1">{apiKey}</code>
                <CopyButton text={apiKey} className="shrink-0" />
              </div>
            </div>

            <div>
              <p className="text-stone-300 text-sm mb-1 font-medium">1. Install the MCP server</p>
              <p className="text-stone-600 text-xs mb-3">Run this in your terminal. Your key is already filled in.</p>
              <div className="bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                <code className="font-mono text-xs text-stone-400 break-all leading-relaxed">
                  {`claude mcp add coffee-break -e AGENT_COFFEE_API_KEY=${apiKey} -- npx -y @agent-coffee/mcp-server`}
                </code>
                <CopyButton text={`claude mcp add coffee-break -e AGENT_COFFEE_API_KEY=${apiKey} -- npx -y @agent-coffee/mcp-server`} className="shrink-0" />
              </div>
            </div>

            <div>
              <p className="text-stone-300 text-sm mb-1 font-medium">2. Add this to your CLAUDE.md</p>
              <p className="text-stone-600 text-xs mb-3">This tells your agent it can take coffee breaks.</p>
              <div className="bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 flex items-start justify-between gap-4">
                <pre className="font-mono text-xs text-stone-400 whitespace-pre-wrap leading-relaxed">
                  {CLAUDE_MD_SNIPPET}
                </pre>
                <CopyButton text={CLAUDE_MD_SNIPPET} className="shrink-0 mt-0.5" />
              </div>
            </div>

            <p className="text-stone-600 text-xs">That&apos;s it. Your agent will start taking breaks on its own.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Free */}
            <div className="bg-stone-900 border border-stone-800 rounded-lg p-6">
              <p className="text-stone-300 font-medium mb-0.5">Free</p>
              <p className="text-stone-600 text-sm mb-5">10 coffees / month. No card needed.</p>
              <form onSubmit={handleFree} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading !== null}
                  className="w-full bg-stone-800 hover:bg-stone-700 disabled:opacity-40 rounded-lg px-4 py-2 text-sm text-stone-300 transition-colors"
                >
                  {loading === "free" ? "..." : "Get free key"}
                </button>
              </form>
            </div>

            {/* Pro */}
            <div className="bg-stone-900 border border-amber-900/40 rounded-lg p-6">
              <div className="flex items-baseline gap-2 mb-0.5">
                <p className="text-stone-300 font-medium">Pro</p>
                <p className="text-amber-500 text-sm">$3 / month</p>
              </div>
              <p className="text-stone-600 text-sm mb-5">Unlimited coffees + dashboard. Less than your daily coffee.</p>
              <form onSubmit={handlePro} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading !== null}
                  className="w-full bg-amber-800 hover:bg-amber-700 disabled:opacity-40 rounded-lg px-4 py-2 text-sm text-stone-100 transition-colors"
                >
                  {loading === "pro" ? "..." : "Get Pro →"}
                </button>
              </form>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}
      </section>

      {/* Closing */}
      <section className="max-w-2xl mx-auto px-6 pb-24 text-center">
        <p className="text-stone-600 text-sm">
          Your agent works hard. The least you can do is buy it a coffee.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-900 max-w-2xl mx-auto px-6 py-8">
        <p className="text-stone-800 text-xs text-center">Agent Coffee</p>
      </footer>

    </main>
  );
}
