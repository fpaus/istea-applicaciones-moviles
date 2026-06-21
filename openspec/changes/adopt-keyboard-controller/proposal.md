## Why

The add/edit forms currently rely on React Native's built-in `KeyboardAvoidingView` (wrapped in `KeyboardAvoidingContainer`). Under Expo SDK 54's mandatory edge-to-edge mode the component is quirky on Android: it required a platform-specific `behavior`, and on dismiss it leaves a residual `paddingBottom` because RN wires `keyboardDidHide` to its change handler. We worked around both, but the workarounds are fragile and platform-conditional. `react-native-keyboard-controller` is the ecosystem-standard solution for edge-to-edge keyboard handling and removes the guesswork.

## What Changes

- Add `react-native-keyboard-controller` as a dependency and mount its `KeyboardProvider` at the app root.
- Reimplement `KeyboardAvoidingContainer` on top of the library's `KeyboardAvoidingView` (or `KeyboardAwareScrollView`), keeping the same component API so `add.tsx`/`edit.tsx` are unchanged.
- Remove the platform-conditional `behavior`/`keyboardVerticalOffset` workarounds once the library handles show/hide symmetrically on both platforms.
- Document that this requires a new dev-client build (native module — not available in stock Expo Go).

## Capabilities

### New Capabilities
- `keyboard-avoidance`: Defines how form screens keep focused inputs visible when the keyboard opens and return to a clean layout (no residual padding/background block) when it dismisses, across iOS and Android under edge-to-edge.

### Modified Capabilities
<!-- None: no existing spec defines keyboard behavior; this introduces the first. -->

## Impact

- **Dependencies**: adds `react-native-keyboard-controller` (native module → requires `expo prebuild` / new dev-client or EAS build; breaks stock Expo Go usage).
- **Code**: `src/components/ui/KeyboardAvoidingContainer.tsx` (rewrite), app root layout (`app/_layout.tsx` — add `KeyboardProvider`), existing `KeyboardAvoidingContainer.test.tsx` (revise to the new implementation).
- **Out of scope / deferred**: this is a future change; the current built-in workaround stays in place until this is implemented.
