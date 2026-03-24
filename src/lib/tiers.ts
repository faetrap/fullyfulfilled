import { StatData } from "@/types";

export type Tier = 1 | 2 | 3 | 4;

export const TIER_LABELS: Record<Tier, string> = {
  1: "Thriving",
  2: "Slipping",
  3: "Struggling",
  4: "Rock Bottom",
};

export const TIER_COLORS: Record<Tier, string> = {
  1: "#16a34a",
  2: "#d97706",
  3: "#ea580c",
  4: "#dc2626",
};

export const TIER_BG: Record<Tier, string> = {
  1: "rgba(22, 163, 74, 0.08)",
  2: "rgba(217, 119, 6, 0.08)",
  3: "rgba(234, 88, 12, 0.08)",
  4: "rgba(220, 38, 38, 0.08)",
};

export function calculateTier(stats: StatData[]): Tier {
  if (stats.length === 0) return 1;
  const avg = stats.reduce((sum, s) => sum + s.current / s.max, 0) / stats.length;
  if (avg > 0.75) return 1;
  if (avg > 0.5) return 2;
  if (avg > 0.25) return 3;
  return 4;
}

export function overallHealthPct(stats: StatData[]): number {
  if (stats.length === 0) return 100;
  return Math.round(
    (stats.reduce((sum, s) => sum + s.current / s.max, 0) / stats.length) * 100
  );
}
