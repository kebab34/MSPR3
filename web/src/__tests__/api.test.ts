import { apiFetch } from "@/lib/api";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(body: unknown, status = 200, ok = true) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe("apiFetch", () => {
  it("appelle l'URL proxy correcte", async () => {
    mockFetch.mockResolvedValue(makeResponse({ data: [] }));
    await apiFetch("/utilisateurs");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/mspr/utilisateurs",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("ajoute le header Authorization avec le token", async () => {
    mockFetch.mockResolvedValue(makeResponse({ ok: true }));
    await apiFetch("/profil", { token: "mon-token" });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer mon-token");
  });

  it("n'ajoute pas Authorization si pas de token", async () => {
    mockFetch.mockResolvedValue(makeResponse({ ok: true }));
    await apiFetch("/health");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  it("sérialise le body en JSON pour POST", async () => {
    mockFetch.mockResolvedValue(makeResponse({ created: true }, 201));
    await apiFetch("/aliments", { method: "POST", body: { nom: "Pomme" } });
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBe(JSON.stringify({ nom: "Pomme" }));
    expect(options.method).toBe("POST");
  });

  it("ajoute les query params à l'URL", async () => {
    mockFetch.mockResolvedValue(makeResponse([]));
    await apiFetch("/aliments", { params: { search: "banane", page: "1" } });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("search=banane");
    expect(url).toContain("page=1");
  });

  it("ignore les params undefined et vides", async () => {
    mockFetch.mockResolvedValue(makeResponse([]));
    await apiFetch("/aliments", { params: { search: undefined, page: "" } });
    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain("?");
  });

  it("retourne les données parsées en cas de succès", async () => {
    const data = [{ id: 1, nom: "Carotte" }];
    mockFetch.mockResolvedValue(makeResponse(data));
    const result = await apiFetch("/aliments");
    expect(result).toEqual(data);
  });

  it("retourne undefined pour une réponse vide", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      text: jest.fn().mockResolvedValue(""),
    });
    const result = await apiFetch("/delete");
    expect(result).toBeUndefined();
  });

  it("lève une erreur avec le message detail quand la réponse n'est pas ok", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ detail: "Ressource introuvable" }),
    });
    await expect(apiFetch("/inexistant")).rejects.toThrow("Ressource introuvable");
  });

  it("lève une erreur HTTP générique si la réponse JSON est illisible", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error("invalid json")),
    });
    await expect(apiFetch("/crash")).rejects.toThrow("HTTP 500");
  });

  it("utilise GET par défaut", async () => {
    mockFetch.mockResolvedValue(makeResponse({}));
    await apiFetch("/test");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("GET");
  });

  it("envoie Content-Type application/json", async () => {
    mockFetch.mockResolvedValue(makeResponse({}));
    await apiFetch("/test");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Content-Type"]).toBe("application/json");
  });
});
