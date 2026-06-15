# ============================================================================
# Agregacion nacional: Silver -> Gold
# Proyecto: Analisis Electoral Colombia
# ============================================================================

suppressPackageStartupMessages({
  library(arrow)
  library(dplyr)
  library(readr)
  library(tibble)
})

INPUT_PATH <- "data/silver/electoral/datos_master.parquet"
OUTPUT_DIR <- "data/gold/nacional"

if (!file.exists(INPUT_PATH)) {
  stop("No existe el dataset Silver requerido: ", INPUT_PATH)
}

dir.create(OUTPUT_DIR, recursive = TRUE, showWarnings = FALSE)

cat("Cargando datos Silver para agregacion nacional...\n")
datos <- read_parquet(INPUT_PATH)

columnas_requeridas <- c(
  "CANNOMBRE", "PARNOMBRE", "CANCEDULA", "TIPO_VOTO", "VOTOS", "MESA_ID"
)
columnas_faltantes <- setdiff(columnas_requeridas, names(datos))
if (length(columnas_faltantes) > 0) {
  stop("Faltan columnas requeridas: ", paste(columnas_faltantes, collapse = ", "))
}

datos_candidatos <- datos %>%
  filter(TIPO_VOTO == "CANDIDATO")

if (nrow(datos_candidatos) == 0) {
  stop("Silver no contiene registros con TIPO_VOTO == 'CANDIDATO'")
}

votos_candidato <- datos_candidatos %>%
  group_by(CANNOMBRE, PARNOMBRE, CANCEDULA) %>%
  summarise(TOTAL_VOTOS = sum(VOTOS, na.rm = TRUE), .groups = "drop") %>%
  mutate(
    PORCENTAJE = round(TOTAL_VOTOS / sum(TOTAL_VOTOS) * 100, 2),
    POSICION = min_rank(desc(TOTAL_VOTOS))
  ) %>%
  arrange(POSICION, CANNOMBRE)

votos_partido <- datos_candidatos %>%
  group_by(PARNOMBRE) %>%
  summarise(TOTAL_VOTOS = sum(VOTOS, na.rm = TRUE), .groups = "drop") %>%
  mutate(PORCENTAJE = round(TOTAL_VOTOS / sum(TOTAL_VOTOS) * 100, 2)) %>%
  arrange(desc(TOTAL_VOTOS), PARNOMBRE)

metricas_participacion <- datos %>%
  group_by(TIPO_VOTO) %>%
  summarise(TOTAL = sum(VOTOS, na.rm = TRUE), .groups = "drop") %>%
  mutate(PORCENTAJE = round(TOTAL / sum(TOTAL) * 100, 2)) %>%
  arrange(desc(TOTAL))

if (nrow(votos_candidato) < 2) {
  stop("Se requieren al menos dos candidatos para generar el resumen ejecutivo")
}

resumen_ejecutivo <- tibble(
  METRICA = c(
    "Total Votos",
    "Votos a Candidatos",
    "Total Mesas",
    "Candidatos",
    "Ganador",
    "Votos Ganador",
    "Porcentaje Ganador",
    "Segundo Lugar",
    "Votos Segundo",
    "Diferencia"
  ),
  VALOR = as.character(c(
    sum(datos$VOTOS, na.rm = TRUE),
    sum(datos_candidatos$VOTOS, na.rm = TRUE),
    n_distinct(datos$MESA_ID),
    nrow(votos_candidato),
    votos_candidato$CANNOMBRE[1],
    votos_candidato$TOTAL_VOTOS[1],
    votos_candidato$PORCENTAJE[1],
    votos_candidato$CANNOMBRE[2],
    votos_candidato$TOTAL_VOTOS[2],
    votos_candidato$TOTAL_VOTOS[1] - votos_candidato$TOTAL_VOTOS[2]
  ))
)

write_csv(votos_candidato, file.path(OUTPUT_DIR, "votos_por_candidato.csv"))
write_parquet(votos_candidato, file.path(OUTPUT_DIR, "votos_por_candidato.parquet"))
write_csv(votos_partido, file.path(OUTPUT_DIR, "votos_por_partido.csv"))
write_csv(
  metricas_participacion,
  file.path(OUTPUT_DIR, "metricas_participacion.csv")
)
write_csv(resumen_ejecutivo, file.path(OUTPUT_DIR, "resumen_ejecutivo.csv"))

cat(sprintf(
  "Agregacion nacional completada: %d candidatos, %s votos totales.\n",
  nrow(votos_candidato),
  format(sum(datos$VOTOS, na.rm = TRUE), big.mark = ",")
))
