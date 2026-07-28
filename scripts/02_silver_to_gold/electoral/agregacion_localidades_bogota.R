# ============================================================================
# Agregacion Bogota por localidad (ZONA): Silver -> Gold
# Proyecto: Analisis Electoral Colombia
#
# En las mesas de Bogota (DEP == "16") el campo ZONA codifica la LOCALIDAD:
#   01-20 = las 20 localidades (orden oficial); 90/98 = puestos especiales/censo
#   (votantes sin localidad geografica: feria, carceles, hospitales).
# Agrupa los votos por ZONA de forma analoga a la agregacion municipal.
# ============================================================================

suppressPackageStartupMessages({
  library(arrow)
  library(dplyr)
  library(readr)
})

# Parametrizacion por vuelta (ver limpieza_datos.R). primera => rutas raiz.
VUELTA <- tolower(Sys.getenv("VUELTA_ELECTORAL", "primera"))
SILVER_BASE <- if (VUELTA == "primera") "data/silver/electoral" else file.path("data/silver/electoral", VUELTA)
GOLD_BASE <- if (VUELTA == "primera") "data/gold" else file.path("data/gold", VUELTA)
INPUT_PATH <- file.path(SILVER_BASE, "datos_master.parquet")
OUTPUT_DIR <- file.path(GOLD_BASE, "bogota")
BOGOTA_DEP <- "16"

# ZONA -> localidad (codigo oficial 01-20). El resto (90/98) => puestos especiales.
LOCALIDADES <- c(
  "01" = "USAQUEN", "02" = "CHAPINERO", "03" = "SANTA FE", "04" = "SAN CRISTOBAL",
  "05" = "USME", "06" = "TUNJUELITO", "07" = "BOSA", "08" = "KENNEDY",
  "09" = "FONTIBON", "10" = "ENGATIVA", "11" = "SUBA", "12" = "BARRIOS UNIDOS",
  "13" = "TEUSAQUILLO", "14" = "LOS MARTIRES", "15" = "ANTONIO NARINO",
  "16" = "PUENTE ARANDA", "17" = "LA CANDELARIA", "18" = "RAFAEL URIBE URIBE",
  "19" = "CIUDAD BOLIVAR", "20" = "SUMAPAZ"
)

if (!file.exists(INPUT_PATH)) {
  stop("No existe el dataset Silver requerido: ", INPUT_PATH)
}
dir.create(OUTPUT_DIR, recursive = TRUE, showWarnings = FALSE)

cat(sprintf("Cargando Silver para agregacion Bogota por localidad (%s)...\n", VUELTA))
datos <- read_parquet(INPUT_PATH)

columnas_requeridas <- c("DEP", "ZONA", "CANNOMBRE", "PARNOMBRE", "CANCEDULA", "TIPO_VOTO", "VOTOS")
columnas_faltantes <- setdiff(columnas_requeridas, names(datos))
if (length(columnas_faltantes) > 0) {
  stop("Faltan columnas requeridas: ", paste(columnas_faltantes, collapse = ", "))
}

bogota <- datos %>%
  filter(DEP == BOGOTA_DEP, TIPO_VOTO == "CANDIDATO") %>%
  mutate(
    ES_LOCALIDAD = ZONA %in% names(LOCALIDADES),
    LOCALIDAD = ifelse(ES_LOCALIDAD, unname(LOCALIDADES[ZONA]), "PUESTOS ESPECIALES")
  )

if (nrow(bogota) == 0) {
  stop("No se encontraron mesas de Bogota (DEP == '16') con votos a candidatos")
}

votos_localidad <- bogota %>%
  group_by(ZONA, LOCALIDAD, ES_LOCALIDAD, CANNOMBRE, PARNOMBRE, CANCEDULA) %>%
  summarise(VOTOS = sum(VOTOS, na.rm = TRUE), .groups = "drop") %>%
  group_by(ZONA) %>%
  mutate(
    TOTAL_VOTOS_VALIDOS = sum(VOTOS),
    PORCENTAJE_LOC = round(VOTOS / TOTAL_VOTOS_VALIDOS * 100, 2),
    POSICION = min_rank(desc(VOTOS))
  ) %>%
  ungroup() %>%
  arrange(ZONA, POSICION, CANNOMBRE)

# Validaciones
n_zonas <- n_distinct(bogota$ZONA)
if (n_distinct(votos_localidad$ZONA) != n_zonas) {
  stop("La salida no cubre todas las zonas de Bogota")
}
total_bogota_silver <- sum(bogota$VOTOS)
total_bogota_gold <- sum(votos_localidad$VOTOS)
if (total_bogota_silver != total_bogota_gold) {
  stop(sprintf("Descuadre de votos: silver=%d gold=%d", total_bogota_silver, total_bogota_gold))
}

write_csv(votos_localidad, file.path(OUTPUT_DIR, "votos_por_candidato_localidad.csv"))

n_localidades <- sum(names(LOCALIDADES) %in% unique(bogota$ZONA))
cat(sprintf(
  "Agregacion Bogota completada: %d zonas (%d localidades + especiales), %s votos.\n",
  n_zonas, n_localidades, format(total_bogota_gold, big.mark = ".")
))
