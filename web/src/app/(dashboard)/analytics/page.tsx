"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { fetchAll } from "@/lib/fetch-all";
import { labelUser, type PickUser } from "@/lib/picker-users";
import { PageHeader, Card, SkeletonTable } from "@/components/ui";
import {
  IconShield, IconUsers, IconLeaf, IconDumbbell,
  IconActivity, IconBook, IconTimer, IconBarChart,
} from "@/components/icons";
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

type Counts = {
  utilisateurs: number;
  aliments: number;
  exercices: number;
  mesures: number;
  journal: number;
  sessions: number;
};

type JournalRow = {
  id_utilisateur: string;
  id_aliment: string;
  date_consommation?: string;
  aliment?: { nom?: string };
};

type SessionRow = {
  id_utilisateur: string;
  intensite?: string;
  date_session?: string;
};

type MesureRow = {
  id_utilisateur: string;
  date_mesure: string;
};

const METRICS = [
  { key: "utilisateurs" as keyof Counts, label: "Utilisateurs", short: "Util.", icon: <IconUsers size={18} />, color: "text-blue-400", bg: "bg-blue-500/10", fill: "#3b82f6" },
  { key: "aliments" as keyof Counts, label: "Aliments", short: "Alim.", icon: <IconLeaf size={18} />, color: "text-emerald-400", bg: "bg-emerald-500/10", fill: "#10b981" },
  { key: "exercices" as keyof Counts, label: "Exercices", short: "Ex.", icon: <IconDumbbell size={18} />, color: "text-cyan-400", bg: "bg-cyan-500/10", fill: "#06b6d4" },
  { key: "mesures" as keyof Counts, label: "Mesures", short: "Mes.", icon: <IconActivity size={18} />, color: "text-purple-400", bg: "bg-purple-500/10", fill: "#a855f7" },
  { key: "journal" as keyof Counts, label: "Journal", short: "Jour.", icon: <IconBook size={18} />, color: "text-amber-400", bg: "bg-amber-500/10", fill: "#f59e0b" },
  { key: "sessions" as keyof Counts, label: "Sessions", short: "Sess.", icon: <IconTimer size={18} />, color: "text-red-400", bg: "bg-red-500/10", fill: "#ef4444" },
];

const INTENSITY_LABELS: Record<string, string> = {
  faible: "Faible",
  moderee: "Modérée",
  elevee: "Élevée",
};

const chartTooltipStyle = {
  backgroundColor: "rgba(15, 23, 42, 0.95)",
  border: "1px solid rgba(51, 65, 85, 0.8)",
  borderRadius: "8px",
  color: "#f1f5f9",
};

const axisTick = { fill: "#94a3b8", fontSize: 11 };

