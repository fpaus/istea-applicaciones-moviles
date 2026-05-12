export interface Time {
  hour: number;
  minute: number;
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
