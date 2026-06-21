## Context

Tasks are text-only. The detail view (from `task-detail-view`) is the display
surface. We add a single optional local image per task, selected from the device
gallery via `expo-image-picker` and shown via the already-installed `expo-image`.
This is the template the location/responsible/calendar changes follow: model field →
service wrapper → form capture → detail display.

## Goals / Non-Goals

**Goals**
- One optional image per task, selected from the gallery, addable/removable on create and edit.
- Display on detail view (full) and dashboard card (thumbnail).
- A resilient service wrapper consistent with `NotificationService`.

**Non-Goals**
- No camera capture (gallery only), no cloud upload, no multi-image, no in-app cropping/filters, no web picker.

## Decisions

### Domain model: `imageUri?: string | null`
Add `imageUri?: string | null` to both `Task` and `NewTask` in
`src/types/index.ts`. `null`/absent means no image. Persisted automatically by the
task store's existing `persist` middleware (no store-shape change beyond the new
field). `updateTask`'s diff/patch must carry `imageUri` so edits (set/change/remove)
round-trip.

### Service wrapper: `ImagePickerService` (mirror `NotificationService`)
New `src/services/image-picker.ts` exposes an injectable class:
- `requestPermission()` → boolean (photo-library permission).
- `pickFromLibrary()` → `string | null` (URI, or `null` on cancel/denial/failure).
There is no camera method — gallery selection only. All methods are wrapped in
try/catch and return `null` rather than throwing, so a denied permission or a failed
pick never blocks task creation — the task simply saves with no image. This mirrors
the "Resilient Fallback on Notification Rejection" decision in CONTEXT.md.

### Native-only (no web guard)
Per the decision for this feature set, these are native (Android) features. Unlike
`NotificationService`, we deliberately do NOT add a `Platform.OS !== 'web'` guard;
web is out of scope. Resilience (try/catch, permission handling) is still required.

### Form integration
`useAddTaskForm` / `useEditTaskForm` gain `imageUri` state and `pickImage()` +
`removeImage()` callbacks that delegate to `ImagePickerService` (gallery pick). The
screens stay presentational: a "Agregar imagen" / "Cambiar imagen" button that opens
the gallery, a preview, and a "Quitar imagen" button. On save, `imageUri` is
included in the create payload / update patch. Removing an image sets
`imageUri: null` (an explicit clear the patch must distinguish from "unchanged").

### Display
- `detail.tsx`: render the image with `expo-image` when `imageUri` is set.
- `CardItem.tsx`: render a small thumbnail when `imageUri` is set; absent otherwise
  (layout unaffected when there is no image).

## Risks / Trade-offs

- **Local URIs can become stale** if the OS clears cached picker files. Acceptable
  for this scope; a missing image degrades to no image (the consumer tolerates a
  broken URI by showing nothing). Note as a known limitation.
- **Permission denial**: handled by graceful `null`; the form shows the task can
  still be saved without an image.

## Migration Plan

Additive. Existing tasks have no `imageUri` (treated as no image). No data
migration. `expo-image-picker` added to dependencies.

## Open Questions

_None._ Image source is the device gallery only (no camera), per product decision.
