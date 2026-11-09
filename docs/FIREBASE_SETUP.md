# Firebase Phone Authentication - what you must do

The app already contains all code (`src/services/auth/firebasePhoneAuth.ts`). You only configure Firebase and add 2 files.

## 1. Create the project and apps
1. https://console.firebase.google.com -> **Add project** (e.g. `paradise-cafe-prod`; make a second one for staging).
2. **Add app -> Android**: package name `in.paradisecafe.app`. **Add app -> iOS**: bundle id `in.paradisecafe.app`.
3. Note the **Project ID** (Project settings). It is also used by the Supabase Edge Function (`FIREBASE_PROJECT_ID`).

## 2. Enable Phone sign-in
Authentication -> Sign-in method -> **Phone** -> Enable.
- **Phone numbers for testing** (development, free, no SMS): add `+91 98765 43210` -> code `123456`.
- Authentication -> Settings -> **SMS region policy**: *Allow* only **India (IN)**. This blocks SMS-pumping to other countries.
- Phone Auth beyond the free tier needs the **Blaze** plan.

## 3. Android
1. Add fingerprints: Project settings -> your Android app -> **Add fingerprint** (SHA-1 **and** SHA-256) for:
   - debug: `cd android && ./gradlew signingReport`
   - release/upload keystore: `keytool -list -v -keystore release.keystore -alias <alias>`
   - **Play App Signing** key (Play Console -> Setup -> App signing). Without this, production OTP fails with `auth/missing-client-identifier`.
2. Download **google-services.json** -> put it in `android/app/google-services.json` (already git-ignored; CI injects it from the secret `GOOGLE_SERVICES_JSON_BASE64`).
3. Google Cloud console for the same project -> enable **Play Integrity API**.
4. The build applies the Google Services plugin only when the file exists, so a fresh clone still builds.
5. Emulator: use an image **with Google Play** (needed for auto-retrieval and the device-number picker).

## 4. iOS (macOS)
1. Download **GoogleService-Info.plist**. In Xcode drag it into the `ParadiseCafe` group (check *Copy items* and the app target). CI injects it from `GOOGLE_SERVICE_INFO_PLIST_BASE64`.
2. Xcode -> target -> Info -> **URL Types** -> add a URL whose *URL Schemes* = the plist's `REVERSED_CLIENT_ID` (reCAPTCHA fallback).
3. Signing & Capabilities -> **Push Notifications** and **Background Modes -> Remote notifications** (silent-push verification).
4. Firebase -> Project settings -> Cloud Messaging -> upload your **APNs Auth Key (.p8)**.
5. `cd ios && bundle exec pod install`. The Podfile already uses static frameworks for Firebase.
   `AppDelegate.mm` only calls `[FIRApp configure]` when the plist exists (no crash on a fresh clone).

## 5. Abuse protection (recommended before launch)
- **App Check**: Firebase -> App Check -> register *Play Integrity* (Android) and *App Attest* (iOS), then **Enforce** for Authentication. (Add `@react-native-firebase/app-check` and initialise it at startup.)
- The app also calls the `otp-guard` Edge Function before every SMS (1 send + 3 resends / 5 h / phone, 60 s cooldown, 12 / device).

## 6. How the OTP behaves
| Situation | What happens |
|---|---|
| Android, SMS arrives | Firebase **auto-retrieves** it (no SMS permission) -> boxes fill -> verify -> Home |
| Android, instant verification | Signed in without any SMS |
| iOS | The keyboard suggests the code ("From Messages"); typing the 6th digit verifies automatically |
| Wrong code | "Incorrect OTP..." under the boxes; 5 wrong tries -> must resend |
| Test numbers | The fixed code you configured, no SMS |

## 7. Troubleshooting
| Error / symptom | Fix |
|---|---|
| `auth/missing-client-identifier`, `auth/app-not-authorized` | Add SHA-1/SHA-256 (incl. Play App Signing), re-download google-services.json, enable Play Integrity API |
| `auth/invalid-app-credential`, `auth/captcha-check-failed` (iOS) | URL scheme `REVERSED_CLIENT_ID` missing, or APNs key not uploaded |
| `auth/too-many-requests` | Firebase throttled this number/device; use a test number or wait |
| "No Firebase App '[DEFAULT]'" | google-services.json / GoogleService-Info.plist missing in this build |
| No device-number sheet | Needs Google Play services; shown only on Android |
