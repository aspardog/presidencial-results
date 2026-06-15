# ============================================================================
# Ejecutor maestro de agregaciones Silver -> Gold
# Proyecto: Analisis Electoral Colombia
# ============================================================================

scripts <- c(
  "scripts/02_silver_to_gold/electoral/agregacion_nacional.R",
  "scripts/02_silver_to_gold/electoral/agregacion_departamental.R",
  "scripts/02_silver_to_gold/electoral/agregacion_municipal.R"
)

cat("================================================================================\n")
cat("EJECUTANDO AGREGACIONES SILVER -> GOLD\n")
cat("================================================================================\n\n")

inicio <- Sys.time()

for (i in seq_along(scripts)) {
  script <- scripts[[i]]
  if (!file.exists(script)) {
    stop("No existe el script requerido: ", script)
  }

  cat(sprintf("[%d/%d] %s\n", i, length(scripts), basename(script)))
  source(script, local = new.env(parent = globalenv()))
  cat("\n")
}

duracion <- difftime(Sys.time(), inicio, units = "secs")

cat("================================================================================\n")
cat("TODAS LAS AGREGACIONES COMPLETADAS\n")
cat("================================================================================\n")
cat(sprintf("Duracion total: %.2f segundos\n", as.numeric(duracion)))
