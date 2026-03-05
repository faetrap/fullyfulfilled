"use client";

import { CharacterData } from "@/app/page";
import { calculateTier, TIER_LABELS, TIER_COLORS, TIER_BG, overallHealthPct, Tier } from "@/lib/tiers";

type Props = {
  character: CharacterData;
};

const TIER_EXPRESSIONS: Record<Tier, string> = {
  1: "( ◕‿◕ )",
  2: "( ·_·  )",
  3: "( ；_；)",
  4: "( ×_×  )",
};

const TIER_OPACITIES: Record<Tier, number> = {
  1: 1,
  2: 0.9,
  3: 0.75,
  4: 0.6,
};

const GENDER_COLORS: Record<string, { primary: string; secondary: string }> = {
  male:   { primary: "#2980b9", secondary: "#3498db" },
  female: { primary: "#8e44ad", secondary: "#9b59b6" },
};

export default function CharacterDisplay({ character }: Props) {
  const tier = calculateTier(character.stats);
  const healthPct = overallHealthPct(character.stats);
  const tierColor = TIER_COLORS[tier];
  const tierBg = TIER_BG[tier];
  const expression = TIER_EXPRESSIONS[tier];
  const classColors = GENDER_COLORS[character.gender] ?? { primary: "#c07a3a", secondary: "#d4854a" };
  const figureOpacity = TIER_OPACITIES[tier];

  return (
    <div
      className="rounded-2xl border-2 p-6 flex flex-col items-center gap-4 transition-all"
      style={{ background: tierBg, borderColor: tierColor }}
    >
      {/* CSS character figure */}
      <div
        className="flex flex-col items-center"
        style={{ opacity: figureOpacity, transition: "opacity 0.8s ease" }}
      >
        {/* Head */}
        <div
          className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
          style={{
            background: classColors.secondary,
            borderColor: classColors.primary,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "7px",
              color: "white",
              letterSpacing: "-0.5px",
            }}
          >
            {expression}
          </span>
        </div>

        {/* Body */}
        <div
          className="w-12 h-14 rounded-b-xl mt-1"
          style={{ background: classColors.primary }}
        />

        {/* Decay cracks at tier 3-4 */}
        {tier >= 3 && (
          <div
            className="absolute w-1 h-20 rounded opacity-10 rotate-12 pointer-events-none"
            style={{ background: "black", marginTop: "-3.5rem" }}
          />
        )}
      </div>

      {/* Name + class */}
      <div className="text-center">
        <p
          className="font-bold text-xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-bright)" }}
        >
          {character.name}
        </p>
        <p className="text-sm capitalize mt-0.5" style={{ color: "var(--color-text-dim)" }}>
          {character.gender}
        </p>
      </div>

      {/* Tier badge */}
      <div
        className="px-4 py-1.5 rounded-full text-white"
        style={{
          background: tierColor,
          fontFamily: "var(--font-pixel)",
          fontSize: "8px",
        }}
      >
        {TIER_LABELS[tier]}
      </div>

      {/* Overall vitality bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--color-text-dim)" }}>
          <span>Overall Vitality</span>
          <span style={{ fontFamily: "var(--font-pixel)", fontSize: "8px" }}>{healthPct}%</span>
        </div>
        <div className="stat-bar">
          <div
            className="stat-fill"
            style={{ width: `${healthPct}%`, background: tierColor }}
          />
        </div>
      </div>
    </div>
  );
}
