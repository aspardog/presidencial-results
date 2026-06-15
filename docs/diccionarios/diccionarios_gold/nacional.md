# Diccionario Gold nacional

## Alcance

Productos agregados para resultados y participacion a nivel nacional. Los
porcentajes por candidato y partido usan como denominador los votos a
candidatos. Las metricas de participacion usan todos los votos.

## `votos_por_candidato.csv` y `.parquet`

Granularidad: una fila por candidato. Filas actuales: 11.

| Columna | Tipo | Descripcion |
|---|---|---|
| `CANNOMBRE` | texto | Nombre del candidato. |
| `PARNOMBRE` | texto | Partido o movimiento. |
| `CANCEDULA` | texto | Identificador del candidato. |
| `TOTAL_VOTOS` | entero | Votos nacionales del candidato. |
| `PORCENTAJE` | decimal | Participacion entre votos a candidatos. |
| `POSICION` | entero | Ranking nacional por votos. |

## `votos_por_partido.csv`

Granularidad: una fila por partido. Filas actuales: 11.

| Columna | Tipo | Descripcion |
|---|---|---|
| `PARNOMBRE` | texto | Partido o movimiento. |
| `TOTAL_VOTOS` | entero | Votos nacionales de sus candidatos. |
| `PORCENTAJE` | decimal | Participacion entre votos a candidatos. |

## `metricas_participacion.csv`

Granularidad: una fila por `TIPO_VOTO`. Filas actuales: 4.

| Columna | Tipo | Descripcion |
|---|---|---|
| `TIPO_VOTO` | texto | Categoria de voto. |
| `TOTAL` | entero | Votos de la categoria. |
| `PORCENTAJE` | decimal | Porcentaje sobre todos los votos. |

## `resumen_ejecutivo.csv`

Granularidad: una fila por metrica. `VALOR` es texto porque mezcla numeros y
nombres.

| Columna | Tipo | Descripcion |
|---|---|---|
| `METRICA` | texto | Nombre de la metrica. |
| `VALOR` | texto | Valor serializado. |

Incluye votos, mesas, candidatos, ganador, segundo lugar y diferencia.

## Generacion

```bash
Rscript scripts/02_silver_to_gold/electoral/agregacion_nacional.R
```
