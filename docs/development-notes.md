# Development Notes

This document tracks implementation-level notes that are useful during active GBV development.

## Primary References

- Architecture: [`docs/architecture.md`](./architecture.md)
- Protocol behavior: [`docs/protocol-overview.md`](./protocol-overview.md)
- Threat assumptions: [`docs/threat-model.md`](./threat-model.md)

## Current Focus Areas

- Keep verifier-side invariants centralized in [`packages/gbv-core`](../packages/gbv-core/).
- Keep runtime config authoritative in [`gbv.config.ts`](../gbv.config.ts).
- Keep extension behavior aligned with server contract and documented in [`docs/demo-walkthrough.md`](./demo-walkthrough.md).
