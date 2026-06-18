# Changelog

Los cambios relevantes del proyecto se documentan en este archivo.

## [Unreleased] - 2026-06-18

### Added

- Capas GeoJSON municipales divididas en 33 archivos por departamento para
  carga bajo demanda.
- Validacion automatica del matching entre municipios DANE y resultados
  electorales como parte de `npm run validate`.
- Analisis de polarizacion y competitividad departamental y municipal.
- Cache de 24 horas para los JSON estaticos servidos por Vercel.
- Rankings departamentales de bastiones precalculados en el build de datos.

### Fixed

- Conversion de codigo departamental electoral a DANE al cargar mapas.
- Tooltips, margenes, colores y datos electorales de los mapas municipales.
- Matching municipal por nombre normalizado y aliases para cinco casos
  especiales; cobertura actual de 100% (1.122/1.122).

### Changed

- Documentacion actualizada para reflejar el estado real del pipeline, el
  dashboard estatico y las rutas vigentes de ejecucion.
- Se aclaro la diferencia entre el verificador GeoJSON del pipeline R y las
  capas electorales ya consumidas por el dashboard.
- Se actualizaron las instrucciones del dashboard para usar
  `dashboard/web/` como raiz operativa.
- Politica de seguridad alineada con la version soportada actual.
- La carga municipal pasa de una capa nacional de 4,43 MB a archivos de unos
  135 KB por departamento en promedio (97% menos por seleccion).
- El grafico de candidatos ahora usa HTML/CSS nativo; se retiro `@nivo/bar` y
  su arbol de dependencias sin cambiar votos, porcentajes ni colores.
- Los GeoJSON municipales conservan geometria, codigos y nombres; los datos
  electorales se resuelven desde el desglose municipal validado al 100%.

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
- Geometrias DANE departamentales y municipales disponibles en Silver.
- Verificador de prerrequisitos para GeoJSON electoral con geometrias DANE.
- Archivo SECURITY.md con politicas de seguridad.
- Archivo LICENSE con licencia MIT.
- Configuracion Dependabot para alertas de seguridad.
- Repositorio publicado en GitHub: github.com/aspardog/presidencial-results.

### Changed

- README actualizado con estructura completa y estado de geometrias DANE.
- Documentacion de fuentes geograficas actualizada con homologacion completada.

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

- La reconstruccion desde Bronze requiere ubicar los CSV en la ruta que espera
  `limpieza_datos.R`: `data/bronze/raw/electoral/registraduria_2026-06-15/`.
- No hay suite automatizada de tests.
