# Repository settings to enable (GitHub)

1. **Rulesets / branch protection** on `main` and `staging`: require PR, 2 approvals, CODEOWNERS review, signed commits,
   linear history, dismiss stale approvals, block force-push, require status checks:
   `SAST & quality gates`, `Build & sign Android`, `Build & sign iOS`, `E2E smoke (Android)`, `E2E smoke (iOS)`, `CodeQL / analyze`.
2. **Environments**
   - `build-signing`: holds `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`,
     `IOS_BUILD_CERTIFICATE_BASE64`, `IOS_P12_PASSWORD`, `IOS_PROVISION_PROFILE_BASE64`, `IOS_KEYCHAIN_PASSWORD`.
   - `staging`: Firebase secrets/vars. Optional 1 reviewer.
   - `production`: **required reviewers (2)**, wait timer, deployment branches = `main` only; holds `PLAY_SERVICE_ACCOUNT_BASE64`,
     `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8_BASE64`, `FIREBASE_SERVICE_ACCOUNT_BASE64`; var `FIREBASE_ANDROID_APP_ID`.
3. **Actions settings**: restrict to GitHub + verified/allow-listed actions, default `GITHUB_TOKEN` = read-only, require approval for fork PRs.
4. **Security**: enable secret scanning + push protection, Dependabot alerts/updates, code scanning.
5. Pin third-party actions to full commit SHAs (Dependabot keeps them updated).

## Additional secrets / variables for the OTP + backend work
- `build-signing` environment: `GOOGLE_SERVICES_JSON_BASE64`, `GOOGLE_SERVICE_INFO_PLIST_BASE64`
  (`base64 -i google-services.json | pbcopy` / `base64 -w0 google-services.json`)
- `staging` / `production` environments: secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `OTP_HASH_PEPPER`;
  variables `SUPABASE_PROJECT_REF`, `FIREBASE_PROJECT_ID`. Put required reviewers on `production` (it now also gates the backend deploy).
- Add `Backend tests (Supabase)` to the required status checks.
