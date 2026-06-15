# Dashboard Electoral Colombia 2026

Dashboard interactivo para visualizar resultados electorales presidenciales de Colombia.

## Arquitectura

```
dashboard/
├── api/          # Backend FastAPI (Python)
├── web/          # Frontend Next.js (React + TypeScript)
└── docker-compose.yml
```

## Stack Tecnologico

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Mapas:** Mapbox GL JS
- **Graficos:** Nivo (basado en D3)
- **Backend:** FastAPI, Pydantic, Pandas
- **Datos:** Consume capa Gold del proyecto (Medallion Architecture)

## Desarrollo Local

### Requisitos

- Node.js 20+
- Python 3.11+
- Token de Mapbox (opcional, hay uno por defecto para desarrollo)

### Backend (API)

```bash
cd api

# Crear entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
uvicorn app.main:app --reload --port 8000
```

API disponible en: http://localhost:8000
Documentacion: http://localhost:8000/docs

### Frontend (Web)

```bash
cd web

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

Dashboard disponible en: http://localhost:3000

## Endpoints API

| Endpoint | Descripcion |
|----------|-------------|
| `GET /api/v1/nacional/resumen` | Resumen ejecutivo nacional |
| `GET /api/v1/nacional/candidatos` | Lista de candidatos con votos |
| `GET /api/v1/departamentos` | Lista de departamentos |
| `GET /api/v1/departamentos/{codigo}` | Detalle de un departamento |
| `GET /api/v1/mapas/departamentos` | GeoJSON de departamentos |

## Docker

```bash
# Construir y ejecutar
docker-compose up --build

# Solo backend
docker-compose up api

# Solo frontend
docker-compose up web
```

## Datos

El dashboard consume datos de la capa Gold del proyecto:

- `data/gold/nacional/` - Resultados nacionales
- `data/gold/departamental/` - Resultados por departamento
- `data/gold/visualizaciones/mapas/simplified/` - GeoJSON optimizado

Los datos se generan ejecutando el pipeline R:

```bash
Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R
```

## Variables de Entorno

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=tu_token_aqui
```

### Backend (.env)

```env
# No requiere configuracion adicional por defecto
```
