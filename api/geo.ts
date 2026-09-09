export const config = { runtime: "edge" };

// Reads Vercel's network-level geolocation headers (set on every request that
// passes through Vercel's edge — no external API call, no IP address ever
// read or returned). Docs: https://vercel.com/docs/headers/request-headers
export default function handler(req: Request): Response {
  const country = req.headers.get("x-vercel-ip-country");
  const region = req.headers.get("x-vercel-ip-country-region");
  const rawCity = req.headers.get("x-vercel-ip-city");

  // Vercel encodes non-ASCII city names per RFC3986.
  let city: string | null = null;
  if (rawCity) {
    try { city = decodeURIComponent(rawCity); } catch { city = rawCity; }
  }

  return new Response(
    JSON.stringify({ city, region: region || null, country: country || null }),
    { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
  );
}
