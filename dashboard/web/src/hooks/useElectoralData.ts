'use client';

import useSWR from 'swr';
import { fetcher, API } from '@/lib/api-client';
import type {
  ResumenNacional,
  CandidatoNacional,
  DepartamentoResumen,
  DepartamentoDetalle,
  MunicipioResumen,
  GeoJSONFeatureCollection,
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
 * Hook para obtener todos los departamentos.
 */
export function useDepartamentos() {
  return useSWR<DepartamentoResumen[]>(API.departamentos, fetcher);
}

/**
 * Hook para obtener el detalle de un departamento.
 */
export function useDepartamento(codigo: string | null) {
  return useSWR<DepartamentoDetalle>(
    codigo ? API.departamento(codigo) : null,
    fetcher
  );
}

/**
 * Hook para obtener los municipios de un departamento.
 */
export function useMunicipiosDepartamento(codigo: string | null) {
  return useSWR<MunicipioResumen[]>(
    codigo ? API.municipiosDepartamento(codigo) : null,
    fetcher
  );
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

/**
 * Hook para obtener el GeoJSON de municipios de un departamento.
 */
export function useGeoJSONMunicipios(codigo: string | null) {
  return useSWR<GeoJSONFeatureCollection>(
    codigo ? API.geojsonMunicipios(codigo) : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
}
