'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import MapaElectoral from '@/components/maps/MapaElectoral';
import CardGanador from '@/components/cards/CardGanador';
import CardResumen from '@/components/cards/CardResumen';
import BarrasCandidatos from '@/components/charts/BarrasCandidatos';
import DonutParticipacion from '@/components/charts/DonutParticipacion';
import {
  useResumenNacional,
  useCandidatosNacional,
  useDepartamento,
} from '@/hooks/useElectoralData';
import { formatNumber } from '@/lib/formatters';
import { getColorPartido } from '@/lib/colors';
import type { CandidatoDepartamento, CandidatoNacional } from '@/types/electoral';

export default function HomePage() {
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<{
    codigo: string;
    nombre: string;
  } | null>(null);

  // Datos nacionales
  const {
    data: resumen,
    error: errorResumen,
    isLoading: loadingResumen,
  } = useResumenNacional();
  const {
    data: candidatos,
    error: errorCandidatos,
    isLoading: loadingCandidatos,
  } = useCandidatosNacional();

  // Datos del departamento seleccionado
  const {
    data: departamento,
    error: errorDepartamento,
    isLoading: loadingDepartamento,
  } = useDepartamento(departamentoSeleccionado?.codigo || null);

  // Determinar qué datos mostrar
  const mostrarNacional = !departamentoSeleccionado;
  const datosActuales = mostrarNacional
    ? { resumen, candidatos }
    : { resumen: departamento, candidatos: departamento?.candidatos };

  const handleDepartamentoClick = (codigo: string, nombre: string) => {
    setDepartamentoSeleccionado({ codigo, nombre });
  };

  const handleReset = () => {
    setDepartamentoSeleccionado(null);
  };

  if (loadingResumen || loadingCandidatos) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const errorCarga = errorResumen || errorCandidatos || errorDepartamento;
  if (errorCarga) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          departamentoActual={departamentoSeleccionado?.nombre}
          onReset={departamentoSeleccionado ? handleReset : undefined}
        />
        <main className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">No se pudieron cargar los datos electorales.</p>
            <p className="mt-1 text-sm">
              Verifica que la API esté corriendo en {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}.
            </p>
          </div>
        </main>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      <Header
        departamentoActual={departamentoSeleccionado?.nombre}
        onReset={departamentoSeleccionado ? handleReset : undefined}
      />

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Mapa */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-4 h-[600px]">
              <MapaElectoral
                onDepartamentoClick={handleDepartamentoClick}
                departamentoSeleccionado={departamentoSeleccionado?.codigo}
              />
            </div>
          </div>

          {/* Columna derecha: Información */}
          <div className="space-y-4">
            {/* Card Ganador */}
            {ganador && !loadingDepartamento && (
              <CardGanador
                nombre={ganador.ganador}
                partido={ganador.partido_ganador}
                votos={ganador.votos_ganador}
                porcentaje={ganador.porcentaje_ganador}
                esGanador
              />
            )}

            {/* Card Segundo */}
            {segundo && !loadingDepartamento && (
              <CardGanador
                nombre={segundo.nombre}
                partido={segundo.partido || ''}
                votos={segundo.votos || (resumen?.votos_segundo ?? 0)}
                porcentaje={segundo.porcentaje || 0}
                esGanador={false}
              />
            )}

            {/* Diferencia */}
            {ganador && !loadingDepartamento && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase">Diferencia</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(ganador.diferencia)} votos
                </p>
              </div>
            )}

            {/* Gráfico de barras */}
            {loadingDepartamento && departamentoSeleccionado && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="h-40 rounded bg-gray-100" />
                </div>
              </div>
            )}

            {!loadingDepartamento && datosActuales.candidatos && datosActuales.candidatos.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Votos por Candidato
                </h3>
                <BarrasCandidatos
                  candidatos={datosActuales.candidatos.map((c: CandidatoNacional | CandidatoDepartamento) => ({
                    ...c,
                    color: c.color || getColorPartido(c.partido),
                  }))}
                  maxVisible={5}
                />
              </div>
            )}
          </div>
        </div>

        {/* Fila inferior: Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {metricasActuales.map((metrica) => (
            <CardResumen
              key={metrica.label}
              label={metrica.label}
              value={metrica.value}
            />
          ))}
        </div>

        {/* Participación */}
        {resumen && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribución de Votos
            </h3>
            <div className="max-w-md mx-auto">
              <DonutParticipacion
                validos={resumen.votos_validos}
                blancos={resumen.votos_blancos}
                nulos={resumen.votos_nulos}
                noMarcados={resumen.votos_no_marcados}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
