// Shared by every edge function that needs to mint or verify the portfolio
// owner's session cookie. Filenames/directories under api/ prefixed with "_"
// are not turned into routes by Vercel, so this module is safe to import
// without becoming its own endpoint.
//
// The cookie is a stateless, signed token: "<issuedAtMs>.<hmacHex>", where
// hmacHex = HMAC-SHA256(issuedAtMs, PORTFOLIO_OWNER_TOKEN). Nothing about
// ownership is stored server-side — verification just recomputes the HMAC
// and compares. A leaked cookie value cannot be used to derive
// PORTFOLIO_OWNER_TOKEN itself (HMAC is one-way).

export const OWNER_COOKIE_NAME = "pl_owner";
export const OWNER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

// Manual constant-time compare — Node's crypto.timingSafeEqual isn't
// available in the Vercel Edge runtime. Length is checked directly (an
// accepted simplification; the compared values are fixed-format hex here,
// so length alone reveals nothing useful) but every byte is still compared.
export function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

export async function signOwnerCookieValue(secret: string): Promise<string> {
  const issuedAtMs = Date.now().toString();
  const mac = await hmacHex(issuedAtMs, secret);
  return `${issuedAtMs}.${mac}`;
}

export async function verifyOwnerCookieValue(value: string, secret: string): Promise<boolean> {
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [issuedAtMs, mac] = parts;
  if (!/^\d+$/.test(issuedAtMs)) return false;
  const expected = await hmacHex(issuedAtMs, secret);
  return constantTimeEqual(mac, expected);
}

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

// Reads the owner cookie out of a request's Cookie header and verifies it.
// Returns false for a missing, malformed, or tampered cookie, or when the
// signing secret isn't configured — always fails closed to "not owner".
export async function isOwnerRequest(req: Request, secret: string | undefined): Promise<boolean> {
  if (!secret) return false;
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  const value = cookies[OWNER_COOKIE_NAME];
  if (!value) return false;
  return verifyOwnerCookieValue(value, secret);
}

export function buildOwnerSetCookie(value: string): string {
  return `${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${OWNER_COOKIE_MAX_AGE_SECONDS}`;
}
