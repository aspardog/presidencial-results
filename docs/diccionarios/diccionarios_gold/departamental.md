# Diccionario Gold departamental

## Alcance

Productos para los 33 departamentos. Rankings y porcentajes electorales
consideran solo votos a candidatos; las tasas incluyen todos los tipos.

## `votos_por_candidato_depto.csv` y `.parquet`

Granularidad: departamento y candidato. Filas actuales: 363.

| Columna | Tipo | Descripcion |
|---|---|---|
| `DEP` | texto | Codigo de departamento. |
| `DEPNOMBRE_COMPLETO` | texto | Nombre normalizado. |
| `CANNOMBRE` | texto | Candidato. |
| `PARNOMBRE` | texto | Partido. |
| `CANCEDULA` | texto | Identificador del candidato. |
| `VOTOS` | entero | Votos en el departamento. |
| `TOTAL_VOTOS_VALIDOS` | entero | Total de votos a candidatos. |
| `PORCENTAJE_DEPTO` | decimal | Porcentaje entre votos a candidatos. |
| `POSICION` | entero | Ranking dentro del departamento. |

## `rankings_departamentales.csv`

Contiene las primeras tres posiciones por departamento. Filas actuales: 99.
Conserva `DEP`, nombre, posicion, candidato, partido, votos, total valido y
porcentaje.

## `tasas_participacion_depto.csv`

Granularidad: una fila por departamento.

| Grupo de columnas | Descripcion |
|---|---|
| `BLANCO`, `CANDIDATO`, `NO_MARCADO`, `NULO` | Totales por tipo. |
| `TOTAL_VOTOS` | Suma de todos los tipos. |
| `TASA_CANDIDATOS` | Porcentaje dirigido a candidatos. |
| `TASA_BLANCOS` | Porcentaje en blanco. |
| `TASA_NULOS` | Porcentaje nulo. |
| `TASA_NO_MARCADOS` | Porcentaje no marcado. |

## `diferencias_primer_segundo.csv`

Granularidad: una fila por departamento.

Incluye primer y segundo candidato, sus votos y porcentajes,
`TOTAL_VOTOS_VALIDOS`, diferencia absoluta, diferencia relativa al ganador
(`DIFERENCIA_PCT`) y diferencia en puntos porcentuales
(`DIFERENCIA_PUNTOS`).

## Generacion

```bash
Rscript scripts/02_silver_to_gold/electoral/agregacion_departamental.R
```
