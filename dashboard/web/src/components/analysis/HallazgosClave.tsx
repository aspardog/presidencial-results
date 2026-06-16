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
  // Calcular hallazgos
  const margenVictoria = resumen.votos_ganador - resumen.votos_segundo;
  const margenPorcentual = resumen.porcentaje_ganador - (resumen.votos_segundo / resumen.total_votos * 100);

  const deptoMasCompetido = claves.departamentos_competidos[0];
  const mayorVentaja = claves.ventajas_decisivas[0];

  // Contar departamentos ganados
  const deptosGanador = claves.fortalezas.find(f => f.nombre.includes('ESPRIELLA'));
  const deptosSegundo = claves.fortalezas.find(f => f.nombre.includes('CEPEDA'));

  return (
    <section className="mt-8 space-y-6">
      {/* Título de la sección */}
      <div className="border-l-4 border-l-gb-teal-700 pl-4">
        <h2 className="font-display text-xl font-semibold text-gb-ink">
          Hallazgos clave
        </h2>
        <p className="mt-1 text-sm text-gb-slate-muted">
          Lo más relevante de la jornada electoral
        </p>
      </div>

      {/* Grid de hallazgos principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Victoria */}
        <div className="gb-card border-t-4 border-t-gb-teal-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🏆</span>
            <h3 className="font-semibold text-gb-ink">Resultado</h3>
          </div>
          <p className="text-2xl font-display font-bold text-gb-teal-700">
            {formatPercent(resumen.porcentaje_ganador)}
          </p>
          <p className="text-sm text-gb-slate mt-1">
            {resumen.ganador.split(' ').slice(-2).join(' ')}
          </p>
          <p className="text-xs font-mono text-gb-slate-muted mt-2">
            +{formatNumber(margenVictoria)} votos de ventaja
          </p>
        </div>

        {/* Elección competida */}
        <div className="gb-card border-t-4 border-t-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">⚔️</span>
            <h3 className="font-semibold text-gb-ink">Más competido</h3>
          </div>
          <p className="text-2xl font-display font-bold text-amber-600">
            {deptoMasCompetido.nombre}
          </p>
          <p className="text-sm text-gb-slate mt-1">
            Solo {formatNumber(deptoMasCompetido.diferencia)} votos
          </p>
          <p className="text-xs font-mono text-gb-slate-muted mt-2">
            Margen de {formatPercent(deptoMasCompetido.margen_porcentual)}
          </p>
        </div>

        {/* Departamento decisivo */}
        <div className="gb-card border-t-4 border-t-blue-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">📍</span>
            <h3 className="font-semibold text-gb-ink">Definió la elección</h3>
          </div>
          <p className="text-2xl font-display font-bold text-blue-600">
            {mayorVentaja.nombre}
          </p>
          <p className="text-sm text-gb-slate mt-1">
            +{formatNumber(mayorVentaja.ventaja)} votos netos
          </p>
          <p className="text-xs font-mono text-gb-slate-muted mt-2">
            Mayor ventaja del ganador
          </p>
        </div>

        {/* Distribución territorial */}
        <div className="gb-card border-t-4 border-t-purple-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🗺️</span>
            <h3 className="font-semibold text-gb-ink">Mapa electoral</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gb-slate">De la Espriella</span>
              <span className="font-mono font-semibold text-blue-600">15 dptos</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gb-slate">Cepeda</span>
              <span className="font-mono font-semibold text-orange-600">18 dptos</span>
            </div>
          </div>
          <p className="text-xs text-gb-slate-muted mt-2">
            Ganó más territorios pero perdió
          </p>
        </div>
      </div>

      {/* Lecturas del resultado */}
      <div className="gb-card bg-gb-teal-50">
        <h3 className="gb-eyebrow mb-4">Lecturas del resultado</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {claves.lectura.map((texto, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gb-teal-700 text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-gb-slate">{texto}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 departamentos decisivos */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Donde se definió */}
        <div className="gb-card">
          <h3 className="gb-eyebrow mb-4">Donde se definió la victoria</h3>
          <p className="text-xs text-gb-slate-muted mb-4">
            Departamentos con mayor ventaja neta para el ganador nacional
          </p>
          <div className="space-y-3">
            {claves.ventajas_decisivas.slice(0, 5).map((depto, index) => {
              const maxVentaja = claves.ventajas_decisivas[0].ventaja;
              const widthPercent = (depto.ventaja / maxVentaja) * 100;

              return (
                <div key={depto.codigo}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-gb-teal-100 text-xs font-semibold text-gb-teal-700">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gb-ink">{depto.nombre}</span>
                    </div>
                    <span className="font-mono text-gb-teal-700">
                      +{formatNumber(depto.ventaja)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gb-teal-100">
                    <div
                      className="h-full rounded-full bg-gb-teal-600 transition-all"
                      style={{ width: `${Math.max(widthPercent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Más competidos */}
        <div className="gb-card">
          <h3 className="gb-eyebrow mb-4">Departamentos más reñidos</h3>
          <p className="text-xs text-gb-slate-muted mb-4">
            Donde la diferencia fue mínima entre los dos primeros
          </p>
          <div className="space-y-3">
            {claves.departamentos_competidos.slice(0, 5).map((depto, index) => (
              <div
                key={depto.codigo}
                className="flex items-center justify-between rounded-lg border border-gb-border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gb-ink">{depto.nombre}</p>
                    <p className="text-xs text-gb-slate-muted">
                      {depto.ganador.split(' ').slice(-2).join(' ')} sobre {depto.segundo.split(' ').slice(-2).join(' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-amber-600">
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
      <div>
        <h3 className="gb-eyebrow mb-4">Bastiones electorales por candidato</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {claves.fortalezas.map((candidato) => {
            const color = getColorPartido(candidato.partido || '');
            const isGanador = candidato.nombre.includes('ESPRIELLA');

            return (
              <div
                key={candidato.nombre}
                className={`gb-card ${isGanador ? 'ring-2 ring-gb-teal-700 ring-offset-2' : ''}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="mt-1 h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div>
                    <h4 className="font-semibold text-gb-ink">
                      {candidato.nombre.split(' ').slice(-2).join(' ')}
                      {isGanador && (
                        <span className="ml-2 text-xs font-normal text-gb-teal-700">
                          ✓ Ganador
                        </span>
                      )}
                    </h4>
                    <p className="text-sm font-mono text-gb-slate-muted">
                      {formatPercent(candidato.porcentaje_nacional)} nacional
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gb-slate-muted mb-3">
                  Mejores resultados por departamento:
                </p>

                <div className="space-y-2">
                  {candidato.departamentos.map((depto) => (
                    <div
                      key={depto.codigo}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gb-slate">{depto.nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gb-slate-muted">
                          {formatNumber(depto.votos)}
                        </span>
                        <span
                          className="rounded px-2 py-0.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {formatPercent(depto.porcentaje)}
                        </span>
                      </div>
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
