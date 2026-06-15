# ============================================================================
# Script de Validaciones Exhaustivas - Datos Electorales
# Proyecto: Análisis Electoral Colombia
# Autor: Santiago Pardo
# Fecha: 2026-06-15
# Descripción: Validaciones de calidad e integridad de datos en Silver
# ============================================================================

library(tidyverse)
library(arrow)

cat("================================================================================\n")
cat("VALIDACIONES EXHAUSTIVAS - DATOS ELECTORALES\n")
cat("================================================================================\n\n")

# Cargar datos desde Silver
cat("Cargando datos desde Silver...\n")
datos <- read_parquet("data/silver/electoral/datos_master.parquet")
cat(sprintf("✓ Datos cargados: %s registros\n\n", format(nrow(datos), big.mark = ",")))

errores <- list()
warnings <- list()

# ============================================================================
# 1. VALIDACIONES DE INTEGRIDAD
# ============================================================================
cat("1. VALIDACIONES DE INTEGRIDAD\n")
cat(strrep("-", 80), "\n")

# 1.1 Valores nulos
cat("\n1.1 Verificando valores nulos...\n")
nulos_por_columna <- datos %>%
  summarise(across(everything(), ~sum(is.na(.)))) %>%
  pivot_longer(everything(), names_to = "columna", values_to = "nulos") %>%
  filter(nulos > 0)

if (nrow(nulos_por_columna) > 0) {
  errores$nulos <- nulos_por_columna
  cat("⚠️  ADVERTENCIA: Se encontraron valores nulos:\n")
  print(nulos_por_columna)
} else {
  cat("✓ No se encontraron valores nulos\n")
}

# 1.2 Duplicados de MESA_ID
cat("\n1.2 Verificando duplicados de MESA_ID...\n")
duplicados_mesa <- datos %>%
  count(MESA_ID, CANNOMBRE) %>%
  filter(n > 1)

if (nrow(duplicados_mesa) > 0) {
  errores$duplicados_mesa <- duplicados_mesa
  cat(sprintf("❌ ERROR: %d combinaciones MESA_ID + CANNOMBRE duplicadas\n", nrow(duplicados_mesa)))
} else {
  cat("✓ No hay duplicados de MESA_ID + CANNOMBRE\n")
}

# 1.3 Votos negativos
cat("\n1.3 Verificando votos negativos...\n")
votos_negativos <- datos %>% filter(VOTOS < 0)

if (nrow(votos_negativos) > 0) {
  errores$votos_negativos <- votos_negativos
  cat(sprintf("❌ ERROR: %d registros con votos negativos\n", nrow(votos_negativos)))
} else {
  cat("✓ No hay votos negativos\n")
}

# ============================================================================
# 2. VALIDACIONES DE CÓDIGOS DANE
# ============================================================================
cat("\n2. VALIDACIONES DE CÓDIGOS DANE\n")
cat(strrep("-", 80), "\n")

# 2.1 Formato de códigos de departamento
cat("\n2.1 Verificando formato de códigos de departamento...\n")
codigos_depto_invalidos <- datos %>%
  filter(!str_detect(DEP, "^\\d{2}$")) %>%
  distinct(DEP, DEPNOMBRE)

if (nrow(codigos_depto_invalidos) > 0) {
  errores$codigos_depto <- codigos_depto_invalidos
  cat("❌ ERROR: Códigos de departamento con formato inválido:\n")
  print(codigos_depto_invalidos)
} else {
  cat("✓ Todos los códigos de departamento tienen formato correcto (2 dígitos)\n")
}

# 2.2 Formato de códigos de municipio
cat("\n2.2 Verificando formato de códigos de municipio...\n")
codigos_mun_invalidos <- datos %>%
  filter(!str_detect(MUN, "^\\d{3}$")) %>%
  distinct(MUN, MUNNOMBRE)

