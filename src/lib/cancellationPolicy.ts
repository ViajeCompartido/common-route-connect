/**
 * Smart cancellation policy for passenger bookings.
 * Calculates refund percentage based on booking status and time to departure.
 */

export interface RefundInfo {
  percentage: number;
  label: string;
  description: string;
  canCancel: boolean;
}

/**
 * Calculate refund info based on booking status and departure time.
 * Mirrors the DB function `calculate_refund_percentage` for UI display.
 */
export function getRefundInfo(status: string, date: string, time: string): RefundInfo {
  const departureMs = new Date(`${date}T${time}`).getTime();
  const hoursUntil = (departureMs - Date.now()) / (1000 * 60 * 60);

  // In transit or completed: no cancellation
  if (status === 'in_transit' || status === 'completed') {
    return { percentage: 0, label: 'Sin reembolso', description: 'El viaje ya está en curso o fue completado.', canCancel: false };
  }

  // Driver arrived
  if (status === 'driver_arrived') {
    return { percentage: 10, label: 'Reembolso del 10%', description: 'El chofer ya llegó al punto de encuentro. Se aplica penalización alta.', canCancel: true };
  }

  // Driver on the way
  if (status === 'driver_on_way') {
    return { percentage: 30, label: 'Reembolso del 30%', description: 'El chofer ya está en camino. Se aplica penalización.', canCancel: true };
  }

  // Paid: refund depends on time
  if (status === 'paid') {
    if (hoursUntil > 24) {
      return { percentage: 100, label: 'Reembolso completo', description: 'Cancelación con más de 24hs de anticipación.', canCancel: true };
    }
    if (hoursUntil > 2) {
      return { percentage: 80, label: 'Reembolso del 80%', description: 'Cancelación entre 2 y 24hs antes del viaje. Se retiene el 20%.', canCancel: true };
    }
    if (hoursUntil > 0) {
      return { percentage: 50, label: 'Reembolso del 50%', description: 'Cancelación a menos de 2hs del viaje. Se retiene el 50%.', canCancel: true };
    }
    return { percentage: 20, label: 'Reembolso del 20%', description: 'Ya pasó la hora del viaje. Se retiene el 80%.', canCancel: true };
  }

  // Pre-payment (pending, accepted, coordinating): full cancel
  if (['pending', 'accepted', 'coordinating'].includes(status)) {
    return { percentage: 100, label: 'Sin penalización', description: 'Podés cancelar sin costo antes de pagar.', canCancel: true };
  }

  return { percentage: 0, label: 'Sin reembolso', description: 'No se puede cancelar en este estado.', canCancel: false };
}

/** Booking statuses where the passenger can attempt to cancel */
export const CANCELLABLE_STATUSES = ['pending', 'accepted', 'coordinating', 'paid', 'driver_on_way', 'driver_arrived'];

/** Driver progress statuses for booking lifecycle */
export const DRIVER_PROGRESS_STATUSES = ['driver_on_way', 'driver_arrived', 'in_transit'];
