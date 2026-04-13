/**
 * Check if a trip/request is expired.
 * Adds a 30-minute grace period after the scheduled departure time.
 */
export function isTripExpired(date: string, time: string): boolean {
  try {
    const departureMs = new Date(`${date}T${time}`).getTime();
    const graceMs = 30 * 60 * 1000; // 30 minutes
    return Date.now() > departureMs + graceMs;
  } catch {
    return false;
  }
}

/**
 * Platform commission rate (percentage applied on top of driver price).
 * The passenger pays this on top of the driver's price per seat.
 */
export const PLATFORM_COMMISSION_RATE = 0.07; // 7%

/**
 * Calculate platform service fee for a given base amount.
 */
export function calculateServiceFee(baseAmount: number): number {
  return Math.round(baseAmount * PLATFORM_COMMISSION_RATE);
}

/**
 * Calculate full price breakdown for a booking.
 */
export function calculatePriceBreakdown(pricePerSeat: number, seats: number, petSurcharge: number = 0) {
  const basePrice = pricePerSeat * seats;
  const subtotal = basePrice + petSurcharge;
  const serviceFee = calculateServiceFee(subtotal);
  const totalForPassenger = subtotal + serviceFee;
  return {
    basePrice,
    petSurcharge,
    subtotal,
    serviceFee,
    totalForPassenger,
    driverReceives: subtotal, // driver gets base + pet surcharge, no commission deducted
  };
}
