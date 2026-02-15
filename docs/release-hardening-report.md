# Release Hardening Report

## What Was Broken and How It Was Fixed

- Extension output was raw-JSON-first and hard to inspect.
  - Fixed by implementing structured summary sections plus grouped protocol details.
- Demo verification could report pass without strict semantic expectations.
  - Fixed by making `demo:verify` assert exact baseline/adversarial outcomes and mismatch categories.
- No deterministic extension runtime smoke check existed.
  - Fixed by adding Playwright extension smoke script and CI job (service worker + messaging).
- Protocol observability lacked explicit request/timing metadata.
  - Fixed by adding server request IDs, stage timing summaries, and trace-safe response metadata.
- Deep documentation was not organized under `/docs`.
  - Fixed by creating `/docs` and moving long-form technical content there.

## End-to-End Verification Performed

Commands run:

```bash
corepack pnpm bootstrap
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm demo:verify
```

Expected/observed outcomes:

- lint/typecheck: pass
- tests: pass (`@gbv/core` unit + server integration suites)
- demo verify: strict pass with:
  - `csk_7r2q9p: ACCEPTED (strict checks passed)`
  - `csk_t1mix: REJECTED (strict checks passed)`
  - `OVERALL: PASS (strict assertions)`

Extension smoke command:

```bash
corepack pnpm test:extension-smoke
```

Local note: requires Playwright Chromium install first (`corepack pnpm exec playwright install chromium`). CI installs this automatically.

## New/Updated Tests and Guarantees

- `packages/gbv-core/tests/receipt.test.ts`
  - guarantees tampered receipt signatures fail validation.
- `packages/gbv-core/tests/merkle.test.ts`
  - guarantees invalid merkle roots fail proof validation.
- `packages/gbv-core/tests/invariants.test.ts`
  - guarantees structure-bound nonce and page-plan invariant failures are detected.
- `apps/server/tests/api-contract.test.ts`
  - guarantees pass-path receipts are cryptographically verifiable.
- `apps/server/tests/attack-mixed-grade.test.ts`
  - guarantees fail-path exposes expected mismatch categories.
- `scripts/extension-smoke.ts`
  - guarantees MV3 background service worker starts and handles `GBV_PING`.

## Remaining Known Issues

1. Playwright browser binaries are not bundled by default and must be installed once locally before running extension smoke tests.
2. Server info logs remain enabled in non-debug mode (request/timing diagnostics) by design; only verbose debug traces are gated by `GBV_DEBUG`.
