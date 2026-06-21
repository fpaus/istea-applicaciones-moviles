import * as Contacts from "expo-contacts";
import { ContactsService } from "../contacts";

jest.mock("expo-contacts", () => ({
  requestPermissionsAsync: jest.fn(),
  presentContactPickerAsync: jest.fn(),
}));

const requestPermissionsMock = Contacts.requestPermissionsAsync as jest.Mock;
const presentContactPickerMock = Contacts.presentContactPickerAsync as jest.Mock;

describe("ContactsService", () => {
  let service: ContactsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ContactsService();
  });

  describe("requestPermission", () => {
    it("resolves true when permission is granted", async () => {
      requestPermissionsMock.mockResolvedValue({ status: "granted" });
      await expect(service.requestPermission()).resolves.toBe(true);
    });

    it("resolves false when permission is denied", async () => {
      requestPermissionsMock.mockResolvedValue({ status: "denied" });
      await expect(service.requestPermission()).resolves.toBe(false);
    });

    it("resolves false when request throws an error", async () => {
      requestPermissionsMock.mockRejectedValue(new Error("boom"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(service.requestPermission()).resolves.toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe("pickResponsible", () => {
    it("returns null when permission is denied", async () => {
      requestPermissionsMock.mockResolvedValue({ status: "denied" });
      const res = await service.pickResponsible();
      expect(res).toBeNull();
    });

    it("returns null when picker is canceled", async () => {
      requestPermissionsMock.mockResolvedValue({ status: "granted" });
      presentContactPickerMock.mockResolvedValue(null);
      const res = await service.pickResponsible();
      expect(res).toBeNull();
    });

    it("returns snapshot when picker returns contact with phone number and email", async () => {
      requestPermissionsMock.mockResolvedValue({ status: "granted" });
      presentContactPickerMock.mockResolvedValue({
        id: "c1",
        name: "Juan Perez",
        phoneNumbers: [
          { label: "mobile", number: "123456" }
        ],
        emails: [
          { label: "work", email: "juan@example.com" }
        ],
      });
      const res = await service.pickResponsible();
      expect(res).toEqual({
        name: "Juan Perez",
        contactId: "c1",
        phone: "123456",
        email: "juan@example.com",
      });
    });

    it("returns snapshot without phone when contact has no phone number", async () => {
      requestPermissionsMock.mockResolvedValue({ status: "granted" });
      presentContactPickerMock.mockResolvedValue({
        id: "c2",
        name: "Maria Lopez",
      });
      const res = await service.pickResponsible();
      expect(res).toEqual({
        name: "Maria Lopez",
        contactId: "c2",
        phone: undefined,
        email: undefined,
      });
    });

    it("prefers primary phone number and primary email if available", async () => {
      requestPermissionsMock.mockResolvedValue({ status: "granted" });
      presentContactPickerMock.mockResolvedValue({
        id: "c3",
        name: "Carlos Gomez",
        phoneNumbers: [
          { label: "home", number: "555-111" },
          { label: "work", number: "555-222", isPrimary: true },
        ],
        emails: [
          { label: "personal", email: "carlos@gmail.com" },
          { label: "work", email: "carlos@work.com", isPrimary: true },
        ],
      });
      const res = await service.pickResponsible();
      expect(res).toEqual({
        name: "Carlos Gomez",
        contactId: "c3",
        phone: "555-222",
        email: "carlos@work.com",
      });
    });

    it("returns null and logs error if presenter throws", async () => {
      requestPermissionsMock.mockResolvedValue({ status: "granted" });
      presentContactPickerMock.mockRejectedValue(new Error("picker crash"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const res = await service.pickResponsible();
      expect(res).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});
