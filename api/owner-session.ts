export const config = { runtime: "edge" };

import { buildOwnerSetCookie, constantTimeEqual, signOwnerCookieValue } from "./_lib/ownerCookie";

// Private, bookmark-only entry point: visiting this URL with the correct
// token establishes the owner cookie via a top-level navigation, BEFORE the
// portfolio SPA ever loads — so even the very first page view on a brand
// new browser/device is already covered by the time React mounts. Compared
// only against process.env.PORTFOLIO_OWNER_TOKEN — never hardcoded.
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const ownerToken = process.env.PORTFOLIO_OWNER_TOKEN;

  if (!token || !ownerToken || !constantTimeEqual(token, ownerToken)) {
    return new Response("Invalid or missing token", {
      status: 401,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  const cookieValue = await signOwnerCookieValue(ownerToken);

  // Redirect to a clean homepage URL — the token never appears in the
  // post-verification address bar, browser history entry, or anywhere the
  // SPA's own code can see it.
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": buildOwnerSetCookie(cookieValue),
      "Cache-Control": "no-store",
    },
  });
}
