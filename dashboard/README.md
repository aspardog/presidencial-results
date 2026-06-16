# Dashboard Electoral Colombia 2026

Dashboard interactivo para visualizar resultados electorales presidenciales de Colombia.

**Demo en vivo:** https://voto-colombia-2026.vercel.app

## Arquitectura

```
dashboard/
├── api/          # Backend FastAPI (opcional, para desarrollo)
├── web/          # Frontend Next.js (static export)
└── docker-compose.yml
```

## Stack Tecnologico

- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **Mapas:** SVG nativo con proyeccion geografica
- **Graficos:** Nivo (basado en D3)
- **Deploy:** Vercel (static export)
- **Datos:** JSON estaticos embebidos en build time

## Caracteristicas

- Mapa electoral interactivo por departamento
- Resultados por candidato con barras comparativas
- Seleccion de departamento para ver resultados locales
- Seccion "Hallazgos clave" con analisis automatizado:
  - Lecturas editoriales del resultado
  - Metricas principales (resultado, competitividad, ventajas)
  - Departamentos donde se definio la eleccion
  - Elecciones mas cerradas
  - Bastiones electorales por candidato

## Desarrollo Local

### Requisitos

- Node.js 20+

### Frontend (Web)

```bash
cd web

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

Dashboard disponible en: http://localhost:3000

### Regenerar datos (opcional)

Si necesitas actualizar los datos desde la capa Gold:

```bash
cd web

# Regenerar JSON desde datos Gold
npm run build:data

# Build completo (datos + Next.js)
npm run build:full
```

## Deploy

El dashboard usa Next.js static export. Para desplegar:

```bash
cd web

# Build de produccion
npm run build

# Deploy a Vercel
vercel --prod
```

## Estructura de Datos

Los datos se importan estaticamente desde `public/api/`:

| Archivo | Contenido |
|---------|-----------|
| `nacional/resumen.json` | Resumen ejecutivo nacional |
| `nacional/candidatos.json` | Lista de candidatos con votos |
| `departamentos/lista.json` | Lista de departamentos |
| `departamentos/detalle.json` | Detalle por departamento |
| `analisis/claves-territoriales.json` | Hallazgos clave |
| `mapas/departamentos.json` | GeoJSON de departamentos |

## Componentes Principales

| Componente | Descripcion |
|------------|-------------|
| `MapaElectoral` | Mapa SVG interactivo de Colombia |
| `CardGanador` | Tarjeta de candidato con votos |
| `BarrasCandidatos` | Grafico de barras comparativo |
| `HallazgosClave` | Seccion de analisis electoral |
| `ClavesTerritoriales` | Detalles territoriales |

## Branding

El dashboard usa el sistema de diseno Global Bridge Consultancy:

- **Tipografia:** Fraunces (display), IBM Plex Sans (body), IBM Plex Mono (datos)
- **Colores:** Paleta teal con acentos para candidatos
- **Componentes:** Cards con bordes sutiles, eyebrows en mayusculas

## API Backend (Opcional)

El backend FastAPI es opcional para desarrollo local con datos dinamicos:

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
