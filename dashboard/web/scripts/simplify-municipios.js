#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_VERTEX_RATIO = 0.035;
const DEFAULT_PRECISION = 5;
const DEFAULT_SOURCE = path.resolve(
  __dirname,
  '../../../data/gold/visualizaciones/mapas/geojson/municipios_electoral.geojson'
);
const DEFAULT_DESTINATION = path.resolve(
  __dirname,
  '../public/api/mapas/municipios.json'
);
const ELECTORAL_DATA_PATH = path.resolve(
  __dirname,
  '../public/api/departamentos/municipios.json'
);

// Mapeo DANE -> Electoral
const DANE_TO_ELECTORAL = {
  '05': '01', '08': '03', '13': '05', '15': '07', '17': '09',
  '19': '11', '20': '12', '23': '13', '25': '15', '11': '16',
  '27': '17', '41': '19', '47': '21', '52': '23', '66': '24',
  '54': '25', '63': '26', '68': '27', '70': '28', '73': '29',
  '76': '31', '81': '40', '18': '44', '85': '46', '44': '48',
  '94': '50', '50': '52', '95': '54', '88': '56', '91': '60',
  '86': '64', '97': '68', '99': '72',
};

/**
 * Normaliza un nombre de municipio para matching.
 */
function normalizarNombre(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[.,()-]/g, '') // Incluye guiones
    .replace(/\s+/g, '')
    .trim();
}

// Mapeo manual para municipios con nombres muy diferentes entre DANE y electoral
const NOMBRE_ALIASES = {
  '05_SANTACRUZDEMOMPOX': 'MOMPOS',
  '07_VILLADELEYVA': 'VILLADELEIVA',
  '11_LOPEZDEMICAY': 'LOPEZMICAY',
  '60_MIRITIPARANA': 'MIRITIPARANA',
  '68_PAPUNAHUA': 'MORICHALPAPUNAGUA',
};

// Cargar datos electorales y crear mapa de lookup
let electoralDataMap = null;
let electoralDataByDepto = null;

function loadElectoralData() {
  if (electoralDataMap) return;

  if (!fs.existsSync(ELECTORAL_DATA_PATH)) {
    console.warn('  ! Electoral data not found, ganador enrichment disabled');
    return;
  }

  const data = JSON.parse(fs.readFileSync(ELECTORAL_DATA_PATH, 'utf-8'));
  electoralDataMap = new Map();
  electoralDataByDepto = new Map();

  Object.entries(data).forEach(([dptoCodigo, municipios]) => {
    electoralDataByDepto.set(dptoCodigo, municipios);
    municipios.forEach((mun) => {
      const key = `${dptoCodigo}_${normalizarNombre(mun.nombre)}`;
      electoralDataMap.set(key, mun);
    });
  });
}

/**
 * Busca el ganador de un municipio en datos electorales.
 */
function getGanadorFromElectoral(dptoDane, nombreMunicipio) {
  loadElectoralData();
  if (!electoralDataMap) return null;

  const deptoElectoral = DANE_TO_ELECTORAL[dptoDane] || dptoDane;
  const nombreNorm = normalizarNombre(nombreMunicipio);
  const key = `${deptoElectoral}_${nombreNorm}`;

  // Match exacto
  let mun = electoralDataMap.get(key);
  if (mun) return mun.ganador;

  // Match por alias
  const aliasNombre = NOMBRE_ALIASES[key];
  if (aliasNombre) {
    const aliasKey = `${deptoElectoral}_${aliasNombre}`;
    mun = electoralDataMap.get(aliasKey);
    if (mun) return mun.ganador;
  }

  // Match parcial
  const municipiosDepto = electoralDataByDepto.get(deptoElectoral);
  if (municipiosDepto) {
    mun = municipiosDepto.find(m => {
      const nombreElectoral = normalizarNombre(m.nombre);
      return nombreElectoral.includes(nombreNorm) || nombreNorm.includes(nombreElectoral);
    });
    if (mun) return mun.ganador;
  }

  return null;
}

function roundCoordinate([lng, lat], precision) {
  const scale = 10 ** precision;
  return [
    Math.round(lng * scale) / scale,
    Math.round(lat * scale) / scale,
  ];
}

function sameCoordinate(a, b) {
  return Boolean(a && b && a[0] === b[0] && a[1] === b[1]);
}

function simplifyRing(ring, vertexRatio, precision) {
  if (!Array.isArray(ring) || ring.length <= 4) {
    return ring.map((position) => roundCoordinate(position, precision));
  }

  const step = Math.max(1, Math.round(1 / vertexRatio));
  const source = sameCoordinate(ring[0], ring[ring.length - 1])
    ? ring.slice(0, -1)
    : ring;

  let simplified = [];
  for (let i = 0; i < source.length; i += 1) {
    if (i === 0 || i === source.length - 1 || i % step === 0) {
      simplified.push(roundCoordinate(source[i], precision));
    }
  }

  if (simplified.length < 3) {
    simplified = source.slice(0, 3).map((position) => roundCoordinate(position, precision));
  }

  simplified.push(simplified[0]);
  return simplified;
}

