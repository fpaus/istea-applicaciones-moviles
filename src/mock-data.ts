import { authService, User } from "./services/auth";
import { NewReminder, remindersService } from "./services/reminders";
import { storageService } from "./services/storage";
import { Reminder } from "./types";

const MOCK_USERS: User[] = [
  { email: "john.doe@example.com", password: "password123" },
  { email: "jane.smith@example.com", password: "password123" },
  { email: "alice.johnson@example.com", password: "password123" },
  { email: "bob.williams@example.com", password: "password123" },
  { email: "charlie.brown@example.com", password: "password123" },
  { email: "diana.prince@example.com", password: "password123" },
  { email: "edward.elric@example.com", password: "password123" },
  { email: "fiona.gallagher@example.com", password: "password123" },
  { email: "george.costanza@example.com", password: "password123" },
  { email: "admin@example.com", password: "admin" },
];

export const seedMockData = async () => {
  try {
    const users = await storageService.getItem<User[]>("@auth_users_list");
    if (!users || users.length === 0) {
      for (const user of MOCK_USERS) {
        await authService.register(user);
      }
      console.log("Seeded mock users.");
    }

    const reminders = await remindersService.getReminders();
    if (!reminders || reminders.length === 0) {
      let currentReminders: Reminder[] = [];
      for (let i = 0; i < 25; i++) {
        const isCompleted = i % 3 === 0;
        const isRecurring = i % 2 === 0;

        const newReminder: NewReminder = {
          title: `Mock Task ${i + 1}`,
          description: `This is the description for mock task ${i + 1}. You can edit or complete it.`,
          time: {
            hour: Math.floor(Math.random() * 24),
            minute: Math.floor(Math.random() * 60),
          },
          repeats: isRecurring,
        };

        currentReminders = await remindersService.addReminder(
          newReminder,
          currentReminders,
        );

        if (isCompleted) {
          const addedId = currentReminders[0].id;
          currentReminders = await remindersService.markCompleted(
            addedId,
            currentReminders,
          );
        }
      }
      console.log("Seeded mock reminders.");
    }
  } catch (error) {
    console.error("Error seeding mock data:", error);
  }
};
