## Why

Some tasks are tied to a place ("pick up keys here", "meeting at this spot").
Users want to stamp a task with the device's current location so they can recall
where it belongs. This builds on the read-only detail view.

## What Changes

- Add an optional **location** to a task, captured from the device's current GPS
  position via `expo-location` ("Usar ubicación actual").
- Location can be added/removed in both the **Create** and **Edit** flows.
- The location is displayed read-only on the **detail view** and indicated on the
  dashboard card.
- New `LocationService` wrapping `expo-location` with permission handling and
  try/catch resilience — a denied permission or a failed fix never blocks saving;
  the task persists with no location.
- **Native-only**: web is out of scope and not guarded.

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
- `state-management`: the `Task`/`NewTask` model gains an optional `location`; the store preserves it on create and `updateTask`.
- `navigation-flow`: the create and edit forms can capture/clear the current location; the detail view and card display it.

## Impact

- **Dependency**: add `expo-location`.
- **`src/types/index.ts`**: add `location?: { latitude: number; longitude: number; label?: string } | null`.
- **New service**: `src/services/location.ts` (`LocationService`): request permission, read current position, return coordinates or `null`.
- **Hooks**: `useAddTaskForm` / `useEditTaskForm` gain location state + `captureLocation()` / `clearLocation()`; `updateTask` patch includes `location`.
- **UI**: `add.tsx`, `edit.tsx` (capture/clear + readout), `detail.tsx` (display), `CardItem.tsx` (indicator).
- **Specs**: `state-management`, `navigation-flow`.
- Spanish UI; resilience per CONTEXT.md; no logic in components.

## Non-goals

- No map rendering, geocoding to street addresses, place search, or geofenced
  reminders — just the captured coordinates (with an optional label).
- No reverse-geocoding dependency; `label` is best-effort/optional.
- No web support.
