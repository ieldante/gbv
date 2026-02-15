# Architecture

The GBV reference implementation is organized as a workspace monorepo with clear separation of responsibilities:

- `apps/server`: verifier APIs and session lifecycle.
- `apps/client/synthetic`: synthetic multi-surface platform used for reproducible verification runs.
- `apps/extension`: MV3 client that performs browser-observable collection.
- `packages/gbv-core`: canonicalization, invariant checks, commitments, and receipt primitives.
- `packages/gbv-config`: runtime configuration loader/validation shared across apps.

## Runtime Flow

1. The extension popup selects a course artifact and starts a run.
2. The background service worker requests a challenge from `POST /api/gbv/init`.
3. The extension traverses configured surfaces and captures browser-observable snapshots.
4. Captured pages are submitted to `POST /api/gbv/submit`.
5. The server validates structure and semantic consistency, then returns receipt/metadata.

## Design Constraints

- Server decisions are independent of dataset validity labels.
- Client display is transparent: server metadata is visible to users and developers.
- Shared protocol behavior lives in `@gbv/core` to avoid drift.
- Configuration is centralized in `gbv.config.ts`.
