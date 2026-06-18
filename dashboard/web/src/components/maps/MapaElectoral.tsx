'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getColorGanador } from '@/lib/colors';
import { getCodigoElectoralDesdeDane } from '@/lib/departamentos';
import { formatNumber, formatPercent } from '@/lib/formatters';

import departamentosData from '../../../public/api/mapas/departamentos.json';

type MapMode = 'ganador' | 'polarizacion';

/**
 * Devuelve un color basado en el porcentaje del ganador.
 * 50% = muy competido (rojo intenso)
 * 60% = competido (naranja)
 * 70% = ventaja clara (amarillo)
 * 80%+ = bastión (verde)
 */
function getColorPolarizacion(porcentajeGanador: number): string {
  const p = porcentajeGanador || 50;

  if (p < 52) return '#DC2626'; // ultra-competido - rojo
  if (p < 55) return '#EA580C'; // competido - naranja oscuro
  if (p < 60) return '#F97316'; // competido - naranja
  if (p < 65) return '#FBBF24'; // ventaja moderada - amarillo
  if (p < 70) return '#A3E635'; // ventaja clara - lima
  if (p < 80) return '#22C55E'; // bastión - verde
  return '#15803D'; // bastión fuerte - verde oscuro
}

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
  isMunicipio: boolean;
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

function getCodigoFeature(properties: FeatureProperties, isMunicipio: boolean): string {
  if (!isMunicipio) return getCodigoDepartamento(properties);
  if (properties.mpio_cdpmp) return properties.mpio_cdpmp;
  if (properties.dpto_ccdgo && properties.mpio_ccdgo) return `${properties.dpto_ccdgo}${properties.mpio_ccdgo}`;
  return '';
}

