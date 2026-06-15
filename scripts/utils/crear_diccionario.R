# Script para Generar Diccionario de Datos
# Base de Datos Electoral - Colombia
# Fecha: 2026-06-15

library(tidyverse)
library(knitr)

cat("=== GENERANDO DICCIONARIO DE DATOS ===\n\n")

# Cargar datos para análisis
datos <- readRDS("output/datos_electorales_master.rds")

# 1. ESTRUCTURA DEL DICCIONARIO ----

diccionario <- tribble(
  ~Columna, ~Tipo, ~Descripción, ~Ejemplo, ~Notas,

  # Identificadores Geográficos
  "DEP", "character", "Código DANE del departamento (2 dígitos)", "01", "Padded con ceros a la izquierda",
  "DEPNOMBRE", "character", "Nombre abreviado del departamento", "ANTIOQUIA", "Puede estar abreviado",
  "DEPNOMBRE_COMPLETO", "character", "Nombre completo normalizado del departamento", "NORTE DE SANTANDER", "Columna agregada - nombres oficiales completos",

  "MUN", "character", "Código DANE del municipio (3 dígitos)", "001", "Padded con ceros a la izquierda",
  "MUNNOMBRE", "character", "Nombre del municipio", "MEDELLIN", "En mayúsculas",

  # Identificadores de Puesto de Votación
  "ZONA", "character", "Código de zona electoral", "01", "Zona dentro del municipio",
  "PUESTO", "character", "Código del puesto de votación", "01", "Identifica el lugar de votación",
  "PUESNOMBRE", "character", "Nombre del puesto de votación", "ESTADIO ATANASIO GIRARDOT", "Nombre del establecimiento",
  "MESA", "character", "Número de mesa de votación", "002", "Identificador único de mesa en el puesto",
  "MESA_ID", "character", "ID único de mesa", "01_001_90_01_002", "Columna agregada - Formato: DEP_MUN_ZONA_PUESTO_MESA",

  # Identificadores Administrativos
  "COMUCODIGO", "character", "Código de comuna/comunidad", "000", "000 = Nacional, otros = comunas locales",
  "COMUNOMBRE", "character", "Nombre de comuna/comunidad", "NACIONAL", "Nivel administrativo local",
  "CORCODIGO", "character", "Código de corporación electoral", "01", "Identifica el tipo de elección",
  "CORNOMBRE", "character", "Nombre de corporación", "PRESIDENTE", "Tipo de elección",
  "CIR", "character", "Código de circunscripción", "0", "Circunscripción electoral",

  # Identificadores de Partido y Candidato
  "PAR", "character", "Código de partido político", "0026", "Código asignado al partido",
  "PARNOMBRE", "character", "Nombre del partido político", "MOVIMIENTO POLÍTICO PACTO HISTÓRICO", "Nombre completo del partido",

  "CAN", "character", "Código del candidato", "001", "Número del candidato dentro del partido",
  "CANCEDULA", "character", "Número de cédula del candidato", "79262397", "NA para votos especiales (blanco, nulo)",
  "CANNOMBRE", "character", "Nombre del candidato", "IVÁN CEPEDA CASTRO", "Nombre completo del candidato o tipo de voto",

  # Datos Electorales
  "VOTOS", "integer", "Número de votos obtenidos", "76", "Votos en esta mesa para este candidato",

  # Categorías Agregadas
  "TIPO_VOTO", "character", "Categoría del voto", "CANDIDATO", "Columna agregada - Valores: CANDIDATO, BLANCO, NULO, NO_MARCADO"
)

# 2. CATÁLOGO DE VALORES ----

