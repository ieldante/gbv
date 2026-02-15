# Security Policy

## Reporting a Vulnerability

Do not open public issues for security vulnerabilities.

Use GitHub Security Advisories private reporting:

1. Open the repository **Security** tab.
2. Select **Report a vulnerability**.
3. Submit a private advisory with details.

## What to Include

- clear vulnerability description
- affected GBV stage/component
- reproducible steps
- expected attacker model/capability
- observed impact
- optional mitigation proposal

## Priority Scope

Highest priority findings include:

- nonce-binding bypasses
- semantic invariant bypasses
- verifier authority/blindness violations
- receipt/commitment integrity flaws
- extension collection flow bypasses

## Response Expectations

- acknowledgement target: 72 hours
- triage and reproduction
- coordinated remediation
- optional attribution upon fix (on request)

## Safe Harbor

Good-faith testing and responsible private disclosure are welcome.

## Scope Context

This repository is a local-first protocol reference implementation. Reports should prioritize protocol correctness and verification integrity over hosted production hardening concerns.
