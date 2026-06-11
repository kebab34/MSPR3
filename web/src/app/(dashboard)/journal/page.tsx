"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { fetchUsersForPicker, labelUser, type PickUser } from "@/lib/picker-users";
import { PageHeader, Btn, Card, Input, Select, Alert, SkeletonTable, EmptyState, Badge } from "@/components/ui";
import { IconPlus, IconAlertCircle, IconCheck, IconCalendar, IconLeaf, IconFlame, IconSearch, IconTrash, IconDownload } from "@/components/icons";

type Row = {
  id_journal: string;
  id_utilisateur: string;
  id_aliment: string;
  quantite: number;
  date_consommation?: string;
  aliment?: { nom: string; calories: number; proteines: number; glucides: number; lipides: number; unite: string };
};

type Aliment = { id_aliment: string; nom: string; calories: number; proteines: number; glucides: number; lipides: number; unite: string };

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function JournalPage() {
  const { token, profile } = useAuth();
  const [users, setUsers] = useState<PickUser[]>([]);
  const [aliments, setAliments] = useState<Aliment[]>([]);
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [dateDebut, setDateDebut] = useState(weekAgo);
  const [dateFin, setDateFin] = useState(today);
  const [dateEntree, setDateEntree] = useState(today);
  const [alimentId, setAlimentId] = useState("");
  const [alimentSearch, setAlimentSearch] = useState("");
  const [showAlimentDrop, setShowAlimentDrop] = useState(false);
  const alimentRef = useRef<HTMLDivElement>(null);
  const [quantite, setQuantite] = useState("100");

  useEffect(() => {
    if (!token || !profile) return;
    Promise.all([
      fetchUsersForPicker(token, profile),
      apiFetch<Aliment[]>("/aliments", { token, params: { limit: "1000" } }),
    ]).then(([u, a]) => {
      setUsers(u);
      setAliments(Array.isArray(a) ? a : []);
    }).catch(() => {});
  }, [token, profile]);

  useEffect(() => { if (users.length && !userId) setUserId(users[0].id_utilisateur); }, [users, userId]);

  useEffect(() => {
    if (!token || !userId) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<Row[]>("/journal", { token, params: { utilisateur_id: userId, date_debut: dateDebut, date_fin: dateFin } })
      .then((d) => { if (!cancelled) { setRows(Array.isArray(d) ? d : []); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setErr(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [token, userId, dateDebut, dateFin]);

  async function onDelete(id: string) {
    if (!token || !confirm("Supprimer cette entrée ?")) return;
    try {
      await apiFetch(`/journal/${id}`, { method: "DELETE", token });
      setRows((prev) => prev.filter((r) => r.id_journal !== id));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    }
  }

  function exportCSV() {
    const headers = ["date_consommation", "aliment", "quantite_g", "calories_kcal"];
    const csv = [headers.join(","), ...rows.map((r) => {
      const a = aliMap[r.id_aliment];
      const cal = a ? Math.round(a.calories * r.quantite / 100) : "";
      return [r.date_consommation ?? "", a?.nom ?? r.id_aliment, r.quantite, cal].join(",");
    })].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "journal.csv";
    a.click();
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !userId || !alimentId) return;
    setErr(null); setMsg(null); setSaving(true);
    try {
      const q = parseFloat(quantite);
      if (!q || q <= 0) throw new Error("Quantité invalide");
      await apiFetch("/journal", {
        method: "POST", token,
        body: { id_utilisateur: userId, id_aliment: alimentId, quantite: q, date_consommation: new Date(dateEntree).toISOString() },
      });
      setMsg("Entrée ajoutée au journal.");
      setShowForm(false);
      const data = await apiFetch<Row[]>("/journal", { token, params: { utilisateur_id: userId, date_debut: dateDebut, date_fin: dateFin } });
      setRows(Array.isArray(data) ? data : []);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setSaving(false);
    }
  }

  const aliMap = Object.fromEntries(aliments.map((a) => [a.id_aliment, a]));

  const alimentsSuggestions = useMemo(() => {
    if (!alimentSearch.trim()) return aliments.slice(0, 8);
    const q = alimentSearch.toLowerCase();
    return aliments.filter((a) => a.nom.toLowerCase().includes(q)).slice(0, 8);
  }, [aliments, alimentSearch]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (alimentRef.current && !alimentRef.current.contains(e.target as Node)) {
        setShowAlimentDrop(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Daily nutrition totals
  const todayRows = rows.filter((r) => r.date_consommation?.startsWith(today));
  const todayCal = todayRows.reduce((s, r) => {
    const a = aliMap[r.id_aliment];
    return s + (a ? (a.calories * r.quantite) / 100 : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal alimentaire"
        subtitle="Suivez vos apports nutritionnels quotidiens"
        action={
          <div className="flex gap-2">
            {rows.length > 0 && <Btn size="sm" variant="ghost" onClick={exportCSV}><IconDownload size={14} /> CSV</Btn>}
            <Btn size="sm" onClick={() => setShowForm(!showForm)}><IconPlus size={14} /> Ajouter</Btn>
          </div>
        }
      />

      {msg && <Alert variant="success"><IconCheck size={14} /><span>{msg}</span></Alert>}
      {err && <Alert variant="error"><IconAlertCircle size={14} /><span>{err}</span></Alert>}

      {/* Today's summary */}
      {todayCal > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0"><IconFlame size={18} /></div>
            <div>
              <p className="text-xs text-slate-400">Calories aujourd'hui</p>
              <p className="text-xl font-semibold text-white">{Math.round(todayCal)} <span className="text-sm font-normal text-slate-400">kcal</span></p>
            </div>
          </div>
        </Card>
      )}

      {/* Add form */}
      {showForm && aliments.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Nouvelle entrée</h2>
          <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Date" type="date" value={dateEntree} onChange={(e) => setDateEntree(e.target.value)} />

            {/* Autocomplete aliment */}
            <div className="relative" ref={alimentRef}>
              <label className="block text-xs text-slate-400 mb-1">Aliment</label>
              <div className="relative">
                <IconSearch size={13} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  role="combobox"
                  aria-expanded={showAlimentDrop && alimentsSuggestions.length > 0}
                  aria-controls="aliment-listbox"
                  aria-autocomplete="list"
                  aria-label="Rechercher un aliment"
                  placeholder="Rechercher un aliment…"
                  value={alimentSearch}
                  onChange={(e) => { setAlimentSearch(e.target.value); setAlimentId(""); setShowAlimentDrop(true); }}
                  onFocus={() => setShowAlimentDrop(true)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {showAlimentDrop && alimentsSuggestions.length > 0 && (
                <ul id="aliment-listbox" role="listbox" aria-label="Suggestions d'aliments" className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-auto max-h-52">
                  {alimentsSuggestions.map((a) => (
                    <li
                      key={a.id_aliment}
                      role="option"
                      aria-selected={alimentId === a.id_aliment}
                      onMouseDown={() => { setAlimentId(a.id_aliment); setAlimentSearch(a.nom); setShowAlimentDrop(false); }}
                      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm"
                    >
                      <span className="text-slate-200">{a.nom}</span>
                      <span className="text-xs text-amber-400 shrink-0 ml-2">{a.calories} kcal</span>
                    </li>
                  ))}
                </ul>
              )}
              {alimentId && (
                <p className="mt-1 text-xs text-emerald-400">✓ {aliMap[alimentId]?.nom}</p>
              )}
            </div>

            <Input label="Quantité (g)" type="number" step="1" min="1" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
            <div className="sm:col-span-3 flex gap-2">
              <Btn type="submit" loading={saving} size="sm">Enregistrer</Btn>
              <Btn type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <IconCalendar size={14} className="text-slate-500" />
          <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="w-36" />
        </div>
        <span className="text-slate-500 text-sm">→</span>
        <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="w-36" />
        {users.length > 1 && (
          <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-48">
            {users.map((u) => <option key={u.id_utilisateur} value={u.id_utilisateur}>{labelUser(u)}</option>)}
          </Select>
        )}
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={5} cols={5} /> : rows.length === 0 ? (
        <EmptyState message="Aucune entrée sur cette période." action={<Btn size="sm" onClick={() => setShowForm(true)}><IconPlus size={14} /> Ajouter</Btn>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                {["Date", "Aliment", "Quantité", "Calories", "Protéines / Glucides / Lipides", ""].map((h) => (
                  <th key={h} scope="col" className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const a = aliMap[r.id_aliment];
                const ratio = r.quantite / 100;
                const cal = a ? Math.round(a.calories * ratio) : null;
                const prot = a ? (a.proteines * ratio).toFixed(1) : null;
                const gluc = a ? (a.glucides * ratio).toFixed(1) : null;
                const lip = a ? (a.lipides * ratio).toFixed(1) : null;
                return (
                  <tr key={r.id_journal} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{fmt(r.date_consommation)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <IconLeaf size={11} className="text-emerald-400" />
                        </div>
                        <span className="text-slate-200">{a?.nom ?? <span className="text-slate-500 font-mono text-xs">{r.id_aliment.slice(0, 8)}…</span>}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{r.quantite} g</td>
                    <td className="px-4 py-3">
                      {cal != null ? (
                        <span className="font-semibold text-amber-400">{cal} <span className="font-normal text-slate-500 text-xs">kcal</span></span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {prot && gluc && lip ? (
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="blue">{prot}g P</Badge>
                          <Badge variant="amber">{gluc}g G</Badge>
                          <Badge variant="red">{lip}g L</Badge>
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onDelete(r.id_journal)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <IconTrash size={14} />
                      </button>
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