catalogo_valores <- list(
  TIPO_VOTO = tibble(
    Valor = c("CANDIDATO", "BLANCO", "NULO", "NO_MARCADO"),
    Descripción = c(
      "Voto válido para un candidato",
      "Voto en blanco",
      "Voto nulo o inválido",
      "Tarjeta electoral no marcada"
    ),
    Conteo = c(
      sum(datos$TIPO_VOTO == "CANDIDATO"),
      sum(datos$TIPO_VOTO == "BLANCO"),
      sum(datos$TIPO_VOTO == "NULO"),
      sum(datos$TIPO_VOTO == "NO_MARCADO")
    )
  ),

  DEPARTAMENTOS = datos %>%
    select(DEP, DEPNOMBRE_COMPLETO) %>%
    distinct() %>%
    arrange(DEP) %>%
    mutate(Total_Votos = map_int(DEPNOMBRE_COMPLETO, ~sum(datos$VOTOS[datos$DEPNOMBRE_COMPLETO == .x]))),

  PARTIDOS = datos %>%
    filter(TIPO_VOTO == "CANDIDATO") %>%
    select(PAR, PARNOMBRE) %>%
    distinct() %>%
    arrange(PARNOMBRE),

  CANDIDATOS = datos %>%
    filter(TIPO_VOTO == "CANDIDATO") %>%
    select(CANCEDULA, CANNOMBRE, PARNOMBRE) %>%
    distinct() %>%
    arrange(CANNOMBRE) %>%
    mutate(Total_Votos = map_int(CANNOMBRE, ~sum(datos$VOTOS[datos$CANNOMBRE == .x])))
)

# 3. ESTADÍSTICAS GENERALES ----

estadisticas <- list(
  total_registros = nrow(datos),
  total_votos = sum(datos$VOTOS),
  departamentos = n_distinct(datos$DEPNOMBRE_COMPLETO),
  municipios = n_distinct(datos$MUNNOMBRE),
  mesas = n_distinct(datos$MESA_ID),
  candidatos = sum(datos$TIPO_VOTO == "CANDIDATO" & !duplicated(datos$CANNOMBRE)),
  partidos = n_distinct(datos$PARNOMBRE[datos$TIPO_VOTO == "CANDIDATO"]),

  distribucion_votos = datos %>%
    group_by(TIPO_VOTO) %>%
    summarise(
      Total = sum(VOTOS),
      Porcentaje = round(sum(VOTOS) / sum(datos$VOTOS) * 100, 2),
      .groups = "drop"
    )
)

# 4. GUARDAR DICCIONARIO EN MÚLTIPLES FORMATOS ----

# CSV del diccionario principal
write_csv(diccionario, "output/diccionario_datos.csv")
cat("✓ Diccionario guardado: output/diccionario_datos.csv\n")

# Catálogos de valores
write_csv(catalogo_valores$TIPO_VOTO, "output/catalogo_tipo_voto.csv")
write_csv(catalogo_valores$DEPARTAMENTOS, "output/catalogo_departamentos.csv")
write_csv(catalogo_valores$PARTIDOS, "output/catalogo_partidos.csv")
write_csv(catalogo_valores$CANDIDATOS, "output/catalogo_candidatos_detalle.csv")

cat("✓ Catálogos guardados en /output\n")

# 5. GENERAR DOCUMENTO MARKDOWN ----

md_content <- c(
  "# Diccionario de Datos - Base Electoral Colombia",
  "",
  "**Fecha de creación:** 2026-06-15  ",
  sprintf("**Total de registros:** %s  ", format(estadisticas$total_registros, big.mark = ",")),
  sprintf("**Total de votos:** %s  ", format(estadisticas$total_votos, big.mark = ",")),
  sprintf("**Período:** Elecciones Presidenciales Colombia", ""),
  "",
  "---",
  "",
  "## 1. Descripción General",
  "",
  "Esta base de datos contiene los resultados detallados de las elecciones presidenciales",
  "de Colombia, desglosados por mesa de votación. Incluye información geográfica,",
  "administrativa y electoral a nivel nacional.",
  "",
  "### Cobertura Geográfica",
  sprintf("- **Departamentos:** %d (incluye Bogotá D.C.)", estadisticas$departamentos),
  sprintf("- **Municipios:** %s", format(estadisticas$municipios, big.mark = ",")),
  sprintf("- **Mesas de votación:** %s", format(estadisticas$mesas, big.mark = ",")),
  "",
  "### Cobertura Electoral",
  sprintf("- **Candidatos:** %d", estadisticas$candidatos),
  sprintf("- **Partidos políticos:** %d", estadisticas$partidos),
  "",
  "---",
  "",
  "## 2. Estructura de Archivos",
  "",
  "### Archivos Principales",
  "",
  "| Archivo | Descripción | Tamaño | Formato |",
  "|---------|-------------|--------|---------|",
  "| `datos_electorales_master.csv` | Base de datos completa | ~174 MB | CSV |",
  "| `datos_electorales_master.rds` | Base de datos completa (R nativo) | ~6 MB | RDS |",
  "",
  "### Archivos de Soporte",
  "",
  "| Archivo | Descripción |",
  "|---------|-------------|",
  "| `catalogo_candidatos.csv` | Lista de candidatos con partidos |",
  "| `resumen_candidatos.csv` | Totales y porcentajes por candidato |",
  "| `resumen_departamentos.csv` | Estadísticas por departamento |",
  "| `diccionario_datos.csv` | Este diccionario de datos |",
  "| `metadata.txt` | Metadatos del procesamiento |",
  "",
  "---",
  "",
  "## 3. Definición de Columnas",
  "",
  "### 3.1 Identificadores Geográficos",
  ""
)

