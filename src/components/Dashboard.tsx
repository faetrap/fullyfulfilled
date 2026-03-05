"use client";

import { useState } from "react";
import { CharacterData, StatData } from "@/app/page";
import CharacterDisplay from "@/components/CharacterDisplay";

type Props = {
  character: CharacterData;
  onRefresh: () => void;
};

const EVENT_COLORS: Record<string, string> = {
  CONSEQUENCE_TRIGGERED: "var(--color-tier-4)",
  CONSEQUENCE_RESOLVED:  "var(--color-tier-1)",
  HABIT_COMPLETE:        "var(--color-success)",
  DECAY:                 "var(--color-tier-3)",
  LEVEL_UP:              "var(--color-xp)",
};

function getStatColor(current: number, max: number): string {
  const pct = current / max;
  if (pct > 0.75) return "var(--color-tier-1)";
  if (pct > 0.5)  return "var(--color-tier-2)";
  if (pct > 0.25) return "var(--color-tier-3)";
  return "var(--color-tier-4)";
}

function StatCard({ stat, onRefresh }: { stat: StatData; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [adding, setAdding] = useState(false);

  const pct = (stat.current / stat.max) * 100;
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

  async function addHabit() {
    if (!habitName.trim()) return;
    setAdding(true);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: habitName.trim(), statId: stat.id }),
    });
    setHabitName("");
    setShowAdd(false);
    setAdding(false);
    onRefresh();
  }

  return (
    <div
      className={`rounded-xl p-4 border-2 transition-all ${hasConsequence ? "animate-pulse-warn" : ""}`}
      style={{
        background: "var(--color-bg-panel)",
        borderColor: hasConsequence ? "var(--color-warning)" : "var(--color-border)",
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold" style={{ color: "var(--color-text-bright)" }}>
          {stat.label}
        </span>
        <span
          style={{ fontFamily: "var(--font-pixel)", fontSize: "8px", color: "var(--color-text-dim)" }}
        >
          {stat.current}/{stat.max}
        </span>
      </div>

      <div className="stat-bar mb-4">
        <div
          className="stat-fill"
          style={{ width: `${pct}%`, background: getStatColor(stat.current, stat.max) }}
        />
      </div>

      {hasConsequence && (
        <div
          className="rounded-lg px-3 py-2 mb-4 text-sm"
          style={{
            background: "#fef3e0",
            border: "1px solid var(--color-warning)",
            color: "#7a4a10",
          }}
        >
          {stat.consequence!.message}
        </div>
      )}

      <div className="space-y-2">
        {stat.habits.map((habit) => {
          const done = habit.checkIns.length > 0;
          return (
            <div key={habit.id} className="flex items-center gap-2 group">
              <button
                onClick={() => toggleCheckIn(habit.id)}
                className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 text-xs transition-all cursor-pointer"
                style={{
                  background: done ? "var(--color-tier-1)" : "transparent",
                  borderColor: done ? "var(--color-tier-1)" : "var(--color-border)",
                  color: "white",
                }}
              >
                {done ? "✓" : ""}
              </button>
              <span
                className="flex-1 text-sm"
                style={{
                  textDecoration: done ? "line-through" : "none",
                  color: done ? "var(--color-text-dim)" : "var(--color-text)",
                }}
              >
                {habit.name}
              </span>
              <button
                onClick={() => deleteHabit(habit.id)}
                className="opacity-0 group-hover:opacity-100 text-xs transition-all cursor-pointer"
                style={{ color: "var(--color-text-dim)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-danger)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-dim)")}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {showAdd ? (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()}
            placeholder="Habit name..."
            className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-bright)",
            }}
          />
          <button
            onClick={addHabit}
            disabled={adding || !habitName.trim()}
            className="text-sm px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            Add
          </button>
          <button
            onClick={() => { setShowAdd(false); setHabitName(""); }}
            className="text-sm px-2 cursor-pointer"
            style={{ color: "var(--color-text-dim)" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-3 text-xs transition-colors cursor-pointer"
          style={{ color: "var(--color-text-dim)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-dim)")}
        >
          + add habit
        </button>
      )}
    </div>
  );
}

export default function Dashboard({ character, onRefresh }: Props) {
  return (
    <div className="animate-fade-in space-y-8">
      <CharacterDisplay character={character} />

      <div>
        <h2
          className="text-xs tracking-widest uppercase mb-3"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-dim)" }}
        >
          Life Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {character.stats.map((stat) => (
            <StatCard key={stat.id} stat={stat} onRefresh={onRefresh} />
          ))}
        </div>
      </div>

      {character.events.length > 0 && (
        <div>
          <h3
            className="text-xs tracking-widest uppercase mb-3"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-dim)" }}
          >
            Chronicle
          </h3>
          <div
            className="rounded-xl border p-4 space-y-2"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg-panel)",
            }}
          >
            {character.events.slice(0, 10).map((event) => (
              <p
                key={event.id}
                className="text-sm"
                style={{ color: EVENT_COLORS[event.type] ?? "var(--color-text-dim)" }}
              >
                {event.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
