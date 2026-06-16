# Analisis Electoral Colombia

Pipeline de datos para resultados electorales presidenciales de Colombia,
organizado con arquitectura Medallion.

**Dashboard en vivo:** https://voto-colombia-2026.vercel.app

Pipeline de datos:

```text
Bronze (origen) -> Silver (datos limpios) -> Gold (productos analiticos)
```

## Estado

- Setup de carpetas: completado.
- Bronze a Silver: implementado; los CSV originales no estan disponibles.
- Silver a Gold: implementado para nivel nacional, departamental y municipal.
- JSON para dashboard: implementado.
- GeoJSON electoral: implementado con geometrias DANE MGN 2025.
- Homologacion Registraduria-DANE: completada (100% departamentos y municipios).
- Tests automatizados: pendientes.

## Datos actuales

- 922.214 registros Silver.
- 23.399.401 votos.
- 33 departamentos.
- 1.122 claves municipales `DEP + MUN`.
- 118.313 mesas.
- 11 candidatos.

## Requisitos

- R 4.6.0 recomendado; la version utilizada se registra en `renv.lock`.
- Python 3 para verificar los prerrequisitos GeoJSON.

Las dependencias R se administran con `renv`. Desde la raiz del proyecto:

```bash
Rscript --vanilla scripts/00_setup/install_packages.R
Rscript --vanilla scripts/00_setup/verificar_dependencias.R
```

No es necesario instalar manualmente los paquetes listados en `DESCRIPTION`.

## Ejecucion

Desde la raiz del proyecto:

```bash
# Crear o reparar la estructura de carpetas
Rscript scripts/00_setup/crear_estructura.R

# Regenerar Silver
# Actualmente reutiliza datos_master.rds porque Bronze no contiene los CSV.
Rscript scripts/01_bronze_to_silver/limpieza_datos.R

# Ejecutar validaciones Silver
Rscript scripts/01_bronze_to_silver/validaciones.R

# Generar Gold nacional, departamental y municipal
Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R

# Generar JSON para dashboard y verificar GeoJSON
Rscript scripts/02_silver_to_gold/ejecutar_fase_4.R
```

## Estructura

```text
data/
  bronze/
    raw/electoral/          Datos crudos de Registraduria
    raw/geograficos/        Shapefiles DANE MGN 2025
    metadata/               Metadata de ingesta
  silver/
    electoral/              Base limpia a nivel de mesa
    geograficos/            GeoJSON de geometrias
    metadata/               Catalogos y homologaciones
  gold/
    nacional/               Agregaciones a nivel pais
    departamental/          Agregaciones por departamento
    municipal/              Agregaciones por municipio
    visualizaciones/
      dashboard/            JSON para dashboards web
      mapas/geojson/        GeoJSON electoral con votos
scripts/
  00_setup/
  01_bronze_to_silver/
  02_silver_to_gold/
docs/
  diccionarios/
```

La descripcion extensa esta en
[docs/estructura-proyecto.txt](docs/estructura-proyecto.txt).

## Productos Gold

- `data/gold/nacional/`: candidatos, partidos, participacion y resumen.
- `data/gold/departamental/`: resultados, rankings y diferencias.
- `data/gold/municipal/`: resultados, participacion y mapeo de mesas.
- `data/gold/visualizaciones/dashboard/`: JSON para consumo web.
- `data/gold/visualizaciones/mapas/geojson/`: GeoJSON electoral para mapas interactivos.

### GeoJSON Electoral

Los archivos GeoJSON incluyen geometrias oficiales del DANE con datos de votos:

| Archivo | Contenido |
|---------|-----------|
| `departamentos_electoral.geojson` | 33 departamentos con votos y ganador |
| `municipios_electoral.geojson` | 1122 municipios con votos y ganador |

Atributos por feature: `total_votos`, `ganador`, `votos_ganador`, `porcentaje_ganador`, `segundo`, `diferencia`.

## Documentacion

- [Guia de inicio rapido](docs/guia-inicio-rapido.md)
- [Gestion de dependencias con renv](docs/gestion_dependencias_renv.md)
- [Arquitectura Medallion](docs/medallion-architecture-explicacion.txt)
- [Fuentes geograficas DANE](docs/fuentes_geograficas_dane.txt)
- [Diccionario Bronze](docs/diccionarios/diccionario_bronze.md)
- [Diccionario Silver](docs/diccionarios/diccionario_silver.md)
- [Diccionarios Gold](docs/diccionarios/diccionarios_gold/)
- [Changelog](CHANGELOG.md)

## Bronze y reproducibilidad

Para reconstruir Silver desde cero se requieren los 33 CSV originales en:

```text
data/bronze/raw/electoral/registraduria_2026-06-15/
```

Sin esos archivos, `limpieza_datos.R` reutiliza
`data/silver/electoral/datos_master.rds`.

## Mapas

Los mapas electorales usan geometrias oficiales del Marco Geoestadistico
Nacional (MGN) 2025 del DANE. Los shapefiles se descargan automaticamente
desde el geoportal del DANE y se convierten a GeoJSON.

Fuentes:
- Departamentos: `MGN2025_DPTO_POLITICO.zip` (12 MB)
- Municipios: `MGN2025_MPIO_GRAFICO.zip` (68 MB)

La homologacion entre codigos electorales (Registraduria) y codigos DANE
(DIVIPOLA) esta documentada en `data/silver/metadata/electoral/`.

## Versionamiento

`data/`, `output/` y `logs/` estan excluidos por `.gitignore`. El codigo y la
documentacion son los artefactos previstos para Git.

## Licencia

Este proyecto está licenciado bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

Los datos electorales deben conservar y respetar los términos de uso de sus fuentes oficiales (Registraduría Nacional del Estado Civil de Colombia).
