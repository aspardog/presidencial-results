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
Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R  # Generate Gold
Rscript scripts/02_silver_to_gold/ejecutar_fase_4.R              # Generate dashboard JSON + check GeoJSON prerequisites
```

## Architecture

### Data Flow

```
data/bronze/     Raw Registraduría CSVs + DANE shapefiles
      ↓
data/silver/     Cleaned mesa-level data (datos_master.rds)
      ↓
data/gold/       Aggregations (nacional/, departamental/, municipal/)
      ↓
dashboard/web/public/api/   Static JSON consumed by Next.js
```

### Dashboard Static Data Pattern

The dashboard uses **static imports only** - no runtime API calls. JSON files in `public/api/` are imported directly into components at build time. This ensures Vercel serves a closed, verifiable version.

Key static endpoints:
- `nacional/resumen.json` - National totals, winner, runner-up
- `nacional/candidatos.json` - Candidates sorted by votes
- `departamentos/lista.json` - Department summaries
- `departamentos/detalle.json` - Per-department candidates and metrics
- `analisis/claves-territoriales.json` - Territorial analysis data
- `mapas/departamentos.json` - Simplified GeoJSON for interactive map
- `mapas/municipios.json` - Simplified municipal GeoJSON generated for map data coverage

### Validation System

`npm run validate` blocks builds if:
- `total_votos` or `votos_validos` is zero
- Candidate vote sum ≠ `votos_validos`
- Department sum ≠ national valid votes
- Fewer than 33 departments in data or map
- DANE map codes don't resolve to electoral codes
- Missing territorial findings
- Wrong Vercel project (must be `voto-colombia-2026`)

`npm run verify:prod` checks the live URL post-deployment.

## Key Conventions

### Branding

Uses Global Bridge Consultancy visual system. Keep dashboard styling consistent with the existing palette, card density, and compact hierarchy.

### TypeScript Types

Electoral types are defined in `dashboard/web/src/types/electoral.ts`. Main interfaces include `ResumenNacional`, `CandidatoNacional`, `DepartamentoDetalle`, and `ClavesTerritoriales`.

### Component Structure

- `MapaElectoral` - Interactive SVG map of Colombia
- `HallazgosClave` - Unified national and territorial analysis section (replaces separate ClavesTerritoriales)
- `BarrasCandidatos` - Nivo bar chart for candidate comparison
- `CardResumen`, `CardGanador` - Summary cards

### Adding New Analysis

1. Generate data from `scripts/build-data.js` or produce JSON in `public/api/`
2. Import statically in the component
3. Add validation in `scripts/validate-static-contracts.js`
4. Add production verification in `scripts/verify-production.js`
5. Deploy with `npm run deploy:prod`
