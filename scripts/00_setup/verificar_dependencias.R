# ============================================================================
# Verificar el estado reproducible del entorno R
# ============================================================================

if (!requireNamespace("renv", quietly = TRUE)) {
  stop("renv no esta instalado")
}

dependencias <- c(
  "arrow",
  "dplyr",
  "jsonlite",
  "knitr",
  "readr",
  "stringr",
  "tibble",
  "tidyr",
  "tidyverse"
)

biblioteca <- renv::paths$library(project = ".")
instalados <- installed.packages(lib.loc = biblioteca)
faltantes <- setdiff(dependencias, rownames(instalados))

if (length(faltantes) > 0) {
  stop("Faltan paquetes: ", paste(faltantes, collapse = ", "))
}

estado <- renv::status(project = ".", sources = FALSE)
if (!isTRUE(estado$synchronized)) {
  stop("La biblioteca activa no esta sincronizada con renv.lock")
}

versiones <- vapply(
  dependencias,
  function(paquete) instalados[paquete, "Version"],
  character(1)
)

cat("Entorno renv sincronizado.\n\n")
print(data.frame(PAQUETE = names(versiones), VERSION = unname(versiones)))
