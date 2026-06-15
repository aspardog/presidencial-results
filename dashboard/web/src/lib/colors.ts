/**
 * Colores consistentes para partidos políticos.
 */

export const COLORES_PARTIDO: Record<string, string> = {
  "DEFENSORES DE LA PATRIA": "#1E40AF",
  "MOVIMIENTO POLÍTICO PACTO HISTÓRICO": "#DC2626",
  "PARTIDO CENTRO DEMOCRÁTICO": "#7C3AED",
  "PARTIDO POLÍTICO DIGNIDAD & COMPROMISO": "#059669",
  "CON CLAUDIA IMPARABLES": "#F59E0B",
  "ROMPER EL SISTEMA": "#EC4899",
  "COALICIÓN F.A.M.I.L.I.A": "#14B8A6",
  "PARTIDO DEMÓCRATA COLOMBIANO": "#6366F1",
  "SONDRA MACOLLINS, LA ABOGADA DE HIERRO": "#84CC16",
  "PARTIDO POLÍTICO LA FUERZA": "#F97316",
  "PARTIDO ECOLOGISTA COLOMBIANO": "#22C55E",
};

export const DEFAULT_COLOR = "#6B7280";

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
  "ABELARDO DE LA ESPRIELLA": "#1E40AF",
  "IVÁN CEPEDA CASTRO": "#DC2626",
  "PALOMA VALENCIA LASERNA": "#7C3AED",
  "SERGIO FAJARDO VALDERRAMA": "#059669",
  "CLAUDIA LÓPEZ": "#F59E0B",
};

export function getColorGanador(nombre: string): string {
  return COLORES_GANADOR[nombre] || DEFAULT_COLOR;
}
