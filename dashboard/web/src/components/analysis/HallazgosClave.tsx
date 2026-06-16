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
  const deptoMasCompetido = claves.departamentos_competidos[0];
  const mayorVentaja = claves.ventajas_decisivas[0];

  return (
    <section className="mt-10">
      {/* Encabezado */}
      <header className="mb-6">
        <h2 className="font-display text-lg font-semibold text-gb-ink">
          Hallazgos clave
        </h2>
        <p className="mt-1 text-sm text-gb-slate-muted">
          Análisis de los resultados electorales
        </p>
      </header>

      {/* Lecturas principales - diseño editorial */}
      <div className="gb-card mb-6">
        <div className="grid gap-6 md:grid-cols-3 md:divide-x md:divide-gb-border">
          {claves.lectura.map((texto, index) => (
            <article key={index} className="md:px-6 first:md:pl-0 last:md:pr-0">
              <p className="text-sm leading-relaxed text-gb-slate">
                {texto}
              </p>
            </article>
          ))}
        </div>
      </div>

      {/* Métricas clave - estilo sobrio */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="gb-card">
          <p className="gb-eyebrow">Resultado nacional</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-gb-ink">
            {formatPercent(resumen.porcentaje_ganador)}
          </p>
          <p className="mt-1 text-sm text-gb-slate">
            {resumen.ganador.split(' ').slice(-2).join(' ')}
          </p>
          <p className="mt-3 border-t border-gb-border pt-3 text-xs font-mono text-gb-slate-muted">
            Ventaja de {formatNumber(margenVictoria)} votos
          </p>
        </div>

        <div className="gb-card">
          <p className="gb-eyebrow">Departamento más reñido</p>
          <p className="mt-2 font-display text-3xl font-semibold text-gb-ink">
            {deptoMasCompetido.nombre}
          </p>
          <p className="mt-1 text-sm text-gb-slate">
            Diferencia mínima
          </p>
          <p className="mt-3 border-t border-gb-border pt-3 text-xs font-mono text-gb-slate-muted">
            {formatNumber(deptoMasCompetido.diferencia)} votos ({formatPercent(deptoMasCompetido.margen_porcentual)})
          </p>
        </div>

        <div className="gb-card">
          <p className="gb-eyebrow">Mayor ventaja neta</p>
          <p className="mt-2 font-display text-3xl font-semibold text-gb-ink">
            {mayorVentaja.nombre}
          </p>
          <p className="mt-1 text-sm text-gb-slate">
            Definió la elección
          </p>
          <p className="mt-3 border-t border-gb-border pt-3 text-xs font-mono text-gb-slate-muted">
            +{formatNumber(mayorVentaja.ventaja)} votos netos
          </p>
        </div>

        <div className="gb-card">
          <p className="gb-eyebrow">Distribución territorial</p>
          <div className="mt-2 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gb-slate">De la Espriella</span>
              <span className="font-display text-xl font-semibold tabular-nums text-gb-ink">15</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gb-slate">Cepeda</span>
              <span className="font-display text-xl font-semibold tabular-nums text-gb-ink">18</span>
            </div>
          </div>
          <p className="mt-3 border-t border-gb-border pt-3 text-xs text-gb-slate-muted">
            Departamentos ganados
          </p>
        </div>
      </div>

      {/* Análisis territorial */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ventajas decisivas */}
        <div className="gb-card">
          <h3 className="gb-eyebrow mb-4">Donde se concentró la ventaja</h3>
          <div className="space-y-4">
            {claves.ventajas_decisivas.slice(0, 5).map((depto) => {
              const maxVentaja = claves.ventajas_decisivas[0].ventaja;
              const widthPercent = (depto.ventaja / maxVentaja) * 100;

              return (
                <div key={depto.codigo}>
                  <div className="flex items-baseline justify-between text-sm mb-2">
                    <span className="font-medium text-gb-ink">{depto.nombre}</span>
                    <span className="font-mono text-gb-slate-muted">
                      +{formatNumber(depto.ventaja)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gb-teal-100">
                    <div
                      className="h-full rounded-full bg-gb-teal-700"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Más competidos */}
        <div className="gb-card">
          <h3 className="gb-eyebrow mb-4">Elecciones más cerradas</h3>
          <div className="divide-y divide-gb-border">
            {claves.departamentos_competidos.slice(0, 5).map((depto) => (
              <div
                key={depto.codigo}
                className="flex items-baseline justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gb-ink">{depto.nombre}</p>
                  <p className="text-xs text-gb-slate-muted">
                    {depto.ganador.split(' ').pop()} / {depto.segundo.split(' ').pop()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-gb-ink">
                    {formatNumber(depto.diferencia)}
                  </p>
                  <p className="text-xs text-gb-slate-muted">
                    {formatPercent(depto.margen_porcentual)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fortalezas por candidato */}
      <div className="mt-6">
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
                      className="flex items-baseline justify-between text-sm"
                    >
                      <span className="text-gb-slate">{depto.nombre}</span>
                      <span className="font-mono text-gb-ink">
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
