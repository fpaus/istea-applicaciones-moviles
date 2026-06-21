## Why

A task is purely text today. Users want to attach a photo to a task (e.g. a
receipt, a whiteboard, a reference) so it carries visual context. This is the
first of the rich-attribute features that build on the read-only detail view.

## What Changes

- Add an optional **image attachment** to a task: pick from the device photo
  gallery via `expo-image-picker`, stored as a local URI on the task. The camera is
  not used — gallery selection only.
- Image can be added/changed/removed in both the **Create** (`add.tsx`) and
  **Edit** (`edit.tsx`) flows.
- The image is displayed (via the already-installed `expo-image`) on the
  read-only **detail view**, and as a small thumbnail on the dashboard card.
- New `ImagePickerService` wrapping `expo-image-picker` with permission handling
  and try/catch resilience (a denied permission or failed pick never blocks
  saving the task — the task persists with no image).
- **Native-only**: the image-picker module is used on device (Android); per the
  decision for this feature set, web is out of scope and not guarded.

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
- `state-management`: the `Task`/`NewTask` domain model gains an optional `imageUri`; the task store preserves it on create and `updateTask`.
- `navigation-flow`: the create and edit forms can capture/remove an image; the detail view and dashboard card display it.

## Impact

- **Dependency**: add `expo-image-picker`.
- **`src/types/index.ts`**: add `imageUri?: string | null` to `Task` and `NewTask`.
- **New service**: `src/services/image-picker.ts` (`ImagePickerService`): request photo-library permission, launch the gallery picker, return a URI or `null` on cancel/failure.
- **Hooks**: `useAddTaskForm` / `useEditTaskForm` gain image state + a `pickImage()` / `removeImage()` action; `updateTask` patch includes `imageUri`.
- **UI**: `add.tsx`, `edit.tsx` (capture + preview + remove), `detail.tsx` (display), `CardItem.tsx` (thumbnail).
- **Specs**: `state-management`, `navigation-flow`.
- Spanish UI; resilience (CONTEXT.md: failed side-effects never abort the data mutation); no logic in components.

## Non-goals

- No remote upload / cloud storage — the URI is local to the device.
- No image editing, cropping presets, or multiple images per task (single image).
- **No camera capture** — images come from the device gallery only.
- No web support for picking images.
