import * as ExpoCalendar from "expo-calendar";
import { Platform } from "react-native";
import { Time } from "../types";

interface ResponsibleInfo {
  name: string;
  email?: string;
}

/**
 * Wraps `expo-calendar` with try/catch resilience, modeled on
 * `NotificationService`. All public methods swallow/log errors
 * so a calendar failure never aborts or corrupts the task mutation.
 *
 * Native-only: no web guard (per CONTEXT.md).
 */
export class CalendarService {
  async requestPermission(): Promise<boolean> {
    try {
      const { status } =
        await ExpoCalendar.requestCalendarPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error(
        "[CalendarService] Failed to request calendar permission:",
        error,
      );
      return false;
    }
  }

  async getWritableCalendarId(): Promise<string | null> {
    try {
      const calendars = await ExpoCalendar.getCalendarsAsync(
        ExpoCalendar.EntityTypes.EVENT,
      );
      const writable = calendars.find((c) => c.allowsModifications);
      if (writable) return writable.id;

      // No writable calendar found — create a dedicated one.
      const newId = await ExpoCalendar.createCalendarAsync({
        title: "Recurring Reminders",
        color: "#4F46E5",
        entityType: ExpoCalendar.EntityTypes.EVENT,
        source:
          Platform.OS === "ios"
            ? calendars[0]?.source
            : {
                isLocalAccount: true,
                name: "Recurring Reminders",
                type: "local",
              },
        name: "recurring-reminders",
      });
      return newId;
    } catch (error) {
      console.error(
        "[CalendarService] Failed to resolve writable calendar:",
        error,
      );
      return null;
    }
  }

  async createEvent(
    title: string,
    notes: string,
    time: Time,
    repeats: boolean,
    responsible?: ResponsibleInfo | null,
  ): Promise<string | null> {
    try {
      const granted = await this.requestPermission();
      if (!granted) return null;

      const calendarId = await this.getWritableCalendarId();
      if (!calendarId) return null;

      const startDate = new Date();
      startDate.setHours(time.hour, time.minute, 0, 0);
      if (startDate <= new Date()) {
        startDate.setDate(startDate.getDate() + 1);
      }

      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

      const eventData: Omit<
        Partial<ExpoCalendar.Event>,
        "id" | "organizer"
      > = {
        title,
        notes,
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        allDay: false,
      };

      if (repeats) {
        eventData.recurrenceRule = {
          frequency: ExpoCalendar.Frequency.DAILY,
        };
      }

      const eventId = await ExpoCalendar.createEventAsync(
        calendarId,
        eventData,
      );

      // Add the responsible as an attendee if they have an email.
      if (responsible?.email) {
        try {
          await ExpoCalendar.createAttendeeAsync(eventId, {
            name: responsible.name,
            email: responsible.email,
            role: ExpoCalendar.AttendeeRole.REQUIRED,
            status: ExpoCalendar.AttendeeStatus.INVITED,
            type: ExpoCalendar.AttendeeType.REQUIRED,
          });
        } catch (attendeeError) {
          // Swallow: iOS doesn't support createAttendeeAsync.
          console.error(
            "[CalendarService] Failed to add attendee:",
            attendeeError,
          );
        }
      }

      return eventId;
    } catch (error) {
      console.error(
        "[CalendarService] Failed to create calendar event:",
        error,
      );
      return null;
    }
  }

  async updateEvent(
    eventId: string,
    title: string,
    notes: string,
    time: Time,
    repeats: boolean,
    responsible?: ResponsibleInfo | null,
  ): Promise<void> {
    try {
      const startDate = new Date();
      startDate.setHours(time.hour, time.minute, 0, 0);
      if (startDate <= new Date()) {
        startDate.setDate(startDate.getDate() + 1);
      }

      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

      const eventData: Omit<Partial<ExpoCalendar.Event>, "id"> = {
        title,
        notes,
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        allDay: false,
      };

      if (repeats) {
        eventData.recurrenceRule = {
          frequency: ExpoCalendar.Frequency.DAILY,
        };
      } else {
        eventData.recurrenceRule = null;
      }

      await ExpoCalendar.updateEventAsync(eventId, eventData);
    } catch (error) {
      console.error(
        "[CalendarService] Failed to update calendar event:",
        error,
      );
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await ExpoCalendar.deleteEventAsync(eventId);
    } catch (error) {
      console.error(
        "[CalendarService] Failed to delete calendar event:",
        error,
      );
    }
  }
}

export const calendarService = new CalendarService();
