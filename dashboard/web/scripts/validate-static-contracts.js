#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_API_DIR = path.join(ROOT_DIR, 'public/api');
const DATA_DIR = path.resolve(ROOT_DIR, '../../../data/gold');
const EXPECTED_PROJECT_NAME = 'voto-colombia-2026';

const DANE_TO_ELECTORAL = {
  '05': '01',
  '08': '03',
  '13': '05',
  '15': '07',
  '17': '09',
  '19': '11',
  '20': '12',
  '23': '13',
  '25': '15',
  '11': '16',
  '27': '17',
  '41': '19',
  '47': '21',
  '52': '23',
  '66': '24',
  '54': '25',
  '63': '26',
  '68': '27',
  '70': '28',
  '73': '29',
  '76': '31',
  '81': '40',
  '18': '44',
  '85': '46',
  '44': '48',
  '94': '50',
  '50': '52',
  '95': '54',
  '88': '56',
  '91': '60',
  '86': '64',
  '97': '68',
  '99': '72',
};

const failures = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readJson(relativePath) {
  const fullPath = path.join(ROOT_DIR, relativePath);
  assert(fs.existsSync(fullPath), `Missing file: ${relativePath}`);
  if (!fs.existsSync(fullPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((header) => header.replace(/"/g, '').trim());

  return lines.slice(1).map((line) => {
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

    return headers.reduce((row, header, index) => {
      const value = values[index] || '';
      const numberValue = Number(value);
      row[header] = value !== '' && Number.isFinite(numberValue) ? numberValue : value;
      return row;
    }, {});
  });
}

function readSourceCSV(relativePath) {
  const fullPath = path.join(DATA_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return parseCSV(fs.readFileSync(fullPath, 'utf8'));
}

function normalizeCode(value) {
  return String(value || '').padStart(2, '0');
}

function validateVercelProject() {
  if (process.env.VERCEL_PROJECT_NAME) {
    assert(
      process.env.VERCEL_PROJECT_NAME === EXPECTED_PROJECT_NAME,
      `VERCEL_PROJECT_NAME is "${process.env.VERCEL_PROJECT_NAME}", expected "${EXPECTED_PROJECT_NAME}".`
    );
    return;
  }

  const projectPath = path.join(ROOT_DIR, '.vercel/project.json');
  if (!fs.existsSync(projectPath)) return;

  const project = readJson('.vercel/project.json');
  if (!project) return;

  if (!project.projectName) return;

  assert(
    project.projectName === EXPECTED_PROJECT_NAME,
    `.vercel/project.json points to "${project.projectName}", expected "${EXPECTED_PROJECT_NAME}".`
  );
}

function validatePublicApi() {
  assert(fs.existsSync(PUBLIC_API_DIR), 'Missing public/api directory.');

  const resumen = readJson('public/api/nacional/resumen.json');
  const candidatos = readJson('public/api/nacional/candidatos.json');
  const departamentos = readJson('public/api/departamentos/lista.json');
  const detalle = readJson('public/api/departamentos/detalle.json');
  const municipios = readJson('public/api/departamentos/municipios.json');
  const claves = readJson('public/api/analisis/claves-territoriales.json');
  const geojson = readJson('public/api/mapas/departamentos.json');

  if (!resumen || !Array.isArray(candidatos) || !Array.isArray(departamentos) || !detalle || !municipios || !claves || !geojson) {
    return;
  }

  const totalCandidatos = candidatos.reduce((sum, candidato) => sum + (candidato.votos || 0), 0);
  const desgloseTotal =
    (resumen.votos_validos || 0) +
    (resumen.votos_blancos || 0) +
    (resumen.votos_nulos || 0) +
    (resumen.votos_no_marcados || 0);

  assert(resumen.total_votos > 0, 'resumen.total_votos must be greater than zero.');
  assert(resumen.votos_validos > 0, 'resumen.votos_validos must be greater than zero.');
  assert(resumen.total_votos === desgloseTotal, 'resumen.total_votos does not match its vote breakdown.');
  assert(resumen.votos_validos === totalCandidatos, 'resumen.votos_validos does not match candidate vote sum.');
  assert(candidatos.length >= 2, 'At least two national candidates are required.');
  assert(candidatos[0]?.nombre === resumen.ganador, 'National winner does not match candidatos[0].');
  assert(candidatos[0]?.votos === resumen.votos_ganador, 'Winner vote total does not match candidatos[0].');
  assert(candidatos[1]?.nombre === resumen.segundo, 'National runner-up does not match candidatos[1].');
  assert(candidatos[1]?.votos === resumen.votos_segundo, 'Runner-up vote total does not match candidatos[1].');

  const detalleCodes = new Set(Object.keys(detalle).map(normalizeCode));
  const departamentoCodes = new Set(departamentos.map((depto) => normalizeCode(depto.codigo)));
  const totalDepartamentos = departamentos.reduce((sum, depto) => sum + (depto.total_votos || 0), 0);

  assert(departamentos.length === 33, `Expected 33 departments, found ${departamentos.length}.`);
  assert(detalleCodes.size === 33, `Expected 33 department detail entries, found ${detalleCodes.size}.`);
  assert(Object.keys(municipios).length === 33, `Expected municipal breakdown for 33 departments, found ${Object.keys(municipios).length}.`);
  assert(totalDepartamentos === resumen.votos_validos, 'Department vote total does not match national valid votes.');

  for (const depto of departamentos) {
    const codigo = normalizeCode(depto.codigo);
    const deptoDetalle = detalle[codigo];
    const deptoMunicipios = municipios[codigo];

    assert(detalleCodes.has(codigo), `Department ${codigo} is missing from detalle.json.`);
    assert(depto.total_votos > 0, `Department ${codigo} has no votes.`);
    assert(deptoDetalle?.candidatos?.length >= 2, `Department ${codigo} needs at least two candidates.`);
    assert(deptoDetalle?.ganador === depto.ganador, `Department ${codigo} winner mismatch between lista and detalle.`);
    assert(Array.isArray(deptoMunicipios), `Department ${codigo} is missing municipal breakdown.`);
    assert(
      deptoMunicipios?.length === deptoDetalle?.total_municipios,
      `Department ${codigo} municipal breakdown count does not match total_municipios.`
    );

    for (const municipio of deptoMunicipios || []) {
      assert(Boolean(municipio.codigo), `Department ${codigo} has a municipality without code.`);
      assert(Boolean(municipio.nombre), `Department ${codigo} has a municipality without name.`);
      assert(municipio.total_votos > 0, `Municipality ${codigo}-${municipio.codigo} has no votes.`);
      assert(Boolean(municipio.ganador), `Municipality ${codigo}-${municipio.codigo} has no winner.`);
      assert(municipio.votos_ganador > 0, `Municipality ${codigo}-${municipio.codigo} has no winner votes.`);
    }
  }

  assert(geojson.type === 'FeatureCollection', 'Map file must be a GeoJSON FeatureCollection.');
  assert(Array.isArray(geojson.features), 'Map file must include a features array.');
  assert(geojson.features.length === 33, `Expected 33 map features, found ${geojson.features?.length || 0}.`);
  assert(!fs.existsSync(path.join(PUBLIC_API_DIR, 'mapas/departamentos.geojson')), 'Stale mapas/departamentos.geojson must not exist.');

  for (const feature of geojson.features || []) {
    const daneCode = normalizeCode(feature.properties?.dpto_ccdgo);
    const electoralCode = DANE_TO_ELECTORAL[daneCode];
    assert(Boolean(electoralCode), `Map feature has unknown DANE code ${daneCode}.`);
    assert(detalleCodes.has(electoralCode), `Map feature DANE ${daneCode} does not resolve to a department detail entry.`);
  }

  assert(Array.isArray(claves.lectura) && claves.lectura.length >= 3, 'Key findings need at least three synthesis items.');
  assert(Array.isArray(claves.departamentos_competidos) && claves.departamentos_competidos.length >= 5, 'Key findings need competed departments.');
  assert(Array.isArray(claves.ventajas_decisivas) && claves.ventajas_decisivas.length >= 5, 'Key findings need decisive advantages.');
  assert(Array.isArray(claves.fortalezas) && claves.fortalezas.length >= 3, 'Key findings need candidate strengths.');

  for (const item of [...claves.departamentos_competidos, ...claves.ventajas_decisivas]) {
    assert(departamentoCodes.has(normalizeCode(item.codigo)), `Finding references unknown department code ${item.codigo}.`);
  }

  const sourceCandidates = readSourceCSV('nacional/votos_por_candidato.csv');
  if (sourceCandidates) {
    const sourceValidVotes = sourceCandidates.reduce((sum, row) => sum + (row.TOTAL_VOTOS || 0), 0);
    assert(
      sourceValidVotes === resumen.votos_validos,
      'public/api/nacional/resumen.json is stale against data/gold/nacional/votos_por_candidato.csv. Run npm run build:data.'
    );
  }
}

function validateSourceContracts() {
  const pageSource = fs.readFileSync(path.join(ROOT_DIR, 'src/app/page.tsx'), 'utf8');
  const hallazgosSource = fs.readFileSync(path.join(ROOT_DIR, 'src/components/analysis/HallazgosClave.tsx'), 'utf8');

  assert(pageSource.includes('HallazgosClave'), 'Home page must render the unified HallazgosClave component.');
  assert(!pageSource.includes('ClavesTerritoriales'), 'Home page must not render a separate ClavesTerritoriales section.');
  assert(!fs.existsSync(path.join(ROOT_DIR, 'src/components/analysis/ClavesTerritoriales.tsx')), 'Separate ClavesTerritoriales component must not be restored.');
  assert(hallazgosSource.includes('Síntesis electoral'), 'Unified findings must include the territorial synthesis block.');
}

function main() {
  validateVercelProject();
  validatePublicApi();
  validateSourceContracts();

  if (failures.length) {
    console.error('\nStatic contract validation failed:\n');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Static contract validation passed.');
}

main();
