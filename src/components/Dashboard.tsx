"use client";

import { useState, useRef, useEffect } from "react";
import { CharacterData, StatData } from "@/app/page";
import CharacterDisplay from "@/components/CharacterDisplay";
import { todayKey } from "@/lib/constants";

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

const EVENT_AREA_COLORS: Record<string, string> = {
  CONSEQUENCE_TRIGGERED: "var(--color-tier-4)",
  CONSEQUENCE_RESOLVED:  "var(--color-tier-1)",
  HABIT_COMPLETE:        "var(--color-tier-1)",
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

function getStatStatus(current: number, max: number): string {
  const pct = current / max;
  if (pct >= 1)    return "protected";
  if (pct > 0.75)  return "recovering";
  if (pct > 0.5)   return "slipping";
  if (pct > 0.25)  return "struggling";
  if (pct > 0)     return "critical";
  return "collapsed";
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  return `${diffDay}d ago`;
}

function StatAccordion({ stat, onRefresh, defaultOpen }: { stat: StatData; onRefresh: () => void; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAdd, setShowAdd] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitFreq, setHabitFreq] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [adding, setAdding] = useState(false);

  const pct = (stat.current / stat.max) * 100;
  const hasConsequence = stat.consequence && !stat.consequence.resolvedAt;
  const status = getStatStatus(stat.current, stat.max);

  const today = todayKey();
  const todayHabits = stat.habits.filter((h) => h.frequency === "DAILY" || h.frequency === "WEEKLY");
  const completedToday = todayHabits.filter((h) => h.checkIns.some((c) => c.date === today)).length;

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
      body: JSON.stringify({ id: habitId, frequency }),
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
      className={`rounded-xl border-2 transition-all ${hasConsequence ? "animate-pulse-warn" : ""}`}
      style={{
        background: "var(--color-bg-panel)",
        borderColor: hasConsequence ? "var(--color-warning)" : "var(--color-border)",
      }}
    >
      {/* Accordion header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs transition-transform"
            style={{
              color: "var(--color-text-dim)",
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            {"\u25B6"}
          </span>
          <span className="font-semibold" style={{ color: "var(--color-text-bright)" }}>
            {stat.label}
          </span>
          {todayHabits.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={{
                background: completedToday === todayHabits.length ? "var(--color-tier-1)" : "var(--color-bg-card)",
                color: completedToday === todayHabits.length ? "white" : "var(--color-text-dim)",
                fontSize: "10px",
              }}
            >
              {completedToday}/{todayHabits.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs"
            style={{ color: "var(--color-text-dim)" }}
          >
            {status}
          </span>
          <span
            style={{ fontFamily: "var(--font-pixel)", fontSize: "8px", color: "var(--color-text-dim)" }}
          >
            {stat.current}/{stat.max}
          </span>
        </div>
      </button>

      {/* Stat bar (always visible) */}
      <div className="px-4 pb-3">
        <div className="stat-bar">
          <div
            className="stat-fill"
            style={{ width: `${pct}%`, background: getStatColor(stat.current, stat.max) }}
          />
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {hasConsequence && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: "#fef3e0",
                border: "1px solid var(--color-warning)",
                color: "#7a4a10",
              }}
            >
              {stat.consequence!.message}
            </div>
          )}

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
                  {done ? "\u2713" : ""}
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
                <select
                  value={habit.frequency}
                  onChange={(e) => updateFrequency(habit.id, e.target.value as "DAILY" | "WEEKLY")}
                  className="text-xs rounded-md px-1.5 py-0.5 cursor-pointer focus:outline-none"
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-dim)",
                    fontSize: "10px",
                  }}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs transition-all cursor-pointer"
                  style={{ color: "var(--color-text-dim)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-danger)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-dim)")}
                >
                  \u2715
                </button>
              </div>
            );
          })}

          {showAdd ? (
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
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
                <select
                  value={habitFreq}
                  onChange={(e) => setHabitFreq(e.target.value as "DAILY" | "WEEKLY")}
                  className="text-sm rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none"
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-dim)",
                  }}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
              <div className="flex gap-2">
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
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-1 text-xs transition-colors cursor-pointer"
              style={{ color: "var(--color-text-dim)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-dim)")}
            >
              + add habit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FeedSection({ character }: { character: CharacterData }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set(["ALL"]));
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const areaLabels = character.stats.map((s) => ({ area: s.area, label: s.label }));

  function toggleFilter(area: string) {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      if (area === "ALL") {
        return new Set(["ALL"]);
      }
      next.delete("ALL");
      if (next.has(area)) {
        next.delete(area);
      } else {
        next.add(area);
      }
      if (next.size === 0) return new Set(["ALL"]);
      return next;
    });
  }

  function getEventArea(message: string): string | null {
    for (const stat of character.stats) {
      if (message.toLowerCase().includes(stat.label.toLowerCase())) {
        return stat.area;
      }
    }
    return null;
  }

  const filteredEvents = character.events.filter((event) => {
    if (selectedAreas.has("ALL")) return true;
    const area = getEventArea(event.message);
    return area && selectedAreas.has(area);
  });

  const filterLabel = selectedAreas.has("ALL")
    ? "All"
    : Array.from(selectedAreas).map((a) => areaLabels.find((l) => l.area === a)?.label || a).join(", ");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-xs tracking-widest uppercase"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-dim)" }}
        >
          Feed
        </h3>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="text-xs px-2.5 py-1 rounded-lg border cursor-pointer flex items-center gap-1"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-dim)",
            }}
          >
            {filterLabel} {"\u25BE"}
          </button>
          {filterOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-lg border shadow-lg z-10 min-w-[140px]"
              style={{
                background: "var(--color-bg-panel)",
                borderColor: "var(--color-border)",
              }}
            >
              <label
                className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:opacity-80"
                style={{ color: "var(--color-text)" }}
              >
                <input
                  type="checkbox"
                  checked={selectedAreas.has("ALL")}
                  onChange={() => toggleFilter("ALL")}
                  className="cursor-pointer"
                />
                All
              </label>
              {areaLabels.map(({ area, label }) => (
                <label
                  key={area}
                  className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:opacity-80"
                  style={{ color: "var(--color-text)" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAreas.has(area)}
                    onChange={() => toggleFilter(area)}
                    className="cursor-pointer"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-xl border p-4 space-y-3"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-bg-panel)",
        }}
      >
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-center" style={{ color: "var(--color-text-dim)" }}>
            No activity yet.
          </p>
        ) : (
          filteredEvents.slice(0, 15).map((event) => {
            const area = getEventArea(event.message);
            const areaLabel = area ? areaLabels.find((l) => l.area === area)?.label : null;
            return (
              <div key={event.id} className="flex items-start gap-2">
                <span
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{
                    background: EVENT_AREA_COLORS[event.type] ?? "var(--color-text-dim)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    {areaLabel && (
                      <span
                        className="text-xs font-semibold flex-shrink-0"
                        style={{ color: EVENT_COLORS[event.type] ?? "var(--color-text-dim)" }}
                      >
                        {areaLabel}
                      </span>
                    )}
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {timeAgo(event.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--color-text)" }}>
                    {event.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Dashboard({ character, onRefresh }: Props) {
  const today = todayKey();
  const allHabits = character.stats.flatMap((s) => s.habits);
  const totalToday = allHabits.length;
  const doneToday = allHabits.filter((h) => h.checkIns.some((c) => c.date === today)).length;

  return (
    <div className="animate-fade-in space-y-8">
      <CharacterDisplay character={character} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-xs tracking-widest uppercase"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-dim)" }}
          >
            Life Stats
          </h2>
          {totalToday > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-md"
              style={{
                background: doneToday === totalToday ? "var(--color-tier-1)" : "var(--color-bg-card)",
                color: doneToday === totalToday ? "white" : "var(--color-text-dim)",
                fontFamily: "var(--font-pixel)",
                fontSize: "8px",
              }}
            >
              {doneToday}/{totalToday} today
            </span>
          )}
        </div>
        <div className="space-y-3">
          {character.stats.map((stat, i) => (
            <StatAccordion
              key={stat.id}
              stat={stat}
              onRefresh={onRefresh}
              defaultOpen={i < 2}
            />
          ))}
        </div>
      </div>

      {character.events.length > 0 && (
        <FeedSection character={character} />
      )}
    </div>
  );
}
