import * as ImagePicker from "expo-image-picker";

/**
 * Wraps `expo-image-picker` gallery selection with permission handling and
 * try/catch resilience, mirroring `NotificationService`: a denied permission or
 * a failed pick returns `null` rather than throwing, so it never blocks saving
 * the task. Native-only (Android) — web is out of scope and not guarded. There
 * is intentionally no camera method: images come from the device gallery only.
 */
export class ImagePickerService {
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error(
        "[ImagePickerService] Failed to request media-library permission:",
        error,
      );
      return false;
    }
  }

  async pickFromLibrary(): Promise<string | null> {
    try {
      const granted = await this.requestPermission();
      if (!granted) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 1,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets?.[0]?.uri ?? null;
    } catch (error) {
      console.error(
        "[ImagePickerService] Failed to pick image from library:",
        error,
      );
      return null;
    }
  }
}

export const imagePickerService = new ImagePickerService();
