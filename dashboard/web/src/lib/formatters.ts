/**
 * Utilidades de formateo.
 */

/**
 * Formatea un número con separadores de miles.
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-CO').format(n);
}

/**
 * Formatea un porcentaje.
 */
export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}
