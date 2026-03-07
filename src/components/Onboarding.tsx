"use client";

import { useState } from "react";
import { LIFE_AREAS } from "@/lib/constants";

type Props = {
  onComplete: () => void;
};

const STEP_HEADINGS: Record<number, string> = {
  1: "Who are you?",
  2: "What defines you?",
};

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [startingPoint, setStartingPoint] = useState<"living" | "aspiring">("aspiring");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleArea(area: string) {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  async function handleSubmit() {
    if (selectedAreas.length < 3) {
      setError("Pick at least 3 life areas.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, characterClass: "none", selectedAreas, gender }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        return;
      }
      onComplete();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const canContinue = name.trim() && startingPoint;

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center mb-8">
        {[1, 2].map((s) => (
          <div
            key={s}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: s <= step ? "2rem" : "1rem",
              background: s <= step ? "var(--color-accent)" : "var(--color-border)",
            }}
          />
        ))}
      </div>

      <div className="text-center mb-8">
        <h2
          className="text-2xl font-black tracking-widest mb-2"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-bright)" }}
        >
          {STEP_HEADINGS[step]}
        </h2>
      </div>

      {/* Step 1: Name + Gender + Starting Point */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-2"
              style={{ color: "var(--color-text-dim)" }}
            >
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl px-4 py-3 focus:outline-none"
              style={{
                background: "var(--color-bg-card)",
                border: `2px solid var(--color-border)`,
                color: "var(--color-text-bright)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              maxLength={32}
            />
          </div>

          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-3"
              style={{ color: "var(--color-text-dim)" }}
            >
              Your Character
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className="py-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer"
                  style={{
                    borderColor: gender === g ? "var(--color-accent)" : "var(--color-border)",
                    background: gender === g ? "var(--color-bg-card)" : "var(--color-bg-panel)",
                  }}
                >
                  <span className="text-4xl">{g === "male" ? "\u{1F9D1}" : "\u{1F469}"}</span>
                  <span
                    className="text-sm font-semibold capitalize"
                    style={{ color: "var(--color-text-bright)" }}
                  >
                    {g}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block text-xs tracking-widest uppercase mb-3"
              style={{ color: "var(--color-text-dim)" }}
            >
              How do you want to start?
            </label>
            <div className="space-y-3">
              {[
                {
                  id: "aspiring" as const,
                  title: "I'm Building My Ideal Self",
                  subtitle: "Start at 100. Protect what you want to be.",
                },
                {
                  id: "living" as const,
                  title: "I Already Live Like This",
                  subtitle: "Start at 100. Defend what you've built.",
                },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setStartingPoint(option.id)}
                  className="w-full text-left px-5 py-4 rounded-xl border-2 transition-all cursor-pointer"
                  style={{
                    borderColor:
                      startingPoint === option.id ? "var(--color-accent)" : "var(--color-border)",
                    background:
                      startingPoint === option.id ? "var(--color-bg-card)" : "var(--color-bg-panel)",
                  }}
                >
                  <div className="font-semibold mb-0.5" style={{ color: "var(--color-text-bright)" }}>
                    {option.title}
                  </div>
                  <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
                    {option.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canContinue}
            className="w-full font-semibold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Life Areas (with How It Works at top) */}
      {step === 2 && (
        <div className="space-y-4">
          <div
            className="rounded-xl px-4 py-3 text-sm leading-relaxed"
            style={{
              background: "var(--color-bg-card)",
              border: "2px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            <span className="font-semibold" style={{ color: "var(--color-text-bright)" }}>
              How it works:
            </span>{" "}
            Each area becomes a stat. Add habits to keep it alive.
            Miss days and it decays — faster each time. Hit zero and face a consequence.
          </div>

          <p className="text-center text-sm" style={{ color: "var(--color-text-dim)" }}>
            Choose at least 3. These become your stats.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LIFE_AREAS.map((area) => {
              const selected = selectedAreas.includes(area.area);
              return (
                <button
                  key={area.area}
                  onClick={() => toggleArea(area.area)}
                  className="text-left px-4 py-3 rounded-xl border-2 transition-all cursor-pointer"
                  style={{
                    borderColor: selected ? "var(--color-accent)" : "var(--color-border)",
                    background: selected ? "var(--color-bg-card)" : "var(--color-bg-panel)",
                  }}
                >
                  <div className="font-semibold" style={{ color: "var(--color-text-bright)" }}>
                    {area.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-text-dim)" }}>
                    {area.description}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs" style={{ color: "var(--color-text-dim)" }}>
            {selectedAreas.length} selected
            {selectedAreas.length < 3 && ` \u2014 need ${3 - selectedAreas.length} more`}
          </p>

          {error && (
            <p className="text-center text-sm" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border-2 transition-all cursor-pointer"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedAreas.length < 3 || submitting}
              className="flex-[2] font-semibold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              {submitting ? "Creating..." : "Begin"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
