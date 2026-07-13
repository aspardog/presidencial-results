# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electoral data pipeline and dashboard for Colombia's 2026 presidential election results. Two main components:

1. **R Pipeline** (root) - Medallion architecture (Bronze → Silver → Gold) for processing Registraduría electoral data
2. **Next.js Dashboard** (`dashboard/web/`) - Static export consuming generated JSON files

**Production:** https://voto-colombia-2026.vercel.app

## Common Commands

### Dashboard (from `dashboard/web/`)

```bash
npm run dev              # Development server at localhost:3000
npm run build:data       # Regenerate public/api/ from data/gold
npm run validate         # Validate data contracts, map, findings
npm run build            # Validate + compile Next.js
npm run deploy:prod      # Full deployment flow (recommended)
npm run lint             # ESLint
```

### R Pipeline (from root)

```bash
Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R  # Generate Gold (primera)
Rscript scripts/02_silver_to_gold/ejecutar_fase_4.R              # Generate dashboard JSON + check GeoJSON prerequisites
```

### Regenerating both electoral rounds

```bash
# Bronze → Silver → Gold, per round (VUELTA_ELECTORAL: primera | segunda)
VUELTA_ELECTORAL=segunda Rscript scripts/01_bronze_to_silver/limpieza_datos.R
VUELTA_ELECTORAL=segunda Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R

# From dashboard/web/: Gold → public/api per round, then the comparison bundle
VUELTA_ELECTORAL=primera node scripts/build-data.js   # → public/api/primera + shared mapas
VUELTA_ELECTORAL=segunda node scripts/build-data.js   # → public/api/segunda
# Estimated vote transfer (ecological inference, from repo root):
Rscript scripts/02_silver_to_gold/electoral/estimacion_trasvase.R  # → data/gold/analisis/trasvase.csv
node scripts/build-comparativa.js                     # → public/api/comparativa.json (incl. trasvase)
```

`npm run build:data` (in `dashboard/web/`) chains all of the above. Note the
`estimacion_trasvase.R` step needs R + the municipal Gold of both rounds; it is
NOT run on Vercel (which only consumes the committed `public/api/` JSON).

**Trasvase methodology:** `estimacion_trasvase.R` estimates, per first-round
candidate, the *territorial lean* of its vote — the weighted municipal
correlation between that candidate's 1st-round strength and the winner's 2nd-round
swing. It is ecological inference (a tendency, not individual vote counting);
turnout rose between rounds, so part of the finalists' growth is new voters.

## Architecture

### Data Flow

```
data/bronze/     Raw Registraduría CSVs + DANE shapefiles
      ↓
data/silver/     Cleaned mesa-level data (datos_master.rds)
      ↓
data/gold/       Aggregations. primera at root (nacional/, departamental/, municipal/);
                 segunda namespaced under data/gold/segunda/...
      ↓
dashboard/web/public/api/   Static JSON consumed by Next.js (per-round namespaces)
```

The R pipeline and `build-data.js` are parameterized by the `VUELTA_ELECTORAL`
env var (`primera` | `segunda`, default `primera`). `primera` writes to the
historical root paths; `segunda` writes to namespaced subfolders. Bronze CSVs
live in `data/bronze/raw/electoral/{Primera vuelta,Segunda vuelta}/`.

### Dashboard Static Data Pattern

The dashboard uses **static imports only** - no runtime API calls. JSON files in `public/api/` are imported directly into components at build time. This ensures Vercel serves a closed, verifiable version.

**Two electoral rounds:** the election has a first round (`primera`, 11 candidates, no majority) and a runoff (`segunda`, 2 candidates). Round-specific JSON is namespaced under `public/api/{primera,segunda}/...`. The dashboard's main view defaults to **segunda vuelta** (the decisive result); the first round gets its own explicit **"Primera vuelta"** section (`Comparativa.tsx`, fed by `comparativa.json`) with three subsections: who advanced, the estimated vote transfer (`trasvase`), and which territories changed preference. Map geometry is round-independent and shared under `public/api/mapas/`.

A page-top scope note states that results exclude overseas (consulado) votes; user-facing copy says **32 departamentos** (Bogotá D.C. is a district, counted apart), even though the data has 33 territorial units.

