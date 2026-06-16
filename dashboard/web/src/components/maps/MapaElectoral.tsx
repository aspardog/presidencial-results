'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getColorGanador } from '@/lib/colors';
import { getCodigoElectoralDesdeDane } from '@/lib/departamentos';
import { formatNumber, formatPercent } from '@/lib/formatters';

import departamentosData from '../../../public/api/mapas/departamentos.json';

type Position = [number, number];
type PolygonCoordinates = Position[][];
type MultiPolygonCoordinates = PolygonCoordinates[];

type FeatureProperties = {
  dpto_ccdgo?: string;
  dpto_cnmbr?: string;
  mpio_ccdgo?: string;
  mpio_cnmbr?: string;
  mpio_cdpmp?: string;
  DPTO_CCDGO?: string;
  DPTO_CNMBR?: string;
  ganador?: string;
  votos_ganador?: number;
  porcentaje_ganador?: number;
  total_votos?: number;
};

type GeoFeature = {
  type: 'Feature';
  properties: FeatureProperties;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: PolygonCoordinates | MultiPolygonCoordinates;
  };
};

type FeatureCollection = {
  type: 'FeatureCollection';
  features: GeoFeature[];
};

type TooltipState = {
  x: number;
  y: number;
  properties: FeatureProperties;
  isMunicipio: boolean;
};

export type NivelMapa = 'departamentos' | 'municipios';

interface MapaElectoralProps {
  nivel?: NivelMapa;
  onDepartamentoClick?: (codigo: string, nombre: string) => void;
  departamentoSeleccionado?: string | null;
}

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 900;
const PADDING = 24;

const departamentosGeoJSON = departamentosData as unknown as FeatureCollection;

function getCodigo(properties: FeatureProperties, isMunicipio: boolean): string {
  if (isMunicipio) {
    return properties.mpio_cdpmp || `${properties.dpto_ccdgo}${properties.mpio_ccdgo}` || '';
  }
  return getCodigoDepartamento(properties);
}

function getCodigoDepartamento(properties: FeatureProperties): string {
  const codigoDane = properties.dpto_ccdgo || properties.DPTO_CCDGO || '';
  return getCodigoElectoralDesdeDane(codigoDane);
}

function getNombre(properties: FeatureProperties, isMunicipio: boolean): string {
  if (isMunicipio) {
    return properties.mpio_cnmbr || 'Municipio';
  }
  return properties.dpto_cnmbr || properties.DPTO_CNMBR || 'Departamento';
}

function getNombreDepartamento(properties: FeatureProperties): string {
  return properties.dpto_cnmbr || properties.DPTO_CNMBR || 'Departamento';
}

function forEachPosition(feature: GeoFeature, callback: (position: Position) => void) {
  if (feature.geometry.type === 'Polygon') {
    for (const ring of feature.geometry.coordinates as PolygonCoordinates) {
      for (const position of ring) {
        callback(position);
      }
    }
    return;
  }

  for (const polygon of feature.geometry.coordinates as MultiPolygonCoordinates) {
    for (const ring of polygon) {
      for (const position of ring) {
        callback(position);
      }
    }
  }
}

