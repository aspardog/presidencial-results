'use client';

import { formatNumber, formatPercent } from '@/lib/formatters';
import type { CandidatoNacional, ResumenNacional } from '@/types/electoral';

import resumenData from '../../../public/api/segunda/nacional/resumen.json';
import candidatosData from '../../../public/api/segunda/nacional/candidatos.json';

const resumen = resumenData as ResumenNacional;
const candidatos = candidatosData as CandidatoNacional[];

// Nombre compacto y legible (coincide con el criterio de Comparativa).
const nombreCorto = (nombre: string) => {
  if (nombre.includes('CEPEDA')) return 'Iván Cepeda';
  if (nombre.includes('ESPRIELLA')) return 'Abelardo de la Espriella';
  return nombre
    .toLowerCase()
    .split(' ')
    .slice(0, 2)
    .join(' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Hero del resultado nacional (2ª vuelta): el duelo 50,15 vs 49,85 a gran
 * escala. Es lo único que se agranda de forma marcada — cuenta de un vistazo
 * lo esencial: quién ganó y por qué margen tan estrecho.
 */
export default function HeroResultado() {
  const ganador = candidatos[0];
  const segundo = candidatos[1];
  if (!ganador || !segundo) return null;

  const margen = resumen.diferencia;
  const diffPP = ganador.porcentaje - segundo.porcentaje;
  const porMil = Math.max(1, Math.round((margen / resumen.votos_validos) * 1000));

  return (
    <section className="gb-card" aria-label="Resultado nacional de segunda vuelta">
      <p className="gb-eyebrow">Resultado · 2ª vuelta</p>

      {/* Duelo cara a cara */}
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-6">
        {/* Ganador */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: ganador.color }} aria-hidden />
            <span className="truncate font-display text-sm font-semibold text-gb-ink sm:text-lg">
              {nombreCorto(ganador.nombre)}
            </span>
            <span className="hidden shrink-0 rounded-full bg-gb-teal-700/10 px-2 py-0.5 font-mono text-xs font-semibold uppercase text-gb-teal-700 sm:inline">
              Ganador
            </span>
          </div>
          <p
            className="mt-1 font-display text-3xl font-semibold leading-none tabular-nums sm:text-4xl lg:text-5xl"
            style={{ color: ganador.color }}
          >
            {formatPercent(ganador.porcentaje, 2)}
          </p>
          <p className="mt-1.5 font-mono text-xs text-gb-slate-muted sm:text-sm">
            {formatNumber(ganador.votos)} votos
          </p>
        </div>

        {/* vs */}
        <div className="pb-3 font-display text-lg font-normal text-gb-slate-muted sm:pb-6 sm:text-2xl" aria-hidden>
          vs
        </div>

        {/* Segundo */}
        <div className="min-w-0 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="truncate font-display text-sm font-semibold text-gb-ink sm:text-lg">
              {nombreCorto(segundo.nombre)}
            </span>
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: segundo.color }} aria-hidden />
          </div>
          <p
            className="mt-1 font-display text-3xl font-semibold leading-none tabular-nums sm:text-4xl lg:text-5xl"
            style={{ color: segundo.color }}
          >
            {formatPercent(segundo.porcentaje, 2)}
          </p>
          <p className="mt-1.5 font-mono text-xs text-gb-slate-muted sm:text-sm">
            {formatNumber(segundo.votos)} votos
          </p>
        </div>
      </div>

      {/* Barra dividida — muestra lo parejo del reparto */}
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full sm:mt-6 sm:h-4">
        <div style={{ width: `${ganador.porcentaje}%`, backgroundColor: ganador.color }} />
        <div style={{ width: `${segundo.porcentaje}%`, backgroundColor: segundo.color }} />
      </div>

      {/* El golpe: el margen */}
      <p className="mt-4 text-center font-mono text-sm text-gb-slate sm:text-base">
        <span className="text-gb-slate-muted">Diferencia</span>{' '}
        <strong className="font-semibold text-gb-ink">{formatNumber(margen)} votos</strong>
        {' · '}{diffPP.toFixed(2)} pp{' · '}
        <span className="text-gb-slate-muted">{porMil} de cada 1.000 votos</span>
      </p>
      <p className="mt-2 text-center text-xs text-gb-slate-muted">
        Porcentaje sobre votos válidos · no incluye el exterior
      </p>
    </section>
  );
}
