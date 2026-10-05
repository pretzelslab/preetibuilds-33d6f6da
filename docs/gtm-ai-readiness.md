# /gtm-ai-readiness maintainer notes

Page: `src/pages/GtmAiReadiness.tsx`. Card data: `src/data/projects.ts` ("CRM Data Readiness Scan"). Report viewer: `src/components/ReportModal.tsx`.

## Demo files are copies

Everything under `public/demos/crm-readiness-scan/` (the report HTML files and the glance images) is a byte-identical copy of `docs/demo` in the [gtm-trust-kernel](https://github.com/pretzelslab/gtm-trust-kernel) repo. Never edit them here. After the demo samples change upstream (for example at a release), re-copy the files and check that the section ids the page links to still exist (`data-health`, `fix-first`, `use-cases`, `uc-grounded_account_brief`).

## Modal dark mode

The reports style dark mode with a single `@media (prefers-color-scheme: dark)` rule. Chrome does not pass the parent page's theme into an iframe, so `ReportModal` rewrites that media rule in the same-origin frame to follow the site's `.dark` class. If a report ever gains a second dark-mode rule, or switches to a class- or attribute-based dark mode, the modal's dark theme will stop following the site until `ReportModal` is updated.

## Backlog

- Pre-existing TypeScript errors in `src/components/ai-governance/ClientDiscovery.tsx` (6 under `tsc --noEmit -p tsconfig.app.json` on 2026-10-04). Unrelated to this page; the build and tests don't catch them. Other files have errors too (mostly `src/pages/SustainabilityFramework.tsx`).
