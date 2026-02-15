# Protocol Overview

GBV evaluates whether independently observed surfaces can represent one coherent state.

## Stage Mapping

1. Stage I: challenge issuance (`/api/gbv/init`).
2. Stage II: multi-surface collection in a normal browser context.
3. Stage III: nonce/structure and semantic invariant verification.
4. Stage IV: deterministic canonicalization of observed data.
5. Stage V: commitment and signed receipt generation.

## Key Properties

- Verification is server-authoritative.
- Decisions derive from observed evidence and protocol checks.
- No privileged provider APIs are required.
- The extension can display full server protocol metadata without violating blindness.

## Outcome Model

- `ok: true` + `accepted: true` indicates coherent evidence.
- `ok: false` with structured error code indicates invariant/protocol failure.
- Raw response payload remains available for exact inspection.
