## 1. Header switcher hook & component

- [x] 1.1 (Red) Write a test for `useHeaderProjectSwitcher` exposing the active project name and an open/close + select flow over the project store.
- [x] 1.2 (Green) Implement `src/hooks/useHeaderProjectSwitcher.ts` (all state/logic; no primitive hooks in the component).
- [x] 1.3 Implement a presentational header switcher (title shows `currentProject.name`, tap opens the shared `ProjectPickerModal`). UI strings in Spanish.

## 2. Replace the drawer

- [x] 2.1 Convert `app/(app)/_layout.tsx` from `Drawer` to a native `Stack` with a custom header hosting the switcher on the dashboard only.
- [x] 2.2 Remove the in-drawer `ProjectSelector` placement and drawer chrome.
- [x] 2.3 Ensure the `add` screen pushes with a back affordance and no switcher.

## 3. Cleanup & docs

- [x] 3.1 Remove now-unused drawer code; drop `@react-navigation/drawer` if nothing else references it.
- [x] 3.2 Update `openspec/CONTEXT.md` routing-structure and UI sections (drawer → header switcher).
- [x] 3.3 Run the full Jest suite, `tsc --noEmit`, and lint; run `openspec validate project-header-selector --strict`.

## 4. Reusable picker, create flow & polish

- [x] 4.1 Extract a reusable presentational `ProjectPickerModal` (project list + optional inline create) with behavior passed via props; reuse it from both `ProjectSelector` and `HeaderProjectSwitcher`.
- [x] 4.2 (Red→Green) Extend `useHeaderProjectSwitcher` (delegating to `useProjectSelector`) to expose the create flow; cover create + close-cancels-create with tests.
- [x] 4.3 Add a "+ Nuevo Proyecto" affordance inside the header picker (UI in Spanish); creating activates the project and closes the picker.
- [x] 4.4 Accessibility & discoverability: label/hint on the header trigger, `accessibilityRole`/selected state on rows, and a tappable chip style for the header title.
- [x] 4.5 Re-run Jest, `tsc --noEmit`, lint and `openspec validate --strict`.
