'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getColorGanador } from '@/lib/colors';
import { getCodigoElectoralDesdeDane, getCodigoDaneDesdElectoral } from '@/lib/departamentos';
import { formatNumber, formatPercent } from '@/lib/formatters';

import departamentosData from '../../../public/api/mapas/departamentos.json';
import polarizacionData from '../../../public/api/analisis/polarizacion.json';
import polarizacionMunicipalData from '../../../public/api/analisis/polarizacion-municipal.json';
import municipiosVotosData from '../../../public/api/departamentos/municipios.json';

type MunicipioVotos = {
  codigo: string;
  nombre: string;
  total_votos: number;
  ganador: string;
  partido_ganador: string;
  votos_ganador: number;
  porcentaje_ganador: number;
  segundo: string;
  votos_segundo: number;
  diferencia: number;
};

// Crear mapa de código electoral completo -> datos de votos municipales
const municipiosVotosMap = new Map<string, MunicipioVotos>();
Object.entries(municipiosVotosData as Record<string, MunicipioVotos[]>).forEach(([dptoCodigo, municipios]) => {
  municipios.forEach((mun) => {
    const codigoCompleto = `${dptoCodigo}${mun.codigo}`;
    municipiosVotosMap.set(codigoCompleto, mun);
  });
});

/**
 * Calcula el margen electoral de un municipio.
 * Margen = % ganador - % segundo = (votos_ganador - votos_segundo) / total_votos * 100
 */
function calcularMargenMunicipio(codigoElectoral: string): number {
  // Primero intentar con datos de polarización (más precisos)
  const margenPolarizacion = margenesMunicipios.get(codigoElectoral);
  if (margenPolarizacion !== undefined) return margenPolarizacion;

  // Si no existe, calcular desde datos de votos
  const munData = municipiosVotosMap.get(codigoElectoral);
  if (munData && munData.total_votos > 0) {
    const porcentajeSegundo = (munData.votos_segundo / munData.total_votos) * 100;
    return munData.porcentaje_ganador - porcentajeSegundo;
  }

  // Fallback
  return 20;
}

type MapMode = 'ganador' | 'polarizacion';

// Crear mapas de código -> margen para acceso rápido
const margenesDepartamentos = new Map<string, number>(
  (polarizacionData as { por_departamento: Array<{ codigo: string; margen: number }> }).por_departamento.map(
    (d) => [d.codigo, d.margen]
  )
);

const margenesMunicipios = new Map<string, number>(
  [
    ...(polarizacionMunicipalData as { municipios_mas_polarizados: Array<{ codigo_dep: string; codigo_mun: string; margen: number }> }).municipios_mas_polarizados,
    ...(polarizacionMunicipalData as { municipios_mas_competidos: Array<{ codigo_dep: string; codigo_mun: string; margen: number }> }).municipios_mas_competidos,
    ...(polarizacionMunicipalData as { bastiones_ganador: Array<{ codigo_dep: string; codigo_mun: string; margen: number }> }).bastiones_ganador,
    ...(polarizacionMunicipalData as { bastiones_segundo: Array<{ codigo_dep: string; codigo_mun: string; margen: number }> }).bastiones_segundo,
  ].map((m) => [`${m.codigo_dep}${m.codigo_mun}`, m.margen])
);

/**
 * Devuelve un color basado en el margen (% primero - % segundo).
 * Escala rojo-naranja (competido) → verde (bastión)
 */
function getColorPorMargen(margen: number): string {
  const m = Math.abs(margen);

  if (m < 2) return '#DC2626'; // ultra-competido - rojo
  if (m < 5) return '#EA580C'; // muy competido - naranja oscuro
  if (m < 10) return '#F97316'; // competido - naranja
  if (m < 20) return '#84CC16'; // ventaja clara - lima/verde claro
  if (m < 40) return '#22C55E'; // bastión - verde
  return '#15803D'; // bastión fuerte - verde oscuro
}

