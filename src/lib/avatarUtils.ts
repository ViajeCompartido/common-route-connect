/**
 * Extract the first letter initial from a name for avatar display.
 * Guards against full words, location data, or empty strings.
 */
export function getInitial(name: string | null | undefined): string {
  if (!name || name.trim().length === 0) return '?';
  return name.trim().charAt(0).toUpperCase();
}
