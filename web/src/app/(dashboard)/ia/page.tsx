"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useWellness } from "@/hooks/use-wellness";
import { apiFetch } from "@/lib/api";
import {
  buildWeeklyPlanPayload,
  suggestAlimentsForObjectifs,
  suggestExercicesForProfile,
  computeBmi,
  sexeLabel,
  nutritionPlanLabel,
  type AlimentItem,
  type ExerciceItem,
} from "@/lib/ia-profile";
import { INJURY_ZONE_LABELS } from "@/lib/wellness";
import { PageHeader, Card, Btn, Alert, Badge, Skeleton } from "@/components/ui";
import { IconDumbbell, IconLeaf, IconZap, IconAlertCircle, IconCheck } from "@/components/icons";

type WeeklyPlan = {
  recommended_plan: string;
  confidence: number;
  explanation?: string;
  objectifs: string[];
  zones_blessure: string[];
  injury_labels: string[];
  exercices_exclus_blessure: number;
  conseils: string[];
  jours: {
    jour: string;
    exercices: { nom?: string; type?: string; groupe_musculaire?: string; note?: string }[];
    repas: { type: string; label: string; aliments: { nom?: string; calories?: number }[] }[];
  }[];
};

const MEAL_LABELS: Record<string, string> = {
  "petit-dejeuner": "Petit-déj",
  dejeuner: "Déjeuner",
  diner: "Dîner",
};

