## 1. Header switcher hook & component

- [ ] 1.1 (Red) Write a test for `useHeaderProjectSwitcher` exposing the active project name and an open/close + select flow over the project store.
- [ ] 1.2 (Green) Implement `src/hooks/useHeaderProjectSwitcher.ts` (all state/logic; no primitive hooks in the component).
- [ ] 1.3 Implement a presentational header switcher (title shows `currentProject.name`, tap opens the existing `ProjectSelector` modal). UI strings in Spanish.

## 2. Replace the drawer

- [ ] 2.1 Convert `app/(app)/_layout.tsx` from `Drawer` to a native `Stack` with a custom header hosting the switcher on the dashboard only.
- [ ] 2.2 Remove the in-drawer `ProjectSelector` placement and drawer chrome.
- [ ] 2.3 Ensure the `add` screen pushes with a back affordance and no switcher.

## 3. Cleanup & docs

- [ ] 3.1 Remove now-unused drawer code; drop `@react-navigation/drawer` if nothing else references it.
- [ ] 3.2 Update `openspec/CONTEXT.md` routing-structure and UI sections (drawer → header switcher).
- [ ] 3.3 Run the full Jest suite, `tsc --noEmit`, and lint; run `openspec validate project-header-selector --strict`.
