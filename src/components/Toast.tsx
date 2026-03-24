"use client";

import { useEffect, useState } from "react";

export type ToastVariant = "success" | "error" | "info";

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const variantStyles: Record<ToastVariant, string> = {
  success:
    "bg-emerald-600 text-white border-emerald-700",
  error:
    "bg-red-600 text-white border-red-700",
  info:
    "bg-blue-600 text-white border-blue-700",
};

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Trigger slide-in
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      role="alert"
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg ${variantStyles[toast.variant]}`}
      style={{
        transform: visible && !exiting ? "translateY(0)" : "translateY(-1rem)",
        opacity: visible && !exiting ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
        pointerEvents: "auto",
      }}
    >
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={handleClose}
        className="ml-2 flex-shrink-0 rounded p-0.5 hover:bg-white/20"
        aria-label="Dismiss notification"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 3l8 8M11 3l-8 8" />
        </svg>
      </button>
    </div>
  );
}
