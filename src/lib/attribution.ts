import { prisma } from "./prisma";

export interface LastClickResult {
  campaigneId: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  clickedAt: Date;
}

/**
 * Find the last click event for a contact within a time window
 */
export async function findLastClick(
  contactId: string,
  windowDays: number = 7
): Promise<LastClickResult | null> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - windowDays);

  // Query click events for the contact within the window
  const lastClickEvent = await prisma.clickEvent.findFirst({
    where: {
      contactId,
      createdAt: {
        gte: startDate,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!lastClickEvent) {
    return null;
  }

  // Return click event data - note: ClickEvent doesn't have campaigneId, extract from UTM params instead
  return {
    campaigneId: "", // ClickEvent tracks UTM data instead of direct campaign reference
    utmSource: lastClickEvent.utmSource || undefined,
    utmMedium: lastClickEvent.utmMedium || undefined,
    utmCampaign: lastClickEvent.utmCampaign || undefined,
    utmContent: lastClickEvent.utmContent || undefined,
    utmTerm: lastClickEvent.utmTerm || undefined,
    clickedAt: lastClickEvent.createdAt,
  };
}

/**
 * Attribute a lead to the last campaign the contact clicked on
 */
export async function attributeLead(
  leadId: string,
  contactId: string
): Promise<void> {
  const lastClick = await findLastClick(contactId);

  if (!lastClick) {
    return;
  }

  // Update the lead with the campaign attribution
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      campagneId: lastClick.campaigneId,
      utmSource: lastClick.utmSource,
      utmMedium: lastClick.utmMedium,
      utmCampaign: lastClick.utmCampaign,
      utmContent: lastClick.utmContent,
      utmTerm: lastClick.utmTerm,
    },
  });
}
