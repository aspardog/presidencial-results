# ============================================================================
# Script de Limpieza: Bronze → Silver
# Proyecto: Análisis Electoral Colombia
# Autor: Santiago Pardo
# Fecha: 2026-06-15
# Descripción: Consolida y limpia datos electorales desde Bronze a Silver
# ============================================================================

# ============================================================================
# CONFIGURACIÓN
# ============================================================================
library(tidyverse)
library(readr)
library(stringr)
library(arrow)  # Para Parquet
library(jsonlite)  # Para JSON

# Rutas
DIR_BRONZE <- "data/bronze/raw/electoral/registraduria_2026-06-15"
DIR_SILVER <- "data/silver/electoral"
DIR_METADATA <- "data/silver/metadata/electoral"
DIR_LOGS <- "logs"

# Crear directorio de logs si no existe
if (!dir.exists(DIR_LOGS)) dir.create(DIR_LOGS, recursive = TRUE)

# Configurar logging
timestamp <- format(Sys.time(), "%Y%m%d_%H%M%S")
log_file <- file.path(DIR_LOGS, paste0("limpieza_", timestamp, ".log"))

log_msg <- function(msg) {
  timestamp_msg <- sprintf("[%s] %s", Sys.time(), msg)
  cat(timestamp_msg, "\n")
  cat(timestamp_msg, "\n", file = log_file, append = TRUE)
}

# ============================================================================
# INICIO
# ============================================================================
log_msg("================================================================================")
log_msg("INICIANDO LIMPIEZA: BRONZE → SILVER")
log_msg("================================================================================")
log_msg("")

# ============================================================================
# 1. LECTURA DE ARCHIVOS
# ============================================================================
log_msg("PASO 1: Lectura de archivos desde Bronze")
log_msg("------------------------------------------------------------------------")

