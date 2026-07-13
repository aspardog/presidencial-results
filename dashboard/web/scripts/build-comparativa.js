#!/usr/bin/env node
/**
 * Genera public/api/comparativa.json: comparación primera ↔ segunda vuelta.
 *
 * Contiene lo necesario para el módulo de trasvase de la Opción B:
 *  - Nacional: resultados de ambas vueltas, crecimiento de los dos finalistas,
 *    "bolsa" de votos de candidatos eliminados y cambio en votos emitidos.
 *  - Departamental: ganador y margen por vuelta, swing de cada finalista y qué
 *    departamentos cambiaron de ganador ("volteo").
 *
 * NOTA metodológica: no existe dato individual de trasvase de votos. Lo que se
 * reporta es contabilidad agregada (cuánto creció cada finalista y cuántos votos
 * de candidatos eliminados quedaron "en juego"), no atribución causal.
 */

const fs = require('fs');
const path = require('path');

const GOLD_DIR = path.resolve(__dirname, '../../../data/gold');
const OUTPUT_PATH = path.resolve(__dirname, '../public/api/comparativa.json');

// Colores de partido (sincronizados con build-data.js / colors.ts).
const COLORES_PARTIDO = {
  'DEFENSORES DE LA PATRIA': '#1D4ED8',
  'MOVIMIENTO POLÍTICO PACTO HISTÓRICO': '#C2410C',
  'PARTIDO CENTRO DEMOCRÁTICO': '#7C3AED',
  'PARTIDO POLÍTICO DIGNIDAD & COMPROMISO': '#0F766E',
  'CON CLAUDIA IMPARABLES': '#CA8A04',
  'ROMPER EL SISTEMA': '#BE185D',
  'COALICIÓN F.A.M.I.L.I.A': '#0891B2',
  'PARTIDO DEMÓCRATA COLOMBIANO': '#4F46E5',
  'SONDRA MACOLLINS, LA ABOGADA DE HIERRO': '#65A30D',
  'PARTIDO POLÍTICO LA FUERZA': '#EA580C',
  'PARTIDO ECOLOGISTA COLOMBIANO': '#059669',
};
const DEFAULT_COLOR = '#5E7074';
const colorPartido = (p) => COLORES_PARTIDO[p] || DEFAULT_COLOR;

const round2 = (n) => Math.round(n * 100) / 100;

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
  return lines.slice(1).map((line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else current += char;
    }
    values.push(current.trim());
    const row = {};
    headers.forEach((header, i) => {
      const value = values[i] || '';
      const num = parseFloat(value);
      row[header] = isNaN(num) || value === '' ? value : num;
    });
    return row;
  });
}

function readCSV(relativePath) {
  const full = path.join(GOLD_DIR, relativePath);
  if (!fs.existsSync(full)) {
    throw new Error(`No encontrado (¿corriste build:data para ambas vueltas?): ${full}`);
  }
  return parseCSV(fs.readFileSync(full, 'utf-8'));
}

// ── Nacional ────────────────────────────────────────────────────────────────
const nacPrimera = readCSV('nacional/votos_por_candidato.csv');
const nacSegunda = readCSV('segunda/nacional/votos_por_candidato.csv');
const partPrimera = readCSV('nacional/metricas_participacion.csv');
const partSegunda = readCSV('segunda/nacional/metricas_participacion.csv');

const validosPrimera = nacPrimera.reduce((s, r) => s + r.TOTAL_VOTOS, 0);
const validosSegunda = nacSegunda.reduce((s, r) => s + r.TOTAL_VOTOS, 0);
const totalEmitidos = (metricas) => metricas.reduce((s, r) => s + (r.TOTAL || 0), 0);
const emitidosPrimera = totalEmitidos(partPrimera);
const emitidosSegunda = totalEmitidos(partSegunda);

const candPrimera = nacPrimera
  .map((r) => ({
    nombre: r.CANNOMBRE,
    partido: r.PARNOMBRE,
    color: colorPartido(r.PARNOMBRE),
    votos: r.TOTAL_VOTOS,
    porcentaje: round2(r.PORCENTAJE),
  }))
  .sort((a, b) => b.votos - a.votos);

const candSegunda = nacSegunda
  .map((r) => ({
    nombre: r.CANNOMBRE,
    partido: r.PARNOMBRE,
    color: colorPartido(r.PARNOMBRE),
    votos: r.TOTAL_VOTOS,
    porcentaje: round2(r.PORCENTAJE),
  }))
  .sort((a, b) => b.votos - a.votos);

