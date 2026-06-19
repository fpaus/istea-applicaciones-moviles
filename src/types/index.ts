export interface Time {
  hour: number;
  minute: number;
}

export interface User {
  email: string;
  password?: string;
}

export interface NewReminder {
  title: string;
  description: string;
  time: Time;
  repeats: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  time: Time;
  repeats: boolean;
  notificationId: string | null;
  completed: boolean;
  createdAt: number;
}
