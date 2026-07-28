# Idea: "Voto por estrato" por ciudad

**Estado:** validado con datos reales de Cali (no implementado en UI). Retomar cuando haya tiempo.
**Autor de la nota:** sesión Claude Code, jul-2026.

## La idea

Cruzar el **voto por comuna** (ya en el tablero) con el **estrato socioeconómico** de cada
comuna → un gráfico **"Voto por estrato"** (barras estrato 1→6 con el % de cada candidato + el
coeficiente de correlación) en cada ciudad (Bogotá, Medellín, Cali).

Es probablemente el insight más contundente del tablero para explicar el *porqué* del voto:
en Colombia el estrato es el mejor predictor socioeconómico disponible y está tabulado.

## Evidencia (Cali, dato REAL, 2ª vuelta)

Media ponderada de estrato por comuna (viviendas) × voto por comuna:

| Estrato | Comunas | Cepeda % | Espriella % |
|--:|:--:|:--:|:--:|
| 1 | 4 | 76,6 | 23,4 |
| 2 | 7 | 69,0 | 31,0 |
| 3 | 7 | 58,8 | 41,2 |
| 4 | 2 | 43,0 | 57,0 ← se voltea |
| 5 | 1 | 40,8 | 59,2 |
| 6 | 1 | 20,5 | 79,5 |

**Correlación estrato ↔ %Cepeda: r = −0,96** (n=22 comunas). Gradiente monótono casi perfecto,
cruce entre estrato 3 y 4.

## Método (ecológico, nivel comuna)

1. Estrato por comuna = **media ponderada por viviendas** del desglose estrato 1–6 (o estrato
   moda). Redondear para binning 1–6.
2. Join con el voto por comuna: `public/api/{vuelta}/ciudades/{slug}.json` (campo `numero` de
   comuna) y `public/api/{vuelta}/bogota/localidades.json` (campo `codigo`).
3. Agrupar comunas por estrato → % de cada candidato **ponderado por votos** del bin.
4. Reportar `r` (correlación estrato de comuna ↔ % ganador nacional).

**Salvedad (importante, mostrar en UI):** es *ecológico* — mide el estrato del **área**, no del
votante individual. Con r tan alto es muy revelador, pero no es "los de estrato 6 votaron X".

## Fuentes de estrato por ciudad

- **Cali ✅** (ya descargado y probado): CSV oficial "Estratificación socioeconómica urbana por
  comunas en Cali 2015" — viviendas por estrato 1–6 + estrato moda, por comuna 1–22.
  `https://datos.cali.gov.co/dataset/89db273a-dcd0-459c-b995-621dbf1f94c9/resource/88f7450b-59d7-42f5-aaa3-010dbca9976b/download/estratificaci_n_socioecon_mica_urbana_por_comunas_en_cali_a_o_2015.csv`
  (Buscar en CKAN: `datos.cali.gov.co/api/3/action/package_search?q=estrato`. También hay capa
  WFS `dapm:pdt_est_estrato_urbano_expansion` en `ws-idesc.cali.gov.co`.)
- **Medellín 🟡** (pendiente): datos abiertos Medellín / GeoMedellín — buscar "estrato por comuna"
  o "estratificación". Mismo formato esperado (viviendas por estrato × comuna).
- **Bogotá 🟡** (pendiente): datos abiertos Bogotá / SDP — estrato por manzana/UPZ; agregar a
  localidad (código 01–20). **Caveat:** las localidades son más mezcladas en estrato que las
  comunas → gradiente más suave / r más bajo que Cali-Medellín.

## Implementación (pasos)

1. **Datos:** bajar estrato-por-comuna de las 3 ciudades → tabla común (p. ej. gold
   `data/gold/ciudades/estrato_por_comuna.csv` con columnas `ciudad, codigo, estrato_medio,
   estrato_moda`). O un lookup en `build-data.js`.
2. **build-data.js:** añadir `estrato` a cada unidad de `ciudades/{slug}.json` /
   `bogota/localidades.json`, **y/o** emitir un bloque `voto_por_estrato` (bins 1–6 con %
   ponderado por candidato + `r`) en cada JSON de ciudad.
3. **UI:** componente `VotoPorEstrato` (barras estrato 1→6, % por candidato, badge con `r` y nota
   ecológica). Insertar en `VistaCiudad` y `VistaBogota`.
4. **Validación + preview + deploy** (flujo de ciudades ya existente).

## Snippet de análisis (reproducible, Node)

Parsear el CSV de estrato (media ponderada) y cruzar con `ciudades/cali.json`:

```js
// media estrato por comuna = Σ(estrato_i * viviendas_i) / Σ viviendas_i
// join por numero de comuna; bin = round(media); % ponderado por total_votos del bin.
// Ver historial de la sesión (jul-2026) para el script completo; r = corr(media, %ganador).
```

## Por qué vale la pena

Explica el eje que estructura las 3 ciudades: Medellín (gradiente de riqueza, Espriella barrió
pero El Poblado 90% vs Popular 51%), Cali (dos Calis, r=−0,96), Bogotá (norte-sur más suave).
Convierte el mapa de "quién ganó" en un mapa de "por qué".

Relacionado: los otros insights propuestos (swing 1ª→2ª, dónde se decidió, bastiones espejo)
también salen de los JSON actuales — ver historial de la sesión.
