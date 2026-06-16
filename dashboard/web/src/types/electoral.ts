/**
 * Tipos para datos electorales.
 */

// ============================================================
// CANDIDATOS
// ============================================================

export interface Candidato {
  nombre: string;
  partido: string;
  cedula: string;
  color: string;
}

export interface CandidatoNacional extends Candidato {
  votos: number;
  porcentaje: number;
  posicion: number;
}

export interface CandidatoDepartamento extends Candidato {
  votos: number;
  porcentaje: number;
  posicion: number;
}

// ============================================================
// RESÚMENES
// ============================================================

export interface ResumenNacional {
  total_votos: number;
  votos_validos: number;
  votos_blancos: number;
  votos_nulos: number;
  votos_no_marcados: number;
  total_mesas: number;
  total_departamentos: number;
  ganador: string;
  partido_ganador: string;
  votos_ganador: number;
  porcentaje_ganador: number;
  segundo: string;
  votos_segundo: number;
  diferencia: number;
}

// ============================================================
// ANÁLISIS
// ============================================================

export interface DepartamentoCompetido {
  codigo: string;
  nombre: string;
  ganador: string;
  segundo: string;
  total_votos: number;
  diferencia: number;
  margen_porcentual: number;
}

export interface VentajaDecisiva {
  codigo: string;
  nombre: string;
  ganador_nacional: string;
  segundo_nacional: string;
  votos_ganador_nacional: number;
  votos_segundo_nacional: number;
  ventaja: number;
  margen_porcentual: number;
}

export interface FortalezaDepartamento {
  codigo: string;
  nombre: string;
  votos: number;
  porcentaje: number;
}

export interface FortalezaCandidato {
  nombre: string;
  partido: string;
  color: string;
  total_votos: number;
  porcentaje_nacional: number;
  departamentos: FortalezaDepartamento[];
}

export interface ClavesTerritoriales {
  lectura: string[];
  departamentos_competidos: DepartamentoCompetido[];
  ventajas_decisivas: VentajaDecisiva[];
  fortalezas: FortalezaCandidato[];
}

// ============================================================
// DEPARTAMENTOS
// ============================================================

export interface DepartamentoResumen {
  codigo: string;
  nombre: string;
  total_votos: number;
  ganador: string;
  partido_ganador: string;
  votos_ganador: number;
  porcentaje_ganador: number;
  segundo: string;
  diferencia: number;
}

export interface DepartamentoDetalle extends DepartamentoResumen {
  candidatos: CandidatoDepartamento[];
  total_municipios: number;
}

export interface MunicipioResumen {
  codigo: string;
  nombre: string;
  total_votos: number;
  ganador: string;
  partido_ganador: string;
  votos_ganador: number;
  porcentaje_ganador: number;
  segundo: string;
  votos_segundo: number;
  diferencia: number;
}
