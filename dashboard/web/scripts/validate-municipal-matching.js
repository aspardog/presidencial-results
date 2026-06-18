#!/usr/bin/env node

/**
 * Valida que los datos municipales del GeoJSON coincidan con los datos electorales.
 *
 * Este script previene regresiones donde cambios en el formato de datos
 * rompen el matching entre GeoJSON (códigos DANE) y datos electorales.
 *
 * Se ejecuta como parte de `npm run validate`.
 */

const fs = require('fs');
const path = require('path');

const MIN_MATCH_RATE = 0.95; // 95% mínimo de matching
const PUBLIC_API = path.resolve(__dirname, '../public/api');

// Misma lógica de normalización que MapaElectoral.tsx
function normalizarNombre(nombre) {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[.,()]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

// Cargar mapeo DANE -> Electoral
const DANE_TO_ELECTORAL = {
  '05': '01', '08': '03', '13': '05', '15': '07', '17': '09',
  '19': '11', '20': '12', '23': '13', '25': '15', '11': '16',
  '27': '17', '41': '19', '47': '21', '52': '23', '66': '24',
  '54': '25', '63': '26', '68': '27', '70': '28', '73': '29',
  '76': '31', '81': '40', '18': '44', '85': '46', '44': '48',
  '94': '50', '50': '52', '95': '54', '88': '56', '91': '60',
  '86': '64', '97': '68', '99': '72',
};

function getCodigoElectoral(daneCodigo) {
  return DANE_TO_ELECTORAL[daneCodigo] || daneCodigo;
}

function validateMunicipalMatching() {
  console.log('Validating municipal data matching...\n');

  // Cargar datos electorales
  const municipiosPath = path.join(PUBLIC_API, 'departamentos/municipios.json');
  if (!fs.existsSync(municipiosPath)) {
    console.error('ERROR: departamentos/municipios.json not found');
    process.exit(1);
  }
  const municipiosData = JSON.parse(fs.readFileSync(municipiosPath, 'utf8'));

  // Crear mapa de lookup por nombre
  const municipiosVotosMap = new Map();
  const municipiosPorDepto = new Map();

  Object.entries(municipiosData).forEach(([dptoCodigo, municipios]) => {
    municipiosPorDepto.set(dptoCodigo, municipios);
    municipios.forEach((mun) => {
      const key = `${dptoCodigo}_${normalizarNombre(mun.nombre)}`;
      municipiosVotosMap.set(key, mun);
    });
  });

  // Función de búsqueda (igual que en MapaElectoral.tsx)
  function getMunicipioVotos(codigoDeptoElectoral, nombreMunicipio) {
    const nombreNorm = normalizarNombre(nombreMunicipio);
    const key = `${codigoDeptoElectoral}_${nombreNorm}`;

    const exactMatch = municipiosVotosMap.get(key);
    if (exactMatch) return exactMatch;

    const municipiosDepto = municipiosPorDepto.get(codigoDeptoElectoral);
    if (municipiosDepto) {
      const match = municipiosDepto.find(m => {
        const nombreElectoral = normalizarNombre(m.nombre);
        return nombreElectoral.includes(nombreNorm) || nombreNorm.includes(nombreElectoral);
      });
      if (match) return match;
    }

    return undefined;
  }

  // Verificar todos los GeoJSON municipales
  const municipiosDir = path.join(PUBLIC_API, 'mapas/municipios');
  if (!fs.existsSync(municipiosDir)) {
    console.error('ERROR: mapas/municipios/ directory not found');
    process.exit(1);
  }

  const geoFiles = fs.readdirSync(municipiosDir).filter(f => f.endsWith('.json'));

  let totalMunicipios = 0;
  let totalMatches = 0;
  const noMatches = [];
  const deptoStats = [];

  geoFiles.forEach(file => {
    const daneCodigo = file.replace('.json', '');
    const electoralCodigo = getCodigoElectoral(daneCodigo);
    const geoPath = path.join(municipiosDir, file);
    const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

    let deptoMatches = 0;
    const deptoTotal = geoData.features.length;

    geoData.features.forEach(f => {
      const nombreGeo = f.properties.mpio_cnmbr;
      const deptoNombre = f.properties.dpto_cnmbr;
      const data = getMunicipioVotos(electoralCodigo, nombreGeo);

      totalMunicipios++;
      if (data) {
        totalMatches++;
        deptoMatches++;

        // Verificar que tiene datos de votos
        if (!data.total_votos || data.total_votos === 0) {
          noMatches.push({
            depto: deptoNombre,
            municipio: nombreGeo,
            issue: 'Matched but total_votos = 0',
          });
        }
      } else {
        noMatches.push({
          depto: deptoNombre,
          municipio: nombreGeo,
          issue: 'No match found',
        });
      }
    });

    deptoStats.push({
      dane: daneCodigo,
      electoral: electoralCodigo,
      matches: deptoMatches,
      total: deptoTotal,
      rate: (deptoMatches / deptoTotal * 100).toFixed(1),
    });
  });

  // Mostrar resultados
  const matchRate = totalMatches / totalMunicipios;
  console.log(`Match rate: ${totalMatches}/${totalMunicipios} (${(matchRate * 100).toFixed(1)}%)\n`);

  if (noMatches.length > 0 && noMatches.length <= 10) {
    console.log('Municipalities without matches:');
    noMatches.forEach(nm => {
      console.log(`  - ${nm.depto}: ${nm.municipio} (${nm.issue})`);
    });
    console.log('');
  } else if (noMatches.length > 10) {
    console.log(`${noMatches.length} municipalities without matches (showing first 10):`);
    noMatches.slice(0, 10).forEach(nm => {
      console.log(`  - ${nm.depto}: ${nm.municipio} (${nm.issue})`);
    });
    console.log('');
  }

  // Departamentos con bajo matching
  const lowMatchDeptos = deptoStats.filter(d => d.matches < d.total);
  if (lowMatchDeptos.length > 0) {
    console.log('Departments with missing matches:');
    lowMatchDeptos.forEach(d => {
      console.log(`  - DANE ${d.dane} -> Electoral ${d.electoral}: ${d.matches}/${d.total} (${d.rate}%)`);
    });
    console.log('');
  }

  // Validar umbral mínimo
  if (matchRate < MIN_MATCH_RATE) {
    console.error(`FAILED: Match rate ${(matchRate * 100).toFixed(1)}% is below minimum ${MIN_MATCH_RATE * 100}%`);
    console.error('This usually means:');
    console.error('  1. GeoJSON property names changed');
    console.error('  2. Electoral data format changed');
    console.error('  3. DANE/Electoral code mapping is incorrect');
    console.error('\nCheck src/components/maps/MapaElectoral.tsx for the matching logic.');
    process.exit(1);
  }

  console.log('Municipal matching validation PASSED.');
  return true;
}

validateMunicipalMatching();
