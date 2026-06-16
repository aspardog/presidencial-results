'use client';

import { formatNumber, formatPercent } from '@/lib/formatters';
import { getColorPartido } from '@/lib/colors';
import type { ClavesTerritoriales, ResumenNacional, AnalisisPolarizacion, PolarizacionMunicipal } from '@/types/electoral';

// Importar datos estáticos
import clavesData from '../../../public/api/analisis/claves-territoriales.json';
import resumenData from '../../../public/api/nacional/resumen.json';
import polarizacionData from '../../../public/api/analisis/polarizacion.json';
import polarizacionMunicipalData from '../../../public/api/analisis/polarizacion-municipal.json';

const claves = clavesData as ClavesTerritoriales;
const resumen = resumenData as ResumenNacional;
const polarizacion = polarizacionData as AnalisisPolarizacion;
const polMunicipal = polarizacionMunicipalData as PolarizacionMunicipal;

export default function HallazgosClave() {
  const margenVictoria = resumen.votos_ganador - resumen.votos_segundo;
  const maxVentaja = Math.max(...claves.ventajas_decisivas.map((depto) => depto.ventaja), 1);
  const porcentajeSegundo = (resumen.votos_segundo / resumen.votos_validos) * 100;
  const diferenciaPorcentual = resumen.porcentaje_ganador - porcentajeSegundo;

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
              {formatPercent(resumen.porcentaje_ganador)}<span className="text-gb-teal-700">*</span>
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
        <p className="mt-4 pt-4 border-t border-gb-border text-xs text-gb-slate-muted">
          <span className="text-gb-teal-700 font-medium">*</span> Porcentaje calculado sobre votos válidos en territorio nacional. No incluye votos de consulados en el exterior.
        </p>
      </div>

      {/* Síntesis electoral - highlight cards */}
      <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border border-gb-border bg-white p-4">
          <p className="text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Votos netos</p>
          <p className="mt-2 font-display text-xl font-semibold text-gb-teal-700">
            +{formatNumber(margenVictoria)}
          </p>
          <p className="mt-1 text-sm text-gb-slate">
            Diferencia absoluta
          </p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-4">
          <p className="text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Diferencia %</p>
          <p className="mt-2 font-display text-xl font-semibold text-gb-teal-700">
            +{formatPercent(diferenciaPorcentual)}
          </p>
          <p className="mt-1 text-sm text-gb-slate">
            Puntos porcentuales
          </p>
        </div>
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
        <div className="col-span-2 sm:col-span-1 rounded-lg border border-gb-border bg-white p-4">
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

      {/* Análisis de Polarización */}
      <div className="mt-10">
        <header className="mb-6">
          <h3 className="font-display text-lg font-semibold text-gb-ink">
            Análisis de polarización
          </h3>
          <p className="mt-1 text-sm text-gb-slate-muted">
            Métricas de concentración del voto y división territorial
          </p>
        </header>

        {/* Métricas principales de polarización */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gb-border bg-white p-4">
            <p className="text-xs font-mono text-gb-slate-muted uppercase tracking-wide">
              Índice bipartidista
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-gb-ink">
              {formatPercent(polarizacion.nacional.indice_bipartidista)}
            </p>
            <p className="mt-1 text-sm text-gb-slate">
              Votos top 2 candidatos
            </p>
          </div>

          <div className="rounded-lg border border-gb-border bg-white p-4">
            <p className="text-xs font-mono text-gb-slate-muted uppercase tracking-wide">
              NEP
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-gb-ink">
              {polarizacion.nacional.nep.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gb-slate">
              {polarizacion.nacional.interpretacion_nep}
            </p>
          </div>

          <div className="rounded-lg border border-gb-border bg-white p-4">
            <p className="text-xs font-mono text-gb-slate-muted uppercase tracking-wide">
              División territorial
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-gb-ink">
              ±{polarizacion.polarizacion_geografica.desviacion_margenes.toFixed(1)}%
            </p>
            <p className="mt-1 text-sm text-gb-slate">
              {polarizacion.polarizacion_geografica.interpretacion}
            </p>
          </div>

          <div className="rounded-lg border border-gb-border bg-white p-4">
            <p className="text-xs font-mono text-gb-slate-muted uppercase tracking-wide">
              Margen promedio
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-gb-ink">
              {formatPercent(polarizacion.polarizacion_geografica.margen_promedio)}
            </p>
            <p className="mt-1 text-sm text-gb-slate">
              Entre 1° y 2° lugar
            </p>
          </div>
        </div>

        {/* Clasificación de competitividad */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="gb-card">
            <h4 className="gb-eyebrow mb-4">Competitividad territorial</h4>
            <p className="text-sm text-gb-slate-muted mb-4">
              Clasificación de los 33 departamentos según el margen de victoria.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-sm text-gb-slate">Ultra-competidos (&lt;2%)</span>
                </div>
                <span className="font-mono text-sm font-semibold text-gb-ink">
                  {polarizacion.competitividad.ultra_competidos}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                  <span className="text-sm text-gb-slate">Competidos (2-10%)</span>
                </div>
                <span className="font-mono text-sm font-semibold text-gb-ink">
                  {polarizacion.competitividad.competidos}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span className="text-sm text-gb-slate">Ventaja clara (10-20%)</span>
                </div>
                <span className="font-mono text-sm font-semibold text-gb-ink">
                  {polarizacion.competitividad.ventaja_clara}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-sm text-gb-slate">Bastiones (&gt;20%)</span>
                </div>
                <span className="font-mono text-sm font-semibold text-gb-ink">
                  {polarizacion.competitividad.bastiones}
                </span>
              </div>
            </div>

            {/* Barra visual de distribución */}
            <div className="mt-4 flex h-3 rounded-full overflow-hidden">
              <div
                className="bg-red-500"
                style={{ width: `${(polarizacion.competitividad.ultra_competidos / 33) * 100}%` }}
              />
              <div
                className="bg-orange-400"
                style={{ width: `${(polarizacion.competitividad.competidos / 33) * 100}%` }}
              />
              <div
                className="bg-yellow-400"
                style={{ width: `${(polarizacion.competitividad.ventaja_clara / 33) * 100}%` }}
              />
              <div
                className="bg-green-500"
                style={{ width: `${(polarizacion.competitividad.bastiones / 33) * 100}%` }}
              />
            </div>
          </div>

          <div className="gb-card">
            <h4 className="gb-eyebrow mb-4">Departamentos más polarizados</h4>
            <p className="text-sm text-gb-slate-muted mb-4">
              Territorios con menor número efectivo de partidos (NEP). Menor NEP = voto más concentrado en pocos candidatos.
            </p>
            <div className="space-y-3">
              {polarizacion.departamentos_mas_polarizados.slice(0, 5).map((depto, index) => {
                const colorGanador = getColorPartido(
                  depto.ganador.includes('ESPRIELLA') ? 'FIRMAS' :
                  depto.ganador.includes('CEPEDA') ? 'PACTO' : ''
                );

                return (
                  <div key={depto.codigo} className="flex items-center gap-3">
                    <span className="w-6 shrink-0 font-mono text-xs text-gb-slate-muted">
                      {index + 1}°
                    </span>
                    <div
                      className="w-1 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: colorGanador }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-sm text-gb-ink truncate">
                          {depto.nombre}
                        </span>
                        <span className="shrink-0 font-mono text-sm text-gb-ink">
                          NEP {depto.nep.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gb-slate-muted">
                        {formatPercent(depto.indice_bipartidista)} en top 2 · {formatPercent(depto.margen)} de margen
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nota metodológica */}
        <p className="mt-4 text-xs text-gb-slate-muted">
          <strong>NEP (Número Efectivo de Partidos):</strong> Índice Laakso-Taagepera que mide la fragmentación electoral. Valores cercanos a 2 indican competencia entre dos fuerzas principales. El índice bipartidista suma los porcentajes de los dos primeros candidatos.
        </p>
      </div>

      {/* Análisis de Polarización Municipal */}
      <div className="mt-10">
        <header className="mb-6">
          <h3 className="font-display text-lg font-semibold text-gb-ink">
            Polarización municipal
          </h3>
          <p className="mt-1 text-sm text-gb-slate-muted">
            Análisis granular de {polMunicipal.resumen.total_municipios.toLocaleString('es-CO')} municipios
          </p>
        </header>

        {/* Resumen de fragmentación territorial */}
        <div className="gb-card mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="gb-eyebrow">Fragmentación territorial</p>
              <p className="mt-2 text-gb-slate">
                <span className="font-display text-3xl font-semibold text-gb-ink">
                  {polMunicipal.resumen.municipios_ganador_nacional}
                </span>
                <span className="mx-2 text-gb-slate-muted">vs</span>
                <span className="font-display text-3xl font-semibold text-gb-ink">
                  {polMunicipal.resumen.municipios_segundo_nacional}
                </span>
                <span className="ml-2 text-sm text-gb-slate-muted">municipios</span>
              </p>
              <p className="mt-1 text-sm text-gb-slate-muted">
                {polMunicipal.resumen.ganador_nacional.split(' ').pop()} ({formatPercent(polMunicipal.resumen.porcentaje_ganador)}) vs {polMunicipal.resumen.segundo_nacional.split(' ').pop()} ({formatPercent(polMunicipal.resumen.porcentaje_segundo)})
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="font-mono text-2xl font-semibold text-gb-ink">
                  {polMunicipal.estadisticas.nep_promedio.toFixed(2)}
                </p>
                <p className="text-xs text-gb-slate-muted">NEP promedio</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-2xl font-semibold text-gb-ink">
                  {formatPercent(polMunicipal.estadisticas.margen_promedio)}
                </p>
                <p className="text-xs text-gb-slate-muted">Margen promedio</p>
              </div>
            </div>
          </div>

          {/* Barra visual de distribución de municipios */}
          <div className="mt-4 flex h-4 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 flex items-center justify-center"
              style={{ width: `${polMunicipal.resumen.porcentaje_ganador}%` }}
            >
              <span className="text-[10px] font-mono text-white font-medium">
                {polMunicipal.resumen.porcentaje_ganador.toFixed(0)}%
              </span>
            </div>
            <div
              className="bg-orange-600 flex items-center justify-center"
              style={{ width: `${polMunicipal.resumen.porcentaje_segundo}%` }}
            >
              <span className="text-[10px] font-mono text-white font-medium">
                {polMunicipal.resumen.porcentaje_segundo.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Competitividad municipal */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
          <div className="rounded-lg border border-gb-border bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <p className="text-xs font-mono text-gb-slate-muted uppercase">Ultra-competidos</p>
            </div>
            <p className="font-display text-2xl font-semibold text-gb-ink">
              {polMunicipal.competitividad_municipal.ultra_competidos}
            </p>
            <p className="text-sm text-gb-slate">Margen &lt;2%</p>
          </div>
          <div className="rounded-lg border border-gb-border bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-orange-400"></span>
              <p className="text-xs font-mono text-gb-slate-muted uppercase">Competidos</p>
            </div>
            <p className="font-display text-2xl font-semibold text-gb-ink">
              {polMunicipal.competitividad_municipal.competidos}
            </p>
            <p className="text-sm text-gb-slate">Margen 2-10%</p>
          </div>
          <div className="rounded-lg border border-gb-border bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <p className="text-xs font-mono text-gb-slate-muted uppercase">Ventaja clara</p>
            </div>
            <p className="font-display text-2xl font-semibold text-gb-ink">
              {polMunicipal.competitividad_municipal.ventaja_clara}
            </p>
            <p className="text-sm text-gb-slate">Margen 10-20%</p>
          </div>
          <div className="rounded-lg border border-gb-border bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <p className="text-xs font-mono text-gb-slate-muted uppercase">Bastiones</p>
            </div>
            <p className="font-display text-2xl font-semibold text-gb-ink">
              {polMunicipal.competitividad_municipal.bastiones}
            </p>
            <p className="text-sm text-gb-slate">Margen &gt;20%</p>
          </div>
        </div>

        {/* Heterogeneidad departamental y municipios extremos */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="gb-card">
            <h4 className="gb-eyebrow mb-2">Departamentos más divididos</h4>
            <p className="text-sm text-gb-slate-muted mb-4">
              Departamentos donde ambos candidatos ganan municipios significativos.
            </p>
            <div className="space-y-3">
              {polMunicipal.departamentos_mas_divididos.slice(0, 5).map((dep, index) => {
                const ganadorPrincipal = dep.ganadores[0];
                const colorPrincipal = getColorPartido(
                  ganadorPrincipal?.nombre.includes('ESPRIELLA') ? 'FIRMAS' :
                  ganadorPrincipal?.nombre.includes('CEPEDA') ? 'PACTO' : ''
                );

                return (
                  <div key={dep.codigo} className="flex items-center gap-3">
                    <span className="w-6 shrink-0 font-mono text-xs text-gb-slate-muted">
                      {index + 1}°
                    </span>
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: colorPrincipal }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-sm text-gb-ink truncate">
                          {dep.nombre}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-gb-slate-muted">
                          {dep.total_municipios} mun.
                        </span>
                      </div>
                      <div className="mt-1 flex h-2 rounded-full overflow-hidden bg-gray-100">
                        {dep.ganadores.map((g, i) => {
                          const color = g.nombre.includes('ESPRIELLA') ? '#1D4ED8' :
                                        g.nombre.includes('CEPEDA') ? '#C2410C' : '#6B7280';
                          return (
                            <div
                              key={i}
                              style={{ width: `${g.porcentaje}%`, backgroundColor: color }}
                            />
                          );
                        })}
                      </div>
                      <p className="mt-1 text-xs text-gb-slate-muted">
                        {dep.ganadores.map(g => `${g.nombre.split(' ').pop()}: ${g.count}`).join(' · ')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gb-card">
            <h4 className="gb-eyebrow mb-2">Municipios más competidos</h4>
            <p className="text-sm text-gb-slate-muted mb-4">
              Territorios donde la diferencia entre candidatos fue mínima.
            </p>
            <div className="space-y-3">
              {polMunicipal.municipios_mas_competidos.slice(0, 5).map((mun, index) => {
                const colorGanador = getColorPartido(
                  mun.ganador.includes('ESPRIELLA') ? 'FIRMAS' :
                  mun.ganador.includes('CEPEDA') ? 'PACTO' : ''
                );

                return (
                  <div key={`${mun.codigo_dep}_${mun.codigo_mun}`} className="flex items-center gap-3">
                    <span className="w-6 shrink-0 font-mono text-xs text-gb-slate-muted">
                      {index + 1}°
                    </span>
                    <div
                      className="w-1 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: colorGanador }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-sm text-gb-ink truncate">
                          {mun.nombre_mun}
                        </span>
                        <span className="shrink-0 font-mono text-sm font-semibold text-red-600">
                          {formatPercent(mun.margen)}
                        </span>
                      </div>
                      <p className="text-xs text-gb-slate-muted">
                        {mun.nombre_dep} · {formatNumber(mun.total_votos)} votos
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bastiones de cada candidato */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="gb-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <h4 className="gb-eyebrow">Bastiones de {polMunicipal.resumen.ganador_nacional.split(' ').slice(-2).join(' ')}</h4>
            </div>
            <div className="space-y-2">
              {polMunicipal.bastiones_ganador.slice(0, 5).map((mun, index) => (
                <div key={`${mun.codigo_dep}_${mun.codigo_mun}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 font-mono text-xs text-gb-slate-muted">{index + 1}.</span>
                    <span className="text-sm text-gb-slate truncate">{mun.nombre_mun}</span>
                    <span className="shrink-0 text-xs text-gb-slate-muted">({mun.nombre_dep})</span>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-blue-600">
                    {formatPercent(mun.porcentaje_ganador)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="gb-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <h4 className="gb-eyebrow">Bastiones de {polMunicipal.resumen.segundo_nacional.split(' ').slice(-2).join(' ')}</h4>
            </div>
            <div className="space-y-2">
              {polMunicipal.bastiones_segundo.slice(0, 5).map((mun, index) => (
                <div key={`${mun.codigo_dep}_${mun.codigo_mun}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 font-mono text-xs text-gb-slate-muted">{index + 1}.</span>
                    <span className="text-sm text-gb-slate truncate">{mun.nombre_mun}</span>
                    <span className="shrink-0 text-xs text-gb-slate-muted">({mun.nombre_dep})</span>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-orange-600">
                    {formatPercent(mun.porcentaje_ganador)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-gb-slate-muted">
          <strong>Heterogeneidad:</strong> Mide la variabilidad de márgenes entre municipios de un mismo departamento. Departamentos «divididos» tienen ambos candidatos ganando municipios con más del 20% de participación cada uno.
        </p>
      </div>
    </section>
  );
}
