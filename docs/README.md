# GBV Documentation

> Documentation version: **v0.214**  
> Corresponds to the February 14, 2026 GBV development snapshot.

This directory contains technical documentation for the
**Glass Ballroom Verification (GBV)** reference implementation.

The documents below are organized by purpose to help readers
navigate the protocol, security model, and reference environment.

---

## Start Here

- [Protocol Overview](./protocol-overview.md)  
  Conceptual explanation of GBV stages, verification flow, and outcome model.

- [Architecture](./architecture.md)  
  System structure and runtime interaction between extension, client surfaces, and verifier.

---

## Security Model

- [Threat Model](./threat-model.md)  
  Adversarial assumptions and protocol security objectives.

- [Traceability](./traceability.md)  
  Mapping between protocol stages and implementation artifacts.

---

## Running the Reference Implementation

- [Demo Walkthrough](./demo-walkthrough.md)  
  Step-by-step manual verification flow and expected outcomes.

---

## Development and Design Notes

- [Development Notes](./development-notes.md)  
  Implementation alignment rules and active design constraints.

- [Release Hardening Report](./release-hardening-report.md)  
  Stabilization work and guarantees introduced for the v0.214 release.

---

## Research

- [GBV Public Research Draft (v0.214)](./research/gbv_public_v0.214.pdf)

This draft marks the public transition from ARGON-V to GBV.
