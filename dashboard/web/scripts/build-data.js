#!/usr/bin/env node
/**
 * Script de build para generar JSONs estáticos desde los datos Gold.
 * Ejecutar antes del build: npm run build:data
 */

const fs = require('fs');
const path = require('path');
const { simplifyMunicipios, simplifyMunicipiosByDepartment, formatMB, formatKB } = require('./simplify-municipios');

// Rutas
const DATA_DIR = path.resolve(__dirname, '../../../data/gold');
const OUTPUT_DIR = path.resolve(__dirname, '../public/api');

// Colores de partidos (sincronizados con colors.ts)
const COLORES_PARTIDO = {
  "DEFENSORES DE LA PATRIA": "#1D4ED8",
  "MOVIMIENTO POLÍTICO PACTO HISTÓRICO": "#C2410C",
  "PARTIDO CENTRO DEMOCRÁTICO": "#7C3AED",
  "PARTIDO POLÍTICO DIGNIDAD & COMPROMISO": "#0F766E",
  "CON CLAUDIA IMPARABLES": "#CA8A04",
  "ROMPER EL SISTEMA": "#BE185D",
  "COALICIÓN F.A.M.I.L.I.A": "#0891B2",
  "PARTIDO DEMÓCRATA COLOMBIANO": "#4F46E5",
  "SONDRA MACOLLINS, LA ABOGADA DE HIERRO": "#65A30D",
  "PARTIDO POLÍTICO LA FUERZA": "#EA580C",
  "PARTIDO ECOLOGISTA COLOMBIANO": "#059669",
};

const DEFAULT_COLOR = "#5E7074";

// Mapeo de códigos electorales a DANE
const CODIGO_ELECTORAL_A_DANE = {
  "01": "05", "03": "08", "05": "13", "07": "15", "09": "17",
  "11": "19", "12": "20", "13": "23", "15": "25", "16": "11",
  "17": "27", "19": "41", "21": "47", "23": "52", "24": "66",
  "25": "54", "26": "63", "27": "68", "28": "70", "29": "73",
  "31": "76", "40": "81", "44": "18", "46": "85", "48": "44",
  "50": "94", "52": "50", "54": "95", "56": "88", "60": "91",
  "64": "86", "68": "97", "72": "99",
};

// Utilidades
function getColorPartido(partido) {
  return COLORES_PARTIDO[partido] || DEFAULT_COLOR;
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((header, i) => {
      const value = values[i] || '';
      // Intentar parsear números
      const num = parseFloat(value);
      row[header] = isNaN(num) ? value : num;
    });
    return row;
  });
}

