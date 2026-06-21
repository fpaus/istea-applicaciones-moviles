import * as Location from "expo-location";
import { LocationService } from "../location";

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
  },
}));

const requestPermissionMock = Location.requestForegroundPermissionsAsync as jest.Mock;
const getCurrentPositionMock = Location.getCurrentPositionAsync as jest.Mock;
const getLastKnownPositionMock = Location.getLastKnownPositionAsync as jest.Mock;
const reverseGeocodeMock = Location.reverseGeocodeAsync as jest.Mock;

describe("LocationService", () => {
  let service: LocationService;

  beforeEach(() => {
    jest.clearAllMocks();
    requestPermissionMock.mockResolvedValue({ status: "granted" });
    getCurrentPositionMock.mockResolvedValue({
      coords: { latitude: 37.7749, longitude: -122.4194 },
    });
    reverseGeocodeMock.mockResolvedValue([
      { street: "Market St", city: "San Francisco" },
    ]);
    service = new LocationService();
  });

  describe("requestPermission", () => {
    it("resolves true when permission is granted", async () => {
      requestPermissionMock.mockResolvedValue({ status: "granted" });
      await expect(service.requestPermission()).resolves.toBe(true);
    });

    it("resolves false when permission is denied", async () => {
      requestPermissionMock.mockResolvedValue({ status: "denied" });
      await expect(service.requestPermission()).resolves.toBe(false);
    });

    it("resolves false when request throws an error", async () => {
      requestPermissionMock.mockRejectedValue(new Error("boom"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(service.requestPermission()).resolves.toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe("getCurrentLocation", () => {
    it("returns coordinates and label on success", async () => {
      const res = await service.getCurrentLocation(100, 100);
      expect(res).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
        label: "Market St, San Francisco",
      });
      expect(requestPermissionMock).toHaveBeenCalled();
      expect(getCurrentPositionMock).toHaveBeenCalled();
      expect(reverseGeocodeMock).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
      });
    });

    it("returns null when permission is denied", async () => {
      requestPermissionMock.mockResolvedValue({ status: "denied" });
      const res = await service.getCurrentLocation(100, 100);
      expect(res).toBeNull();
      expect(getCurrentPositionMock).not.toHaveBeenCalled();
    });

    it("returns null when getCurrentPositionAsync times out and getLastKnownPositionAsync fails/returns null", async () => {
      getCurrentPositionMock.mockReturnValue(new Promise(() => {}));
      getLastKnownPositionMock.mockResolvedValue(null);
      
      const res = await service.getCurrentLocation(5, 5);
      expect(res).toBeNull();
    });

    it("returns last known position when getCurrentPositionAsync times out", async () => {
      getCurrentPositionMock.mockReturnValue(new Promise(() => {}));
      getLastKnownPositionMock.mockResolvedValue({
        coords: { latitude: 37.7700, longitude: -122.4100 },
      });
      reverseGeocodeMock.mockResolvedValue([]);
      
      const res = await service.getCurrentLocation(5, 5);
      expect(res).toEqual({
        latitude: 37.7700,
        longitude: -122.4100,
        label: undefined,
      });
      expect(getLastKnownPositionMock).toHaveBeenCalled();
    });

    it("returns coords but null label when reverse geocode fails", async () => {
      reverseGeocodeMock.mockRejectedValue(new Error("geo error"));
      const res = await service.getCurrentLocation(100, 100);
      expect(res).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
        label: undefined,
      });
    });

    it("returns null when getCurrentPositionAsync throws", async () => {
      getCurrentPositionMock.mockRejectedValue(new Error("gps crash"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const res = await service.getCurrentLocation(100, 100);
      expect(res).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});
