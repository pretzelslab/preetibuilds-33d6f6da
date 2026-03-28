# Netlify Push Log

Items committed locally but NOT yet pushed to GitHub/Netlify.

## Pending (as of 2026-03-28)

| Commit | Description | Netlify tag |
|--------|-------------|-------------|
| `d2d6d20` | Pipeline font/layout, AI Governance 3-tier gate, Projects tile clickable, client form back button + KPI, supabase SQL | `[skip netlify]` |
| `a06369a` | SQL fix: ARRAY[]::text[] cast | `[skip netlify]` |
| `0487d12` | hasGuide:true for NIST AI RMF, NIST CSF, ISO 42001; areaStates stale-init fix | `[skip netlify]` |
| `41a43d3` | GRC Bridge search/industry filter + Acronym Glossary (37 terms) | `[skip netlify]` |
| `6e6743d` | Acronym Glossary added to Policy Digest detail pages | `[skip netlify]` |
| `f00e1f0` | MedLog: Email Report in Health Analysis | `[skip netlify]` |
| TBD | Landing page redesign (this session) | — |

## Notes
- MedLog email feature (`f00e1f0`) needs browser test before Netlify deploy
- MedLog Netlify: re-enable build first, then push
- MedLog Supabase: bucket `medlog-attachments` + SQL ALTER TABLE still needed
- All `[skip netlify]` commits: safe to push together once ready
