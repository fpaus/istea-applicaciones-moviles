import * as ImagePicker from "expo-image-picker";
import { ImagePickerService } from "../image-picker";

const requestPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const launchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

describe("ImagePickerService", () => {
  let service: ImagePickerService;

  beforeEach(() => {
    jest.clearAllMocks();
    requestPermission.mockResolvedValue({ status: "granted", granted: true });
    launchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///mock/picked-image.jpg" }],
    });
    service = new ImagePickerService();
  });

  describe("requestPermission", () => {
    it("resolves true when the photo-library permission is granted", async () => {
      requestPermission.mockResolvedValue({ status: "granted" });
      await expect(service.requestPermission()).resolves.toBe(true);
    });

    it("resolves false when the permission is denied", async () => {
      requestPermission.mockResolvedValue({ status: "denied" });
      await expect(service.requestPermission()).resolves.toBe(false);
    });

    it("resolves false (never throws) when requesting permission fails", async () => {
      requestPermission.mockRejectedValue(new Error("boom"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(service.requestPermission()).resolves.toBe(false);

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("pickFromLibrary", () => {
    it("returns the selected asset URI on success", async () => {
      await expect(service.pickFromLibrary()).resolves.toBe(
        "file:///mock/picked-image.jpg",
      );
      expect(launchLibrary).toHaveBeenCalled();
    });

    it("returns null and never launches the gallery when permission is denied", async () => {
      requestPermission.mockResolvedValue({ status: "denied" });

      await expect(service.pickFromLibrary()).resolves.toBeNull();
      expect(launchLibrary).not.toHaveBeenCalled();
    });

    it("returns null when the user cancels the picker", async () => {
      launchLibrary.mockResolvedValue({ canceled: true, assets: null });

      await expect(service.pickFromLibrary()).resolves.toBeNull();
    });

    it("returns null (never throws) when launching the gallery fails", async () => {
      launchLibrary.mockRejectedValue(new Error("boom"));
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(service.pickFromLibrary()).resolves.toBeNull();

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("returns null when the result has no assets", async () => {
      launchLibrary.mockResolvedValue({ canceled: false, assets: [] });

      await expect(service.pickFromLibrary()).resolves.toBeNull();
    });
  });

  it("exposes no camera capture method (gallery only)", () => {
    expect(
      (service as unknown as Record<string, unknown>).pickFromCamera,
    ).toBeUndefined();
    expect(
      (service as unknown as Record<string, unknown>).launchCamera,
    ).toBeUndefined();
  });
});
