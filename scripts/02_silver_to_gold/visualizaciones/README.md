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

`generar_geojson.py` verifica las agregaciones electorales y busca geometrías
oficiales en `data/silver/geograficos/`. Mientras esas geometrías no existan,
el script informa el estado pendiente y no genera GeoJSON vacíos.
