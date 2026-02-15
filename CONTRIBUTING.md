# CONTRIBUTING

Thank you for your interest in contributing to the Glass Ballroom Verification (GBV) reference implementation.

This repository is a **protocol reference and evaluation environment**, so contributions should prioritize correctness, reproducibility, and architectural clarity over feature expansion.

---

## Local Setup

Prepare a development environment:

```bash
corepack prepare pnpm@10.4.1 --activate
corepack pnpm bootstrap
corepack pnpm dev
```

This will install workspace dependencies, build required artifacts, and start the local development environment.

---

## Required Checks Before Opening a Pull Request

All contributions must pass the following checks:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm demo:verify
```

These ensure code quality, type safety, protocol stability, and expected verifier behavior.

### Recommended Targeted Checks

Depending on the area of change, contributors are encouraged to run:

```bash
corepack pnpm test:server
corepack pnpm test:attack
corepack pnpm build:extension
```

These help validate API behavior, adversarial regression coverage, and extension compatibility.

---

## Contribution Rules

To preserve protocol correctness and evaluation integrity:

- Maintain alignment with the GBV specification defined in **`gbv_v0.71.pdf`**.
- Preserve the **blind verification property** — the server must not encode dataset validity labels.
- Do not introduce authentication systems, external APIs, or secret-dependent flows.
- Treat `gbv.config.ts` as the single source of runtime configuration.
- Reuse shared protocol logic from `@gbv/core`; avoid duplicating verification behavior across components.
- Prefer deterministic behavior over environment-dependent logic.

Changes that alter protocol semantics should be clearly justified and documented.

---

## Documentation Expectations

Documentation must be updated when behavior or structure changes.

| File                   | When to Update                         |
| ---------------------- | -------------------------------------- |
| `README.md`            | Setup, demo workflow, or usage changes |
| `docs/protocol-overview.md` | Specification-to-code mapping changes  |
| `docs/architecture.md` | Structural or architectural decisions  |
| `docs/threat-model.md` | Threat-model or adversarial assumption updates |
| `docs/demo-walkthrough.md` | Demo workflow or inspection UX changes |
| `CHANGELOG.md`         | User-visible or release-facing changes |

Documentation updates are considered part of the contribution, not optional follow-up work.

---

## Pull Request Requirements

Each pull request should include:

- a concise summary of what changed
- a **protocol impact note** (if applicable)
- evidence of successful testing (commands run and outcomes)

Example:

```
Ran:
- pnpm lint
- pnpm test
- pnpm demo:verify

Result:
All checks passed. No protocol behavior changes.
```

---

## Contribution Philosophy

GBV is a protocol reference implementation, not a feature-driven application. Contributions should aim to:

- improve correctness
- strengthen reproducibility
- clarify implementation intent
- maintain architectural simplicity

When in doubt, prefer smaller, well-scoped changes that preserve protocol transparency.
