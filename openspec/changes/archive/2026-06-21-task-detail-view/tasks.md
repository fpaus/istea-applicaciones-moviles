## 1. View-model hook (TDD)

- [x] 1.1 Write `src/hooks/__tests__/useTaskDetail.test.tsx`: selects a task by `projectId`+`taskId`, returns `null`/not-found when absent, derives direct subtasks and direct-children progress, and exposes `goToEdit()` / `openSubtask(id)` navigation callbacks
- [x] 1.2 Implement `src/hooks/useTaskDetail.ts` to pass the tests (one hook per file; no logic leaks into the screen)

## 2. CardItem tappable body (TDD)

- [x] 2.1 Extend `CardItem` tests: tapping the card body invokes `onOpen(id)`; tapping "Editar"/"Eliminar" invokes their handlers and does NOT invoke `onOpen`; with `onOpen` undefined the card behaves as before
- [x] 2.2 Add an optional `onOpen?: (id: string) => void` to `CardItem` and make the body a touch target without breaking the existing button targets

## 3. Detail screen + route

- [x] 3.1 Create `app/(app)/detail.tsx`: presentational read-only screen consuming `useTaskDetail`, showing title/description/reminder, direct-children progress, read-only subtask list, and an "Editar" button; renders "Tarea no encontrada" when the task is missing
- [x] 3.2 Register the `detail` screen in `app/(app)/_layout.tsx` (Spanish title "Detalle de Tarea", back affordance "Volver")
- [x] 3.3 Wire the dashboard (`app/(app)/index.tsx`) to pass `onOpen` to `CardItem`, navigating to `/detail` with `projectId`+`taskId`
- [x] 3.4 Add a completion toggle to each subtask row in the detail view (wired to `useTaskCompletion`, applying the cascade/invariant), tappable elsewhere to open the subtask; covered by `app/(app)/__tests__/detail.test.tsx`

## 4. Verification

- [x] 4.1 `npm test` — all tests pass (incl. new `useTaskDetail`, `CardItem`, and `detail` screen tests) — 166/166 across 22 suites
- [x] 4.2 `npx tsc --noEmit` clean and `npx expo lint` clean
- [x] 4.3 `openspec validate task-detail-view --strict` passes
- [x] 4.4 Manual: tap a task → detail; mark a subtask done from detail; "Editar" → edit; tap a subtask → its detail; card buttons still work without opening detail _(verified on device by user)_

## 5. Documentation

- [x] 5.1 Update `openspec/CONTEXT.md`: add the read-only detail screen to the routing structure and features (distinct from the editing-oriented `edit.tsx`), including subtask completion from the detail view

## 6. UX follow-up (out of spec scope — opportunistic)

- [x] 6.1 Fix forms hidden behind the on-screen keyboard: wrap `add.tsx` and `edit.tsx` in `KeyboardAvoidingView` with header-aware `keyboardVerticalOffset` (`useHeaderHeight`) and `keyboardShouldPersistTaps="handled"`. _Not part of the navigation-flow spec; recorded here for traceability._
- [x] 6.2 Manual: open the keyboard on add/edit and confirm the focused field stays visible, and that dismissing the keyboard leaves no residual background block _(verified on device by user)_
