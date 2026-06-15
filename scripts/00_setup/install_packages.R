# ============================================================================
# Restaurar dependencias del proyecto con renv
# ============================================================================

options(repos = c(CRAN = "https://cloud.r-project.org"))

if (!requireNamespace("renv", quietly = TRUE)) {
  install.packages("renv")
}

if (!file.exists("renv.lock")) {
  stop("No existe renv.lock. Ejecute este script desde la raiz del proyecto.")
}

cat("Restaurando dependencias definidas en renv.lock...\n")
renv::restore(project = ".", prompt = FALSE)

estado <- renv::status(project = ".", sources = FALSE)
if (!isTRUE(estado$synchronized)) {
  stop("renv termino, pero el proyecto no quedo sincronizado con renv.lock")
}

cat("Dependencias restauradas y sincronizadas.\n")