# Verificar si existe Bronze con archivos
if (dir.exists(DIR_BRONZE) && length(list.files(DIR_BRONZE, pattern = "\\.csv$")) > 0) {

  log_msg("✓ Directorio Bronze encontrado con archivos CSV")
  archivos <- list.files(DIR_BRONZE, pattern = "\\.csv$", full.names = TRUE)
  log_msg(sprintf("  Archivos encontrados: %d", length(archivos)))

  # Leer todos los archivos y concatenarlos
  log_msg("  Leyendo y consolidando archivos...")
  datos_raw <- map_df(archivos, function(archivo) {
    log_msg(sprintf("  - Leyendo: %s", basename(archivo)))
    read_delim(archivo,
               delim = ";",
               locale = locale(encoding = "UTF-8"),
               col_types = cols(
                 DEP = col_character(),
                 DEPNOMBRE = col_character(),
                 MUN = col_character(),
                 MUNNOMBRE = col_character(),
                 ZONA = col_character(),
                 PUESTO = col_character(),
                 PUESNOMBRE = col_character(),
                 MESA = col_character(),
                 COMUCODIGO = col_character(),
                 COMUNOMBRE = col_character(),
                 CORCODIGO = col_character(),
                 CORNOMBRE = col_character(),
                 CIR = col_character(),
                 PAR = col_character(),
                 PARNOMBRE = col_character(),
                 CAN = col_character(),
                 CANCEDULA = col_character(),
                 CANNOMBRE = col_character(),
                 VOTOS = col_integer()
               ))
  })

  log_msg(sprintf("✓ Total de registros cargados: %s", format(nrow(datos_raw), big.mark = ",")))

} else {

  # Si no hay archivos en Bronze, usar datos ya existentes en Silver
  log_msg("⚠ No se encontraron archivos CSV en Bronze")
  log_msg("  Cargando datos existentes desde Silver...")

  if (file.exists(file.path(DIR_SILVER, "datos_master.rds"))) {
    datos_raw <- readRDS(file.path(DIR_SILVER, "datos_master.rds"))
    log_msg(sprintf("✓ Datos cargados desde Silver: %s registros", format(nrow(datos_raw), big.mark = ",")))
    log_msg("  NOTA: Para regenerar desde Bronze, colocar CSVs originales en:")
    log_msg(sprintf("        %s", DIR_BRONZE))

    # Si ya están limpios, saltamos a guardar
    if ("DEPNOMBRE_COMPLETO" %in% names(datos_raw)) {
      log_msg("  Los datos ya están limpios. Regenerando outputs...")
      datos_limpios <- datos_raw
      goto_save <- TRUE
    } else {
      goto_save <- FALSE
    }
  } else {
    stop("ERROR: No se encontraron datos ni en Bronze ni en Silver.
         Por favor, colocar archivos CSV en: ", DIR_BRONZE)
  }
}

log_msg("")

# ============================================================================
# 2. LIMPIEZA Y NORMALIZACIÓN
# ============================================================================
if (!exists("goto_save") || !goto_save) {

  log_msg("PASO 2: Limpieza y normalización")
  log_msg("------------------------------------------------------------------------")

  datos_limpios <- datos_raw %>%
    mutate(
      # Normalizar nombres de departamentos completos
      DEPNOMBRE_COMPLETO = case_when(
        DEPNOMBRE == "NORTE DE SAN" ~ "NORTE DE SANTANDER",
        DEPNOMBRE == "SAN ANDRES" ~ "SAN ANDRES Y PROVIDENCIA",
        DEPNOMBRE == "VALLE" ~ "VALLE DEL CAUCA",
        TRUE ~ DEPNOMBRE
      ),

      # Limpiar espacios en blanco
      across(where(is.character), str_trim),

      # Asegurar que VOTOS es numérico
      VOTOS = as.integer(VOTOS),

      # Crear categoría de tipo de voto
      TIPO_VOTO = case_when(
        CANNOMBRE == "VOTOS EN BLANCO" ~ "BLANCO",
        CANNOMBRE == "VOTOS NULOS" ~ "NULO",
        CANNOMBRE == "VOTOS NO MARCADOS" ~ "NO_MARCADO",
        TRUE ~ "CANDIDATO"
      ),

      # Crear ID único de mesa
      MESA_ID = paste(DEP, MUN, ZONA, PUESTO, MESA, sep = "_"),

      # Convertir códigos a formato estándar
      DEP = str_pad(DEP, 2, pad = "0"),
      MUN = str_pad(MUN, 3, pad = "0")
    )

  log_msg("✓ Nombres de departamentos normalizados")
  log_msg("✓ Espacios en blanco eliminados")
  log_msg("✓ Tipos de dato verificados")
  log_msg("✓ Categorías de voto creadas (CANDIDATO, BLANCO, NULO, NO_MARCADO)")
  log_msg("✓ IDs únicos de mesa generados")
  log_msg("✓ Códigos DANE estandarizados (2 dígitos depto, 3 dígitos municipio)")
  log_msg("")
}

# ============================================================================
# 3. VALIDACIÓN DE DATOS
# ============================================================================
log_msg("PASO 3: Validación de calidad de datos")
log_msg("------------------------------------------------------------------------")

# Verificar valores nulos en columnas críticas
columnas_criticas <- c("DEP", "DEPNOMBRE", "MUN", "MUNNOMBRE", "MESA", "CANNOMBRE", "VOTOS")
nulos <- datos_limpios %>%
  summarise(across(all_of(columnas_criticas), ~sum(is.na(.))))

log_msg("Valores nulos por columna:")
for (col in columnas_criticas) {
  log_msg(sprintf("  %s: %d", col, nulos[[col]]))
}

# Verificar votos negativos
votos_negativos <- sum(datos_limpios$VOTOS < 0, na.rm = TRUE)
log_msg(sprintf("Votos negativos: %d", votos_negativos))

# Estadísticas generales
log_msg("")
log_msg("Estadísticas generales:")
log_msg(sprintf("  Departamentos: %d", n_distinct(datos_limpios$DEPNOMBRE_COMPLETO)))
log_msg(sprintf("  Municipios: %d", n_distinct(datos_limpios$MUNNOMBRE)))
log_msg(sprintf("  Mesas: %d", n_distinct(datos_limpios$MESA_ID)))
log_msg(sprintf("  Total votos: %s", format(sum(datos_limpios$VOTOS, na.rm = TRUE), big.mark = ",")))
log_msg("")

# Guardar validaciones en archivo
validaciones_txt <- sprintf("Validación de Datos - %s

Valores Nulos:
%s

Votos Negativos: %d

Estadísticas:
- Departamentos: %d
- Municipios: %d
- Mesas: %d
- Total votos: %s
",
Sys.time(),
paste(sprintf("  %s: %d", names(nulos), unlist(nulos)), collapse = "\n"),
votos_negativos,
n_distinct(datos_limpios$DEPNOMBRE_COMPLETO),
n_distinct(datos_limpios$MUNNOMBRE),
n_distinct(datos_limpios$MESA_ID),
format(sum(datos_limpios$VOTOS, na.rm = TRUE), big.mark = ",")
)

writeLines(validaciones_txt, file.path(DIR_METADATA, "validaciones.txt"))
log_msg("✓ Validaciones guardadas en: data/silver/metadata/electoral/validaciones.txt")
log_msg("")

# ============================================================================
# 4. GUARDAR DATOS LIMPIOS
# ============================================================================
log_msg("PASO 4: Guardando datos limpios en Silver")
log_msg("------------------------------------------------------------------------")

# CSV
log_msg("Guardando formato CSV...")
write_csv(datos_limpios, file.path(DIR_SILVER, "datos_master.csv"))
tamaño_csv <- file.size(file.path(DIR_SILVER, "datos_master.csv")) / (1024^2)
log_msg(sprintf("✓ CSV guardado: %.2f MB", tamaño_csv))

# Parquet
log_msg("Guardando formato Parquet...")
write_parquet(datos_limpios, file.path(DIR_SILVER, "datos_master.parquet"))
tamaño_parquet <- file.size(file.path(DIR_SILVER, "datos_master.parquet")) / (1024^2)
log_msg(sprintf("✓ Parquet guardado: %.2f MB", tamaño_parquet))

# RDS
log_msg("Guardando formato RDS...")
saveRDS(datos_limpios, file.path(DIR_SILVER, "datos_master.rds"))
tamaño_rds <- file.size(file.path(DIR_SILVER, "datos_master.rds")) / (1024^2)
log_msg(sprintf("✓ RDS guardado: %.2f MB", tamaño_rds))

log_msg("")
log_msg(sprintf("Datos guardados en: %s", DIR_SILVER))
log_msg("")

# ============================================================================
# 5. GUARDAR METADATA
# ============================================================================
log_msg("PASO 5: Generando metadata")
log_msg("------------------------------------------------------------------------")

# Transformaciones aplicadas
transformaciones_txt <- sprintf("Transformaciones Aplicadas - %s

Origen: %s
Destino: %s

Transformaciones:
1. Consolidación de archivos CSV
2. Normalización de nombres de departamentos:
   - NORTE DE SAN → NORTE DE SANTANDER
   - SAN ANDRES → SAN ANDRES Y PROVIDENCIA
   - VALLE → VALLE DEL CAUCA
3. Eliminación de espacios en blanco
4. Estandarización de códigos DANE (padding con ceros)
5. Creación de columna DEPNOMBRE_COMPLETO
6. Creación de columna TIPO_VOTO
7. Creación de columna MESA_ID (identificador único)

Registros procesados: %s
Columnas finales: %d
",
Sys.time(),
DIR_BRONZE,
DIR_SILVER,
format(nrow(datos_limpios), big.mark = ","),
ncol(datos_limpios)
)

writeLines(transformaciones_txt, file.path(DIR_METADATA, "transformaciones.log"))
log_msg("✓ Log de transformaciones guardado")

# Schema
schema_json <- sprintf('{
  "version": "1.0",
  "fecha": "%s",
  "registros": %d,
  "columnas": %d,
  "columnas_lista": %s,
  "formatos_disponibles": ["CSV", "Parquet", "RDS"]
}',
Sys.time(),
nrow(datos_limpios),
ncol(datos_limpios),
toJSON(names(datos_limpios), auto_unbox = FALSE)
)

