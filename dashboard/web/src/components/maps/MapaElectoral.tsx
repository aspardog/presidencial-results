'use client';

import { useMemo, useState } from 'react';
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
  DPTO_CCDGO?: string;
  DPTO_CNMBR?: string;
  ganador?: string;
  votos_ganador?: number;
  porcentaje_ganador?: number;
  segundo?: string;
  votos_segundo?: number;
  diferencia?: number;
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
};

interface MapaElectoralProps {
  onDepartamentoClick?: (codigo: string, nombre: string) => void;
  onReset?: () => void;
  departamentoSeleccionado?: string | null;
  departamentoSeleccionadoNombre?: string | null;
}

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 900;
const PADDING = 24;

const departamentosGeoJSON = departamentosData as unknown as FeatureCollection;

function getCodigoDepartamento(properties: FeatureProperties): string {
  const codigoDane = properties.dpto_ccdgo || properties.DPTO_CCDGO || '';
  return getCodigoElectoralDesdeDane(codigoDane);
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
  onDepartamentoClick,
  onReset,
  departamentoSeleccionado,
  departamentoSeleccionadoNombre,
}: MapaElectoralProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const visibleFeatures = useMemo(() => {
    if (!departamentoSeleccionado) return departamentosGeoJSON.features;

    return departamentosGeoJSON.features.filter(
      (feature) => getCodigoDepartamento(feature.properties) === departamentoSeleccionado
    );
  }, [departamentoSeleccionado]);

  const paths = useMemo(() => {
    if (!visibleFeatures.length) return [];

    const project = createProjection(visibleFeatures);
    return visibleFeatures.map((feature) => ({
      d: featureToPath(feature, project),
      properties: feature.properties,
      codigo: getCodigoDepartamento(feature.properties),
      nombre: getNombreDepartamento(feature.properties),
      color: getColorGanador(feature.properties.ganador || ''),
    }));
  }, [visibleFeatures]);

  const isZoomed = Boolean(departamentoSeleccionado);
  const mapTitle = isZoomed && departamentoSeleccionadoNombre
    ? departamentoSeleccionadoNombre
    : 'Colombia por departamentos';

  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-gb-lg bg-gb-teal-50">
      <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2">
        <div className="rounded-gb-md border border-gb-border bg-white px-3 py-2 shadow-gb-sm">
          <p className="gb-eyebrow leading-none">{isZoomed ? 'Zoom departamental' : 'Vista departamental'}</p>
          <p className="mt-1 max-w-[220px] truncate text-sm font-semibold text-gb-ink sm:max-w-[320px]">
            {mapTitle}
          </p>
        </div>
        {isZoomed && onReset && (
          <button
            className="rounded-gb-md border border-gb-border-strong bg-white px-3 py-2 text-sm font-semibold text-gb-slate shadow-gb-sm transition hover:border-gb-teal-600 hover:text-gb-teal-700"
            type="button"
            onClick={onReset}
          >
            Volver a Colombia
          </button>
        )}
      </div>

      <svg
        aria-label="Mapa electoral de Colombia por departamento"
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
        {paths.map(({ d, properties, codigo, nombre, color }) => {
          const isActive = departamentoSeleccionado === codigo;
          const isHovered = hoveredCode === codigo;

          return (
            <path
              key={codigo || nombre}
              d={d}
              fill={color}
              fillOpacity={isActive || isHovered ? 0.92 : 0.74}
              stroke={isHovered || isActive ? '#15252A' : '#ffffff'}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isHovered ? 2 : isActive ? 3 : 1.2}
              className="cursor-pointer transition-opacity duration-150 outline-none focus-visible:stroke-gb-ink"
              tabIndex={0}
              onClick={() => {
                if (codigo) onDepartamentoClick?.(codigo, nombre);
              }}
              onFocus={(event) => {
                setHoveredCode(codigo);
                setTooltip({
                  x: event.currentTarget.getBoundingClientRect().left,
                  y: event.currentTarget.getBoundingClientRect().top,
                  properties,
                });
              }}
              onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && codigo) {
                  event.preventDefault();
                  onDepartamentoClick?.(codigo, nombre);
                }
              }}
              onMouseMove={(event) => {
                setHoveredCode(codigo);
                setTooltip({
                  x: event.clientX,
                  y: event.clientY,
                  properties,
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
            {getNombreDepartamento(tooltip.properties)}
          </p>
          <p className="mt-1 text-gb-slate">
            Ganador: <span className="font-medium">{tooltip.properties.ganador || 'N/A'}</span>
          </p>
          <p className="font-mono text-gb-teal-700">
            {formatNumber(tooltip.properties.votos_ganador || 0)} votos (
            {formatPercent(tooltip.properties.porcentaje_ganador || 0)})
          </p>
          {tooltip.properties.segundo && (
            <p className="mt-2 text-gb-slate">
              Segundo: <span className="font-medium">{tooltip.properties.segundo}</span>
            </p>
          )}
          <p className="font-mono text-gb-slate-muted">
            Margen: {formatNumber(tooltip.properties.diferencia || 0)} votos
          </p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 gb-card p-3 text-xs shadow-gb-sm">
        <p className="gb-eyebrow mb-2">Ganador por departamento</p>
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
