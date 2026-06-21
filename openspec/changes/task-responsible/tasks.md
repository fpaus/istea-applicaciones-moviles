## 1. Dependency & domain model

- [ ] 1.1 Add `expo-contacts` (`npx expo install expo-contacts`)
- [ ] 1.2 Add `responsible?: { name: string; contactId?: string; phone?: string } | null` to `Task` and `NewTask` in `src/types/index.ts`

## 2. ContactsService (TDD)

- [ ] 2.1 Write `src/services/__tests__/contacts.test.ts`: `requestPermission` resolves boolean; `pickResponsible` returns a `{ name, contactId?, phone? }` snapshot on success and `null` on denial/cancel/thrown error (no throw escapes)
- [ ] 2.2 Implement `src/services/contacts.ts` (`ContactsService` + singleton) wrapping `expo-contacts` with try/catch returning `null` on failure (native-only, no web guard); prefer system picker, fall back to a permissioned list query

## 3. Store persistence (TDD)

- [ ] 3.1 Extend task-store tests: create persists `responsible`; `updateTask` can clear it to `null`; snapshot survives the persist/merge round-trip
- [ ] 3.2 Update `task-store` create + `updateTask` patch to carry `responsible` (clear distinguished from unchanged)

## 4. Form capture (TDD)

- [ ] 4.1 Extend `useAddTaskForm` / `useEditTaskForm` tests: `pickResponsible()` sets `responsible` from the service; denial/cancel leaves it unchanged and still allows save; `clearResponsible()` clears it; save payload/patch includes `responsible`
- [ ] 4.2 Implement responsible state + `pickResponsible()`/`clearResponsible()` in both hooks (delegating to `ContactsService`)
- [ ] 4.3 Add UI to `add.tsx` and `edit.tsx`: "Asignar/Cambiar responsable", name/phone readout, "Quitar responsable" (presentational only)

## 5. Display

- [ ] 5.1 Show the responsible read-only in `app/(app)/detail.tsx` when present
- [ ] 5.2 Show a responsible indicator in `CardItem.tsx` when present (layout unchanged when absent)

## 6. Verification

- [ ] 6.1 `npm test`, `npx tsc --noEmit`, `npx expo lint` all clean
- [ ] 6.2 `openspec validate task-responsible --strict` passes
- [ ] 6.3 Manual on device: pick responsible, see readout, save, view on detail + card; edit to change/clear; deny permission and confirm the task still saves with no responsible

## 7. Documentation

- [ ] 7.1 Update `openspec/CONTEXT.md`: domain model gains `responsible`, new `ContactsService`, the snapshot-not-reference decision (resilient to contact deletion), and pick/display in features