const nombresFinalistas = candSegunda.map((c) => c.nombre);

// Crecimiento de cada finalista entre vueltas.
const finalistas = candSegunda.map((seg) => {
  const pri = candPrimera.find((c) => c.nombre === seg.nombre);
  const votosPrimera = pri ? pri.votos : 0;
  const pctPrimera = pri ? pri.porcentaje : 0;
  return {
    nombre: seg.nombre,
    partido: seg.partido,
    color: seg.color,
    votos_primera: votosPrimera,
    pct_primera: pctPrimera,
    votos_segunda: seg.votos,
    pct_segunda: seg.porcentaje,
    delta_votos: seg.votos - votosPrimera,
    delta_pct: round2(seg.porcentaje - pctPrimera),
  };
});

// Candidatos eliminados en primera (bolsa de votos que quedó "en juego").
const eliminados = candPrimera.filter((c) => !nombresFinalistas.includes(c.nombre));
const votosEnJuego = eliminados.reduce((s, c) => s + c.votos, 0);

// ── Departamental ────────────────────────────────────────────────────────────
const depPrimera = readCSV('departamental/votos_por_candidato_depto.csv');
const depSegunda = readCSV('segunda/departamental/votos_por_candidato_depto.csv');

function agruparPorDepto(rows) {
  const map = {};
  rows.forEach((r) => {
    const cod = String(r.DEP).padStart(2, '0');
    if (!map[cod]) map[cod] = { nombre: r.DEPNOMBRE_COMPLETO, filas: [] };
    map[cod].filas.push(r);
  });
  return map;
}

const priByDep = agruparPorDepto(depPrimera);
const segByDep = agruparPorDepto(depSegunda);

const departamentos = Object.keys(segByDep)
  .sort()
  .map((cod) => {
    const seg = segByDep[cod];
    const pri = priByDep[cod];
    const segOrden = [...seg.filas].sort((a, b) => b.VOTOS - a.VOTOS);
    const priOrden = pri ? [...pri.filas].sort((a, b) => b.VOTOS - a.VOTOS) : [];

    const segGanador = segOrden[0];
    const segSegundo = segOrden[1];
    const priGanador = priOrden[0];

    const margenSegunda = segSegundo
      ? round2(segGanador.PORCENTAJE_DEPTO - segSegundo.PORCENTAJE_DEPTO)
      : 0;

    // Swing de cada finalista: pct segunda - pct primera en el departamento.
    const swing = finalistas.map((f) => {
      const segFila = seg.filas.find((r) => r.CANNOMBRE === f.nombre);
      const priFila = pri ? pri.filas.find((r) => r.CANNOMBRE === f.nombre) : null;
      const pctSeg = segFila ? segFila.PORCENTAJE_DEPTO : 0;
      const pctPri = priFila ? priFila.PORCENTAJE_DEPTO : 0;
      return {
        nombre: f.nombre,
        color: f.color,
        pct_primera: round2(pctPri),
        pct_segunda: round2(pctSeg),
        delta_pct: round2(pctSeg - pctPri),
      };
    });

    return {
      codigo: cod,
      nombre: seg.nombre,
      primera: priGanador
        ? { ganador: priGanador.CANNOMBRE, pct: round2(priGanador.PORCENTAJE_DEPTO) }
        : null,
      segunda: {
        ganador: segGanador.CANNOMBRE,
        pct: round2(segGanador.PORCENTAJE_DEPTO),
        margen: margenSegunda,
      },
      volteo: Boolean(priGanador && priGanador.CANNOMBRE !== segGanador.CANNOMBRE),
      swing,
    };
  });

const deptosVolteados = departamentos.filter((d) => d.volteo);

// ── Municipios que cambiaron de ganador entre vueltas ─────────────────────────
// Ganador por municipio (mayor voto). En primera ningún no-finalista gana un
// municipio, así que comparar ganadores 1ª↔2ª equivale al cambio de preferencia.
function ganadoresPorMunicipio(rows) {
  const win = {};
  const best = {};
  rows.forEach((r) => {
    const key = `${String(r.DEP).padStart(2, '0')}_${String(r.MUN).padStart(3, '0')}`;
    const v = Number(r.VOTOS) || 0;
    if (best[key] === undefined || v > best[key]) {
      best[key] = v;
      win[key] = r.CANNOMBRE;
    }
  });
  return win;
}
const munPri = ganadoresPorMunicipio(readCSV('municipal/votos_por_candidato_mun.csv'));
const munSeg = ganadoresPorMunicipio(readCSV('segunda/municipal/votos_por_candidato_mun.csv'));
const munComunes = Object.keys(munSeg).filter((k) => munPri[k] !== undefined);
const munVolteados = munComunes.filter((k) => munPri[k] !== munSeg[k]).length;
const nMunicipios = munComunes.length;
const pctMunVolteados = nMunicipios > 0 ? round2((munVolteados / nMunicipios) * 100) : 0;

