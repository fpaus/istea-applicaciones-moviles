## Context

`KeyboardAvoidingContainer` wraps RN's built-in `KeyboardAvoidingView`. Under Expo SDK 54 (mandatory edge-to-edge, new architecture) it needed two workarounds:

1. `behavior="padding"` forced on both platforms — without it Android was a no-op and the keyboard covered inputs.
2. `keyboardVerticalOffset` set to `0` on Android — RN binds Android's `keyboardDidHide` to its change handler (not the hide handler), so a non-zero offset leaves residual `paddingBottom` (a colored block) on dismiss.

Both are documented brittleness in RN's component. `react-native-keyboard-controller` is the ecosystem-standard replacement that handles show/hide symmetrically and is edge-to-edge aware. The container's public API (`children`, `style`, `keyboardVerticalOffset`, passthrough props) is already consumed by `add.tsx` and `edit.tsx`; keeping it stable means screens don't change.

## Goals / Non-Goals

**Goals:**
- Replace the built-in keyboard avoidance with `react-native-keyboard-controller`.
- Preserve the `KeyboardAvoidingContainer` API so `add.tsx`/`edit.tsx` are untouched.
- Eliminate platform-conditional `behavior`/offset logic and the dismiss residual.
- Keep a unit test asserting the container renders correctly within a provider.

**Non-Goals:**
- No change to form structure, validation, or the screens themselves.
- No global keyboard toolbar/accessory bar, sticky footers, or animated keyboard-tracking views (possible future follow-ups).
- Not removing `react-native-safe-area-context`.

## Decisions

**Use `KeyboardAwareScrollView` inside the container, not just `KeyboardAvoidingView`.**
`add.tsx`/`edit.tsx` already render their own `ScrollView`. Two reasonable options:
- (A) Keep the container as a thin `KeyboardAvoidingView` wrapper and leave each screen's `ScrollView` in place — smallest diff, preserves API exactly.
- (B) Have the container expose a keyboard-aware scroll view and drop the screens' `ScrollView`.
Choose **(A)** to honor the "API unchanged / screens untouched" goal; revisit (B) only if focus-scrolling proves insufficient.

**Mount `KeyboardProvider` once at the app root (`app/_layout.tsx`).**
The library requires a single provider above all consumers. Root mount covers every screen and future forms. Alternative (wrapping per-screen) is rejected as repetitive and error-prone.

**Native dependency installed via `npx expo install react-native-keyboard-controller`.**
Ensures an Expo-compatible version. Because it ships native code, a new dev-client (`expo prebuild` / EAS, or `expo run:android|ios`) is required; stock Expo Go will not load it. This is called out in the proposal and tasks.

## Risks / Trade-offs

- **Breaks stock Expo Go** → Mitigation: document the dev-client/prebuild requirement in tasks and CONTEXT; only adopt when the team is on a dev build.
- **Behavioral regression vs. the working built-in workaround** → Mitigation: this change is deferred; the current workaround stays until implemented and manually verified on both platforms (show keeps input visible; dismiss leaves no residual block).
- **Library/Expo version drift** → Mitigation: install via `expo install` and pin to the Expo-resolved version.
- **New-architecture/Reanimated compatibility** (the app uses `react-native-reanimated` 4 + new arch) → Mitigation: verify the keyboard-controller version supports the new architecture during implementation.

## Migration Plan

1. `npx expo install react-native-keyboard-controller`.
2. Wrap the root layout tree in `<KeyboardProvider>`.
3. Rewrite `KeyboardAvoidingContainer` over the library's `KeyboardAvoidingView`, keeping the same props.
4. Update `KeyboardAvoidingContainer.test.tsx` to the new implementation (render within provider; assert children render and no platform-conditional offset remains).
5. Rebuild the dev client; manually verify show/dismiss on iOS and Android edge-to-edge.
6. Rollback: revert the container + provider + dependency; the prior built-in workaround is restored.

## Open Questions

- Do we also want a keyboard toolbar (Done/Next) for the numeric reminder inputs? Deferred unless requested.