# Añadir tabla de columnas geográficas
md_content <- c(md_content,
  "| Columna | Tipo | Descripción | Ejemplo |",
  "|---------|------|-------------|---------|"
)

geo_cols <- diccionario %>%
  filter(Columna %in% c("DEP", "DEPNOMBRE", "DEPNOMBRE_COMPLETO", "MUN", "MUNNOMBRE"))

for (i in 1:nrow(geo_cols)) {
  md_content <- c(md_content,
    sprintf("| `%s` | %s | %s | %s |",
            geo_cols$Columna[i],
            geo_cols$Tipo[i],
            geo_cols$Descripción[i],
            geo_cols$Ejemplo[i])
  )
}

md_content <- c(md_content,
  "",
  "**Notas:**",
  "- `DEPNOMBRE_COMPLETO` es una columna agregada que normaliza los nombres de departamentos",
  "- Mapeo de nombres:",
  "  - NORTE DE SAN → NORTE DE SANTANDER",
  "  - SAN ANDRES → SAN ANDRES Y PROVIDENCIA",
  "  - VALLE → VALLE DEL CAUCA",
  "",
  "### 3.2 Identificadores de Mesa",
  "",
  "| Columna | Tipo | Descripción | Ejemplo |",
  "|---------|------|-------------|---------|"
)

mesa_cols <- diccionario %>%
  filter(Columna %in% c("ZONA", "PUESTO", "PUESNOMBRE", "MESA", "MESA_ID"))

for (i in 1:nrow(mesa_cols)) {
  md_content <- c(md_content,
    sprintf("| `%s` | %s | %s | %s |",
            mesa_cols$Columna[i],
            mesa_cols$Tipo[i],
            mesa_cols$Descripción[i],
            mesa_cols$Ejemplo[i])
  )
}

md_content <- c(md_content,
  "",
  "**Notas:**",
  "- `MESA_ID` es un identificador único generado que combina: DEP_MUN_ZONA_PUESTO_MESA",
  "- Permite identificar de manera única cada mesa de votación en el país",
  "",
  "### 3.3 Identificadores Electorales",
  "",
  "| Columna | Tipo | Descripción | Ejemplo |",
  "|---------|------|-------------|---------|"
)

elec_cols <- diccionario %>%
  filter(Columna %in% c("PAR", "PARNOMBRE", "CAN", "CANCEDULA", "CANNOMBRE"))

for (i in 1:nrow(elec_cols)) {
  md_content <- c(md_content,
    sprintf("| `%s` | %s | %s | %s |",
            elec_cols$Columna[i],
            elec_cols$Tipo[i],
            elec_cols$Descripción[i],
            elec_cols$Ejemplo[i])
  )
}

md_content <- c(md_content,
  "",
  "### 3.4 Datos de Votación",
  "",
  "| Columna | Tipo | Descripción | Ejemplo |",
  "|---------|------|-------------|---------|"
)

voto_cols <- diccionario %>%
  filter(Columna %in% c("VOTOS", "TIPO_VOTO"))

for (i in 1:nrow(voto_cols)) {
  md_content <- c(md_content,
    sprintf("| `%s` | %s | %s | %s |",
            voto_cols$Columna[i],
            voto_cols$Tipo[i],
            voto_cols$Descripción[i],
            voto_cols$Ejemplo[i])
  )
}

md_content <- c(md_content,
  "",
  "---",
  "",
  "## 4. Catálogo de Valores",
  "",
  "### 4.1 Tipos de Voto (`TIPO_VOTO`)",
  "",
  "| Valor | Descripción | Registros |",
  "|-------|-------------|-----------|"
)