function getNombreFeature(properties: FeatureProperties, isMunicipio: boolean): string {
  return isMunicipio
    ? properties.mpio_cnmbr || 'Municipio'
    : getNombreDepartamento(properties);
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
  const [municipiosGeoJSON, setMunicipiosGeoJSON] = useState<FeatureCollection | null>(null);
  const [municipiosError, setMunicipiosError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('ganador');
  const municipiosRequestRef = useRef(false);

  useEffect(() => {
    if (!departamentoSeleccionado || municipiosGeoJSON || municipiosRequestRef.current) return;

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
        setMunicipiosError('No se pudo cargar la desagregacion municipal.');
      });
  }, [departamentoSeleccionado, municipiosGeoJSON]);

  const isMunicipioView = Boolean(departamentoSeleccionado);

  const visibleFeatures = useMemo(() => {
    if (!departamentoSeleccionado) return departamentosGeoJSON.features;
    if (!municipiosGeoJSON) return [];

    return municipiosGeoJSON.features.filter(
      (feature) => getCodigoDepartamento(feature.properties) === departamentoSeleccionado
    );
  }, [departamentoSeleccionado, municipiosGeoJSON]);

  const paths = useMemo(() => {
    if (!visibleFeatures.length) return [];

    const project = createProjection(visibleFeatures);
    return visibleFeatures.map((feature) => {
      const colorGanador = getColorGanador(feature.properties.ganador || '');
      const colorPolarizacion = getColorPolarizacion(feature.properties.porcentaje_ganador || 50);

      return {
        d: featureToPath(feature, project),
        properties: feature.properties,
        codigo: getCodigoFeature(feature.properties, isMunicipioView),
        nombre: getNombreFeature(feature.properties, isMunicipioView),
        colorGanador,
        colorPolarizacion,
      };
    });
  }, [isMunicipioView, visibleFeatures]);

  const isZoomed = Boolean(departamentoSeleccionado);
  const mapTitle = isZoomed && departamentoSeleccionadoNombre
    ? `Municipios de ${departamentoSeleccionadoNombre}`
    : 'Colombia por departamentos';
  const loadingMunicipios = isMunicipioView && !municipiosGeoJSON && !municipiosError;
  const emptyMunicipios = isMunicipioView && !loadingMunicipios && visibleFeatures.length === 0;

  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-gb-lg bg-gb-teal-50">
      <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2">
        <div className="rounded-gb-md border border-gb-border bg-white px-3 py-2 shadow-gb-sm">
          <p className="gb-eyebrow leading-none">{isZoomed ? 'Vista municipal' : 'Vista departamental'}</p>
          <p className="mt-1 max-w-[220px] truncate text-sm font-semibold text-gb-ink sm:max-w-[320px]">
            {mapTitle}
          </p>
        </div>

        {/* Tabs de modo */}
        <div className="flex rounded-gb-md border border-gb-border bg-white shadow-gb-sm overflow-hidden">
          <button
            type="button"
            className={`px-3 py-2 text-xs font-semibold transition ${
              mapMode === 'ganador'
                ? 'bg-gb-teal-700 text-white'
                : 'text-gb-slate hover:bg-gb-teal-50'
            }`}
            onClick={() => setMapMode('ganador')}
          >
            Ganador
          </button>
          <button
            type="button"
            className={`px-3 py-2 text-xs font-semibold transition ${
              mapMode === 'polarizacion'
                ? 'bg-gb-teal-700 text-white'
                : 'text-gb-slate hover:bg-gb-teal-50'
            }`}
            onClick={() => setMapMode('polarizacion')}
          >
            Competitividad
          </button>
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

      {loadingMunicipios && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gb-teal-50/80">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gb-teal-200 border-t-gb-teal-700"></div>
            <p className="mt-2 text-sm text-gb-slate-muted">Cargando municipios...</p>
          </div>
        </div>
      )}
      {municipiosError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gb-teal-50/90 px-6 text-center">
          <p className="text-sm font-medium text-gb-slate">{municipiosError}</p>
        </div>
      )}
      {emptyMunicipios && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gb-teal-50/90 px-6 text-center">
          <p className="text-sm font-medium text-gb-slate">No hay geometria municipal disponible para este departamento.</p>
        </div>
      )}

      <svg
        aria-label={`Mapa electoral de Colombia por ${isMunicipioView ? 'municipio' : 'departamento'}`}
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
        {paths.map(({ d, properties, codigo, nombre, colorGanador, colorPolarizacion }) => {
          const isActive = !isMunicipioView && departamentoSeleccionado === codigo;
          const isHovered = hoveredCode === codigo;
          const fillColor = mapMode === 'ganador' ? colorGanador : colorPolarizacion;

          return (
            <path
              key={codigo || nombre}
              d={d}
              fill={fillColor}
              fillOpacity={isActive || isHovered ? 0.92 : isMunicipioView ? 0.8 : 0.74}
              stroke={isHovered || isActive ? '#15252A' : '#ffffff'}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isHovered ? 1.5 : isMunicipioView ? 0.7 : isActive ? 3 : 1.2}
              className={`${isMunicipioView ? 'cursor-default' : 'cursor-pointer'} transition-opacity duration-150 outline-none focus-visible:stroke-gb-ink`}
              tabIndex={0}
              onClick={() => {
                if (!isMunicipioView && codigo) onDepartamentoClick?.(codigo, nombre);
              }}
              onFocus={(event) => {
                setHoveredCode(codigo);
                setTooltip({
                  x: event.currentTarget.getBoundingClientRect().left,
                  y: event.currentTarget.getBoundingClientRect().top,
                  properties,
                  isMunicipio: isMunicipioView,
                });
              }}
              onKeyDown={(event) => {
                if (!isMunicipioView && (event.key === 'Enter' || event.key === ' ') && codigo) {
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
                  isMunicipio: isMunicipioView,
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
            {getNombreFeature(tooltip.properties, tooltip.isMunicipio)}
          </p>
          {tooltip.isMunicipio && tooltip.properties.dpto_cnmbr && (
            <p className="text-xs text-gb-slate-muted">{tooltip.properties.dpto_cnmbr}</p>
          )}

          {mapMode === 'ganador' ? (
            <>
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
              {tooltip.properties.diferencia !== undefined ? (
                <p className="font-mono text-gb-slate-muted">
                  Margen: {formatNumber(tooltip.properties.diferencia || 0)} votos
                </p>
              ) : (
                <p className="font-mono text-gb-slate-muted">
                  Total: {formatNumber(tooltip.properties.total_votos || 0)} votos
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mt-1 text-gb-slate">
                Ganador con <span className="font-mono font-semibold">{formatPercent(tooltip.properties.porcentaje_ganador || 0)}</span>
              </p>
              <p className="font-mono text-sm" style={{ color: getColorPolarizacion(tooltip.properties.porcentaje_ganador || 50) }}>
                {(tooltip.properties.porcentaje_ganador || 50) < 52 ? 'Ultra-competido' :
                 (tooltip.properties.porcentaje_ganador || 50) < 60 ? 'Competido' :
                 (tooltip.properties.porcentaje_ganador || 50) < 70 ? 'Ventaja clara' : 'Bastión'}
              </p>
              <p className="mt-1 text-xs text-gb-slate-muted">
                {formatNumber(tooltip.properties.total_votos || 0)} votos totales
              </p>
            </>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 gb-card p-3 text-xs shadow-gb-sm">
        {mapMode === 'ganador' ? (
          <>
            <p className="gb-eyebrow mb-2">Ganador por {isMunicipioView ? 'municipio' : 'departamento'}</p>
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
          </>
        ) : (
          <>
            <p className="gb-eyebrow mb-2">Competitividad</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#DC2626' }} />
                <span className="text-gb-slate">&lt;52% Ultra-competido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#F97316' }} />
                <span className="text-gb-slate">52-60% Competido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#FBBF24' }} />
                <span className="text-gb-slate">60-70% Ventaja clara</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#22C55E' }} />
                <span className="text-gb-slate">&gt;70% Bastión</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
