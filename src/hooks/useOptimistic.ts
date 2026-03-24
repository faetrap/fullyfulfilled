"use client";

import { useState, useCallback, useRef } from "react";
import type { HabitData, StatData } from "@/types";

type UseOptimisticReturn = {
  optimisticStats: StatData[];
  toggleCheckIn: (habitId: string, statId: string) => void;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function hasCheckInToday(habit: HabitData): boolean {
  const today = todayISO();
  return habit.checkIns.some((c) => c.date.slice(0, 10) === today);
}

export function useOptimistic(
  stats: StatData[],
  refresh: () => void,
  onError?: (message: string) => void,
): UseOptimisticReturn {
  const [pending, setPending] = useState<
    Map<string, { original: HabitData; toggled: boolean }>
  >(new Map());
  const versionRef = useRef(0);

  const optimisticStats = stats.map((stat) => ({
    ...stat,
    habits: stat.habits.map((habit) => {
      const p = pending.get(habit.id);
      if (!p) return habit;
      const today = todayISO();
      if (p.toggled) {
        // Added a check-in
        const alreadyHas = habit.checkIns.some(
          (c) => c.date.slice(0, 10) === today,
        );
        if (alreadyHas) return habit;
        return {
          ...habit,
          checkIns: [
            ...habit.checkIns,
            { id: `optimistic-${habit.id}`, date: today },
          ],
        };
      } else {
        // Removed a check-in
        return {
          ...habit,
          checkIns: habit.checkIns.filter(
            (c) => c.date.slice(0, 10) !== today,
          ),
        };
      }
    }),
  }));

  const toggleCheckIn = useCallback(
    (habitId: string, statId: string) => {
      const version = ++versionRef.current;

      const stat = stats.find((s) => s.id === statId);
      const habit = stat?.habits.find((h) => h.id === habitId);
      if (!habit) return;

      const isCheckedIn = hasCheckInToday(habit);
      const toggled = !isCheckedIn;

      setPending((prev) => {
        const next = new Map(prev);
        next.set(habitId, { original: habit, toggled });
        return next;
      });

      fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Check-in failed");
          refresh();
        })
        .catch(() => {
          if (versionRef.current === version) {
            onError?.("Check-in failed. Please try again.");
          }
        })
        .finally(() => {
          setPending((prev) => {
            const next = new Map(prev);
            next.delete(habitId);
            return next;
          });
        });
    },
    [stats, refresh, onError],
  );

  return { optimisticStats, toggleCheckIn };
}
