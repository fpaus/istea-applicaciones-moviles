## Why

A task often "belongs to" a person — someone responsible for it. Users want to
pick that person from their device contacts so the task records who is accountable.
This builds on the read-only detail view.

## What Changes

- Add an optional **responsible person** to a task, chosen from the device's
  contacts via `expo-contacts`.
- The responsible can be added/removed in both the **Create** and **Edit** flows.
- The responsible is displayed read-only on the **detail view** and indicated on
  the dashboard card.
- New `ContactsService` wrapping `expo-contacts` with permission handling and
  try/catch resilience — a denied permission or a failed pick never blocks saving;
  the task persists with no responsible.
- The selected contact is **snapshotted** (name, optional phone, optional
  `contactId`) onto the task, so the task still shows the responsible even if the
  contact later changes or is deleted.
- **Native-only**: web is out of scope and not guarded.

## Capabilities

### New Capabilities
_(none)_

### Modified Capabilities
- `state-management`: the `Task`/`NewTask` model gains an optional `responsible`; the store preserves it on create and `updateTask`.
- `navigation-flow`: the create and edit forms can pick/clear a responsible contact; the detail view and card display it.

## Impact

- **Dependency**: add `expo-contacts`.
- **`src/types/index.ts`**: add `responsible?: { name: string; contactId?: string; phone?: string } | null`.
- **New service**: `src/services/contacts.ts` (`ContactsService`): request permission, present the contact picker, return a snapshot or `null`.
- **Hooks**: `useAddTaskForm` / `useEditTaskForm` gain responsible state + `pickResponsible()` / `clearResponsible()`; `updateTask` patch includes `responsible`.
- **UI**: `add.tsx`, `edit.tsx` (pick/clear + readout), `detail.tsx` (display), `CardItem.tsx` (indicator).
- **Specs**: `state-management`, `navigation-flow`.
- Spanish UI; resilience per CONTEXT.md; no logic in components.

## Non-goals

- No editing the device contact, no creating contacts, no syncing back to the
  address book, no multiple assignees (single responsible).
- No notifying or messaging the responsible (no SMS/email side-effects).
- No web support.
