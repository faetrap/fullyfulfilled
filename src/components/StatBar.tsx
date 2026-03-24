"use client";

import { useEffect, useState } from "react";

type StatBarProps = {
  current: number;
  max: number;
  label: string;
  color?: string;
};

function getAutoColor(percentage: number): string {
  if (percentage > 60) return "#22c55e"; // green-500
  if (percentage >= 30) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

export function StatBar({ current, max, label, color }: StatBarProps) {
  const [width, setWidth] = useState(0);
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  const barColor = color ?? getAutoColor(percentage);

  useEffect(() => {
    // Animate from 0 to target after mount
    const frame = requestAnimationFrame(() => {
      setWidth(percentage);
    });
    return () => cancelAnimationFrame(frame);
  }, [percentage]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          {current}/{max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${current} of ${max}`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            backgroundColor: barColor,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}
