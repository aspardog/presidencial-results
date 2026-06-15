# Changelog

Los cambios relevantes del proyecto se documentan en este archivo.

## [1.0.0] - 2026-06-15

### Added

- Estructura de datos Bronze, Silver y Gold.
- Script de setup de directorios.
- Pipeline Bronze a Silver con salida CSV, Parquet y RDS.
- Validaciones de integridad y metadata Silver.
- Agregaciones nacionales, departamentales y municipales.
- Ejecutor maestro de agregaciones.
- JSON de resumen, candidatos y participacion para dashboard.
- Verificador de prerrequisitos para GeoJSON.
- Diccionarios de datos para Bronze, Silver y Gold.
- README principal y guia de inicio rapido.
- Entorno reproducible con `renv`, `DESCRIPTION` y lockfile de dependencias.
- Scripts para restaurar, verificar y actualizar las dependencias R.
- Guia de administracion de paquetes con `renv`.

### Changed

- Migracion de los productos procesados desde `output/` hacia la estructura
  Medallion bajo `data/`.
- Los rankings y porcentajes electorales usan votos a candidatos; los votos
  especiales se reportan en tablas de participacion.
- Los municipios se identifican mediante la clave compuesta `DEP + MUN`.

### Fixed

- Normalizacion de nombres abreviados de departamentos.
- Estandarizacion de codigos departamentales y municipales.
- Separacion de votos en blanco, nulos y no marcados.
- Documentacion actualizada para usar `datos_master.*` y rutas vigentes.

### Known limitations

- Los 33 CSV originales de Bronze no estan disponibles.
- Los GeoJSON estan pendientes de geometrías oficiales.
- No hay suite automatizada de tests.
- La licencia del proyecto esta pendiente de definicion.
