'use client';

import { useMemo, useState } from 'react';
import { getColorGanador } from '@/lib/colors';
import { formatNumber, formatPercent } from '@/lib/formatters';

// Geometría (compartida) + datos de votos por localidad (SEGUNDA vuelta).
import geoData from '../../../public/api/mapas/bogota-localidades.json';
import localidadesData from '../../../public/api/segunda/bogota/localidades.json';

// ── Tipos ────────────────────────────────────────────────────────────────────
type Position = [number, number];
type GeoFeature = {
  type: 'Feature';
  properties: { codigo: string; nombre: string };
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
};
type FeatureCollection = { type: 'FeatureCollection'; features: GeoFeature[] };

type Localidad = {
  codigo: string;
  nombre: string;
  total_votos: number;
  ganador: string;
  partido_ganador: string;
  votos_ganador: number;
  porcentaje_ganador: number;
  segundo: string;
  diferencia: number;
  margen: number;
};

type MapMode = 'ganador' | 'margen';

// ── Proyección (equirectangular, ajustada al bounding box) ───────────────────
const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 900;
const PADDING = 24;

function forEachPosition(feature: GeoFeature, cb: (p: Position) => void) {
  const coords = feature.geometry.coordinates as unknown;
  const rings = feature.geometry.type === 'Polygon' ? [coords as number[][][]] : (coords as number[][][][]);
  for (const polygon of rings) {
    for (const ring of polygon) {
      for (const p of ring) cb(p as Position);
    }
  }
}

function createProjection(features: GeoFeature[]) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const f of features) {
    forEachPosition(f, ([lng, lat]) => {
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    });
  }
  const scale = Math.min(
    (VIEWBOX_WIDTH - PADDING * 2) / (maxLng - minLng),
    (VIEWBOX_HEIGHT - PADDING * 2) / (maxLat - minLat)
  );
  const offsetX = (VIEWBOX_WIDTH - (maxLng - minLng) * scale) / 2;
  const offsetY = (VIEWBOX_HEIGHT - (maxLat - minLat) * scale) / 2;
  return ([lng, lat]: Position): Position => [
    offsetX + (lng - minLng) * scale,
    offsetY + (maxLat - lat) * scale,
  ];
}

