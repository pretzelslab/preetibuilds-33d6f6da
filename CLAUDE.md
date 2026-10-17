# Claude Code Instructions — preetibuilds

## HARD RULES — read before every action

### git push
- **NEVER run `git push` unless the user explicitly says "push" or "deploy" in that specific message.**
- Vercel auto-deploys on every push to main. The user always tests locally at localhost first.
- A passing build (`npm run build`) does NOT mean it is ready to push.
- This rule does not expire. It applies for the entire session and every future session.

### Commits
- Use `[skip ci]` in commit messages for intermediate/in-progress local commits only — skips Vercel AND Netlify builds.
- **NEVER include `[skip ci]` on the final push commit** — that commit must trigger a Vercel rebuild or the deployment will not update.
- **Bundle ALL session changes into ONE push per session** — do not push incrementally to conserve build minutes.

### Pre-push checklist — ALWAYS run before `git push`
1. `git status` — commit or discard any unstaged files (stray files committed here must NOT use `[skip ci]`)
2. `git log --oneline -3` — confirm tip commit has NO `[skip ci]`
3. If tip has `[skip ci]`, amend it: `git commit --amend -m "message without skip ci"`
4. `npm test` and `npm run build` — both green
5. `npm run smoke:dev` — starts the dev server, headless-loads `/` and `/admin` in Chrome, fails if `#root` is empty or any module request fails. Catches dev-only breakage that build + tests cannot (e.g. the 2026-10-02 blank page: the Vite `/api` proxy swallowing `api/_lib/pageCodes.ts`). Needs local Chrome (`CHROME_PATH` to override).
6. Then push — no force-push unless absolutely required (force-push may not trigger Vercel webhook)
7. The local `.git/hooks/pre-push` hook (not versioned) runs `git pull --rebase`, `npm run build` and `npm run smoke:dev`. The rebase step refuses to run with unstaged changes — stash them first.

### Hosting
- Primary: Vercel → https://preetibuilds-33d6f6da.vercel.app
- Netlify paused until April 16th (build minutes reset)
- MedLog: https://medlogqw.netlify.app (separate site, separate limits)

### Local dev server
- Run `npm run dev` in the project root to start the dev server.
- Default port is 8080 (may fall back to 8081 if busy).

### Memory
- Update `MEMORY.md` at `C:\Users\Ravi Kumar\.claude\projects\C--Preeti-Personal-projects\memory\MEMORY.md` after every session with meaningful changes — without being asked.
- **Save requirements and context BEFORE every context reset** — do not wait to be asked. If a reset is approaching, save first.

### Testing — always prompt before moving on
- After every code change, remind user: "Please test on localhost before we push."
- Run `npm run build` and confirm it's clean before presenting any change as done.
- Call out which existing features may be affected (regression surface) for each change.

### Regression checklist — preetibuilds
After changes, remind user to test: navigation, all project tiles, AI Governance tracker, Client Workbook phases, AI Readiness Assessment, Melodic Framework tile, theme, mobile layout.

## WORKING RULES (added 2026-10-17)

### Never
- **No file deletions or moves.** No `rm`, `del`, `Remove-Item`, `mv`, `git rm`, `git mv` or `git clean`, and no renames. If something should go, report it and let the user do it.
- **No `git push`** unless the user's message in that turn says "push".
- **No bulk staging.** Stage files by name only. Never `git add .`, `git add -A` or `git commit -a`.
- **Do not touch `src/lib/analyticsExclusion.*` or `ai-time-travel/`.** Do not edit, stage, stash or commit them. Work around them (for example the pre-push hook's `pull --rebase` needs a clean tree, so report that rather than stashing them).
- **No temp files outside the repo.** Use the session scratchpad directory, never the filesystem root or `/tmp`. Never write to the repo for scratch work.

### Commits
- Interim commits carry `[skip ci]`. The final commit before a push must not.

### Low-risk vs risky
- **Low-risk fixes** (typos, copy, type-only changes, unused code, obvious one-line bugs): apply, run `npm run build` and `npm test`, show the diff, then commit locally.
- **Risky edits** (anything that changes behaviour, auth or access codes, API routes, analytics, config, dependencies, or touches more than a few files) and **all pushes or deploys**: report first, make no edits until the user approves.
- When unsure which category applies, treat it as risky.
