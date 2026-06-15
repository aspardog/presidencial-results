# Silver a Gold

Esta fase genera productos electorales agregados a partir de
`data/silver/electoral/datos_master.parquet`.

## Ejecucion completa

```bash
Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R
```

## Productos

- `data/gold/nacional/`: resultados por candidato y partido, participacion y
  resumen ejecutivo.
- `data/gold/departamental/`: resultados, rankings, participacion y diferencia
  entre primer y segundo lugar para los 33 departamentos.
- `data/gold/municipal/`: resultados y participacion para cada clave
  `DEP + MUN`, ademas del mapeo de mesas a municipios.

Los porcentajes y rankings electorales usan solamente votos a candidatos.
Blancos, nulos y no marcados se conservan en las tablas de participacion.
