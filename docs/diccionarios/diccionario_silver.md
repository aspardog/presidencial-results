# Diccionario de la capa Silver

## Proposito

Silver contiene la base electoral consolidada, limpia y estandarizada a nivel
de mesa, candidato o tipo de voto. Es la entrada de todas las agregaciones
Gold.

## Archivos

| Archivo | Formato | Uso |
|---|---|---|
| `data/silver/electoral/datos_master.parquet` | Parquet | Procesamiento principal. |
| `data/silver/electoral/datos_master.rds` | RDS | Analisis nativo en R. |
| `data/silver/electoral/datos_master.csv` | CSV | Compatibilidad e inspeccion. |

Los tres archivos representan el mismo dataset:

- 922.214 filas.
- 22 columnas.
- 23.399.401 votos.
- 33 departamentos.
- 1.122 claves territoriales `DEP + MUN`.
- 118.313 mesas.
- 11 candidatos.

## Granularidad

Una fila contiene los votos de un candidato o tipo de voto en una mesa. La
clave de negocio usada para detectar duplicados es `MESA_ID + CANNOMBRE`.

## Columnas

| Columna | Tipo | Nulable | Descripcion |
|---|---|---:|---|
| `DEP` | texto | No | Codigo de departamento de dos caracteres. |
| `DEPNOMBRE` | texto | No | Nombre recibido de la fuente. |
| `MUN` | texto | No | Codigo municipal de tres caracteres dentro de `DEP`. |
| `MUNNOMBRE` | texto | No | Nombre del municipio. |
| `ZONA` | texto | No | Codigo de zona electoral. |
| `PUESTO` | texto | No | Codigo del puesto de votacion. |
| `PUESNOMBRE` | texto | No | Nombre del puesto. |
| `MESA` | texto | No | Numero de mesa dentro del puesto. |
| `COMUCODIGO` | texto | No | Codigo de comuna o comunidad. |
| `COMUNOMBRE` | texto | No | Nombre de comuna o comunidad. |
| `CORCODIGO` | texto | No | Codigo de corporacion electoral. |
| `CORNOMBRE` | texto | No | Nombre de la corporacion. |
| `CIR` | texto | No | Codigo de circunscripcion. |
| `PAR` | texto | No | Codigo del partido. |
| `PARNOMBRE` | texto | No | Nombre del partido o agrupador especial. |
| `CAN` | texto | No | Codigo del candidato o voto especial. |
| `CANCEDULA` | texto | Si | Cedula; nula para votos especiales. |
| `CANNOMBRE` | texto | No | Nombre del candidato o tipo de voto. |
| `VOTOS` | entero | No | Votos registrados. |
| `DEPNOMBRE_COMPLETO` | texto | No | Departamento normalizado. |
| `TIPO_VOTO` | texto | No | `CANDIDATO`, `BLANCO`, `NULO` o `NO_MARCADO`. |
| `MESA_ID` | texto | No | `DEP_MUN_ZONA_PUESTO_MESA`. |

## Transformaciones

1. Consolidacion de los CSV originales.
2. Recorte de espacios en columnas de texto.
3. Conversion de `VOTOS` a entero.
4. Padding de `DEP` a dos y `MUN` a tres caracteres.
5. Normalizacion de departamentos:
   - `NORTE DE SAN` a `NORTE DE SANTANDER`.
   - `SAN ANDRES` a `SAN ANDRES Y PROVIDENCIA`.
   - `VALLE` a `VALLE DEL CAUCA`.
6. Creacion de `TIPO_VOTO`.
7. Creacion de `MESA_ID`.

## Nulabilidad

`CANCEDULA` contiene 233.036 valores nulos, todos correspondientes a votos
especiales. No hay nulos en registros con `TIPO_VOTO = CANDIDATO`.

## Distribucion de votos

| Tipo | Votos | Porcentaje |
|---|---:|---:|
| Candidato | 22.683.841 | 96,94 % |
| Blanco | 402.681 | 1,72 % |
| Nulo | 244.147 | 1,04 % |
| No marcado | 68.732 | 0,29 % |

## Metadata asociada

`data/silver/metadata/electoral/` contiene:

- `schema.json`
- `validaciones.txt`
- `transformaciones.log`
- Catalogos de departamentos, partidos, candidatos y tipos de voto.

## Lectura

```r
datos <- arrow::read_parquet(
  "data/silver/electoral/datos_master.parquet"
)
```

```python
import pandas as pd

datos = pd.read_parquet("data/silver/electoral/datos_master.parquet")
```

`MUN` no es una clave nacional independiente. Para identificar un municipio
debe usarse como minimo la combinacion `DEP + MUN`.
