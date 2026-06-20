export interface Time {
  hour: number;
  minute: number;
}

export interface Project {
  id: string;
  name: string;
}

export interface NewTask {
  title: string;
  description: string;
  time: Time;
  repeats: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  time: Time;
  repeats: boolean;
  notificationId: string | null;
  completed: boolean;
  createdAt: number;
}