function getClasificacionMargen(margen: number): string {
  const m = Math.abs(margen);
  if (m < 2) return 'Ultra-competido';
  if (m < 10) return 'Competido';
  if (m < 20) return 'Ventaja clara';
  return 'Bastión';
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
  const [loadedDepartamento, setLoadedDepartamento] = useState<string | null>(null);

  // Cargar GeoJSON del departamento seleccionado (archivos divididos por depto)
  useEffect(() => {
    if (!departamentoSeleccionado) {
      // Reset cuando se deselecciona
      setMunicipiosGeoJSON(null);
      setLoadedDepartamento(null);
      return;
    }

    // Si ya cargamos este departamento, no volver a cargar
    if (loadedDepartamento === departamentoSeleccionado) return;

    // Convertir código electoral a DANE para cargar el archivo correcto
    const codigoDane = getCodigoDaneDesdElectoral(departamentoSeleccionado);

    // Cargar archivo específico del departamento (OPTIMIZADO: ~138KB vs 4.4MB)
    fetch(`/api/mapas/municipios/${codigoDane}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMunicipiosGeoJSON(data as FeatureCollection);
        setLoadedDepartamento(departamentoSeleccionado);
        setMunicipiosError(null);
      })
      .catch((err) => {
        console.error('Error cargando municipios:', err);
        setMunicipiosError('No se pudo cargar la desagregacion municipal.');
      });
  }, [departamentoSeleccionado, loadedDepartamento]);

  const isMunicipioView = Boolean(departamentoSeleccionado);

  const visibleFeatures = useMemo(() => {
    if (!departamentoSeleccionado) return departamentosGeoJSON.features;
    if (!municipiosGeoJSON) return [];

    // El archivo ya contiene solo los municipios del departamento (no hay que filtrar)
    return municipiosGeoJSON.features;
  }, [departamentoSeleccionado, municipiosGeoJSON]);

  const paths = useMemo(() => {
    if (!visibleFeatures.length) return [];

    const project = createProjection(visibleFeatures);
    return visibleFeatures.map((feature) => {
      const colorGanador = getColorGanador(feature.properties.ganador || '');
      const codigo = getCodigoFeature(feature.properties, isMunicipioView);

      // Obtener margen real de los datos de polarización o calcularlo de votos
      let margen: number;
      if (isMunicipioView) {
        // Para municipios: convertir código DANE a electoral
        const codigoDaneDepto = feature.properties.dpto_ccdgo || '';
        const codigoElectoralDepto = getCodigoElectoralDesdeDane(codigoDaneDepto);
        const codigoMun = feature.properties.mpio_ccdgo || '';
        const codigoElectoralCompleto = `${codigoElectoralDepto}${codigoMun}`;
        // Calcular margen (primero intenta polarización, luego datos de votos)
        margen = calcularMargenMunicipio(codigoElectoralCompleto);
      } else {
        // Para departamentos: usar código electoral
        margen = margenesDepartamentos.get(codigo) ?? 20;
      }

      return {
        d: featureToPath(feature, project),
        properties: feature.properties,
        codigo,
        nombre: getNombreFeature(feature.properties, isMunicipioView),
        colorGanador,
        colorPolarizacion: getColorPorMargen(margen),
        margen,
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
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-gb-lg bg-gb-teal-50">
      <div className="absolute left-2 top-2 sm:left-4 sm:top-4 z-10 flex max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)] flex-wrap items-center gap-1.5 sm:gap-2">
        <div className="rounded-gb-md border border-gb-border bg-white px-2 py-1.5 sm:px-3 sm:py-2 shadow-gb-sm">
          <p className="gb-eyebrow leading-none text-[10px] sm:text-xs">{isZoomed ? 'Municipal' : 'Departamental'}</p>
          <p className="mt-0.5 sm:mt-1 max-w-[140px] sm:max-w-[220px] truncate text-xs sm:text-sm font-semibold text-gb-ink">
            {mapTitle}
          </p>
        </div>

        {/* Tabs de modo */}
        <div className="flex rounded-gb-md border border-gb-border bg-white shadow-gb-sm overflow-hidden">
          <button
            type="button"
            className={`px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold transition ${
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
            className={`px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold transition ${
              mapMode === 'polarizacion'
                ? 'bg-gb-teal-700 text-white'
                : 'text-gb-slate hover:bg-gb-teal-50'
            }`}
            onClick={() => setMapMode('polarizacion')}
          >
            Margen
          </button>
        </div>

        {isZoomed && onReset && (
          <button
            className="rounded-gb-md border border-gb-border-strong bg-white px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-gb-slate shadow-gb-sm transition hover:border-gb-teal-600 hover:text-gb-teal-700"
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

      {tooltip && (() => {
        // Para municipios, obtener datos de votos desde el lookup
        // El GeoJSON usa códigos DANE, pero municipiosVotosData usa códigos electorales
        const codigoDane = tooltip.properties.dpto_ccdgo || '';
        const codigoElectoralDepto = getCodigoElectoralDesdeDane(codigoDane);
        const codigoMun = tooltip.properties.mpio_ccdgo || '';
        const codigoLookup = `${codigoElectoralDepto}${codigoMun}`;
        const munData = tooltip.isMunicipio ? municipiosVotosMap.get(codigoLookup) : null;

        // Usar datos del lookup para municipios, o propiedades directas para departamentos
        const ganador = tooltip.isMunicipio && munData ? munData.ganador : tooltip.properties.ganador;
        const votosGanador = tooltip.isMunicipio && munData ? munData.votos_ganador : tooltip.properties.votos_ganador;
        const porcentajeGanador = tooltip.isMunicipio && munData ? munData.porcentaje_ganador : tooltip.properties.porcentaje_ganador;
        const segundo = tooltip.isMunicipio && munData ? munData.segundo : tooltip.properties.segundo;
        const diferencia = tooltip.isMunicipio && munData ? munData.diferencia : tooltip.properties.diferencia;
        const totalVotos = tooltip.isMunicipio && munData ? munData.total_votos : tooltip.properties.total_votos;

        return (
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
                  Ganador: <span className="font-medium">{ganador || 'N/A'}</span>
                </p>
                <p className="font-mono text-gb-teal-700">
                  {formatNumber(votosGanador || 0)} votos (
                  {formatPercent(porcentajeGanador || 0)})
                </p>
                {segundo && (
                  <p className="mt-2 text-gb-slate">
                    Segundo: <span className="font-medium">{segundo}</span>
                  </p>
                )}
                {diferencia !== undefined ? (
                  <p className="font-mono text-gb-slate-muted">
                    Margen: {formatNumber(diferencia || 0)} votos
                  </p>
                ) : (
                  <p className="font-mono text-gb-slate-muted">
                    Total: {formatNumber(totalVotos || 0)} votos
                  </p>
                )}
              </>
            ) : (() => {
              // Calcular margen para el tooltip
              const codigoDepto = getCodigoDepartamento(tooltip.properties);
              const codigoElectoralCompleto = `${codigoElectoralDepto}${codigoMun}`;
              const margenTooltip = tooltip.isMunicipio
                ? calcularMargenMunicipio(codigoElectoralCompleto)
                : (margenesDepartamentos.get(codigoDepto) ?? 20);

              return (
                <>
                  <p className="mt-1 text-gb-slate">
                    Margen: <span className="font-mono font-semibold">{formatPercent(Math.abs(margenTooltip))}</span>
                  </p>
                  <p className="font-mono text-sm" style={{ color: getColorPorMargen(margenTooltip) }}>
                    {getClasificacionMargen(margenTooltip)}
                  </p>
                  <p className="mt-1 text-xs text-gb-slate-muted">
                    {formatNumber(totalVotos || 0)} votos totales
                  </p>
                </>
              );
            })()}
          </div>
        );
      })()}

      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 gb-card p-2 sm:p-3 text-[10px] sm:text-xs shadow-gb-sm">
        {mapMode === 'ganador' ? (
          <>
            <p className="gb-eyebrow mb-1.5 sm:mb-2 text-[9px] sm:text-xs">Ganador</p>
            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm" style={{ backgroundColor: '#1D4ED8' }} />
                <span className="text-gb-slate">De La Espriella</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm" style={{ backgroundColor: '#C2410C' }} />
                <span className="text-gb-slate">Cepeda</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm" style={{ backgroundColor: '#7C3AED' }} />
                <span className="text-gb-slate">Valencia</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="gb-eyebrow mb-1.5 sm:mb-2 text-[9px] sm:text-xs">Margen</p>
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-sm" style={{ backgroundColor: '#DC2626' }} />
                <span className="text-gb-slate">&lt;2%</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-sm" style={{ backgroundColor: '#F97316' }} />
                <span className="text-gb-slate">2-10%</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-sm" style={{ backgroundColor: '#84CC16' }} />
                <span className="text-gb-slate">10-20%</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-sm" style={{ backgroundColor: '#22C55E' }} />
                <span className="text-gb-slate">&gt;20%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
