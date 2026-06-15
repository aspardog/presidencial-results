# ============================================================================
# Ejecutor de fase 4: preparacion para visualizaciones
# Proyecto: Analisis Electoral Colombia
# ============================================================================

dashboard_script <- paste0(
  "scripts/02_silver_to_gold/visualizaciones/",
  "preparar_dashboard.R"
)
geojson_script <- paste0(
  "scripts/02_silver_to_gold/visualizaciones/",
  "generar_geojson.py"
)

cat("================================================================================\n")
cat("EJECUTANDO FASE 4: PREPARACION PARA VISUALIZACIONES\n")
cat("================================================================================\n\n")

if (!file.exists(dashboard_script) || !file.exists(geojson_script)) {
  stop("Faltan scripts requeridos para ejecutar la fase 4")
}

cat("[1/2] Preparando JSON para dashboard...\n")
source(dashboard_script, local = new.env(parent = globalenv()))

cat("\n[2/2] Verificando prerrequisitos GeoJSON...\n")
estado_geojson <- system2("python3", geojson_script)
if (estado_geojson != 0) {
  stop("La verificacion GeoJSON termino con codigo ", estado_geojson)
}

cat("\n================================================================================\n")
cat("FASE 4 COMPLETADA: JSON GENERADOS, GEOJSON PENDIENTE DE GEOMETRIAS\n")
cat("================================================================================\n")
