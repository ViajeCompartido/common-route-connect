// Normalize location text for storage and comparison
export function normalizeLocation(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Normalize for comparison (lowercase, no accents)
export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Common Argentine locations for autocomplete suggestions
export const COMMON_LOCATIONS = [
  'Bahía Blanca', 'Punta Alta', 'Buenos Aires', 'La Plata', 'Mar del Plata',
  'Córdoba', 'Rosario', 'Mendoza', 'San Juan', 'Tucumán',
  'Villa Carlos Paz', 'Carlos Paz', 'Neuquén', 'Bariloche',
  'Salta', 'Jujuy', 'Santa Fe', 'Paraná', 'Corrientes', 'Posadas',
  'Resistencia', 'Formosa', 'San Luis', 'San Rafael', 'Tandil',
  'Olavarría', 'Azul', 'Necochea', 'Tres Arroyos', 'Coronel Suárez',
  'Monte Hermoso', 'Sierra de la Ventana', 'Tornquist', 'Pigüé',
  'Ingeniero White', 'General Cerri', 'Cabildo', 'Médanos',
  'Pedro Luro', 'Mayor Buratovich', 'Hilario Ascasubi',
  'Palermo', 'Belgrano', 'Caballito', 'Flores', 'Retiro',
  'Constitución', 'Liniers', 'Avellaneda', 'Lanús', 'Quilmes',
  'Lomas de Zamora', 'San Isidro', 'Vicente López', 'Tigre', 'Pilar',
  'Morón', 'Merlo', 'Moreno', 'Ezeiza', 'Berazategui',
  'Zona Norte', 'Zona Sur', 'Zona Oeste',
  'Fisherton', 'Funes', 'Roldán', 'Godoy Cruz', 'Guaymallén',
  'Luján de Cuyo', 'Maipú', 'Las Heras',
  'City Bell', 'Gonnet', 'Ensenada', 'Berisso',
  'Nueva Córdoba', 'Alta Córdoba', 'Güemes',
  'Villa Allende', 'Río Ceballos', 'Cosquín', 'La Falda',
];

// Get autocomplete suggestions based on input
export function getLocationSuggestions(input: string, limit = 6): string[] {
  if (!input || input.length < 2) return [];
  const normalized = normalizeForComparison(input);
  return COMMON_LOCATIONS
    .filter(loc => normalizeForComparison(loc).includes(normalized))
    .slice(0, limit);
}