writeLines(schema_json, file.path(DIR_METADATA, "schema.json"))
log_msg("✓ Schema guardado")
log_msg("")

# ============================================================================
# 6. RESUMEN FINAL
# ============================================================================
log_msg("================================================================================")
log_msg("PROCESO COMPLETADO EXITOSAMENTE")
log_msg("================================================================================")
log_msg("")
log_msg("ARCHIVOS GENERADOS:")
log_msg(sprintf("  1. %s/datos_master.csv (%.2f MB)", DIR_SILVER, tamaño_csv))
log_msg(sprintf("  2. %s/datos_master.parquet (%.2f MB)", DIR_SILVER, tamaño_parquet))
log_msg(sprintf("  3. %s/datos_master.rds (%.2f MB)", DIR_SILVER, tamaño_rds))
log_msg("")
log_msg("METADATA GENERADA:")
log_msg(sprintf("  - %s/validaciones.txt", DIR_METADATA))
log_msg(sprintf("  - %s/transformaciones.log", DIR_METADATA))
log_msg(sprintf("  - %s/schema.json", DIR_METADATA))
log_msg("")
log_msg(sprintf("LOG GUARDADO EN: %s", log_file))
log_msg("")
log_msg(sprintf("Dimensiones finales: %s filas × %d columnas",
        format(nrow(datos_limpios), big.mark = ","),
        ncol(datos_limpios)))
log_msg("")
log_msg("¡Datos listos para agregación en Gold!")
log_msg("")
