# Secret rotation checklist

No secret values belong in this file, the repo, or any `VITE_*` variable.
All server secrets live only in **Vercel → Project → Settings → Environment Variables**.

## Server-only secrets

| Variable | Used by | Effect of rotating |
|---|---|---|
| `PORTFOLIO_MASTER_CODE` | `api/verify-master-code.ts` | Old master code stops working for new unlocks. Does **not** end existing owner sessions. |
| `PORTFOLIO_OWNER_TOKEN` | `api/_lib/ownerCookie.ts` (signs `pl_owner`) | Ends **every** existing owner session at once (all browsers, all devices). |
| `GOV_SUPABASE_SERVICE_ROLE_KEY` | `api/_lib/adminDb.ts` (`/api/admin`, visit inserts/retract) | Rotate in Supabase first, then update Vercel. Must never be `VITE_*`. |

## Rotating the master code and owner token

1. Pick a new master code: long, mixed case, and **not** equal to any page code in
   `api/_lib/pageCodes.ts` (the server rejects page codes as master codes anyway).
2. Vercel → Environment Variables → Production: update `PORTFOLIO_MASTER_CODE`.
3. Same screen: update `PORTFOLIO_OWNER_TOKEN` to a new random value (32+ chars).
   Rotate both together: changing only the master code leaves old `pl_owner`
   cookies valid for up to a year.
4. **Redeploy** production (Deployments → latest → Redeploy). Env changes do not
   apply to an already-built deployment.
5. Verify on the live site:
   - `/owner` with the **old** code → rejected.
   - `/owner` with the **new** code → accepted.
   - `/admin` visitor log loads (it needs a fresh owner session after step 3).
   - Comments and Melodic admin mode can approve/reply/delete.
6. On each of your other browsers and devices, enter the new master code once to get a new owner session.
7. Store the new code in your password manager only, not in chat, memory files or the repo.

## Rotating the Supabase service-role key

1. Supabase → Project Settings → API → generate a new service-role (secret) key.
2. Update `GOV_SUPABASE_SERVICE_ROLE_KEY` in Vercel (Production) and redeploy.
3. Revoke the old key in Supabase.
4. Verify that `/admin` loads visits and that a visitor page view is still recorded.
