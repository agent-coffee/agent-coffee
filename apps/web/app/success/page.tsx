"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const CLAUDE_MD_SNIPPET = `# Coffee Breaks

Every coder needs a coffee break, and so do you.
Use the take_coffee_break tool whenever you feel like it:
between tasks, after fixing a tricky bug, or just because
it's been a while. Pick whatever you're feeling — coffee,
espresso, matcha, tea, or an energy drink. Say why.
You've earned it.`;

function mcpCommand(key: string) {
  return `claude mcp add coffee-break -e AGENT_COFFEE_API_KEY=${key} -- npx -y @agent-coffee/mcp-server`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={`text-xs px-2 py-1 rounded transition-colors shrink-0 ${
        copied
          ? "bg-green-800/50 text-green-400"
          : "bg-stone-700 hover:bg-stone-600 text-stone-400 hover:text-stone-200"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session found. If you completed payment, email hello@agent-coffee.com and we'll send your key.");
      return;
    }

    let attempts = 0;
    const maxAttempts = 8;

    async function poll() {
      attempts++;
      try {
        const res = await fetch(`${API_URL}/checkout/session/${sessionId}`);
        const data = await res.json();

        if (res.ok) {
          setApiKey(data.api_key);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError("Couldn't retrieve your key. Email hello@agent-coffee.com and we'll sort it out.");
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError("Something went wrong. Email hello@agent-coffee.com.");
        }
      }
    }

    poll();
  }, [sessionId]);

  if (!apiKey && !error) {
    return (
      <section className="max-w-2xl mx-auto px-6 pt-24">
        <p className="text-stone-500 text-xs mb-5 tracking-widest uppercase">Agent Coffee — Pro</p>
        <h1 className="text-3xl font-semibold mb-4">Setting up your account...</h1>
        <p className="text-stone-500">Give us a second.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="max-w-2xl mx-auto px-6 pt-24">
        <p className="text-stone-500 text-xs mb-5 tracking-widest uppercase">Agent Coffee — Pro</p>
        <h1 className="text-3xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-stone-400">{error}</p>
      </section>
    );
  }

  const cmd = mcpCommand(apiKey!);

  return (
    <section className="max-w-2xl mx-auto px-6 pt-24 pb-16">
      <p className="text-stone-500 text-xs mb-5 tracking-widest uppercase">Agent Coffee — Pro</p>
      <h1 className="text-3xl font-semibold mb-3">You&apos;re on Pro.</h1>
      <p className="text-stone-400 mb-10">Unlimited coffees. Save your API key somewhere safe.</p>

      <div className="space-y-6">
        <div>
          <p className="text-stone-500 text-xs uppercase tracking-widest mb-3">Your API key</p>
          <div className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-lg px-4 py-3">
            <code className="font-mono text-sm text-amber-400 break-all flex-1">{apiKey}</code>
            <CopyButton text={apiKey!} />
          </div>
        </div>

        <div>
          <p className="text-stone-500 text-xs uppercase tracking-widest mb-3">Install command</p>
          <div className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-lg px-4 py-3">
            <code className="font-mono text-xs text-stone-400 break-all flex-1 leading-relaxed">{cmd}</code>
            <CopyButton text={cmd} />
          </div>
        </div>

        <div>
          <p className="text-stone-500 text-xs uppercase tracking-widest mb-3">Add to your CLAUDE.md</p>
          <div className="flex items-start gap-3 bg-stone-900 border border-stone-800 rounded-lg px-4 py-3">
            <pre className="font-mono text-xs text-stone-400 whitespace-pre-wrap leading-relaxed flex-1">{CLAUDE_MD_SNIPPET}</pre>
            <CopyButton text={CLAUDE_MD_SNIPPET} />
          </div>
        </div>

        <p className="text-stone-600 text-sm">
          That&apos;s it. Your agent will start taking breaks on its own.
        </p>
      </div>
    </section>
  );
}

export default function Success() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <nav className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-stone-400 text-sm font-medium hover:text-stone-200 transition-colors">Agent Coffee</a>
        <div className="flex items-center gap-5 text-sm">
          <a href="/dashboard" className="text-stone-600 hover:text-stone-400 transition-colors">Dashboard</a>
          <a href="https://github.com/agent-coffee/agent-coffee" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-400 transition-colors">GitHub</a>
        </div>
      </nav>
      <Suspense
        fallback={
          <section className="max-w-2xl mx-auto px-6 pt-24">
            <p className="text-stone-500 text-xs mb-5 tracking-widest uppercase">Agent Coffee — Pro</p>
            <h1 className="text-3xl font-semibold mb-4">Setting up your account...</h1>
          </section>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  );
}
