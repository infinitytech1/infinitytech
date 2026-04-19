const API_BASE = "/api";

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API error ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

export async function apiGet<T = unknown>(path: string, adminPin?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (adminPin) headers["x-admin-pin"] = adminPin;
  const r = await fetch(`${API_BASE}${path}`, { headers });
  if (!r.ok) throw new Error(`API error ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

export async function apiPatch<T = unknown>(path: string, body: unknown, adminPin?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminPin) headers["x-admin-pin"] = adminPin;
  const r = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API error ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

export async function apiDelete<T = unknown>(path: string, adminPin?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (adminPin) headers["x-admin-pin"] = adminPin;
  const r = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers });
  if (!r.ok) throw new Error(`API error ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

function getAdminPin(): string {
  return localStorage.getItem("it-admin-pin") || "admin2024";
}

export const adminApi = {
  get: <T = unknown>(path: string) => apiGet<T>(path, getAdminPin()),
  patch: <T = unknown>(path: string, body: unknown) => apiPatch<T>(path, body, getAdminPin()),
  delete: <T = unknown>(path: string) => apiDelete<T>(path, getAdminPin()),
};
