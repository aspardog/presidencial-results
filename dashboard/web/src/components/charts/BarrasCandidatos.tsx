'use client';

import type { CandidatoNacional, CandidatoDepartamento } from '@/types/electoral';
import { formatNumber, formatPercent } from '@/lib/formatters';

interface BarrasCandidatosProps {
  candidatos: (CandidatoNacional | CandidatoDepartamento)[];
  maxVisible?: number;
}

export default function BarrasCandidatos({
  candidatos,
  maxVisible = 6,
}: BarrasCandidatosProps) {
  const data = candidatos.slice(0, maxVisible);
  const maxVotos = Math.max(...data.map((candidato) => candidato.votos), 1);

  return (
    <div className="flex h-[300px] flex-col justify-evenly gap-2" role="list" aria-label="Votos por candidato">
      {data.map((candidato) => {
        const ancho = Math.max((candidato.votos / maxVotos) * 100, 1);

        return (
          <div key={candidato.nombre} className="grid grid-cols-[7.5rem_1fr] items-center gap-3" role="listitem">
            <div className="min-w-0 text-right">
              <p className="truncate text-xs font-semibold text-gb-slate" title={candidato.nombre}>
                {candidato.nombre}
              </p>
              <p className="font-mono text-[10px] text-gb-slate-muted">
                {formatPercent(candidato.porcentaje)}
              </p>
            </div>
            <div
              className="h-8 overflow-hidden rounded-gb-md bg-gb-teal-50"
              title={`${candidato.nombre} — ${candidato.partido}: ${formatNumber(candidato.votos)} votos (${formatPercent(candidato.porcentaje)})`}
            >
              <div
                aria-label={`${candidato.nombre}: ${formatNumber(candidato.votos)} votos`}
                className="flex h-full min-w-1 items-center justify-end rounded-gb-md px-2 transition-[width]"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={maxVotos}
                aria-valuenow={candidato.votos}
                style={{ width: `${ancho}%`, backgroundColor: candidato.color }}
              >
                <span className="whitespace-nowrap font-mono text-[10px] font-semibold text-white drop-shadow-sm">
                  {formatNumber(candidato.votos)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
