"use client";

import { useState } from "react";
import { LIFE_AREAS } from "@/lib/constants";

type Props = {
  onComplete: () => void;
};

const STEP_HEADINGS: Record<number, string> = {
  1: "Who are you?",
  2: "Where do you stand?",
  3: "What defines you?",
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

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      {/* Progress dots */}
      <div className="flex gap-1.5 justify-center mb-8">
        {[1, 2, 3].map((s) => (
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

      {/* Step 1: Name + Gender */}
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
                  <span className="text-4xl">{g === "male" ? "🧑" : "👩"}</span>
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

          <button
            onClick={() => setStep(2)}
            disabled={!name.trim()}
            className="w-full font-semibold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Starting Point */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-center text-sm mb-6" style={{ color: "var(--color-text-dim)" }}>
            This shapes how your journey begins.
          </p>

          {[
            {
              id: "living" as const,
              title: "I already live like this",
              subtitle: "You're here to defend what you've built.",
            },
            {
              id: "aspiring" as const,
              title: "This is who I want to become",
              subtitle: "Your ideal self is waiting. Let's close the gap.",
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

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border-2 transition-all cursor-pointer"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-[2] font-semibold py-3 rounded-xl transition-all cursor-pointer"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Life Areas */}
      {step === 3 && (
        <div className="space-y-4">
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
            {selectedAreas.length < 3 && ` — need ${3 - selectedAreas.length} more`}
          </p>

          {error && (
            <p className="text-center text-sm" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
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
