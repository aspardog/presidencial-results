'use client';

import { formatNumber, formatPercent } from '@/lib/formatters';
import { getColorPartido } from '@/lib/colors';
import type { ClavesTerritoriales, ResumenNacional } from '@/types/electoral';

// Importar datos estáticos
import clavesData from '../../../public/api/analisis/claves-territoriales.json';
import resumenData from '../../../public/api/nacional/resumen.json';

const claves = clavesData as ClavesTerritoriales;
const resumen = resumenData as ResumenNacional;

export default function HallazgosClave() {
  const margenVictoria = resumen.votos_ganador - resumen.votos_segundo;
  const maxVentaja = Math.max(...claves.ventajas_decisivas.map((depto) => depto.ventaja), 1);

  return (
    <section className="mt-10">
      <header className="mb-6">
        <h2 className="font-display text-lg font-semibold text-gb-ink">
          Hallazgos clave
        </h2>
        <p className="mt-1 text-sm text-gb-slate-muted">
          Lectura nacional y territorial de los resultados electorales
        </p>
      </header>

      {/* Hero: Resultado Nacional */}
      <div className="gb-card">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="gb-eyebrow">Resultado nacional</p>
            <p className="mt-2 font-display text-5xl font-semibold tabular-nums text-gb-ink">
              {formatPercent(resumen.porcentaje_ganador)}
            </p>
            <p className="mt-2 text-gb-slate">
              {resumen.ganador}
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-mono text-2xl font-semibold text-gb-teal-700">
              +{formatNumber(margenVictoria)}
            </p>
            <p className="mt-1 text-sm text-gb-slate-muted">
              votos de ventaja
            </p>
          </div>
        </div>
      </div>

      {/* Síntesis electoral */}
      <div className="gb-card mt-4">
        <p className="gb-eyebrow">Síntesis electoral</p>
        <ul className="mt-4 space-y-3">
          {claves.lectura.map((texto) => (
            <li key={texto} className="flex gap-3 text-sm leading-relaxed text-gb-slate">
              <span className="shrink-0 text-gb-teal-700 font-medium">—</span>
              <span>{texto}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="gb-card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="gb-eyebrow">Dónde se concentró la ventaja</h3>
              <p className="mt-2 text-sm text-gb-slate-muted">
                Departamentos que más ampliaron la diferencia nacional.
              </p>
            </div>
            <span className="gb-tag shrink-0">Top 5</span>
          </div>
          <div className="space-y-4">
            {claves.ventajas_decisivas.slice(0, 5).map((depto, index) => {
              const widthPercent = Math.max((depto.ventaja / maxVentaja) * 100, 4);
              const isFirst = index === 0;

              return (
                <div key={depto.codigo} className={isFirst ? 'pb-4 border-b border-gb-border' : ''}>
                  <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                    <span className={`font-medium ${isFirst ? 'text-lg text-gb-ink' : 'text-gb-ink'}`}>
                      {isFirst && <span className="text-gb-teal-700 mr-2">1°</span>}
                      {depto.nombre}
                    </span>
                    <span className={`shrink-0 font-mono ${isFirst ? 'text-lg text-gb-teal-700' : 'text-gb-teal-700'}`}>
                      +{formatNumber(depto.ventaja)}
                    </span>
                  </div>
                  <div className={`overflow-hidden rounded-full bg-gb-teal-100 ${isFirst ? 'h-3' : 'h-2'}`}>
                    <div
                      className="h-full rounded-full bg-gb-teal-700"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gb-slate-muted">
                    {formatPercent(depto.margen_porcentual)} de margen sobre el segundo nacional
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gb-card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="gb-eyebrow">Departamentos más competidos</h3>
              <p className="mt-2 text-sm text-gb-slate-muted">
                Territorios donde la elección tuvo menor margen.
              </p>
            </div>
            <span className="gb-tag shrink-0">Top 5</span>
          </div>
          <div className="divide-y divide-gb-border">
            {claves.departamentos_competidos.slice(0, 5).map((depto, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={depto.codigo}
                  className={`flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0 ${isFirst ? 'pb-4' : ''}`}
                >
                  <div className="min-w-0">
                    <p className={`font-medium text-gb-ink ${isFirst ? 'text-lg' : ''}`}>
                      {isFirst && <span className="text-gb-teal-700 mr-2">1°</span>}
                      {depto.nombre}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gb-slate-muted">
                      {depto.ganador} sobre {depto.segundo}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-mono text-gb-ink ${isFirst ? 'text-lg' : 'text-sm'}`}>
                      {formatPercent(depto.margen_porcentual)}
                    </p>
                    <p className="mt-1 text-xs font-mono text-gb-slate-muted">
                      {formatNumber(depto.diferencia)} votos
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="gb-eyebrow mb-4">Bastiones electorales</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {claves.fortalezas.map((candidato) => {
            const color = getColorPartido(candidato.partido || '');
            const apellido = candidato.nombre.split(' ').slice(-2).join(' ');

            return (
              <div key={candidato.nombre} className="gb-card">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gb-border">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div>
                    <p className="font-medium text-gb-ink">{apellido}</p>
                    <p className="text-xs font-mono text-gb-slate-muted">
                      {formatPercent(candidato.porcentaje_nacional)} nacional
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {candidato.departamentos.map((depto) => (
                    <div
                      key={depto.codigo}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-gb-slate">{depto.nombre}</p>
                        <p className="text-xs font-mono text-gb-slate-muted">
                          {formatNumber(depto.votos)} votos
                        </p>
                      </div>
                      <span className="shrink-0 rounded-gb-sm bg-gb-teal-50 px-2 py-1 font-mono text-xs font-medium text-gb-teal-700">
                        {formatPercent(depto.porcentaje)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
