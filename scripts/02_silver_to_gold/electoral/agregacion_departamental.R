# ============================================================================
# Agregacion departamental: Silver -> Gold
# Proyecto: Analisis Electoral Colombia
# ============================================================================

suppressPackageStartupMessages({
  library(arrow)
  library(dplyr)
  library(readr)
  library(tidyr)
})

INPUT_PATH <- "data/silver/electoral/datos_master.parquet"
OUTPUT_DIR <- "data/gold/departamental"

if (!file.exists(INPUT_PATH)) {
  stop("No existe el dataset Silver requerido: ", INPUT_PATH)
}

dir.create(OUTPUT_DIR, recursive = TRUE, showWarnings = FALSE)

cat("Cargando datos Silver para agregacion departamental...\n")
datos <- read_parquet(INPUT_PATH)

columnas_requeridas <- c(
  "DEP", "DEPNOMBRE_COMPLETO", "CANNOMBRE", "PARNOMBRE", "CANCEDULA",
  "TIPO_VOTO", "VOTOS"
)
columnas_faltantes <- setdiff(columnas_requeridas, names(datos))
if (length(columnas_faltantes) > 0) {
  stop("Faltan columnas requeridas: ", paste(columnas_faltantes, collapse = ", "))
}

datos_candidatos <- datos %>%
  filter(TIPO_VOTO == "CANDIDATO")

votos_depto <- datos_candidatos %>%
  group_by(DEP, DEPNOMBRE_COMPLETO, CANNOMBRE, PARNOMBRE, CANCEDULA) %>%
  summarise(VOTOS = sum(VOTOS, na.rm = TRUE), .groups = "drop") %>%
  group_by(DEP, DEPNOMBRE_COMPLETO) %>%
  mutate(
    TOTAL_VOTOS_VALIDOS = sum(VOTOS),
    PORCENTAJE_DEPTO = round(VOTOS / TOTAL_VOTOS_VALIDOS * 100, 2),
    POSICION = min_rank(desc(VOTOS))
  ) %>%
  ungroup() %>%
  arrange(DEP, POSICION, CANNOMBRE)

rankings <- votos_depto %>%
  filter(POSICION <= 3) %>%
  select(
    DEP, DEPNOMBRE_COMPLETO, POSICION, CANNOMBRE, PARNOMBRE,
    VOTOS, TOTAL_VOTOS_VALIDOS, PORCENTAJE_DEPTO
  ) %>%
  arrange(DEP, POSICION, CANNOMBRE)

participacion <- datos %>%
  group_by(DEP, DEPNOMBRE_COMPLETO, TIPO_VOTO) %>%
  summarise(VOTOS = sum(VOTOS, na.rm = TRUE), .groups = "drop") %>%
  pivot_wider(names_from = TIPO_VOTO, values_from = VOTOS, values_fill = 0) %>%
  mutate(
    TOTAL_VOTOS = CANDIDATO + BLANCO + NULO + NO_MARCADO,
    TASA_CANDIDATOS = round(CANDIDATO / TOTAL_VOTOS * 100, 2),
    TASA_BLANCOS = round(BLANCO / TOTAL_VOTOS * 100, 2),
    TASA_NULOS = round(NULO / TOTAL_VOTOS * 100, 2),
    TASA_NO_MARCADOS = round(NO_MARCADO / TOTAL_VOTOS * 100, 2)
  ) %>%
  arrange(DEP)

primeros_dos <- votos_depto %>%
  group_by(DEP, DEPNOMBRE_COMPLETO) %>%
  arrange(desc(VOTOS), CANNOMBRE, .by_group = TRUE) %>%
  slice_head(n = 2) %>%
  mutate(ORDEN = row_number()) %>%
  ungroup()

diferencias <- primeros_dos %>%
  select(
    DEP, DEPNOMBRE_COMPLETO, ORDEN, CANNOMBRE, VOTOS,
    TOTAL_VOTOS_VALIDOS, PORCENTAJE_DEPTO
  ) %>%
  pivot_wider(
    names_from = ORDEN,
    values_from = c(CANNOMBRE, VOTOS, PORCENTAJE_DEPTO),
    names_glue = "{.value}_{ORDEN}"
  ) %>%
  transmute(
    DEP,
    DEPNOMBRE_COMPLETO,
    PRIMERO = CANNOMBRE_1,
    VOTOS_PRIMERO = VOTOS_1,
    PORCENTAJE_PRIMERO = PORCENTAJE_DEPTO_1,
    SEGUNDO = CANNOMBRE_2,
    VOTOS_SEGUNDO = VOTOS_2,
    PORCENTAJE_SEGUNDO = PORCENTAJE_DEPTO_2,
    TOTAL_VOTOS_VALIDOS,
    DIFERENCIA = VOTOS_1 - VOTOS_2,
    DIFERENCIA_PCT = round((VOTOS_1 - VOTOS_2) / VOTOS_1 * 100, 2),
    DIFERENCIA_PUNTOS = round(PORCENTAJE_DEPTO_1 - PORCENTAJE_DEPTO_2, 2)
  ) %>%
  arrange(DEP)

num_deptos <- n_distinct(datos$DEP)
if (n_distinct(votos_depto$DEP) != num_deptos ||
    nrow(participacion) != num_deptos ||
    nrow(diferencias) != num_deptos) {
  stop("Las salidas departamentales no cubren todos los departamentos")
}

write_csv(
  votos_depto,
  file.path(OUTPUT_DIR, "votos_por_candidato_depto.csv")
)
write_parquet(
  votos_depto,
  file.path(OUTPUT_DIR, "votos_por_candidato_depto.parquet")
)
write_csv(
  rankings,
  file.path(OUTPUT_DIR, "rankings_departamentales.csv")
)
write_csv(
  participacion,
  file.path(OUTPUT_DIR, "tasas_participacion_depto.csv")
)
write_csv(
  diferencias,
  file.path(OUTPUT_DIR, "diferencias_primer_segundo.csv")
)

cat(sprintf(
  "Agregacion departamental completada: %d departamentos, %d filas candidato-departamento.\n",
  num_deptos,
  nrow(votos_depto)
))
