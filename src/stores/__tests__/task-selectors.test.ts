import { selectActive, selectCompleted } from "../task-store";
import { Task } from "../../types";

function task(partial: Partial<Task> & { id: string }): Task {
  return {
    title: partial.id,
    description: "",
    time: { hour: 0, minute: 0 },
    repeats: false,
    notificationId: null,
    completed: false,
    createdAt: 0,
    ...partial,
  };
}

describe("task selectors", () => {
  beforeAll(() => {
    // Freeze "now" at 10:00 so the next-upcoming wrap-around is deterministic.
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 1, 10, 0, 0));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("selectActive excludes completed and orders by next-upcoming time-of-day", () => {
    const input: Task[] = [
      task({ id: "past-9", time: { hour: 9, minute: 0 } }), // already passed → tomorrow
      task({ id: "soon-1000", time: { hour: 10, minute: 0 } }), // exact current time → today
      task({ id: "soon-1030", time: { hour: 10, minute: 30 } }),
      task({ id: "later-11", time: { hour: 11, minute: 0 } }),
      task({ id: "done", time: { hour: 10, minute: 15 }, completed: true }),
    ];

    expect(selectActive(input).map((t) => t.id)).toEqual([
      "soon-1000",
      "soon-1030",
      "later-11",
      "past-9",
    ]);
  });


  it("selectActive does not mutate or reorder the input array", () => {
    const input: Task[] = [
      task({ id: "a", time: { hour: 9, minute: 0 } }),
      task({ id: "b", time: { hour: 11, minute: 0 } }),
    ];
    const snapshot = input.map((t) => t.id);

    selectActive(input);

    expect(input.map((t) => t.id)).toEqual(snapshot);
  });

  it("selectCompleted returns only completed tasks", () => {
    const input: Task[] = [
      task({ id: "a", completed: false }),
      task({ id: "b", completed: true }),
      task({ id: "c", completed: true }),
    ];

    expect(selectCompleted(input).map((t) => t.id)).toEqual(["b", "c"]);
  });

  it("selectActive handles all comparator branch combinations", () => {
    // Current time is 10:00 (600 minutes)
    // T1: 9:00 (540, past) -> adjusted = 1980
    // T2: 9:30 (570, past) -> adjusted = 2010
    // T3: 10:30 (630, soon) -> adjusted = 630
    // T4: 11:00 (660, soon) -> adjusted = 660
    const input = [
      task({ id: "T2", time: { hour: 9, minute: 30 } }),
      task({ id: "T4", time: { hour: 11, minute: 0 } }),
      task({ id: "T1", time: { hour: 9, minute: 0 } }),
      task({ id: "T3", time: { hour: 10, minute: 30 } }),
    ];

    expect(selectActive(input).map((t) => t.id)).toEqual([
      "T3",
      "T4",
      "T1",
      "T2",
    ]);
  });
});

