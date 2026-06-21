## 1. Dependency & provider

- [ ] 1.1 Install the native dependency with `npx expo install react-native-keyboard-controller` (lets Expo resolve a compatible version); confirm it lands in `package.json`
- [ ] 1.2 Verify the resolved version supports the new architecture + Reanimated 4 (check release notes / Expo SDK 54 compatibility); note the version in the PR
- [ ] 1.3 Mount `<KeyboardProvider>` at the app root in `app/_layout.tsx`, wrapping the existing tree above all screens

## 2. Container rewrite (TDD)

- [ ] 2.1 Update `src/components/ui/__tests__/KeyboardAvoidingContainer.test.tsx`: render within a `KeyboardProvider`, assert children render and that no platform-conditional `behavior`/`keyboardVerticalOffset` workaround remains; replace the offset-specific assertions from the built-in implementation
- [ ] 2.2 Rewrite `src/components/ui/KeyboardAvoidingContainer.tsx` on top of the library's `KeyboardAvoidingView`, preserving the existing public props (`children`, `style`, `keyboardVerticalOffset`, passthrough) so `add.tsx`/`edit.tsx` need no changes
- [ ] 2.3 Remove the now-unused `Platform`/`useHeaderHeight` offset branching and the `behavior="padding"` workaround

## 3. Verification

- [ ] 3.1 `npm test` — all suites pass (including the revised container test)
- [ ] 3.2 `npx tsc --noEmit` clean and `npx expo lint` clean
- [ ] 3.3 `openspec validate adopt-keyboard-controller --strict` passes
- [ ] 3.4 Rebuild the dev client (`expo prebuild` + `expo run:android` / `expo run:ios`, or EAS) — confirm the native module loads
- [ ] 3.5 Manual on Android (edge-to-edge): focus a bottom input on add/edit → it stays visible; dismiss the keyboard → no residual background block
- [ ] 3.6 Manual on iOS: focus stays visible above the keyboard; layout resets cleanly on dismiss

## 4. Documentation

- [ ] 4.1 Update `openspec/CONTEXT.md`: record that keyboard avoidance uses `react-native-keyboard-controller` and that a dev-client/prebuild is required (stock Expo Go no longer sufficient)
