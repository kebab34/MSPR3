"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { INJURY_ZONE_LABELS } from "@/lib/wellness";
import { Btn } from "@/components/ui";

type ZoneDef = {
  id: string;
  label: string;
  d: string;
  view: "front" | "back";
};

/** Zones cliquables (face avant / arrière). */
const ZONES: ZoneDef[] = [
  { id: "tete", label: "Tête", view: "front", d: "M100,28 m-18,0 a18,22 0 1,0 36,0 a18,22 0 1,0 -36,0" },
  { id: "cou", label: "Cou", view: "front", d: "M88,48 h24 v12 h-24 z" },
  { id: "epaule_gauche", label: "Épaule G", view: "front", d: "M52,58 L72,52 L78,68 L58,74 z" },
  { id: "epaule_droite", label: "Épaule D", view: "front", d: "M148,58 L128,52 L122,68 L142,74 z" },
  { id: "poitrine", label: "Poitrine", view: "front", d: "M78,68 h44 v36 h-44 z" },
  { id: "biceps_gauche", label: "Biceps G", view: "front", d: "M48,72 L68,68 L62,108 L42,112 z" },
  { id: "biceps_droit", label: "Biceps D", view: "front", d: "M152,72 L132,68 L138,108 L158,112 z" },
  { id: "avant_bras_gauche", label: "Avant-bras G", view: "front", d: "M38,110 L58,106 L52,148 L32,152 z" },
  { id: "avant_bras_droit", label: "Avant-bras D", view: "front", d: "M162,110 L142,106 L148,148 L168,152 z" },
  { id: "main_gauche", label: "Main G", view: "front", d: "M28,150 m-12,0 a12,14 0 1,0 24,0 a12,14 0 1,0 -24,0" },
  { id: "main_droite", label: "Main D", view: "front", d: "M172,150 m-12,0 a12,14 0 1,0 24,0 a12,14 0 1,0 -24,0" },
  { id: "abdominaux", label: "Abdominaux", view: "front", d: "M82,104 h36 v40 h-36 z" },
  { id: "fessiers", label: "Fessiers", view: "front", d: "M78,144 h44 v28 h-44 z" },
  { id: "quadriceps_gauche", label: "Quadriceps G", view: "front", d: "M82,172 h22 v52 h-22 z" },
  { id: "quadriceps_droit", label: "Quadriceps D", view: "front", d: "M116,172 h22 v52 h-22 z" },
  { id: "genou_gauche", label: "Genou G", view: "front", d: "M91,222 m-14,0 a14,12 0 1,0 28,0 a14,12 0 1,0 -28,0" },
  { id: "genou_droit", label: "Genou D", view: "front", d: "M129,222 m-14,0 a14,12 0 1,0 28,0 a14,12 0 1,0 -28,0" },
  { id: "mollet_gauche", label: "Mollet G", view: "front", d: "M86,234 h18 v44 h-18 z" },
  { id: "mollet_droit", label: "Mollet D", view: "front", d: "M116,234 h18 v44 h-18 z" },
  { id: "cheville_gauche", label: "Cheville G", view: "front", d: "M93,276 m-10,0 a10,8 0 1,0 20,0 a10,8 0 1,0 -20,0" },
  { id: "cheville_droite", label: "Cheville D", view: "front", d: "M127,276 m-10,0 a10,8 0 1,0 20,0 a10,8 0 1,0 -20,0" },
  { id: "pied_gauche", label: "Pied G", view: "front", d: "M80,286 h24 v14 h-24 z" },
  { id: "pied_droit", label: "Pied D", view: "front", d: "M116,286 h24 v14 h-24 z" },
  { id: "dos_haut", label: "Haut du dos", view: "back", d: "M78,58 h44 v48 h-44 z" },
  { id: "dos_bas", label: "Lombaires", view: "back", d: "M80,106 h40 v42 h-40 z" },
  { id: "triceps_gauche", label: "Triceps G", view: "back", d: "M48,72 L68,68 L62,108 L42,112 z" },
  { id: "triceps_droit", label: "Triceps D", view: "back", d: "M152,72 L132,68 L138,108 L158,112 z" },
  { id: "ischio_jambier_gauche", label: "Ischio G", view: "back", d: "M82,172 h22 v48 h-22 z" },
  { id: "ischio_jambier_droit", label: "Ischio D", view: "back", d: "M116,172 h22 v48 h-22 z" },
];

