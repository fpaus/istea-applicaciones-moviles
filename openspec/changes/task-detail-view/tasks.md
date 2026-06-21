## 1. View-model hook (TDD)

- [ ] 1.1 Write `src/hooks/__tests__/useTaskDetail.test.tsx`: selects a task by `projectId`+`taskId`, returns `null`/not-found when absent, derives direct subtasks and direct-children progress, and exposes `goToEdit()` / `openSubtask(id)` navigation callbacks
- [ ] 1.2 Implement `src/hooks/useTaskDetail.ts` to pass the tests (one hook per file; no logic leaks into the screen)

## 2. CardItem tappable body (TDD)

- [ ] 2.1 Extend `CardItem` tests: tapping the card body invokes `onOpen(id)`; tapping "Editar"/"Eliminar" invokes their handlers and does NOT invoke `onOpen`; with `onOpen` undefined the card behaves as before
- [ ] 2.2 Add an optional `onOpen?: (id: string) => void` to `CardItem` and make the body a touch target without breaking the existing button targets

## 3. Detail screen + route

- [ ] 3.1 Create `app/(app)/detail.tsx`: presentational read-only screen consuming `useTaskDetail`, showing title/description/reminder, direct-children progress, read-only subtask list, and an "Editar" button; renders "Tarea no encontrada" when the task is missing
- [ ] 3.2 Register the `detail` screen in `app/(app)/_layout.tsx` (Spanish title "Detalle de Tarea", back affordance "Volver")
- [ ] 3.3 Wire the dashboard (`app/(app)/index.tsx`) to pass `onOpen` to `CardItem`, navigating to `/detail` with `projectId`+`taskId`

## 4. Verification

- [ ] 4.1 `npm test` — all tests pass (incl. new `useTaskDetail` and `CardItem` tests)
- [ ] 4.2 `npx tsc --noEmit` clean and `npx expo lint` clean
- [ ] 4.3 `openspec validate task-detail-view --strict` passes
- [ ] 4.4 Manual: tap a task → read-only detail; "Editar" → edit; tap a subtask → its detail; card buttons still work without opening detail

## 5. Documentation

- [ ] 5.1 Update `openspec/CONTEXT.md`: add the read-only detail screen to the routing structure and features (distinct from the editing-oriented `edit.tsx`)
