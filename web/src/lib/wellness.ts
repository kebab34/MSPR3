export type Mood = "content" | "normal" | "triste" | "colere";

export const MOODS: { id: Mood; label: string }[] = [
  { id: "content", label: "Content" },
  { id: "normal", label: "Normal" },
  { id: "triste", label: "Triste" },
  { id: "colere", label: "En colère" },
];

/** Phrases d'accueil (placeholder avant intégration IA). */
export const MOTIVATION_BY_MOOD: Record<Mood, string[]> = {
  content: [
    "Super énergie aujourd'hui — profitez-en pour bouger avec plaisir.",
    "Votre bonne humeur est un atout : un petit entraînement vous fera encore du bien.",
  ],
  normal: [
    "Journée équilibrée : quelques exercices adaptés vous maintiendront en forme.",
    "Prenez soin de vous, étape par étape — la régularité compte plus que l'intensité.",
  ],
  triste: [
    "C'est ok de ne pas être au top : une marche ou des étirements doux peuvent aider.",
    "Soyez indulgent·e avec vous-même — le mouvement léger peut apaiser l'esprit.",
  ],
  colere: [
    "Canalisez cette énergie : une séance cardio ou de boxe (shadow) peut soulager la tension.",
    "Respirez, hydratez-vous — choisissez un exo qui décharge sans vous blesser.",
  ],
};

export function pickMotivation(mood: Mood): string {
  const lines = MOTIVATION_BY_MOOD[mood];
  const day = new Date().getDate();
  return lines[day % lines.length];
}

export const INJURY_ZONE_LABELS: Record<string, string> = {
  tete: "Tête",
  cou: "Cou",
  epaule_gauche: "Épaule gauche",
  epaule_droite: "Épaule droite",
  poitrine: "Poitrine",
  abdominaux: "Abdominaux",
  dos_haut: "Haut du dos",
  dos_bas: "Bas du dos / lombaires",
  biceps_gauche: "Biceps gauche",
  biceps_droit: "Biceps droit",
  triceps_gauche: "Triceps gauche",
  triceps_droit: "Triceps droit",
  avant_bras_gauche: "Avant-bras gauche",
  avant_bras_droit: "Avant-bras droit",
  main_gauche: "Main gauche",
  main_droite: "Main droite",
  fessiers: "Fessiers",
  quadriceps_gauche: "Quadriceps gauche",
  quadriceps_droit: "Quadriceps droit",
  ischio_jambier_gauche: "Ischio-jambiers gauche",
  ischio_jambier_droit: "Ischio-jambiers droit",
  genou_gauche: "Genou gauche",
  genou_droit: "Genou droit",
  mollet_gauche: "Mollet gauche",
  mollet_droit: "Mollet droit",
  cheville_gauche: "Cheville gauche",
  cheville_droite: "Cheville droite",
  pied_gauche: "Pied gauche",
  pied_droit: "Pied droit",
};

export const WELLNESS_STORAGE_KEY = "healthai_wellness";

export type WellnessLocal = {
  humeur?: Mood;
  zones_blessure?: string[];
};

export function readWellnessLocal(): WellnessLocal {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WELLNESS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as WellnessLocal;
  } catch {
    return {};
  }
}

export function writeWellnessLocal(data: WellnessLocal) {
  if (typeof window === "undefined") return;
  const prev = readWellnessLocal();
  localStorage.setItem(
    WELLNESS_STORAGE_KEY,
    JSON.stringify({ ...prev, ...data })
  );
}
