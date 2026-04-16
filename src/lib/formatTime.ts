/**
 * Format a "HH:mm" (24h) time string into 12h with am/pm suffix.
 * Examples:
 *   "06:00" -> "06:00 am"
 *   "18:00" -> "06:00 pm"
 *   "00:30" -> "12:30 am"
 */
export function formatTime(time?: string | null): string {
  if (!time) return '';
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return time;
  const hours = parseInt(match[1], 10);
  const minutes = match[2];
  if (Number.isNaN(hours)) return time;
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, '0')}:${minutes} ${suffix}`;
}