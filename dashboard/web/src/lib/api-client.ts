/**
 * Cliente para la API del dashboard electoral.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetcher genérico para SWR.
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(`${API_URL}${url}`);

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Endpoints de la API.
 */
export const API = {
  // Nacional
  resumenNacional: '/api/v1/nacional/resumen',
  candidatosNacional: '/api/v1/nacional/candidatos',
  participacionNacional: '/api/v1/nacional/participacion',

  // Departamental
  departamentos: '/api/v1/departamentos',
  departamento: (codigo: string) => `/api/v1/departamentos/${codigo}`,
  municipiosDepartamento: (codigo: string) => `/api/v1/departamentos/${codigo}/municipios`,

  // Mapas
  mapMetadata: '/api/v1/mapas/metadata',
  geojsonDepartamentos: '/api/v1/mapas/departamentos',
  geojsonMunicipios: (codigo: string) => `/api/v1/mapas/departamentos/${codigo}/municipios`,
};

/**
 * Obtiene la URL completa de la API.
 */
export function getApiUrl(endpoint: string): string {
  return `${API_URL}${endpoint}`;
}
