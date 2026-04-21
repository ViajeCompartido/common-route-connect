/**
 * Motivos de cancelación predefinidos.
 * Editable y escalable: agregar/quitar entradas según necesidad operativa.
 */

export interface CancellationReason {
  category: string;
  label: string;
  forRole: 'passenger' | 'driver' | 'both';
}

export const PASSENGER_REASONS: CancellationReason[] = [
  { category: 'plan_changed', label: 'Cambió mi plan / no puedo viajar', forRole: 'passenger' },
  { category: 'found_another', label: 'Conseguí otro medio de transporte', forRole: 'passenger' },
  { category: 'price', label: 'Encontré un viaje más conveniente', forRole: 'passenger' },
  { category: 'health', label: 'Motivos de salud / familiares', forRole: 'passenger' },
  { category: 'driver_no_response', label: 'El chofer no responde', forRole: 'passenger' },
  { category: 'other', label: 'Otro motivo', forRole: 'passenger' },
];

export const DRIVER_REASONS: CancellationReason[] = [
  { category: 'vehicle_issue', label: 'Problema con el vehículo', forRole: 'driver' },
  { category: 'health', label: 'Motivos de salud', forRole: 'driver' },
  { category: 'route_changed', label: 'Cambio de ruta / horario', forRole: 'driver' },
  { category: 'no_show_passenger', label: 'El pasajero no se presentó', forRole: 'driver' },
  { category: 'weather', label: 'Condiciones climáticas / ruta', forRole: 'driver' },
  { category: 'other', label: 'Otro motivo', forRole: 'driver' },
];

export const REFUND_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  not_applicable: { label: 'Sin reembolso', color: 'bg-muted text-muted-foreground border-border' },
  pending: { label: 'Reembolso pendiente', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  processing: { label: 'Procesando', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30' },
  completed: { label: 'Reembolso realizado', color: 'bg-green-500/15 text-green-700 border-green-500/30' },
  failed: { label: 'Reembolso fallido', color: 'bg-destructive/15 text-destructive border-destructive/30' },
};
