# ============================================================================
# Preparacion de datos para dashboard
# Proyecto: Analisis Electoral Colombia
# ============================================================================

suppressPackageStartupMessages({
  library(dplyr)
  library(jsonlite)
  library(readr)
})

DIR_NACIONAL <- "data/gold/nacional"
DIR_DASHBOARD <- "data/gold/visualizaciones/dashboard"

archivos_requeridos <- c(
  votos = file.path(DIR_NACIONAL, "votos_por_candidato.csv"),
  resumen = file.path(DIR_NACIONAL, "resumen_ejecutivo.csv"),
  participacion = file.path(DIR_NACIONAL, "metricas_participacion.csv")
)

archivos_faltantes <- archivos_requeridos[!file.exists(archivos_requeridos)]
if (length(archivos_faltantes) > 0) {
  stop(
    "Faltan productos Gold requeridos. Ejecute primero la fase 3: ",
    paste(archivos_faltantes, collapse = ", ")
  )
}

dir.create(DIR_DASHBOARD, recursive = TRUE, showWarnings = FALSE)

votos_nacional <- read_csv(
  archivos_requeridos[["votos"]],
  show_col_types = FALSE,
  col_types = cols(CANCEDULA = col_character())
)
resumen <- read_csv(
  archivos_requeridos[["resumen"]],
  show_col_types = FALSE,
  col_types = cols(.default = col_character())
)
participacion <- read_csv(
  archivos_requeridos[["participacion"]],
  show_col_types = FALSE
)

metric_value <- function(nombre) {
  valor <- resumen$VALOR[resumen$METRICA == nombre]
  if (length(valor) != 1) {
    stop("La metrica '", nombre, "' no aparece exactamente una vez en el resumen")
  }
  valor[[1]]
}

metric_number <- function(nombre) {
  valor <- suppressWarnings(as.numeric(metric_value(nombre)))
  if (is.na(valor)) {
    stop("La metrica '", nombre, "' no es numerica")
  }
  valor
}

summary_nacional <- list(
  total_votos = metric_number("Total Votos"),
  votos_candidatos = metric_number("Votos a Candidatos"),
  total_mesas = metric_number("Total Mesas"),
  total_candidatos = metric_number("Candidatos"),
  ganador = metric_value("Ganador"),
  votos_ganador = metric_number("Votos Ganador"),
  porcentaje_ganador = metric_number("Porcentaje Ganador"),
  segundo = metric_value("Segundo Lugar"),
  votos_segundo = metric_number("Votos Segundo"),
  diferencia = metric_number("Diferencia")
)

series_candidatos <- votos_nacional %>%
  arrange(POSICION, CANNOMBRE) %>%
  transmute(
    candidato = CANNOMBRE,
    partido = PARNOMBRE,
    votos = TOTAL_VOTOS,
    porcentaje = PORCENTAJE,
    posicion = POSICION
  )

distribucion_votos <- participacion %>%
  arrange(desc(TOTAL)) %>%
  transmute(
    tipo_voto = TIPO_VOTO,
    total = TOTAL,
    porcentaje = PORCENTAJE
  )

metricas_resumen <- list(
  totales = list(
    votos = summary_nacional$total_votos,
    votos_candidatos = summary_nacional$votos_candidatos,
    mesas = summary_nacional$total_mesas,
    candidatos = summary_nacional$total_candidatos
  ),
  distribucion_votos = distribucion_votos
)

write_json(
  summary_nacional,
  file.path(DIR_DASHBOARD, "summary_nacional.json"),
  auto_unbox = TRUE,
  pretty = TRUE,
  digits = NA
)
write_json(
  series_candidatos,
  file.path(DIR_DASHBOARD, "series_candidatos.json"),
  dataframe = "rows",
  pretty = TRUE,
  digits = NA
)
write_json(
  metricas_resumen,
  file.path(DIR_DASHBOARD, "metricas_resumen.json"),
  auto_unbox = TRUE,
  dataframe = "rows",
  pretty = TRUE,
  digits = NA
)

cat(sprintf(
  "Dashboard preparado: %d candidatos y %d categorias de voto.\n",
  nrow(series_candidatos),
  nrow(distribucion_votos)
))
