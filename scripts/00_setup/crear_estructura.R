# Script para Crear Estructura de Carpetas - Medallion Architecture
# Proyecto: Análisis Electoral Colombia
# Fecha: 2026-06-15

cat("================================================================================\n")
cat("CREANDO ESTRUCTURA DE CARPETAS - MEDALLION ARCHITECTURE\n")
cat("================================================================================\n\n")

# Función para crear carpeta y reportar
crear_carpeta <- function(ruta) {
  if (!dir.exists(ruta)) {
    dir.create(ruta, recursive = TRUE, showWarnings = FALSE)
    cat(sprintf("✓ Creada: %s\n", ruta))
    return(TRUE)
  } else {
    cat(sprintf("  Ya existe: %s\n", ruta))
    return(FALSE)
  }
}

# Función para crear .gitkeep en carpeta
crear_gitkeep <- function(ruta) {
  gitkeep_path <- file.path(ruta, ".gitkeep")
  if (!file.exists(gitkeep_path)) {
    file.create(gitkeep_path)
  }
}

carpetas_creadas <- 0
carpetas_existentes <- 0

cat("1. CREANDO ESTRUCTURA DATA/\n")
cat(strrep("-", 80), "\n")

# ============================================================================
# BRONZE - Datos originales
# ============================================================================
cat("\n🥉 BRONZE - Datos Originales\n\n")

carpetas_bronze <- c(
  "data/bronze/raw/electoral",
  "data/bronze/raw/demograficos",
  "data/bronze/raw/geograficos",
  "data/bronze/raw/socioeconomicos",
  "data/bronze/metadata/electoral",
  "data/bronze/metadata/demograficos",
  "data/bronze/metadata/socioeconomicos"
)

for (carpeta in carpetas_bronze) {
  if (crear_carpeta(carpeta)) {
    carpetas_creadas <- carpetas_creadas + 1
    if (!grepl("metadata", carpeta)) crear_gitkeep(carpeta)
  } else {
    carpetas_existentes <- carpetas_existentes + 1
  }
}

# ============================================================================
# SILVER - Datos limpios
# ============================================================================
cat("\n🥈 SILVER - Datos Limpios\n\n")

carpetas_silver <- c(
  "data/silver/electoral",
  "data/silver/demograficos",
  "data/silver/geograficos",
  "data/silver/socioeconomicos",
  "data/silver/metadata/electoral",
  "data/silver/metadata/demograficos",
  "data/silver/metadata/socioeconomicos"
)

for (carpeta in carpetas_silver) {
  if (crear_carpeta(carpeta)) {
    carpetas_creadas <- carpetas_creadas + 1
  } else {
    carpetas_existentes <- carpetas_existentes + 1
  }
}

# ============================================================================
# GOLD - Datos agregados
# ============================================================================
cat("\n🥇 GOLD - Datos Agregados\n\n")

carpetas_gold <- c(
  # Nacional
  "data/gold/nacional",
  "data/gold/nacional/metadata",

  # Departamental
  "data/gold/departamental",
  "data/gold/departamental/con_poblacion",
  "data/gold/departamental/con_indicadores",
  "data/gold/departamental/metadata",

  # Municipal
  "data/gold/municipal",
  "data/gold/municipal/con_poblacion",
  "data/gold/municipal/metadata",

  # Barrio (futuro)
  "data/gold/barrio",
  "data/gold/barrio/por_ciudad/bogota",
  "data/gold/barrio/por_ciudad/medellin",
  "data/gold/barrio/por_ciudad/cali",
  "data/gold/barrio/por_ciudad/barranquilla",
  "data/gold/barrio/metadata",

  # Visualizaciones
  "data/gold/visualizaciones/dashboard",
  "data/gold/visualizaciones/mapas/geojson",
  "data/gold/visualizaciones/graficos",

  # Temporal (futuro)
  "data/gold/temporal/comparativo_2022_2026",
  "data/gold/temporal/series_historicas"
)

for (carpeta in carpetas_gold) {
  if (crear_carpeta(carpeta)) {
    carpetas_creadas <- carpetas_creadas + 1
    crear_gitkeep(carpeta)
  } else {
    carpetas_existentes <- carpetas_existentes + 1
  }
}

# ============================================================================
# SCRIPTS
# ============================================================================
cat("\n2. CREANDO ESTRUCTURA SCRIPTS/\n")
cat(strrep("-", 80), "\n\n")

carpetas_scripts <- c(
  "scripts/00_setup",
  "scripts/01_bronze_to_silver",
  "scripts/02_silver_to_gold/electoral",
  "scripts/02_silver_to_gold/cruces",
  "scripts/02_silver_to_gold/visualizaciones",
  "scripts/03_visualizaciones/dashboard",
  "scripts/03_visualizaciones/mapas",
  "scripts/03_visualizaciones/reportes",
  "scripts/04_analisis_avanzados",
  "scripts/05_ingesta",
  "scripts/utils"
)

for (carpeta in carpetas_scripts) {
  if (crear_carpeta(carpeta)) {
    carpetas_creadas <- carpetas_creadas + 1
  } else {
    carpetas_existentes <- carpetas_existentes + 1
  }
}

# ============================================================================
# DOCS
# ============================================================================
cat("\n3. CREANDO ESTRUCTURA DOCS/\n")
cat(strrep("-", 80), "\n\n")

carpetas_docs <- c(
  "docs/diccionarios",
  "docs/diccionarios/diccionarios_gold",
  "docs/metodologia",
  "docs/arquitectura",
  "docs/arquitectura/esquemas_datos",
  "docs/fuentes_datos"
)

for (carpeta in carpetas_docs) {
  if (crear_carpeta(carpeta)) {
    carpetas_creadas <- carpetas_creadas + 1
  } else {
    carpetas_existentes <- carpetas_existentes + 1
  }
}

# ============================================================================
# OTRAS CARPETAS
# ============================================================================
cat("\n4. CREANDO OTRAS CARPETAS\n")
cat(strrep("-", 80), "\n\n")

otras_carpetas <- c(
  "notebooks",
  "tests",
  "logs"
)

for (carpeta in otras_carpetas) {
  if (crear_carpeta(carpeta)) {
    carpetas_creadas <- carpetas_creadas + 1
    crear_gitkeep(carpeta)
  } else {
    carpetas_existentes <- carpetas_existentes + 1
  }
}

# ============================================================================
# RESUMEN
# ============================================================================
cat("\n")
cat(strrep("=", 80), "\n")
cat("RESUMEN\n")
cat(strrep("=", 80), "\n\n")

cat(sprintf("✓ Carpetas creadas:     %d\n", carpetas_creadas))
cat(sprintf("  Carpetas existentes:  %d\n", carpetas_existentes))
cat(sprintf("  Total:                %d\n\n", carpetas_creadas + carpetas_existentes))

cat("Estructura Medallion Architecture creada exitosamente!\n\n")

cat("Próximos pasos:\n")
cat("  1. Ejecutar: Rscript scripts/00_setup/crear_estructura.R  ✓ (completado)\n")
cat("  2. Crear .gitignore\n")
cat("  3. Reorganizar archivos existentes\n")
cat("  4. Crear metadata de Bronze\n\n")
