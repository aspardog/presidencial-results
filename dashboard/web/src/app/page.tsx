'use client';

import { useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import MapaElectoral from '@/components/maps/MapaElectoral';
import CardGanador from '@/components/cards/CardGanador';
import CardResumen from '@/components/cards/CardResumen';
import BarrasCandidatos from '@/components/charts/BarrasCandidatos';
import HallazgosClave from '@/components/analysis/HallazgosClave';
import { formatNumber } from '@/lib/formatters';
import { getColorPartido } from '@/lib/colors';
import type {
  CandidatoDepartamento,
  CandidatoNacional,
  ResumenNacional,
  DepartamentoDetalle,
  MunicipioResumen,
} from '@/types/electoral';

// Importar datos estáticos (build time)
import resumenData from '../../public/api/nacional/resumen.json';
import candidatosData from '../../public/api/nacional/candidatos.json';
import departamentosDetalleData from '../../public/api/departamentos/detalle.json';
import municipiosData from '../../public/api/departamentos/municipios.json';

const resumen = resumenData as ResumenNacional;
const candidatos = candidatosData as CandidatoNacional[];
const departamentosDetalle = departamentosDetalleData as Record<string, DepartamentoDetalle>;
const municipiosPorDepartamento = municipiosData as Record<string, MunicipioResumen[]>;

export default function HomePage() {
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<{
    codigo: string;
    nombre: string;
  } | null>(null);

  const departamento = departamentoSeleccionado
    ? departamentosDetalle[departamentoSeleccionado.codigo]
    : null;

  const mostrarNacional = !departamentoSeleccionado;
  const candidatosActuales = mostrarNacional ? candidatos : departamento?.candidatos;
  const municipiosActuales = departamentoSeleccionado
    ? municipiosPorDepartamento[departamentoSeleccionado.codigo] || []
    : [];
  const municipiosVisibles = municipiosActuales.slice(0, 12);
  const opcionesDepartamento = useMemo(
    () => Object.values(departamentosDetalle).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    []
  );

  const handleDepartamentoClick = (codigo: string, nombre: string) => {
    if (departamentoSeleccionado?.codigo === codigo) {
      handleReset();
      return;
    }

    setDepartamentoSeleccionado({ codigo, nombre });
  };

  const handleReset = () => {
    setDepartamentoSeleccionado(null);
  };

  const handleDepartamentoSelect = (codigo: string) => {
    if (!codigo) {
      handleReset();
      return;
    }

    const detalle = departamentosDetalle[codigo];
    if (detalle) {
      setDepartamentoSeleccionado({ codigo, nombre: detalle.nombre });
    }
  };

  const ganador = mostrarNacional
    ? resumen
    : departamento;

  const segundo = mostrarNacional && candidatos?.length
    ? candidatos[1]
    : departamento?.candidatos?.[1];

  const metricasActuales = mostrarNacional
    ? [
        { label: 'Total Votos', value: resumen?.total_votos || 0 },
        { label: 'Mesas', value: resumen?.total_mesas || 0 },
        { label: 'Departamentos', value: resumen?.total_departamentos || 33 },
        { label: 'Votos Válidos', value: resumen?.votos_validos || 0 },
      ]
    : [
        { label: 'Total Votos', value: departamento?.total_votos || 0 },
        { label: 'Municipios', value: departamento?.total_municipios || 0 },
        { label: 'Candidatos', value: departamento?.candidatos?.length || 0 },
        { label: 'Diferencia', value: departamento?.diferencia || 0 },
      ];

  return (
    <div className="min-h-screen bg-gb-bg">
      <Header
        departamentoActual={departamentoSeleccionado?.nombre}
        onReset={departamentoSeleccionado ? handleReset : undefined}
      />

      <main className="px-4 py-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-4 lg:col-span-2">
            <div className="gb-card flex h-[450px] sm:h-[550px] lg:h-[600px] flex-col gap-3 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gb-slate">
                  <button
                    className={`shrink-0 transition ${departamentoSeleccionado ? 'text-gb-teal-700 hover:text-gb-teal-600' : 'text-gb-ink'}`}
                    type="button"
                    onClick={handleReset}
                  >
                    Colombia
                  </button>
                  {departamentoSeleccionado && (
                    <>
                      <span className="text-gb-slate-muted">/</span>
                      <span className="truncate text-gb-ink">{departamentoSeleccionado.nombre}</span>
                    </>
                  )}
                </div>

                <label className="flex w-full items-center gap-2 sm:w-auto">
                  <span className="sr-only">Seleccionar departamento</span>
                  <select
                    className="h-10 w-full rounded-gb-md border border-gb-border-strong bg-white px-3 text-sm font-semibold text-gb-slate shadow-gb-sm outline-none transition focus:border-gb-teal-600 sm:w-64"
                    value={departamentoSeleccionado?.codigo || ''}
                    onChange={(event) => handleDepartamentoSelect(event.target.value)}
                  >
                    <option value="">Seleccionar departamento</option>
                    {opcionesDepartamento.map((opcion) => (
                      <option key={opcion.codigo} value={opcion.codigo}>
                        {opcion.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="min-h-0 flex-1">
                <MapaElectoral
                  onDepartamentoClick={handleDepartamentoClick}
                  onReset={handleReset}
                  departamentoSeleccionado={departamentoSeleccionado?.codigo}
                  departamentoSeleccionadoNombre={departamentoSeleccionado?.nombre}
                />
              </div>
            </div>

            {departamentoSeleccionado && municipiosActuales.length > 0 && (
              <section className="gb-card p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="gb-eyebrow">Desagregacion municipal</p>
                    <h2 className="mt-1 text-xl font-display font-semibold text-gb-ink">
                      {departamentoSeleccionado.nombre}
                    </h2>
                  </div>
                  <p className="font-mono text-xs text-gb-slate-muted">
                    Top {municipiosVisibles.length} de {municipiosActuales.length} municipios por votos validos
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr className="text-left font-mono text-xs uppercase text-gb-slate-muted">
                        <th className="border-b border-gb-border px-3 py-2 font-medium">Municipio</th>
                        <th className="border-b border-gb-border px-3 py-2 font-medium">Ganador</th>
                        <th className="border-b border-gb-border px-3 py-2 text-right font-medium">%</th>
                        <th className="border-b border-gb-border px-3 py-2 text-right font-medium">Votos</th>
                        <th className="border-b border-gb-border px-3 py-2 text-right font-medium">Margen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {municipiosVisibles.map((municipio, index) => (
                        <tr key={municipio.codigo} className="border-b border-gb-border">
                          <td className="border-b border-gb-border px-3 py-3">
                            <div className="flex items-baseline gap-2">
                              <span className="w-6 shrink-0 font-mono text-xs text-gb-slate-muted">
                                {index + 1}.
                              </span>
                              <span className="font-semibold text-gb-ink">{municipio.nombre}</span>
                            </div>
                          </td>
                          <td className="border-b border-gb-border px-3 py-3 text-gb-slate">
                            <span className="block max-w-[260px] truncate">{municipio.ganador}</span>
                            <span className="block text-xs text-gb-slate-muted">{municipio.segundo}</span>
                          </td>
                          <td className="border-b border-gb-border px-3 py-3 text-right font-mono font-semibold text-gb-teal-700">
                            {municipio.porcentaje_ganador.toFixed(1)}%
                          </td>
                          <td className="border-b border-gb-border px-3 py-3 text-right font-mono text-gb-slate">
                            {formatNumber(municipio.total_votos)}
                          </td>
                          <td className="border-b border-gb-border px-3 py-3 text-right font-mono text-gb-slate-muted">
                            +{formatNumber(municipio.diferencia)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-4">
            {ganador && (
              <CardGanador
                nombre={ganador.ganador}
                partido={ganador.partido_ganador}
                votos={ganador.votos_ganador}
                porcentaje={ganador.porcentaje_ganador}
                esGanador
              />
            )}

            {segundo && (
              <CardGanador
                nombre={segundo.nombre}
                partido={segundo.partido || ''}
                votos={segundo.votos || (resumen?.votos_segundo ?? 0)}
                porcentaje={segundo.porcentaje || 0}
                esGanador={false}
              />
            )}

            {ganador && (
              <div className="gb-card">
                <p className="gb-eyebrow">Diferencia</p>
                <p className="font-display text-2xl font-semibold text-gb-teal-700 mt-1">
                  {formatNumber(ganador.diferencia)} votos
                </p>
              </div>
            )}

            {candidatosActuales && candidatosActuales.length > 0 && (
              <div className="gb-card p-4">
                <h3 className="gb-eyebrow mb-3">
                  Votos por candidato
                </h3>
                <BarrasCandidatos
                  candidatos={candidatosActuales.map((c: CandidatoNacional | CandidatoDepartamento) => ({
                    ...c,
                    color: getColorPartido(c.partido),
                  }))}
                  maxVisible={5}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          {metricasActuales.map((metrica) => (
            <CardResumen
              key={metrica.label}
              label={metrica.label}
              value={metrica.value}
            />
          ))}
        </div>

        {mostrarNacional && <HallazgosClave />}
      </main>
    </div>
  );
}
