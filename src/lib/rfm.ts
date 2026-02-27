import { prisma } from "./prisma";

export interface RfmScore {
  recence: number; // 1-5
  frequence: number; // 1-5
  montant: number; // 1-5
  score: number; // 3-15
}

/**
 * Calculate RFM (Recency, Frequency, Monetary) score for a contact
 */
export async function calculateRfm(contactId: string): Promise<RfmScore> {
  // Get all sales for this contact
  const sales = await prisma.vente.findMany({
    where: {
      contactId,
    },
    select: {
      id: true,
      createdAt: true,
      montant: true,
    },
  });

  // Initialize scores
  let recenceScore = 1;
  let frequenceScore = 1;
  let montantScore = 1;

  if (sales.length === 0) {
    return {
      recence: recenceScore,
      frequence: frequenceScore,
      montant: montantScore,
      score: recenceScore + frequenceScore + montantScore,
    };
  }

  // Calculate Recency (days since last purchase)
  const now = new Date();
  const lastSaleDate = new Date(
    Math.max(...sales.map((s) => s.createdAt.getTime()))
  );
  const daysSinceLastSale = Math.floor(
    (now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastSale <= 30) {
    recenceScore = 5;
  } else if (daysSinceLastSale <= 90) {
    recenceScore = 4;
  } else if (daysSinceLastSale <= 180) {
    recenceScore = 3;
  } else if (daysSinceLastSale <= 365) {
    recenceScore = 2;
  } else {
    recenceScore = 1;
  }

  // Calculate Frequency (number of purchases)
  const frequency = sales.length;

  if (frequency >= 10) {
    frequenceScore = 5;
  } else if (frequency >= 5) {
    frequenceScore = 4;
  } else if (frequency >= 3) {
    frequenceScore = 3;
  } else if (frequency >= 2) {
    frequenceScore = 2;
  } else {
    frequenceScore = 1;
  }

  // Calculate Monetary (total amount spent)
  const totalSpent = sales.reduce((sum, sale) => sum + sale.montant, 0);
  const averageOrderValue = totalSpent / sales.length;

  // Define thresholds for monetary scoring
  if (totalSpent >= 50000) {
    montantScore = 5;
  } else if (totalSpent >= 20000) {
    montantScore = 4;
  } else if (totalSpent >= 10000) {
    montantScore = 3;
  } else if (totalSpent >= 5000) {
    montantScore = 2;
  } else {
    montantScore = 1;
  }

  return {
    recence: recenceScore,
    frequence: frequenceScore,
    montant: montantScore,
    score: recenceScore + frequenceScore + montantScore,
  };
}

/**
 * Calculate and update RFM score for a contact
 */
export async function updateContactRfm(contactId: string): Promise<RfmScore> {
  const rfmScore = await calculateRfm(contactId);

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      recence: rfmScore.recence,
      frequence: rfmScore.frequence,
      montant: rfmScore.montant,
      scoreRfm: rfmScore.score,
    },
  });

  return rfmScore;
}
