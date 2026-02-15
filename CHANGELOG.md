# CHANGELOG

## Unreleased

### Added

---

## v0.214 — 2026-02-14

### Added

- `CODE_OF_CONDUCT.md` for community standards.
- Structured extension verifier inspector UI with grouped protocol sections.
- Expandable raw-response viewer showing verbatim server payload.
- Extension runtime `GBV_PING` message for deterministic smoke checks.
- Shared server logger with request IDs and stage timing.
- Privacy-safe trace metadata in verifier responses (`requestId`, `timing`, `traceSummary`, `failedInvariantIds`).
- Top-level `/docs` structure:
  - `docs/architecture.md`
  - `docs/protocol-overview.md`
  - `docs/threat-model.md`
  - `docs/demo-walkthrough.md`
  - `docs/research/README.md`
- `@gbv/core` unit tests for receipts, merkle proofs, and structure-bound nonces.
- Playwright-based extension smoke script (`scripts/extension-smoke.ts`).
- GitHub Actions CI workflow with quality, strict demo, and extension smoke jobs.
- Release hardening report (`docs/release-hardening-report.md`).

### Changed

- `demo:verify` now performs strict assertions for baseline/adversarial outcomes.
- Extension and server debug diagnostics gated by `GBV_DEBUG`.
- `README.md` rewritten for onboarding-first OSS usage.
- `SECURITY.md` moved to GitHub Security Advisories reporting.
- Development and traceability docs consolidated under `/docs`.

---

## 1.0.0

- GBV workspace architecture with server, synthetic client, extension, and shared core packages.
- Config-driven GBV API routes and deterministic synthetic dataset outcomes.
