## Why

The app is effectively a single screen (the task dashboard), yet it still ships a
Drawer navigator whose only real content is the project switcher pinned at the
bottom. In a multi-project workflow, switching projects should be a one-tap
action from the header, not a drawer open + scroll. Removing the drawer
simplifies the navigation stack and frees the project switcher from the cramped
in-drawer placement.

## What Changes

- Replace the **Drawer** navigator in `app/(app)/_layout.tsx` with a header-based
  navigation (native stack / header only).
- Show the **active project name in the header**; tapping it opens the project
  switcher (the existing `ProjectSelector`, presented as a dropdown/modal).
- **Remove** the in-drawer `ProjectSelector` and the drawer chrome.
- The dashboard keeps rendering `ProjectSelector` inline when no project is
  selected (unchanged from current behavior).
- **BREAKING (internal):** drop `@react-navigation/drawer` usage from `(app)`;
  the header switcher replaces it.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `navigation-flow`: project switching moves from an in-drawer component to a
  header affordance; the `(app)` route group is no longer a drawer.

## Non-goals

- Project **rename/delete** (tracked separately in `project-edit-delete`).
- Any change to task CRUD, the stores, or persistence.
- Visual redesign beyond relocating the switcher to the header.

## Impact

- **Code:** `app/(app)/_layout.tsx` (drawer → header), a header switcher
  component/hook, removal of in-drawer `ProjectSelector` usage.
- **Deps:** `@react-navigation/drawer` may become unused.
- **Hooks rule:** any new header logic lives in a custom hook (no primitive hooks
  in components); UI strings in Spanish — per `openspec/CONTEXT.md`.
- **Docs:** update `openspec/CONTEXT.md` routing/UI sections in this change.
