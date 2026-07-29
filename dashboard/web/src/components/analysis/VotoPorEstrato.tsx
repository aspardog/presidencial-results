'use client';

import { formatNumber } from '@/lib/formatters';

interface CandBin { nombre: string; color: string; pct: number; }
interface Bin { estrato: number; votos: number; n: number; candidatos: CandBin[]; }
export interface EstratoData {
  ciudad: string;
  slug: string;
  nivel: 'puesto' | 'comuna';
  unidad: string;
  n: number;
  r: number;
  ganador: string;
  segundo: string;
  bins: Bin[];
}

const apellido = (nombre: string) =>
  nombre.includes('CEPEDA') ? 'Cepeda' : nombre.includes('ESPRIELLA') ? 'De La Espriella' : nombre.split(' ').pop() || nombre;

const FUENTE: Record<string, string> = {
  bogota: 'Catastro Bogotá (estrato por manzana).',
  cali: 'Datos abiertos de Cali (estratificación por comuna).',
  medellin: 'Estrato predominante por manzana 2018 (DANE).',
};

export default function VotoPorEstrato({ data }: { data: EstratoData }) {
  const bins = [...data.bins].sort((a, b) => a.estrato - b.estrato);
  // Candidato que crece con el estrato = el de mayor % en el estrato más alto.
  const top = bins[bins.length - 1];
  const sube = [...top.candidatos].sort((a, b) => b.pct - a.pct)[0];

  const comoTexto =
    data.nivel === 'puesto'
      ? `Se toma el voto de cada uno de los ${formatNumber(data.n)} puestos de votación y se le asigna el estrato promedio de las manzanas residenciales de su barrio (se asume que el votante reside cerca). Los puestos se agrupan por estrato (1 a 6) y se promedia el porcentaje de voto, ponderado por la cantidad de votos.`
      : `Se toma el voto de cada una de las ${data.n} comunas y su estrato (promedio de sus manzanas). Las comunas se agrupan por estrato (1 a 6) y se promedia el porcentaje de voto, ponderado por la cantidad de votos.`;

  return (
    <section className="mt-6 sm:mt-8">
      <header className="mb-3 sm:mb-4">
        <h3 className="font-display text-lg font-semibold text-gb-ink sm:text-xl">Voto por estrato</h3>
        <p className="mt-1 max-w-3xl text-sm text-gb-slate-muted">
          Cuanto más alto el estrato, más voto por{' '}
          <span className="font-semibold" style={{ color: sube.color }}>{apellido(sube.nombre)}</span>.
        </p>
      </header>

      <div className="gb-card">
        <div className="space-y-2 sm:space-y-2.5">
          {bins.map((bin) => (
            <div key={bin.estrato} className="flex items-center gap-2 sm:gap-3">
              <span className="w-20 shrink-0 whitespace-nowrap font-mono text-xs text-gb-slate sm:w-24 sm:text-sm">Estrato {bin.estrato}</span>
              <div className="flex h-7 flex-1 overflow-hidden rounded-gb-sm sm:h-8">
                {bin.candidatos.map((c) => (
                  <div
                    key={c.nombre}
                    className="flex items-center justify-center"
                    style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                    title={`${apellido(c.nombre)}: ${c.pct}%`}
                  >
                    {c.pct >= 13 && (
                      <span className="font-mono text-xs font-semibold text-white tabular-nums sm:text-sm">
                        {Math.round(c.pct)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <span className="hidden w-20 shrink-0 text-right font-mono text-xs text-gb-slate-muted sm:inline">
                {formatNumber(bin.votos)}
              </span>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gb-border pt-3 text-xs text-gb-slate">
          {top.candidatos.map((c) => (
            <span key={c.nombre} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
              {apellido(c.nombre)}
            </span>
          ))}
          <span className="text-gb-slate-muted">· barra = 100% de los votos válidos del estrato</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-gb-slate-muted">
        <strong className="font-semibold text-gb-slate">Nota:</strong> mide el estrato del{' '}
        {data.nivel === 'puesto' ? 'barrio del puesto' : 'de la comuna'}, no del votante.
      </p>
      <p className="mt-1 text-xs text-gb-slate-muted">
        <strong className="font-semibold text-gb-slate">Fuente del estrato:</strong>{' '}
        {FUENTE[data.slug] || `datos abiertos de ${data.ciudad}.`}
      </p>

      <details className="mt-1 text-xs text-gb-slate-muted">
        <summary className="cursor-pointer font-semibold text-gb-slate hover:text-gb-teal-700">¿Cómo se calculó?</summary>
        <div className="mt-2 max-w-3xl space-y-1.5">
          <p>{comoTexto}</p>
        </div>
      </details>
    </section>
  );
}
