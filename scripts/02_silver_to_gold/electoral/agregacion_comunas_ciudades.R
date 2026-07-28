# ============================================================================
# Agregacion por comuna de grandes ciudades: Silver -> Gold
# Proyecto: Analisis Electoral Colombia
#
# En Medellin, Cali (y otras) el campo COMUCODIGO/COMUNOMBRE de las mesas trae
# la comuna (001..0NN), los corregimientos rurales, y un bucket "NACIONAL" (000)
# de voto sin comuna (censo/especiales). Se agrupa por COMUCODIGO igual que la
# agregacion municipal, pero dentro del municipio de cada ciudad.
# ============================================================================

suppressPackageStartupMessages({
  library(arrow)
  library(dplyr)
  library(readr)
})

VUELTA <- tolower(Sys.getenv("VUELTA_ELECTORAL", "primera"))
SILVER_BASE <- if (VUELTA == "primera") "data/silver/electoral" else file.path("data/silver/electoral", VUELTA)
GOLD_BASE <- if (VUELTA == "primera") "data/gold" else file.path("data/gold", VUELTA)
INPUT_PATH <- file.path(SILVER_BASE, "datos_master.parquet")
OUTPUT_DIR <- file.path(GOLD_BASE, "ciudades")

# Ciudades a procesar (municipio = DEP + MUN electoral).
CIUDADES <- data.frame(
  slug = c("medellin", "cali"),
  dep = c("01", "31"),
  mun = c("001", "001"),
  munnombre = c("MEDELLIN", "CALI"),
  stringsAsFactors = FALSE
)

if (!file.exists(INPUT_PATH)) {
  stop("No existe el dataset Silver requerido: ", INPUT_PATH)
}
dir.create(OUTPUT_DIR, recursive = TRUE, showWarnings = FALSE)

cat(sprintf("Cargando Silver para agregacion por comuna (%s)...\n", VUELTA))
datos <- read_parquet(INPUT_PATH)

columnas_requeridas <- c("DEP", "MUN", "MUNNOMBRE", "COMUCODIGO", "COMUNOMBRE",
                         "CANNOMBRE", "PARNOMBRE", "CANCEDULA", "TIPO_VOTO", "VOTOS")
columnas_faltantes <- setdiff(columnas_requeridas, names(datos))
if (length(columnas_faltantes) > 0) {
  stop("Faltan columnas requeridas: ", paste(columnas_faltantes, collapse = ", "))
}

for (i in seq_len(nrow(CIUDADES))) {
  ciu <- CIUDADES[i, ]

  ciudad <- datos %>%
    filter(DEP == ciu$dep, MUN == ciu$mun, TIPO_VOTO == "CANDIDATO")

  if (nrow(ciudad) == 0) {
    stop(sprintf("No se encontraron mesas para %s (DEP=%s MUN=%s)", ciu$munnombre, ciu$dep, ciu$mun))
  }

  votos_comuna <- ciudad %>%
    group_by(COMUCODIGO, COMUNOMBRE, CANNOMBRE, PARNOMBRE, CANCEDULA) %>%
    summarise(VOTOS = sum(VOTOS, na.rm = TRUE), .groups = "drop") %>%
    group_by(COMUCODIGO) %>%
    mutate(
      TOTAL_VOTOS_VALIDOS = sum(VOTOS),
      PORCENTAJE_COM = round(VOTOS / TOTAL_VOTOS_VALIDOS * 100, 2),
      POSICION = min_rank(desc(VOTOS))
    ) %>%
    ungroup() %>%
    arrange(COMUCODIGO, POSICION, CANNOMBRE)

  # Validacion: los votos deben conservarse
  if (sum(votos_comuna$VOTOS) != sum(ciudad$VOTOS)) {
    stop(sprintf("Descuadre de votos en %s", ciu$munnombre))
  }

  out_path <- file.path(OUTPUT_DIR, paste0(ciu$slug, "_comunas.csv"))
  write_csv(votos_comuna, out_path)

  n_unidades <- n_distinct(votos_comuna$COMUCODIGO)
  cat(sprintf(
    "  %s: %d unidades (comunas+corregimientos+especial), %s votos.\n",
    ciu$munnombre, n_unidades, format(sum(votos_comuna$VOTOS), big.mark = ".")
  ))
}

cat("Agregacion por comuna completada.\n")
