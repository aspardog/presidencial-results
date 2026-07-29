# Idea / evaluación: mapas más finos (puesto / manzana)

**Estado:** evaluado, no implementado. Retomar si se quiere más granularidad en los mapas de ciudad.
Relacionado: `voto-por-estrato.md`, `voto-por-estrato-implementacion.md`.

## La pregunta
¿Se pueden hacer los mapas de ciudad a nivel **manzana** (en vez de comuna/localidad)?

## Dos límites duros (separar dato vs render)

**1. El dato: el voto NO baja de "puesto de votación".**
Se agrega por mesa/puesto y ahí se detiene (voto secreto). **No existe voto por manzana.**
- Un coroplético de manzanas **coloreadas por voto** es imposible sin inventar datos.
- Lo más fino y honesto es el **nivel puesto**: Bogotá **1.083**, Medellín **250**, Cali **216**
  puestos (vs ~20 comunas actuales → ×10–50 más detalle).

**2. El render: 44 mil polígonos no caben en SVG.**
Bogotá tiene **44.260** manzanas, Medellín **13.988**. El mapa actual es SVG en línea (~135 KB por
depto). 44k polígonos = varios MB → el navegador se ahoga. Un mapa de manzanas real exigiría
**vector tiles / WebGL** (Mapbox/MapLibre) = cambiar el motor de mapas, no un ajuste.

## Opciones factibles

| Opción | Qué es | Dificultad | Nota |
|---|---|---|---|
| **A. Puntos de puesto** | ~1.000 puntos coloreados por ganador/margen | 🟢 baja | **Bogotá ya listo** (puestos geocodificados + join DIVIPOL 100%, ver impl. de estrato). Son puntos, no llenan el mapa. |
| **B. Coroplético por captación (Voronoi)** | "área de cada puesto" (Voronoi recortado a la ciudad) coloreada por su voto | 🟡 media | Llena el mapa, **se ve tan fino como manzanas**, pero la resolución real es puesto. Mejor costo/beneficio. |
| **C. Manzanas por voto** | cada manzana hereda el voto del puesto más cercano | 🔴 alta | Mismo contenido que B pero 44k polígonos → **inviable en SVG** (necesita vector tiles). No aporta sobre B. |
| **D. Manzanas por estrato** | manzanas coloreadas por estrato (no voto) | 🟡 media | Dato real por manzana, pero **socioeconómico**, no electoral. Mapa complementario. |

## Recomendación
**Opción B (Voronoi por puesto), empezando por Bogotá** — mapa fino, honesto (no miente sobre la
resolución) y factible con lo que ya hay. La opción A (puntos) es el arranque más rápido.

## Cómo hacerlo (Voronoi por puesto)
1. Puestos geocodificados + voto por puesto (Bogotá ya lo tengo; Cali/Medellín necesitan su capa
   de puestos — Bogotá salió de Catastro; para las otras hay que conseguirla o geocodificar).
2. Generar Voronoi de los puntos de puesto (turf.js `voronoi`) recortado al polígono de la ciudad
   (`bbox` + `intersect` con el límite urbano). ~1.000 celdas → tamaño de archivo razonable.
3. Colorear cada celda por el voto de su puesto (mismo esquema ganador/margen del mapa actual).
4. Reusar `MapaCiudad`/`MapaBogotaLocalidades` (mismo render SVG; ~1.000 polígonos sí caben).

## Qué NO hacer
Mapa literal de manzanas por voto (44k polígonos) en el SVG actual — inviable y sin ganancia de
información sobre el Voronoi.
