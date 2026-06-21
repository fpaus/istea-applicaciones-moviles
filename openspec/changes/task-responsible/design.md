## Context

Third optional attribute, same template as image/location: model field → resilient
service wrapper → form capture → detail/card display. The data source is the device
address book via `expo-contacts`.

## Goals / Non-Goals

**Goals**
- Pick one responsible person from contacts onto a task, on create and edit.
- Display read-only on the detail view; indicate on the card.
- A resilient `ContactsService` consistent with the other wrappers.

**Non-Goals**
- No contact creation/editing, no write-back to the address book, no multiple
  assignees, no messaging/notifying the person, no web support.

## Decisions

### Domain model: `responsible?: { name; contactId?; phone? } | null`
Add `responsible?: { name: string; contactId?: string; phone?: string } | null` to
`Task` and `NewTask`. `null`/absent means none. Persisted by the existing task-store
`persist`. `updateTask` patch carries `responsible`, distinguishing "cleared"
(`null`) from "unchanged".

### Snapshot, don't reference
We store a **snapshot** (name + optional phone + optional `contactId`) rather than
re-reading the contact each render. This keeps the task self-contained and
resilient: if the contact is later edited or deleted, the task still displays the
responsible it was assigned. `contactId` is kept only as a weak back-reference. This
mirrors the app's "self-contained, resilient state" posture.

### Service wrapper: `ContactsService`
New `src/services/contacts.ts`:
- `requestPermission()` → boolean.
- `pickResponsible()` → `{ name, contactId?, phone? } | null` (uses the system
  contact picker where available; falls back to a permissioned list query).
Wrapped in try/catch; returns `null` on denial/cancel/failure so picking never
blocks saving. Mirrors `NotificationService`/`ImagePickerService`.

### Native-only (no web guard)
No `Platform.OS !== 'web'` branch per the feature-set decision; resilience still
required.

### Form integration & display
`useAddTaskForm` / `useEditTaskForm` gain `responsible` state + `pickResponsible()`
and `clearResponsible()` delegating to `ContactsService`. Screens stay
presentational: "Asignar responsable" / "Cambiar responsable", a readout of the
selected name (and phone if present), and "Quitar responsable". `detail.tsx` shows
the responsible read-only; `CardItem.tsx` indicates one is assigned.

## Risks / Trade-offs

- **Snapshot can go stale** vs. the live contact. Accepted on purpose for
  resilience and self-containment; note as a known limitation (`contactId` allows a
  future "refresh from contact").
- **Contact picker availability** varies; the service falls back to a list query
  and degrades to `null` on failure.

## Migration Plan

Additive. Existing tasks have no `responsible`. `expo-contacts` added to deps.

## Open Questions

- System contact picker vs. in-app list: prefer the system picker for UX; fall back
  to an in-app permissioned list if the picker is unavailable on the target SDK.
