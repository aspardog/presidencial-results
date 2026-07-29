# Voto por estrato — cómo se hizo (as-built) y qué tan preciso es

**Estado:** implementado y en producción (jul-2026). Complementa el spec en
`voto-por-estrato.md`. Resume el método real, las fuentes y —clave— los límites de precisión.

## Qué se construyó

Bloque "Voto por estrato" (barras 100% por estrato 1–6 + coeficiente `r`) en cada tab de ciudad.
Artefactos: `public/api/estrato/{bogota,cali,medellin}.json` + componente `VotoPorEstrato.tsx`.

| Ciudad | Nivel | n | r (estrato ↔ %Cepeda) |
|---|---|--:|--:|
| Bogotá | puesto / barrio | 1.038 puestos | −0,87 |
| Cali | comuna | 22 comunas | −0,97 |
| Medellín | comuna | 16 comunas | −0,95 |

## Método por ciudad

**Bogotá (nivel puesto/barrio — el más fino):**
1. Voto por puesto: `datos_master` (DEP=16), `code = DEP+MUN+ZONA+PUESTO`.
2. Puestos georreferenciados: GeoJSON de Catastro Bogotá; su `Código_del_puesto` = DIVIPOL →
   **join 100%** (1.082/1.083).
3. Estrato-manzana: `manzanaestratificacion.json` de Catastro (Esri JSON, CRS local **CartoBog**;
   reproyectado con proj4 tmerc + esferoide modificado a=6380687).
4. A cada puesto → **estrato = promedio de las 25 manzanas residenciales (estrato 1–6) más
   cercanas** (grid index). Robusto ante el lote institucional del colegio.
5. Bins por `round(estrato)`, %ponderado por votos, `r` ponderado.

**Cali (nivel comuna):**
- CSV oficial "Estratificación urbana por comunas" (datos.cali.gov.co): viviendas por estrato 1–6
  → **media ponderada por viviendas** por comuna. Join a `cali.json` por número de comuna.

**Medellín (nivel comuna):**
- Capa nacional ArcGIS "Estrato predominante por manzana 2018" (`ags.esri.co/.../MapServer/0`,
  filtro `MPIO='Medellín'`, 13.988 manzanas) → **point-in-polygon** a las 16 comunas
  (`medellin-comunas.json`) → **media (por conteo de manzanas)** por comuna. Join a `medellin.json`.

## ¿Qué tan preciso es? (honesto)

**Es robusto como descripción a nivel de ÁREA, no de individuo.**

**Fortalezas:**
- **Convergencia:** tres ciudades, dos métodos independientes (puesto vs comuna), misma señal:
  gradiente monótono y fuerte estrato→voto. Eso es evidencia sólida de que el patrón es real.
- Cobertura buena (Bogotá 96% de puestos; Cali/Medellín todas las comunas).

**Límites (importantes):**
1. **Falacia ecológica (el principal):** medimos el estrato del *entorno* (barrio del puesto /
   comuna), no del votante. NO dice "los de estrato 6 votaron 84% Espriella", sino "las áreas de
   estrato 6 votaron así". Las correlaciones ecológicas están **infladas** frente a las
   individuales.
2. **Los `r` NO son comparables entre ciudades:** a menor unidad, menor `r` (más ruido). Por eso
   Bogotá (puesto, −0,87) sale "más bajo" que Cali/Medellín (comuna, −0,95/−0,97), aunque Bogotá
   es el análisis **más fino y riguroso**. La agregación a comuna suaviza y sube el `r`.
3. **Supuesto de residencia (Bogotá):** el votante vive en el barrio de su puesto. Se rompe en
   mega-puestos y por inscripción de cédula; se mitigó excluyendo puestos especiales y ponderando
   por votos.
4. **Medellín sin ponderar por viviendas:** la media de estrato usa conteo de manzanas (la capa
   nacional no trae nº de viviendas), a diferencia de Cali (ponderada). Ligeramente menos preciso.
5. **Comunas heterogéneas:** un estrato por comuna oculta la mezcla interna (Cali/Medellín). Es
   aceptable porque sus comunas son bastante homogéneas, pero Bogotá lo evita al ir por puesto.
6. **Bins con pocos casos:** estratos con 1–2 comunas (p. ej. Medellín estrato 1 y 4) son menos
   robustos por muestra pequeña; en Bogotá cada estrato agrupa decenas de puestos (más estable).
7. **Vigencia y proxy:** estrato es 2015 (Cali) / 2018 (Medellín) / actual (Bogotá) — cambia
   lento, sesgo menor. Y el estrato es proxy de nivel socioeconómico (clasificación de vivienda),
   no ingreso directo.
8. **No mide abstención por estrato** (no hay censo/potencial).

**Veredicto:** confiable para afirmar *"a mayor estrato del barrio/comuna, mayor voto por
Espriella"* y para comparar el patrón *dentro* de una ciudad. NO usar para atribuir voto a
individuos ni para comparar magnitudes de `r` entre ciudades de distinto nivel de agregación.

## Mejoras futuras (mayor precisión)
- Llevar Cali/Medellín a **nivel puesto** (necesitan sus puestos georreferenciados) — homogeneiza
  el nivel y hace los `r` comparables.
- Ponderar Medellín por viviendas/población de manzana.
- Inferencia ecológica formal (King) usando la *distribución* de estrato por unidad, con
  intervalos de confianza, en vez de la media.