if (nrow(codigos_mun_invalidos) > 0) {
  errores$codigos_mun <- codigos_mun_invalidos
  cat("❌ ERROR: Códigos de municipio con formato inválido:\n")
  print(codigos_mun_invalidos)
} else {
  cat("✓ Todos los códigos de municipio tienen formato correcto (3 dígitos)\n")
}

# 2.3 Número de departamentos
cat("\n2.3 Verificando número de departamentos...\n")
num_deptos <- n_distinct(datos$DEPNOMBRE_COMPLETO)
if (num_deptos != 33) {
  warnings$num_deptos <- sprintf("Se esperaban 33 departamentos, se encontraron %d", num_deptos)
  cat(sprintf("⚠️  ADVERTENCIA: %s\n", warnings$num_deptos))
} else {
  cat(sprintf("✓ Número correcto de departamentos: %d\n", num_deptos))
}

# ============================================================================
# 3. VALIDACIONES DE DATOS ELECTORALES
# ============================================================================
cat("\n3. VALIDACIONES DE DATOS ELECTORALES\n")
cat(strrep("-", 80), "\n")

# 3.1 Verificar que existan las 4 categorías de voto
cat("\n3.1 Verificando categorías de TIPO_VOTO...\n")
tipos_voto <- unique(datos$TIPO_VOTO)
tipos_esperados <- c("CANDIDATO", "BLANCO", "NULO", "NO_MARCADO")

if (!all(tipos_esperados %in% tipos_voto)) {
  warnings$tipos_voto <- "Faltan categorías de TIPO_VOTO"
  cat("⚠️  ADVERTENCIA: Categorías de TIPO_VOTO incompletas\n")
  cat("   Esperadas:", paste(tipos_esperados, collapse = ", "), "\n")
  cat("   Encontradas:", paste(tipos_voto, collapse = ", "), "\n")
} else {
  cat("✓ Todas las categorías de TIPO_VOTO presentes\n")
}

# 3.2 Distribución de votos por tipo
cat("\n3.2 Distribución de votos por tipo:\n")
distribucion <- datos %>%
  group_by(TIPO_VOTO) %>%
  summarise(
    total_votos = sum(VOTOS),
    porcentaje = round(sum(VOTOS) / sum(datos$VOTOS) * 100, 2)
  ) %>%
  arrange(desc(total_votos))

print(distribucion)

# 3.3 Verificar candidatos
cat("\n3.3 Verificando número de candidatos...\n")
num_candidatos <- datos %>%
  filter(TIPO_VOTO == "CANDIDATO") %>%
  distinct(CANNOMBRE) %>%
  nrow()

cat(sprintf("✓ Candidatos encontrados: %d\n", num_candidatos))

# 3.4 Total de votos por candidato
cat("\n3.4 Total de votos por candidato:\n")
votos_candidatos <- datos %>%
  filter(TIPO_VOTO == "CANDIDATO") %>%
  group_by(CANNOMBRE, PARNOMBRE) %>%
  summarise(total_votos = sum(VOTOS), .groups = "drop") %>%
  arrange(desc(total_votos))

print(votos_candidatos)

# ============================================================================
# 4. VALIDACIONES DE CONSISTENCIA
# ============================================================================
cat("\n4. VALIDACIONES DE CONSISTENCIA\n")
cat(strrep("-", 80), "\n")

# 4.1 Mesas con votos excesivamente altos
cat("\n4.1 Detectando mesas con votos anómalos (>500 votos)...\n")
mesas_anomalas <- datos %>%
  group_by(MESA_ID) %>%
  summarise(total_votos = sum(VOTOS), .groups = "drop") %>%
  filter(total_votos > 500) %>%
  arrange(desc(total_votos))

if (nrow(mesas_anomalas) > 0) {
  warnings$mesas_anomalas <- mesas_anomalas
  cat(sprintf("⚠️  ADVERTENCIA: %d mesas con más de 500 votos totales\n", nrow(mesas_anomalas)))
  cat("   Top 5 mesas con más votos:\n")
  print(head(mesas_anomalas, 5))
} else {
  cat("✓ No se detectaron mesas con votos excesivamente altos\n")
}

