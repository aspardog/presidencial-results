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

export default function VotoPorEstrato({ data }: { data: EstratoData }) {
  const bins = [...data.bins].sort((a, b) => a.estrato - b.estrato);
  // Candidato que crece con el estrato = el de mayor % en el estrato más alto.
  const top = bins[bins.length - 1];
  const sube = [...top.candidatos].sort((a, b) => b.pct - a.pct)[0];
  const nivelTxt = data.nivel === 'puesto' ? `nivel puesto/barrio · ${formatNumber(data.n)} puestos` : `nivel comuna · ${data.n} comunas`;

  return (
    <section className="mt-6 sm:mt-8">
      <header className="mb-3 sm:mb-4">
        <p className="gb-eyebrow">Voto por estrato</p>
        <p className="mt-1 max-w-3xl text-sm text-gb-slate-muted">
          Cuanto más alto el estrato, más voto por{' '}
          <span className="font-semibold" style={{ color: sube.color }}>{apellido(sube.nombre)}</span>.
          Correlación <strong className="font-semibold text-gb-ink">r = {data.r.toFixed(2)}</strong>
          {' '}({nivelTxt}).
        </p>
      </header>

      <div className="gb-card">
        <div className="space-y-2 sm:space-y-2.5">
          {bins.map((bin) => (
            <div key={bin.estrato} className="flex items-center gap-2 sm:gap-3">
              <span className="w-16 shrink-0 font-mono text-xs text-gb-slate sm:text-sm">Estrato {bin.estrato}</span>
              <div className="flex h-6 flex-1 overflow-hidden rounded-gb-sm sm:h-7">
                {bin.candidatos.map((c) => (
                  <div
                    key={c.nombre}
                    className="flex items-center justify-center"
                    style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                    title={`${apellido(c.nombre)}: ${c.pct}%`}
                  >
                    {c.pct >= 12 && (
                      <span className="font-mono text-xs font-semibold text-white tabular-nums">{Math.round(c.pct)}</span>
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
        <strong className="font-semibold text-gb-slate">Ecológico:</strong> mide el estrato del{' '}
        {data.nivel === 'puesto' ? 'barrio del puesto (se asume que el votante reside cerca)' : 'de la comuna'},
        no del votante. Estrato de datos abiertos ({data.slug === 'bogota' ? 'Catastro Bogotá' : 'Alcaldía de ' + data.ciudad}).
      </p>
    </section>
  );
}
