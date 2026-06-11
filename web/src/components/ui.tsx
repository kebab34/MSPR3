"use client";

import { cn } from "@/lib/utils";
import React from "react";

// ─── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-white text-balance">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-slate-900 border border-slate-800 rounded-xl p-5", className)}>
      {children}
    </div>
  );
}

// ─── StatCard ──────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-400" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
  red: { bg: "bg-red-500/10", text: "text-red-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400" },
};

export function StatCard({
  label,
  value,
  icon,
  color = "blue",
  sub,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  sub?: string;
}) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        {icon && (
          <div className={cn("p-2 rounded-lg", c.bg, c.text)}>{icon}</div>
        )}
      </div>
      <p className={cn("text-2xl font-semibold", c.text)}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_VARIANTS: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  slate: "bg-slate-800 text-slate-400 border-slate-700",
};

export function Badge({
  children,
  variant = "slate",
}: {
  children: React.ReactNode;
  variant?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium",
        BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.slate
      )}
    >
      {children}
    </span>
  );
}

// ─── Btn ───────────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

export function Btn({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  type = "button",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<BtnVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700",
    danger: "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20",
  };
  const sizes: Record<BtnSize, string> = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-sm px-5 py-2.5",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : null}
      {children}
    </button>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ label, className, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs text-slate-400 font-medium">{label}</label>}
    <input
      ref={ref}
      className={cn(
        "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));
Input.displayName = "Input";

// ─── Select ────────────────────────────────────────────────────────────────────
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
>(({ label, className, children, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs text-slate-400 font-medium">{label}</label>}
    <select
      ref={ref}
      className={cn(
        "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "appearance-none cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
  </div>
));
Select.displayName = "Select";

// ─── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "success" | "error" | "info" | "warning";
}) {
  const v: Record<string, string> = {
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    error: "bg-red-500/10 border-red-500/20 text-red-400",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };
  return (
    <div className={cn("flex items-center gap-2 px-4 py-3 rounded-lg border text-sm", v[variant] ?? v.info)}>
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-slate-800 rounded animate-pulse", className)} />;
}

// ─── SkeletonTable ────────────────────────────────────────────────────────────
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/50 border-b border-slate-800">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-slate-800/60">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <Skeleton className={`h-4 ${j === 0 ? "w-32" : "w-20"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-slate-800">
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
        <span className="text-xl text-slate-600">—</span>
      </div>
      <p className="text-sm text-slate-400 mb-4">{message}</p>
      {action}
    </div>
  );
}
