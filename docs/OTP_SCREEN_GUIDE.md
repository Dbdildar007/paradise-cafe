# mobile_otp_access - behaviour & where each requirement lives

| # | Requirement | Implementation |
|---|---|---|
| 1 | Design as image (glass + clay, responsive) | `src/screens/MobileOtpAccessScreen.tsx`, `src/features/otp/components/*` |
| 2 | Country code, India only, working | `PhoneField` chip -> `CountryPickerSheet` (single India option) |
| 3 | OTP boxes + button hidden while typing the number | `showOtp = !!verificationId && !phoneFocused` |
| 4 | Show numbers on the device, pick one, auto-send OTP | Android Phone Number Hint: `services/auth/phoneHint.ts` -> `submitDevicePhone()` |
| 5 | Typed number -> Get OTP -> then OTP boxes | `get-otp-button` -> `useOtpFlow.requestOtp` |
| 6, 23 | OTP read automatically + auto-verify | Firebase auto-retrieval (`onAutoVerified`), iOS `oneTimeCode`; verifies on the 6th digit |
| 7 | 60 s timer; Resend enabled at 0 | `useCountdown`, `resend-timer`, `resend-button` |
| 8 | Wrong OTP message | `otp-error` -> "Incorrect OTP. Please check the code and try again." |
| 9 | Max 3 resends / 5 h | `resendLimiter.ts` (device, Keychain) + `otp-guard` + SQL (server) |
| 10, 12 | Firebase for send / resend / verify | `firebasePhoneAuth.ts` - see `docs/FIREBASE_SETUP.md` |
| 11, 14 | Supabase tables, create profile after verify | `supabase/migrations`, `auth-sync` -> `upsert_profile_on_login` |
| 13 | Home after verify | `navigation.reset(Home)` |
| 15 | Zomato-style flow | phone -> OTP -> auto-verify -> home; old and new users use the same path |
| 16 | Loader that blocks the screen | `BlockingLoader` (swallows touches and Android back) |
| 21 | API calls in separate files | `src/services/api/{httpClient,retry,authApi}.ts` |

## State machine (`useOtpFlow`)
`phone -> sending -> otp -> verifying -> (Home)`; editing the number resets to `phone`. Single-flight guards prevent double sends/verifies.
Order of a send: validate -> local limiter -> server guard (fails closed) -> record -> Firebase.

## testIDs (Maestro / tests)
`phone-input`, `country-chip`, `get-otp-button`, `otp-section`, `otp-input`, `otp-box-0..5`, `resend-timer`, `resend-button`,
`resend-limit`, `verify-button`, `phone-error`, `otp-error`, `blocking-loader`.

## Known platform limits
- iOS has no public API to list the phone's numbers: AutoFill suggestion on the keyboard is used instead.
- Firebase (not our code) decides when instant/auto verification is possible.
- Client-side limits are a UX guard; the authoritative limits are `otp-guard` + Firebase App Check + SMS region policy.
