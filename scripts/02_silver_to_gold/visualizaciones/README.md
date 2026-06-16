# Preparacion para visualizaciones

## Ejecucion

```bash
Rscript scripts/02_silver_to_gold/ejecutar_fase_4.R
```

## Dashboard

El proceso genera:

- `summary_nacional.json`: totales y resultado nacional.
- `series_candidatos.json`: serie ordenada para graficos de candidatos.
- `metricas_resumen.json`: totales y distribucion por tipo de voto.

Los archivos se guardan en `data/gold/visualizaciones/dashboard/`.

## Mapas

`generar_geojson.py` verifica las agregaciones electorales y busca geometrias
oficiales en `data/silver/geograficos/`:

- `data/silver/geograficos/geometrias_deptos.geojson`
- `data/silver/geograficos/geometrias_municipios.geojson`

Si faltan insumos electorales, termina con error. Si faltan geometrias,
informa el estado pendiente y no genera GeoJSON vacios. Si todos los insumos
existen, informa que la union espacial aun no esta implementada.

Las salidas previstas, todavia no generadas por este script, son:

- `data/gold/visualizaciones/mapas/geojson/colombia_deptos_votos.geojson`
- `data/gold/visualizaciones/mapas/geojson/colombia_municipios_votos.geojson`
