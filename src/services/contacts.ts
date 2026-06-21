import * as Contacts from "expo-contacts";

export class ContactsService {
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("[ContactsService] Failed to request permissions:", error);
      return false;
    }
  }

  async pickResponsible(): Promise<{
    name: string;
    contactId?: string;
    phone?: string;
    email?: string;
  } | null> {
    try {
      const granted = await this.requestPermission();
      if (!granted) {
        return null;
      }

      let contact: Contacts.ExistingContact | null = null;
      try {
        contact = await Contacts.presentContactPickerAsync();
      } catch (err) {
        console.warn("[ContactsService] System contact picker failed, falling back to list query:", err);
        try {
          const response = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
            pageSize: 1,
          });
          if (response && response.data && response.data.length > 0) {
            contact = response.data[0];
          }
        } catch (queryErr) {
          console.error("[ContactsService] Fallback contacts query failed:", queryErr);
        }
      }

      if (!contact) {
        return null;
      }

      // Extract phone number: prefer primary, otherwise first one
      let phone: string | undefined;
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        const primaryPhone = contact.phoneNumbers.find((p: Contacts.PhoneNumber) => p.isPrimary);
        phone = primaryPhone ? primaryPhone.number : contact.phoneNumbers[0].number;
      }

      // Extract email address: prefer primary, otherwise first one
      let email: string | undefined;
      if (contact.emails && contact.emails.length > 0) {
        const primaryEmail = contact.emails.find((e: Contacts.Email) => e.isPrimary);
        email = primaryEmail ? primaryEmail.email : contact.emails[0].email;
      }

      return {
        name: contact.name,
        contactId: contact.id,
        phone,
        email,
      };
    } catch (error) {
      console.error("[ContactsService] Failed to pick contact:", error);
      return null;
    }
  }
}

export const contactsService = new ContactsService();
