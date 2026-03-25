"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  { headline: "You showed up.", sub: "That's the whole game." },
  { headline: "Every box checked.", sub: "Your future self just said thanks." },
  { headline: "Consistency wins.", sub: "And today, you won." },
  { headline: "Done for the day.", sub: "Go live. You've earned it." },
  { headline: "All habits complete.", sub: "Small actions, big life." },
  { headline: "That's a wrap.", sub: "Tomorrow's a new chance to show up again." },
  { headline: "You did the work.", sub: "Most people didn't. That matters." },
  { headline: "100% today.", sub: "Not perfect — just consistent." },
];

const CONFETTI_COLORS = [
  "#2563eb", "#16a34a", "#d97706", "#dc2626", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f59e0b",
];

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 1.5;
  const duration = 2 + Math.random() * 2;
  const size = 6 + Math.random() * 8;
  const shape = Math.random() > 0.5 ? "50%" : "2px";

  return (
    <div
      className="confetti-piece"
      style={{
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: shape,
        background: color,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

type Props = {
  onDismiss: () => void;
};

export default function AllDoneScreen({ onDismiss }: Props) {
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="celebration-overlay" onClick={onDismiss}>
      {/* Confetti */}
      {Array.from({ length: 40 }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}

      {/* Message */}
      <div className="celebration-text">
        <p className="text-3xl font-bold text-text-bright mb-2">{message.headline}</p>
        <p className="text-base text-text-dim">{message.sub}</p>
      </div>

      <button
        className="absolute bottom-12 text-sm text-text-dim"
        onClick={onDismiss}
      >
        tap to dismiss
      </button>
    </div>
  );
}
