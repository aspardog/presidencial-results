'use client';

import { useMemo, useState } from 'react';
import { getColorGanador } from '@/lib/colors';
import { getCodigoElectoralDesdeDane } from '@/lib/departamentos';
import { formatNumber, formatPercent } from '@/lib/formatters';

// Importar GeoJSON estáticamente
import geojsonData from '../../../public/api/mapas/departamentos.json';

type Position = [number, number];
type PolygonCoordinates = Position[][];
type MultiPolygonCoordinates = PolygonCoordinates[];

type DepartamentoProperties = {
  dpto_ccdgo?: string;
  dpto_cnmbr?: string;
  DPTO_CCDGO?: string;
  DPTO_CNMBR?: string;
  ganador?: string;
  votos_ganador?: number;
  porcentaje_ganador?: number;
};

type DepartamentoFeature = {
  type: 'Feature';
  properties: DepartamentoProperties;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: PolygonCoordinates | MultiPolygonCoordinates;
  };
};

type DepartamentoFeatureCollection = {
  type: 'FeatureCollection';
  features: DepartamentoFeature[];
};

type TooltipState = {
  x: number;
  y: number;
  properties: DepartamentoProperties;
};

interface MapaElectoralProps {
  onDepartamentoClick?: (codigo: string, nombre: string) => void;
  departamentoSeleccionado?: string | null;
}

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 900;
const PADDING = 24;

const geojson = geojsonData as unknown as DepartamentoFeatureCollection;

function getCodigo(properties: DepartamentoProperties): string {
  const codigoDane = properties.dpto_ccdgo || properties.DPTO_CCDGO || '';
  return getCodigoElectoralDesdeDane(codigoDane);
}

function getNombre(properties: DepartamentoProperties): string {
  return properties.dpto_cnmbr || properties.DPTO_CNMBR || 'Departamento';
}

function extractPositions(feature: DepartamentoFeature): Position[] {
  if (feature.geometry.type === 'Polygon') {
    return (feature.geometry.coordinates as PolygonCoordinates).flat();
  }

  return (feature.geometry.coordinates as MultiPolygonCoordinates).flat(2);
}

function createProjection(features: DepartamentoFeature[]) {
  const positions = features.flatMap(extractPositions);
  const longitudes = positions.map(([lng]) => lng);
  const latitudes = positions.map(([, lat]) => lat);

  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);

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

function featureToPath(feature: DepartamentoFeature, project: (position: Position) => Position): string {
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
  departamentoSeleccionado,
}: MapaElectoralProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const paths = useMemo(() => {
    if (!geojson?.features.length) return [];

    const project = createProjection(geojson.features);
    return geojson.features.map((feature) => ({
      d: featureToPath(feature, project),
      properties: feature.properties,
      codigo: getCodigo(feature.properties),
      nombre: getNombre(feature.properties),
      color: getColorGanador(feature.properties.ganador || ''),
    }));
  }, []);

  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-gb-lg bg-gb-teal-50">
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
              stroke={isActive ? '#15252A' : '#ffffff'}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive ? 3 : 1.2}
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
          <p className="font-display font-semibold text-gb-ink">{getNombre(tooltip.properties)}</p>
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
