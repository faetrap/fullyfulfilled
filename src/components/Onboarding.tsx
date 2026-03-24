"use client";

import { useState } from "react";
import { LIFE_AREAS } from "@/lib/constants";

type Props = {
  onComplete: () => void;
};

type HabitDraft = {
  name: string;
  frequency: "DAILY" | "WEEKLY";
  weeklyTarget: number;
  areaKey: string;
};

const SUGGESTED_HABITS: Record<string, string[]> = {
  HEALTH: ["Exercise 30 minutes", "Drink 8 glasses of water", "Sleep by 11pm"],
  KNOWLEDGE: ["Read 20 pages", "Practice a skill", "Watch something educational"],
  SOCIAL: ["Call a friend", "Check in on someone", "Meet someone new"],
  CREATIVITY: ["Write for 15 minutes", "Draw or sketch", "Work on a project"],
  FINANCE: ["Review spending", "Save something", "Track expenses"],
};

const HABIT_SOFT_CAP = 8;

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [habitDrafts, setHabitDrafts] = useState<HabitDraft[]>([]);
  const [newHabitInputs, setNewHabitInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");

  function goForward(nextStep: number) {
    setSlideDir("right");
    setStep(nextStep);
  }

  function goBack(prevStep: number) {
    setSlideDir("left");
    setStep(prevStep);
  }

  function toggleArea(area: string) {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function addSuggested(areaKey: string, habitName: string) {
    // Don't add if already exists
    if (habitDrafts.some((h) => h.areaKey === areaKey && h.name === habitName)) return;
    setHabitDrafts((prev) => [...prev, { name: habitName, frequency: "DAILY", weeklyTarget: 3, areaKey }]);
  }

  function addHabitDraft(areaKey: string) {
    const input = newHabitInputs[areaKey]?.trim();
    if (!input) return;
    setHabitDrafts((prev) => [...prev, { name: input, frequency: "DAILY", weeklyTarget: 3, areaKey }]);
    setNewHabitInputs((prev) => ({ ...prev, [areaKey]: "" }));
  }

  function removeHabitDraft(index: number) {
    setHabitDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHabitFreq(index: number, freq: "DAILY" | "WEEKLY") {
    setHabitDrafts((prev) => prev.map((h, i) => i === index ? { ...h, frequency: freq, weeklyTarget: freq === "DAILY" ? 7 : 3 } : h));
  }

  function updateWeeklyTarget(index: number, target: number) {
    setHabitDrafts((prev) => prev.map((h, i) => i === index ? { ...h, weeklyTarget: target } : h));
  }

  async function handleSubmit() {
    if (habitDrafts.length === 0) {
      setError("Add at least one habit to get started.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "You", selectedAreas }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      const { character } = await res.json();

      for (const draft of habitDrafts) {
        const stat = character.stats.find((s: { area: string }) => s.area === draft.areaKey);
        if (stat) {
          await fetch("/api/habits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: draft.name, statId: stat.id, frequency: draft.frequency, weeklyTarget: draft.weeklyTarget }),
          });
        }
      }

      onComplete();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalSteps = 4;
  const selectedAreaObjects = LIFE_AREAS.filter((a) => selectedAreas.includes(a.area));
  const animClass = slideDir === "right" ? "animate-slide-right" : "animate-slide-left";

  return (
    <div className="max-w-md mx-auto">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full flex-1 transition-all duration-300"
            style={{
              background: i + 1 <= step ? "var(--color-accent)" : "var(--color-border)",
            }}
          />
        ))}
      </div>

      {/* Step 1: Name (optional) */}
      {step === 1 && (
        <div className={`space-y-6 ${animClass}`} key="step-1">
          <div>
            <h2 className="text-xl font-semibold text-text-bright mb-1">What should we call you?</h2>
            <p className="text-sm text-text-dim">Optional — you can skip this.</p>
          </div>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            style={{
              background: "var(--color-bg-panel)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-bright)",
            }}
            maxLength={32}
            onKeyDown={(e) => e.key === "Enter" && goForward(2)}
          />
          <div className="flex gap-3">
            <button
              onClick={() => goForward(2)}
              className="flex-1 py-2.5 rounded-lg border transition-colors cursor-pointer text-sm"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)" }}
            >
              Skip
            </button>
            <button
              onClick={() => goForward(2)}
              disabled={!name.trim()}
              className="flex-[2] font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: How it works (decay explainer) */}
      {step === 2 && (
        <div className={`space-y-6 ${animClass}`} key="step-2">
          <div>
            <h2 className="text-xl font-semibold text-text-bright mb-1">Here's how it works</h2>
            <p className="text-sm text-text-dim">A quick look at the system.</p>
          </div>

          <div className="space-y-3">
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--color-bg-panel)", border: "1px solid var(--color-border)" }}
            >
              <p className="font-medium text-text-bright text-sm mb-1">Build habits, grow your stats</p>
              <p className="text-xs text-text-dim leading-relaxed">
                Every habit you complete heals the stat it belongs to. The more consistent you are, the healthier your stats become.
              </p>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ background: "var(--color-bg-panel)", border: "1px solid var(--color-border)" }}
            >
              <p className="font-medium text-text-bright text-sm mb-1">Miss habits, stats decay</p>
              <p className="text-xs text-text-dim leading-relaxed">
                Skip a habit and your stat starts losing health. The longer you skip, the faster it drops. One day off? No big deal — you get a grace period.
              </p>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ background: "var(--color-bg-panel)", border: "1px solid var(--color-border)" }}
            >
              <p className="font-medium text-text-bright text-sm mb-1">Hit zero and face consequences</p>
              <p className="text-xs text-text-dim leading-relaxed">
                If a stat drops to zero, a consequence triggers. Recover by getting back on track — your stats heal when you do.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => goBack(1)}
              className="flex-1 py-2.5 rounded-lg border transition-colors cursor-pointer"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Back
            </button>
            <button
              onClick={() => goForward(3)}
              className="flex-[2] font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Life areas */}
      {step === 3 && (
        <div className={`space-y-5 ${animClass}`} key="step-3">
          <div>
            <h2 className="text-xl font-semibold text-text-bright mb-1">What areas matter to you?</h2>
            <p className="text-sm text-text-dim">
              Pick at least 3. Each one becomes a stat you maintain.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {LIFE_AREAS.map((area) => {
              const selected = selectedAreas.includes(area.area);
              return (
                <button
                  key={area.area}
                  onClick={() => toggleArea(area.area)}
                  className="text-left px-4 py-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between"
                  style={{
                    borderColor: selected ? "var(--color-accent)" : "var(--color-border)",
                    background: selected ? "rgba(37, 99, 235, 0.05)" : "var(--color-bg-panel)",
                  }}
                >
                  <div>
                    <div className="font-medium text-text-bright">{area.label}</div>
                    <div className="text-xs text-text-dim mt-0.5">{area.description}</div>
                  </div>
                  {selected && (
                    <span className="text-accent text-lg flex-shrink-0 ml-3">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-text-dim">
            {selectedAreas.length} selected{selectedAreas.length < 3 && ` — need ${3 - selectedAreas.length} more`}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => goBack(2)}
              className="flex-1 py-2.5 rounded-lg border transition-colors cursor-pointer"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Back
            </button>
            <button
              onClick={() => goForward(4)}
              disabled={selectedAreas.length < 3}
              className="flex-[2] font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Add habits */}
      {step === 4 && (
        <div className={`space-y-5 ${animClass}`} key="step-4">
          <div>
            <h2 className="text-xl font-semibold text-text-bright mb-1">Add your first habits</h2>
            <p className="text-sm text-text-dim">
              Tap suggestions or type your own. Start small — you can always add more later.
            </p>
          </div>

          {/* Soft cap warning */}
          {habitDrafts.length >= HABIT_SOFT_CAP && (
            <div
              className="rounded-lg px-3 py-2 text-xs animate-scale-in"
              style={{ background: "rgba(217, 119, 6, 0.08)", color: "var(--color-warning)", border: "1px solid rgba(217, 119, 6, 0.2)" }}
            >
              You have {habitDrafts.length} habits. Research shows fewer habits = better consistency. Consider starting with your top priorities.
            </div>
          )}

          <div className="space-y-4">
            {selectedAreaObjects.map((area) => {
              const areaHabits = habitDrafts.filter((h) => h.areaKey === area.area);
              const inputVal = newHabitInputs[area.area] || "";
              const suggestions = SUGGESTED_HABITS[area.area] || [];
              const unusedSuggestions = suggestions.filter(
                (s) => !areaHabits.some((h) => h.name === s)
              );

              return (
                <div
                  key={area.area}
                  className="rounded-lg border p-4"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-bg-panel)" }}
                >
                  <div className="font-medium text-text-bright text-sm mb-2">{area.label}</div>

                  {/* Added habits */}
                  {areaHabits.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {areaHabits.map((habit) => {
                        const globalIdx = habitDrafts.indexOf(habit);
                        return (
                          <div key={globalIdx} className="flex items-center gap-2 text-sm flex-wrap animate-fade-in">
                            <span className="flex-1 text-text min-w-0">{habit.name}</span>
                            <select
                              value={habit.frequency}
                              onChange={(e) => updateHabitFreq(globalIdx, e.target.value as "DAILY" | "WEEKLY")}
                              className="text-xs rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                              style={{
                                background: "var(--color-bg-card)",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-dim)",
                              }}
                            >
                              <option value="DAILY">Daily</option>
                              <option value="WEEKLY">Weekly</option>
                            </select>
                            {habit.frequency === "WEEKLY" && (
                              <select
                                value={habit.weeklyTarget}
                                onChange={(e) => updateWeeklyTarget(globalIdx, parseInt(e.target.value))}
                                className="text-xs rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                                style={{
                                  background: "var(--color-bg-card)",
                                  border: "1px solid var(--color-border)",
                                  color: "var(--color-text-dim)",
                                }}
                              >
                                {[1, 2, 3, 4, 5, 6].map((n) => (
                                  <option key={n} value={n}>{n}x/week</option>
                                ))}
                              </select>
                            )}
                            <button
                              onClick={() => removeHabitDraft(globalIdx)}
                              className="text-text-dim hover:text-danger text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Suggested habits */}
                  {unusedSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {unusedSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => addSuggested(area.area, suggestion)}
                          className="text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer hover:border-accent hover:text-accent"
                          style={{
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-dim)",
                            background: "transparent",
                          }}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Custom input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => setNewHabitInputs((prev) => ({ ...prev, [area.area]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addHabitDraft(area.area)}
                      placeholder="Or type your own..."
                      className="flex-1 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                      style={{
                        background: "var(--color-bg-card)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-bright)",
                      }}
                    />
                    <button
                      onClick={() => addHabitDraft(area.area)}
                      disabled={!inputVal.trim()}
                      className="text-sm px-3 py-1.5 rounded font-medium transition-colors cursor-pointer disabled:opacity-30"
                      style={{ background: "var(--color-accent)", color: "white" }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="text-center text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => goBack(3)}
              className="flex-1 py-2.5 rounded-lg border transition-colors cursor-pointer"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || habitDrafts.length === 0}
              className="flex-[2] font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              {submitting ? "Setting up..." : "Start tracking"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
