'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import MapaElectoral from '@/components/maps/MapaElectoral';
import type { NivelMapa } from '@/components/maps/MapaElectoral';
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
} from '@/types/electoral';

// Importar datos estáticos (build time)
import resumenData from '../../public/api/nacional/resumen.json';
import candidatosData from '../../public/api/nacional/candidatos.json';
import departamentosDetalleData from '../../public/api/departamentos/detalle.json';

const resumen = resumenData as ResumenNacional;
const candidatos = candidatosData as CandidatoNacional[];
const departamentosDetalle = departamentosDetalleData as Record<string, DepartamentoDetalle>;

export default function HomePage() {
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<{
    codigo: string;
    nombre: string;
  } | null>(null);
  const [nivelMapa, setNivelMapa] = useState<NivelMapa>('departamentos');

  const departamento = departamentoSeleccionado
    ? departamentosDetalle[departamentoSeleccionado.codigo]
    : null;

  const mostrarNacional = !departamentoSeleccionado;
  const candidatosActuales = mostrarNacional ? candidatos : departamento?.candidatos;

  const handleDepartamentoClick = (codigo: string, nombre: string) => {
    setDepartamentoSeleccionado({ codigo, nombre });
    setNivelMapa('municipios');
  };

  const handleReset = () => {
    setDepartamentoSeleccionado(null);
    setNivelMapa('departamentos');
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

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="gb-card flex h-[600px] flex-col gap-3 p-4">
              <div
                aria-label="Nivel territorial del mapa"
                className="inline-flex w-fit rounded-gb-md border border-gb-border-strong bg-white p-1 text-sm font-semibold"
                role="tablist"
              >
                {(['departamentos', 'municipios'] as const).map((nivel) => {
                  const isSelected = nivelMapa === nivel;
                  const isDisabled = nivel === 'municipios' && !departamentoSeleccionado;
                  return (
                    <button
                      key={nivel}
                      aria-selected={isSelected}
                      disabled={isDisabled}
                      className={`rounded-gb-sm px-4 py-2 transition ${
                        isSelected
                          ? 'bg-gb-teal-700 text-white'
                          : isDisabled
                            ? 'cursor-not-allowed text-gb-slate-muted opacity-50'
                          : 'text-gb-slate hover:bg-gb-teal-50 hover:text-gb-teal-700'
                      }`}
                      role="tab"
                      type="button"
                      onClick={() => {
                        if (nivel === 'departamentos') {
                          handleReset();
                          return;
                        }
                        setNivelMapa(nivel);
                      }}
                    >
                      {nivel === 'departamentos' ? 'Departamentos' : 'Municipios'}
                    </button>
                  );
                })}
              </div>
              <div className="min-h-0 flex-1">
              <MapaElectoral
                nivel={nivelMapa}
                onDepartamentoClick={handleDepartamentoClick}
                onReset={handleReset}
                departamentoSeleccionado={departamentoSeleccionado?.codigo}
                departamentoSeleccionadoNombre={departamentoSeleccionado?.nombre}
              />
              </div>
            </div>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
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
