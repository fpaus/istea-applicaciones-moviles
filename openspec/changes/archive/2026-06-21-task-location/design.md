## Context

Following `task-image-attachment`, this adds a second optional attribute — the
device's current location — using the same template: model field → resilient
service wrapper → form capture → detail/card display.

## Goals / Non-Goals

**Goals**
- Capture the device's current coordinates onto a task, on create and edit.
- Display them read-only on the detail view; indicate presence on the card.
- A resilient `LocationService` consistent with the other service wrappers.

**Non-Goals**
- No map UI, no place search, no geofencing/location-triggered reminders, no
  required reverse-geocoding, no web support.

## Decisions

### Domain model: `location?: { latitude; longitude; label? } | null`
Add `location?: { latitude: number; longitude: number; label?: string } | null` to
`Task` and `NewTask`. `null`/absent means no location. Persisted by the existing
task-store `persist` middleware. `updateTask` patch must carry `location`,
distinguishing "cleared" (`null`) from "unchanged".

### Service wrapper: `LocationService`
New `src/services/location.ts`:
- `requestPermission()` → boolean (foreground location).
- `getCurrentLocation()` → `{ latitude, longitude } | null`.
Both wrapped in try/catch; return `null` on denial/timeout/failure so capture never
blocks saving the task. Mirrors `NotificationService`/`ImagePickerService`. Use a
sensible accuracy/timeout so a slow fix degrades to `null` rather than hanging.

### Optional `label`
`label` is best-effort. v1 may leave it undefined (show coordinates) or fill it via
`expo-location` reverse geocoding when readily available; a failed/empty reverse
geocode must NOT block capture — fall back to coordinates only.

### Native-only (no web guard)
Per the feature-set decision, no `Platform.OS !== 'web'` branch; resilience still
required.

### Form integration & display
`useAddTaskForm` / `useEditTaskForm` gain `location` state + `captureLocation()` and
`clearLocation()` callbacks delegating to `LocationService`. Screens stay
presentational: "Usar ubicación actual" button, a readout of the captured
coordinates/label, and a "Quitar ubicación" button. `detail.tsx` shows the location
read-only; `CardItem.tsx` shows a small location indicator when present.

## Risks / Trade-offs

- **GPS can be slow or unavailable** indoors. Mitigated by timeout → `null` and a
  clear Spanish message; the task still saves.
- **Coordinates without a map** are low-fidelity. Acceptable for scope; a map/
  reverse-geocode can come later.

## Migration Plan

Additive. Existing tasks have no `location`. `expo-location` added to dependencies.

## Open Questions

- Reverse-geocode to a human-readable `label` in v1, or show raw coordinates?
  Default: attempt best-effort label, fall back to coordinates.
