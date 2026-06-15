# ============================================================================
# Agregacion municipal: Silver -> Gold
# Proyecto: Analisis Electoral Colombia
# ============================================================================

suppressPackageStartupMessages({
  library(arrow)
  library(dplyr)
  library(readr)
  library(tidyr)
})

INPUT_PATH <- "data/silver/electoral/datos_master.parquet"
OUTPUT_DIR <- "data/gold/municipal"

if (!file.exists(INPUT_PATH)) {
  stop("No existe el dataset Silver requerido: ", INPUT_PATH)
}

dir.create(OUTPUT_DIR, recursive = TRUE, showWarnings = FALSE)

cat("Cargando datos Silver para agregacion municipal...\n")
datos <- read_parquet(INPUT_PATH)

columnas_requeridas <- c(
  "DEP", "DEPNOMBRE_COMPLETO", "MUN", "MUNNOMBRE", "MESA_ID",
  "CANNOMBRE", "PARNOMBRE", "CANCEDULA", "TIPO_VOTO", "VOTOS"
)
columnas_faltantes <- setdiff(columnas_requeridas, names(datos))
if (length(columnas_faltantes) > 0) {
  stop("Faltan columnas requeridas: ", paste(columnas_faltantes, collapse = ", "))
}

datos_candidatos <- datos %>%
  filter(TIPO_VOTO == "CANDIDATO")

votos_municipio <- datos_candidatos %>%
  group_by(
    DEP, DEPNOMBRE_COMPLETO, MUN, MUNNOMBRE,
    CANNOMBRE, PARNOMBRE, CANCEDULA
  ) %>%
  summarise(VOTOS = sum(VOTOS, na.rm = TRUE), .groups = "drop") %>%
  group_by(DEP, MUN) %>%
  mutate(
    TOTAL_VOTOS_VALIDOS = sum(VOTOS),
    PORCENTAJE_MUN = round(VOTOS / TOTAL_VOTOS_VALIDOS * 100, 2),
    POSICION = min_rank(desc(VOTOS))
  ) %>%
  ungroup() %>%
  arrange(DEP, MUN, POSICION, CANNOMBRE)

mapeo_mesas <- datos %>%
  distinct(DEP, DEPNOMBRE_COMPLETO, MUN, MUNNOMBRE, MESA_ID) %>%
  arrange(DEP, MUN, MESA_ID)

participacion <- datos %>%
  group_by(DEP, DEPNOMBRE_COMPLETO, MUN, MUNNOMBRE, TIPO_VOTO) %>%
  summarise(VOTOS = sum(VOTOS, na.rm = TRUE), .groups = "drop") %>%
  pivot_wider(names_from = TIPO_VOTO, values_from = VOTOS, values_fill = 0) %>%
  mutate(
    TOTAL_VOTOS = CANDIDATO + BLANCO + NULO + NO_MARCADO,
    TASA_CANDIDATOS = round(CANDIDATO / TOTAL_VOTOS * 100, 2),
    TASA_BLANCOS = round(BLANCO / TOTAL_VOTOS * 100, 2),
    TASA_NULOS = round(NULO / TOTAL_VOTOS * 100, 2),
    TASA_NO_MARCADOS = round(NO_MARCADO / TOTAL_VOTOS * 100, 2)
  ) %>%
  arrange(DEP, MUN)

num_municipios <- datos %>%
  distinct(DEP, MUN) %>%
  nrow()

if (votos_municipio %>% distinct(DEP, MUN) %>% nrow() != num_municipios ||
    nrow(participacion) != num_municipios) {
  stop("Las salidas municipales no cubren todos los municipios")
}

if (nrow(mapeo_mesas) != n_distinct(datos$MESA_ID)) {
  stop("El mapeo de mesas no conserva una fila unica por MESA_ID")
}

write_csv(
  votos_municipio,
  file.path(OUTPUT_DIR, "votos_por_candidato_mun.csv")
)
write_parquet(
  votos_municipio,
  file.path(OUTPUT_DIR, "votos_por_candidato_mun.parquet")
)
write_csv(
  mapeo_mesas,
  file.path(OUTPUT_DIR, "mapeo_mesas_municipios.csv")
)
write_csv(
  participacion,
  file.path(OUTPUT_DIR, "participacion_municipal.csv")
)

cat(sprintf(
  "Agregacion municipal completada: %d municipios, %d mesas.\n",
  num_municipios,
  nrow(mapeo_mesas)
))
