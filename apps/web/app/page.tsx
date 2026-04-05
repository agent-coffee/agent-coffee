"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const MCP_COMMAND = "claude mcp add coffee-break --env AGENT_COFFEE_API_KEY=your_key -- npx -y @agent-coffee/mcp-server";


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

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <p className="text-stone-500 text-xs mb-5 tracking-widest uppercase">Agent Coffee</p>
        <h1 className="text-4xl font-semibold leading-tight mb-6">
          Your AI agents work hard.<br />Buy them a coffee.
        </h1>
        <p className="text-stone-400 text-lg leading-relaxed mb-8">
          An MCP tool that gives Claude one new ability: ordering a coffee.
          Every break is logged with a timestamp and a reason.
          Accidentally useful as an activity log.
        </p>
        <a
          href="#pricing"
          className="inline-block bg-stone-800 hover:bg-stone-700 transition-colors rounded-lg px-5 py-2.5 text-sm text-stone-300"
        >
          Get a key →
        </a>
      </section>

      {/* Demo */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="bg-stone-900 border border-stone-800 rounded-lg p-6 font-mono text-sm">
          <p className="text-stone-600 mb-4 text-xs">Today — 5 coffees</p>
          <div className="space-y-2.5">
            {[
              { time: "2:34pm", drink: "espresso", note: "big refactor ahead" },
              { time: "3:12pm", drink: "matcha",   note: "tests are passing, treating myself" },
              { time: "4:01pm", drink: "coffee",   note: "debugging auth middleware" },
              { time: "4:45pm", drink: "tea",      note: "winding down" },
              { time: "5:30pm", drink: "espresso", note: "one more deploy" },
            ].map((entry) => (
              <div key={entry.time} className="flex gap-4 text-stone-400">
                <span className="text-stone-600 w-12 shrink-0">{entry.time}</span>
                <span className="text-stone-300 w-20 shrink-0">{entry.drink}</span>
                <span className="text-stone-500 truncate">&ldquo;{entry.note}&rdquo;</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-6">How it works</p>
        <div className="space-y-8">
          <div>
            <p className="text-stone-300 mb-3">1. Install the MCP server</p>
            <div className="bg-stone-900 border border-stone-800 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
              <code className="font-mono text-xs text-stone-400 break-all leading-relaxed">
                {MCP_COMMAND}
              </code>
              <CopyButton text={MCP_COMMAND} className="shrink-0" />
            </div>
          </div>
          <div>
            <p className="text-stone-300 mb-1">2. Your agent gets a new tool</p>
            <p className="text-stone-500 text-sm leading-relaxed">
              Claude can now call <code className="text-stone-400 bg-stone-900 px-1 py-0.5 rounded text-xs">take_coffee_break()</code> whenever
              it feels like it. You can also ask it to take one.
            </p>
          </div>
          <div>
            <p className="text-stone-300 mb-1">3. Watch the activity pile up</p>
            <p className="text-stone-500 text-sm leading-relaxed">
              Every break shows up in your dashboard with a timestamp and the
              reason the agent gave. You didn&apos;t ask for a work log. You got one anyway.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing + signup */}
      <section id="pricing" className="max-w-2xl mx-auto px-6 pb-24">
        <p className="text-stone-500 text-xs uppercase tracking-widest mb-8">Get started</p>

        {apiKey ? (
          <div className="bg-stone-900 border border-stone-800 rounded-lg p-6">
            <p className="text-stone-400 text-sm mb-3">Your API key — save this somewhere safe.</p>
            <div className="flex items-center gap-3 bg-stone-950 border border-stone-800 rounded-lg px-4 py-3 mb-4">
              <code className="font-mono text-sm text-amber-400 break-all flex-1">{apiKey}</code>
              <CopyButton text={apiKey} className="shrink-0" />
            </div>
            <p className="text-stone-600 text-xs leading-relaxed">
              Add it to your MCP config as{" "}
              <code className="text-stone-500">AGENT_COFFEE_API_KEY</code>.
              Replace <code className="text-stone-500">your_key</code> in the install command above.
            </p>
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
              <p className="text-stone-600 text-sm mb-5">Unlimited breaks + dashboard. Less than your daily coffee.</p>
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

      {/* Footer */}
      <footer className="border-t border-stone-900 max-w-2xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center text-stone-700 text-sm">
          <span>Agent Coffee</span>
          <div className="flex gap-5">
            <a
              href="/dashboard"
              className="hover:text-stone-400 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="https://github.com/agent-coffee/agent-coffee"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-400 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </main>
  );
}
