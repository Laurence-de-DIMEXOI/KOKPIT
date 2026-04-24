export type SlaStatus = "OK" | "ATTENTION" | "URGENT";

const BUSINESS_HOURS_START = 8; // 8 AM
const BUSINESS_HOURS_END = 18; // 6 PM
const SLA_HOURS = 48;

/**
 * Check if a date is within business hours (Mon-Sat, 8h-18h)
 */
function isBusinessHour(date: Date): boolean {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();

  // Monday (1) to Saturday (6)
  const isBusinessDay = dayOfWeek >= 1 && dayOfWeek <= 6;
  const isBusinessTime = hour >= BUSINESS_HOURS_START && hour < BUSINESS_HOURS_END;

  return isBusinessDay && isBusinessTime;
}

/**
 * Add business hours to a date
 */
function addBusinessHours(date: Date, hoursToAdd: number): Date {
  const result = new Date(date);
  let remainingHours = hoursToAdd;

  while (remainingHours > 0) {
    const currentHour = result.getHours();

    // If before business hours, move to start of business hours
    if (currentHour < BUSINESS_HOURS_START) {
      result.setHours(BUSINESS_HOURS_START);
    }
    // If after business hours or on Sunday/after Saturday, move to next business day start
    else if (
      currentHour >= BUSINESS_HOURS_END ||
      result.getDay() === 0 ||
      result.getDay() > 6
    ) {
      result.setDate(result.getDate() + 1);
      result.setHours(BUSINESS_HOURS_START, 0, 0, 0);
    } else {
      // We're in business hours
      const hoursUntilEnd = BUSINESS_HOURS_END - currentHour;

      if (remainingHours <= hoursUntilEnd) {
        result.setHours(currentHour + remainingHours);
        remainingHours = 0;
      } else {
        remainingHours -= hoursUntilEnd;
        result.setDate(result.getDate() + 1);
        result.setHours(BUSINESS_HOURS_START, 0, 0, 0);
      }
    }
  }

  return result;
}

/**
 * Calculate the SLA deadline (48 business hours from creation, Mon-Sat 8h-18h)
 */
export function calculateSlaDeadline(createdAt: Date): Date {
  return addBusinessHours(new Date(createdAt), SLA_HOURS);
}

/**
 * Get the SLA status based on remaining time
 * OK: >24 hours remaining
 * ATTENTION: 4-24 hours remaining
 * URGENT: <4 hours or overdue
 */
export function getSlaStatus(deadline: Date): SlaStatus {
  const now = new Date();
  const remainingMs = deadline.getTime() - now.getTime();
  const remainingHours = remainingMs / (1000 * 60 * 60);

  if (remainingHours > 24) {
    return "OK";
  } else if (remainingHours > 4) {
    return "ATTENTION";
  } else {
    return "URGENT";
  }
}

/**
 * Format remaining time until deadline in French
 */
export function formatTimeRemaining(deadline: Date): string {
  const now = new Date();
  const remainingMs = deadline.getTime() - now.getTime();

  if (remainingMs < 0) {
    return "Dépassé";
  }

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor(
    (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
  );

  if (remainingHours > 24) {
    const days = Math.floor(remainingHours / 24);
    const hours = remainingHours % 24;
    return `${days}j ${hours}h`;
  } else if (remainingHours > 0) {
    return `${remainingHours}h ${remainingMinutes}m`;
  } else {
    return `${remainingMinutes}m`;
  }
}