function simplifyGeometry(geometry, vertexRatio, precision) {
  if (!geometry) return geometry;

  if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates
        .map((ring) => simplifyRing(ring, vertexRatio, precision))
        .filter((ring) => ring.length >= 4),
    };
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates
        .map((polygon) =>
          polygon
            .map((ring) => simplifyRing(ring, vertexRatio, precision))
            .filter((ring) => ring.length >= 4)
        )
        .filter((polygon) => polygon.length > 0),
    };
  }

  return geometry;
}

// Propiedades mínimas para el mapa - ganador necesario para colorear
// Propiedades de votos detallados están en departamentos/municipios.json
function pickProperties(properties) {
  // Si ganador está vacío, enriquecerlo desde datos electorales
  let ganador = properties.ganador;
  if (!ganador) {
    ganador = getGanadorFromElectoral(properties.dpto_ccdgo, properties.mpio_cnmbr);
  }

  return {
    dpto_ccdgo: properties.dpto_ccdgo,
    mpio_ccdgo: properties.mpio_ccdgo,
    mpio_cdpmp: properties.mpio_cdpmp,
    dpto_cnmbr: properties.dpto_cnmbr,
    mpio_cnmbr: properties.mpio_cnmbr,
    ganador: ganador || '', // Necesario para colorear el mapa
  };
}

function simplifyMunicipios({
  source = DEFAULT_SOURCE,
  destination = DEFAULT_DESTINATION,
  vertexRatio = DEFAULT_VERTEX_RATIO,
  precision = DEFAULT_PRECISION,
} = {}) {
  if (!fs.existsSync(source)) {
    console.warn(`  ! No encontrado: ${path.relative(process.cwd(), source)}`);
    return null;
  }

  const originalSize = fs.statSync(source).size;
  const data = JSON.parse(fs.readFileSync(source, 'utf-8'));

  const simplified = {
    type: 'FeatureCollection',
    features: data.features.map((feature) => ({
      type: 'Feature',
      properties: pickProperties(feature.properties || {}),
      geometry: simplifyGeometry(feature.geometry, vertexRatio, precision),
    })),
  };

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(simplified));

  const newSize = fs.statSync(destination).size;
  return {
    source,
    destination,
    features: simplified.features.length,
    originalSize,
    newSize,
    vertexRatio,
    precision,
  };
}

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

/**
 * Divide los municipios en archivos separados por departamento.
 * Esto reduce drásticamente el tamaño de descarga por sesión.
 */
function simplifyMunicipiosByDepartment({
  source = DEFAULT_SOURCE,
  destinationDir = path.resolve(__dirname, '../public/api/mapas/municipios'),
  vertexRatio = DEFAULT_VERTEX_RATIO,
  precision = DEFAULT_PRECISION,
} = {}) {
  if (!fs.existsSync(source)) {
    console.warn(`  ! No encontrado: ${path.relative(process.cwd(), source)}`);
    return null;
  }

  const originalSize = fs.statSync(source).size;
  const data = JSON.parse(fs.readFileSync(source, 'utf-8'));

  // Agrupar features por departamento
  const byDepartment = {};
  data.features.forEach((feature) => {
    const deptCode = feature.properties?.dpto_ccdgo;
    if (!deptCode) return;

    if (!byDepartment[deptCode]) {
      byDepartment[deptCode] = [];
    }

    byDepartment[deptCode].push({
      type: 'Feature',
      properties: pickProperties(feature.properties || {}),
      geometry: simplifyGeometry(feature.geometry, vertexRatio, precision),
    });
  });

  // Crear directorio de salida
  fs.mkdirSync(destinationDir, { recursive: true });

  // Escribir un archivo por departamento
  let totalNewSize = 0;
  const departmentStats = [];

  Object.entries(byDepartment).forEach(([deptCode, features]) => {
    const deptGeoJSON = {
      type: 'FeatureCollection',
      features,
    };

    const destPath = path.join(destinationDir, `${deptCode}.json`);
    fs.writeFileSync(destPath, JSON.stringify(deptGeoJSON));

    const fileSize = fs.statSync(destPath).size;
    totalNewSize += fileSize;

    departmentStats.push({
      code: deptCode,
      features: features.length,
      size: fileSize,
    });
  });

  return {
    source,
    destinationDir,
    departments: Object.keys(byDepartment).length,
    totalFeatures: data.features.length,
    originalSize,
    totalNewSize,
    averageSize: totalNewSize / Object.keys(byDepartment).length,
    departmentStats,
    vertexRatio,
    precision,
  };
}

if (require.main === module) {
  const result = simplifyMunicipios();
  if (result) {
    console.log(
      `  OK mapas/municipios.json (${formatMB(result.originalSize)} -> ${formatMB(result.newSize)}, ${Math.round(result.vertexRatio * 1000) / 10}% de vertices)`
    );
  }
}

module.exports = {
  simplifyMunicipios,
  simplifyMunicipiosByDepartment,
  simplifyGeometry,
  simplifyRing,
  formatMB,
  formatKB,
};
