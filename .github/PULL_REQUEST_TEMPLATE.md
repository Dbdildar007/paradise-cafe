## What & why

## Security checklist
- [ ] No secrets, tokens, keystores or PII committed or logged
- [ ] Sensitive data only via `secureStorage` (Keychain/Keystore) - no AsyncStorage
- [ ] New network hosts are pinned (`src/config/security.ts`) and HTTPS-only
- [ ] Deep links / intents validated against the allow-list
- [ ] New dependencies reviewed (maintainers, licence, install scripts)

## Testing
- [ ] Unit/component tests added or updated
- [ ] Maestro flow added/updated for user-visible changes
- [ ] Checked on a small phone (320dp), a large phone and a tablet/foldable; light/dark; large font size
