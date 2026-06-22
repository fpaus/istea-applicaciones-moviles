export interface Time {
  hour: number;
  minute: number;
}

export interface Project {
  id: string;
  name: string;
}

export interface Notification {
  time: Time;
  repeats: boolean;
  notificationId: string | null;
}

export interface Responsible {
  name: string;
  contactId?: string;
  phone?: string;
  email?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface Calendar {
  eventId: string | null;
}

export interface NewTask {
  title: string;
  description: string;
  notification?: Notification | null;
  parentId?: string | null;
  imageUri?: string | null;
  location?: Location | null;
  responsible?: Responsible | null;
  calendar?: Calendar | null;
}

export interface Task extends NewTask {
  id: string;
  completed: boolean;
  createdAt: number;
}
