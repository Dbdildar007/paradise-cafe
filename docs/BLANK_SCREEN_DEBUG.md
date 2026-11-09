# White screen after the splash - find the cause in 5 minutes

## 1. Which build is it?
- `npm run android` = **debug** (needs Metro running in another terminal). A JS error shows a RED screen or yellow box.
- `--mode release` / Play build = **release**: errors are silent, so you MUST read logcat.

## 2. Read the real error (this is the step that gives the answer)
```bash
adb logcat -c                                   # clear old logs
adb logcat *:S ReactNative:V ReactNativeJS:V AndroidRuntime:E
# then open the app and wait for the white screen. Look for: Error / TypeError / Invariant Violation / FATAL
```
Debug build extras: look at the Metro terminal for red text; press `adb shell input keyevent 82` (dev menu) -> Reload.
If Metro isn't reachable: `adb reverse tcp:8081 tcp:8081`.

## 3. No error anywhere? Bisect with the built-in switches (src/config/featureFlags.ts)
Set ONE flag to `true`, save, reload, test. The flag that makes the page appear is the culprit:
| flag | what it removes |
|---|---|
| `disableReveal` | entrance animations (content invisible if the animation never runs) |
| `disableBlur` | native BlurView |
| `disableHeroImage` | welcome-hero.jpg (uses drawn hero) |
If one of them fixes it, leave it `true` (the app still looks right) and send me which one.

## 4. Still blank? Isolate the screen
In `src/navigation/RootNavigator.tsx` temporarily change `component={WelcomeAsGuestScreen}` to `component={HomeScreen}`.
- Text `home_screen` appears -> navigation is fine, the bug is inside the Welcome UI (use step 3).
- Still white -> the problem is navigation / native-screens / stale build: run
  `cd android && ./gradlew clean && cd .. && npx react-native start --reset-cache` and reinstall (`adb uninstall in.paradisecafe.app`).

## 5. Other common causes
- Stale JS cache: `npx react-native start --reset-cache`.
- Version drift: `npm ls react-native react-native-screens react-native-safe-area-context` must show 0.76.5 / 4.4.0 / 5.0.0.
- Emulator animations disabled ("Remove animations"): handled by the new Reveal fail-safe.
- Release build on an emulator: root/jailbreak checks may block the app on emulators (you'd see "This device is not supported").
