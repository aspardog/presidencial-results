/**
 * Colores consistentes para partidos políticos.
 * Paleta vibrante alineada con Global Bridge.
 */

export const COLORES_PARTIDO: Record<string, string> = {
  "DEFENSORES DE LA PATRIA": "#1D4ED8",
  "MOVIMIENTO POLÍTICO PACTO HISTÓRICO": "#C2410C",
  "PARTIDO CENTRO DEMOCRÁTICO": "#7C3AED",
  "PARTIDO POLÍTICO DIGNIDAD & COMPROMISO": "#0F766E",
  "CON CLAUDIA IMPARABLES": "#CA8A04",
  "ROMPER EL SISTEMA": "#BE185D",
  "COALICIÓN F.A.M.I.L.I.A": "#0891B2",
  "PARTIDO DEMÓCRATA COLOMBIANO": "#4F46E5",
  "SONDRA MACOLLINS, LA ABOGADA DE HIERRO": "#65A30D",
  "PARTIDO POLÍTICO LA FUERZA": "#EA580C",
  "PARTIDO ECOLOGISTA COLOMBIANO": "#059669",
};

export const DEFAULT_COLOR = "#5E7074";

/**
 * Obtiene el color de un partido político.
 */
export function getColorPartido(partido: string): string {
  return COLORES_PARTIDO[partido] || DEFAULT_COLOR;
}

/**
 * Colores para el mapa coroplético según el ganador.
 */
export const COLORES_GANADOR: Record<string, string> = {
  "ABELARDO DE LA ESPRIELLA": "#1D4ED8",
  "IVÁN CEPEDA CASTRO": "#C2410C",
  "PALOMA VALENCIA LASERNA": "#7C3AED",
  "SERGIO FAJARDO VALDERRAMA": "#0F766E",
  "CLAUDIA LÓPEZ": "#CA8A04",
};

export function getColorGanador(nombre: string): string {
  return COLORES_GANADOR[nombre] || DEFAULT_COLOR;
}
