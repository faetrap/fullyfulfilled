"use client";

import { useState } from "react";
import { CharacterData, StatData } from "@/types";
import { todayKey } from "@/lib/constants";
import { overallHealthPct } from "@/lib/tiers";

type Props = {
  character: CharacterData;
  onRefresh: () => void;
  onAllDone: () => void;
};

function DailyHabitItem({
  habit,
  today,
  onToggle,
}: {
  habit: StatData["habits"][number];
  today: string;
  onToggle: (habitId: string) => void;
}) {
  const checkedToday = habit.checkIns.some((c) => c.date === today);

  return (
    <button
      onClick={() => onToggle(habit.id)}
      className="flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-lg transition-all active:scale-[0.98]"
      style={{
        background: checkedToday ? "rgba(22, 163, 74, 0.06)" : "transparent",
      }}
      aria-checked={checkedToday}
      role="checkbox"
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checkedToday ? "animate-check-pop" : ""}`}
        style={{
          background: checkedToday ? "var(--color-success)" : "transparent",
          borderColor: checkedToday ? "var(--color-success)" : "var(--color-border-strong)",
        }}
      >
        {checkedToday && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <span
        className="flex-1 text-sm font-medium"
        style={{
          textDecoration: checkedToday ? "line-through" : "none",
          color: checkedToday ? "var(--color-text-dim)" : "var(--color-text-bright)",
        }}
      >
        {habit.name}
      </span>
    </button>
  );
}

function WeeklyHabitItem({
  habit,
  today,
  onToggle,
}: {
  habit: StatData["habits"][number];
  today: string;
  onToggle: (habitId: string) => void;
}) {
  const checkedToday = habit.checkIns.some((c) => c.date === today);
  const weekCount = habit.checkIns.length;
  const weeklyComplete = weekCount >= habit.weeklyTarget;
  const canTap = !weeklyComplete || checkedToday;

  return (
    <button
      onClick={() => canTap && onToggle(habit.id)}
      className="flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-lg transition-all active:scale-[0.98]"
      style={{
        background: checkedToday ? "rgba(37, 99, 235, 0.06)" : "transparent",
        opacity: !canTap ? 0.5 : 1,
      }}
      aria-checked={checkedToday}
      role="checkbox"
    >
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {Array.from({ length: habit.weeklyTarget }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${i === weekCount - 1 && checkedToday ? "animate-check-pop" : ""}`}
            style={{
              background: i < weekCount ? "var(--color-accent)" : "transparent",
              border: `2px solid ${i < weekCount ? "var(--color-accent)" : "var(--color-border-strong)"}`,
            }}
          />
        ))}
      </div>

      <span
        className="flex-1 text-sm font-medium"
        style={{
          textDecoration: weeklyComplete ? "line-through" : "none",
          color: weeklyComplete ? "var(--color-text-dim)" : "var(--color-text-bright)",
        }}
      >
        {habit.name}
      </span>

      <span
        className="text-xs flex-shrink-0 font-medium"
        style={{ color: weeklyComplete ? "var(--color-success)" : checkedToday ? "var(--color-accent)" : "var(--color-text-dim)" }}
      >
        {weekCount}/{habit.weeklyTarget}{weeklyComplete ? " ✓" : checkedToday ? " +1" : ""}
      </span>
    </button>
  );
}