function readCSV(relativePath) {
  const fullPath = path.join(DATA_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠ No encontrado: ${relativePath}`);
    return [];
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  return parseCSV(content);
}

function readJSON(relativePath) {
  const fullPath = path.join(DATA_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠ No encontrado: ${relativePath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function writeJSON(filename, data) {
  const fullPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
  console.log(`  ✓ ${filename}`);
}

// Generadores de datos
function buildResumenNacional() {
  const summary = readJSON('visualizaciones/dashboard/summary_nacional.json');
  const candidatos = readCSV('nacional/votos_por_candidato.csv');
  const metricas = readCSV('nacional/metricas_participacion.csv');

  if (!candidatos.length) return null;

  // Ordenar por votos
  candidatos.sort((a, b) => b.TOTAL_VOTOS - a.TOTAL_VOTOS);
  const ganador = candidatos[0];
  const segundo = candidatos[1];

  // Métricas de participación
  const votosPorTipo = (tipo) => {
    const row = metricas.find(m => m.TIPO_VOTO === tipo);
    return row?.TOTAL_VOTOS || row?.TOTAL || 0;
  };

  const votosValidos = votosPorTipo('CANDIDATO') || candidatos.reduce((sum, row) => sum + row.TOTAL_VOTOS, 0);
  const votosBlancos = votosPorTipo('BLANCO');
  const votosNulos = votosPorTipo('NULO');
  const votosNoMarcados = votosPorTipo('NO_MARCADO');
  const totalVotos = votosValidos + votosBlancos + votosNulos + votosNoMarcados;

  return {
    total_votos: totalVotos,
    votos_validos: votosValidos,
    votos_blancos: votosBlancos,
    votos_nulos: votosNulos,
    votos_no_marcados: votosNoMarcados,
    total_mesas: summary?.total_mesas || 118313,
    total_departamentos: 33,
    ganador: ganador.CANNOMBRE,
    partido_ganador: ganador.PARNOMBRE,
    votos_ganador: ganador.TOTAL_VOTOS,
    porcentaje_ganador: Math.round(ganador.PORCENTAJE * 100) / 100,
    segundo: segundo?.CANNOMBRE || '',
    votos_segundo: segundo?.TOTAL_VOTOS || 0,
    diferencia: ganador.TOTAL_VOTOS - (segundo?.TOTAL_VOTOS || 0),
  };
}

function buildCandidatosNacional() {
  const candidatos = readCSV('nacional/votos_por_candidato.csv');
  if (!candidatos.length) return [];

  candidatos.sort((a, b) => b.TOTAL_VOTOS - a.TOTAL_VOTOS);

  return candidatos.map((row, i) => ({
    nombre: row.CANNOMBRE,
    partido: row.PARNOMBRE,
    cedula: String(row.CANCEDULA || ''),
    votos: row.TOTAL_VOTOS,
    porcentaje: Math.round(row.PORCENTAJE * 100) / 100,
    posicion: i + 1,
    color: getColorPartido(row.PARNOMBRE),
  }));
}

function buildDepartamentos() {
  const data = readCSV('departamental/votos_por_candidato_depto.csv');
  if (!data.length) return [];

  const deptos = {};

  data.forEach(row => {
    const codigo = String(row.DEP).padStart(2, '0');
    if (!deptos[codigo]) {
      deptos[codigo] = [];
    }
    deptos[codigo].push(row);
  });

  return Object.entries(deptos).map(([codigo, rows]) => {
    rows.sort((a, b) => b.VOTOS - a.VOTOS);
    const ganador = rows[0];
    const segundo = rows[1];

    return {
      codigo,
      nombre: ganador.DEPNOMBRE_COMPLETO,
      total_votos: rows.reduce((sum, r) => sum + r.VOTOS, 0),
      ganador: ganador.CANNOMBRE,
      partido_ganador: ganador.PARNOMBRE,
      votos_ganador: ganador.VOTOS,
      porcentaje_ganador: Math.round(ganador.PORCENTAJE_DEPTO * 100) / 100,
      segundo: segundo?.CANNOMBRE || '',
      diferencia: ganador.VOTOS - (segundo?.VOTOS || 0),
    };
  }).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

function buildDepartamentoDetalle() {
  const data = readCSV('departamental/votos_por_candidato_depto.csv');
  const munData = readCSV('municipal/votos_por_candidato_mun.csv');
  if (!data.length) return {};

  const deptos = {};

  data.forEach(row => {
    const codigo = String(row.DEP).padStart(2, '0');
    if (!deptos[codigo]) {
      deptos[codigo] = [];
    }
    deptos[codigo].push(row);
  });

  const resultado = {};

  Object.entries(deptos).forEach(([codigo, rows]) => {
    rows.sort((a, b) => b.VOTOS - a.VOTOS);
    const ganador = rows[0];
    const segundo = rows[1];

    // Contar municipios
    const totalMunicipios = munData.filter(
      m => String(m.DEP).padStart(2, '0') === codigo
    ).reduce((acc, m) => {
      acc.add(m.MUN);
      return acc;
    }, new Set()).size;

    resultado[codigo] = {
      codigo,
      nombre: ganador.DEPNOMBRE_COMPLETO,
      total_votos: rows.reduce((sum, r) => sum + r.VOTOS, 0),
      ganador: ganador.CANNOMBRE,
      partido_ganador: ganador.PARNOMBRE,
      votos_ganador: ganador.VOTOS,
      porcentaje_ganador: Math.round(ganador.PORCENTAJE_DEPTO * 100) / 100,
      segundo: segundo?.CANNOMBRE || '',
      diferencia: ganador.VOTOS - (segundo?.VOTOS || 0),
      total_municipios: totalMunicipios,
      candidatos: rows.map((row, i) => ({
        nombre: row.CANNOMBRE,
        partido: row.PARNOMBRE,
        cedula: String(row.CANCEDULA || ''),
        votos: row.VOTOS,
        porcentaje: Math.round(row.PORCENTAJE_DEPTO * 100) / 100,
        posicion: i + 1,
        color: getColorPartido(row.PARNOMBRE),
      })),
    };
  });

  return resultado;
}

function buildMunicipiosPorDepartamento() {
  const data = readCSV('municipal/votos_por_candidato_mun.csv');
  if (!data.length) return {};

  const municipios = {};

  data.forEach(row => {
    const codigoDepartamento = String(row.DEP).padStart(2, '0');
    const codigoMunicipio = String(row.MUN).padStart(3, '0');
    const key = `${codigoDepartamento}_${codigoMunicipio}`;

    if (!municipios[key]) {
      municipios[key] = [];
    }
    municipios[key].push(row);
  });

  const porDepartamento = {};

  Object.values(municipios).forEach(rows => {
    rows.sort((a, b) => b.VOTOS - a.VOTOS);

    const ganador = rows[0];
    const segundo = rows[1];
    const codigoDepartamento = String(ganador.DEP).padStart(2, '0');
    const codigoMunicipio = String(ganador.MUN).padStart(3, '0');
    const totalVotos = ganador.TOTAL_VOTOS_VALIDOS || rows.reduce((sum, row) => sum + row.VOTOS, 0);

    if (!porDepartamento[codigoDepartamento]) {
      porDepartamento[codigoDepartamento] = [];
    }

    porDepartamento[codigoDepartamento].push({
      codigo: codigoMunicipio,
      nombre: ganador.MUNNOMBRE,
      total_votos: totalVotos,
      ganador: ganador.CANNOMBRE,
      partido_ganador: ganador.PARNOMBRE,
      votos_ganador: ganador.VOTOS,
      porcentaje_ganador: Math.round(ganador.PORCENTAJE_MUN * 100) / 100,
      segundo: segundo?.CANNOMBRE || '',
      votos_segundo: segundo?.VOTOS || 0,
      diferencia: ganador.VOTOS - (segundo?.VOTOS || 0),
    });
  });

  Object.values(porDepartamento).forEach(rows => {
    rows.sort((a, b) => b.total_votos - a.total_votos || a.nombre.localeCompare(b.nombre, 'es'));
  });

  return porDepartamento;
}

// ============================================================
// ANÁLISIS DE POLARIZACIÓN
// ============================================================

/**
 * Calcula el Número Efectivo de Partidos (NEP) usando el índice Laakso-Taagepera.
 * NEP = 1 / Σ(pi²) donde pi es la proporción de votos de cada candidato.
 * Valores cercanos a 2 indican alta polarización bipartidista.
 */
function calcularNEP(proporciones) {
  const sumaCuadrados = proporciones.reduce((sum, p) => sum + (p * p), 0);
  return sumaCuadrados > 0 ? 1 / sumaCuadrados : 0;
}

/**
 * Calcula el índice de polarización bipartidista.
 * Es la suma de los porcentajes de los dos primeros candidatos.
 * Valores cercanos a 100 indican alta concentración en dos opciones.
 */
function calcularIndiceBipartidista(candidatosOrdenados) {
  if (candidatosOrdenados.length < 2) return 0;
  return candidatosOrdenados[0].porcentaje + candidatosOrdenados[1].porcentaje;
}

/**
 * Calcula estadísticas de dispersión para polarización geográfica.
 */
function calcularEstadisticasDispersion(valores) {
  if (!valores.length) return { media: 0, desviacion: 0, coeficienteVariacion: 0 };

  const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
  const varianza = valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length;
  const desviacion = Math.sqrt(varianza);
  const coeficienteVariacion = media !== 0 ? (desviacion / Math.abs(media)) * 100 : 0;

  return { media, desviacion, coeficienteVariacion };
}

function buildAnalisisPolarizacion() {
  const data = readCSV('departamental/votos_por_candidato_depto.csv');
  const candidatosNacionales = buildCandidatosNacional();

  if (!data.length || !candidatosNacionales.length) {
    return null;
  }

  // --- MÉTRICAS NACIONALES ---
  const proporcionesNacionales = candidatosNacionales.map(c => c.porcentaje / 100);
  const nepNacional = calcularNEP(proporcionesNacionales);
  const indiceBipartidistaNacional = calcularIndiceBipartidista(candidatosNacionales);

  // --- MÉTRICAS POR DEPARTAMENTO ---
  const deptos = {};
  data.forEach(row => {
    const codigo = String(row.DEP).padStart(2, '0');
    if (!deptos[codigo]) deptos[codigo] = [];
    deptos[codigo].push(row);
  });

  const metricasPorDepartamento = [];
  const margenes = [];
  const indicesBipartidistas = [];
  const neps = [];

  Object.entries(deptos).forEach(([codigo, rows]) => {
    rows.sort((a, b) => b.VOTOS - a.VOTOS);
    if (rows.length < 2) return;

    const totalVotos = rows.reduce((sum, r) => sum + r.VOTOS, 0);
    const proporciones = rows.map(r => r.VOTOS / totalVotos);

    // Calcular métricas
    const nep = calcularNEP(proporciones);
    const porcentajes = rows.map(r => (r.VOTOS / totalVotos) * 100);
    const indiceBipartidista = porcentajes[0] + porcentajes[1];
    const margen = porcentajes[0] - porcentajes[1];

    // Clasificar competitividad
    let clasificacion;
    if (margen < 2) clasificacion = 'ultra_competido';
    else if (margen < 10) clasificacion = 'competido';
    else if (margen < 20) clasificacion = 'ventaja_clara';
    else clasificacion = 'bastion';

    margenes.push(margen);
    indicesBipartidistas.push(indiceBipartidista);
    neps.push(nep);

    metricasPorDepartamento.push({
      codigo,
      nombre: rows[0].DEPNOMBRE_COMPLETO,
      nep: Math.round(nep * 100) / 100,
      indice_bipartidista: Math.round(indiceBipartidista * 100) / 100,
      margen: Math.round(margen * 100) / 100,
      clasificacion,
      ganador: rows[0].CANNOMBRE,
      total_votos: totalVotos,
    });
  });

  // --- POLARIZACIÓN GEOGRÁFICA ---
  const estadisticasMargen = calcularEstadisticasDispersion(margenes);
  const estadisticasBipartidismo = calcularEstadisticasDispersion(indicesBipartidistas);
  const estadisticasNEP = calcularEstadisticasDispersion(neps);

  // Contar por clasificación
  const conteoClasificacion = metricasPorDepartamento.reduce((acc, d) => {
    acc[d.clasificacion] = (acc[d.clasificacion] || 0) + 1;
    return acc;
  }, {});

  // Ordenar departamentos por polarización (menor NEP = más polarizado)
  const deptosMasPolarizados = [...metricasPorDepartamento]
    .sort((a, b) => a.nep - b.nep)
    .slice(0, 5);

  const deptosMenosPolarizados = [...metricasPorDepartamento]
    .sort((a, b) => b.nep - a.nep)
    .slice(0, 5);

  const ganadorNacional = candidatosNacionales[0]?.nombre;
  const segundoNacional = candidatosNacionales[1]?.nombre;
  const bastionesPorCandidato = (nombre) => metricasPorDepartamento
    .filter((departamento) => departamento.ganador === nombre && departamento.margen >= 10)
    .sort((a, b) => b.margen - a.margen)
    .slice(0, 5);

  return {
    // Métricas nacionales
    nacional: {
      nep: Math.round(nepNacional * 100) / 100,
      indice_bipartidista: Math.round(indiceBipartidistaNacional * 100) / 100,
      interpretacion_nep: nepNacional < 2.5 ? 'Alta polarización' :
                          nepNacional < 3.5 ? 'Polarización moderada' : 'Sistema fragmentado',
    },
    // Polarización geográfica
    polarizacion_geografica: {
      desviacion_margenes: Math.round(estadisticasMargen.desviacion * 100) / 100,
      coeficiente_variacion_margenes: Math.round(estadisticasMargen.coeficienteVariacion * 100) / 100,
      margen_promedio: Math.round(estadisticasMargen.media * 100) / 100,
      interpretacion: estadisticasMargen.desviacion > 15 ? 'Alta división territorial' :
                      estadisticasMargen.desviacion > 8 ? 'División territorial moderada' : 'Resultados homogéneos',
    },
    // Clasificación de competitividad
    competitividad: {
      ultra_competidos: conteoClasificacion.ultra_competido || 0,
      competidos: conteoClasificacion.competido || 0,
      ventaja_clara: conteoClasificacion.ventaja_clara || 0,
      bastiones: conteoClasificacion.bastion || 0,
    },
    // Rankings
    departamentos_mas_polarizados: deptosMasPolarizados,
    departamentos_menos_polarizados: deptosMenosPolarizados,
    bastiones_ganador_nacional: bastionesPorCandidato(ganadorNacional),
    bastiones_segundo_nacional: bastionesPorCandidato(segundoNacional),
    // Todos los departamentos con métricas
    por_departamento: metricasPorDepartamento.sort((a, b) => a.codigo.localeCompare(b.codigo)),
  };
}

/**
 * Análisis de polarización a nivel municipal.
 * Incluye heterogeneidad intradepartamental, municipios extremos y fragmentación.
 */
function buildPolarizacionMunicipal() {
  const data = readCSV('municipal/votos_por_candidato_mun.csv');
  const resumen = buildResumenNacional();

  if (!data.length || !resumen) {
    return null;
  }

  const ganadorNacional = resumen.ganador;
  const segundoNacional = resumen.segundo;

  // Agrupar por municipio
  const municipios = {};
  data.forEach(row => {
    const codigoDep = String(row.DEP).padStart(2, '0');
    const codigoMun = String(row.MUN).padStart(3, '0');
    const key = `${codigoDep}_${codigoMun}`;

    if (!municipios[key]) {
      municipios[key] = {
        codigo_dep: codigoDep,
        codigo_mun: codigoMun,
        nombre_dep: row.DEPNOMBRE_COMPLETO,
        nombre_mun: row.MUNNOMBRE,
        candidatos: [],
      };
    }
    municipios[key].candidatos.push({
      nombre: row.CANNOMBRE,
      partido: row.PARNOMBRE,
      votos: row.VOTOS,
      porcentaje: row.PORCENTAJE_MUN,
    });
  });

  // Calcular métricas por municipio
  const metricasMunicipales = [];

  Object.values(municipios).forEach(mun => {
    mun.candidatos.sort((a, b) => b.votos - a.votos);
    if (mun.candidatos.length < 2) return;

    const totalVotos = mun.candidatos.reduce((sum, c) => sum + c.votos, 0);
    if (totalVotos === 0) return;

    const proporciones = mun.candidatos.map(c => c.votos / totalVotos);
    const nep = calcularNEP(proporciones);

    const ganador = mun.candidatos[0];
    const segundo = mun.candidatos[1];
    const margen = ganador.porcentaje - segundo.porcentaje;
    const indiceBipartidista = ganador.porcentaje + segundo.porcentaje;

    // Clasificar competitividad
    let clasificacion;
    if (margen < 2) clasificacion = 'ultra_competido';
    else if (margen < 10) clasificacion = 'competido';
    else if (margen < 20) clasificacion = 'ventaja_clara';
    else clasificacion = 'bastion';

    metricasMunicipales.push({
      codigo_dep: mun.codigo_dep,
      codigo_mun: mun.codigo_mun,
      nombre_dep: mun.nombre_dep,
      nombre_mun: mun.nombre_mun,
      total_votos: totalVotos,
      ganador: ganador.nombre,
      porcentaje_ganador: Math.round(ganador.porcentaje * 100) / 100,
      segundo: segundo.nombre,
      porcentaje_segundo: Math.round(segundo.porcentaje * 100) / 100,
      margen: Math.round(margen * 100) / 100,
      nep: Math.round(nep * 100) / 100,
      indice_bipartidista: Math.round(indiceBipartidista * 100) / 100,
      clasificacion,
    });
  });

  // --- HETEROGENEIDAD INTRADEPARTAMENTAL ---
  const porDepartamento = {};
  metricasMunicipales.forEach(m => {
    if (!porDepartamento[m.codigo_dep]) {
      porDepartamento[m.codigo_dep] = {
        codigo: m.codigo_dep,
        nombre: m.nombre_dep,
        municipios: [],
        margenes: [],
        ganadores: {},
      };
    }
    porDepartamento[m.codigo_dep].municipios.push(m);
    porDepartamento[m.codigo_dep].margenes.push(m.margen);
    porDepartamento[m.codigo_dep].ganadores[m.ganador] =
      (porDepartamento[m.codigo_dep].ganadores[m.ganador] || 0) + 1;
  });

  const heterogeneidadDepartamental = Object.values(porDepartamento).map(dep => {
    const stats = calcularEstadisticasDispersion(dep.margenes);
    const totalMunicipios = dep.municipios.length;

    // Contar ganadores
    const ganadoresArray = Object.entries(dep.ganadores)
      .map(([nombre, count]) => ({ nombre, count, porcentaje: (count / totalMunicipios) * 100 }))
      .sort((a, b) => b.count - a.count);

    // Calcular fragmentación (% del ganador principal)
    const dominancia = ganadoresArray[0]?.porcentaje || 0;
    const esDividido = ganadoresArray.length > 1 && ganadoresArray[1]?.porcentaje > 20;

    // Clasificar heterogeneidad
    let nivelHeterogeneidad;
    if (stats.desviacion > 25) nivelHeterogeneidad = 'muy_heterogeneo';
    else if (stats.desviacion > 15) nivelHeterogeneidad = 'heterogeneo';
    else if (stats.desviacion > 8) nivelHeterogeneidad = 'moderado';
    else nivelHeterogeneidad = 'homogeneo';

    return {
      codigo: dep.codigo,
      nombre: dep.nombre,
      total_municipios: totalMunicipios,
      desviacion_margenes: Math.round(stats.desviacion * 100) / 100,
      margen_promedio: Math.round(stats.media * 100) / 100,
      nivel_heterogeneidad: nivelHeterogeneidad,
      ganadores: ganadoresArray.slice(0, 3),
      dominancia_ganador: Math.round(dominancia * 100) / 100,
      es_dividido: esDividido,
    };
  }).sort((a, b) => b.desviacion_margenes - a.desviacion_margenes);

  // --- MUNICIPIOS EXTREMOS ---
  // Top municipios más polarizados (menor NEP)
  const municipiosMasPolarizados = [...metricasMunicipales]
    .filter(m => m.total_votos >= 1000) // Filtrar municipios muy pequeños
    .sort((a, b) => a.nep - b.nep)
    .slice(0, 10);

  // Top municipios más competidos (menor margen)
  const municipiosMasCompetidos = [...metricasMunicipales]
    .filter(m => m.total_votos >= 1000)
    .sort((a, b) => a.margen - b.margen)
    .slice(0, 10);

  // Top bastiones de cada candidato principal
  const bastionesGanador = [...metricasMunicipales]
    .filter(m => m.ganador === ganadorNacional && m.total_votos >= 5000)
    .sort((a, b) => b.porcentaje_ganador - a.porcentaje_ganador)
    .slice(0, 10);

  const bastionesSegundo = [...metricasMunicipales]
    .filter(m => m.ganador === segundoNacional && m.total_votos >= 5000)
    .sort((a, b) => b.porcentaje_ganador - a.porcentaje_ganador)
    .slice(0, 10);

  // --- FRAGMENTACIÓN NACIONAL ---
  const totalMunicipiosNacional = metricasMunicipales.length;
  const municipiosGanadorNacional = metricasMunicipales.filter(m => m.ganador === ganadorNacional).length;
  const municipiosSegundoNacional = metricasMunicipales.filter(m => m.ganador === segundoNacional).length;
  const municipiosOtros = totalMunicipiosNacional - municipiosGanadorNacional - municipiosSegundoNacional;

  // Conteo por clasificación
  const conteoClasificacion = metricasMunicipales.reduce((acc, m) => {
    acc[m.clasificacion] = (acc[m.clasificacion] || 0) + 1;
    return acc;
  }, {});

  // Estadísticas generales
  const todosLosMargenes = metricasMunicipales.map(m => m.margen);
  const todosLosNEP = metricasMunicipales.map(m => m.nep);
  const statsMargen = calcularEstadisticasDispersion(todosLosMargenes);
  const statsNEP = calcularEstadisticasDispersion(todosLosNEP);

  return {
    resumen: {
      total_municipios: totalMunicipiosNacional,
      municipios_ganador_nacional: municipiosGanadorNacional,
      municipios_segundo_nacional: municipiosSegundoNacional,
      municipios_otros: municipiosOtros,
      porcentaje_ganador: Math.round((municipiosGanadorNacional / totalMunicipiosNacional) * 10000) / 100,
      porcentaje_segundo: Math.round((municipiosSegundoNacional / totalMunicipiosNacional) * 10000) / 100,
      ganador_nacional: ganadorNacional,
      segundo_nacional: segundoNacional,
    },
    estadisticas: {
      nep_promedio: Math.round(statsNEP.media * 100) / 100,
      nep_desviacion: Math.round(statsNEP.desviacion * 100) / 100,
      margen_promedio: Math.round(statsMargen.media * 100) / 100,
      margen_desviacion: Math.round(statsMargen.desviacion * 100) / 100,
    },
    competitividad_municipal: {
      ultra_competidos: conteoClasificacion.ultra_competido || 0,
      competidos: conteoClasificacion.competido || 0,
      ventaja_clara: conteoClasificacion.ventaja_clara || 0,
      bastiones: conteoClasificacion.bastion || 0,
    },
    heterogeneidad_departamental: heterogeneidadDepartamental,
    departamentos_mas_divididos: heterogeneidadDepartamental
      .filter(d => d.es_dividido)
      .slice(0, 10),
    departamentos_mas_homogeneos: [...heterogeneidadDepartamental]
      .sort((a, b) => a.desviacion_margenes - b.desviacion_margenes)
      .slice(0, 5),
    municipios_mas_polarizados: municipiosMasPolarizados,
    municipios_mas_competidos: municipiosMasCompetidos,
    bastiones_ganador: bastionesGanador,
    bastiones_segundo: bastionesSegundo,
  };
}

function buildClavesTerritoriales() {
  const data = readCSV('departamental/votos_por_candidato_depto.csv');
  const resumen = buildResumenNacional();
  const candidatosNacionales = buildCandidatosNacional();

  if (!data.length || !resumen) {
    return { lectura: [], departamentos_competidos: [], ventajas_decisivas: [], fortalezas: [] };
  }

  const ganadorNacional = resumen.ganador;
  const segundoNacional = resumen.segundo;

  // Agrupar por departamento
  const deptos = {};
  data.forEach(row => {
    const codigo = String(row.DEP).padStart(2, '0');
    if (!deptos[codigo]) deptos[codigo] = [];
    deptos[codigo].push(row);
  });

  const departamentos = [];
  const ventajas = [];

  Object.entries(deptos).forEach(([codigo, rows]) => {
    rows.sort((a, b) => b.VOTOS - a.VOTOS);
    if (rows.length < 2) return;

    const ganador = rows[0];
    const segundo = rows[1];
    const totalVotos = ganador.TOTAL_VOTOS_VALIDOS || rows.reduce((s, r) => s + r.VOTOS, 0);
    const diferencia = ganador.VOTOS - segundo.VOTOS;

    departamentos.push({
      codigo,
      nombre: ganador.DEPNOMBRE_COMPLETO,
      ganador: ganador.CANNOMBRE,
      segundo: segundo.CANNOMBRE,
      total_votos: totalVotos,
      diferencia,
      margen_porcentual: Math.round((diferencia / totalVotos) * 10000) / 100,
    });

    const ganadorRow = rows.find(r => r.CANNOMBRE === ganadorNacional);
    const segundoRow = rows.find(r => r.CANNOMBRE === segundoNacional);

    if (ganadorRow && segundoRow) {
      const ventaja = ganadorRow.VOTOS - segundoRow.VOTOS;
      ventajas.push({
        codigo,
        nombre: ganador.DEPNOMBRE_COMPLETO,
        ganador_nacional: ganadorNacional,
        segundo_nacional: segundoNacional,
        votos_ganador_nacional: ganadorRow.VOTOS,
        votos_segundo_nacional: segundoRow.VOTOS,
        ventaja,
        margen_porcentual: Math.round((ventaja / totalVotos) * 10000) / 100,
      });
    }
  });

  // Ordenar
  const departamentosCompetidos = [...departamentos]
    .sort((a, b) => a.margen_porcentual - b.margen_porcentual)
    .slice(0, 6);

  const ventajasDecisivas = ventajas
    .filter(v => v.ventaja > 0)
    .sort((a, b) => b.ventaja - a.ventaja)
    .slice(0, 6);

  // Fortalezas
  const fortalezas = candidatosNacionales.slice(0, 3).map(candidato => {
    const candidatoRows = data
      .filter(r => r.CANNOMBRE === candidato.nombre)
      .sort((a, b) => (b.PORCENTAJE_DEPTO || 0) - (a.PORCENTAJE_DEPTO || 0))
      .slice(0, 4);

    return {
      nombre: candidato.nombre,
      partido: candidato.partido,
      color: candidato.color,
      total_votos: candidato.votos,
      porcentaje_nacional: candidato.porcentaje,
      departamentos: candidatoRows.map(row => ({
        codigo: String(row.DEP).padStart(2, '0'),
        nombre: row.DEPNOMBRE_COMPLETO,
        votos: row.VOTOS,
        porcentaje: Math.round(row.PORCENTAJE_DEPTO * 100) / 100,
      })),
    };
  });

  // Lectura
  const deptosGanados = departamentos.filter(d => d.ganador === ganadorNacional).length;
  const deptosSegundo = departamentos.filter(d => d.ganador === segundoNacional).length;

  const lectura = [];
  if (departamentosCompetidos.length) {
    const mc = departamentosCompetidos[0];
    lectura.push(
      `${mc.nombre} fue el departamento más competido: ${mc.diferencia.toLocaleString('es-CO')} votos de diferencia (${mc.margen_porcentual} puntos).`
    );
  }
  if (ventajasDecisivas.length) {
    const mv = ventajasDecisivas[0];
    lectura.push(
      `La mayor ventaja neta del ganador nacional salió de ${mv.nombre}: +${mv.ventaja.toLocaleString('es-CO')} votos frente al segundo nacional.`
    );
  }
  lectura.push(
    `${ganadorNacional} ganó ${deptosGanados} de ${departamentos.length} departamentos; ${segundoNacional} ganó ${deptosSegundo}.`
  );

  return {
    lectura,
    departamentos_competidos: departamentosCompetidos,
    ventajas_decisivas: ventajasDecisivas,
    fortalezas,
  };
}

function copyGeoJSON() {
  const srcDir = path.join(DATA_DIR, 'visualizaciones/mapas/simplified');
  const destDir = path.join(OUTPUT_DIR, 'mapas');

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const deptosGeoJSON = path.join(srcDir, 'departamentos.geojson');
  if (fs.existsSync(deptosGeoJSON)) {
    fs.copyFileSync(deptosGeoJSON, path.join(destDir, 'departamentos.json'));
    console.log('  ✓ mapas/departamentos.json');
  }

  // Dividir municipios en archivos por departamento (OPTIMIZACIÓN)
  console.log('  ⏳ Dividiendo municipios por departamento...');
  const splitResult = simplifyMunicipiosByDepartment({
    destinationDir: path.join(destDir, 'municipios'),
  });

  if (splitResult) {
    console.log(
      `  ✓ mapas/municipios/ (${splitResult.departments} archivos, ${formatMB(splitResult.originalSize)} → ${formatMB(splitResult.totalNewSize)} total)`
    );
    console.log(
      `    Promedio por departamento: ${formatKB(splitResult.averageSize)}`
    );
  }

  // También generar archivo único para compatibilidad (se puede eliminar después)
  console.log('  ⏳ Generando municipios.json (compatibilidad)...');
  const municipiosResult = simplifyMunicipios({
    destination: path.join(destDir, 'municipios.json'),
  });
  if (municipiosResult) {
    console.log(
      `  ✓ mapas/municipios.json (${formatMB(municipiosResult.originalSize)} → ${formatMB(municipiosResult.newSize)})`
    );
  }
}

// Main
function main() {
  console.log('📊 Generando datos estáticos para el dashboard...\n');

  // Crear directorio de salida
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Nacional:');
  const resumen = buildResumenNacional();
  if (resumen) writeJSON('nacional/resumen.json', resumen);

  const candidatos = buildCandidatosNacional();
  if (candidatos.length) writeJSON('nacional/candidatos.json', candidatos);

  console.log('\nDepartamental:');
  const deptos = buildDepartamentos();
  if (deptos.length) writeJSON('departamentos/lista.json', deptos);

  const detalle = buildDepartamentoDetalle();
  if (Object.keys(detalle).length) writeJSON('departamentos/detalle.json', detalle);

  const municipios = buildMunicipiosPorDepartamento();
  if (Object.keys(municipios).length) writeJSON('departamentos/municipios.json', municipios);

  console.log('\nAnálisis:');
  const claves = buildClavesTerritoriales();
  writeJSON('analisis/claves-territoriales.json', claves);

  const polarizacion = buildAnalisisPolarizacion();
  if (polarizacion) writeJSON('analisis/polarizacion.json', polarizacion);

  const polarizacionMunicipal = buildPolarizacionMunicipal();
  if (polarizacionMunicipal) writeJSON('analisis/polarizacion-municipal.json', polarizacionMunicipal);

  console.log('\nGeoJSON:');
  copyGeoJSON();

  console.log('\n✅ Datos generados exitosamente en public/api/');
}

main();
