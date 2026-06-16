'use client';

import { formatNumber, formatPercent } from '@/lib/formatters';
import { getColorPartido } from '@/lib/colors';

interface CardGanadorProps {
  nombre: string;
  partido: string;
  votos: number;
  porcentaje: number;
  esGanador?: boolean;
}

export default function CardGanador({
  nombre,
  partido,
  votos,
  porcentaje,
  esGanador = true,
}: CardGanadorProps) {
  const color = getColorPartido(partido);

  return (
    <div
      className="gb-card border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="gb-eyebrow">
            {esGanador ? 'Ganador' : 'Segundo lugar'}
          </span>
          <h3 className="mt-1 break-words text-lg font-display font-semibold leading-tight text-gb-ink">
            {nombre}
          </h3>
          <p className="mt-1 break-words text-sm text-gb-slate-muted">{partido}</p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="font-display text-2xl font-semibold" style={{ color }}>
            {formatPercent(porcentaje)}<span className="text-gb-teal-700">*</span>
          </p>
          <p className="text-sm font-mono text-gb-slate-muted">{formatNumber(votos)} votos</p>
        </div>
      </div>
    </div>
  );
}
