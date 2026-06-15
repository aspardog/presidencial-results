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
      className="bg-white rounded-xl p-5 shadow-sm border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {esGanador ? 'Ganador' : 'Segundo Lugar'}
          </span>
          <h3 className="mt-1 break-words text-lg font-bold leading-tight text-gray-900">
            {nombre}
          </h3>
          <p className="mt-1 break-words text-sm text-gray-500">{partido}</p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-2xl font-bold" style={{ color }}>
            {formatPercent(porcentaje)}
          </p>
          <p className="text-sm text-gray-500">{formatNumber(votos)} votos</p>
        </div>
      </div>
    </div>
  );
}
