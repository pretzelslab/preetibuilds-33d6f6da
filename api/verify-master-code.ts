export const config = { runtime: "edge" };

// Verifies the portfolio owner's master code server-side so the value never
// ships in client source or the built frontend. Compared only against
// process.env.PORTFOLIO_MASTER_CODE — never hardcoded here or anywhere else.
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
  const valid = typeof code === "string" && !!masterCode && code === masterCode;

  return new Response(JSON.stringify({ valid }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
