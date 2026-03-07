"use client";

import { useState } from "react";
import { LIFE_AREAS } from "@/lib/constants";

type Props = {
  onComplete: () => void;
};

type HabitDraft = {
  name: string;
  frequency: "DAILY" | "WEEKLY";
  areaKey: string;
};

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [habitDrafts, setHabitDrafts] = useState<HabitDraft[]>([]);
  const [newHabitInputs, setNewHabitInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleArea(area: string) {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function addHabitDraft(areaKey: string) {
    const input = newHabitInputs[areaKey]?.trim();
    if (!input) return;
    setHabitDrafts((prev) => [...prev, { name: input, frequency: "DAILY", areaKey }]);
    setNewHabitInputs((prev) => ({ ...prev, [areaKey]: "" }));
  }

  function removeHabitDraft(index: number) {
    setHabitDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateHabitFreq(index: number, freq: "DAILY" | "WEEKLY") {
    setHabitDrafts((prev) => prev.map((h, i) => i === index ? { ...h, frequency: freq } : h));
  }

  async function handleSubmit() {
    if (habitDrafts.length === 0) {
      setError("Add at least one habit to get started.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      // Create character
      const res = await fetch("/api/character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, characterClass: "none", selectedAreas, gender: "neutral" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      const { character } = await res.json();

      // Create habits
      for (const draft of habitDrafts) {
        const stat = character.stats.find((s: { area: string }) => s.area === draft.areaKey);
        if (stat) {
          await fetch("/api/habits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: draft.name, statId: stat.id, frequency: draft.frequency }),
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

  const totalSteps = 3;
  const selectedAreaObjects = LIFE_AREAS.filter((a) => selectedAreas.includes(a.area));

  return (
    <div className="animate-fade-in max-w-md mx-auto">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="h-1 rounded-full flex-1 transition-all"
            style={{
              background: s <= step ? "var(--color-accent)" : "var(--color-border)",
            }}
          />
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-text-bright mb-1">What should we call you?</h2>
            <p className="text-sm text-text-dim">This is how you'll appear in the app.</p>
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
          />
          <button
            onClick={() => setStep(2)}
            disabled={!name.trim()}
            className="w-full font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--color-accent)", color: "white" }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Life areas */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-text-bright mb-1">What areas matter to you?</h2>
            <p className="text-sm text-text-dim">
              Pick at least 3. Each one becomes a stat you maintain by building habits.
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
                    <span className="text-accent text-lg flex-shrink-0 ml-3">&#10003;</span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-text-dim">
            {selectedAreas.length} selected{selectedAreas.length < 3 && ` \u2014 need ${3 - selectedAreas.length} more`}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 rounded-lg border transition-colors cursor-pointer"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedAreas.length < 3}
              className="flex-[2] font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--color-accent)", color: "white" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Add first habits */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-text-bright mb-1">Add your first habits</h2>
            <p className="text-sm text-text-dim">
              What do you want to stay consistent with? Add at least one habit to get started.
            </p>
          </div>

          <div className="space-y-4">
            {selectedAreaObjects.map((area) => {
              const areaHabits = habitDrafts.filter((h) => h.areaKey === area.area);
              const inputVal = newHabitInputs[area.area] || "";
              return (
                <div
                  key={area.area}
                  className="rounded-lg border p-4"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-bg-panel)" }}
                >
                  <div className="font-medium text-text-bright text-sm mb-2">{area.label}</div>

                  {areaHabits.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {areaHabits.map((habit, idx) => {
                        const globalIdx = habitDrafts.indexOf(habit);
                        return (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className="flex-1 text-text">{habit.name}</span>
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
                            <button
                              onClick={() => removeHabitDraft(globalIdx)}
                              className="text-text-dim hover:text-danger text-xs cursor-pointer"
                            >
                              &#10005;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => setNewHabitInputs((prev) => ({ ...prev, [area.area]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addHabitDraft(area.area)}
                      placeholder={`e.g. ${area.area === "HEALTH" ? "Go for a run" : area.area === "KNOWLEDGE" ? "Read 20 pages" : area.area === "SOCIAL" ? "Call a friend" : area.area === "CREATIVITY" ? "Write for 15 min" : area.area === "FINANCE" ? "Review spending" : "Build a habit"}`}
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
              onClick={() => setStep(2)}
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
