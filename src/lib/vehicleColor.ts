// Map common color names (Spanish/English) to hex
const COLOR_MAP: Record<string, string> = {
  rojo: '#dc2626', red: '#dc2626',
  azul: '#2563eb', blue: '#2563eb',
  negro: '#1f2937', black: '#1f2937',
  blanco: '#f8fafc', white: '#f8fafc',
  gris: '#6b7280', grey: '#6b7280', gray: '#6b7280',
  plata: '#cbd5e1', silver: '#cbd5e1',
  verde: '#16a34a', green: '#16a34a',
  amarillo: '#eab308', yellow: '#eab308',
  naranja: '#ea580c', orange: '#ea580c',
  marrón: '#92400e', marron: '#92400e', brown: '#92400e',
  beige: '#d6c7a1',
  bordó: '#7f1d1d', bordo: '#7f1d1d', burgundy: '#7f1d1d',
  celeste: '#0ea5e9',
  violeta: '#7c3aed', purple: '#7c3aed',
};

export function resolveVehicleColor(input?: string | null, fallback = 'hsl(var(--primary))'): string {
  if (!input) return fallback;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('#') || trimmed.startsWith('hsl') || trimmed.startsWith('rgb')) return input;
  return COLOR_MAP[trimmed] ?? fallback;
}
