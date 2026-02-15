# Threat Model

GBV is designed for adversarial surface manipulation scenarios in which:

- attackers can alter one or more client-observable surfaces,
- attackers can mix surfaces from different legitimate states,
- verifier logic must operate without privileged provider-side ground truth.

## In Scope

- nonce binding and session misuse attempts,
- cross-surface semantic inconsistencies,
- evidence tampering that breaks deterministic commitments.

## Out of Scope

- hosted production hardening concerns outside protocol semantics (for example auth/rate limiting),
- provider-controlled trust anchors not present in this local reference environment.

## Security Objective

Detect when submitted observations cannot simultaneously satisfy configured invariants for a single coherent state.
