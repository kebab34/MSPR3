"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { PageHeader, Btn, Card, Input, Alert, SkeletonTable, EmptyState, Badge } from "@/components/ui";
import { IconLeaf, IconPlus, IconSearch, IconAlertCircle, IconCheck } from "@/components/icons";

type Aliment = {
  id_aliment: string;
  nom: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  fibres: number;
  unite: string;
  source?: string;
};

export default function AlimentsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Aliment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [nom, setNom] = useState("");
  const [calories, setCalories] = useState("0");
  const [proteines, setProteines] = useState("0");
  const [glucides, setGlucides] = useState("0");
  const [lipides, setLipides] = useState("0");
  const [fibres, setFibres] = useState("0");
  const [unite, setUnite] = useState("100g");
  const [source, setSource] = useState("manuel");

  const reload = useCallback(async () => {
    if (!token) return;
    const data = await apiFetch<Aliment[]>("/aliments", { token, params: { limit: "1000" } });
    setRows(Array.isArray(data) ? data : []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    reload().then(() => { if (!cancelled) setLoading(false); }).catch((e) => { if (!cancelled) { setErr(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [token, reload]);

  const filtered = useMemo(() =>
    rows.filter((r) => !search || r.nom.toLowerCase().includes(search.toLowerCase())),
    [rows, search]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !nom.trim()) return;
    setErr(null);
    setMsg(null);
    setSaving(true);
    try {
      await apiFetch("/aliments", {
        method: "POST",
        token,
        body: {
          nom: nom.trim(),
          calories: parseFloat(calories) || 0,
          proteines: parseFloat(proteines) || 0,
          glucides: parseFloat(glucides) || 0,
          lipides: parseFloat(lipides) || 0,
          fibres: parseFloat(fibres) || 0,
          unite,
          source,
        },
      });
      setMsg("Aliment ajouté avec succès.");
      setNom(""); setCalories("0"); setProteines("0"); setGlucides("0"); setLipides("0"); setFibres("0");
      setShowForm(false);
      await reload();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setSaving(false);
    }
  }

  function MacroBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-slate-400 w-8 text-right">{value}g</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aliments"
        subtitle={`${rows.length} aliments en base de données`}
        action={
          <Btn size="sm" onClick={() => setShowForm(!showForm)}>
            <IconPlus size={14} /> Ajouter
          </Btn>
        }
      />

      {msg && <Alert variant="success"><IconCheck size={14} /><span>{msg}</span></Alert>}
      {err && <Alert variant="error"><IconAlertCircle size={14} /><span>{err}</span></Alert>}

      {/* Add form */}
      {showForm && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Nouvel aliment</h2>
          <form onSubmit={onAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Nom *" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Poulet grillé" required />
              <Input label="Unité" value={unite} onChange={(e) => setUnite(e.target.value)} placeholder="100g" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              <Input label="Calories" type="number" step="0.1" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} />
              <Input label="Protéines (g)" type="number" step="0.1" min="0" value={proteines} onChange={(e) => setProteines(e.target.value)} />
              <Input label="Glucides (g)" type="number" step="0.1" min="0" value={glucides} onChange={(e) => setGlucides(e.target.value)} />
              <Input label="Lipides (g)" type="number" step="0.1" min="0" value={lipides} onChange={(e) => setLipides(e.target.value)} />
              <Input label="Fibres (g)" type="number" step="0.1" min="0" value={fibres} onChange={(e) => setFibres(e.target.value)} />
              <Input label="Source" value={source} onChange={(e) => setSource(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Btn type="submit" loading={saving} size="sm">Enregistrer</Btn>
              <Btn type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          placeholder="Rechercher un aliment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={6} cols={6} /> : filtered.length === 0 ? (
        <EmptyState message="Aucun aliment trouvé." action={<Btn size="sm" onClick={() => setShowForm(true)}><IconPlus size={14} /> Ajouter un aliment</Btn>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                {["Aliment", "Calories", "Protéines", "Glucides", "Lipides", "Source"].map((h) => (
                  <th key={h} scope="col" className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const maxMacro = Math.max(a.proteines, a.glucides, a.lipides, 1);
                return (
                  <tr key={a.id_aliment} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <IconLeaf size={13} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{a.nom}</p>
                          <p className="text-xs text-slate-500">{a.unite}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-amber-400">{a.calories}</span>
                      <span className="text-xs text-slate-500 ml-1">kcal</span>
                    </td>
                    <td className="px-4 py-3 w-28">
                      <MacroBar value={a.proteines} max={maxMacro} color="bg-blue-500" />
                    </td>
                    <td className="px-4 py-3 w-28">
                      <MacroBar value={a.glucides} max={maxMacro} color="bg-amber-500" />
                    </td>
                    <td className="px-4 py-3 w-28">
                      <MacroBar value={a.lipides} max={maxMacro} color="bg-red-500" />
                    </td>
                    <td className="px-4 py-3">
                      {a.source ? <Badge variant="slate">{a.source}</Badge> : <span className="text-slate-600">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
