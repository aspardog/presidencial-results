# ============================================================================
# Estimación del "lean" territorial: primera → segunda vuelta
# ============================================================================
# Para cada candidato eliminado en primera vuelta estimamos HACIA QUÉ FINALISTA
# se inclinó su electorado, usando correlación territorial a nivel municipal:
#
#   Por municipio m:
#     share_c(m)   = voto del candidato c / válidos, en PRIMERA vuelta
#     swing_A(m)   = share de Abelardo en 2ª − share de Abelardo en 1ª
#   lean_c = cor( share_c , swing_A )   ponderada por tamaño del municipio
#
# lean_c > 0  → donde c fue fuerte, Abelardo creció más → electorado de c se
# inclinó hacia Abelardo. lean_c < 0 → hacia Cepeda. |lean_c| = fuerza.
#
# Es una MEDIDA DE TENDENCIA (inferencia ecológica), no un conteo individual de
# trasvase. La participación subió entre vueltas, así que parte del crecimiento
# de los finalistas viene de nuevos votantes, no solo del trasvase.
# ============================================================================

suppressPackageStartupMessages({
  library(readr); library(dplyr); library(tidyr)
})

PRI <- "data/gold/municipal/votos_por_candidato_mun.csv"
SEG <- "data/gold/segunda/municipal/votos_por_candidato_mun.csv"
OUT_DIR <- "data/gold/analisis"
dir.create(OUT_DIR, recursive = TRUE, showWarnings = FALSE)

pri <- read_csv(PRI, show_col_types = FALSE)
seg <- read_csv(SEG, show_col_types = FALSE)
mid <- function(d) paste(sprintf("%02d", as.integer(d$DEP)), sprintf("%03d", as.integer(d$MUN)), sep = "_")
pri$MID <- mid(pri); seg$MID <- mid(seg)

# Shares por municipio (sobre válidos de cada vuelta)
share_wide <- function(df) {
  df %>% group_by(MID) %>% mutate(TOT = sum(VOTOS)) %>% ungroup() %>%
    mutate(SHARE = ifelse(TOT > 0, VOTOS / TOT, 0)) %>%
    select(MID, CANNOMBRE, SHARE) %>%
    pivot_wider(names_from = CANNOMBRE, values_from = SHARE, values_fill = 0)
}
tot_mun <- pri %>% group_by(MID) %>% summarise(PESO = sum(VOTOS), .groups = "drop")

priS <- share_wide(pri)
segS <- share_wide(seg)

finalistas <- intersect(colnames(segS)[-1], colnames(priS)[-1])
if (length(finalistas) != 2) stop("Se esperaban 2 finalistas comunes; hay ", length(finalistas))
# Ganador (Abelardo) = referencia para el swing
seg_tot <- seg %>% group_by(CANNOMBRE) %>% summarise(V = sum(VOTOS)) %>% arrange(desc(V))
ref <- seg_tot$CANNOMBRE[1]          # Abelardo (más votos en 2ª)
otro <- setdiff(finalistas, ref)

# Sufijar TODAS las columnas (no solo las comunes) para poder referenciarlas.
priS2 <- priS %>% rename_with(~ paste0(.x, "_1a"), -MID)
segS2 <- segS %>% rename_with(~ paste0(.x, "_2a"), -MID)
datos <- priS2 %>%
  inner_join(segS2, by = "MID") %>%
  inner_join(tot_mun, by = "MID")

swing_ref <- datos[[paste0(ref, "_2a")]] - datos[[paste0(ref, "_1a")]]
peso <- datos$PESO
r1_candidatos <- colnames(priS)[-1]

# Correlación ponderada
wcor <- function(x, y, w) {
  mx <- sum(w * x) / sum(w); my <- sum(w * y) / sum(w)
  cov <- sum(w * (x - mx) * (y - my)); vx <- sum(w * (x - mx)^2); vy <- sum(w * (y - my)^2)
  if (vx <= 0 || vy <= 0) return(0)
  cov / sqrt(vx * vy)
}

votos_1a_tot <- pri %>% group_by(CANNOMBRE) %>% summarise(V = sum(VOTOS), .groups = "drop")
validos_1a <- sum(votos_1a_tot$V)

tabla <- lapply(r1_candidatos, function(c) {
  x <- datos[[paste0(c, "_1a")]]
  lean <- wcor(x, swing_ref, peso)          # >0 hacia ref (Abelardo), <0 hacia otro
  v <- votos_1a_tot$V[votos_1a_tot$CANNOMBRE == c]
  tibble(
    CANNOMBRE = c,
    ES_FINALISTA = c %in% finalistas,
    VOTOS_1A = as.integer(v),
    PCT_1A = round(v / validos_1a * 100, 2),
    LEAN = round(lean, 3),                    # signed correlation
    HACIA = ifelse(lean >= 0, ref, otro),
    FUERZA = round(abs(lean), 3)
  )
}) %>% bind_rows() %>% arrange(desc(VOTOS_1A))

tabla$REF <- ref
tabla$OTRO <- otro

write_csv(tabla, file.path(OUT_DIR, "trasvase.csv"))
cat(sprintf("Referencia de swing: %s (positivo = hacia %s, negativo = hacia %s)\n", ref, ref, otro))
cat(sprintf("✓ %s/trasvase.csv (%d candidatos, %d municipios)\n", OUT_DIR, nrow(tabla), nrow(datos)))
for (i in seq_len(nrow(tabla))) {
  r <- tabla[i, ]
  cat(sprintf("  %-32s 1a=%4.1f%%  lean=%+.2f  → %s (fuerza %.2f)%s\n",
              substr(r$CANNOMBRE, 1, 32), r$PCT_1A, r$LEAN,
              substr(r$HACIA, 1, 10), r$FUERZA, ifelse(r$ES_FINALISTA, "  [finalista]", "")))
}
