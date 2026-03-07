"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import Onboarding from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";

type CharacterData = {
  id: string;
  name: string;
  class: string;
  gender: string;
  stats: StatData[];
  events: EventData[];
};

type StatData = {
  id: string;
  area: string;
  label: string;
  current: number;
  max: number;
  habits: HabitData[];
  consequence: { id: string; message: string; resolvedAt: string | null } | null;
};

type HabitData = {
  id: string;
  name: string;
  frequency: string;
  xpReward: number;
  statId: string;
  checkIns: { id: string; date: string }[];
};

type EventData = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

export type { CharacterData, StatData, HabitData, EventData };

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCharacter = useCallback(async () => {
    try {
      const res = await fetch("/api/character");
      const data = await res.json();
      setCharacter(data.character);
    } catch {
      // will show onboarding
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchCharacter();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isSignedIn, isLoaded, fetchCharacter]);

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1
          className="text-4xl font-black tracking-[0.6em] text-text-bright"
          style={{ fontFamily: "var(--font-display)" }}
        >
          FULFILLED
        </h1>
        <p className="text-text-dim text-sm tracking-widest animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
        <div className="text-center space-y-4">
          <h1
            className="text-5xl font-black tracking-[0.6em] text-text-bright mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FULFILLED
          </h1>
          <p className="text-text max-w-sm mx-auto leading-relaxed">
            Your life is an RPG. Your habits are your stats.
            Skip them — your character degrades.
            Keep them — you become who you want to be.
          </p>
          <p
            className="text-lg font-semibold tracking-wide"
            style={{ color: "var(--color-accent)", fontFamily: "var(--font-display)" }}
          >
            Actions have consequences.
          </p>
        </div>

        <div className="text-center">
          <SignInButton mode="modal">
            <button className="bg-accent hover:bg-accent-hover text-text-bright font-semibold px-8 py-3 rounded-lg transition-all cursor-pointer">
              Begin Your Journey
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1
            className="text-3xl font-black tracking-[0.5em] text-text-bright"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FULFILLED
          </h1>
          <p className="text-text-dim text-xs tracking-widest mt-1">
            Level up your life. One habit at a time.
          </p>
        </div>
        <UserButton />
      </header>

      {character ? (
        <Dashboard character={character} onRefresh={fetchCharacter} />
      ) : (
        <Onboarding onComplete={fetchCharacter} />
      )}
    </>
  );
}
