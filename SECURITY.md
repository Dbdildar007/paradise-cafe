# Security policy

Report vulnerabilities privately to security@your-company.example (PGP key on request). Do not open public issues.
We acknowledge within 2 business days and target fixes for critical issues within 7 days.

## Controls in this repository
| Area | Control | Where |
|---|---|---|
| Transport | HTTPS only, SPKI public-key pinning (JS + native), user-CAs untrusted | `src/security/sslPinning.ts`, `native-config/*` |
| Storage | Keychain / Android Keystore only; AsyncStorage banned (ESLint + postinstall + test) | `src/security/secureStorage.ts` |
| Integrity | Root/jailbreak/hook/debugger detection, fail-closed, token wipe | `src/security/deviceIntegrity.ts` |
| Binary | Hermes bytecode, R8 obfuscation, no backups, `debuggable=false` | `native-config/android`, `scripts/verify-hermes-bytecode.sh` |
| Logging | `console.*` stripped in production, `logger` no-op | `babel.config.js`, `src/utils/logger.ts` |
| Links | Allow-listed scheme/paths; cold-start links ignored until gate | `src/security/deepLinkGuard.ts` |
| Supply chain | Dependabot, dependency review, npm audit, gitleaks, CodeQL, provenance attestations | `.github/` |
| CI secrets | GitHub Environments, secrets scoped per step, temp keychain/keystore shredded | `.github/workflows/ci-cd.yml` |

No client-side control makes an app "un-hackable": they raise attacker cost. Authoritative checks (authz, pricing,
payment, rate limits, OTP) MUST be enforced server-side. Consider Play Integrity / App Attest for server-verified attestation.
