"use client";

type SkeletonVariant = "stat-card" | "habit-row" | "summary";

const pulseStyle: React.CSSProperties = {
  animation: "skeleton-pulse 1.5s ease-in-out infinite",
};

function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded bg-gray-200 ${className ?? ""}`}
      style={{ ...pulseStyle, ...style }}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <SkeletonBlock style={{ width: 24, height: 24, borderRadius: 6 }} />
        <SkeletonBlock style={{ width: 80, height: 16 }} />
      </div>
      <SkeletonBlock className="mb-2" style={{ width: "100%", height: 8, borderRadius: 4 }} />
      <SkeletonBlock style={{ width: 48, height: 12 }} />
    </div>
  );
}

function HabitRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <SkeletonBlock style={{ width: 24, height: 24, borderRadius: 6 }} />
      <SkeletonBlock className="flex-1" style={{ height: 16 }} />
      <SkeletonBlock style={{ width: 60, height: 20, borderRadius: 10 }} />
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <SkeletonBlock className="mb-3" style={{ width: 120, height: 20 }} />
      <SkeletonBlock className="mb-2" style={{ width: "100%", height: 12 }} />
      <SkeletonBlock style={{ width: "70%", height: 12 }} />
    </div>
  );
}

export function LoadingSkeleton({ variant }: { variant: SkeletonVariant }) {
  switch (variant) {
    case "stat-card":
      return <StatCardSkeleton />;
    case "habit-row":
      return <HabitRowSkeleton />;
    case "summary":
      return <SummarySkeleton />;
  }
}

export function DashboardSkeleton() {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <div className="mx-auto max-w-md space-y-4 p-4">
        <SummarySkeleton />
        <div className="grid grid-cols-2 gap-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <SkeletonBlock className="mb-4" style={{ width: 100, height: 18 }} />
          <HabitRowSkeleton />
          <HabitRowSkeleton />
          <HabitRowSkeleton />
          <HabitRowSkeleton />
        </div>
      </div>
    </>
  );
}
