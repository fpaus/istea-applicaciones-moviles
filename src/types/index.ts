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
  /** Local device URI for a single attached image. Null/absent means no image. */
  imageUri?: string | null;
  location?: { latitude: number; longitude: number; label?: string } | null;
  responsible?: { name: string; contactId?: string; phone?: string; email?: string } | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  notification?: { time: Time; repeats: boolean; notificationId: string | null } | null;
  completed: boolean;
  createdAt: number;
  parentId?: string | null;
  /** Local device URI for a single attached image. Null/absent means no image. */
  imageUri?: string | null;
  location?: { latitude: number; longitude: number; label?: string } | null;
  responsible?: { name: string; contactId?: string; phone?: string; email?: string } | null;
}
