"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import Onboarding from "@/components/Onboarding";
import TodayView from "@/components/TodayView";
import StatsView from "@/components/StatsView";
import SettingsView from "@/components/SettingsView";
import BottomTabs, { type Tab } from "@/components/BottomTabs";
import AllDoneScreen from "@/components/AllDoneScreen";
import type { CharacterData } from "@/types";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [showCelebration, setShowCelebration] = useState(false);

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

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <h1 className="text-2xl font-bold text-text-bright">Fulfilled</h1>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" style={{ animationDelay: "0s" }} />
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" style={{ animationDelay: "0.3s" }} />
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" style={{ animationDelay: "0.6s" }} />
        </div>
      </div>
    );
  }

  // Signed out — landing page
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-3xl font-bold text-text-bright">Fulfilled</h1>
          <p className="text-text leading-relaxed">
            Your habits shape who you become. Stay consistent and thrive.
            Fall off — and watch yourself slip.
          </p>
          <p className="text-sm font-medium text-text-dim">
            Actions have consequences.
          </p>
        </div>
        <SignInButton mode="modal">
          <button className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2.5 rounded-lg transition-colors cursor-pointer">
            Get Started
          </button>
        </SignInButton>
      </div>
    );
  }

  // Onboarding (no character yet)
  if (!character) {
    return (
      <>
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold text-text-bright">Fulfilled</h1>
          <UserButton />
        </header>
        <Onboarding onComplete={fetchCharacter} />
      </>
    );
  }

  // Main app with tabs
  return (
    <>
      {showCelebration && (
        <AllDoneScreen onDismiss={() => setShowCelebration(false)} />
      )}

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold text-text-bright">Fulfilled</h1>
        <UserButton />
      </header>

      <div className="has-tab-bar">
        {activeTab === "today" && (
          <TodayView
            character={character}
            onRefresh={fetchCharacter}
            onAllDone={() => setShowCelebration(true)}
          />
        )}
        {activeTab === "stats" && (
          <StatsView character={character} onRefresh={fetchCharacter} />
        )}
        {activeTab === "settings" && (
          <SettingsView character={character} onRefresh={fetchCharacter} />
        )}
      </div>

      <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}
