# Claude Code Instructions — preetibuilds

## HARD RULES — read before every action

### git push
- **NEVER run `git push` unless the user explicitly says "push" or "deploy" in that specific message.**
- Vercel auto-deploys on every push to main. The user always tests locally at localhost first.
- A passing build (`npm run build`) does NOT mean it is ready to push.
- This rule does not expire. It applies for the entire session and every future session.

### Commits
- Use `[skip ci]` in commit messages for non-visual or in-progress changes — skips Vercel AND Netlify builds.
- Commit freely, but push only when the user says so.
- Bundle all changes into one push per session to conserve build minutes.

### Hosting
- Primary: Vercel → https://preetibuilds-33d6f6da.vercel.app
- Netlify paused until April 16th (build minutes reset)
- MedLog: https://medlogqw.netlify.app (separate site, separate limits)

### Local dev server
- Run `npm run dev` in the project root to start the dev server.
- Default port is 8080 (may fall back to 8081 if busy).

### Memory
- Update `MEMORY.md` at `C:\Users\Ravi Kumar\.claude\projects\C--Preeti-Personal-projects\memory\MEMORY.md` after every session with meaningful changes — without being asked.