Key static endpoints (per round unless noted):
- `{vuelta}/nacional/resumen.json` - National totals, winner, runner-up
- `{vuelta}/nacional/candidatos.json` - Candidates sorted by votes
- `{vuelta}/departamentos/lista.json` - Department summaries
- `{vuelta}/departamentos/detalle.json` - Per-department candidates and metrics
- `{vuelta}/departamentos/municipios.json` - Municipal vote data indexed by electoral department code
- `{vuelta}/analisis/claves-territoriales.json` - Territorial analysis data
- `{vuelta}/analisis/polarizacion.json` - Department-level polarization metrics
- `{vuelta}/analisis/polarizacion-municipal.json` - Municipal polarization metrics
- `comparativa.json` - **(shared)** Primera↔segunda comparison: finalist growth, "votos en juego", turnout change, per-department and per-municipio winner flips (`resumen.pct_municipios_volteados`), and `trasvase` (estimated territorial lean of each eliminated candidate's vote, from `estimacion_trasvase.R`)
- `mapas/departamentos.json` - **(shared)** Simplified GeoJSON for interactive map
- `mapas/municipios/{codigo}.json` - **(shared)** Per-department municipal GeoJSON (33 files, ~135KB each)

Active-round imports live at `public/api/segunda/...` in `page.tsx`, `HallazgosClave.tsx`, and `MapaElectoral.tsx`. To change the main view to primera, repoint those imports to `public/api/primera/...`.

### GeoJSON Optimization

Municipal GeoJSON is split by department to reduce download size:
- **Before:** Single 4.43 MB file downloaded for any department
- **After:** ~135 KB average per department (97% reduction)

Files use DANE department codes (e.g., `mapas/municipios/05.json` for Antioquia).

### Municipal Data Matching

The GeoJSON uses DANE codes, but electoral data uses different codes. Matching is done by **normalized municipality name**, not code.

Key files:
- `src/lib/departamentos.ts` - DANE ↔ Electoral code conversion
- `src/components/maps/MapaElectoral.tsx` - Name normalization and lookup logic

Name normalization:
1. Remove accents (NFD + regex)
2. Uppercase
3. Remove punctuation, parentheses, hyphens
4. Remove spaces

Manual aliases for edge cases (5 municipalities with very different names):
```javascript
NOMBRE_ALIASES = {
  '05_SANTACRUZDEMOMPOX': 'MOMPOS',
  '07_VILLADELEYVA': 'VILLADELEIVA',
  '11_LOPEZDEMICAY': 'LOPEZMICAY',
  '60_MIRITIPARANA': 'MIRITIPARANA',
  '68_PAPUNAHUA': 'MORICHALPAPUNAGUA',
}
```

### Validation System

`npm run validate` runs two validation scripts:

**1. Static Contracts (`validate-static-contracts.js`):**
- `total_votos` or `votos_validos` is zero
- Candidate vote sum ≠ `votos_validos`
- Department sum ≠ national valid votes
- Fewer than 33 departments in data or map
- DANE map codes don't resolve to electoral codes
- Missing territorial findings
- Wrong Vercel project (must be `voto-colombia-2026`)

**2. Municipal Matching (`validate-municipal-matching.js`):**
- Verifies each GeoJSON municipality matches electoral data
- Requires 95%+ match rate to pass
- Shows which municipalities fail to match
- Current rate: 100% (1122/1122)

`npm run verify:prod` checks the live URL post-deployment.

## Key Conventions

### Branding

Uses Global Bridge Consultancy visual system. Keep dashboard styling consistent with the existing palette, card density, and compact hierarchy.

### TypeScript Types

Electoral types are defined in `dashboard/web/src/types/electoral.ts`. Main interfaces include `ResumenNacional`, `CandidatoNacional`, `DepartamentoDetalle`, and `ClavesTerritoriales`.

### Component Structure

- `MapaElectoral` - Interactive SVG map of Colombia
- `HallazgosClave` - Unified national and territorial analysis section (replaces separate ClavesTerritoriales)
- `Comparativa` - The explicit "Primera vuelta" section (consumes `comparativa.json`): finalist growth, plain-language vote-transfer analysis, and the "which territories changed preference" subsection
- `BarrasCandidatos` - Native HTML/CSS candidate comparison with accessible meter semantics
- `CardResumen`, `CardGanador` - Summary cards

### Adding New Analysis

1. Generate data from `scripts/build-data.js` or produce JSON in `public/api/`
2. Import statically in the component
3. Add validation in `scripts/validate-static-contracts.js`
4. Add production verification in `scripts/verify-production.js`
5. Deploy with `npm run deploy:prod`
