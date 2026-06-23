import { Task } from "../types";

/**
 * Returns all descendants (direct and indirect) of the given task ID.
 */
export function descendants(tasks: Task[], id: string): Task[] {
  const childrenMap = new Map<string, Task[]>();
  for (const t of tasks) {
    if (t.parentId) {
      const list = childrenMap.get(t.parentId) ?? [];
      list.push(t);
      childrenMap.set(t.parentId, list);
    }
  }

  const result: Task[] = [];
  const walk = (currentId: string): void => {
    const children = childrenMap.get(currentId) ?? [];
    for (const child of children) {
      result.push(child);
      walk(child.id);
    }
  };
  walk(id);
  return result;
}

/**
 * Returns all ancestors (closest first) of the given task ID up to the root.
 */
export function ancestors(tasks: Task[], id: string): Task[] {
  const taskMap = new Map<string, Task>();
  for (const t of tasks) {
    taskMap.set(t.id, t);
  }

  const result: Task[] = [];
  let current = taskMap.get(id);
  while (current?.parentId) {
    const parent = taskMap.get(current.parentId);
    if (parent) {
      result.push(parent);
      current = parent;
    } else {
      break;
    }
  }
  return result;
}

/**
 * Returns a new array of tasks where the task with the given ID and all its
 * descendants are marked as completed, and their notification IDs set to null.
 */
export function completeTask(tasks: Task[], id: string): Task[] {
  const descIds = new Set(descendants(tasks, id).map((t) => t.id));
  return tasks.map((t) => {
    if (t.id === id || descIds.has(t.id)) {
      return {
        ...t,
        completed: true,
        notification: t.notification
          ? { ...t.notification, notificationId: null }
          : null,
      };
    }
    return t;
  });
}

/**
 * Returns a new array of tasks where the task with the given ID and all its
 * ancestors are marked as active (completed = false).
 */
export function reopenTask(tasks: Task[], id: string): Task[] {
  const ancIds = new Set(ancestors(tasks, id).map((t) => t.id));
  return tasks.map((t) => {
    if (t.id === id || ancIds.has(t.id)) {
      return {
        ...t,
        completed: false,
      };
    }
    return t;
  });
}