function ringToPath(ring: number[][], project: (p: Position) => Position): string {
  return ring
    .map((p, i) => {
      const [x, y] = project(p as Position);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ') + ' Z';
}

function featureToPath(feature: GeoFeature, project: (p: Position) => Position): string {
  const coords = feature.geometry.coordinates as unknown;
  if (feature.geometry.type === 'Polygon') {
    return (coords as number[][][]).map((ring) => ringToPath(ring, project)).join(' ');
  }
  return (coords as number[][][][]).flatMap((poly) => poly.map((ring) => ringToPath(ring, project))).join(' ');
}

// ── Color por margen (mismo esquema que el mapa nacional) ────────────────────
function getColorPorMargen(margen: number): string {
  const m = Math.abs(margen);
  if (m < 2) return '#DC2626';
  if (m < 5) return '#EA580C';
  if (m < 10) return '#F97316';
  if (m < 20) return '#84CC16';
  if (m < 40) return '#22C55E';
  return '#15803D';
}

// ── Datos ────────────────────────────────────────────────────────────────────
const geo = geoData as unknown as FeatureCollection;
const localidades = (localidadesData as { localidades: Localidad[] }).localidades;
const dataByCode = new Map(localidades.map((l) => [l.codigo, l]));

const apellido = (nombre: string) =>
  nombre.includes('CEPEDA') ? 'Cepeda' : nombre.includes('ESPRIELLA') ? 'De La Espriella' : nombre;

type TooltipState = { x: number; y: number; loc: Localidad };

export default function MapaBogotaLocalidades() {
  const [mapMode, setMapMode] = useState<MapMode>('ganador');
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const paths = useMemo(() => {
    // Sumapaz (código 20) es rural y enorme: aplasta las 19 localidades urbanas.
    // Se excluye del mapa (queda en la tabla) para que el Bogotá urbano se lea bien.
    const featuresMapa = geo.features.filter((f) => f.properties.codigo !== '20');
    const project = createProjection(featuresMapa);
    return featuresMapa.map((f) => ({
      codigo: f.properties.codigo,
      loc: dataByCode.get(f.properties.codigo),
      d: featureToPath(f, project),
    }));
  }, []);

  return (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-gb-lg bg-gb-teal-50">
      {/* Controles: título + modo */}
      <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center gap-2 sm:left-4 sm:top-4">
        <div className="rounded-gb-md border border-gb-border bg-white px-2 py-1.5 shadow-gb-sm sm:px-3 sm:py-2">
          <p className="gb-eyebrow leading-none">Bogotá urbana</p>
          <p className="mt-0.5 text-xs font-semibold text-gb-ink sm:text-sm sm:mt-1">19 localidades</p>
          <p className="text-[0.7rem] text-gb-slate-muted">Sumapaz (rural): en la tabla</p>
        </div>
        <div className="flex overflow-hidden rounded-gb-md border border-gb-border bg-white shadow-gb-sm">
          {(['ganador', 'margen'] as MapMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMapMode(m)}
              className={`px-2 py-1.5 text-xs font-semibold transition sm:px-3 sm:py-2 ${
                mapMode === m ? 'bg-gb-teal-700 text-white' : 'text-gb-slate hover:text-gb-teal-700'
              }`}
            >
              {m === 'ganador' ? 'Ganador' : 'Margen'}
            </button>
          ))}
        </div>
      </div>

      <svg
        aria-label="Mapa electoral de Bogotá por localidad"
        role="img"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        onMouseLeave={() => { setHovered(null); setTooltip(null); }}
      >
        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="#F1F8F9" />
        {paths.map(({ codigo, loc, d }) => {
          const fill = !loc
            ? '#E4E9EA'
            : mapMode === 'ganador'
              ? getColorGanador(loc.ganador)
              : getColorPorMargen(loc.margen);
          const isHovered = hovered === codigo;
          return (
            <path
              key={codigo}
              d={d}
              fill={fill}
              stroke="#FFFFFF"
              strokeWidth={isHovered ? 2.4 : 1}
              opacity={isHovered ? 1 : 0.92}
              className="cursor-pointer transition-[opacity,stroke-width]"
              onMouseEnter={() => setHovered(codigo)}
              onMouseMove={(e) => loc && setTooltip({ x: e.clientX, y: e.clientY, loc })}
              onMouseLeave={() => { setHovered(null); setTooltip(null); }}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-[260px] gb-card px-3 py-2 text-sm shadow-gb-sm"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <p className="font-display font-semibold text-gb-ink">{tooltip.loc.nombre}</p>
          <p className="mt-1 text-xs text-gb-slate">
            Ganó <span className="font-semibold" style={{ color: getColorGanador(tooltip.loc.ganador) }}>{apellido(tooltip.loc.ganador)}</span>
            {' · '}{formatPercent(tooltip.loc.porcentaje_ganador)}
          </p>
          <p className="mt-1 font-mono text-xs" style={{ color: getColorPorMargen(tooltip.loc.margen) }}>
            Margen {formatPercent(tooltip.loc.margen)}
          </p>
          <p className="mt-1 font-mono text-xs text-gb-slate-muted">{formatNumber(tooltip.loc.total_votos)} votos</p>
        </div>
      )}

      {/* Leyenda */}
      <div className="absolute bottom-2 left-2 z-10 gb-card p-2 text-xs shadow-gb-sm sm:bottom-4 sm:left-4 sm:p-3">
        {mapMode === 'ganador' ? (
          <>
            <p className="gb-eyebrow mb-1.5 text-xs sm:mb-2">Ganador</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3" style={{ backgroundColor: '#1D4ED8' }} />
                <span className="text-gb-slate">De La Espriella</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3" style={{ backgroundColor: '#C2410C' }} />
                <span className="text-gb-slate">Cepeda</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="gb-eyebrow mb-1.5 text-xs sm:mb-2">Margen</p>
            <div className="space-y-1">
              {[
                { c: '#DC2626', t: '< 2% (reñido)' },
                { c: '#F97316', t: '2–10%' },
                { c: '#84CC16', t: '10–20%' },
                { c: '#15803D', t: '> 40% (bastión)' },
              ].map((x) => (
                <div key={x.c} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm sm:h-2.5 sm:w-2.5" style={{ backgroundColor: x.c }} />
                  <span className="text-gb-slate">{x.t}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
