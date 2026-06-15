'use client';

import { ResponsivePie } from '@nivo/pie';
import { formatNumber, formatPercent } from '@/lib/formatters';

interface DonutParticipacionProps {
  validos: number;
  blancos: number;
  nulos: number;
  noMarcados: number;
}

export default function DonutParticipacion({
  validos,
  blancos,
  nulos,
  noMarcados,
}: DonutParticipacionProps) {
  const total = validos + blancos + nulos + noMarcados;

  const data = [
    { id: 'Válidos', value: validos, color: '#22C55E' },
    { id: 'Blancos', value: blancos, color: '#94A3B8' },
    { id: 'Nulos', value: nulos, color: '#EF4444' },
    { id: 'No marcados', value: noMarcados, color: '#F59E0B' },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center rounded-lg bg-gray-50 text-center">
        <div>
          <p className="text-sm font-semibold text-gray-700">Sin votos registrados</p>
          <p className="mt-1 text-xs text-gray-500">La distribución aparecerá cuando haya datos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[250px]">
      <ResponsivePie
        data={data}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.6}
        padAngle={2}
        cornerRadius={4}
        colors={{ datum: 'data.color' }}
        borderWidth={0}
        enableArcLinkLabels={false}
        arcLabel={(d) => `${((d.value / total) * 100).toFixed(0)}%`}
        arcLabelsTextColor="#ffffff"
        arcLabelsSkipAngle={15}
        tooltip={({ datum }) => (
          <div className="bg-white px-3 py-2 rounded shadow-lg border text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: datum.color }}
              />
              <span className="font-medium">{datum.id}</span>
            </div>
            <p className="mt-1">
              {formatNumber(datum.value)} ({formatPercent((datum.value / total) * 100)})
            </p>
          </div>
        )}
        legends={[]}
      />
      <div className="text-center -mt-[140px]">
        <p className="text-2xl font-bold text-gray-900">{formatNumber(total)}</p>
        <p className="text-sm text-gray-500">Total votos</p>
      </div>
    </div>
  );
}