function BodySilhouette({ view }: { view: "front" | "back" }) {
  const stroke = "#475569";
  const fill = "#1e293b";
  return (
    <g opacity={0.9} pointerEvents="none">
      <ellipse cx="100" cy="30" rx="20" ry="24" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <rect x="88" y="48" width="24" height="14" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <path
        d="M72,62 Q100,55 128,62 L132,148 Q100,158 68,148 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <line x1="100" y1="62" x2="100" y2="148" stroke={stroke} strokeWidth="1" opacity={0.4} />
      {view === "back" && (
        <path d="M88,70 Q100,65 112,70" fill="none" stroke={stroke} strokeWidth="1" opacity={0.5} />
      )}
      <line x1="72" y1="68" x2="42" y2="112" stroke={stroke} strokeWidth="8" strokeLinecap="round" />
      <line x1="128" y1="68" x2="158" y2="112" stroke={stroke} strokeWidth="8" strokeLinecap="round" />
      <line x1="42" y1="112" x2="32" y2="158" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      <line x1="158" y1="112" x2="168" y2="158" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      <line x1="88" y1="148" x2="82" y2="228" stroke={stroke} strokeWidth="9" strokeLinecap="round" />
      <line x1="112" y1="148" x2="118" y2="228" stroke={stroke} strokeWidth="9" strokeLinecap="round" />
      <line x1="82" y1="228" x2="80" y2="292" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
      <line x1="118" y1="228" x2="120" y2="292" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

function BodyMapSvg({
  view,
  selected,
  onToggle,
}: {
  view: "front" | "back";
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const visible = ZONES.filter((z) => z.view === view);
  return (
    <svg
      viewBox="0 0 200 310"
      className="w-full max-w-[220px] mx-auto"
      role="img"
      aria-label={`Schéma corporel — ${view === "front" ? "face avant" : "face arrière"}`}
    >
      <BodySilhouette view={view} />
      {visible.map((zone) => {
        const isOn = selected.includes(zone.id);
        return (
          <path
            key={zone.id}
            d={zone.d}
            className={cn(
              "cursor-pointer transition-colors duration-150",
              isOn ? "fill-red-500/85 stroke-red-400" : "fill-slate-700/40 stroke-slate-600 hover:fill-slate-600/60"
            )}
            strokeWidth={isOn ? 2 : 1}
            onClick={() => onToggle(zone.id)}
          >
            <title>{zone.label}</title>
          </path>
        );
      })}
    </svg>
  );
}

export function InjuryBodyMap({
  selected,
  onToggle,
  onClear,
}: {
  selected: string[];
  onToggle: (zoneId: string) => void;
  onClear: () => void;
}) {
  const [view, setView] = useState<"front" | "back">("front");

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-slate-700 p-0.5 bg-slate-800/50">
        <button
          type="button"
          onClick={() => setView("front")}
          className={cn(
            "flex-1 text-xs py-2 rounded-md font-medium transition-colors",
            view === "front" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
          )}
        >
          Face avant
        </button>
        <button
          type="button"
          onClick={() => setView("back")}
          className={cn(
            "flex-1 text-xs py-2 rounded-md font-medium transition-colors",
            view === "back" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
          )}
        >
          Face arrière
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Touchez une zone (articulation ou muscle) — elle s&apos;affiche en rouge.
      </p>

      <BodyMapSvg view={view} selected={selected} onToggle={onToggle} />

      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400">Zones signalées</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(id)}
                className="text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25"
              >
                {INJURY_ZONE_LABELS[id] ?? id} ×
              </button>
            ))}
          </div>
          <Btn variant="ghost" size="sm" onClick={onClear}>
            Effacer toutes les zones
          </Btn>
        </div>
      )}
    </div>
  );
}

export function InjuryModal({
  open,
  onClose,
  selected,
  onToggle,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onToggle: (zoneId: string) => void;
  onClear: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="injury-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="injury-modal-title" className="text-lg font-semibold text-white">
              Où êtes-vous blessé·e ?
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ces informations aideront à adapter vos exercices plus tard.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none px-2"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <InjuryBodyMap selected={selected} onToggle={onToggle} onClear={onClear} />
        <div className="mt-5 pt-4 border-t border-slate-800">
          <Btn className="w-full" onClick={onClose}>
            Valider
          </Btn>
        </div>
      </div>
    </div>
  );
}
