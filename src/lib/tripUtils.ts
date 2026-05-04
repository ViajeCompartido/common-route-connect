/**
 * Check if a trip/request is expired.
 * Adds a 40-minute grace period after the scheduled departure time.
 */
export function getTripDepartureDate(date: string, time: string): Date | null {
  const departure = new Date(`${date}T${time}`);
  return Number.isNaN(departure.getTime()) ? null : departure;
}

/**
 * Validate that a trip/request is being created for a future departure time.
 */
export function isTripCreationValid(date: string, time: string): boolean {
  const departure = getTripDepartureDate(date, time);
  return departure ? departure.getTime() > Date.now() : false;
}

export function isTripExpired(date: string, time: string): boolean {
  try {
    const departure = getTripDepartureDate(date, time);
    if (!departure) return false;
    const departureMs = departure.getTime();
    const graceMs = 40 * 60 * 1000; // 40 minutes
    return Date.now() > departureMs + graceMs;
  } catch {
    return false;
  }
}

/**
 * Default platform commission rate (used as fallback before app_settings loads).
 */
export const DEFAULT_COMMISSION_RATE = 0.07; // 7%

let _cachedCommissionRate = DEFAULT_COMMISSION_RATE;

export function setCachedCommissionRate(rate: number) {
  if (typeof rate === 'number' && !Number.isNaN(rate) && rate >= 0 && rate <= 1) {
    _cachedCommissionRate = rate;
  }
}

export function getCommissionRate(): number {
  return _cachedCommissionRate;
}

/**
 * Backwards-compatible export. Note: this captures the rate at the moment of
 * import; for always-live values use getCommissionRate() instead.
 */
export const PLATFORM_COMMISSION_RATE = _cachedCommissionRate;

/**
 * Calculate platform service fee for a given base amount, using the live rate.
 */
export function calculateServiceFee(baseAmount: number): number {
  return Math.round(baseAmount * _cachedCommissionRate);
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
    driverReceives: subtotal,
  };
}