function createProjection(features: GeoFeature[]) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const feature of features) {
    forEachPosition(feature, ([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(maxLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLat)) {
    return ([lng, lat]: Position): Position => [lng, lat];
  }

  const scale = Math.min(
    (VIEWBOX_WIDTH - PADDING * 2) / (maxLng - minLng),
    (VIEWBOX_HEIGHT - PADDING * 2) / (maxLat - minLat)
  );

  const mapWidth = (maxLng - minLng) * scale;
  const mapHeight = (maxLat - minLat) * scale;
  const offsetX = (VIEWBOX_WIDTH - mapWidth) / 2;
  const offsetY = (VIEWBOX_HEIGHT - mapHeight) / 2;

  return ([lng, lat]: Position): Position => [
    offsetX + (lng - minLng) * scale,
    offsetY + (maxLat - lat) * scale,
  ];
}

function ringToPath(ring: Position[], project: (position: Position) => Position): string {
  return ring
    .map((position, index) => {
      const [x, y] = project(position);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ') + ' Z';
}

function featureToPath(feature: GeoFeature, project: (position: Position) => Position): string {
  if (feature.geometry.type === 'Polygon') {
    return (feature.geometry.coordinates as PolygonCoordinates)
      .map((ring) => ringToPath(ring, project))
      .join(' ');
  }

  return (feature.geometry.coordinates as MultiPolygonCoordinates)
    .flatMap((polygon) => polygon.map((ring) => ringToPath(ring, project)))
    .join(' ');
}

export default function MapaElectoral({
  nivel = 'departamentos',
  onDepartamentoClick,
  departamentoSeleccionado,
}: MapaElectoralProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [municipiosGeoJSON, setMunicipiosGeoJSON] = useState<FeatureCollection | null>(null);
  const [municipiosError, setMunicipiosError] = useState<string | null>(null);
  const municipiosRequestRef = useRef(false);

  useEffect(() => {
    if (nivel === 'municipios' && !municipiosGeoJSON && !municipiosRequestRef.current) {
      municipiosRequestRef.current = true;
      fetch('/api/mapas/municipios.json')
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setMunicipiosGeoJSON(data as FeatureCollection);
          setMunicipiosError(null);
        })
        .catch((err) => {
          console.error('Error cargando municipios:', err);
          municipiosRequestRef.current = false;
          setMunicipiosError('No se pudo cargar el mapa municipal.');
        });
    }
  }, [nivel, municipiosGeoJSON]);

  const isMunicipio = nivel === 'municipios';
  const currentGeoJSON = isMunicipio ? municipiosGeoJSON : departamentosGeoJSON;
  const loadingMunicipios = nivel === 'municipios' && !municipiosGeoJSON && !municipiosError;

  const paths = useMemo(() => {
    if (!currentGeoJSON?.features.length) return [];

    const project = createProjection(currentGeoJSON.features);
    return currentGeoJSON.features.map((feature) => ({
      d: featureToPath(feature, project),
      properties: feature.properties,
      codigo: getCodigo(feature.properties, isMunicipio),
      codigoDepartamento: getCodigoDepartamento(feature.properties),
      nombreDepartamento: getNombreDepartamento(feature.properties),
      nombre: getNombre(feature.properties, isMunicipio),
      color: getColorGanador(feature.properties.ganador || ''),
    }));
  }, [currentGeoJSON, isMunicipio]);

  const labelText = isMunicipio ? 'municipio' : 'departamento';

  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-gb-lg bg-gb-teal-50">
      {nivel === 'municipios' && loadingMunicipios && (
        <div className="absolute inset-0 flex items-center justify-center bg-gb-teal-50/80 z-10">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gb-teal-200 border-t-gb-teal-700"></div>
            <p className="mt-2 text-sm text-gb-slate-muted">Cargando municipios...</p>
          </div>
        </div>
      )}
      {nivel === 'municipios' && municipiosError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gb-teal-50/90 px-6 text-center">
          <p className="text-sm font-medium text-gb-slate">{municipiosError}</p>
        </div>
      )}

      <svg
        aria-label={`Mapa electoral de Colombia por ${labelText}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        onMouseLeave={() => {
          setHoveredCode(null);
          setTooltip(null);
        }}
      >
        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="#F1F8F9" />
        {paths.map(({ d, properties, codigo, codigoDepartamento, nombreDepartamento, nombre, color }) => {
          const isActive = isMunicipio
            ? departamentoSeleccionado === codigoDepartamento
            : departamentoSeleccionado === codigo;
          const isHovered = hoveredCode === codigo;

          return (
            <path
              key={codigo || nombre}
              d={d}
              fill={color}
              fillOpacity={isActive || isHovered ? 0.92 : 0.74}
              stroke={isActive ? '#15252A' : isMunicipio ? '#ffffff40' : '#ffffff'}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive ? 3 : isMunicipio ? 0.3 : 1.2}
              className="cursor-pointer transition-opacity duration-150 outline-none focus-visible:stroke-gb-ink"
              tabIndex={0}
              onClick={() => {
                const selectedCode = isMunicipio ? codigoDepartamento : codigo;
                const selectedName = isMunicipio ? nombreDepartamento : nombre;
                if (selectedCode) onDepartamentoClick?.(selectedCode, selectedName);
              }}
              onFocus={(event) => {
                setHoveredCode(codigo);
                setTooltip({
                  x: event.currentTarget.getBoundingClientRect().left,
                  y: event.currentTarget.getBoundingClientRect().top,
                  properties,
                  isMunicipio,
                });
              }}
              onKeyDown={(event) => {
                const selectedCode = isMunicipio ? codigoDepartamento : codigo;
                const selectedName = isMunicipio ? nombreDepartamento : nombre;
                if ((event.key === 'Enter' || event.key === ' ') && selectedCode) {
                  event.preventDefault();
                  onDepartamentoClick?.(selectedCode, selectedName);
                }
              }}
              onMouseMove={(event) => {
                setHoveredCode(codigo);
                setTooltip({
                  x: event.clientX,
                  y: event.clientY,
                  properties,
                  isMunicipio,
                });
              }}
            >
              <title>{nombre}</title>
            </path>
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-[260px] gb-card px-3 py-2 text-sm shadow-gb-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="font-display font-semibold text-gb-ink">
            {getNombre(tooltip.properties, tooltip.isMunicipio)}
          </p>
          {tooltip.isMunicipio && tooltip.properties.dpto_cnmbr && (
            <p className="text-xs text-gb-slate-muted">{tooltip.properties.dpto_cnmbr}</p>
          )}
          <p className="mt-1 text-gb-slate">
            Ganador: <span className="font-medium">{tooltip.properties.ganador || 'N/A'}</span>
          </p>
          <p className="font-mono text-gb-teal-700">
            {formatNumber(tooltip.properties.votos_ganador || 0)} votos (
            {formatPercent(tooltip.properties.porcentaje_ganador || 0)})
          </p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 gb-card p-3 text-xs shadow-gb-sm">
        <p className="gb-eyebrow mb-2">Ganador por {labelText}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-gb-sm" style={{ backgroundColor: '#1D4ED8' }} />
            <span className="text-gb-slate">De La Espriella</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-gb-sm" style={{ backgroundColor: '#C2410C' }} />
            <span className="text-gb-slate">Cepeda</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-gb-sm" style={{ backgroundColor: '#7C3AED' }} />
            <span className="text-gb-slate">Valencia</span>
          </div>
        </div>
      </div>
    </div>
  );
}
