"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { fetchAll } from "@/lib/fetch-all";
import { fetchUsersForPicker, labelUser, type PickUser } from "@/lib/picker-users";
import { PageHeader, Btn, Card, Input, Select, Alert, SkeletonTable, EmptyState, Badge } from "@/components/ui";
import { IconTimer, IconPlus, IconAlertCircle, IconCheck, IconCalendar, IconZap, IconSearch, IconX, IconDumbbell, IconTrash, IconDownload } from "@/components/icons";

type SessionExercice = {
  id_exercice: string;
  nombre_series?: number;
  nombre_repetitions?: number;
  poids?: number;
  exercices?: { nom: string };
};

type Session = {
  id_session: string;
  id_utilisateur: string;
  duree?: number;
  intensite?: string;
  date_session?: string;
  created_at: string;
  session_exercices?: SessionExercice[];
};

type Exercice = { id_exercice: string; nom: string; groupe_musculaire?: string; niveau?: string };

type ExerciceSelection = {
  id_exercice: string;
  nom: string;
  nombre_series: string;
  nombre_repetitions: string;
  poids: string;
};

const INTENSITE_BADGE: Record<string, "emerald" | "amber" | "red"> = {
  faible: "emerald", moderee: "amber", elevee: "red",
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function SessionsPage() {
  const { token, profile } = useAuth();
  const [users, setUsers] = useState<PickUser[]>([]);
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateSession, setDateSession] = useState(() => new Date().toISOString().slice(0, 10));
  const [duree, setDuree] = useState("45");
  const [intensite, setIntensite] = useState<"faible" | "moderee" | "elevee">("moderee");

  // Exercices (liste complète issue de la base, jusqu’à 1000 entrées / requête API)
  const [allExercices, setAllExercices] = useState<Exercice[]>([]);
  const [exLoading, setExLoading] = useState(false);
  const [pickExerciceId, setPickExerciceId] = useState("");
  const [exSearch, setExSearch] = useState("");
  const [showExDrop, setShowExDrop] = useState(false);
  const [selectedEx, setSelectedEx] = useState<ExerciceSelection[]>([]);
  const exRef = useRef<HTMLDivElement>(null);

  const exSuggestions = useMemo(() => {
    const q = exSearch.toLowerCase().trim();
    return allExercices
      .filter((e) => !selectedEx.some((s) => s.id_exercice === e.id_exercice))
      .filter((e) => !q || e.nom.toLowerCase().includes(q));
  }, [allExercices, exSearch, selectedEx]);

  useEffect(() => {
    if (!token || !profile) return;
    fetchUsersForPicker(token, profile).then(setUsers).catch(() => {});
  }, [token, profile]);

  useEffect(() => {
    if (!token || !profile || !showForm) return;
    let cancelled = false;
    setExLoading(true);
    fetchAll<Exercice>("/exercices", token)
      .then((d) => { if (!cancelled) setAllExercices(d); })
      .catch(() => { if (!cancelled) setAllExercices([]); })
      .finally(() => { if (!cancelled) setExLoading(false); });
    return () => { cancelled = true; };
  }, [token, profile, showForm]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (exRef.current && !exRef.current.contains(e.target as Node)) setShowExDrop(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (users.length && !userId) setUserId(users[0].id_utilisateur);
  }, [users, userId]);

  useEffect(() => {
    if (!token || !userId) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<Session[]>("/sessions", { token, params: { utilisateur_id: userId, date_debut: dateDebut, date_fin: dateFin } })
      .then((d) => { if (!cancelled) { setRows(Array.isArray(d) ? d : []); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setErr(String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [token, userId, dateDebut, dateFin]);

  async function onDelete(id: string) {
    if (!token || !confirm("Supprimer cette session ?")) return;
    try {
      await apiFetch(`/sessions/${id}`, { method: "DELETE", token });
      setRows((prev) => prev.filter((s) => s.id_session !== id));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    }
  }

  function exportCSV() {
    const headers = ["date_session", "duree_min", "intensite"];
    const csv = [headers.join(","), ...rows.map((s) =>
      [s.date_session ?? "", s.duree ?? "", s.intensite ?? ""].join(",")
    )].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "sessions.csv";
    a.click();
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !userId) return;
    setErr(null); setMsg(null); setSaving(true);
    try {
      const d = parseInt(duree, 10);
      if (!d || d < 1) throw new Error("Durée invalide");
      await apiFetch("/sessions", {
        method: "POST", token,
        body: {
          id_utilisateur: userId,
          duree: d,
          intensite,
          date_session: new Date(dateSession).toISOString(),
          exercices: selectedEx.map((ex) => ({
            id_exercice: ex.id_exercice,
            nombre_series: ex.nombre_series ? parseInt(ex.nombre_series) : null,
            nombre_repetitions: ex.nombre_repetitions ? parseInt(ex.nombre_repetitions) : null,
            poids: ex.poids ? parseFloat(ex.poids) : null,
          })),
        },
      });
      setMsg("Session enregistrée.");
      setShowForm(false);
      setSelectedEx([]);
      setPickExerciceId("");
      setExSearch("");
      const data = await apiFetch<Session[]>("/sessions", { token, params: { utilisateur_id: userId, date_debut: dateDebut, date_fin: dateFin } });
      setRows(Array.isArray(data) ? data : []);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setSaving(false);
    }
  }

  const totalMin = rows.reduce((s, r) => s + (r.duree ?? 0), 0);
  const totalH = Math.floor(totalMin / 60);
  const restMin = totalMin % 60;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions sport"
        subtitle="Historique de vos séances d'entraînement"
        action={
          <div className="flex gap-2">
            {rows.length > 0 && <Btn size="sm" variant="ghost" onClick={exportCSV}><IconDownload size={14} /> CSV</Btn>}
            <Btn size="sm" onClick={() => setShowForm(!showForm)}><IconPlus size={14} /> Nouvelle session</Btn>
          </div>
        }
      />

      {msg && <Alert variant="success"><IconCheck size={14} /><span>{msg}</span></Alert>}
      {err && <Alert variant="error"><IconAlertCircle size={14} /><span>{err}</span></Alert>}

      {/* Add form */}
      {showForm && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Nouvelle session</h2>
          <form onSubmit={onAdd} className="space-y-4">
            {/* Infos de base */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="Date" type="date" value={dateSession} onChange={(e) => setDateSession(e.target.value)} />
              <Input label="Durée (min)" type="number" min={1} value={duree} onChange={(e) => setDuree(e.target.value)} />
              <Select label="Intensité" value={intensite} onChange={(e) => setIntensite(e.target.value as typeof intensite)}>
                <option value="faible">Faible</option>
                <option value="moderee">Modérée</option>
                <option value="elevee">Élevée</option>
              </Select>
              {users.length > 1 && (
                <Select label="Utilisateur" value={userId} onChange={(e) => setUserId(e.target.value)}>
                  {users.map((u) => <option key={u.id_utilisateur} value={u.id_utilisateur}>{labelUser(u)}</option>)}
                </Select>
              )}
            </div>

            {/* Sélecteur d'exercices */}
            <div>
              <p className="text-xs text-slate-400 mb-2">
                Exercices réalisés <span className="text-slate-600">(optionnel)</span>
                {!exLoading && (
                  <span className="text-slate-600">
                    {" "}· {allExercices.length} exercice{allExercices.length !== 1 ? "s" : ""} en base
                  </span>
                )}
              </p>

              <Select
                label="Choisir dans la base"
                className="mb-3"
                value={pickExerciceId}
                disabled={exLoading || allExercices.length === 0}
                onChange={(e) => {
                  const id = e.target.value;
                  setPickExerciceId("");
                  if (!id) return;
                  const ex = allExercices.find((x) => String(x.id_exercice) === id);
                  if (!ex || selectedEx.some((s) => String(s.id_exercice) === id)) return;
                  setSelectedEx((prev) => [...prev, {
                    id_exercice: String(ex.id_exercice),
                    nom: ex.nom,
                    nombre_series: "",
                    nombre_repetitions: "",
                    poids: "",
                  }]);
                }}
              >
                <option value="">
                  {exLoading ? "Chargement des exercices…" : allExercices.length === 0 ? "Aucun exercice en base" : "— Sélectionner un exercice —"}
                </option>
                {allExercices
                  .filter((e) => !selectedEx.some((s) => String(s.id_exercice) === String(e.id_exercice)))
                  .map((ex) => (
                    <option key={ex.id_exercice} value={String(ex.id_exercice)}>
                      {ex.nom}
                      {ex.groupe_musculaire ? ` (${ex.groupe_musculaire})` : ""}
                    </option>
                  ))}
              </Select>

              {!exLoading && allExercices.length === 0 && (
                <p className="text-xs text-amber-400/90 mb-3">
                  Aucun exercice en base pour l’instant. Ajoutez-les depuis le menu « Exercices » puis rouvrez ce formulaire.
                </p>
              )}

              <p className="text-xs text-slate-500 mb-1.5">Ou rechercher et cliquer sur une ligne :</p>
              <div className="relative" ref={exRef}>
                <div className="relative">
                  <IconSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden />
                  <input
                    type="text"
                    placeholder="Filtrer par nom…"
                    value={exSearch}
                    onChange={(e) => { setExSearch(e.target.value); setShowExDrop(true); }}
                    onFocus={() => setShowExDrop(true)}
                    disabled={exLoading || allExercices.length === 0}
                    className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    aria-autocomplete="list"
                    aria-expanded={showExDrop}
                    aria-controls="session-exercice-suggestions"
                  />
                </div>
                {showExDrop && !exLoading && allExercices.length > 0 && (
                  <ul
                    id="session-exercice-suggestions"
                    role="listbox"
                    className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-auto max-h-64"
                  >
                    {exSuggestions.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-slate-500">Aucun résultat pour cette recherche.</li>
                    ) : (
                      exSuggestions.map((ex) => (
                        <li
                          key={ex.id_exercice}
                          role="option"
                          onMouseDown={() => {
                            setSelectedEx((prev) => [...prev, {
                              id_exercice: String(ex.id_exercice),
                              nom: ex.nom,
                              nombre_series: "",
                              nombre_repetitions: "",
                              poids: "",
                            }]);
                            setExSearch("");
                            setShowExDrop(false);
                          }}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm"
                        >
                          <span className="text-slate-200">{ex.nom}</span>
                          {ex.groupe_musculaire && <span className="text-xs text-slate-500 ml-2 shrink-0">{ex.groupe_musculaire}</span>}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {/* Liste des exercices sélectionnés */}
              {selectedEx.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedEx.map((ex, i) => (
                    <div key={ex.id_exercice} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2">
                      <IconDumbbell size={13} className="text-blue-400 shrink-0" />
                      <span className="text-sm text-slate-200 flex-1 min-w-0 truncate">{ex.nom}</span>
                      <input
                        type="number" min={1} placeholder="Séries"
                        value={ex.nombre_series}
                        onChange={(e) => setSelectedEx((prev) => prev.map((s, j) => j === i ? { ...s, nombre_series: e.target.value } : s))}
                        className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number" min={1} placeholder="Reps"
                        value={ex.nombre_repetitions}
                        onChange={(e) => setSelectedEx((prev) => prev.map((s, j) => j === i ? { ...s, nombre_repetitions: e.target.value } : s))}
                        className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number" min={0} step={0.5} placeholder="kg"
                        value={ex.poids}
                        onChange={(e) => setSelectedEx((prev) => prev.map((s, j) => j === i ? { ...s, poids: e.target.value } : s))}
                        className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button type="button" onClick={() => setSelectedEx((prev) => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 transition-colors">
                        <IconX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Btn type="submit" loading={saving} size="sm">Enregistrer</Btn>
              <Btn type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setSelectedEx([]); setPickExerciceId(""); setExSearch(""); }}>Annuler</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Filters + stats */}
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
        {rows.length > 0 && (
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="text-slate-400"><span className="text-white font-semibold">{rows.length}</span> session{rows.length > 1 ? "s" : ""}</span>
            <span className="text-slate-400">Total : <span className="text-white font-semibold">{totalH > 0 ? `${totalH}h ` : ""}{restMin}min</span></span>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={5} cols={4} /> : rows.length === 0 ? (
        <EmptyState message="Aucune session sur cette période." action={<Btn size="sm" onClick={() => setShowForm(true)}><IconPlus size={14} /> Ajouter</Btn>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                {["Date", "Durée", "Intensité", "Exercices", "Enregistrée le", ""].map((h) => (
                  <th key={h} scope="col" className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id_session} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <IconTimer size={13} className="text-blue-400" />
                      </div>
                      <span className="text-slate-200">{fmt(s.date_session)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.duree != null ? (
                      <span className="font-semibold text-white">{s.duree} <span className="font-normal text-slate-400 text-xs">min</span></span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.intensite ? (
                      <span className="flex items-center gap-1.5">
                        <IconZap size={12} className={s.intensite === "elevee" ? "text-red-400" : s.intensite === "moderee" ? "text-amber-400" : "text-emerald-400"} />
                        <Badge variant={INTENSITE_BADGE[s.intensite] ?? "slate"}>{s.intensite}</Badge>
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.session_exercices && s.session_exercices.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {s.session_exercices.map((ex) => (
                          <span key={ex.id_exercice} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-xs">
                            <IconDumbbell size={10} />
                            {ex.exercices?.nom ?? "—"}
                            {ex.nombre_series && ex.nombre_repetitions && (
                              <span className="text-blue-400/60">{ex.nombre_series}×{ex.nombre_repetitions}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmt(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => onDelete(s.id_session)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <IconTrash size={14} />
                    </button>
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
