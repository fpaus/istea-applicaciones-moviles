import AsyncStorage from "@react-native-async-storage/async-storage";

export class StorageService {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(
        `[StorageService] Error getting item for key ${key}:`,
        error,
      );
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(
        `[StorageService] Error setting item for key ${key}:`,
        error,
      );
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(
        `[StorageService] Error removing item for key ${key}:`,
        error,
      );
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error(`[StorageService] Error clearing storage:`, error);
    }
  }
}

export const storageService = new StorageService();