// ── Trasvase estimado (lean territorial, generado por estimacion_trasvase.R) ──
// Lee data/gold/analisis/trasvase.csv si existe. Cada fila: candidato de 1ª con
// su "lean" (correlación territorial firmada) hacia el finalista de referencia.
function buildTrasvase() {
  const rows = readCSV('analisis/trasvase.csv');
  if (!rows.length) {
    console.warn('  ⚠ trasvase.csv no encontrado; corre estimacion_trasvase.R. Se omite el bloque de trasvase.');
    return null;
  }
  const ref = String(rows[0].REF);   // Abelardo (referencia del swing, lean>0)
  const otro = String(rows[0].OTRO); // Cepeda
  const colorDe = (nombre) => {
    const c = candPrimera.find((x) => x.nombre === nombre);
    return c ? c.color : DEFAULT_COLOR;
  };
  const candidatos = rows.map((r) => ({
    nombre: String(r.CANNOMBRE),
    es_finalista: String(r.ES_FINALISTA).toUpperCase() === 'TRUE',
    votos_1a: Number(r.VOTOS_1A) || 0,
    pct_1a: Number(r.PCT_1A) || 0,
    lean: Number(r.LEAN) || 0,      // signed: >0 hacia ref, <0 hacia otro
    hacia: String(r.HACIA),
    fuerza: Number(r.FUERZA) || 0,  // |lean|
    color: colorDe(String(r.CANNOMBRE)),
  }));
  return {
    referencia: ref,
    otro,
    metodologia:
      'Afinidad territorial (inferencia ecológica): correlación municipal entre la fuerza de ' +
      'cada candidato en 1ª vuelta y el swing de ' + ref + ' en 2ª. Mide tendencia, no conteo ' +
      'individual; la participación subió entre vueltas, así que parte del crecimiento son votantes nuevos.',
    candidatos,
  };
}
const trasvase = buildTrasvase();

// ── Salida ───────────────────────────────────────────────────────────────────
const comparativa = {
  generado: new Date().toISOString(),
  metodologia:
    'Comparación agregada primera vs segunda vuelta. Los deltas y la "bolsa en juego" ' +
    'son contabilidad de resultados, no atribución individual de trasvase de votos.',
  nacional: {
    primera: {
      votos_validos: validosPrimera,
      votos_emitidos: emitidosPrimera,
      candidatos: candPrimera,
    },
    segunda: {
      votos_validos: validosSegunda,
      votos_emitidos: emitidosSegunda,
      candidatos: candSegunda,
    },
    finalistas,
    eliminados,
    votos_en_juego: votosEnJuego,
    cambio_votos_emitidos: {
      primera: emitidosPrimera,
      segunda: emitidosSegunda,
      delta: emitidosSegunda - emitidosPrimera,
      delta_pct: round2(((emitidosSegunda - emitidosPrimera) / emitidosPrimera) * 100),
    },
  },
  trasvase,
  departamentos,
  resumen: {
    n_departamentos: departamentos.length,
    n_volteados: deptosVolteados.length,
    n_municipios: nMunicipios,
    municipios_volteados: munVolteados,
    pct_municipios_volteados: pctMunVolteados,
    departamentos_volteados: deptosVolteados.map((d) => ({
      codigo: d.codigo,
      nombre: d.nombre,
      de: d.primera ? d.primera.ganador : null,
      a: d.segunda.ganador,
      margen_segunda: d.segunda.margen,
    })),
  },
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(comparativa, null, 2));
console.log(`✓ comparativa.json generado (${departamentos.length} deptos, ${deptosVolteados.length} volteados).`);
console.log(`  Finalistas: ${finalistas.map((f) => `${f.nombre.split(' ')[0]} ${f.pct_primera}%→${f.pct_segunda}%`).join(' | ')}`);
console.log(`  Votos en juego (eliminados 1ª): ${votosEnJuego.toLocaleString('es-CO')}`);
