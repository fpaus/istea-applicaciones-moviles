## Context

`app/(app)/_layout.tsx` is currently a `Drawer` (`expo-router/drawer`) whose
drawer content is a header list plus a compact `ProjectSelector` pinned at the
bottom. The only screens are `index` (dashboard) and `add`. The dashboard already
renders `ProjectSelector` inline when no project is selected. The project switcher
is therefore the drawer's sole real purpose.

## Goals / Non-Goals

**Goals:**

- Move project switching to the header as a one-tap affordance.
- Replace the Drawer with a native stack / header for `(app)`.
- Reuse the existing `ProjectSelector` (modal/dropdown) for the switcher.
- Keep the inline first-run selector on the dashboard unchanged.

**Non-Goals:**

- Project rename/delete (separate change).
- Store/persistence changes; task CRUD changes.

## Decisions

### Header switcher reuses `ProjectSelector`

Render a header title/button showing `currentProject.name`; tapping it opens the
existing `ProjectSelector` (its modal dropdown already lists projects and handles
`selectProject`). Encapsulate the open/close + header-title logic in a custom hook
(e.g. `useHeaderProjectSwitcher`) per the "no logic in components" rule.
*Alternative:* a brand-new bespoke header dropdown — rejected to avoid duplicating
the selector that already exists and is tested.

### Drawer → native stack

Convert `(app)/_layout.tsx` to a `Stack` with a custom header (or
`headerRight`/`headerTitle` element) for the switcher. `add` stays a pushed
screen. `@react-navigation/drawer` usage is removed (dependency may be dropped
once nothing references it).

### First-run selection stays inline

When `currentProject` is null the dashboard keeps rendering the full
`ProjectSelector` inline (no header switcher needed yet), so the empty state is
unchanged.

## Risks / Trade-offs

- **[Risk] Header real estate / long project names** → truncate with ellipsis and
  keep the tap target generous.
- **[Risk] Losing the drawer removes a familiar gesture** → acceptable; the app is
  single-screen and the header switcher is more discoverable than a hidden drawer.
- **[Risk] `add` screen header** → ensure the switcher only appears on the
  dashboard, not on the push `add` screen (which has a back affordance).
