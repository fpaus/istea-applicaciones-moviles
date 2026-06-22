import * as ExpoCalendar from "expo-calendar";
import { CalendarService } from "../calendar";

const requestPerms = ExpoCalendar.requestCalendarPermissionsAsync as jest.Mock;
const getCalendars = ExpoCalendar.getCalendarsAsync as jest.Mock;
const createCalendar = ExpoCalendar.createCalendarAsync as jest.Mock;
const createEvent = ExpoCalendar.createEventAsync as jest.Mock;
const updateEvent = ExpoCalendar.updateEventAsync as jest.Mock;
const deleteEvent = ExpoCalendar.deleteEventAsync as jest.Mock;
const createAttendee = ExpoCalendar.createAttendeeAsync as jest.Mock;

describe("CalendarService", () => {
  let service: CalendarService;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 1, 10, 0, 0)); // 10:00
  });

  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    jest.clearAllMocks();
    requestPerms.mockResolvedValue({ status: "granted" });
    getCalendars.mockResolvedValue([
      {
        id: "cal-1",
        title: "Default",
        allowsModifications: true,
        source: { name: "Local", type: "local", isLocalAccount: true },
      },
    ]);
    createEvent.mockResolvedValue("event-1");
    service = new CalendarService();
  });

  describe("requestPermission", () => {
    it("returns true when permission is granted", async () => {
      const result = await service.requestPermission();
      expect(result).toBe(true);
      expect(requestPerms).toHaveBeenCalled();
    });

    it("returns false when permission is denied", async () => {
      requestPerms.mockResolvedValue({ status: "denied" });
      const result = await service.requestPermission();
      expect(result).toBe(false);
    });

    it("returns false when requestCalendarPermissionsAsync throws", async () => {
      requestPerms.mockRejectedValue(new Error("boom"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const result = await service.requestPermission();
      expect(result).toBe(false);
      errorSpy.mockRestore();
    });
  });

  describe("getWritableCalendarId", () => {
    it("returns the id of the first writable calendar", async () => {
      const id = await service.getWritableCalendarId();
      expect(id).toBe("cal-1");
    });

    it("creates a new calendar if none is writable", async () => {
      getCalendars.mockResolvedValue([
        { id: "cal-ro", title: "ReadOnly", allowsModifications: false, source: {} },
      ]);
      createCalendar.mockResolvedValue("cal-new");

      const id = await service.getWritableCalendarId();
      expect(id).toBe("cal-new");
      expect(createCalendar).toHaveBeenCalled();
    });

    it("returns null if getCalendarsAsync throws", async () => {
      getCalendars.mockRejectedValue(new Error("fail"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const id = await service.getWritableCalendarId();
      expect(id).toBeNull();
      errorSpy.mockRestore();
    });
  });

  describe("createEvent", () => {
    it("returns an event id on success", async () => {
      const id = await service.createEvent("My Task", "notes", { hour: 14, minute: 30 }, false);
      expect(id).toBe("event-1");
      expect(createEvent).toHaveBeenCalledWith(
        "cal-1",
        expect.objectContaining({ title: "My Task" }),
      );
    });

    it("passes a daily recurrenceRule when repeats is true", async () => {
      await service.createEvent("Daily task", "", { hour: 9, minute: 0 }, true);

      const eventData = createEvent.mock.calls[0][1];
      expect(eventData.recurrenceRule).toEqual(
        expect.objectContaining({ frequency: "daily" }),
      );
    });

    it("passes no recurrenceRule when repeats is false", async () => {
      await service.createEvent("One-shot", "", { hour: 14, minute: 0 }, false);

      const eventData = createEvent.mock.calls[0][1];
      expect(eventData.recurrenceRule).toBeUndefined();
    });

    it("returns null when permission is denied", async () => {
      requestPerms.mockResolvedValue({ status: "denied" });
      const id = await service.createEvent("Task", "", { hour: 9, minute: 0 }, false);
      expect(id).toBeNull();
      expect(createEvent).not.toHaveBeenCalled();
    });

    it("returns null when createEventAsync throws", async () => {
      createEvent.mockRejectedValue(new Error("calendar fail"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const id = await service.createEvent("Task", "", { hour: 9, minute: 0 }, false);
      expect(id).toBeNull();
      errorSpy.mockRestore();
    });

    it("calls createAttendeeAsync when responsible has an email", async () => {
      const responsible = { name: "Juan", email: "juan@test.com" };
      await service.createEvent("Task", "", { hour: 9, minute: 0 }, false, responsible);

      expect(createAttendee).toHaveBeenCalledWith(
        "event-1",
        expect.objectContaining({
          name: "Juan",
          email: "juan@test.com",
        }),
      );
    });

    it("does not call createAttendeeAsync when responsible has no email", async () => {
      const responsible = { name: "Maria" };
      await service.createEvent("Task", "", { hour: 9, minute: 0 }, false, responsible);

      expect(createAttendee).not.toHaveBeenCalled();
    });

    it("swallows createAttendeeAsync failure and still returns the event id", async () => {
      createAttendee.mockRejectedValue(new Error("attendee fail"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const responsible = { name: "Juan", email: "juan@test.com" };

      const id = await service.createEvent("Task", "", { hour: 9, minute: 0 }, false, responsible);
      expect(id).toBe("event-1");
      expect(errorSpy).toHaveBeenCalledWith(
        "[CalendarService] Failed to add attendee:",
        expect.any(Error),
      );
      errorSpy.mockRestore();
    });
  });

  describe("updateEvent", () => {
    it("updates an existing event", async () => {
      await service.updateEvent("event-1", "Updated", "new notes", { hour: 15, minute: 0 }, false);
      expect(updateEvent).toHaveBeenCalledWith(
        "event-1",
        expect.objectContaining({ title: "Updated" }),
      );
    });

    it("swallows failures without throwing", async () => {
      updateEvent.mockRejectedValue(new Error("fail"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        service.updateEvent("event-1", "Title", "", { hour: 9, minute: 0 }, false),
      ).resolves.toBeUndefined();

      errorSpy.mockRestore();
    });
  });

  describe("deleteEvent", () => {
    it("deletes an existing event", async () => {
      await service.deleteEvent("event-1");
      expect(deleteEvent).toHaveBeenCalledWith("event-1");
    });

    it("swallows failures without throwing", async () => {
      deleteEvent.mockRejectedValue(new Error("fail"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(service.deleteEvent("event-1")).resolves.toBeUndefined();

      errorSpy.mockRestore();
    });
  });
});
