## 1. Dependency & domain model

- [x] 1.1 Add `expo-location` (`npx expo install expo-location`)
- [x] 1.2 Add `location?: { latitude: number; longitude: number; label?: string } | null` to `Task` and `NewTask` in `src/types/index.ts`

## 2. LocationService (TDD)

- [x] 2.1 Write `src/services/__tests__/location.test.ts`: `requestPermission` resolves boolean; `getCurrentLocation` returns coordinates on success and `null` on denial/timeout/thrown error (no throw escapes)
- [x] 2.2 Implement `src/services/location.ts` (`LocationService` + singleton) wrapping `expo-location` with try/catch and a timeout, returning `null` on failure (native-only, no web guard); best-effort optional `label`

## 3. Store persistence (TDD)

- [x] 3.1 Extend task-store tests: create persists `location`; `updateTask` can clear it to `null`; value survives the persist/merge round-trip
- [x] 3.2 Update `task-store` create + `updateTask` patch to carry `location` (clear distinguished from unchanged)

## 4. Form capture (TDD)

- [x] 4.1 Extend `useAddTaskForm` / `useEditTaskForm` tests: `captureLocation()` sets `location` from the service; denial/failure leaves it unchanged and still allows save; `clearLocation()` clears it; save payload/patch includes `location`
- [x] 4.2 Implement location state + `captureLocation()`/`clearLocation()` in both hooks (delegating to `LocationService`)
- [x] 4.3 Add capture UI to `add.tsx` and `edit.tsx`: "Usar ubicación actual", coordinate/label readout, "Quitar ubicación" (presentational only)

## 5. Display

- [x] 5.1 Show the location read-only in `app/(app)/detail.tsx` when present
- [x] 5.2 Show a location indicator in `CardItem.tsx` when present (layout unchanged when absent)

## 6. Verification

- [x] 6.1 `npm test`, `npx tsc --noEmit`, `npx expo lint` all clean
- [x] 6.2 `openspec validate task-location --strict` passes
- [x] 6.3 Manual on device: capture location, see readout, save, view on detail + card; edit to clear; deny permission and confirm the task still saves with no location

## 7. Documentation

- [x] 7.1 Update `openspec/CONTEXT.md`: domain model gains `location`, new `LocationService`, capture/display in features, and the no-map/coordinates-only limitation
