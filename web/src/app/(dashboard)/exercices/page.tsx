"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { PageHeader, Badge, Select, SkeletonTable, EmptyState, Card } from "@/components/ui";
import { IconDumbbell, IconSearch } from "@/components/icons";

type Exercice = {
  id_exercice: string;
  nom: string;
  type?: string;
  groupe_musculaire?: string;
  niveau?: string;
  equipement?: string;
  description?: string;
};

const NIVEAU_BADGE: Record<string, "emerald" | "amber" | "red"> = {
  debutant: "emerald", intermédiaire: "amber", avancé: "red",
  beginner: "emerald", intermediate: "amber", advanced: "red",
};

export default function ExercicesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Exercice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterGroupe, setFilterGroupe] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterEquipement, setFilterEquipement] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<Exercice[]>("/exercices", { token, params: { limit: "1000" } })
      .then((d) => { if (!cancelled) { setRows(Array.isArray(d) ? d : []); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setErr(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [token]);

  const types = useMemo(() => [...new Set(rows.map((r) => r.type).filter(Boolean))].sort() as string[], [rows]);
  const groupes = useMemo(() => [...new Set(rows.map((r) => r.groupe_musculaire).filter(Boolean))].sort() as string[], [rows]);
  const niveaux = useMemo(() => [...new Set(rows.map((r) => r.niveau).filter(Boolean))].sort() as string[], [rows]);
  const equipements = useMemo(() => [...new Set(rows.map((r) => r.equipement).filter(Boolean))].sort() as string[], [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (search && !r.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && r.type !== filterType) return false;
    if (filterGroupe && r.groupe_musculaire !== filterGroupe) return false;
    if (filterNiveau && r.niveau !== filterNiveau) return false;
    if (filterEquipement && r.equipement !== filterEquipement) return false;
    return true;
  }), [rows, search, filterType, filterGroupe, filterNiveau, filterEquipement]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exercices"
        subtitle={`${rows.length} exercices disponibles`}
      />

      {err && <p className="text-sm text-red-400">{err}</p>}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-1">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tous les types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select value={filterGroupe} onChange={(e) => setFilterGroupe(e.target.value)}>
            <option value="">Tous les muscles</option>
            {groupes.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Select value={filterNiveau} onChange={(e) => setFilterNiveau(e.target.value)}>
            <option value="">Tous niveaux</option>
            {niveaux.map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
          <Select value={filterEquipement} onChange={(e) => setFilterEquipement(e.target.value)}>
            <option value="">Tout équipement</option>
            {equipements.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
          </Select>
        </div>
        {(search || filterType || filterGroupe || filterNiveau) && (
          <p className="mt-2 text-xs text-slate-500">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</p>
        )}
      </Card>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState message="Aucun exercice ne correspond à vos filtres." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                {["Exercice", "Type", "Groupe musculaire", "Niveau", "Équipement"].map((h) => (
                  <th key={h} scope="col" className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex) => (
                <tr key={ex.id_exercice} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <IconDumbbell size={13} className="text-blue-400" />
                      </div>
                      <span className="font-medium text-slate-200 max-w-[200px] truncate">{ex.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {ex.type ? <Badge variant="blue">{ex.type}</Badge> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {ex.groupe_musculaire ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {ex.niveau ? (
                      <Badge variant={NIVEAU_BADGE[ex.niveau.toLowerCase()] ?? "slate"}>{ex.niveau}</Badge>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {ex.equipement ?? <span className="text-slate-600">—</span>}
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
