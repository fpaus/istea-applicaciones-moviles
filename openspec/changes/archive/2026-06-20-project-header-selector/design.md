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

### Header switcher reuses a shared `ProjectPickerModal`

Render a header title/button showing `currentProject.name`; tapping it opens the
project picker. Rather than reuse the whole `ProjectSelector` (which bundles a
trigger box + inline create toggle + modal and can't be opened externally), the
shared picker is extracted into a presentational `ProjectPickerModal` (project
list + highlight active + optional inline create) whose behavior arrives entirely
via props. Both `ProjectSelector` (list-only) and `HeaderProjectSwitcher`
(list + create) render it, so the picker UI has one source of truth. The
open/close + select + create logic lives in `useHeaderProjectSwitcher`, which
delegates to `useProjectSelector` so the create/select logic is also shared (per
the "no logic in components" rule).
*Alternative:* reuse the entire `ProjectSelector` component in the header —
rejected because its trigger/inline-create chrome doesn't fit a header title and
its modal isn't externally controllable. *Alternative:* a brand-new bespoke
header dropdown — rejected to avoid duplicating the picker.

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
