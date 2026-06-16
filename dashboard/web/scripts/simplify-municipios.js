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

function pickProperties(properties) {
  return {
    dpto_ccdgo: properties.dpto_ccdgo,
    mpio_ccdgo: properties.mpio_ccdgo,
    mpio_cdpmp: properties.mpio_cdpmp,
    dpto_cnmbr: properties.dpto_cnmbr,
    mpio_cnmbr: properties.mpio_cnmbr,
    ganador: properties.ganador,
    votos_ganador: properties.votos_ganador,
    porcentaje_ganador: properties.porcentaje_ganador,
    total_votos: properties.total_votos,
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
  simplifyGeometry,
  simplifyRing,
};