for (i in 1:nrow(catalogo_valores$TIPO_VOTO)) {
  md_content <- c(md_content,
    sprintf("| %s | %s | %s |",
            catalogo_valores$TIPO_VOTO$Valor[i],
            catalogo_valores$TIPO_VOTO$Descripción[i],
            format(catalogo_valores$TIPO_VOTO$Conteo[i], big.mark = ","))
  )
}

md_content <- c(md_content,
  "",
  "### 4.2 Candidatos Participantes",
  "",
  "| Candidato | Partido | Cédula | Total Votos |",
  "|-----------|---------|--------|-------------|"
)

for (i in 1:nrow(catalogo_valores$CANDIDATOS)) {
  md_content <- c(md_content,
    sprintf("| %s | %s | %s | %s |",
            catalogo_valores$CANDIDATOS$CANNOMBRE[i],
            catalogo_valores$CANDIDATOS$PARNOMBRE[i],
            catalogo_valores$CANDIDATOS$CANCEDULA[i],
            format(catalogo_valores$CANDIDATOS$Total_Votos[i], big.mark = ","))
  )
}

md_content <- c(md_content,
  "",
  "### 4.3 Departamentos",
  "",
  sprintf("Total: %d departamentos (ver `output/catalogo_departamentos.csv` para listado completo)",
          estadisticas$departamentos),
  "",
  "**Top 10 departamentos por votación:**",
  "",
  "| Código | Departamento | Total Votos |",
  "|--------|--------------|-------------|"
)

top_deptos <- catalogo_valores$DEPARTAMENTOS %>%
  arrange(desc(Total_Votos)) %>%
  head(10)

for (i in 1:nrow(top_deptos)) {
  md_content <- c(md_content,
    sprintf("| %s | %s | %s |",
            top_deptos$DEP[i],
            top_deptos$DEPNOMBRE_COMPLETO[i],
            format(top_deptos$Total_Votos[i], big.mark = ","))
  )
}

md_content <- c(md_content,
  "",
  "---",
  "",
  "## 5. Estadísticas Generales",
  "",
  "### 5.1 Distribución de Votos",
  "",
  "| Tipo | Total Votos | Porcentaje |",
  "|------|-------------|------------|"
)

for (i in 1:nrow(estadisticas$distribucion_votos)) {
  md_content <- c(md_content,
    sprintf("| %s | %s | %s%% |",
            estadisticas$distribucion_votos$TIPO_VOTO[i],
            format(estadisticas$distribucion_votos$Total[i], big.mark = ","),
            estadisticas$distribucion_votos$Porcentaje[i])
  )
}

md_content <- c(md_content,
  "",
  "---",
  "",
  "## 6. Notas Metodológicas",
  "",
  "### 6.1 Proceso de Limpieza",
  "",
  "1. **Consolidación:** Se unificaron 33 archivos CSV (uno por departamento)",
  "2. **Normalización:** Se estandarizaron nombres de departamentos",
  "3. **Validación:** Se verificaron valores nulos y negativos (0 encontrados)",
  "4. **Enriquecimiento:** Se agregaron columnas calculadas:",
  "   - `DEPNOMBRE_COMPLETO`",
  "   - `TIPO_VOTO`",
  "   - `MESA_ID`",
  "",
  "### 6.2 Calidad de Datos",
  "",
  "- **Completitud:** 100% (sin valores nulos en columnas críticas)",
  "- **Consistencia:** Validada estructura en todos los archivos",
  "- **Integridad:** 0 votos negativos, 0 registros duplicados",
  "",
  "### 6.3 Limitaciones",
  "",
  "- Los datos corresponden a resultados preliminares de mesas",
  "- Algunos nombres de puestos de votación pueden estar abreviados",
  "- La columna `CANCEDULA` es NA para votos especiales (blanco, nulo, no marcado)",
  "",
  "---",
  "",
  "## 7. Uso de los Datos",
  "",
  "### Cargar en R",
  "",
  "```r",
  "# Opción 1: CSV (más lento, mayor tamaño)",
  'datos <- read_csv("output/datos_electorales_master.csv")',
  "",
  "# Opción 2: RDS (recomendado - más rápido, menor tamaño)",
  'datos <- readRDS("output/datos_electorales_master.rds")',
  "```",
  "",
  "### Cargar en Python (pandas)",
  "",
  "```python",
  "import pandas as pd",
  'datos = pd.read_csv("output/datos_electorales_master.csv")',
  "```",
  "",
  "### Ejemplos de Consultas",
  "",
  "```r",
  "# Votos por candidato a nivel nacional",
  "datos %>%",
  "  filter(TIPO_VOTO == 'CANDIDATO') %>%",
  "  group_by(CANNOMBRE) %>%",
  "  summarise(total_votos = sum(VOTOS)) %>%",
  "  arrange(desc(total_votos))",
  "",
  "# Resultados por departamento",
  "datos %>%",
  "  group_by(DEPNOMBRE_COMPLETO, CANNOMBRE) %>%",
  "  summarise(votos = sum(VOTOS)) %>%",
  "  arrange(DEPNOMBRE_COMPLETO, desc(votos))",
  "",
  "# Tasa de votos en blanco por departamento",
  "datos %>%",
  "  group_by(DEPNOMBRE_COMPLETO) %>%",
  "  summarise(",
  "    total = sum(VOTOS),",
  "    blancos = sum(VOTOS[TIPO_VOTO == 'BLANCO']),",
  "    tasa_blanco = round(blancos / total * 100, 2)",
  "  )",
  "```",
  "",
  "---",
  "",
  "## 8. Contacto y Licencia",
  "",
  "**Fuente de datos:** Registraduría Nacional del Estado Civil - Colombia  ",
  sprintf("**Fecha de procesamiento:** %s  ", Sys.Date()),
  "",
  "Para preguntas o reportar problemas con los datos, consultar el repositorio del proyecto.",
  ""
)

