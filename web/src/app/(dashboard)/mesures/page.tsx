"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { fetchUsersForPicker, labelUser, type PickUser } from "@/lib/picker-users";
import { PageHeader, Btn, Card, Input, Select, Alert, SkeletonTable, EmptyState, StatCard } from "@/components/ui";
import { IconActivity, IconPlus, IconAlertCircle, IconCheck, IconHeart, IconFlame, IconMoon, IconTrash, IconDownload } from "@/components/icons";

type Mesure = {
  id_mesure: string;
  id_utilisateur: string;
  poids?: number;
  frequence_cardiaque?: number;
  sommeil?: number;
  calories_brulees?: number;
  date_mesure: string;
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function diff(current?: number, prev?: number): string | null {
  if (current == null || prev == null) return null;
  const d = current - prev;
  if (d === 0) return null;
  return (d > 0 ? "+" : "") + d.toFixed(1);
}

export default function MesuresPage() {
  const { token, profile } = useAuth();
  const [users, setUsers] = useState<PickUser[]>([]);
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<Mesure[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [poids, setPoids] = useState("");
  const [fc, setFc] = useState("");
  const [sommeil, setSommeil] = useState("");
  const [calories, setCalories] = useState("");

  useEffect(() => {
    if (!token || !profile) return;
    fetchUsersForPicker(token, profile).then(setUsers).catch(() => {});
  }, [token, profile]);

  useEffect(() => {
    if (users.length && !userId) setUserId(users[0].id_utilisateur);
  }, [users, userId]);

  const loadMesures = useCallback(async (uid: string) => {
    if (!token || !uid) return;
    setLoading(true);
    const data = await apiFetch<Mesure[]>("/mesures", { token, params: { utilisateur_id: uid, limit: "200" } });
    setRows(Array.isArray(data) ? data.sort((a, b) => b.date_mesure.localeCompare(a.date_mesure)) : []);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token || !userId) return;
    let cancelled = false;
    loadMesures(userId).catch((e) => { if (!cancelled) setErr(String(e)); });
    return () => { cancelled = true; };
  }, [token, userId, loadMesures]);

  async function onDelete(id: string) {
    if (!token || !confirm("Supprimer cette mesure ?")) return;
    try {
      await apiFetch(`/mesures/${id}`, { method: "DELETE", token });
      setRows((prev) => prev.filter((m) => m.id_mesure !== id));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    }
  }

  function exportCSV() {
    const headers = ["date_mesure", "poids", "frequence_cardiaque", "sommeil", "calories_brulees"];
    const csv = [headers.join(","), ...rows.map((m) =>
      [m.date_mesure, m.poids ?? "", m.frequence_cardiaque ?? "", m.sommeil ?? "", m.calories_brulees ?? ""].join(",")
    )].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "mesures.csv";
    a.click();
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !userId) return;
    setErr(null); setMsg(null); setSaving(true);
    try {
      const p = parseFloat(poids); const f = parseInt(fc, 10);
      const s = parseFloat(sommeil); const c = parseFloat(calories);
      await apiFetch("/mesures", {
        method: "POST", token,
        body: {
          id_utilisateur: userId,
          poids: p > 0 ? p : null,
          frequence_cardiaque: f > 0 ? f : null,
          sommeil: s > 0 ? s : null,
          calories_brulees: c > 0 ? c : null,
        },
      });
      setMsg("Mesure enregistrée.");
      setShowForm(false);
      setPoids(""); setFc(""); setSommeil(""); setCalories("");
      await loadMesures(userId);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setSaving(false);
    }
  }

  const latest = rows[0];
  const prev = rows[1];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mesures biométriques"
        subtitle="Suivez l'évolution de vos indicateurs de santé"
        action={
          <div className="flex gap-2">
            {rows.length > 0 && <Btn size="sm" variant="ghost" onClick={exportCSV}><IconDownload size={14} /> CSV</Btn>}
            <Btn size="sm" onClick={() => setShowForm(!showForm)}><IconPlus size={14} /> Nouvelle mesure</Btn>
          </div>
        }
      />

      {msg && <Alert variant="success"><IconCheck size={14} /><span>{msg}</span></Alert>}
      {err && <Alert variant="error"><IconAlertCircle size={14} /><span>{err}</span></Alert>}

      {users.length > 1 && (
        <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="max-w-xs">
          {users.map((u) => <option key={u.id_utilisateur} value={u.id_utilisateur}>{labelUser(u)}</option>)}
        </Select>
      )}

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Poids"
            value={latest.poids != null ? `${latest.poids} kg` : "—"}
            icon={<IconActivity size={18} />}
            color="blue"
            sub={diff(latest.poids, prev?.poids) ? `${diff(latest.poids, prev?.poids)} kg vs précédent` : `Dernière : ${fmt(latest.date_mesure)}`}
          />
          <StatCard
            label="Fréq. cardiaque"
            value={latest.frequence_cardiaque != null ? `${latest.frequence_cardiaque} bpm` : "—"}
            icon={<IconHeart size={18} />}
            color="cyan"
            sub={diff(latest.frequence_cardiaque, prev?.frequence_cardiaque) ?? ""}
          />
          <StatCard
            label="Sommeil"
            value={latest.sommeil != null ? `${latest.sommeil} h` : "—"}
            icon={<IconMoon size={18} />}
            color="purple"
            sub={diff(latest.sommeil, prev?.sommeil) ?? ""}
          />
          <StatCard
            label="Calories brûlées"
            value={latest.calories_brulees != null ? `${latest.calories_brulees}` : "—"}
            icon={<IconFlame size={18} />}
            color="amber"
            sub="kcal"
          />
        </div>
      )}

      {showForm && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Nouvelle mesure</h2>
          <form onSubmit={onAdd} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="Poids (kg)" type="number" step="0.1" min="0" value={poids} onChange={(e) => setPoids(e.target.value)} placeholder="70.5" />
            <Input label="Fréq. cardiaque (bpm)" type="number" min="0" value={fc} onChange={(e) => setFc(e.target.value)} placeholder="72" />
            <Input label="Sommeil (h)" type="number" step="0.5" min="0" value={sommeil} onChange={(e) => setSommeil(e.target.value)} placeholder="7.5" />
            <Input label="Calories brûlées" type="number" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="500" />
            <div className="col-span-2 sm:col-span-4 flex gap-2">
              <Btn type="submit" loading={saving} size="sm">Enregistrer</Btn>
              <Btn type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Btn>
            </div>
          </form>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Historique</h2>
        {loading ? <SkeletonTable rows={5} cols={5} /> : rows.length === 0 ? (
          <EmptyState
            message="Aucune mesure enregistrée."
            action={<Btn size="sm" onClick={() => setShowForm(true)}><IconPlus size={14} /> Ajouter</Btn>}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800">
                  {["Date", "Poids", "Fréq. cardiaque", "Sommeil", "Calories brûlées", ""].map((h) => (
                    <th key={h} scope="col" className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((m, i) => {
                  const p = rows[i + 1];
                  return (
                    <tr key={m.id_mesure} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            <IconActivity size={12} className="text-slate-400" />
                          </div>
                          <span className="text-slate-200">{fmt(m.date_mesure)}</span>
                          {i === 0 && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">Dernière</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {m.poids != null ? (
                          <span>
                            <span className="font-medium text-white">{m.poids}</span>
                            <span className="text-slate-500 text-xs"> kg</span>
                            {diff(m.poids, p?.poids) && (
                              <span className={`ml-1.5 text-xs ${Number(diff(m.poids, p?.poids)) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                {diff(m.poids, p?.poids)}
                              </span>
                            )}
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {m.frequence_cardiaque != null ? (
                          <span className="flex items-center gap-1.5">
                            <IconHeart size={11} className="text-red-400" />
                            <span className="font-medium text-white">{m.frequence_cardiaque}</span>
                            <span className="text-slate-500 text-xs">bpm</span>
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {m.sommeil != null ? (
                          <span><span className="font-medium text-white">{m.sommeil}</span><span className="text-slate-500 text-xs"> h</span></span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {m.calories_brulees != null ? (
                          <span><span className="font-medium text-white">{m.calories_brulees}</span><span className="text-slate-500 text-xs"> kcal</span></span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => onDelete(m.id_mesure)} className="text-slate-600 hover:text-red-400 transition-colors">
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
    </div>
  );
}
