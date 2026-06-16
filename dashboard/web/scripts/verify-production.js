#!/usr/bin/env node

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://voto-colombia-2026.vercel.app';

const forbiddenText = [
  'Claves territoriales',
];

const numberFormatter = new Intl.NumberFormat('es-CO');

async function fetchJson(pathname) {
  const response = await fetch(new URL(pathname, PUBLIC_URL));
  if (!response.ok) {
    throw new Error(`${pathname} returned HTTP ${response.status}`);
  }
  return response.json();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const resumen = await fetchJson('/api/nacional/resumen.json');
  const candidatos = await fetchJson('/api/nacional/candidatos.json');
  const departamentos = await fetchJson('/api/departamentos/lista.json');
  const detalle = await fetchJson('/api/departamentos/detalle.json');
  const mapa = await fetchJson('/api/mapas/departamentos.json');

  const response = await fetch(PUBLIC_URL);
  assert(response.ok, `${PUBLIC_URL} returned HTTP ${response.status}`);

  const html = (await response.text()).replace(/<!-- -->/g, '');
  const requiredText = [
    'Hallazgos clave',
    'Más reñido',
    'Mayor ventaja',
    'Bastiones electorales',
    numberFormatter.format(resumen.total_votos),
    numberFormatter.format(resumen.votos_validos),
  ];

  for (const text of requiredText) {
    assert(html.includes(text), `Production HTML is missing "${text}".`);
  }

  for (const text of forbiddenText) {
    assert(!html.includes(text), `Production HTML still contains "${text}".`);
  }

  const totalCandidatos = candidatos.reduce((sum, candidato) => sum + candidato.votos, 0);

  assert(resumen.total_votos > 0, 'Production resumen.total_votos is zero.');
  assert(resumen.votos_validos === totalCandidatos, 'Production valid votes do not match candidate votes.');
  assert(departamentos.length === 33, `Production department list has ${departamentos.length} entries.`);
  assert(Object.keys(detalle).length === 33, `Production department detail has ${Object.keys(detalle).length} entries.`);
  assert(mapa.features?.length === 33, `Production map has ${mapa.features?.length || 0} features.`);

  console.log(`Production verification passed for ${PUBLIC_URL}.`);
}

main().catch((error) => {
  console.error(`Production verification failed: ${error.message}`);
  process.exit(1);
});
