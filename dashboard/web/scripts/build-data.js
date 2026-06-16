#!/usr/bin/env node
/**
 * Script de build para generar JSONs estáticos desde los datos Gold.
 * Ejecutar antes del build: npm run build:data
 */

const fs = require('fs');
const path = require('path');

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
  const votosValidos = metricas.find(m => m.TIPO_VOTO === 'CANDIDATO')?.TOTAL_VOTOS || 0;
  const votosBlancos = metricas.find(m => m.TIPO_VOTO === 'BLANCO')?.TOTAL_VOTOS || 0;
  const votosNulos = metricas.find(m => m.TIPO_VOTO === 'NULO')?.TOTAL_VOTOS || 0;
  const votosNoMarcados = metricas.find(m => m.TIPO_VOTO === 'NO_MARCADO')?.TOTAL_VOTOS || 0;
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

  // Copiar departamentos.geojson
  const deptosGeoJSON = path.join(srcDir, 'departamentos.geojson');
  if (fs.existsSync(deptosGeoJSON)) {
    fs.copyFileSync(deptosGeoJSON, path.join(destDir, 'departamentos.geojson'));
    console.log('  ✓ mapas/departamentos.geojson');
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

  console.log('\nAnálisis:');
  const claves = buildClavesTerritoriales();
  writeJSON('analisis/claves-territoriales.json', claves);

  console.log('\nGeoJSON:');
  copyGeoJSON();

  console.log('\n✅ Datos generados exitosamente en public/api/');
}

main();
