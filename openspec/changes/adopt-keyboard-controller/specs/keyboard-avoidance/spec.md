## ADDED Requirements

### Requirement: Focused inputs stay visible while the keyboard is open

Form screens (`add`, `edit`) SHALL keep the focused text input visible above the on-screen keyboard on both iOS and Android, including under Expo edge-to-edge mode. The behavior SHALL be provided through a shared `KeyboardAvoidingContainer` component so individual screens do not embed platform-conditional keyboard logic.

#### Scenario: Focusing an input near the bottom of the form

- **WHEN** the user taps an input that would otherwise sit behind the keyboard (e.g. the "Agregar Nueva Subtarea" fields)
- **THEN** the content lifts so the focused input and its label remain visible above the keyboard
- **AND** the user can scroll to reach any remaining inputs without dismissing the keyboard

#### Scenario: Same behavior on iOS and Android

- **WHEN** the keyboard opens on either platform
- **THEN** the focused input is kept visible without requiring screen-level platform branching

### Requirement: Layout returns clean when the keyboard dismisses

When the keyboard is dismissed, the form SHALL return to its original layout with no residual padding, offset, or background-colored block where the keyboard was.

#### Scenario: Dismissing the keyboard on Android edge-to-edge

- **WHEN** the keyboard closes after editing a field
- **THEN** the content returns to its resting position
- **AND** no leftover background-colored block remains at the bottom of the screen

### Requirement: Keyboard handling uses react-native-keyboard-controller

The app SHALL use `react-native-keyboard-controller` for keyboard avoidance, with its `KeyboardProvider` mounted at the application root so the shared container can rely on the library's synchronized show/hide handling.

#### Scenario: Provider available to all screens

- **WHEN** any screen renders the shared `KeyboardAvoidingContainer`
- **THEN** the container operates within a mounted `KeyboardProvider`
- **AND** keyboard show and hide are handled symmetrically without per-platform `behavior`/`keyboardVerticalOffset` workarounds

#### Scenario: Native dependency requires a dev build

- **WHEN** the project is run after adopting the library
- **THEN** the documentation states a new dev-client / prebuild is required because the module is native and unavailable in stock Expo Go
