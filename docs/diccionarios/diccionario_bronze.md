# Diccionario de la capa Bronze

## Proposito

Bronze conserva los archivos originales recibidos de las fuentes, sin
transformaciones. Es la fuente de trazabilidad para regenerar Silver.

## Estado actual

Los CSV de Bronze no se versionan en Git. Para que `limpieza_datos.R`
reconstruya Silver desde la fuente original, los 33 CSV deben existir en la
ruta esperada por el script. Si esa ruta no existe o no contiene CSV, el
pipeline reutiliza `data/silver/electoral/datos_master.rds` para regenerar
formatos y metadata.

## Ubicacion esperada

```text
data/bronze/raw/electoral/registraduria_2026-06-15/
```

Cada archivo representa un departamento y debe conservar:

- Nombre original.
- Formato CSV.
- Delimitador `;`.
- Codificacion UTF-8.
- Contenido sin modificar.

Patron documentado:

```text
MMV_XXX_[DEP]_000_XXX_XX_XX_XXX_[NUMERO].csv
```

## Esquema electoral original

| Columna | Tipo esperado | Descripcion |
|---|---|---|
| `DEP` | texto | Codigo de departamento. |
| `DEPNOMBRE` | texto | Nombre de departamento recibido. |
| `MUN` | texto | Codigo municipal dentro del departamento. |
| `MUNNOMBRE` | texto | Nombre del municipio. |
| `ZONA` | texto | Codigo de zona electoral. |
| `PUESTO` | texto | Codigo del puesto. |
| `PUESNOMBRE` | texto | Nombre del puesto de votacion. |
| `MESA` | texto | Numero de mesa. |
| `COMUCODIGO` | texto | Codigo de comuna o comunidad. |
| `COMUNOMBRE` | texto | Nombre de comuna o comunidad. |
| `CORCODIGO` | texto | Codigo de corporacion electoral. |
| `CORNOMBRE` | texto | Nombre de la corporacion. |
| `CIR` | texto | Codigo de circunscripcion. |
| `PAR` | texto | Codigo del partido. |
| `PARNOMBRE` | texto | Nombre del partido. |
| `CAN` | texto | Codigo del candidato o voto especial. |
| `CANCEDULA` | texto | Cedula del candidato; puede faltar en votos especiales. |
| `CANNOMBRE` | texto | Candidato o categoria especial de voto. |
| `VOTOS` | entero | Votos registrados en la mesa. |

## Cobertura registrada

- Archivos: 33.
- Registros: 922.214.
- Votos: 23.399.401.
- Departamentos: 33.
- Mesas: 118.313.
- Candidatos: 11.

Los codigos de departamento presentes pueden consultarse en
`data/silver/metadata/electoral/catalogo_departamentos.csv`.

## Metadata

| Archivo | Proposito |
|---|---|
| `data/bronze/metadata/electoral/ingesta_2026-06-15.json` | Fecha, fuente, volumen y formato de la ingesta. |
| `data/bronze/metadata/electoral/source_info.txt` | Descripcion humana de la fuente y cobertura. |
| `data/bronze/raw/electoral/README.txt` | Estado y procedimiento para recuperar los CSV. |

## Fuente

Registraduria Nacional del Estado Civil de Colombia:
<https://www.registraduria.gov.co/>

La metadata indica una fecha de eleccion y descarga de `2026-06-15`. Esta
informacion debe contrastarse con la publicacion oficial al recuperar Bronze.
