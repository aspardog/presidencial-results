# ============================================================================
# Actualizar el lockfile despues de cambios intencionales de dependencias
# ============================================================================

if (!requireNamespace("renv", quietly = TRUE)) {
  stop("renv no esta instalado. Ejecute scripts/00_setup/install_packages.R")
}

if (!file.exists("DESCRIPTION")) {
  stop("No existe DESCRIPTION. Ejecute este script desde la raiz del proyecto.")
}

renv::settings$snapshot.type("explicit")
renv::snapshot(
  project = ".",
  type = "explicit",
  repos = character(),
  prompt = FALSE
)

cat("renv.lock actualizado desde las dependencias declaradas en DESCRIPTION.\n")
