"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { StatCard, Card, Skeleton, Btn, Badge } from "@/components/ui";
import { MoodPicker } from "@/components/mood-picker";
import { InjuryModal } from "@/components/injury-body-map";
import { useWellness } from "@/hooks/use-wellness";
import { pickMotivation, INJURY_ZONE_LABELS, type Mood } from "@/lib/wellness";
import {
  IconUsers, IconLeaf, IconDumbbell, IconBook,
  IconTimer, IconActivity, IconChevronRight,
} from "@/components/icons";

type Stats = {
  aliments: number;
  exercices: number;
};

const QUICK_LINKS = [
  { href: "/journal", label: "Journal alimentaire", desc: "Suivre mes repas", icon: <IconBook size={18} /> },
  { href: "/sessions", label: "Sessions sport", desc: "Enregistrer une séance", icon: <IconTimer size={18} /> },
  { href: "/mesures", label: "Mesures", desc: "Saisir mes indicateurs", icon: <IconActivity size={18} /> },
  { href: "/exercices", label: "Exercices", desc: "Parcourir la bibliothèque", icon: <IconDumbbell size={18} /> },
];

export default function HomePage() {
  const { token, profile } = useAuth();
  const { mood, injuries, setMood, toggleInjury, clearInjuries, syncing } = useWellness();
  const [injuryOpen, setInjuryOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [a, e] = await Promise.all([
          apiFetch<unknown[]>("/aliments", { token, params: { limit: "1000" } }),
          apiFetch<unknown[]>("/exercices", { token, params: { limit: "1000" } }),
        ]);
        if (!cancelled) {
          setStats({
            aliments: Array.isArray(a) ? a.length : 0,
            exercices: Array.isArray(e) ? e.length : 0,
          });
          setApiOk(true);
        }
      } catch {
        if (!cancelled) setApiOk(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const firstName = profile?.prenom || profile?.email?.split("@")[0] || "vous";
  const isAdmin = profile?.app_role === "admin";

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${apiOk === null ? "bg-slate-500" : apiOk ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className="text-xs text-slate-500">
            {apiOk === null ? "Connexion en cours…" : apiOk ? "Système opérationnel" : "API partiellement indisponible"}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-white">
          Bonjour, <span className="text-blue-400">{firstName}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Humeur + motivation (préparation coach IA) */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-medium text-white">Comment vous sentez-vous ?</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choisissez votre humeur — elle servira aux conseils personnalisés.
            </p>
          </div>
          {mood && (
            <Badge variant="blue">
              {mood === "content" ? "Content" : mood === "triste" ? "Triste" : mood === "colere" ? "En colère" : "Normal"}
            </Badge>
          )}
        </div>
        <MoodPicker value={mood} onChange={(m) => void setMood(m)} disabled={syncing} />
        {mood && (
          <p className="mt-4 text-sm text-slate-300 border-t border-slate-800 pt-4 italic">
            « {pickMotivation(mood as Mood)} »
          </p>
        )}
      </Card>

      {/* Blessure */}
      <Card className="border-red-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-white">Signaler une blessure</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Indiquez les zones douloureuses pour adapter vos séances.
            </p>
            {injuries.length > 0 && (
              <p className="text-xs text-red-400/90 mt-2">
                {injuries.length} zone{injuries.length > 1 ? "s" : ""} :{" "}
                {injuries.map((z) => INJURY_ZONE_LABELS[z] ?? z).join(", ")}
              </p>
            )}
          </div>
          <Btn variant="danger" onClick={() => setInjuryOpen(true)}>
            Je suis blessé·e
          </Btn>
        </div>
      </Card>

      <InjuryModal
        open={injuryOpen}
        onClose={() => setInjuryOpen(false)}
        selected={injuries}
        onToggle={(z) => void toggleInjury(z)}
        onClear={() => void clearInjuries()}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats === null ? (
          Array.from({ length: isAdmin ? 4 : 2 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Aliments" value={stats.aliments} icon={<IconLeaf size={18} />} color="emerald" sub="en base" />
            <StatCard label="Exercices" value={stats.exercices} icon={<IconDumbbell size={18} />} color="blue" sub="disponibles" />
            {isAdmin && (
              <>
                <AdminUserStat token={token!} />
              </>
            )}
          </>
        )}
      </div>

      {/* Quick access */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">Accès rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 hover:border-slate-700 hover:bg-slate-800/50 transition-all"
            >
              <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <IconChevronRight size={14} aria-hidden="true" className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Profile completion */}
      {!profile?.prenom && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <IconUsers size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Complétez votre profil</p>
              <p className="text-xs text-slate-400 mt-0.5">Ajoutez votre prénom, poids, taille et objectifs pour une expérience personnalisée.</p>
            </div>
            <Link
              href="/profil"
              className="shrink-0 text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Compléter <IconChevronRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function AdminUserStat({ token }: { token: string }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    apiFetch<unknown[]>("/utilisateurs", { token, params: { limit: "1000" } }).then((d) => setCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
  }, [token]);
  return (
    <StatCard
      label="Utilisateurs"
      value={count ?? "—"}
      icon={<IconUsers size={18} />}
      color="purple"
      sub="inscrits"
    />
  );
}
