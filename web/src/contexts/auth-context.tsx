"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Profile = {
  id_utilisateur: string;
  email: string;
  prenom?: string;
  nom?: string;
  age?: number;
  sexe?: string;
  poids?: number;
  taille?: number;
  objectifs?: string[];
  type_abonnement?: string;
  app_role?: string;
  humeur?: "content" | "normal" | "triste" | "colere";
  zones_blessure?: string[];
};

type AuthContextType = {
  token: string | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, prenom?: string, nom?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<Profile | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "healthai_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (t: string) => {
    const p = await apiFetch<Profile>("/auth/me", { token: t });
    setProfile(p);
    return p;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    return fetchProfile(token);
  }, [token, fetchProfile]);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    fetchProfile(stored)
      .then(() => setLoading(false))
      .catch((e) => {
        setAuthError(String(e));
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setLoading(false);
      });
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const data = await apiFetch<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    const t = data.access_token;
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    await fetchProfile(t);
  }, [fetchProfile]);

  const register = useCallback(async (email: string, password: string, prenom?: string, nom?: string) => {
    setAuthError(null);
    const payload: Record<string, string> = { email, password };
    if (prenom?.trim()) payload.prenom = prenom.trim();
    if (nom?.trim()) payload.nom = nom.trim();

    const res = await apiFetch<{ access_token?: string }>("/auth/register", {
      method: "POST",
      body: payload,
    });

    let t = res.access_token;
    if (!t) {
      const loginRes = await apiFetch<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      t = loginRes.access_token;
    }
    if (!t) throw new Error("Inscription réussie — utilisez l'onglet Connexion.");
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    await fetchProfile(t);
  }, [fetchProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, profile, loading, authError, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
