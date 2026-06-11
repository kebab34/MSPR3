import { INJURY_ZONE_LABELS } from "@/lib/wellness";

type ProfileLike = {
  prenom?: string;
  age?: number;
  sexe?: string;
  poids?: number;
  taille?: number;
  objectifs?: string[];
  humeur?: string;
  zones_blessure?: string[];
};

export type ExerciceItem = {
  id_exercice: string;
  nom: string;
  type?: string;
  groupe_musculaire?: string;
  niveau?: string;
  equipement?: string;
};

export type AlimentItem = {
  id_aliment: string;
  nom: string;
  calories?: number;
  proteines?: number;
  glucides?: number;
  lipides?: number;
};

export function computeBmi(poidsKg: number, tailleCm: number): number {
  if (!poidsKg || !tailleCm) return 0;
  const m = tailleCm / 100;
  return Math.round((poidsKg / (m * m)) * 10) / 10;
}

export function sexeToGender(sexe?: string): string {
  const s = (sexe || "").toUpperCase();
  if (s === "M" || s === "H" || s === "HOMME") return "Male";
  if (s === "F" || s === "FEMME") return "Female";
  return "Other";
}

export const NUTRITION_PLAN_LABELS: Record<string, string> = {
  Balanced: "Alimentation équilibrée",
  Low_Carb: "Moins de glucides, plus de protéines",
  Low_Sodium: "Faible en sel",
};

export function nutritionPlanLabel(plan?: string): string {
  if (!plan) return "—";
  return NUTRITION_PLAN_LABELS[plan] ?? plan.replace(/_/g, " ");
}

export function sexeLabel(sexe?: string): string {
  const s = (sexe || "").toUpperCase();
  if (s === "F" || s === "FEMME") return "Femme";
  if (s === "M" || s === "H" || s === "HOMME") return "Homme";
  if (s === "AUTRE") return "Autre";
  return "Non renseigné";
}

export function objectifsToActivity(objectifs: string[]): string {
  const o = objectifs.map((x) => x.toLowerCase()).join(" ");
  if (o.includes("cardio") || o.includes("endurance")) return "Active";
  if (o.includes("musculation") || o.includes("force")) return "Moderate";
  if (o.includes("perte")) return "Moderate";
  return "Sedentary";
}

export function estimateDailyCalories(poids?: number, taille?: number, age?: number, sexe?: string): number {
  if (!poids || !taille || !age) return 2000;
  const g = sexeToGender(sexe);
  // Mifflin-St Jeor simplifié
  const base =
    g === "Female"
      ? 10 * poids + 6.25 * taille - 5 * age - 161
      : 10 * poids + 6.25 * taille - 5 * age + 5;
  return Math.round(Math.max(1200, base));
}

export function buildWeeklyPlanPayload(
  profile: ProfileLike,
  exercices: ExerciceItem[],
  aliments: AlimentItem[],
  overrides?: Partial<{ disease_type: string; allergies: string; dietary_restrictions: string; equipement_disponible: string[]; budget_jour: number | null }>
) {
  const age = profile.age && profile.age > 0 ? profile.age : 30;
  const poids = profile.poids && profile.poids > 0 ? profile.poids : 70;
  const taille = profile.taille && profile.taille > 0 ? profile.taille : 170;
  const bmi = computeBmi(poids, taille);
  const objectifs = Array.isArray(profile.objectifs) ? profile.objectifs : [];
  const zones = Array.isArray(profile.zones_blessure) ? profile.zones_blessure : [];
  const objText = objectifs.map((x) => x.toLowerCase()).join(" ");
  let dailyCalories = estimateDailyCalories(poids, taille, age, profile.sexe);
  if (objText.includes("perte")) {
    dailyCalories = Math.round(Math.max(1200, dailyCalories * 0.85));
  }

  return {
    prenom: profile.prenom?.trim() || null,
    age,
    gender: sexeToGender(profile.sexe),
    weight_kg: poids,
    height_cm: taille,
    bmi: bmi || 22,
    objectifs,
    zones_blessure: zones,
    injury_labels: zones.map((z) => INJURY_ZONE_LABELS[z] ?? z),
    humeur: profile.humeur ?? null,
    disease_type: overrides?.disease_type ?? "None",
    severity: "Mild",
    physical_activity_level: objectifsToActivity(objectifs),
    daily_caloric_intake: dailyCalories,
    cholesterol_mg_dL: 180,
    blood_pressure_mmhg: 120,
    glucose_mg_dL: 95,
    dietary_restrictions: overrides?.dietary_restrictions ?? "None",
    allergies: overrides?.allergies ?? "None",
    preferred_cuisine: "None",
    equipement_disponible: overrides?.equipement_disponible ?? [],
    budget_jour: overrides?.budget_jour ?? null,
    weekly_exercise_hours: objectifsToActivity(objectifs) === "Active" ? 5 : 3,
    adherence_to_diet_plan: 75,
    dietary_nutrient_imbalance_score: 3,
    exercices: exercices.map((e) => ({
      id_exercice: e.id_exercice,
      nom: e.nom,
      type: e.type,
      groupe_musculaire: e.groupe_musculaire,
      niveau: e.niveau,
      equipement: e.equipement,
    })),
    aliments: aliments.map((a) => ({
      id_aliment: a.id_aliment,
      nom: a.nom,
      calories: a.calories,
      proteines: a.proteines,
      glucides: a.glucides,
      lipides: a.lipides,
    })),
  };
}

export function suggestExercicesForProfile(
  all: ExerciceItem[],
  objectifs: string[],
  zones: string[],
  limit = 14
): string[] {
  const avoid = new Set<string>();
  for (const z of zones) {
    if (z.includes("genou") || z.includes("ischio") || z.includes("mollet") || z.includes("cheville")) {
      avoid.add("jambes");
    }
    if (z.includes("epaule")) avoid.add("épaule");
    if (z.includes("dos")) avoid.add("dos");
  }
  const scored = all
    .filter((ex) => {
      const g = (ex.groupe_musculaire || "").toLowerCase();
      return ![...avoid].some((a) => g.includes(a));
    })
    .slice(0, limit);
  return scored.map((e) => e.id_exercice);
}

export function suggestAlimentsForObjectifs(all: AlimentItem[], objectifs: string[], limit = 21): string[] {
  const o = objectifs.join(" ").toLowerCase();
  const sorted = [...all].sort((a, b) => {
    const pa = a.proteines ?? 0;
    const pb = b.proteines ?? 0;
    const ca = a.calories ?? 0;
    const cb = b.calories ?? 0;
    if (o.includes("musculation") || o.includes("prise")) return pb - pa;
    if (o.includes("perte")) return ca - cb;
    return 0;
  });
  return sorted.slice(0, limit).map((a) => a.id_aliment);
}