function DataModelSection({ captionId }: { captionId: string }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-white mb-2">Modèle des relations entre les données</h2>
      <p className="text-xs text-slate-400 mb-4">
        Vue logique reliant les utilisateurs aux contenus qu’ils saisissent (référentiel aliments / exercices, journal, séances, mesures).
      </p>
      <div
        className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 overflow-x-auto"
        role="region"
        aria-labelledby={captionId}
      >
        <p id={captionId} className="sr-only">
          Schéma verbal pour l’accessibilité : un utilisateur est lié à plusieurs entrées du journal alimentaire,
          chaque entrée référence un aliment du référentiel. Un utilisateur enregistre plusieurs sessions sport ;
          chaque session peut contenir plusieurs exercices du référentiel. Les mesures biométriques sont rattachées
          à un utilisateur et datées.
        </p>
        <div className="flex flex-col gap-6 min-w-[280px]" aria-hidden="true">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-300">
            <span className="rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-blue-200">Utilisateur</span>
            <span className="text-slate-500" aria-hidden>
              1 — n
            </span>
            <span className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-amber-200">Journal</span>
            <span className="text-slate-500">→</span>
            <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-emerald-200">Aliment</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-300">
            <span className="rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-blue-200">Utilisateur</span>
            <span className="text-slate-500">1 — n</span>
            <span className="rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-red-200">Session</span>
            <span className="text-slate-500">→</span>
            <span className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-cyan-200">Exercice</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-300">
            <span className="rounded-lg border border-blue-500/40 bg-blue-500/15 px-3 py-2 text-blue-200">Utilisateur</span>
            <span className="text-slate-500">1 — n</span>
            <span className="rounded-lg border border-purple-500/40 bg-purple-500/15 px-3 py-2 text-purple-200">Mesure</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { token, profile } = useAuth();
  const [users, setUsers] = useState<PickUser[]>([]);
  const [journal, setJournal] = useState<JournalRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [mesures, setMesures] = useState<MesureRow[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const modelCaptionId = useId();
  const volumeSummaryId = useId();

  useEffect(() => {
    if (!token || profile?.app_role !== "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const [u, a, e, m, j, s] = await Promise.all([
          fetchAll<PickUser>("/utilisateurs", token),
          fetchAll<unknown>("/aliments", token),
          fetchAll<unknown>("/exercices", token),
          fetchAll<MesureRow>("/mesures", token),
          fetchAll<JournalRow>("/journal", token),
          fetchAll<SessionRow>("/sessions", token),
        ]);
        if (!cancelled) {
          setUsers(u);
          setJournal(j);
          setSessions(s);
          setMesures(m);
          setCounts({
            utilisateurs: u.length,
            aliments: a.length,
            exercices: e.length,
            mesures: m.length,
            journal: j.length,
            sessions: s.length,
          });
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token, profile?.app_role]);

  const userLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of users) m.set(u.id_utilisateur, labelUser(u));
    return m;
  }, [users]);

  const activityByUser = useMemo(() => {
    const map = new Map<string, { j: number; s: number; meas: number }>();
    for (const u of users) {
      map.set(u.id_utilisateur, { j: 0, s: 0, meas: 0 });
    }
    for (const row of journal) {
      const cur = map.get(row.id_utilisateur) ?? { j: 0, s: 0, meas: 0 };
      cur.j += 1;
      map.set(row.id_utilisateur, cur);
    }
    for (const row of sessions) {
      const cur = map.get(row.id_utilisateur) ?? { j: 0, s: 0, meas: 0 };
      cur.s += 1;
      map.set(row.id_utilisateur, cur);
    }
    for (const row of mesures) {
      const cur = map.get(row.id_utilisateur) ?? { j: 0, s: 0, meas: 0 };
      cur.meas += 1;
      map.set(row.id_utilisateur, cur);
    }
    return [...map.entries()]
      .map(([id_utilisateur, v]) => ({
        id_utilisateur,
        label: userLabel.get(id_utilisateur) ?? id_utilisateur,
        ...v,
        total: v.j + v.s + v.meas,
      }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  }, [users, journal, sessions, mesures, userLabel]);

  const topAliments = useMemo(() => {
    const byId = new Map<string, { nom: string; count: number }>();
    for (const row of journal) {
      const nom = row.aliment?.nom?.trim() || "Aliment (réf.)";
      const prev = byId.get(row.id_aliment);
      if (prev) byId.set(row.id_aliment, { nom: prev.nom, count: prev.count + 1 });
      else byId.set(row.id_aliment, { nom, count: 1 });
    }
    return [...byId.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [journal]);

  const intensitySlices = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of sessions) {
      const raw = row.intensite?.toLowerCase().trim() || "";
      const key = raw in INTENSITY_LABELS ? raw : "autre";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([key, value]) => ({
      name: INTENSITY_LABELS[key as keyof typeof INTENSITY_LABELS] ?? (key === "autre" ? "Non renseigné / autre" : key),
      value,
    })).filter((s) => s.value > 0);
  }, [sessions]);

  const journalByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of journal) {
      if (!row.date_consommation) continue;
      const d = new Date(row.date_consommation);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, entrees]) => ({
        mois: `${mois.slice(5, 7)}/${mois.slice(0, 4)}`,
        entrees,
      }));
  }, [journal]);

  const volumesChartData = useMemo(() => {
    if (!counts) return [];
    return METRICS.map((m) => ({
      name: m.short,
      label: m.label,
      total: counts[m.key],
      fill: m.fill,
    }));
  }, [counts]);

  if (profile?.app_role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="text-center">
          <IconShield size={32} className="mx-auto mb-3 text-slate-600" aria-hidden />
          <p className="font-medium text-white">Accès restreint</p>
          <p className="text-sm mt-1">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord analytique"
        subtitle="Visualisation des volumes et des liens entre entités — données réelles issues de l’API (parcours administration)."
      />

      <p className="text-xs text-slate-500 border-l-2 border-blue-500/40 pl-3">
        Les graphiques utilisent une couche d’accessibilité (navigation clavier et lecteurs d’écran lorsque supporté par le composant).
        Les tableaux incluent des en-têtes portant <span className="text-slate-400">scope=&quot;col&quot;</span> et des légendes visibles pour le contexte.
      </p>

      {err && (
        <p className="text-sm text-red-400" role="alert" aria-live="assertive">
          {err}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
                <div className="h-3 w-24 bg-slate-800 rounded mb-3" />
                <div className="h-7 w-16 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
          <SkeletonTable rows={6} cols={5} />
          <SkeletonTable rows={8} cols={2} />
        </div>
      ) : counts && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {METRICS.map((m) => (
              <Card key={m.key}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{m.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white tabular-nums">
                      {counts[m.key].toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${m.bg} ${m.color}`} aria-hidden>{m.icon}</div>
                </div>
              </Card>
            ))}
          </div>

          <DataModelSection captionId={modelCaptionId} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center gap-2 mb-1">
                <IconBarChart size={16} className="text-slate-400" aria-hidden />
                <h2 className="text-sm font-semibold text-white">Volumes enregistrés par domaine</h2>
              </div>
              <p id={volumeSummaryId} className="sr-only">
                Histogramme des totaux : utilisateurs, aliments, exercices, mesures, entrées de journal et sessions sport.
              </p>
              <div className="h-72 mt-4 w-full" role="presentation">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart
                    data={volumesChartData}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                    accessibilityLayer
                    aria-describedby={volumeSummaryId}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="name" tick={axisTick} />
                    <YAxis tick={axisTick} allowDecimals={false} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number, _n, item) => [value.toLocaleString("fr-FR"), (item?.payload as { label?: string })?.label ?? "Total"]}
                      labelFormatter={() => ""}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Enregistrements">
                      {volumesChartData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </RBarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-white mb-1">Répartition des séances par intensité</h2>
              <p className="text-xs text-slate-500 mb-2">Lien comportemental : fréquence déclarée sur les sessions sport.</p>
              {intensitySlices.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">Aucune session en base.</p>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie
                        data={intensitySlices}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={76}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)} %`}
                      >
                        {intensitySlices.map((_, i) => (
                          <Cell key={`int-${i}`} fill={["#34d399", "#fbbf24", "#f87171", "#64748b"][i % 4]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [v.toLocaleString("fr-FR"), "Sessions"]} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {journalByMonth.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-white mb-1">Entrées du journal alimentaire par mois</h2>
              <p className="text-xs text-slate-500 mb-4">Série temporelle des consommations (relation utilisateur → aliment dans le temps).</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={journalByMonth} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="mois" tick={axisTick} />
                    <YAxis tick={axisTick} allowDecimals={false} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="entrees" name="Entrées" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {counts.utilisateurs > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-white mb-4">Moyennes par utilisateur inscrit</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Mesures / utilisateur", value: (counts.mesures / counts.utilisateurs).toFixed(1) },
                  { label: "Entrées journal / utilisateur", value: (counts.journal / counts.utilisateurs).toFixed(1) },
                  { label: "Sessions / utilisateur", value: (counts.sessions / counts.utilisateurs).toFixed(1) },
                  { label: "Exercices réf. / utilisateur", value: (counts.exercices / counts.utilisateurs).toFixed(1) },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="mt-1 text-lg font-semibold text-white tabular-nums">{s.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-sm font-semibold text-white mb-2">Synthèse d’activité par utilisateur</h2>
            <p className="text-xs text-slate-500 mb-4">
              Croisement réel des clés étrangères : entrées journal, sessions et mesures par identifiant utilisateur (20 profils les plus actifs).
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-sm text-left">
                <caption className="text-left text-xs text-slate-500 px-4 py-2 border-b border-slate-800">
                  Tableau des volumes par utilisateur : journal, sessions sport, mesures biométriques.
                </caption>
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th scope="col" className="px-4 py-3 font-medium">Utilisateur</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right tabular-nums">Journal</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right tabular-nums">Sessions</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right tabular-nums">Mesures</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right tabular-nums">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activityByUser.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Aucune activité enregistrée pour l’instant.
                      </td>
                    </tr>
                  ) : (
                    activityByUser.map((r) => (
                      <tr key={r.id_utilisateur} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <th scope="row" className="px-4 py-3 font-normal text-slate-200 max-w-[200px] truncate" title={r.label}>
                          {r.label}
                        </th>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">{r.j.toLocaleString("fr-FR")}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">{r.s.toLocaleString("fr-FR")}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">{r.meas.toLocaleString("fr-FR")}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-white">{r.total.toLocaleString("fr-FR")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-white mb-2">Aliments les plus enregistrés dans le journal</h2>
            <p className="text-xs text-slate-500 mb-4">
              Agrégation sur la relation journal → aliment (top 12).
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-sm text-left">
                <caption className="text-left text-xs text-slate-500 px-4 py-2 border-b border-slate-800">
                  Fréquence d’apparition des aliments dans les entrées du journal.
                </caption>
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th scope="col" className="px-4 py-3 font-medium">Rang</th>
                    <th scope="col" className="px-4 py-3 font-medium">Aliment</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right tabular-nums">Entrées</th>
                  </tr>
                </thead>
                <tbody>
                  {topAliments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        Aucune entrée de journal.
                      </td>
                    </tr>
                  ) : (
                    topAliments.map((a, i) => (
                      <tr key={`${a.nom}-${i}`} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                        <td className="px-4 py-3 tabular-nums text-slate-500 w-12">{i + 1}</td>
                        <th scope="row" className="px-4 py-3 font-normal text-slate-200">{a.nom}</th>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">{a.count.toLocaleString("fr-FR")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
