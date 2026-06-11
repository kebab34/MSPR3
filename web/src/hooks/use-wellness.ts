"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import {
  type Mood,
  readWellnessLocal,
  writeWellnessLocal,
} from "@/lib/wellness";

type WellnessProfile = {
  humeur?: Mood | null;
  zones_blessure?: string[] | null;
};

export function useWellness() {
  const { token, profile, refreshProfile } = useAuth();
  const p = profile as (typeof profile & WellnessProfile) | null;

  const [mood, setMoodState] = useState<Mood | null>(null);
  const [injuries, setInjuriesState] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const local = readWellnessLocal();
    const humeur = (p?.humeur as Mood | undefined) ?? local.humeur ?? null;
    const zones =
      (Array.isArray(p?.zones_blessure) ? p.zones_blessure : null) ??
      local.zones_blessure ??
      [];
    setMoodState(humeur);
    setInjuriesState(zones);
  }, [p?.humeur, p?.zones_blessure]);

  const persist = useCallback(
    async (payload: { humeur?: Mood | null; zones_blessure?: string[] }) => {
      writeWellnessLocal(payload);
      if (!token) return;
      setSyncing(true);
      try {
        await apiFetch("/auth/me", {
          method: "PATCH",
          body: payload,
          token,
        });
        await refreshProfile();
      } catch {
        /* colonnes API pas encore migrées : localStorage suffit */
      } finally {
        setSyncing(false);
      }
    },
    [token, refreshProfile]
  );

  const setMood = useCallback(
    async (next: Mood) => {
      setMoodState(next);
      await persist({ humeur: next });
    },
    [persist]
  );

  const toggleInjury = useCallback(
    async (zoneId: string) => {
      setInjuriesState((prev) => {
        const next = prev.includes(zoneId)
          ? prev.filter((z) => z !== zoneId)
          : [...prev, zoneId];
        void persist({ zones_blessure: next });
        return next;
      });
    },
    [persist]
  );

  const clearInjuries = useCallback(async () => {
    setInjuriesState([]);
    await persist({ zones_blessure: [] });
  }, [persist]);

  return {
    mood,
    injuries,
    setMood,
    toggleInjury,
    clearInjuries,
    syncing,
  };
}
