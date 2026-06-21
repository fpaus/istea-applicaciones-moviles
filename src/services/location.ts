import * as Location from "expo-location";

/**
 * Wraps `expo-location` with permission checking, time-bounded GPS retrieval,
 * best-effort reverse-geocoding to resolve a readable label, and try/catch resilience.
 * A denied permission or a timeout returns `null` rather than throwing, so it
 * never blocks saving the task. Native-only (Android) — web is out of scope.
 */
export class LocationService {
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("[LocationService] Failed to request permissions:", error);
      return false;
    }
  }

  async getCurrentLocation(
    timeoutMs: number = 5000,
    geocodeTimeoutMs: number = 2000,
  ): Promise<{
    latitude: number;
    longitude: number;
    label?: string;
  } | null> {
    try {
      const granted = await this.requestPermission();
      if (!granted) {
        return null;
      }

      // Limit location wait time to avoid UI hangs
      const positionPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), timeoutMs),
      );

      let location = await Promise.race([positionPromise, timeoutPromise]);
      if (!location) {
        console.warn("[LocationService] GPS retrieval timed out. Trying last known location...");
        try {
          location = await Location.getLastKnownPositionAsync({});
        } catch (err) {
          console.warn("[LocationService] Failed to retrieve last known position:", err);
        }
      }

      if (!location) {
        return null;
      }

      const { latitude, longitude } = location.coords;

      // Best-effort reverse geocode for a readable address label
      let label: string | undefined;
      try {
        const geocodePromise = Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        const geocodeTimeout = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), geocodeTimeoutMs),
        );

        const geocodeResult = await Promise.race([
          geocodePromise,
          geocodeTimeout,
        ]);

        if (geocodeResult && geocodeResult.length > 0) {
          const address = geocodeResult[0];
          const parts = [
            address.street,
            address.name,
            address.city,
            address.subregion,
            address.region,
          ].filter(
            (p): p is string => typeof p === "string" && p.trim() !== "",
          );

          if (parts.length > 0) {
            const uniqueParts = Array.from(new Set(parts));
            label = uniqueParts.slice(0, 2).join(", ");
          }
        }
      } catch (err) {
        console.warn("[LocationService] Geocoding best-effort failed:", err);
      }

      return { latitude, longitude, label };
    } catch (error) {
      console.error("[LocationService] Failed to get location:", error);
      return null;
    }
  }
}

export const locationService = new LocationService();
