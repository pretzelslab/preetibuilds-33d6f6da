# Workspace boundaries

## Repository purpose

`preetibuilds` is the production connected portfolio repository. Vercel auto-deploys from `main` on every push, so changes merged here are live changes.

## Development workflow

Development should occur in isolated repositories or dedicated branches, not built directly against `main`. Work is brought into `preetibuilds` through a controlled promotion process onto a dedicated branch.

## Production approval requirement

Production changes require validation (build, TypeScript, ESLint, responsive, and behavioral checks) and explicit approval before merge and push to `main`. Never merge or push without that explicit approval.

## Promotion branches

Promotion work must occur on a dedicated branch (e.g. `promotion/<feature>-<date>`), never directly on `main`.

## Portfolio Page Contract

AI Platform must follow established portfolio page conventions.

Canonical portfolio pages and shared components define layout, typography, spacing, navigation, disclosures, technology rendering, and responsive behavior — they are the source of truth.

Project specific wrappers, duplicate navigation, custom disclosure treatments, typography deviations, and unrequested visual changes require explicit approval.

Local development or admin mode exposes all AI Platform tabs and screenshots.

Public production mode may apply progressive locking, fading, and staged disclosure.

Every implementation handoff must compare the rendered page against at least two canonical portfolio projects.
