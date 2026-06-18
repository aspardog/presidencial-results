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

// Helper para obtener apellido correcto (CEPEDA, no CASTRO)
const getApellido = (nombre: string) => {
  if (nombre.includes('CEPEDA')) return 'CEPEDA';
  return nombre.split(' ').pop() || '';
};

export default function HallazgosClave() {
  const margenVictoria = resumen.votos_ganador - resumen.votos_segundo;
  const maxVentaja = Math.max(...claves.ventajas_decisivas.map((depto) => depto.ventaja), 1);
  const porcentajeSegundo = (resumen.votos_segundo / resumen.votos_validos) * 100;
  const diferenciaPorcentual = resumen.porcentaje_ganador - porcentajeSegundo;

  return (
    <section className="mt-6 sm:mt-10">
      <header className="mb-4 sm:mb-6">
        <h2 className="font-display text-base sm:text-lg font-semibold text-gb-ink">
          Hallazgos clave
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-gb-slate-muted">
          Lectura nacional y territorial de los resultados electorales
        </p>
      </header>

      {/* Hero: Resultado Nacional */}
      <div className="gb-card">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 sm:gap-4">
          <div>
            <p className="gb-eyebrow">Resultado nacional</p>
            <p className="mt-1.5 sm:mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tabular-nums text-gb-ink">
              {formatPercent(resumen.porcentaje_ganador)}<span className="text-gb-teal-700">*</span>
            </p>
            <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-gb-slate">
              {resumen.ganador}
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-mono text-xl sm:text-2xl font-semibold text-gb-teal-700">
              +{formatNumber(margenVictoria)}
            </p>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gb-slate-muted">
              votos de ventaja
            </p>
          </div>
        </div>
        <p className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gb-border text-[10px] sm:text-xs text-gb-slate-muted">
          <span className="text-gb-teal-700 font-medium">*</span> Porcentaje sobre votos válidos. No incluye consulados.
        </p>
      </div>

      {/* Síntesis electoral - highlight cards */}
      <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Votos netos</p>
          <p className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold text-gb-teal-700">
            +{formatNumber(margenVictoria)}
          </p>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gb-slate">
            Diferencia absoluta
          </p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Diferencia %</p>
          <p className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold text-gb-teal-700">
            +{formatPercent(diferenciaPorcentual)}
          </p>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gb-slate">
            Puntos porcentuales
          </p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Más reñido</p>
          <p className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold text-gb-ink truncate">
            {claves.departamentos_competidos[0].nombre}
          </p>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gb-slate">
            {formatPercent(claves.departamentos_competidos[0].margen_porcentual)}
          </p>
        </div>
        <div className="rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Mayor ventaja</p>
          <p className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold text-gb-ink truncate">
            {claves.ventajas_decisivas[0].nombre}
          </p>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gb-slate">
            +{formatNumber(claves.ventajas_decisivas[0].ventaja)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-lg border border-gb-border bg-white p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-mono text-gb-slate-muted uppercase tracking-wide">Territorios</p>
          <p className="mt-1.5 sm:mt-2 font-display text-base sm:text-xl font-semibold text-gb-ink">
            15 — 18
          </p>
          <p className="mt-1 text-sm text-gb-slate">
            {getApellido(resumen.ganador)} vs {getApellido(resumen.segundo)}
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
              const ganadorApellido = getApellido(depto.ganador);
              const segundoApellido = getApellido(depto.segundo);
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

      {/* La geografía del voto */}
      <div className="mt-10">
        <header className="mb-4 sm:mb-6">
          <h3 className="font-display text-base sm:text-lg font-semibold text-gb-ink">
            La geografía del voto
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-gb-slate-muted">
            Cómo se dividió el territorio nacional
          </p>
        </header>

        {/* Card 1: Dos Colombias */}
        <div className="gb-card mb-3 sm:mb-4">
          <p className="gb-eyebrow">Dos Colombias</p>
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <div className="text-center">
                <p className="font-display text-2xl sm:text-4xl font-semibold text-blue-600">
                  {polMunicipal.resumen.municipios_ganador_nacional}
                </p>
                <p className="text-xs sm:text-sm text-gb-slate">municipios</p>
                <p className="text-[10px] sm:text-xs text-gb-slate-muted">{getApellido(polMunicipal.resumen.ganador_nacional)}</p>
              </div>
              <span className="text-xl sm:text-2xl text-gb-slate-muted font-light">vs</span>
              <div className="text-center">
                <p className="font-display text-2xl sm:text-4xl font-semibold text-orange-600">
                  {polMunicipal.resumen.municipios_segundo_nacional}
                </p>
                <p className="text-xs sm:text-sm text-gb-slate">municipios</p>
                <p className="text-[10px] sm:text-xs text-gb-slate-muted">{getApellido(polMunicipal.resumen.segundo_nacional)}</p>
              </div>
            </div>
          </div>

          {/* Barra visual */}
          <div className="mt-3 sm:mt-4 flex h-4 sm:h-5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 flex items-center justify-center"
              style={{ width: `${polMunicipal.resumen.porcentaje_ganador}%` }}
            >
              <span className="text-[10px] sm:text-xs font-mono text-white font-medium">
                {polMunicipal.resumen.porcentaje_ganador.toFixed(0)}%
              </span>
            </div>
            <div
              className="bg-orange-600 flex items-center justify-center"
              style={{ width: `${polMunicipal.resumen.porcentaje_segundo}%` }}
            >
              <span className="text-[10px] sm:text-xs font-mono text-white font-medium">
                {polMunicipal.resumen.porcentaje_segundo.toFixed(0)}%
              </span>
            </div>
          </div>

          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gb-slate">
            El <strong>{((polMunicipal.competitividad_municipal.bastiones / polMunicipal.resumen.total_municipios) * 100).toFixed(0)}%</strong> fueron bastiones (&gt;20 pts).
            Solo <strong>{polMunicipal.competitividad_municipal.ultra_competidos}</strong> ultra-competidos (&lt;2%).
          </p>
        </div>

        {/* Card 2 y 3: Donde se decidió + Bastiones */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 mb-3 sm:mb-4">
          {/* Competidos y ultra-competidos */}
          <div className="gb-card">
            <p className="gb-eyebrow">Competidos y ultra-competidos</p>
            <p className="mt-1 text-xs sm:text-sm text-gb-slate-muted">
              {polMunicipal.competitividad_municipal.ultra_competidos + polMunicipal.competitividad_municipal.competidos} municipios con margen &lt;10%
            </p>

            <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
              {polMunicipal.municipios_mas_competidos.slice(0, 5).map((mun, index) => {
                const colorGanador = mun.ganador.includes('ESPRIELLA') ? 'text-blue-600' : 'text-orange-600';

                return (
                  <div key={`${mun.codigo_dep}_${mun.codigo_mun}`} className="flex items-center justify-between py-0.5 sm:py-1 border-b border-gb-border last:border-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="w-4 shrink-0 font-mono text-[10px] sm:text-xs text-gb-slate-muted">{index + 1}.</span>
                      <div className="min-w-0">
                        <span className="font-medium text-xs sm:text-sm text-gb-ink truncate block">
                          {mun.nombre_mun} <span className="text-gb-slate-muted font-normal">({mun.nombre_dep})</span>
                        </span>
                      </div>
                    </div>
                    <span className={`font-mono text-xs sm:text-sm font-semibold shrink-0 ${colorGanador}`}>
                      {formatPercent(mun.margen)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bastiones y ventajas claras */}
          <div className="gb-card">
            <p className="gb-eyebrow">Bastiones y ventajas claras</p>
            <p className="mt-1 text-xs sm:text-sm text-gb-slate-muted">
              {polMunicipal.competitividad_municipal.bastiones + polMunicipal.competitividad_municipal.ventaja_clara} municipios con margen &gt;10%
            </p>

            <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
              {[...polMunicipal.bastiones_ganador.slice(0, 3), ...polMunicipal.bastiones_segundo.slice(0, 2)].map((mun, index) => {
                const colorGanador = mun.ganador.includes('ESPRIELLA') ? 'text-blue-600' : 'text-orange-600';
                const bgColor = mun.ganador.includes('ESPRIELLA') ? 'bg-blue-600' : 'bg-orange-600';

                return (
                  <div key={`${mun.codigo_dep}_${mun.codigo_mun}`} className="flex items-center justify-between py-0.5 sm:py-1 border-b border-gb-border last:border-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${bgColor}`}></div>
                      <div className="min-w-0">
                        <span className="font-medium text-xs sm:text-sm text-gb-ink truncate block">
                          {mun.nombre_mun} <span className="text-gb-slate-muted font-normal">({mun.nombre_dep})</span>
                        </span>
                      </div>
                    </div>
                    <span className={`font-mono text-xs sm:text-sm font-semibold shrink-0 ${colorGanador}`}>
                      {formatPercent(mun.margen)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Los contrastes - bastiones y ventajas claras departamentales */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          <div className="gb-card">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-600"></div>
              <p className="gb-eyebrow text-[10px] sm:text-xs">Bastiones y ventajas {getApellido(polMunicipal.resumen.ganador_nacional)}</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {polarizacion.bastiones_ganador_nacional.map((depto) => (
                  <div key={depto.codigo} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gb-slate">{depto.nombre}</span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-blue-600">
                      +{formatPercent(depto.margen)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="gb-card">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-600"></div>
              <p className="gb-eyebrow text-[10px] sm:text-xs">Bastiones y ventajas {getApellido(polMunicipal.resumen.segundo_nacional)}</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {polarizacion.bastiones_segundo_nacional.map((depto) => (
                  <div key={depto.codigo} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gb-slate">{depto.nombre}</span>
                    <span className="font-mono text-xs sm:text-sm font-semibold text-orange-600">
                      +{formatPercent(depto.margen)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
