# Diccionario Gold municipal

## Alcance

Productos para 1.122 claves municipales `DEP + MUN`. El nombre o codigo
municipal por separado no debe tratarse como clave nacional.

## `votos_por_candidato_mun.csv` y `.parquet`

Granularidad: municipio y candidato con presencia en el municipio. Filas
actuales: 11.717.

| Columna | Tipo | Descripcion |
|---|---|---|
| `DEP` | texto | Codigo de departamento. |
| `DEPNOMBRE_COMPLETO` | texto | Departamento normalizado. |
| `MUN` | texto | Codigo municipal dentro de `DEP`. |
| `MUNNOMBRE` | texto | Nombre del municipio. |
| `CANNOMBRE` | texto | Candidato. |
| `PARNOMBRE` | texto | Partido. |
| `CANCEDULA` | texto | Identificador del candidato. |
| `VOTOS` | entero | Votos del candidato en el municipio. |
| `TOTAL_VOTOS_VALIDOS` | entero | Votos a candidatos en el municipio. |
| `PORCENTAJE_MUN` | decimal | Porcentaje entre votos a candidatos. |
| `POSICION` | entero | Ranking municipal. |

La tabla no fuerza filas con cero votos; por ello no siempre existen 11 filas
por municipio.

## `mapeo_mesas_municipios.csv`

Granularidad: una fila por mesa. Filas actuales: 118.313.

| Columna | Tipo | Descripcion |
|---|---|---|
| `DEP` | texto | Codigo de departamento. |
| `DEPNOMBRE_COMPLETO` | texto | Departamento. |
| `MUN` | texto | Codigo municipal. |
| `MUNNOMBRE` | texto | Municipio. |
| `MESA_ID` | texto | Identificador unico de mesa. |

## `participacion_municipal.csv`

Granularidad: una fila por `DEP + MUN`. Filas actuales: 1.122.

Contiene totales `BLANCO`, `CANDIDATO`, `NO_MARCADO`, `NULO`,
`TOTAL_VOTOS` y las tasas porcentuales correspondientes.

## Generacion

```bash
Rscript scripts/02_silver_to_gold/electoral/agregacion_municipal.R
```
