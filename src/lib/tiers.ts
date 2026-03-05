import { StatData } from "@/app/page";

export type Tier = 1 | 2 | 3 | 4;

export const TIER_LABELS: Record<Tier, string> = {
  1: "Thriving",
  2: "Slipping",
  3: "Struggling",
  4: "Rock Bottom",
};

export const TIER_COLORS: Record<Tier, string> = {
  1: "var(--color-tier-1)",
  2: "var(--color-tier-2)",
  3: "var(--color-tier-3)",
  4: "var(--color-tier-4)",
};

export const TIER_BG: Record<Tier, string> = {
  1: "#e8f5ee",
  2: "#fef9e0",
  3: "#fef0e0",
  4: "#fde8e8",
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
