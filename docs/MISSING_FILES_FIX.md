# "Cannot find module ..." / missing files - exact fix

## Why it happens
The update packs I sent (welcome-update, blankscreen-fix, otp-update) contain **only the files that changed**. They depend on
files from the **first full project** (ErrorBoundary, NetworkProvider, security/*, utils/*, theme/*, GlassCard, NeuSurface ...).
If your folder was not built from the full project, those imports point to files that do not exist.

## Fastest fix (recommended): use the COMPLETE project
1. Unzip **paradise-cafe-COMPLETE.zip** into a new folder.
2. If you have your own changes, copy only YOUR changed files over it (see "Your own edits" below).
3. `npm install`  then (iOS) `cd ios && bundle exec pod install`
4. `npm run check:imports`  -> must print "OK"
5. `npm run lint && npm run typecheck && npm test`

## Or repair your current folder
Copy these two things from the COMPLETE zip into your project (overwrite), then run `npm run check:imports`:
- the whole `src/` folder, `jest/`, `__tests__/`, `scripts/`, `docs/`, `supabase/`, `assets/`
- `package.json` (run `npm install` after)

`scripts/check-imports.js` lists **every** missing file (with the file that imports it) and every missing npm package:
```
MISSING FILES (2) - create/copy these:
  src/components/ErrorBoundary.tsx
      imported by src/app/App.tsx:5
MISSING NPM PACKAGES - run:
  npm install @react-native-firebase/app
```

## The files from your error messages -> where each one lives
| Import in your code | File that must exist |
|---|---|
| `../components/ErrorBoundary` | `src/components/ErrorBoundary.tsx` |
| `../services/network/NetworkProvider` | `src/services/network/NetworkProvider.tsx` |
| `../security/deviceIntegrity` | `src/security/deviceIntegrity.ts` |
| `../services/auth/firebasePhoneAuth` | `src/services/auth/firebasePhoneAuth.ts` |
| `../security/secureStorage` | `src/security/secureStorage.ts` |
| `../security/sslPinning` | `src/security/sslPinning.ts` |
| `../utils/logger`, `../utils/delay` | `src/utils/logger.ts`, `src/utils/delay.ts` |
| `../config/featureFlags` | `src/config/featureFlags.ts` |
| `../../../components/AppText` | `src/components/AppText.tsx` |
| `../../../components/GlassCard` | `src/components/GlassCard.tsx` |
| `../../../components/NeuSurface` | `src/components/NeuSurface.tsx` |
| `../../../theme` and `../../../theme/typography` | `src/theme/index.ts`, `src/theme/typography.ts` (+ colors, spacing, elevation) |
| `../../../utils/responsive` | `src/utils/responsive.ts` |

## Your RootNavigator imports `WelcomTest`
`import { WelcomTest } from '../screens/WelcomTest'` is **not one of my files** (it looks like a test screen you created).
That is why the real Welcome page never shows. In `src/navigation/RootNavigator.tsx`:
1. DELETE the line  `import { WelcomTest } from '../screens/WelcomTest';`
2. CHANGE  `<Stack.Screen name="WelcomeAsGuest" component={WelcomTest} ...`
   TO        `<Stack.Screen name="WelcomeAsGuest" component={WelcomeAsGuestScreen} options={{ animation: 'default', gestureEnabled: false }} />`
(`WelcomeAsGuestScreen` is already imported at the top of that file.) You can delete `WelcomTest.tsx`.

## Your own edits
Anything you changed yourself (for example `google-services.json`, `GoogleService-Info.plist`, bundle ids, signing, `src/config/api.ts` values) must be re-applied after copying.

## Complete `src/` structure
```
src/
  src/app/App.tsx
  src/app/bootstrap.ts
  src/components/AppText.tsx
  src/components/ClayBadge.tsx
  src/components/ClayButton.tsx
  src/components/DevRouteBadge.tsx
  src/components/ErrorBoundary.tsx
  src/components/GlassCard.tsx
  src/components/NeuSurface.tsx
  src/components/Reveal.tsx
  src/components/Screen.tsx
  src/components/icons.tsx
  src/config/api.ts
  src/config/assets.ts
  src/config/featureFlags.ts
  src/config/security.ts
  src/features/otp/components/BlockingLoader.tsx
  src/features/otp/components/CountryPickerSheet.tsx
  src/features/otp/components/LegalText.tsx
  src/features/otp/components/OtpBoxes.tsx
  src/features/otp/components/OtpHeader.tsx
  src/features/otp/components/PageDots.tsx
  src/features/otp/components/PhoneField.tsx
  src/features/otp/countdown.ts
  src/features/otp/defaultDeps.ts
  src/features/otp/otpPolicy.ts
  src/features/otp/phone.ts
  src/features/otp/resendLimiter.ts
  src/features/otp/types.ts
  src/features/otp/useCountdown.ts
  src/features/otp/useOtpFlow.ts
  src/navigation/RootNavigator.tsx
  src/navigation/linking.ts
  src/navigation/types.ts
  src/navigation/useGuardedNavigate.ts
  src/screens/BrowseLocationsScreen.tsx
  src/screens/HomeScreen.tsx
  src/screens/MenuAndOrderScreen.tsx
  src/screens/MobileOtpAccessScreen.tsx
  src/screens/NoInternetScreen.tsx
  src/screens/PlaceholderScreen.tsx
  src/screens/SecurityBlockedScreen.tsx
  src/screens/SplashScreen.tsx
  src/screens/WelcomeAsGuestScreen.tsx
  src/screens/welcome/components/BrandBadge.tsx
  src/screens/welcome/components/FeatureGrid.tsx
  src/screens/welcome/components/HeroBackdrop.tsx
  src/screens/welcome/components/OfferCard.tsx
  src/screens/welcome/components/OfferCarousel.tsx
  src/screens/welcome/components/PatronsPill.tsx
  src/screens/welcome/components/TopBar.tsx
  src/screens/welcome/components/WelcomeActions.tsx
  src/screens/welcome/welcomeContent.ts
  src/security/deepLinkGuard.ts
  src/security/deviceIntegrity.ts
  src/security/secureStorage.ts
  src/security/sslPinning.ts
  src/services/api/authApi.ts
  src/services/api/httpClient.ts
  src/services/api/retry.ts
  src/services/auth/authErrors.ts
  src/services/auth/deviceId.ts
  src/services/auth/firebasePhoneAuth.ts
  src/services/auth/phoneHint.ts
  src/services/network/NetworkGate.tsx
  src/services/network/NetworkProvider.tsx
  src/theme/colors.ts
  src/theme/elevation.ts
  src/theme/index.ts
  src/theme/spacing.ts
  src/theme/typography.ts
  src/utils/delay.ts
  src/utils/logger.ts
  src/utils/responsive.ts
```
Every file above must exist. The full list of the whole project is in `FILE_MANIFEST.txt`.
