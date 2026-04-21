/**
 * Normalización de nombres de ciudad para agrupar variantes
 * (ej: "Monte Hermoso", "Monte Hermoso playa", "Monte Hermoso centro" → "Monte Hermoso").
 *
 * Cómo extender:
 *  - Agregá una entrada en CITY_ALIASES con la ciudad base como clave y los
 *    sub-barrios/zonas/variantes como array de valores (en minúsculas, sin acentos).
 *  - El matching es por "comienza con" o "contiene" la variante normalizada.
 */

const stripAccents = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Mapa editable: CIUDAD_BASE → variantes / barrios / zonas conocidas
export const CITY_ALIASES: Record<string, string[]> = {
  'Monte Hermoso': ['monte hermoso', 'monte hermoso playa', 'monte hermoso centro', 'balneario monte hermoso'],
  'Bahía Blanca': ['bahia blanca', 'bahía blanca', 'bahia bca', 'bb', 'ingeniero white', 'general cerri'],
  'Buenos Aires': ['buenos aires', 'caba', 'capital federal', 'ciudad autonoma', 'ciudad autónoma', 'palermo', 'belgrano', 'caballito', 'flores', 'retiro', 'constitucion', 'liniers'],
  'La Plata': ['la plata', 'city bell', 'gonnet', 'ensenada', 'berisso'],
  'Mar del Plata': ['mar del plata', 'mardel', 'mdp'],
  'Córdoba': ['cordoba', 'córdoba', 'nueva cordoba', 'alta cordoba', 'cordoba capital'],
  'Villa Carlos Paz': ['villa carlos paz', 'carlos paz'],
  'Rosario': ['rosario', 'fisherton', 'funes', 'roldan', 'roldán'],
  'Mendoza': ['mendoza', 'godoy cruz', 'guaymallen', 'guaymallén', 'lujan de cuyo', 'maipu', 'las heras'],
  'Punta Alta': ['punta alta'],
  'Sierra de la Ventana': ['sierra de la ventana', 'villa ventana', 'tornquist'],
  'Pedro Luro': ['pedro luro', 'mayor buratovich', 'hilario ascasubi', 'medanos', 'médanos'],
};

// Cache invertido: variante normalizada → ciudad base
const VARIANT_TO_BASE = (() => {
  const map = new Map<string, string>();
  for (const [base, variants] of Object.entries(CITY_ALIASES)) {
    for (const v of variants) map.set(stripAccents(v), base);
  }
  return map;
})();

/**
 * Devuelve la ciudad base canónica para un nombre de ciudad/origen/destino.
 * Si no hay match, devuelve el input con trim + capitalización por palabra.
 */
export function normalizeCityName(raw: string): string {
  if (!raw) return raw;
  const norm = stripAccents(raw);

  // 1) match exacto
  const exact = VARIANT_TO_BASE.get(norm);
  if (exact) return exact;

  // 2) match por "comienza con" la base (ej: "monte hermoso playa" → "Monte Hermoso")
  for (const [variant, base] of VARIANT_TO_BASE.entries()) {
    if (norm.startsWith(variant + ' ') || norm === variant) return base;
  }

  // 3) match por "contiene" alguna variante larga (>5 chars para evitar falsos positivos)
  for (const [variant, base] of VARIANT_TO_BASE.entries()) {
    if (variant.length >= 5 && norm.includes(variant)) return base;
  }

  // 4) fallback: capitalizar
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Genera la clave de ruta normalizada "Origen → Destino" */
export function normalizeRouteKey(origin: string, destination: string): string {
  return `${normalizeCityName(origin)} → ${normalizeCityName(destination)}`;
}
