# Traceability

This document maps protocol stages to implementation artifacts.

## Stage to Code Mapping

- Stage I (challenge issuance): [`apps/server/src/app/api/gbv/init/route.ts`](../apps/server/src/app/api/gbv/init/route.ts)
- Stage II (surface collection): [`apps/extension/src`](../apps/extension/src/)
- Stage III (verification): [`packages/gbv-core/src/semantic`](../packages/gbv-core/src/semantic/)
- Stage IV (canonicalization): [`packages/gbv-core/src/providers/synthetic`](../packages/gbv-core/src/providers/synthetic/)
- Stage V (commitment + receipt): [`apps/server/src/lib/gbvServerService.ts`](../apps/server/src/lib/gbvServerService.ts), [`packages/gbv-core/src/receipt.ts`](../packages/gbv-core/src/receipt.ts)

## Contract and Validation References

- API contract tests: [`apps/server/tests/api-contract.test.ts`](../apps/server/tests/api-contract.test.ts)
- Attack regression tests: [`apps/server/tests/attack-mixed-grade.test.ts`](../apps/server/tests/attack-mixed-grade.test.ts)
- Demo strict verifier flow: [`scripts/demo-verify.ts`](../scripts/demo-verify.ts)
