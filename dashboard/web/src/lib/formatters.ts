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

/**
 * Formatea votos de forma compacta (ej: 1.2M, 500K).
 */
export function formatVotosCompact(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}K`;
  }
  return n.toString();
}

/**
 * Capitaliza la primera letra de cada palabra.
 */
export function capitalize(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
