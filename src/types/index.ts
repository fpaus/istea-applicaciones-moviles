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
  notification?: { time: Time; repeats: boolean; notificationId: string | null } | null;
  parentId?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  notification?: { time: Time; repeats: boolean; notificationId: string | null } | null;
  completed: boolean;
  createdAt: number;
  parentId?: string | null;
}
