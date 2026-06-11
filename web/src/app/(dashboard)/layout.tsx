"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, profile, loading, authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      </div>
    );
  }

  if (!token || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-4 px-4">
        {authError && (
          <p className="text-red-400 text-center max-w-lg text-sm">{authError}</p>
        )}
        <p>Redirection vers la connexion…</p>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
