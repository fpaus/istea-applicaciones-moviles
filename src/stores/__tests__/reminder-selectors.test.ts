import { selectActive, selectCompleted } from "../reminder-store";
import { Reminder } from "../../types";

function reminder(partial: Partial<Reminder> & { id: string }): Reminder {
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

describe("reminder selectors", () => {
  beforeAll(() => {
    // Freeze "now" at 10:00 so the next-upcoming wrap-around is deterministic.
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 1, 10, 0, 0));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("selectActive excludes completed and orders by next-upcoming time-of-day", () => {
    const input: Reminder[] = [
      reminder({ id: "past-9", time: { hour: 9, minute: 0 } }), // already passed → tomorrow
      reminder({ id: "soon-1030", time: { hour: 10, minute: 30 } }),
      reminder({ id: "later-11", time: { hour: 11, minute: 0 } }),
      reminder({ id: "done", time: { hour: 10, minute: 15 }, completed: true }),
    ];

    expect(selectActive(input).map((r) => r.id)).toEqual([
      "soon-1030",
      "later-11",
      "past-9",
    ]);
  });

  it("selectActive does not mutate or reorder the input array", () => {
    const input: Reminder[] = [
      reminder({ id: "a", time: { hour: 9, minute: 0 } }),
      reminder({ id: "b", time: { hour: 11, minute: 0 } }),
    ];
    const snapshot = input.map((r) => r.id);

    selectActive(input);

    expect(input.map((r) => r.id)).toEqual(snapshot);
  });

  it("selectCompleted returns only completed reminders", () => {
    const input: Reminder[] = [
      reminder({ id: "a", completed: false }),
      reminder({ id: "b", completed: true }),
      reminder({ id: "c", completed: true }),
    ];

    expect(selectCompleted(input).map((r) => r.id)).toEqual(["b", "c"]);
  });
});
