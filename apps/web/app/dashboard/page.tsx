"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const STORAGE_KEY = "agent_coffee_api_key";

type Entry = {
  beverage: string;
  reason?: string;
  timestamp: string;
};

const BEVERAGE_COLORS: Record<string, string> = {
  coffee:       "text-amber-700",
  espresso:     "text-amber-400",
  matcha:       "text-green-400",
  tea:          "text-emerald-300/80",
  energy_drink: "text-lime-400",
};

type Stats = {
  total_today: number;
  total_month: number;
  recent: Entry[];
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Group entries by date label
function groupByDate(entries: Entry[]): { label: string; items: Entry[] }[] {
  const groups: Map<string, Entry[]> = new Map();
  for (const entry of entries) {
    const label = formatDate(entry.timestamp);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export default function Dashboard() {
  const [keyInput, setKeyInput] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/coffee/stats?limit=100`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load stats.");
      setStats(data);
      setActiveKey(key);
      localStorage.setItem(STORAGE_KEY, key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setActiveKey(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, restore saved key and auto-load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setKeyInput(saved);
      fetchStats(saved);
    }
  }, [fetchStats]);

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (keyInput.trim()) fetchStats(keyInput.trim());
  }

  function handleSignOut() {
    localStorage.removeItem(STORAGE_KEY);
    setActiveKey(null);
    setStats(null);
    setKeyInput("");
  }

  const groups = stats ? groupByDate(stats.recent) : [];

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      <nav className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-stone-400 text-sm font-medium hover:text-stone-200 transition-colors">Agent Coffee</a>
        <div className="flex items-center gap-5 text-sm">
          <a href="/dashboard" className="text-stone-400">Dashboard</a>
          <a href="https://github.com/agent-coffee/agent-coffee" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-400 transition-colors">GitHub</a>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 pt-6 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-stone-500 text-xs tracking-widest uppercase mb-1">Agent Coffee</p>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
          </div>
          {activeKey && (
            <button
              onClick={handleSignOut}
              className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
            >
              Sign out
            </button>
          )}
        </div>

        {/* API key form — shown when not authenticated */}
        {!activeKey && (
          <div className="bg-stone-900 border border-stone-800 rounded-lg p-6">
            <p className="text-stone-400 text-sm mb-4">Enter your API key to view your coffee activity.</p>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                required
                placeholder="sk_free_... or sk_pro_..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm font-mono text-stone-200 placeholder-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-stone-800 hover:bg-stone-700 disabled:opacity-40 rounded-lg px-4 py-2 text-sm text-stone-300 transition-colors shrink-0"
              >
                {loading ? "..." : "View"}
              </button>
            </form>
            {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <>
            <div className="flex gap-4 mb-10">
              <div className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-5 py-4">
                <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">Today</p>
                <p className="text-3xl font-semibold">{stats.total_today}</p>
                <p className="text-stone-600 text-xs mt-0.5">
                  {stats.total_today === 1 ? "coffee" : "coffees"}
                </p>
              </div>
              <div className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-5 py-4">
                <p className="text-stone-500 text-xs uppercase tracking-widest mb-1">This month</p>
                <p className="text-3xl font-semibold">{stats.total_month}</p>
                <p className="text-stone-600 text-xs mt-0.5">
                  {stats.total_month === 1 ? "coffee" : "coffees"}
                </p>
              </div>
            </div>

            {/* Activity log */}
            {groups.length === 0 ? (
              <p className="text-stone-600 text-sm">No coffees yet. Ask your agent to take a break.</p>
            ) : (
              <div className="space-y-8">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="text-stone-600 text-xs uppercase tracking-widest mb-3">{group.label}</p>
                    <div className="bg-stone-900 border border-stone-800 rounded-lg divide-y divide-stone-800">
                      {group.items.map((entry, i) => (
                        <div key={i} className="flex gap-4 px-5 py-3 items-start">
                          <span className="text-stone-600 text-xs font-mono w-12 shrink-0 pt-0.5">
                            {formatTime(entry.timestamp)}
                          </span>
                          <span className={`${BEVERAGE_COLORS[entry.beverage] ?? "text-amber-400/80"} text-sm w-24 shrink-0 pt-0.5`}>{entry.beverage}</span>
                          {entry.reason && (
                            <span className="text-stone-200 text-sm">&ldquo;{entry.reason}&rdquo;</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
