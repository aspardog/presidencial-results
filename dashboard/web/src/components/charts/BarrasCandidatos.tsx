'use client';

import { ResponsiveBar } from '@nivo/bar';
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
  const data = candidatos.slice(0, maxVisible).map((c) => ({
    nombre: c.nombre.split(' ').slice(0, 2).join(' '),
    votos: c.votos,
    porcentaje: c.porcentaje,
    color: c.color,
    nombreCompleto: c.nombre,
    partido: c.partido,
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveBar
        data={data}
        keys={['votos']}
        indexBy="nombre"
        layout="horizontal"
        margin={{ top: 10, right: 20, bottom: 30, left: 120 }}
        padding={0.3}
        colors={({ data }) => data.color as string}
        borderRadius={4}
        enableGridY={false}
        enableLabel={false}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 10,
          format: (v) => `${(Number(v) / 1000000).toFixed(1)}M`,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
        }}
        tooltip={({ data }) => (
          <div className="gb-card px-3 py-2 text-sm shadow-gb-sm">
            <p className="font-display font-semibold text-gb-ink">{data.nombreCompleto as string}</p>
            <p className="text-gb-slate-muted text-xs">{data.partido as string}</p>
            <p className="mt-1 font-mono text-gb-teal-700">
              {formatNumber(data.votos as number)} votos ({formatPercent(data.porcentaje as number)})
            </p>
          </div>
        )}
        theme={{
          axis: {
            ticks: {
              text: {
                fontFamily: 'var(--gb-font-body)',
                fontSize: 12,
                fill: '#5E7074',
              },
            },
          },
        }}
      />
    </div>
  );
}
