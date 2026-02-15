# @gbv/server

GBV verifier API application (Next.js app router).

## Endpoints

- `GET /api/health`
- `POST /api/gbv/init`
- `POST /api/gbv/submit`
- `GET /api/gbv/receipt/:receiptId`

## Local Commands

From repo root:

- `corepack pnpm --filter @gbv/server dev`
- `corepack pnpm --filter @gbv/server test`
- `corepack pnpm --filter @gbv/server typecheck`

All runtime constants come from `gbv.config.ts`.

See root `README.md` for full-stack setup and extension-driven demo flow.
