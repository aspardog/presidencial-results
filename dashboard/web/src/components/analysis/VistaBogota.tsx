'use client';

import { getColorGanador } from '@/lib/colors';
import { formatNumber, formatPercent } from '@/lib/formatters';
import MapaBogotaLocalidades from '@/components/maps/MapaBogotaLocalidades';

import localidadesData from '../../../public/api/segunda/bogota/localidades.json';

interface Candidato {
  nombre: string;
  votos: number;
  porcentaje: number;
}
interface Localidad {
  codigo: string;
  nombre: string;
  total_votos: number;
  ganador: string;
  votos_ganador: number;
  porcentaje_ganador: number;
  segundo: string;
  diferencia: number;
  margen: number;
  candidatos: Candidato[];
}
interface BogotaData {
  vuelta: string;
  resumen: {
    total_votos: number;
    votos_georreferenciados: number;
    votos_especiales: number;
    n_localidades: number;
    ganador: string;
    segundo: string;
    localidades_ganador: number;
    localidades_segundo: number;
  };
  localidades: Localidad[];
}

const data = localidadesData as BogotaData;

const apellido = (nombre: string) =>
  nombre.includes('CEPEDA') ? 'Cepeda' : nombre.includes('ESPRIELLA') ? 'De La Espriella' : nombre.split(' ').pop() || nombre;

export default function VistaBogota() {
  const { resumen, localidades } = data;

  // % del ganador de Bogotá sobre el total georreferenciado.
  let votosGanador = 0;
  let totalLoc = 0;
  localidades.forEach((l) => {
    totalLoc += l.total_votos;
    const c = l.candidatos.find((x) => x.nombre === resumen.ganador);
    if (c) votosGanador += c.votos;
  });
  const pctGanador = totalLoc > 0 ? (votosGanador / totalLoc) * 100 : 0;

  const masRenida = [...localidades].sort((a, b) => Math.abs(a.margen) - Math.abs(b.margen))[0];
  const bastion = [...localidades].sort((a, b) => b.margen - a.margen)[0];
  const filas = [...localidades].sort((a, b) => b.total_votos - a.total_votos);
  const maxVotos = filas[0]?.total_votos || 1;
  const votosSumapaz = localidades.find((l) => l.codigo === '20')?.total_votos ?? 0;

  const colorGanadorBogota = getColorGanador(resumen.ganador);

  return (
    <section>
      <header className="mb-4 sm:mb-6">
        <p className="gb-eyebrow">Vista · Bogotá</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-gb-ink sm:text-2xl">
          Bogotá por localidad
        </h2>
        <p className="mt-1.5 max-w-3xl text-sm text-gb-slate-muted">
          Las {resumen.n_localidades} localidades, a partir de la zona electoral de cada mesa.
          Un gradiente norte-sur claro: el norte y noroccidente para{' '}
          <span className="font-semibold text-gb-slate">{apellido(resumen.segundo)}</span>,
          el sur para <span className="font-semibold text-gb-slate">{apellido(resumen.ganador)}</span>.
        </p>
      </header>

      {/* Síntesis */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="gb-eyebrow text-xs">Ganó en Bogotá</p>
          <p className="mt-1.5 font-display text-base font-semibold sm:text-xl" style={{ color: colorGanadorBogota }}>
            {apellido(resumen.ganador)}
          </p>
          <p className="mt-0.5 text-sm text-gb-slate">{formatPercent(pctGanador)}</p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="gb-eyebrow text-xs">Reparto</p>
          <p className="mt-1.5 font-display text-base font-semibold text-gb-ink sm:text-xl">
            {resumen.localidades_segundo} — {resumen.localidades_ganador}
          </p>
          <p className="mt-0.5 text-sm text-gb-slate">Cepeda vs De La Espriella</p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="gb-eyebrow text-xs">Más reñida</p>
          <p className="mt-1.5 truncate font-display text-base font-semibold text-gb-ink sm:text-xl">
            {masRenida.nombre}
          </p>
          <p className="mt-0.5 text-sm text-gb-slate">{apellido(masRenida.ganador)} +{formatPercent(masRenida.margen)}</p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="gb-eyebrow text-xs">Bastión más fuerte</p>
          <p className="mt-1.5 truncate font-display text-base font-semibold text-gb-ink sm:text-xl">
            {bastion.nombre}
          </p>
          <p className="mt-0.5 text-sm text-gb-slate">{apellido(bastion.ganador)} +{formatPercent(bastion.margen)}</p>
        </div>
      </div>

      {/* Mapa + tabla */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:items-stretch">
        <div className="lg:col-span-2">
          <div className="gb-card h-[460px] p-3 sm:h-[600px] sm:p-4">
            <MapaBogotaLocalidades />
          </div>
        </div>

        <div className="lg:col-span-1">
          <section className="gb-card flex h-[460px] flex-col p-4 sm:h-[600px]">
            <div className="mb-3">
              <p className="gb-eyebrow">Las 20 localidades</p>
              <p className="mt-1 text-xs text-gb-slate-muted">Barra = tamaño electoral (votos). Ordenadas de mayor a menor.</p>
            </div>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
              {filas.map((l) => {
                const color = getColorGanador(l.ganador);
                const ancho = Math.max((l.total_votos / maxVotos) * 100, 1.5);
                return (
                  <div key={l.codigo}>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
                        <span className="truncate text-sm font-medium text-gb-ink">{l.nombre}</span>
                        <span className="shrink-0 text-xs text-gb-slate-muted">{apellido(l.ganador)}</span>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-semibold" style={{ color }}>
                        +{formatPercent(l.margen)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 pl-4">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gb-border/60">
                        <div className="h-full rounded-full" style={{ width: `${ancho}%`, backgroundColor: color }} />
                      </div>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-gb-slate-muted">
                        {formatNumber(l.total_votos)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <p className="mt-3 text-xs text-gb-slate-muted">
        <strong className="font-semibold text-gb-slate">Sumapaz se excluyó del mapa</strong> (localidad rural, enorme
        geográficamente pero con solo {formatNumber(votosSumapaz)} votos), para que las localidades urbanas se lean
        bien; sí está en la lista de la derecha. Tampoco incluye{' '}
        {formatNumber(resumen.votos_especiales)} votos de puestos especiales (censo, cárceles, hospitales),
        sin localidad geográfica. Porcentajes sobre votos válidos.
      </p>
    </section>
  );
}
