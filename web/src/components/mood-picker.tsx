"use client";

import { cn } from "@/lib/utils";
import { MOODS, type Mood } from "@/lib/wellness";

function MoodFace({
  variant,
  selected,
}: {
  variant: Mood;
  selected: boolean;
}) {
  const stroke = selected ? "#60a5fa" : "#94a3b8";
  const feature = selected ? "#93c5fd" : "#64748b";

  const mouth =
    variant === "content" ? (
      <path
        d="M22 40 Q32 50 42 40"
        fill="none"
        stroke={feature}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    ) : variant === "triste" ? (
      <path
        d="M22 44 Q32 36 42 44"
        fill="none"
        stroke={feature}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    ) : variant === "colere" ? (
      <path
        d="M24 42 L32 38 L40 42"
        fill="none"
        stroke={feature}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <line
        x1="24"
        y1="42"
        x2="40"
        y2="42"
        stroke={feature}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    );

  const brows =
    variant === "colere" ? (
      <>
        <line x1="18" y1="24" x2="26" y2="28" stroke={feature} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="46" y1="24" x2="38" y2="28" stroke={feature} strokeWidth="2.5" strokeLinecap="round" />
      </>
    ) : variant === "triste" ? (
      <>
        <path d="M18 26 Q22 22 26 26" fill="none" stroke={feature} strokeWidth="2" strokeLinecap="round" />
        <path d="M46 26 Q42 22 38 26" fill="none" stroke={feature} strokeWidth="2" strokeLinecap="round" />
      </>
    ) : variant === "content" ? (
      <>
        <path d="M18 24 Q22 22 26 24" fill="none" stroke={feature} strokeWidth="2" strokeLinecap="round" />
        <path d="M46 24 Q42 22 38 24" fill="none" stroke={feature} strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <line x1="18" y1="25" x2="26" y2="25" stroke={feature} strokeWidth="2" strokeLinecap="round" />
        <line x1="46" y1="25" x2="38" y2="25" stroke={feature} strokeWidth="2" strokeLinecap="round" />
      </>
    );

  const eyes =
    variant === "colere" ? (
      <>
        <line x1="22" y1="32" x2="26" y2="30" stroke={feature} strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="32" x2="38" y2="30" stroke={feature} strokeWidth="2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="24" cy="32" r="2.5" fill={feature} />
        <circle cx="40" cy="32" r="2.5" fill={feature} />
      </>
    );

  return (
    <svg viewBox="0 0 64 64" className="w-full h-auto" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="none" stroke={stroke} strokeWidth="2.5" />
      {eyes}
      {brows}
      {mouth}
      {variant === "content" && (
        <>
          <circle cx="18" cy="38" r="2.5" fill="#f472b6" opacity={selected ? 0.45 : 0.25} />
          <circle cx="46" cy="38" r="2.5" fill="#f472b6" opacity={selected ? 0.45 : 0.25} />
        </>
      )}
      {variant === "colere" && (
        <>
          <circle cx="16" cy="40" r="3" fill="#ef4444" opacity={selected ? 0.35 : 0.2} />
          <circle cx="48" cy="40" r="3" fill="#ef4444" opacity={selected ? 0.35 : 0.2} />
        </>
      )}
    </svg>
  );
}

export function MoodPicker({
  value,
  onChange,
  disabled,
}: {
  value: Mood | null;
  onChange: (m: Mood) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {MOODS.map((m) => {
        const selected = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selected
                ? "border-blue-500/60 bg-blue-500/10 shadow-sm shadow-blue-500/10"
                : "border-slate-800 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-800/80"
            )}
            aria-pressed={selected}
            aria-label={`Humeur : ${m.label}`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14">
              <MoodFace variant={m.id} selected={selected} />
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                selected ? "text-blue-300" : "text-slate-400"
              )}
            >
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
