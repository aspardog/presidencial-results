'use client';

import useSWR from 'swr';
import { fetcher, API } from '@/lib/api-client';
import type {
  ResumenNacional,
  CandidatoNacional,
  DepartamentoResumen,
  DepartamentoDetalle,
  GeoJSONFeatureCollection,
  ClavesTerritoriales,
} from '@/types/electoral';

/**
 * Hook para obtener el resumen nacional.
 */
export function useResumenNacional() {
  return useSWR<ResumenNacional>(API.resumenNacional, fetcher);
}

/**
 * Hook para obtener los candidatos nacionales.
 */
export function useCandidatosNacional() {
  return useSWR<CandidatoNacional[]>(API.candidatosNacional, fetcher);
}

/**
 * Hook para obtener claves territoriales de la elección.
 */
export function useClavesTerritoriales() {
  return useSWR<ClavesTerritoriales>(API.clavesTerritoriales, fetcher);
}

/**
 * Hook para obtener todos los departamentos.
 */
export function useDepartamentos() {
  return useSWR<DepartamentoResumen[]>(API.departamentos, fetcher);
}

/**
 * Hook para obtener el detalle de un departamento.
 * Carga el archivo con todos los detalles y extrae el departamento solicitado.
 */
export function useDepartamento(codigo: string | null) {
  const { data, error, isLoading } = useSWR<Record<string, DepartamentoDetalle>>(
    codigo ? API.departamentosDetalle : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  // Extraer el departamento específico
  const departamento = codigo && data ? data[codigo] : undefined;

  return {
    data: departamento,
    error,
    isLoading,
  };
}

/**
 * Hook para obtener el GeoJSON de departamentos.
 */
export function useGeoJSONDepartamentos() {
  return useSWR<GeoJSONFeatureCollection>(API.geojsonDepartamentos, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}