function AreaSection({
  stat,
  today,
  onToggle,
}: {
  stat: StatData;
  today: string;
  onToggle: (habitId: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [adding, setAdding] = useState(false);

  const pct = Math.round((stat.current / stat.max) * 100);
  const dailyHabits = stat.habits.filter((h) => h.frequency === "DAILY");
  const weeklyHabits = stat.habits.filter((h) => h.frequency === "WEEKLY");
  const completedToday = stat.habits.filter((h) => h.checkIns.some((c) => c.date === today)).length;
  const allDone = stat.habits.length > 0 && completedToday === stat.habits.length;

  async function addHabit() {
    if (!habitName.trim()) return;
    setAdding(true);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: habitName.trim(), statId: stat.id, frequency: "DAILY" }),
    });
    setHabitName("");
    setShowAdd(false);
    setAdding(false);
    onToggle("__refresh__");
  }

  return (
    <div className="animate-fade-in">
      {/* Area header */}
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-bright">{stat.label}</span>
          {allDone && (
            <span className="text-xs" style={{ color: "var(--color-success)" }}>✓</span>
          )}
        </div>
        <span className="text-xs text-text-dim">{pct}%</span>
      </div>

      {/* Mini stat bar */}
      <div className="stat-bar mb-2 mx-1" style={{ height: "3px" }}>
        <div
          className="stat-fill"
          style={{
            width: `${pct}%`,
            background: pct > 60 ? "var(--color-stat-high)" : pct > 30 ? "var(--color-stat-mid)" : "var(--color-stat-low)",
            height: "100%",
          }}
        />
      </div>

      {/* Daily habits */}
      {dailyHabits.length > 0 && (
        <div className="space-y-0.5">
          {dailyHabits.map((habit) => (
            <DailyHabitItem key={habit.id} habit={habit} today={today} onToggle={onToggle} />
          ))}
        </div>
      )}

      {/* Weekly habits */}
      {weeklyHabits.length > 0 && (
        <div className="space-y-0.5 mt-1">
          {dailyHabits.length > 0 && (
            <p className="text-[10px] uppercase tracking-wider text-text-dim px-3 pt-1">Weekly</p>
          )}
          {weeklyHabits.map((habit) => (
            <WeeklyHabitItem key={habit.id} habit={habit} today={today} onToggle={onToggle} />
          ))}
        </div>
      )}

      {/* Add habit inline */}
      {showAdd ? (
        <div className="flex gap-2 mt-2 px-1">
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
            className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-bright)",
            }}
          />
          <button
            onClick={addHabit}
            disabled={adding || !habitName.trim()}
            className="text-sm px-3 py-2 rounded-lg font-medium cursor-pointer disabled:opacity-30"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-1 w-full py-2 rounded-lg text-xs text-text-dim hover:text-accent transition-colors cursor-pointer"
        >
          + Add habit
        </button>
      )}
    </div>
  );
}

export default function TodayView({ character, onRefresh, onAllDone }: Props) {
  const today = todayKey();
  const allHabits = character.stats.flatMap((s) => s.habits);
  const totalToday = allHabits.length;
  const doneToday = allHabits.filter((h) => h.checkIns.some((c) => c.date === today)).length;
  const healthPct = overallHealthPct(character.stats);
  const allComplete = totalToday > 0 && doneToday === totalToday;

  async function handleToggle(habitId: string) {
    if (habitId === "__refresh__") {
      onRefresh();
      return;
    }

    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId }),
    });
    onRefresh();

    // Check if all done after this toggle (optimistic: if we were 1 away)
    if (doneToday === totalToday - 1) {
      setTimeout(() => onAllDone(), 300);
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Day summary */}
      <div className="text-center py-2">
        <p className="text-2xl font-bold text-text-bright">
          {allComplete ? "All done!" : `${doneToday} of ${totalToday}`}
        </p>
        <p className="text-sm text-text-dim mt-0.5">
          {allComplete
            ? "You're on top of it today."
            : `${totalToday - doneToday} habit${totalToday - doneToday === 1 ? "" : "s"} remaining`}
        </p>
        {/* Overall health indicator */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="stat-bar" style={{ width: "120px", height: "4px" }}>
            <div
              className="stat-fill"
              style={{
                width: `${healthPct}%`,
                background: healthPct > 60 ? "var(--color-stat-high)" : healthPct > 30 ? "var(--color-stat-mid)" : "var(--color-stat-low)",
              }}
            />
          </div>
          <span className="text-xs text-text-dim">{healthPct}%</span>
        </div>
      </div>

      {/* Habit sections by area */}
      <div className="space-y-4">
        {character.stats
          .filter((s) => s.habits.length > 0)
          .map((stat) => (
            <AreaSection key={stat.id} stat={stat} today={today} onToggle={handleToggle} />
          ))}
      </div>

      {/* Empty state */}
      {totalToday === 0 && (
        <div className="text-center py-12">
          <p className="text-text-dim text-sm">No habits yet. Add one to get started.</p>
        </div>
      )}
    </div>
  );
}
