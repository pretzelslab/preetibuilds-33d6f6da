// Per-comment edit tokens for workbook comments (api/workbook-comments.ts).
//
// On create, the server mints a random token, returns it ONCE to the creating
// browser, and stores only its SHA-256 hash. Edit/delete later requires
// presenting the token (or a valid owner session). A leaked database row can't
// be turned back into a usable token, and the hash is never sent to clients.

import { constantTimeEqual } from "./ownerCookie.js";

export const EDIT_TOKEN_RE = /^[0-9a-f]{64}$/;

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateEditToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashEditToken(token: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)));
}

// False for a missing/malformed token or a row with no stored hash (legacy
// comments created before tokens existed — those are owner-only).
export async function editTokenMatches(token: unknown, storedHash: string | null | undefined): Promise<boolean> {
  if (typeof token !== "string" || !EDIT_TOKEN_RE.test(token)) return false;
  if (typeof storedHash !== "string" || !storedHash) return false;
  return constantTimeEqual(await hashEditToken(token), storedHash);
}
