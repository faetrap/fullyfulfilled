"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { CharacterData } from "@/types";

type Props = {
  character: CharacterData;
  onRefresh: () => void;
};

export default function SettingsView({ character, onRefresh }: Props) {
  const { signOut } = useClerk();
  const [vacationMode, setVacationMode] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function toggleVacation() {
    setToggling(true);
    try {
      await fetch("/api/vacation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacationMode: !vacationMode }),
      });
      setVacationMode(!vacationMode);
      onRefresh();
    } catch {
      // API may not exist yet (Stream B)
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center py-2">
        <p className="text-lg font-semibold text-text-bright">{character.name}</p>
        <p className="text-sm text-text-dim">Settings</p>
      </div>

      {/* Vacation Mode */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--color-border)", background: "var(--color-bg-panel)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-text-bright text-sm">Vacation Mode</p>
            <p className="text-xs text-text-dim mt-0.5">
              Pause decay while you're away. No penalties.
            </p>
          </div>
          <button
            onClick={toggleVacation}
            disabled={toggling}
            className="relative w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            style={{
              background: vacationMode ? "var(--color-accent)" : "var(--color-border-strong)",
            }}
            role="switch"
            aria-checked={vacationMode}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
              style={{
                left: vacationMode ? "calc(100% - 22px)" : "2px",
              }}
            />
          </button>
        </div>
      </div>

      {/* Habit Management Info */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--color-border)", background: "var(--color-bg-panel)" }}
      >
        <p className="font-medium text-text-bright text-sm mb-2">Your Habits</p>
        <div className="space-y-1">
          {character.stats.map((stat) => (
            <div key={stat.id} className="flex justify-between text-sm">
              <span className="text-text-dim">{stat.label}</span>
              <span className="text-text">{stat.habits.length} habit{stat.habits.length !== 1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-dim mt-3">
          Manage habits from the Stats tab — tap a stat to expand.
        </p>
      </div>

      {/* Sign Out */}
      <button
        onClick={() => signOut()}
        className="w-full py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-danger)",
          background: "transparent",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
