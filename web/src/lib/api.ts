type ApiFetchOptions = {
  token?: string;
  method?: string;
  body?: unknown;
  params?: Record<string, string | undefined>;
};

export async function apiFetch<T>(
  path: string,
  { token, method = "GET", body, params }: ApiFetchOptions = {}
): Promise<T> {
  let url = `/api/mspr${path}`;

  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, v);
    }
    const str = qs.toString();
    if (str) url += `?${str}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.detail ?? j?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