# Guardar archivo Markdown
writeLines(md_content, "output/DICCIONARIO.md")
cat("✓ Diccionario Markdown guardado: output/DICCIONARIO.md\n")

# 6. GENERAR RESUMEN EN TXT ----

txt_content <- c(
  strrep("=", 70),
  "DICCIONARIO DE DATOS - BASE ELECTORAL COLOMBIA",
  strrep("=", 70),
  "",
  sprintf("Fecha: %s", Sys.Date()),
  sprintf("Total registros: %s", format(estadisticas$total_registros, big.mark = ",")),
  sprintf("Total votos: %s", format(estadisticas$total_votos, big.mark = ",")),
  "",
  "COLUMNAS (22 en total):",
  strrep("=", 70),
  ""
)

for (i in 1:nrow(diccionario)) {
  txt_content <- c(txt_content,
    sprintf("%d. %s [%s]", i, diccionario$Columna[i], diccionario$Tipo[i]),
    sprintf("   %s", diccionario$Descripción[i]),
    sprintf("   Ejemplo: %s", diccionario$Ejemplo[i]),
    ""
  )
}

txt_content <- c(txt_content,
  strrep("=", 70),
  "ARCHIVOS GENERADOS:",
  strrep("=", 70),
  "",
  "  - diccionario_datos.csv",
  "  - DICCIONARIO.md (este archivo en formato detallado)",
  "  - catalogo_tipo_voto.csv",
  "  - catalogo_departamentos.csv",
  "  - catalogo_partidos.csv",
  "  - catalogo_candidatos_detalle.csv",
  ""
)

writeLines(txt_content, "output/DICCIONARIO.txt")
cat("✓ Diccionario TXT guardado: output/DICCIONARIO.txt\n")

# 7. RESUMEN FINAL ----
cat(paste0("\n", strrep("=", 70), "\n"))
cat("=== DICCIONARIO DE DATOS COMPLETADO ===\n")
cat(paste0(strrep("=", 70), "\n\n"))

cat("Archivos generados:\n")
cat("  1. output/DICCIONARIO.md (Markdown - formato completo)\n")
cat("  2. output/DICCIONARIO.txt (Texto plano - resumen)\n")
cat("  3. output/diccionario_datos.csv (CSV - tabla de columnas)\n")
cat("  4. output/catalogo_tipo_voto.csv\n")
cat("  5. output/catalogo_departamentos.csv\n")
cat("  6. output/catalogo_partidos.csv\n")
cat("  7. output/catalogo_candidatos_detalle.csv\n\n")

cat(sprintf("Columnas documentadas: %d\n", nrow(diccionario)))
cat(sprintf("Departamentos catalogados: %d\n", nrow(catalogo_valores$DEPARTAMENTOS)))
cat(sprintf("Candidatos catalogados: %d\n", nrow(catalogo_valores$CANDIDATOS)))
cat("\n¡Diccionario completo!\n\n")
