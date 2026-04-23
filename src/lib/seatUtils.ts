export const MAX_DRIVER_VEHICLE_SEATS = 8;

export function clampSeatCount(value: string | number, min: number, max: number, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

export function getOccupiedSeats(totalSeats: number, availableSeats: number): number {
  return Math.max(totalSeats - availableSeats, 0);
}

export function getSeatSummary(totalSeats: number, availableSeats: number) {
  const occupiedSeats = getOccupiedSeats(totalSeats, availableSeats);

  return {
    totalSeats,
    availableSeats,
    occupiedSeats,
  };
}