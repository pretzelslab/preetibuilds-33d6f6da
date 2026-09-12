export const config = { runtime: "edge" };

import { buildOwnerSetCookie, constantTimeEqual, signOwnerCookieValue } from "./_lib/ownerCookie";

// Verifies the portfolio owner's master code server-side so the value never
// ships in client source or the built frontend. Compared only against
// process.env.PORTFOLIO_MASTER_CODE — never hardcoded here or anywhere else.
//
// On success this also establishes the authoritative server owner session
// (see api/_lib/ownerCookie.ts) — every UI entry point that calls the
// master code (PageGate, Tracker, Comments, MelodicFramework) shares this
// one endpoint, so fixing owner-session establishment here fixes it
// consistently everywhere at once, rather than requiring each call site to
// remember to do it itself.
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ valid: false }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let code: unknown;
  try {
    const body = await req.json();
    code = (body as { code?: unknown })?.code;
  } catch {
    return new Response(JSON.stringify({ valid: false }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const masterCode = process.env.PORTFOLIO_MASTER_CODE;
  const valid = typeof code === "string" && !!masterCode && constantTimeEqual(code, masterCode);

  const headers: Record<string, string> = { "Content-Type": "application/json", "Cache-Control": "no-store" };

  const ownerToken = process.env.PORTFOLIO_OWNER_TOKEN;
  if (valid && ownerToken) {
    const cookieValue = await signOwnerCookieValue(ownerToken);
    headers["Set-Cookie"] = buildOwnerSetCookie(cookieValue);
  }

  return new Response(JSON.stringify({ valid }), { headers });
}
