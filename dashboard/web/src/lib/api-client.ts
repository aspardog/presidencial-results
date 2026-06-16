/**
 * Cliente para datos estáticos del dashboard electoral.
 * Los datos se sirven desde /api/*.json (archivos estáticos pre-generados).
 */

/**
 * Fetcher genérico para SWR.
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Endpoints de datos estáticos.
 */
export const API = {
  // Nacional
  resumenNacional: '/api/nacional/resumen.json',
  candidatosNacional: '/api/nacional/candidatos.json',

  // Análisis
  clavesTerritoriales: '/api/analisis/claves-territoriales.json',

  // Departamental
  departamentos: '/api/departamentos/lista.json',
  departamentosDetalle: '/api/departamentos/detalle.json',

  // Mapas (GeoJSON)
  geojsonDepartamentos: '/api/mapas/departamentos.geojson',
};

/**
 * Obtiene la URL del endpoint.
 */
export function getApiUrl(endpoint: string): string {
  return endpoint;
}
