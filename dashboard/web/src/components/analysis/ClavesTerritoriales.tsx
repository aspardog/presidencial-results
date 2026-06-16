'use client';

import { formatNumber, formatPercent } from '@/lib/formatters';
import { getColorPartido } from '@/lib/colors';
import type { ClavesTerritoriales } from '@/types/electoral';

// Importar datos directamente (build time)
import clavesData from '../../../public/api/analisis/claves-territoriales.json';

const data = clavesData as ClavesTerritoriales;

export default function ClavesTerritoriales() {
  const maxVentaja = Math.max(...data.ventajas_decisivas.map((item) => item.ventaja), 1);

  return (
    <section className="mt-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-gb-ink">Claves territoriales</h2>
        <p className="mt-1 text-sm text-gb-slate-muted">
          Lecturas para entender dónde fue competida la elección y qué territorios explican la diferencia nacional.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="gb-card">
          <h3 className="gb-eyebrow">
            Lectura electoral
          </h3>
          <div className="mt-4 space-y-3">
            {data.lectura.map((texto) => (
              <p key={texto} className="rounded-gb-md bg-gb-teal-50 p-3 text-sm leading-6 text-gb-slate">
                {texto}
              </p>
            ))}
          </div>
        </div>

        <div className="gb-card">
          <h3 className="gb-eyebrow">
            Departamentos más competidos
          </h3>
          <div className="mt-4 space-y-3">
            {data.departamentos_competidos.slice(0, 5).map((departamento) => (
              <div key={departamento.codigo} className="border-b border-gb-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gb-ink">{departamento.nombre}</p>
                    <p className="mt-1 text-xs text-gb-slate-muted">
                      {departamento.ganador} sobre {departamento.segundo}
                    </p>
                  </div>
                  <span className="gb-tag">
                    {formatPercent(departamento.margen_porcentual)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-mono text-gb-slate-muted">
                  {formatNumber(departamento.diferencia)} votos de diferencia
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="gb-card">
          <h3 className="gb-eyebrow">
            Dónde se definió la ventaja
          </h3>
          <div className="mt-4 space-y-4">
            {data.ventajas_decisivas.slice(0, 5).map((departamento) => (
              <div key={departamento.codigo}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gb-ink">{departamento.nombre}</span>
                  <span className="shrink-0 font-mono text-gb-teal-700">+{formatNumber(departamento.ventaja)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gb-teal-100">
                  <div
                    className="h-full rounded-full bg-gb-teal-700"
                    style={{ width: `${Math.max((departamento.ventaja / maxVentaja) * 100, 4)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gb-slate-muted">
                  {formatPercent(departamento.margen_porcentual)} de margen sobre el segundo nacional
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.fortalezas.map((candidato) => (
          <div key={candidato.nombre} className="gb-card">
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: getColorPartido(candidato.partido || '') }}
              />
              <div className="min-w-0">
                <h3 className="break-words text-sm font-semibold text-gb-ink">
                  {candidato.nombre}
                </h3>
                <p className="mt-1 text-xs font-mono text-gb-slate-muted">
                  {formatPercent(candidato.porcentaje_nacional)} nacional
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {candidato.departamentos.map((departamento) => (
                <div key={departamento.codigo} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gb-slate">{departamento.nombre}</p>
                    <p className="text-xs font-mono text-gb-slate-muted">{formatNumber(departamento.votos)} votos</p>
                  </div>
                  <span className="shrink-0 rounded-gb-sm bg-gb-teal-50 px-2 py-1 text-xs font-mono font-medium text-gb-teal-700">
                    {formatPercent(departamento.porcentaje)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
