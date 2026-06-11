"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { PageHeader, Badge, SkeletonTable, EmptyState, Card } from "@/components/ui";
import { IconSearch, IconShield, IconUser, IconStar } from "@/components/icons";

type Utilisateur = {
  id_utilisateur: string;
  email: string;
  nom?: string;
  prenom?: string;
  age?: number;
  sexe?: string;
  poids?: number;
  taille?: number;
  type_abonnement?: string;
  app_role?: string;
  created_at?: string;
};

function initials(u: Utilisateur) {
  const p = u.prenom?.trim(); const n = u.nom?.trim();
  if (p && n) return `${p[0]}${n[0]}`.toUpperCase();
  if (p) return p.slice(0, 2).toUpperCase();
  return u.email.slice(0, 2).toUpperCase();
}

export default function UtilisateursPage() {
  const { token, profile } = useAuth();
  const [rows, setRows] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token || profile?.app_role !== "admin") return;
    let cancelled = false;
    apiFetch<Utilisateur[]>("/utilisateurs", { token, params: { limit: "1000" } })
      .then((d) => { if (!cancelled) { setRows(Array.isArray(d) ? d : []); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setErr(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [token, profile?.app_role]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.email.toLowerCase().includes(q) ||
      r.prenom?.toLowerCase().includes(q) ||
      r.nom?.toLowerCase().includes(q)
    );
  }), [rows, search]);

  if (profile?.app_role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="text-center">
          <IconShield size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="font-medium text-white">Accès restreint</p>
          <p className="text-sm mt-1">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  const admins = rows.filter((r) => r.app_role === "admin").length;
  const premiums = rows.filter((r) => r.type_abonnement === "premium").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        subtitle={`${rows.length} comptes inscrits`}
      />

      {err && <p className="text-sm text-red-400">{err}</p>}

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Total</p>
            <p className="mt-1.5 text-2xl font-semibold text-white">{rows.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Administrateurs</p>
            <p className="mt-1.5 text-2xl font-semibold text-amber-400">{admins}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Premium</p>
            <p className="mt-1.5 text-2xl font-semibold text-purple-400">{premiums}</p>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={6} cols={5} /> : filtered.length === 0 ? (
        <EmptyState message="Aucun utilisateur trouvé." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                {["Utilisateur", "Âge / Sexe", "Morphologie", "Rôle", "Abonnement"].map((h) => (
                  <th key={h} scope="col" className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id_utilisateur} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-300">
                        {initials(u)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">
                          {[u.prenom, u.nom].filter(Boolean).join(" ") || <span className="text-slate-500 italic">Sans nom</span>}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {u.age ? `${u.age} ans` : "—"}
                    {u.sexe ? ` · ${u.sexe}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {u.poids ? `${u.poids} kg` : ""}
                    {u.poids && u.taille ? " · " : ""}
                    {u.taille ? `${u.taille} cm` : ""}
                    {!u.poids && !u.taille && <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {u.app_role === "admin" ? (
                      <Badge variant="amber"><IconShield size={10} /> Admin</Badge>
                    ) : (
                      <Badge variant="slate"><IconUser size={10} /> Utilisateur</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.type_abonnement === "premium" ? (
                      <Badge variant="purple"><IconStar size={10} /> Premium</Badge>
                    ) : (
                      <Badge variant="slate">Freemium</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
