// Zona/barrio proximity mapping for Argentine cities
// Each zone maps to nearby zones that could be compatible pickup/dropoff points
const zoneProximity: Record<string, string[]> = {
  // Buenos Aires y alrededores
  'buenos aires': ['caba', 'capital federal', 'microcentro', 'palermo', 'belgrano', 'caballito', 'flores', 'once', 'retiro', 'constitución', 'liniers', 'lugano', 'avellaneda', 'lanús', 'lomas de zamora', 'quilmes', 'san isidro', 'vicente lópez', 'tigre', 'pilar', 'morón', 'merlo', 'moreno', 'ezeiza', 'zona norte', 'zona sur', 'zona oeste'],
  'zona norte': ['san isidro', 'vicente lópez', 'tigre', 'pilar', 'san fernando', 'buenos aires', 'caba'],
  'zona sur': ['avellaneda', 'lanús', 'lomas de zamora', 'quilmes', 'berazategui', 'buenos aires', 'caba'],
  'zona oeste': ['morón', 'merlo', 'moreno', 'ituzaingó', 'hurlingham', 'buenos aires', 'caba'],
  'la plata': ['berisso', 'ensenada', 'city bell', 'gonnet', 'los hornos', 'quilmes', 'berazategui'],
  // Córdoba
  'córdoba': ['cordoba', 'nueva córdoba', 'alta córdoba', 'güemes', 'centro córdoba', 'villa allende', 'río ceballos', 'carlos paz', 'villa carlos paz'],
  'villa carlos paz': ['carlos paz', 'córdoba', 'cosquín', 'la falda'],
  // Rosario
  'rosario': ['fisherton', 'pichincha', 'centro rosario', 'funes', 'roldán', 'pérez'],
  // Mendoza
  'mendoza': ['ciudad de mendoza', 'godoy cruz', 'guaymallén', 'las heras', 'luján de cuyo', 'maipú'],
  // San Juan
  'san juan': ['rawson', 'rivadavia', 'chimbas', 'santa lucía'],
  // Mar del Plata
  'mar del plata': ['mardel', 'mar del plata centro', 'punta mogotes', 'constitución mdp', 'batán'],
};

// Normalize text for comparison
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Check if two locations are compatible (exact, partial, or zone-proximate)
export function isLocationCompatible(search: string, tripLocation: string): { match: boolean; score: number; label: string } {
  if (!search) return { match: true, score: 1, label: '' };

  const s = normalize(search);
  const t = normalize(tripLocation);

  // Exact or substring match
  if (t.includes(s) || s.includes(t)) {
    return { match: true, score: 1, label: 'Coincidencia exacta' };
  }

  // Check zone proximity
  for (const [zone, nearby] of Object.entries(zoneProximity)) {
    const nZone = normalize(zone);
    const isSearchInZone = s.includes(nZone) || nZone.includes(s);
    const isTripInZone = t.includes(nZone) || nZone.includes(t);

    if (isSearchInZone) {
      // Search is in this zone, check if trip location is nearby
      if (nearby.some(n => t.includes(normalize(n)) || normalize(n).includes(t))) {
        return { match: true, score: 0.7, label: 'Zona cercana' };
      }
    }
    if (isTripInZone) {
      // Trip is in this zone, check if search is nearby
      if (nearby.some(n => s.includes(normalize(n)) || normalize(n).includes(s))) {
        return { match: true, score: 0.7, label: 'Zona cercana' };
      }
    }

    // Both in the same zone's nearby list
    const sInNearby = nearby.some(n => { const nn = normalize(n); return s.includes(nn) || nn.includes(s); });
    const tInNearby = nearby.some(n => { const nn = normalize(n); return t.includes(nn) || nn.includes(t); });
    if (sInNearby && tInNearby) {
      return { match: true, score: 0.6, label: 'Zona compatible' };
    }
  }

  // Fuzzy: check if they share significant words (3+ chars)
  const sWords = s.split(/\s+/).filter(w => w.length >= 3);
  const tWords = t.split(/\s+/).filter(w => w.length >= 3);
  const sharedWords = sWords.filter(sw => tWords.some(tw => tw.includes(sw) || sw.includes(tw)));
  if (sharedWords.length > 0) {
    return { match: true, score: 0.5, label: 'Posible coincidencia' };
  }

  return { match: false, score: 0, label: '' };
}

// Check if two times are within a tolerance (in minutes)
export function isTimeCompatible(searchTime: string, tripTime: string, toleranceMinutes: number = 90): { match: boolean; diffMinutes: number; label: string } {
  if (!searchTime) return { match: true, diffMinutes: 0, label: '' };

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const diff = Math.abs(toMinutes(searchTime) - toMinutes(tripTime));
  
  if (diff === 0) return { match: true, diffMinutes: 0, label: 'Mismo horario' };
  if (diff <= 30) return { match: true, diffMinutes: diff, label: 'Horario muy cercano' };
  if (diff <= 60) return { match: true, diffMinutes: diff, label: `±${diff} min` };
  if (diff <= toleranceMinutes) return { match: true, diffMinutes: diff, label: `±${diff} min aprox.` };
  
  return { match: false, diffMinutes: diff, label: '' };
}

// Check if dates are compatible (same day or ±1 day)
export function isDateCompatible(searchDate: string, tripDate: string): { match: boolean; label: string } {
  if (!searchDate) return { match: true, label: '' };
  
  const s = new Date(searchDate);
  const t = new Date(tripDate);
  const diffDays = Math.abs((s.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return { match: true, label: '' };
  if (diffDays <= 1) return { match: true, label: 'Día cercano' };
  
  return { match: false, label: '' };
}

export interface MatchResult {
  tripId: string;
  overallScore: number;
  originMatch: { match: boolean; score: number; label: string };
  destinationMatch: { match: boolean; score: number; label: string };
  timeMatch: { match: boolean; diffMinutes: number; label: string };
  dateMatch: { match: boolean; label: string };
  compatibilityLabel: string;
}

export function computeMatchScore(
  filters: { origin: string; destination: string; date: string; time?: string },
  trip: { id: string; origin: string; destination: string; date: string; time: string }
): MatchResult {
  const originMatch = isLocationCompatible(filters.origin, trip.origin);
  const destinationMatch = isLocationCompatible(filters.destination, trip.destination);
  const timeMatch = isTimeCompatible(filters.time || '', trip.time);
  const dateMatch = isDateCompatible(filters.date, trip.date);

  // Weighted score
  const weights = { origin: 0.3, destination: 0.35, time: 0.2, date: 0.15 };
  const timeScore = timeMatch.match ? Math.max(0, 1 - timeMatch.diffMinutes / 90) : 0;
  const dateScore = dateMatch.match ? 1 : 0;

  const overallScore =
    originMatch.score * weights.origin +
    destinationMatch.score * weights.destination +
    timeScore * weights.time +
    dateScore * weights.date;

  let compatibilityLabel = '';
  if (overallScore >= 0.9) compatibilityLabel = 'Coincidencia alta';
  else if (overallScore >= 0.7) compatibilityLabel = 'Muy compatible';
  else if (overallScore >= 0.5) compatibilityLabel = 'Compatible';
  else if (overallScore >= 0.3) compatibilityLabel = 'Podría servir';

  return { tripId: trip.id, overallScore, originMatch, destinationMatch, timeMatch, dateMatch, compatibilityLabel };
}
