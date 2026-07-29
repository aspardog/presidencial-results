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

---

# Anexo: nivel barrio/puesto (el máximo rigor factible)

**Sí se puede a nivel barrio (Bogotá y las 3 ciudades).** El voto no baja del **puesto de
votación**, pero hay **216–1.083 puestos por ciudad** (Cali 216, Medellín 250, Bogotá 1.083) vs
~16–22 comunas → ×10–50 más puntos, capturando la variación *dentro* de cada comuna.

## El supuesto que lo habilita

Asumir que **el votante reside en el barrio de su puesto** ⇒ puesto ≡ barrio, y el estrato del
puesto = estrato asumido del votante. Es el supuesto estándar en análisis electoral colombiano.

**Discusión de validez:**
- A favor: la cédula se inscribe por residencia; los puestos son de barrio (colegios); la mayoría
  vota cerca de casa.
- Se rompe en: *inscripción de cédula* (re-registro), **mega-puestos** centrales (Corferias,
  universidades) con captación amplia, y "puestos censo" especiales.
- Mitigación: excluir especiales (ya bucketeados), **ponderar por votos**, bajar peso a
  mega-puestos, declarar el supuesto en la UI. Efecto: ruido modesto, no sesgo sistemático.

## Método (point-in-polygon, sin Voronoi)

1. Voto por puesto (agregar `datos_master` por `PUESTO`) — ✅ disponible.
2. **Geocodificar** cada puesto → coordenadas.
3. **Point-in-polygon**: puesto → estrato de su manzana/barrio.
4. Regresión ponderada por votos: `%voto_puesto ~ estrato_puesto` (+ incertidumbre).

## Paso frágil = geocodificar + unir puestos

Electoral identifica puestos por código DIVIPOL (dep/mun/zona/puesto) + `PUESNOMBRE` (nombre del
colegio). Match con la capa geocodificada por **nombre** (fuzzy, ~200–1.000/ciudad, validar
cobertura como con los corregimientos).
- **Bogotá ✅:** capa dedicada georreferenciada en Datos Abiertos Bogotá (coords + WFS/REST).
- **Nacional (datos.gov.co `iuwx-frrw`):** solo `departamento, municipio, colegio,
  puesto_de_votacion, direccion` — **SIN coordenadas** → geocodificar direcciones (frágil).
- **Cali/Medellín:** buscar capa de puestos en IDESC / GeoMedellín; si no, geocodificar direcciones.

## Estrato-manzana por ciudad
Cali ✅ WFS IDESC (`dapm:pdt_est_estrato_*`); Bogotá ✅ IDECA; Medellín GeoMedellín. Todos con
estrato por manzana.

## Dificultad por ciudad (nivel barrio/puesto)

| Ciudad | Puestos | Puesto geocodificado | Estrato-manzana | Dificultad | Nota |
|---|--:|---|---|---|---|
| Bogotá | 1.083 | ✅ capa dedicada | ✅ IDECA | 🟡 media | mejor data + **máxima ganancia** (localidades no sirven) |
| Cali | 216 | 🟠 buscar/geocodificar | ✅ IDESC | 🟠 media-alta | Nivel A (comuna) ya funciona (r=−0,96) |
| Medellín | 250 | 🟠 buscar/geocodificar | 🟡 GeoMedellín | 🟠 media-alta | Nivel A ya funciona |

## Recomendación
Nivel barrio/puesto para las 3, **arrancando por Bogotá** (mejor data, mayor necesidad). El
de-risking crítico: asegurar por ciudad una capa de puestos georreferenciada con join fiable al
`PUESNOMBRE`/código. Cali/Medellín conservan el Nivel A (comuna) como respaldo.

**Techo honesto:** bajo el supuesto de residencia, puesto/barrio es lo más fino que permite el
voto secreto. Sigue siendo ecológico (área, no votante individual), pero es el estándar de oro
factible.