export default function IARecommendationsPage() {
  const { token, profile, refreshProfile } = useAuth();
  const { injuries, mood } = useWellness();

  const [exercices, setExercices] = useState<ExerciceItem[]>([]);
  const [aliments, setAliments] = useState<AlimentItem[]>([]);
  const [selectedEx, setSelectedEx] = useState<Set<string>>(new Set());
  const [selectedAl, setSelectedAl] = useState<Set<string>>(new Set());
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchEx, setSearchEx] = useState("");
  const [searchAl, setSearchAl] = useState("");
  const [budgetJour, setBudgetJour] = useState<string>("");
  const [equipementDisponible, setEquipementDisponible] = useState<Set<string>>(new Set());

  // Vision — analyse de repas par photo
  type MealAnalysis = {
    aliments_identifies: { label: string; label_fr: string; score: number }[];
    aliment_principal: string;
    confiance: number;
    nutrition: { calories: number; proteines: number; glucides: number; lipides: number; fibres: number; unite: string };
    desequilibres: Record<string, string>;
    objectif: string;
    suggestions: string;
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mealObjectif, setMealObjectif] = useState("equilibre");
  const [mealLoading, setMealLoading] = useState(false);
  const [mealResult, setMealResult] = useState<MealAnalysis | null>(null);
  const [mealError, setMealError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImagePreview(URL.createObjectURL(f));
    setMealResult(null);
    setMealError(null);
  };

  const handleMealAnalysis = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) { setMealError("Sélectionnez une image."); return; }
    setMealLoading(true);
    setMealError(null);
    setMealResult(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("objectif", mealObjectif);
      const res = await fetch("/api/mspr/ia/analyze-meal", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || `HTTP ${res.status}`);
      }
      setMealResult(await res.json());
    } catch (err) {
      setMealError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setMealLoading(false);
    }
  };

  const objectifs = useMemo(
    () => (Array.isArray(profile?.objectifs) ? profile!.objectifs! : []),
    [profile?.objectifs]
  );

  const profileSummary = useMemo(() => {
    const poids = profile?.poids;
    const taille = profile?.taille;
    const age = profile?.age;
    const bmi = poids && taille ? computeBmi(poids, taille) : null;
    return { poids, taille, age, bmi, objectifs, sexe: sexeLabel(profile?.sexe) };
  }, [profile, objectifs]);

  const loadCatalog = useCallback(async () => {
    if (!token) return;
    setCatalogLoading(true);
    try {
      const [ex, al] = await Promise.all([
        apiFetch<ExerciceItem[]>("/exercices", { token, params: { limit: "500" } }),
        apiFetch<AlimentItem[]>("/aliments", { token, params: { limit: "500" } }),
      ]);
      const exList = Array.isArray(ex) ? ex : [];
      const alList = Array.isArray(al) ? al : [];
      setExercices(exList);
      setAliments(alList);

      const zones = injuries.length ? injuries : (profile?.zones_blessure ?? []);
      setSelectedEx(new Set(suggestExercicesForProfile(exList, objectifs, zones)));
      setSelectedAl(new Set(suggestAlimentsForObjectifs(alList, objectifs)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCatalogLoading(false);
    }
  }, [token, objectifs, injuries, profile?.zones_blessure]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const filteredEx = useMemo(() => {
    const q = searchEx.toLowerCase();
    return exercices.filter((e) => !q || e.nom.toLowerCase().includes(q));
  }, [exercices, searchEx]);

  const filteredAl = useMemo(() => {
    const q = searchAl.toLowerCase();
    return aliments.filter((a) => !q || a.nom.toLowerCase().includes(q));
  }, [aliments, searchAl]);

  function toggle(set: Set<string>, id: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  async function generatePlan() {
    if (!profile) {
      setError("Complétez votre profil (poids, taille, objectifs) dans l'onglet Profil.");
      return;
    }
    if (selectedEx.size === 0) {
      setError("Sélectionnez au moins un exercice.");
      return;
    }
    if (selectedAl.size === 0) {
      setError("Sélectionnez au moins un aliment pour composer vos repas.");
      return;
    }

    setLoading(true);
    setError(null);
    setPlan(null);

    const current = (await refreshProfile()) ?? profile;
    if (!current?.poids || !current?.taille) {
      setError("Complétez votre profil (poids, taille, objectifs) dans l'onglet Profil.");
      setLoading(false);
      return;
    }

    const payload = buildWeeklyPlanPayload(
      {
        prenom: current.prenom,
        age: current.age,
        sexe: current.sexe,
        poids: current.poids,
        taille: current.taille,
        objectifs: current.objectifs,
        humeur: mood ?? current.humeur,
        zones_blessure: injuries.length ? injuries : current.zones_blessure,
      },
      exercices.filter((e) => selectedEx.has(e.id_exercice)),
      aliments.filter((a) => selectedAl.has(a.id_aliment)),
      {
        equipement_disponible: Array.from(equipementDisponible),
        budget_jour: budgetJour ? parseFloat(budgetJour) : null,
      }
    );

    try {
      const data = await apiFetch<WeeklyPlan>("/ia/weekly-plan", {
        method: "POST",
        body: payload,
      });
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const profileIncomplete = !profile?.poids || !profile?.taille;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coach IA — Programme de la semaine"
        subtitle="Votre coach sportif construit entraînements et nutrition à partir de votre profil et de vos objectifs."
      />

      {/* Profil auto */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-3">Données utilisées automatiquement</h3>
        {profileIncomplete ? (
          <Alert variant="error">
            <IconAlertCircle size={14} aria-hidden="true" />
            <span>
              Renseignez votre <strong>poids</strong> et <strong>taille</strong> dans{" "}
              <a href="/profil" className="text-blue-400 underline">Profil</a> pour un programme précis.
            </span>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
            <div className="rounded-lg bg-slate-800/60 px-3 py-2">
              <p className="text-xs text-slate-500">Sexe / Âge</p>
              <p className="text-white font-medium">
                {profileSummary.sexe}
                {profileSummary.age ? ` · ${profileSummary.age} ans` : ""}
              </p>
            </div>
            <div className="rounded-lg bg-slate-800/60 px-3 py-2">
              <p className="text-xs text-slate-500">Poids / Taille</p>
              <p className="text-white font-medium">{profileSummary.poids} kg · {profileSummary.taille} cm</p>
            </div>
            <div className="rounded-lg bg-slate-800/60 px-3 py-2">
              <p className="text-xs text-slate-500">IMC</p>
              <p className="text-white font-medium">{profileSummary.bmi ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-slate-800/60 px-3 py-2">
              <p className="text-xs text-slate-500">Objectifs</p>
              <p className="text-white font-medium truncate">
                {objectifs.length ? objectifs.join(", ") : "Non définis"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-800/60 px-3 py-2">
              <p className="text-xs text-slate-500">Blessures</p>
              <p className="text-white font-medium truncate">
                {injuries.length
                  ? injuries.map((z) => INJURY_ZONE_LABELS[z] ?? z).join(", ")
                  : "Aucune"}
              </p>
            </div>
          </div>
        )}
        {mood && (
          <p className="mt-2 text-xs text-slate-500">Humeur du jour prise en compte : <Badge variant="blue">{mood}</Badge></p>
        )}
        {injuries.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Zones sensibles actives sur le{" "}
            <a href="/" className="text-blue-400 underline">tableau de bord</a>
            {" "}(schéma corporel). Désélectionnez-les si vous ne souhaitez pas les ménager.
          </p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sélection exercices */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <IconDumbbell size={16} className="text-blue-400" />
              Exercices de la semaine
            </h3>
            <Badge variant="slate">{selectedEx.size} sélectionné{selectedEx.size > 1 ? "s" : ""}</Badge>
          </div>
          <input
            placeholder="Rechercher un exercice…"
            value={searchEx}
            onChange={(e) => setSearchEx(e.target.value)}
            className="w-full mb-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
          />
          {catalogLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredEx.slice(0, 80).map((ex) => (
                <label
                  key={ex.id_exercice}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedEx.has(ex.id_exercice)}
                    onChange={() => toggle(selectedEx, ex.id_exercice, setSelectedEx)}
                    className="rounded border-slate-600"
                  />
                  <span className="text-slate-200 truncate flex-1">{ex.nom}</span>
                  {ex.type && <Badge variant="blue">{ex.type}</Badge>}
                </label>
              ))}
            </div>
          )}
        </Card>

        {/* Sélection aliments / repas */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <IconLeaf size={16} className="text-emerald-400" />
              Aliments pour vos repas
            </h3>
            <Badge variant="slate">{selectedAl.size} sélectionné{selectedAl.size > 1 ? "s" : ""}</Badge>
          </div>
          <p className="text-xs text-slate-500 mb-2">L&apos;IA compose petit-déjeuner, déjeuner et dîner à partir de vos choix.</p>
          <input
            placeholder="Rechercher un aliment…"
            value={searchAl}
            onChange={(e) => setSearchAl(e.target.value)}
            className="w-full mb-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100"
          />
          {catalogLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredAl.slice(0, 80).map((al) => (
                <label
                  key={al.id_aliment}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedAl.has(al.id_aliment)}
                    onChange={() => toggle(selectedAl, al.id_aliment, setSelectedAl)}
                    className="rounded border-slate-600"
                  />
                  <span className="text-slate-200 truncate flex-1">{al.nom}</span>
                  {al.calories != null && (
                    <span className="text-xs text-slate-500">{al.calories} kcal</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Contraintes matérielles + budget */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-3">
          <p className="text-sm font-medium text-white">Équipement disponible</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "salle_de_sport", label: "Salle de sport" },
              { value: "halteres", label: "Haltères" },
              { value: "barre", label: "Barre / rack" },
              { value: "tapis", label: "Tapis / yoga" },
              { value: "elastiques", label: "Élastiques" },
              { value: "aucun", label: "Poids du corps" },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={equipementDisponible.has(value)}
                  onChange={(e) => {
                    setEquipementDisponible((prev) => {
                      const next = new Set(prev);
                      e.target.checked ? next.add(value) : next.delete(value);
                      return next;
                    });
                  }}
                  className="accent-blue-500"
                />
                <span className="text-sm text-slate-300">{label}</span>
              </label>
            ))}
          </div>
          {equipementDisponible.size === 0 && (
            <p className="text-xs text-slate-500">Aucun filtre — tous les exercices sont inclus.</p>
          )}
        </Card>

        <Card className="space-y-3">
          <p className="text-sm font-medium text-white">Budget alimentaire</p>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Budget journalier (€/jour)</label>
            <input
              type="number"
              min="3"
              max="50"
              step="0.5"
              placeholder="Ex : 10 (pas de limite si vide)"
              value={budgetJour}
              onChange={(e) => setBudgetJour(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-slate-500">
            {budgetJour ? `~${(parseFloat(budgetJour) / 3).toFixed(1)}€ par repas — les aliments seront filtrés en conséquence.` : "Laissez vide pour aucune contrainte de budget."}
          </p>
        </Card>
      </div>

      <Btn
        onClick={() => void generatePlan()}
        loading={loading}
        className="w-full sm:w-auto"
      >
        <IconZap size={16} aria-hidden="true" />
        Générer mon programme IA de la semaine
      </Btn>

      {error && (
        <Alert variant="error">
          <IconAlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </Alert>
      )}

      {plan && (
        <div className="space-y-6">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Plan nutrition</p>
                <h2 className="text-xl font-semibold text-white">{nutritionPlanLabel(plan.recommended_plan)}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Adéquation à votre profil : {(plan.confidence * 100).toFixed(0)}%
                  {plan.exercices_exclus_blessure > 0 && (
                    <> · {plan.exercices_exclus_blessure} exercice(s) écarté(s) (blessures)</>
                  )}
                </p>
              </div>
              <IconCheck size={20} aria-hidden="true" className="text-emerald-400 shrink-0" />
            </div>
            {plan.explanation && (
              <p className="mt-4 text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-4">
                {plan.explanation}
              </p>
            )}
            {plan.conseils.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-slate-400">
                {plan.conseils.map((c) => (
                  <li key={c}>• {c}</li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plan.jours.map((day) => (
              <Card key={day.jour} className="space-y-3">
                <h3 className="font-semibold text-white">{day.jour}</h3>

                {day.exercices.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-blue-400 uppercase mb-1.5">Sport</p>
                    <ul className="space-y-2">
                      {day.exercices.map((ex, i) => (
                        <li key={i} className="text-sm rounded-lg bg-slate-800/50 px-3 py-2">
                          <p className="text-slate-200 font-medium">{ex.nom}</p>
                          <p className="text-xs text-slate-500">{ex.groupe_musculaire} · {ex.type}</p>
                          {ex.note && <p className="text-xs text-slate-400 mt-1 italic">{ex.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Repos ou récupération</p>
                )}

                {day.repas.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-400 uppercase mb-1.5">Repas</p>
                    <ul className="space-y-2">
                      {day.repas.map((repas) => (
                        <li key={repas.type} className="text-sm">
                          <p className="text-slate-400 text-xs">{MEAL_LABELS[repas.type] ?? repas.label}</p>
                          <p className="text-slate-200">
                            {repas.aliments.map((a) => a.nom).filter(Boolean).join(" · ") || "—"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* ── Analyse de repas par photo (Vision IA) ── */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">
          Analyse de repas par photo <Badge variant="blue">Vision IA</Badge>
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <p className="text-sm text-slate-400">
              Soumettez une photo de votre repas — l'IA identifie les aliments,
              calcule les apports nutritionnels et génère des recommandations adaptées à votre objectif.
            </p>

            <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500 transition-colors cursor-pointer p-6">
              {imagePreview ? (
                <img src={imagePreview} alt="Aperçu repas" className="max-h-48 rounded-lg object-contain" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl">🍽️</div>
                  <p className="text-sm text-slate-400">Cliquez pour sélectionner une photo (JPEG/PNG)</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} aria-label="Photo du repas" />
            </label>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">Objectif santé</label>
              <select
                value={mealObjectif}
                onChange={(e) => setMealObjectif(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="equilibre">Alimentation équilibrée</option>
                <option value="perte_de_poids">Perte de poids</option>
                <option value="prise_de_masse">Prise de masse</option>
                <option value="performance_sportive">Performance sportive</option>
              </select>
            </div>

            <Btn onClick={handleMealAnalysis} loading={mealLoading} className="w-full">
              Analyser le repas
            </Btn>

            {mealError && <Alert variant="error">{mealError}</Alert>}
          </Card>

          {mealResult ? (
            <Card className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Aliment identifié</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-semibold text-white">{mealResult.aliment_principal}</span>
                  <Badge variant="emerald">{(mealResult.confiance * 100).toFixed(1)}% de confiance</Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {mealResult.aliments_identifies.slice(1).map((f) => (
                    <Badge key={f.label} variant="slate">{f.label_fr} {(f.score * 100).toFixed(1)}%</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Valeurs nutritionnelles <span className="normal-case text-slate-600">({mealResult.nutrition.unite})</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Calories", value: `${mealResult.nutrition.calories} kcal` },
                    { label: "Protéines", value: `${mealResult.nutrition.proteines}g` },
                    { label: "Glucides", value: `${mealResult.nutrition.glucides}g` },
                    { label: "Lipides", value: `${mealResult.nutrition.lipides}g` },
                    { label: "Fibres", value: `${mealResult.nutrition.fibres}g` },
                  ].map((n) => (
                    <div key={n.label} className="rounded-lg bg-slate-800 p-3 text-center">
                      <p className="text-xs text-slate-400">{n.label}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{n.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {Object.keys(mealResult.desequilibres).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Déséquilibres détectés</p>
                  {Object.values(mealResult.desequilibres).map((msg, i) => (
                    <Alert key={i} variant="warning">{msg}</Alert>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Conseils générés par IA (HuggingFace)
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{mealResult.suggestions}</p>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-sm text-slate-400">Uploadez une photo pour voir l'analyse nutritionnelle</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