# 4.2 Relación departamento-municipio
cat("\n4.2 Verificando consistencia departamento-municipio...\n")
inconsistencias_depto_mun <- datos %>%
  distinct(DEP, MUN, DEPNOMBRE_COMPLETO, MUNNOMBRE) %>%
  group_by(MUN, MUNNOMBRE) %>%
  summarise(
    num_deptos = n_distinct(DEP),
    deptos = paste(unique(DEPNOMBRE_COMPLETO), collapse = ", "),
    .groups = "drop"
  ) %>%
  filter(num_deptos > 1)

if (nrow(inconsistencias_depto_mun) > 0) {
  warnings$inconsistencias_depto_mun <- inconsistencias_depto_mun
  cat("⚠️  ADVERTENCIA: Municipios asociados a múltiples departamentos:\n")
  print(inconsistencias_depto_mun)
} else {
  cat("✓ Relación departamento-municipio consistente\n")
}

# ============================================================================
# 5. ESTADÍSTICAS FINALES
# ============================================================================
cat("\n5. ESTADÍSTICAS FINALES\n")
cat(strrep("-", 80), "\n\n")

cat(sprintf("Total de registros:       %s\n", format(nrow(datos), big.mark = ",")))
cat(sprintf("Total de votos:           %s\n", format(sum(datos$VOTOS), big.mark = ",")))
cat(sprintf("Departamentos:            %d\n", n_distinct(datos$DEPNOMBRE_COMPLETO)))
cat(sprintf("Municipios:               %s\n", format(n_distinct(datos$MUNNOMBRE), big.mark = ",")))
cat(sprintf("Mesas de votación:        %s\n", format(n_distinct(datos$MESA_ID), big.mark = ",")))
cat(sprintf("Candidatos:               %d\n", num_candidatos))

# ============================================================================
# 6. RESUMEN DE VALIDACIONES
# ============================================================================
cat("\n")
cat(strrep("=", 80), "\n")
cat("RESUMEN DE VALIDACIONES\n")
cat(strrep("=", 80), "\n\n")

num_errores <- length(errores)
num_warnings <- length(warnings)

if (num_errores == 0 && num_warnings == 0) {
  cat("✅ TODAS LAS VALIDACIONES PASARON EXITOSAMENTE\n")
  cat("   Los datos están listos para usar.\n\n")
} else {
  if (num_errores > 0) {
    cat(sprintf("❌ ERRORES ENCONTRADOS: %d\n", num_errores))
    for (nombre in names(errores)) {
      cat(sprintf("   - %s\n", nombre))
    }
    cat("\n")
  }

  if (num_warnings > 0) {
    cat(sprintf("⚠️  ADVERTENCIAS: %d\n", num_warnings))
    for (nombre in names(warnings)) {
      cat(sprintf("   - %s\n", nombre))
    }
    cat("\n")
  }

  if (num_errores > 0) {
    cat("⚠️  ACCIÓN REQUERIDA: Revisar y corregir errores antes de continuar.\n\n")
  } else {
    cat("✓ No se encontraron errores críticos. Las advertencias son informativas.\n\n")
  }
}

# Guardar reporte
reporte_path <- "data/silver/metadata/electoral/reporte_validaciones.txt"
sink(reporte_path)
cat("REPORTE DE VALIDACIONES - DATOS ELECTORALES\n")
cat("Fecha:", as.character(Sys.time()), "\n")
cat(strrep("=", 80), "\n\n")
cat("ERRORES:", num_errores, "\n")
cat("ADVERTENCIAS:", num_warnings, "\n\n")
if (num_errores > 0) {
  cat("DETALLE DE ERRORES:\n")
  print(errores)
}
if (num_warnings > 0) {
  cat("\nDETALLE DE ADVERTENCIAS:\n")
  print(warnings)
}
sink()

cat(sprintf("✓ Reporte guardado en: %s\n\n", reporte_path))
