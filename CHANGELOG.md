# Changelog

Los cambios relevantes del proyecto se documentan en este archivo.

## [1.2.0] - 2026-06-15

### Added

- Dashboard desplegado en Vercel: https://voto-colombia-2026.vercel.app
- Seccion "Hallazgos clave" con analisis electoral automatizado.
- Importacion estatica de datos JSON para compatibilidad con static export.
- Componente de lecturas editoriales con insights principales.
- Visualizacion de departamentos decisivos y elecciones cerradas.
- Bastiones electorales por candidato con porcentajes departamentales.

### Changed

- Migracion a Next.js static export (`output: 'export'`).
- Datos embebidos en build time en lugar de fetch HTTP.
- Rediseno del mapa electoral con SVG nativo (sin Mapbox).
- Estilos actualizados con branding Global Bridge Consultancy.
- GeoJSON renombrado de `.geojson` a `.json` para compatibilidad webpack.

### Fixed

- Compatibilidad con Vercel deployment protection.
- Build script separado para desarrollo local vs produccion.

## [1.1.0] - 2026-06-15

### Added

- Descarga automatica de shapefiles DANE MGN 2025 (departamentos y municipios).
- Conversion de shapefiles a GeoJSON con encoding UTF-8 correcto.
- Tabla de homologacion departamental Registraduria-DANE (33/33, 100%).
- Tabla de homologacion municipal Registraduria-DANE (1122/1122, 100%).
- GeoJSON electoral departamental con votos y ganador por departamento.
- GeoJSON electoral municipal con votos y ganador por municipio.
- Archivo SECURITY.md con politicas de seguridad.
- Archivo LICENSE con licencia MIT.
- Configuracion Dependabot para alertas de seguridad.
- Repositorio publicado en GitHub: github.com/aspardog/presidencial-results.

### Changed

- README actualizado con estructura completa y productos GeoJSON.
- Documentacion de fuentes geograficas actualizada con estado completado.

### Removed

- Archivo PLAN_DE_IMPLEMENTACION.txt (plan completado).

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
- No hay suite automatizada de tests.
