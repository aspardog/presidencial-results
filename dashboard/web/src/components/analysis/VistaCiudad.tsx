'use client';

import { getColorGanador } from '@/lib/colors';
import { formatNumber, formatPercent } from '@/lib/formatters';
import MapaCiudad, { GeoFeatureCiudad, UnidadCiudad } from '@/components/maps/MapaCiudad';

interface Candidato { nombre: string; votos: number; porcentaje: number; }
interface Unidad extends UnidadCiudad {
  numero: number | null;
  votos_ganador: number;
  diferencia: number;
  candidatos: Candidato[];
}
export interface CiudadData {
  vuelta: string;
  slug: string;
  ciudad: string;
  resumen: {
    total_votos: number;
    votos_georreferenciados: number;
    votos_especiales: number;
    n_comunas: number;
    n_corregimientos: number;
    ganador: string;
    segundo: string;
    unidades_ganador: number;
    unidades_segundo: number;
  };
  unidades: Unidad[];
  especiales: Unidad[];
}

const apellido = (nombre: string) =>
  nombre.includes('CEPEDA') ? 'Cepeda' : nombre.includes('ESPRIELLA') ? 'De La Espriella' : nombre.split(' ').pop() || nombre;

interface Props {
  data: CiudadData;
  features: GeoFeatureCiudad[];
}

export default function VistaCiudad({ data, features }: Props) {
  const { resumen, unidades, ciudad } = data;
  const dataByCode = new Map<string, UnidadCiudad>(unidades.map((u) => [u.codigo, u]));

  let votosGanador = 0;
  let totalLoc = 0;
  unidades.forEach((u) => {
    totalLoc += u.total_votos;
    const c = u.candidatos.find((x) => x.nombre === resumen.ganador);
    if (c) votosGanador += c.votos;
  });
  const pctGanador = totalLoc > 0 ? (votosGanador / totalLoc) * 100 : 0;

  const comunas = unidades.filter((u) => u.tipo === 'comuna');
  const masRenida = [...comunas].sort((a, b) => Math.abs(a.margen) - Math.abs(b.margen))[0];
  const bastion = [...comunas].sort((a, b) => b.margen - a.margen)[0];
  const filas = [...unidades].sort((a, b) => b.total_votos - a.total_votos);
  const maxVotos = filas[0]?.total_votos || 1;

  const totalUnidades = resumen.n_comunas + resumen.n_corregimientos;
  const colorGanador = getColorGanador(resumen.ganador);

  return (
    <section>
      <header className="mb-4 sm:mb-6">
        <p className="gb-eyebrow">Vista · {ciudad}</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-gb-ink sm:text-2xl">{ciudad} por comuna</h2>
        <p className="mt-1.5 max-w-3xl text-sm text-gb-slate-muted">
          En {ciudad}, <span className="font-semibold text-gb-slate">{apellido(resumen.ganador)}</span> se impuso en{' '}
          {resumen.unidades_ganador} de {totalUnidades} unidades. El mapa muestra las {resumen.n_comunas} comunas urbanas;
          los {resumen.n_corregimientos} corregimientos rurales están en la tabla.
        </p>
      </header>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="gb-eyebrow text-xs">Ganó en {ciudad}</p>
          <p className="mt-1.5 font-display text-base font-semibold sm:text-xl" style={{ color: colorGanador }}>{apellido(resumen.ganador)}</p>
          <p className="mt-0.5 text-sm text-gb-slate">{formatPercent(pctGanador)}</p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="gb-eyebrow text-xs">Reparto</p>
          <p className="mt-1.5 font-display text-base font-semibold text-gb-ink sm:text-xl">{resumen.unidades_ganador} — {resumen.unidades_segundo}</p>
          <p className="mt-0.5 text-sm text-gb-slate">de {totalUnidades} unidades</p>
        </div>
        {masRenida && (
          <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
            <p className="gb-eyebrow text-xs">Comuna más reñida</p>
            <p className="mt-1.5 truncate font-display text-base font-semibold text-gb-ink sm:text-xl">{masRenida.nombre}</p>
            <p className="mt-0.5 text-sm text-gb-slate">{apellido(masRenida.ganador)} +{formatPercent(masRenida.margen)}</p>
          </div>
        )}
        {bastion && (
          <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
            <p className="gb-eyebrow text-xs">Bastión más fuerte</p>
            <p className="mt-1.5 truncate font-display text-base font-semibold text-gb-ink sm:text-xl">{bastion.nombre}</p>
            <p className="mt-0.5 text-sm text-gb-slate">{apellido(bastion.ganador)} +{formatPercent(bastion.margen)}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:items-stretch">
        <div className="lg:col-span-2">
          <div className="gb-card h-[460px] p-3 sm:h-[600px] sm:p-4">
            <MapaCiudad ciudad={ciudad} features={features} dataByCode={dataByCode} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <section className="gb-card flex h-[460px] flex-col p-4 sm:h-[600px]">
            <div className="mb-3">
              <p className="gb-eyebrow">Comunas y corregimientos</p>
              <p className="mt-1 text-xs text-gb-slate-muted">Barra = tamaño electoral (votos). Ordenadas de mayor a menor.</p>
            </div>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {filas.map((u) => {
                const color = getColorGanador(u.ganador);
                const ancho = Math.max((u.total_votos / maxVotos) * 100, 1.5);
                return (
                  <div key={u.codigo}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
                        <span className="truncate text-sm font-medium text-gb-ink">{u.nombre}</span>
                        {u.tipo === 'corregimiento' && <span className="shrink-0 rounded bg-gb-teal-50 px-1 font-mono text-[0.65rem] text-gb-slate-muted">rural</span>}
                        <span className="shrink-0 text-xs text-gb-slate-muted">{apellido(u.ganador)}</span>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-semibold" style={{ color }}>+{formatPercent(u.margen)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 pl-4">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gb-border/60">
                        <div className="h-full rounded-full" style={{ width: `${ancho}%`, backgroundColor: color }} />
                      </div>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-gb-slate-muted">{formatNumber(u.total_votos)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <p className="mt-3 text-xs text-gb-slate-muted">
        Los <strong className="font-semibold text-gb-slate">corregimientos rurales</strong> se excluyen del mapa (por su
        gran extensión geográfica), pero están en la tabla. No incluye {formatNumber(resumen.votos_especiales)} votos de
        puestos especiales (censo/cárceles), sin comuna. Porcentajes sobre votos válidos.
      </p>
    </section>
  );
}
