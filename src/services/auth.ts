import { storageService, StorageService } from './storage';

export interface User {
  email: string;
  password?: string;
}

const AUTH_KEY = '@auth_user';
const USERS_LIST_KEY = '@auth_users_list';

export class AuthService {
  constructor(private storageService: StorageService) {}

  async register(user: User): Promise<void> {
    const users = await this.storageService.getItem<User[]>(USERS_LIST_KEY) || [];
    const exists = users.find(u => u.email === user.email);
    if (exists) {
      throw new Error('User already exists');
    }
    users.push(user);
    await this.storageService.setItem(USERS_LIST_KEY, users);
  }

  async login(user: User): Promise<void> {
    const users = await this.storageService.getItem<User[]>(USERS_LIST_KEY) || [];
    const existingUser = users.find(u => u.email === user.email && u.password === user.password);
    
    if (!existingUser) {
      throw new Error('Invalid email or password');
    }

    const { password, ...userWithoutPassword } = existingUser;
    await this.storageService.setItem(AUTH_KEY, userWithoutPassword);
  }

  async logout(): Promise<void> {
    await this.storageService.removeItem(AUTH_KEY);
  }

  async getUser(): Promise<User | null> {
    return await this.storageService.getItem<User>(AUTH_KEY);
  }
}

export const authService = new AuthService(storageService);
