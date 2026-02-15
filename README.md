> ⚠️ **Development Branch**
>
> This branch contains ongoing development work for the GBV reference
> implementation. Behavior, documentation, and interfaces may change.
> For a stable snapshot, refer to tagged releases.


# Glass Ballroom Verification (GBV) Reference Implementation

**Glass Ballroom Verification (GBV)** is a deterministic client-server verification protocol for evaluating cross-surface semantic consistency of browser-observable artifacts under verifier authority.

This repository provides the official GBV reference implementation. GBV is domain-agnostic; course records are included only as a reproducible demonstration environment.

> **Documentation state — v0.214**
>
> This repository reflects the state of the GBV reference implementation
> as of February 14, 2026, when protocol terminology was consolidated
> under the Glass Ballroom Verification (GBV) name. Earlier drafts may
> reference ARGON-V terminology.

> [!NOTE]
> While core protocol mechanics are implemented, certain components remain under iterative refinement as security assumptions and edge cases are stress-tested. Interfaces and internal representations may evolve prior to the v0.1 stabilization milestone.

## What This Repository Provides

- A deterministic GBV reference environment for engineers and researchers.
- A complete client-server verification flow:
  - MV3 browser extension collects browser-observable surfaces.
  - Server independently evaluates protocol invariants.
- A transparency-first verification inspector with structured summaries and verbatim server payloads.

GBV evaluates whether independently observed surfaces can represent a single coherent state without requiring privileged provider access or shared ground truth.

---

## What This Repository Is Not

- Not a production credential verification service.
- Not a hosted SaaS deployment.
- Not a provider-integrated system with authentication, rate limiting, or tenant isolation.

This repository is a protocol reference and research implementation.

---

## Protocol Blindness Clarification

In GBV, blindness means authority separation, not UI opacity.

- The server is decision-authoritative.
- The server does not rely on dataset validity labels.
- The client cannot influence verifier outcomes.

The extension can display full server-returned metadata without violating protocol blindness.

---

## Repository Layout

- [`apps/server`](./apps/server/) - GBV verifier API (`/api/gbv/*`)
- [`apps/client/synthetic`](./apps/client/synthetic/) - synthetic learning platform surfaces
- [`apps/extension`](./apps/extension/) - Chrome MV3 GBV client
- [`packages/gbv-core`](./packages/gbv-core/) - canonicalization, invariants, commitments, receipts
- [`packages/gbv-config`](./packages/gbv-config/) - shared runtime configuration
- [`docs/`](./docs/) - architecture, protocol, threat model, walkthroughs, and reports

---

## Research Paper Versioning

Research drafts are versioned independently from implementation code.

Current public research draft:

- [`docs/research/gbv_public_v0.214.pdf`](./docs/research/gbv_public_v0.214.pdf)

---

## Prerequisites

- Node.js 22+
- Corepack

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
```

---

## Quickstart

```bash
corepack pnpm bootstrap
corepack pnpm dev
```

Services:

- Synthetic client: [http://localhost:3000](http://localhost:3000)
- GBV server: [http://localhost:3001](http://localhost:3001)
- Extension build: [`apps/extension/build`](./apps/extension/build/)

---

## Manual Demo Walkthrough

1. Open `chrome://extensions`.
2. Enable **Developer Mode**.
3. Load unpacked extension from [`apps/extension/build`](./apps/extension/build/).
4. Open `http://localhost:3000/hub`.
5. Open the extension popup.
6. Choose a course.
7. Click **Verify**.

### Expected Baseline Behavior

- `csk_7r2q9p` -> accepted
- `csk_0a81lm` -> semantic mismatch (`SEMANTIC_VERIFICATION_FAILED`, `module_count_consistency`)
- `csk_3z19tt` -> semantic mismatch (`SEMANTIC_VERIFICATION_FAILED`, `certificate_id_consistency`)
- `csk_t1mix` -> semantic mismatch (`SEMANTIC_VERIFICATION_FAILED`, includes `grade_threshold` and `course_key_consistency`)

### Popup Behavior

- Structured summary first (state, status, score, IDs, timing)
- Grouped protocol sections
- Expandable **Raw Response** with verbatim verifier payload

---

## Automated Verification

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm demo:verify
```

`demo:verify` validates expected protocol states, mismatch classes, and invariant behavior.

---

## Extension Smoke Test

```bash
corepack pnpm exec playwright install chromium
corepack pnpm test:extension-smoke
```

CI executes these tests under Xvfb.

---

## Debug Logs (Off by Default)

PowerShell:

```powershell
$env:GBV_DEBUG='1'; corepack pnpm dev
```

Bash:

```bash
GBV_DEBUG=1 corepack pnpm dev
```

---

## Security and Privacy Notes

- Server logs request IDs, timing metrics, and non-sensitive diagnostics only.
- Raw page HTML is not logged by default.
- Security disclosures should use GitHub Security Advisories private reporting.

---

## Troubleshooting

**Extension cannot verify**

- Run `corepack pnpm build:extension`
- Reload unpacked extension
- Verify `http://localhost:3001/api/health`
- Verify `http://localhost:3000/api/gbv/courses`

**Extension smoke test fails**

```bash
corepack pnpm exec playwright install chromium
```

---

## Documentation

For structured documentation navigation, start with
[`docs/README.md`](./docs/README.md).

- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/protocol-overview.md`](./docs/protocol-overview.md)
- [`docs/threat-model.md`](./docs/threat-model.md)
- [`docs/demo-walkthrough.md`](./docs/demo-walkthrough.md)
- [`docs/release-hardening-report.md`](./docs/release-hardening-report.md)
- [`docs/development-notes.md`](./docs/development-notes.md)
- [`docs/traceability.md`](./docs/traceability.md)
- [`docs/research/`](./docs/research/)

---

## Project Policies

- [`SECURITY.md`](./SECURITY.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- [`CHANGELOG.md`](./CHANGELOG.md)

---

## License

See [`LICENSE`](./LICENSE).
