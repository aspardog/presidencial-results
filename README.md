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
- Bronze a Silver: implementado.
- Silver a Gold: implementado para nivel nacional, departamental y municipal.
- JSON para dashboard: implementado.
- Geometrias DANE MGN 2025 en Silver: disponibles.
- GeoJSON electoral con votos: pendiente; `generar_geojson.py` solo verifica prerrequisitos.
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

- R compatible con la version registrada en `renv.lock`.
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
# Requiere los CSV en data/bronze/raw/electoral/registraduria_2026-06-15/.
# Si esa ruta no existe, reutiliza data/silver/electoral/datos_master.rds.
Rscript scripts/01_bronze_to_silver/limpieza_datos.R

# Ejecutar validaciones Silver
Rscript scripts/01_bronze_to_silver/validaciones.R

# Generar Gold nacional, departamental y municipal
Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R

# Generar JSON para dashboard y verificar prerrequisitos GeoJSON
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
      mapas/geojson/        Salida futura para GeoJSON electoral
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
- `data/gold/visualizaciones/mapas/geojson/`: salida prevista para GeoJSON electoral.

### GeoJSON Electoral

La capa Silver ya contiene geometrias oficiales del DANE:

| Archivo | Contenido |
|---------|-----------|
| `data/silver/geograficos/geometrias_deptos.geojson` | 33 departamentos |
| `data/silver/geograficos/geometrias_municipios.geojson` | 1.122 municipios |

`scripts/02_silver_to_gold/visualizaciones/generar_geojson.py` verifica que
existan las geometrias y los insumos electorales. La union espacial para
generar GeoJSON con votos y ganador sigue pendiente de implementacion.

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

Para reconstruir Silver desde cero, `limpieza_datos.R` requiere los 33 CSV
originales en:

```text
data/bronze/raw/electoral/registraduria_2026-06-15/
```

Si esa ruta no existe o no contiene CSV, `limpieza_datos.R` reutiliza
`data/silver/electoral/datos_master.rds` para regenerar formatos y metadata.

## Mapas

Los mapas del dashboard publicado consumen JSON estatico en
`dashboard/web/public/api/mapas/`. Las geometrias fuente provienen del Marco
Geoestadistico Nacional (MGN) 2025 del DANE y fueron convertidas a GeoJSON en
Silver.

Fuentes:
- Departamentos: `MGN2025_DPTO_POLITICO.zip` (12 MB)
- Municipios: `MGN2025_MPIO_GRAFICO.zip` (68 MB)

La homologacion entre codigos electorales (Registraduria) y codigos DANE
(DIVIPOLA) esta documentada en `data/silver/metadata/electoral/`. La union de
esas geometrias con resultados electorales para Gold todavia no esta
implementada en `generar_geojson.py`.

## Versionamiento

`data/`, `output/` y `logs/` estan excluidos por `.gitignore`. El codigo y la
documentacion son los artefactos previstos para Git.

## Licencia

Este proyecto está licenciado bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

Los datos electorales deben conservar y respetar los términos de uso de sus fuentes oficiales (Registraduría Nacional del Estado Civil de Colombia).
