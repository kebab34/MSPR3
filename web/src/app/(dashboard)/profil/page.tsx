"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api";
import { Btn, Card, Input, Select, PageHeader, Alert, Badge } from "@/components/ui";
import { IconUser, IconShield, IconStar, IconCheck, IconAlertCircle } from "@/components/icons";

const OBJECTIFS = ["Perte de poids", "Musculation", "Cardio", "Flexibilité", "Endurance", "Forme générale"];

export default function ProfilPage() {
  const { token, profile, refreshProfile } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [age, setAge] = useState("");
  const [sexe, setSexe] = useState("");
  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPrenom(profile.prenom ?? "");
    setNom(profile.nom ?? "");
    setAge(profile.age && profile.age > 0 ? String(profile.age) : "");
    setSexe(profile.sexe ?? "");
    setPoids(profile.poids && profile.poids > 0 ? String(profile.poids) : "");
    setTaille(profile.taille && profile.taille > 0 ? String(profile.taille) : "");
    setObjectifs(Array.isArray(profile.objectifs) ? [...profile.objectifs] : []);
    setPremium((profile.type_abonnement ?? "freemium").toLowerCase() === "premium");
  }, [profile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setErr(null);
    setMsg(null);
    setSaving(true);
    const ageN = parseInt(age, 10);
    const poidsN = parseFloat(poids);
    const tailleN = parseFloat(taille);
    const payload: Record<string, unknown> = {
      prenom: prenom.trim() || null,
      nom: nom.trim() || null,
      objectifs,
      type_abonnement: premium ? "premium" : "freemium",
      age: ageN > 0 ? ageN : null,
      sexe: sexe || null,
      poids: !Number.isNaN(poidsN) && poidsN > 0 ? poidsN : null,
      taille: !Number.isNaN(tailleN) && tailleN > 0 ? tailleN : null,
    };
    try {
      await apiFetch("/auth/me", { method: "PATCH", body: payload, token });
      await refreshProfile();
      setMsg("Profil enregistré avec succès.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setSaving(false);
    }
  }

  function toggleObjectif(o: string) {
    setObjectifs((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]);
  }

  const initials = [prenom, nom].filter(Boolean).map((s) => s[0]).join("").toUpperCase() || (profile?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Mon profil"
        subtitle="Gérez vos informations personnelles et vos préférences."
      />

      {msg && (
        <Alert variant="success">
          <IconCheck size={15} className="shrink-0 mt-0.5" />
          <span>{msg}</span>
        </Alert>
      )}
      {err && (
        <Alert variant="error">
          <IconAlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{err}</span>
        </Alert>
      )}

      {/* Avatar + role */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600/20 border-2 border-blue-500/30 flex items-center justify-center shrink-0">
            <span className="text-lg font-semibold text-blue-400">{initials}</span>
          </div>
          <div>
            <p className="font-medium text-white">{[prenom, nom].filter(Boolean).join(" ") || "Utilisateur"}</p>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {profile?.app_role === "admin" ? (
                <Badge variant="amber"><IconShield size={10} /> Administrateur</Badge>
              ) : (
                <Badge variant="slate"><IconUser size={10} /> Utilisateur</Badge>
              )}
              {profile?.type_abonnement === "premium" ? (
                <Badge variant="purple"><IconStar size={10} /> Premium</Badge>
              ) : (
                <Badge variant="slate">Freemium</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Personal info */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Informations personnelles</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Jean" />
              <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Dupont" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Âge" type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
              <Input label="Poids (kg)" type="number" step="0.1" min={0} value={poids} onChange={(e) => setPoids(e.target.value)} placeholder="70" />
              <Input label="Taille (cm)" type="number" step="0.1" min={0} value={taille} onChange={(e) => setTaille(e.target.value)} placeholder="175" />
            </div>
            <Select label="Sexe" value={sexe} onChange={(e) => setSexe(e.target.value)}>
              <option value="">Non renseigné</option>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
              <option value="Autre">Autre</option>
            </Select>
          </div>
        </Card>

        {/* Goals */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Objectifs</h2>
          <div className="flex flex-wrap gap-2">
            {OBJECTIFS.map((o) => {
              const selected = objectifs.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggleObjectif(o)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    selected
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                  }`}
                >
                  {selected && "✓ "}{o}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Subscription */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Abonnement</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
              <div className={`w-10 h-5.5 rounded-full transition-colors ${premium ? "bg-blue-600" : "bg-slate-700"}`} style={{ height: "22px" }} />
              <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${premium ? "translate-x-4.5" : ""}`} style={{ width: "18px", height: "18px", transform: premium ? "translateX(18px)" : "none" }} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Compte Premium</p>
              <p className="text-xs text-slate-500">Accès à toutes les fonctionnalités avancées</p>
            </div>
          </label>
        </Card>

        <Btn type="submit" loading={saving} size="md">
          Enregistrer les modifications
        </Btn>
      </form>
    </div>
  );
}
