export const config = { runtime: "edge" };

import { isOwnerRequest } from "./_lib/ownerCookie.js";

// Lets client code (the GA4 loader) ask "is this browser the owner" without
// ever exposing the cookie value or the signing secret — the response is a
// bare boolean. Read-only, no side effects.
export default async function handler(req: Request): Promise<Response> {
  const isOwner = await isOwnerRequest(req, process.env.PORTFOLIO_OWNER_TOKEN);
  return new Response(JSON.stringify({ isOwner }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
