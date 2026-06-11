import { apiFetch } from "./api";

export type PickUser = {
  id_utilisateur: string;
  email: string;
  prenom?: string;
  nom?: string;
};

type Profile = {
  id_utilisateur: string;
  email: string;
  prenom?: string;
  nom?: string;
  app_role?: string;
};

export function labelUser(u: PickUser): string {
  const full = [u.prenom, u.nom].filter(Boolean).join(" ");
  return full ? `${full} (${u.email})` : u.email;
}

export async function fetchUsersForPicker(
  token: string,
  profile: Profile
): Promise<PickUser[]> {
  if (profile.app_role === "admin") {
    try {
      const users = await apiFetch<PickUser[]>("/utilisateurs", { token });
      return Array.isArray(users) ? users : [profile];
    } catch {
      return [profile];
    }
  }
  return [profile];
}
