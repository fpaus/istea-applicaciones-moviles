## 1. Dependency & domain model

- [ ] 1.1 Add `expo-image-picker` (`npx expo install expo-image-picker`)
- [ ] 1.2 Add `imageUri?: string | null` to `Task` and `NewTask` in `src/types/index.ts`

## 2. ImagePickerService (TDD)

- [ ] 2.1 Write `src/services/__tests__/image-picker.test.ts`: `requestPermission` resolves boolean; `pickFromLibrary` returns a URI on success and `null` on cancel/denial/thrown error (no throw escapes); no camera method exists
- [ ] 2.2 Implement `src/services/image-picker.ts` (`ImagePickerService` + exported singleton) wrapping `expo-image-picker` gallery selection (`launchImageLibraryAsync` + media-library permission) with try/catch returning `null` on failure (mirror `NotificationService` resilience; native-only, no web guard; no camera)

## 3. Store persistence (TDD)

- [ ] 3.1 Extend task-store tests: create persists `imageUri`; `updateTask` replaces it; `updateTask` can clear it to `null`; value survives the persist/merge round-trip
- [ ] 3.2 Update `task-store` create + `updateTask` patch to carry `imageUri` (clear distinguished from unchanged)

## 4. Form capture (TDD)

- [ ] 4.1 Extend `useAddTaskForm` / `useEditTaskForm` tests: `pickImage()` sets `imageUri` from the service; denial/cancel leaves it unchanged and still allows save; `removeImage()` clears it; save payload/patch includes `imageUri`
- [ ] 4.2 Implement image state + `pickImage()`/`removeImage()` in both hooks (delegating to `ImagePickerService`)
- [ ] 4.3 Add capture UI to `add.tsx` and `edit.tsx`: "Agregar/Cambiar imagen" (opens the gallery), preview, "Quitar imagen" (presentational only)

## 5. Display

- [ ] 5.1 Show the image in `app/(app)/detail.tsx` via `expo-image` when present
- [ ] 5.2 Show a thumbnail in `CardItem.tsx` when present (layout unchanged when absent)

## 6. Verification

- [ ] 6.1 `npm test`, `npx tsc --noEmit`, `npx expo lint` all clean
- [ ] 6.2 `openspec validate task-image-attachment --strict` passes
- [ ] 6.3 Manual on device: add image from the gallery, see preview, save, view on detail + card thumbnail, edit to change, edit to remove; deny permission and confirm the task still saves with no image

## 7. Documentation

- [ ] 7.1 Update `openspec/CONTEXT.md`: domain model gains `imageUri`, new `ImagePickerService`, image capture/display in features, and the local-URI staleness limitation
