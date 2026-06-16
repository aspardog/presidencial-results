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

      {/* Síntesis electoral - highlight cards */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gb-border bg-white p-4">
          <p className="text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Más reñido</p>
          <p className="mt-2 font-display text-xl font-semibold text-gb-ink">
            {claves.departamentos_competidos[0].nombre}
          </p>
          <p className="mt-1 text-sm text-gb-slate">
            {formatNumber(claves.departamentos_competidos[0].diferencia)} votos · {formatPercent(claves.departamentos_competidos[0].margen_porcentual)}
          </p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-4">
          <p className="text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Mayor ventaja</p>
          <p className="mt-2 font-display text-xl font-semibold text-gb-ink">
            {claves.ventajas_decisivas[0].nombre}
          </p>
          <p className="mt-1 text-sm text-gb-slate">
            +{formatNumber(claves.ventajas_decisivas[0].ventaja)} votos netos
          </p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-4">
          <p className="text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Territorios</p>
          <p className="mt-2 font-display text-xl font-semibold text-gb-ink">
            15 — 18
          </p>
          <p className="mt-1 text-sm text-gb-slate">
            {resumen.ganador.split(' ').pop()} vs {resumen.segundo.split(' ').pop()}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="gb-card">
          <div className="mb-5">
            <h3 className="gb-eyebrow">Dónde se concentró la ventaja</h3>
            <p className="mt-2 text-sm text-gb-slate-muted">
              Departamentos que más ampliaron la diferencia nacional.
            </p>
          </div>
          <div className="space-y-3">
            {claves.ventajas_decisivas.slice(0, 5).map((depto, index) => {
              const ordinal = `${index + 1}°`;
              const colorGanador = getColorPartido(
                depto.ganador_nacional.includes('ESPRIELLA') ? 'FIRMAS' :
                depto.ganador_nacional.includes('CEPEDA') ? 'PACTO' : ''
              );

              return (
                <div key={depto.codigo} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 font-mono text-xs text-gb-slate-muted">{ordinal}</span>
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: colorGanador }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-sm text-gb-ink truncate">{depto.nombre}</span>
                      <span className="shrink-0 font-mono text-sm text-gb-ink">
                        {formatPercent(depto.margen_porcentual)}
                      </span>
                    </div>
                    <p className="text-xs text-gb-slate-muted">
                      +{formatNumber(depto.ventaja)} votos de ventaja
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gb-card">
          <div className="mb-5">
            <h3 className="gb-eyebrow">Departamentos más competidos</h3>
            <p className="mt-2 text-sm text-gb-slate-muted">
              Territorios donde la elección tuvo menor margen.
            </p>
          </div>
          <div className="space-y-3">
            {claves.departamentos_competidos.slice(0, 5).map((depto, index) => {
              const ordinal = `${index + 1}°`;
              const ganadorApellido = depto.ganador.split(' ').pop();
              const segundoApellido = depto.segundo.split(' ').pop();
              const colorGanador = getColorPartido(
                depto.ganador.includes('ESPRIELLA') ? 'FIRMAS' :
                depto.ganador.includes('CEPEDA') ? 'PACTO' : ''
              );

              return (
                <div key={depto.codigo} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 font-mono text-xs text-gb-slate-muted">{ordinal}</span>
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: colorGanador }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-sm text-gb-ink truncate">{depto.nombre}</span>
                      <span className="shrink-0 font-mono text-sm text-gb-ink">
                        {formatPercent(depto.margen_porcentual)}
                      </span>
                    </div>
                    <p className="text-xs text-gb-slate-muted">
                      {formatNumber(depto.diferencia)} votos · {ganadorApellido} sobre {segundoApellido}
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
              <div
                key={candidato.nombre}
                className="relative overflow-hidden rounded-lg border border-gb-border bg-white"
              >
                {/* Borde lateral con color del candidato */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: color }}
                />
                <div className="p-5 pl-6">
                  <div className="flex items-baseline justify-between gap-3 mb-4">
                    <p className="font-display text-lg font-semibold text-gb-ink">{apellido}</p>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-medium text-white"
                      style={{ backgroundColor: color }}
                    >
                      {formatPercent(candidato.porcentaje_nacional)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {candidato.departamentos.map((depto, index) => (
                      <div
                        key={depto.codigo}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="shrink-0 font-mono text-xs text-gb-slate-muted">{index + 1}.</span>
                          <span className="truncate text-gb-slate">{depto.nombre}</span>
                        </div>
                        <span className="shrink-0 font-mono text-sm font-medium" style={{ color }}>
                          {formatPercent(depto.porcentaje)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
