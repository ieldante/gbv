# @gbv/synthetic-client

Synthetic multi-surface platform used for GBV verification demos.

## Purpose

- Exposes multiple course artifacts through identical route/API shapes.
- Includes coherent and adversarial artifacts.
- Adversarial outcomes emerge from cross-surface inconsistencies, not explicit fail flags.

## Notable Artifact Keys

- `csk_7r2q9p`: coherent baseline artifact (expected GBV acceptance)
- `csk_t1mix`: visible Tier-1 mixed adversarial artifact (expected GBV rejection)

## Local Commands

From repo root:

- `corepack pnpm --filter @gbv/synthetic-client dev`
- `corepack pnpm --filter @gbv/synthetic-client lint`
- `corepack pnpm --filter @gbv/synthetic-client typecheck`

Route catalog API:
- `GET /api/gbv/courses`

See root `README.md` for extension-driven verification walkthrough.
