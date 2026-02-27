/**
 * Sellsy API Client
 *
 * This is a placeholder implementation for Sellsy API integration.
 * TODO: Implement full OAuth token management
 * TODO: Add error handling and retry logic
 * TODO: Implement real API calls
 */

import { prisma } from "./prisma";

export interface SellsyContact {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
}

export interface SellsyQuote {
  id: string;
  numero: string;
  montant: number;
  dateCreation: Date;
  dateLimite?: Date;
}

export interface SellsyInvoice {
  id: string;
  numero: string;
  montant: number;
  dateCreation: Date;
}

/**
 * Initialize Sellsy OAuth token
 * TODO: Implement full OAuth flow
 */
function getAccessToken(): string {
  // TODO: Implement token refresh logic
  // For now, return from environment
  return process.env.SELLSY_ACCESS_TOKEN || "";
}

/**
 * Get a contact from Sellsy
 * TODO: Implement real API call
 */
export async function getContact(sellsyId: string): Promise<SellsyContact | null> {
  try {
    // TODO: Make real API call to Sellsy
    // const token = getAccessToken();
    // const response = await fetch(`https://api.sellsy.com/v2/contacts/${sellsyId}`, {
    //   headers: { Authorization: `Bearer ${token}` },
    // });

    // For now, return mock data
    console.log(`TODO: Fetch contact ${sellsyId} from Sellsy API`);
    return null;
  } catch (error) {
    console.error("Error fetching Sellsy contact:", error);
    return null;
  }
}

/**
 * Create a contact in Sellsy
 * TODO: Implement real API call
 */
export async function createContact(data: Partial<SellsyContact>): Promise<SellsyContact | null> {
  try {
    // TODO: Make real API call to Sellsy
    // const token = getAccessToken();
    // const response = await fetch("https://api.sellsy.com/v2/contacts", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(data),
    // });

    console.log("TODO: Create contact in Sellsy API", data);
    return null;
  } catch (error) {
    console.error("Error creating Sellsy contact:", error);
    return null;
  }
}

/**
 * Update a contact in Sellsy
 * TODO: Implement real API call
 */
export async function updateContact(
  sellsyId: string,
  data: Partial<SellsyContact>
): Promise<SellsyContact | null> {
  try {
    // TODO: Make real API call to Sellsy
    // const token = getAccessToken();
    // const response = await fetch(`https://api.sellsy.com/v2/contacts/${sellsyId}`, {
    //   method: "PUT",
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(data),
    // });

    console.log(`TODO: Update contact ${sellsyId} in Sellsy API`, data);
    return null;
  } catch (error) {
    console.error("Error updating Sellsy contact:", error);
    return null;
  }
}

/**
 * Get all quotes for a contact
 * TODO: Implement real API call
 */
export async function getQuotes(contactSellsyId: string): Promise<SellsyQuote[]> {
  try {
    // TODO: Make real API call to Sellsy
    // const token = getAccessToken();
    // const response = await fetch(
    //   `https://api.sellsy.com/v2/contacts/${contactSellsyId}/quotes`,
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );

    console.log(`TODO: Fetch quotes for contact ${contactSellsyId} from Sellsy API`);
    return [];
  } catch (error) {
    console.error("Error fetching Sellsy quotes:", error);
    return [];
  }
}

/**
 * Get all invoices for a contact
 * TODO: Implement real API call
 */
export async function getInvoices(contactSellsyId: string): Promise<SellsyInvoice[]> {
  try {
    // TODO: Make real API call to Sellsy
    // const token = getAccessToken();
    // const response = await fetch(
    //   `https://api.sellsy.com/v2/contacts/${contactSellsyId}/invoices`,
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );

    console.log(`TODO: Fetch invoices for contact ${contactSellsyId} from Sellsy API`);
    return [];
  } catch (error) {
    console.error("Error fetching Sellsy invoices:", error);
    return [];
  }
}

/**
 * Sync a local contact to/from Sellsy
 * TODO: Implement real sync logic
 */
export async function syncContact(contactId: string): Promise<void> {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      console.error(`Contact ${contactId} not found`);
      return;
    }

    if (!contact.sellsyContactId) {
      // TODO: Create contact in Sellsy and get ID
      console.log(`TODO: Create new contact in Sellsy for ${contactId}`);
      return;
    }

    // TODO: Update contact in Sellsy with local data
    console.log(`TODO: Sync contact ${contactId} with Sellsy ID ${contact.sellsyContactId}`);
  } catch (error) {
    console.error("Error syncing contact with Sellsy:", error);
  }
}
