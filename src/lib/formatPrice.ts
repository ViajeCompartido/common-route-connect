/**
 * Format a number as Argentine peso price (e.g. $15.000)
 */
export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('es-AR')}`;
}
