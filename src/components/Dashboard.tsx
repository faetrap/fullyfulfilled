"use client";

import { useState } from "react";
import { CharacterData, StatData } from "@/app/page";
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

function StatSection({ stat, onRefresh }: { stat: StatData; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitFreq, setHabitFreq] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [adding, setAdding] = useState(false);

  const pct = (stat.current / stat.max) * 100;
  const today = todayKey();
  const completedToday = stat.habits.filter((h) => h.checkIns.some((c) => c.date === today)).length;
  const hasConsequence = stat.consequence && !stat.consequence.resolvedAt;

  async function toggleCheckIn(habitId: string) {
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId }),
    });
    onRefresh();
  }

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

  async function addHabit() {
    if (!habitName.trim()) return;
    setAdding(true);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: habitName.trim(), statId: stat.id, frequency: habitFreq }),
    });
    setHabitName("");
    setHabitFreq("DAILY");
    setShowAdd(false);
    setAdding(false);
    onRefresh();
  }

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: hasConsequence ? "var(--color-danger)" : "var(--color-border)",
        background: "var(--color-bg-panel)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-text-bright">{stat.label}</span>
        <span className="text-xs text-text-dim">
          {stat.habits.length > 0 && `${completedToday}/${stat.habits.length}`}
          {" \u00B7 "}
          {stat.current}/{stat.max}
        </span>
      </div>

      {/* Stat bar */}
      <div className="stat-bar mb-3">
        <div
          className="stat-fill"
          style={{ width: `${pct}%`, background: getStatColor(stat.current, stat.max) }}
        />
      </div>

      {/* Consequence warning */}
      {hasConsequence && (
        <div
          className="rounded px-3 py-2 mb-3 text-sm"
          style={{ background: "#fef2f2", border: "1px solid var(--color-danger)", color: "#991b1b" }}
        >
          {stat.consequence!.message}
        </div>
      )}

      {/* Habits */}
      <div className="space-y-1.5">
        {stat.habits.map((habit) => {
          const checkedToday = habit.checkIns.some((c) => c.date === today);
          const weekCount = habit.checkIns.length;
          const isWeekly = habit.frequency === "WEEKLY";
          const done = checkedToday;
          return (
            <div key={habit.id} className="flex items-center gap-2 group">
              {isWeekly ? (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {Array.from({ length: habit.weeklyTarget }).map((_, i) => {
                    // Clickable: next empty dot (to add) or last filled dot if checked today (to undo)
                    const isNextEmpty = i === weekCount;
                    const isLastFilled = checkedToday && i === weekCount - 1;
                    const clickable = isNextEmpty || isLastFilled;
                    return (
                      <button
                        key={i}
                        onClick={clickable ? () => toggleCheckIn(habit.id) : undefined}
                        className="w-3 h-3 rounded-full border transition-all"
                        style={{
                          background: i < weekCount ? "var(--color-accent)" : "transparent",
                          borderColor: i < weekCount ? "var(--color-accent)" : "var(--color-border-strong)",
                          cursor: clickable ? "pointer" : "default",
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <button
                  onClick={() => toggleCheckIn(habit.id)}
                  className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 text-xs transition-all cursor-pointer"
                  style={{
                    background: done ? "var(--color-accent)" : "transparent",
                    borderColor: done ? "var(--color-accent)" : "var(--color-border-strong)",
                    color: "white",
                  }}
                >
                  {done ? "\u2713" : ""}
                </button>
              )}
              <span
                className="flex-1 text-sm"
                style={{
                  textDecoration: !isWeekly && done ? "line-through" : "none",
                  color: (!isWeekly && done) || (isWeekly && weekCount >= habit.weeklyTarget) ? "var(--color-text-dim)" : "var(--color-text)",
                }}
              >
                {habit.name}
              </span>
              <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <select
                  value={habit.frequency}
                  onChange={(e) => updateFrequency(habit.id, e.target.value as "DAILY" | "WEEKLY")}
                  className="text-xs rounded px-1 py-0.5 cursor-pointer focus:outline-none"
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
                    className="text-xs rounded px-1 py-0.5 cursor-pointer focus:outline-none"
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
              </span>
              <button
                onClick={() => deleteHabit(habit.id)}
                className="opacity-0 group-hover:opacity-100 text-xs transition-opacity cursor-pointer text-text-dim hover:text-danger"
              >
                &#10005;
              </button>
            </div>
          );
        })}
      </div>

      {/* Add habit */}
      {showAdd ? (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addHabit();
              if (e.key === "Escape") { setShowAdd(false); setHabitName(""); }
            }}
            placeholder="New habit..."
            className="flex-1 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-bright)",
            }}
          />
          <select
            value={habitFreq}
            onChange={(e) => setHabitFreq(e.target.value as "DAILY" | "WEEKLY")}
            className="text-sm rounded px-2 py-1.5 cursor-pointer focus:outline-none"
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-dim)",
            }}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
          <button
            onClick={addHabit}
            disabled={adding || !habitName.trim()}
            className="text-sm px-3 py-1.5 rounded font-medium cursor-pointer disabled:opacity-30"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-3 w-full py-1.5 rounded border border-dashed text-xs text-text-dim hover:text-accent hover:border-accent transition-colors cursor-pointer"
          style={{ borderColor: "var(--color-border)" }}
        >
          + Add habit
        </button>
      )}
    </div>
  );
}

export default function Dashboard({ character, onRefresh }: Props) {
  const today = todayKey();
  const allHabits = character.stats.flatMap((s) => s.habits);
  const totalToday = allHabits.length;
  const doneToday = allHabits.filter((h) => h.checkIns.some((c) => c.date === today)).length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary */}
      {(() => {
        const tier = calculateTier(character.stats);
        const healthPct = overallHealthPct(character.stats);
        const tierColor = TIER_COLORS[tier];
        return (
          <div
            className="rounded-lg border p-4"
            style={{ borderColor: "var(--color-border)", background: "var(--color-bg-panel)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-text-bright">{character.name}</h2>
                {totalToday > 0 && (
                  <p className="text-sm text-text-dim">
                    {doneToday === totalToday
                      ? "All done for today"
                      : `${doneToday} of ${totalToday} habits done today`}
                  </p>
                )}
              </div>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: TIER_BG[tier], color: tierColor }}
              >
                {TIER_LABELS[tier]}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="stat-bar flex-1">
                <div
                  className="stat-fill"
                  style={{ width: `${healthPct}%`, background: tierColor }}
                />
              </div>
              <span className="text-xs text-text-dim">{healthPct}%</span>
            </div>
          </div>
        );
      })()}

      {/* Stats */}
      <div className="space-y-3">
        {character.stats.map((stat) => (
          <StatSection key={stat.id} stat={stat} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}
