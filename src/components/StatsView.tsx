"use client";

import { useState } from "react";
import { CharacterData, StatData } from "@/types";
import { todayKey } from "@/lib/constants";
import { calculateTier, TIER_LABELS, TIER_COLORS, TIER_BG, overallHealthPct } from "@/lib/tiers";

type Props = {
  character: CharacterData;
  onRefresh: () => void;
};

function getStatColor(current: number, max: number): string {
  const pct = current / max;
  if (pct > 0.6) return "var(--color-stat-high)";
  if (pct > 0.3) return "var(--color-stat-mid)";
  return "var(--color-stat-low)";
}

function StatCard({ stat, onRefresh }: { stat: StatData; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((stat.current / stat.max) * 100);
  const today = todayKey();
  const completedToday = stat.habits.filter((h) => h.checkIns.some((c) => c.date === today)).length;
  const hasConsequence = stat.consequence && !stat.consequence.resolvedAt;

  async function deleteHabit(habitId: string) {
    await fetch(`/api/habits?id=${habitId}`, { method: "DELETE" });
    onRefresh();
  }

  async function updateFrequency(habitId: string, frequency: "DAILY" | "WEEKLY") {
    await fetch("/api/habits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: habitId, frequency, weeklyTarget: frequency === "DAILY" ? 7 : 3 }),
    });
    onRefresh();
  }

  async function updateWeeklyTarget(habitId: string, weeklyTarget: number) {
    await fetch("/api/habits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: habitId, weeklyTarget }),
    });
    onRefresh();
  }

  return (
    <div
      className="rounded-lg border p-4 animate-fade-in"
      style={{
        borderColor: hasConsequence ? "var(--color-danger)" : "var(--color-border)",
        background: "var(--color-bg-panel)",
      }}
    >
      {/* Header — tappable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-2 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-bright">{stat.label}</span>
          {hasConsequence && (
            <span className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: getStatColor(stat.current, stat.max) }}>
            {pct}%
          </span>
          <span className="text-xs text-text-dim">
            {completedToday}/{stat.habits.length}
          </span>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            className="transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
          >
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      {/* Stat bar */}
      <div className="stat-bar mb-2">
        <div
          className="stat-fill"
          style={{ width: `${pct}%`, background: getStatColor(stat.current, stat.max) }}
        />
      </div>

      {/* Consequence warning */}
      {hasConsequence && (
        <div
          className="rounded-lg px-3 py-2 mb-3 text-sm animate-scale-in"
          style={{ background: "#fef2f2", border: "1px solid var(--color-danger)", color: "#991b1b" }}
        >
          {stat.consequence!.message}
        </div>
      )}

      {/* Expanded: habit management */}
      {expanded && (
        <div className="space-y-2 mt-3 pt-3 border-t animate-fade-in" style={{ borderColor: "var(--color-border)" }}>
          {stat.habits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-text">{habit.name}</span>
              <select
                value={habit.frequency}
                onChange={(e) => updateFrequency(habit.id, e.target.value as "DAILY" | "WEEKLY")}
                className="text-xs rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-dim)",
                }}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
              </select>
              {habit.frequency === "WEEKLY" && (
                <select
                  value={habit.weeklyTarget}
                  onChange={(e) => updateWeeklyTarget(habit.id, parseInt(e.target.value))}
                  className="text-xs rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-dim)",
                  }}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}x/wk</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => deleteHabit(habit.id)}
                className="text-xs text-text-dim hover:text-danger cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          {stat.habits.length === 0 && (
            <p className="text-xs text-text-dim">No habits in this area yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function StatsView({ character, onRefresh }: Props) {
  const tier = calculateTier(character.stats);
  const healthPct = overallHealthPct(character.stats);
  const tierColor = TIER_COLORS[tier];

  return (
    <div className="animate-fade-in space-y-4">
      {/* Overall summary */}
      <div
        className="rounded-lg border p-5 text-center"
        style={{ borderColor: "var(--color-border)", background: "var(--color-bg-panel)" }}
      >
        <span
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
          style={{ background: TIER_BG[tier], color: tierColor }}
        >
          {TIER_LABELS[tier]}
        </span>
        <p className="text-3xl font-bold text-text-bright mb-1">{healthPct}%</p>
        <p className="text-sm text-text-dim">Overall Health</p>
        <div className="stat-bar mt-3 mx-auto" style={{ maxWidth: "200px" }}>
          <div
            className="stat-fill"
            style={{ width: `${healthPct}%`, background: tierColor }}
          />
        </div>
      </div>

      {/* Per-stat cards */}
      <div className="space-y-3">
        {character.stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}
