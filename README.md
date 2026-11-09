# Paradise Cafe - React Native (CLI) enterprise food-ordering app

Warm Tactile Hospitality design system (`docs/DESIGN.md`): glassmorphism + neumorphism + claymorphism only.
React Native CLI (no Expo) - one TypeScript codebase for iOS & Android.

## Delivered so far
Splash (pixel-matched to the supplied design) · No-internet screen (auto overlay on any screen) · Security-blocked screen ·
placeholder pages `welcome_as_guest`, `mobile_otp_access`, `home_screen` · native-stack navigation with per-route transitions ·
secure storage, SSL pinning, root/jailbreak detection, deep-link guard · Jest suite · Maestro flows · Fastlane · GitHub CI/CD.

## Setup (native projects are INCLUDED - generated from the official React Native 0.76.5 template)
```bash
npm install
# fonts (optional, app falls back to system fonts): put Plus Jakarta Sans + Inter .ttf in assets/fonts, then
npx react-native-asset
# iOS (macOS only)
bundle install && cd ios && bundle exec pod install && cd ..
# Android: emulator or device connected
npm run android          # terminal 2   (npm start in terminal 1)
npm run ios
```
Android release signing and R8 are already wired in `android/app/build.gradle` (reads `ANDROID_KEYSTORE_*` env vars from CI).
Quality gates: `npm run lint && npm run typecheck && npm run test:ci`.

## Folder structure
```
paradise-cafe/
├─ index.js · app.json · babel.config.js (strips console in prod) · metro.config.js · jest.config.js
├─ tsconfig.json · .eslintrc.js (bans AsyncStorage/console/eval) · .eslintignore · .prettierrc.js
├─ android/ · ios/                      # official RN 0.76.5 native projects + hardening applied
├─ Gemfile · fastlane/ (Fastfile, Appfile, Pluginfile)
├─ docs/ DESIGN.md · BRANCH_PROTECTION.md
├─ assets/fonts/                       # Plus Jakarta Sans, Inter
├─ src/
│  ├─ app/        App.tsx · bootstrap.ts (integrity → pinning → session restore)
│  ├─ config/     security.ts (pins, policy, deep-link schemes)
│  ├─ theme/      colors · typography · spacing · elevation (glass/neu/clay recipes)
│  ├─ utils/      responsive.ts (any-size scaling) · logger.ts · delay.ts
│  ├─ components/ AppText · Screen · NeuSurface · GlassCard · ClayBadge · ClayButton · icons · ErrorBoundary
│  ├─ navigation/ RootNavigator · linking · types
│  ├─ screens/    Splash · NoInternet · SecurityBlocked · Placeholder · WelcomeAsGuest (full UI) · MobileOtpAccess · Home
│  │              MenuAndOrder · BrowseLocations (name-only stubs)
│  │  └─ welcome/ welcomeContent.ts · components/ HeroBackdrop TopBar BrandBadge PatronsPill OfferCard OfferCarousel FeatureGrid WelcomeActions
│  ├─ security/   secureStorage · sslPinning · deviceIntegrity · deepLinkGuard
│  ├─ features/otp/  useOtpFlow (state machine) · resendLimiter · phone · countdown · components/ (OtpBoxes PhoneField CountryPickerSheet BlockingLoader OtpHeader LegalText PageDots)
│  └─ services/   network/ (NetworkProvider NetworkGate) · api/ (httpClient retry authApi) · auth/ (firebasePhoneAuth phoneHint deviceId authErrors)
├─ __tests__/    25 suites / 229 tests (otp/, welcome/, supabase/ ...) (unit, component, navigation flow, static security policy)
├─ jest/setup.ts                       # native-module mocks
├─ .maestro/     00 launch+nav · 01 auth+biometric · 02 cart+checkout · 03 offline (01/02 are templates)
├─ supabase/  config.toml · migrations/ (7 files) · seed.sql · functions/ (otp-guard, auth-sync, _shared) · tests/ (local DB harness + pgTAP)
├─ scripts/      verify-pins.js · verify-hermes-bytecode.sh · postinstall-check.js
├─ native-config/ android/ (proguard, gradle, manifest, network-security, backup rules) · ios/ (ATS pinning, Podfile)
└─ .github/      workflows/ci-cd.yml · workflows/codeql.yml · dependabot.yml · CODEOWNERS · PR template
   .gitleaks.toml · SECURITY.md
```

## Navigation & transitions
Splash →(cross-fade)→ WelcomeAsGuest →(slide from right, iOS swipe-back)→ MobileOtpAccess →(fade-from-bottom, stack reset)→ Home.
Signed-in users go Splash → Home. Compromised device → SecurityBlocked. In `__DEV__` the placeholder pages show a small
"Dev:" pill to exercise transitions; release builds show only the page name.

## Before the first release
Replace `REPLACE_ME` certificate pins (`npm run verify:pins` blocks the pipeline until done) · create the GitHub Environments in
`docs/BRANCH_PROTECTION.md` · set real CODEOWNERS teams · add fonts.

## Troubleshooting
**`UnsatisfiedLinkError: library "libhermes_executor.so" not found`** - see docs/ANDROID_HERMES_CRASH_FIX.md

## Docs
`docs/FIREBASE_SETUP.md` · `docs/SUPABASE_SETUP.md` · `docs/OTP_SCREEN_GUIDE.md` · `docs/BLANK_SCREEN_DEBUG.md` · `docs/BRANCH_PROTECTION.md`
Tests: `npm test` (app) · `npm run test:backend` (SQL on real Postgres + Edge Functions) · Maestro flows in `.maestro/`.
