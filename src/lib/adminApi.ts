// Client for api/admin.ts — the one route for owner-only reads/moderation that
// RLS no longer grants to the browser's anon key. Authorization is the
// HttpOnly pl_owner cookie (sent automatically, same-origin); nothing secret
// is ever passed from here.

export type AdminAction =
  | { action: "visits.list"; offset?: number }
  | { action: "visits.delete"; ids: string[] }
  | { action: "comments.pending" }
  | { action: "comments.approve"; id: string }
  | { action: "comments.reply"; id: string; reply: string }
  | { action: "comments.delete"; id: string }
  | { action: "songs.pending" }
  | { action: "songs.approve"; id: string; raagaId: string }
  | { action: "songs.reject"; id: string };

// Both members declare both fields so `result.error` / `result.data` stay
// accessible after an `ok` check — this project compiles without
// strictNullChecks, where boolean discriminants don't narrow.
export type AdminResult<T> =
  | { ok: true; data: T; error?: undefined }
  // "master-code-required" = no valid owner session (401) — e.g. a browser
  // unlocked with only a page-specific code.
  | { ok: false; data?: undefined; error: "master-code-required" | "failed" };

export async function adminCall<T = undefined>(body: AdminAction): Promise<AdminResult<T>> {
  try {
    const res = await fetch("/api/admin", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) return { ok: false, error: "master-code-required" };
    if (!res.ok) return { ok: false, error: "failed" };
    const json = await res.json();
    if (json?.ok !== true) return { ok: false, error: "failed" };
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, error: "failed" };
  }
}
