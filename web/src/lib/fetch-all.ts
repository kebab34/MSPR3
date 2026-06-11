import { apiFetch } from "./api";

export async function fetchAll<T>(path: string, token: string): Promise<T[]> {
  const data = await apiFetch<T[]>(path, { token, params: { limit: "1000" } });
  return Array.isArray(data) ? data : [];
}
