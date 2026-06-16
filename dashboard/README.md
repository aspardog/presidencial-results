# Dashboard Electoral Colombia 2026

Dashboard interactivo para visualizar resultados electorales presidenciales de Colombia.

**Produccion:** https://voto-colombia-2026.vercel.app

## Arquitectura

```
dashboard/
├── api/          # Backend FastAPI opcional para desarrollo
├── web/          # Frontend Next.js con export estatico
└── docker-compose.yml
```

El frontend no consulta una API dinamica en produccion. Los datos se generan como JSON estaticos en `web/public/api/` y se importan durante el build de Next.js. Esto hace que Vercel sirva una version cerrada y verificable del dashboard.

## Stack

- **Frontend:** Next.js 16, React 18, TypeScript, Tailwind CSS
- **Mapas:** SVG nativo con GeoJSON simplificado
- **Graficos:** Nivo Bar
- **Deploy:** Vercel con export estatico
- **Datos:** JSON generados desde `data/gold`

## Funcionalidad

- Mapa electoral interactivo por departamento.
- Seleccion de departamento con resultados locales.
- Resumen nacional con total de votos, votos validos, mesas y departamentos.
- Barras comparativas por candidato.
- Seccion unica de `Hallazgos clave`, que integra lectura nacional y territorial:
  - Sintesis electoral.
  - Resultado nacional.
  - Departamento mas reñido.
  - Mayor ventaja territorial.
  - Departamentos que concentraron la ventaja.
  - Departamentos mas competidos.
  - Bastiones electorales por candidato.

## Flujo Seguro De Datos Y Deploy

El comando correcto para publicar cambios es:

```bash
cd web
npm run deploy:prod
```

Ese comando ejecuta todo el circuito:

1. Regenera los JSON desde `data/gold` con `npm run build:data`.
2. Valida contratos de datos con `npm run validate`.
3. Compila Next.js con `npm run build`.
4. Despliega a Vercel en produccion.
5. Reasigna el alias publico `voto-colombia-2026.vercel.app`.
6. Verifica la URL publica con `npm run verify:prod`.

La idea es que no se publique una version si los datos no cuadran, si el mapa no cruza con los departamentos, si vuelve una seccion redundante o si el proyecto de Vercel no corresponde a `voto-colombia-2026`.

## Validaciones Automaticas

`npm run validate` falla el build si encuentra inconsistencias como:

- `total_votos` o `votos_validos` en cero.
- Suma de votos por candidato distinta a `votos_validos`.
- Suma departamental distinta al total nacional valido.
- Menos de 33 departamentos en lista, detalle o mapa.
- Codigos DANE del mapa que no resuelven a codigos electorales.
- Hallazgos territoriales incompletos.
- Restauracion accidental de una seccion separada `ClavesTerritoriales`.
- Proyecto Vercel distinto a `voto-colombia-2026`.

`npm run verify:prod` consulta la URL publica y confirma que:

- La pagina responde HTTP 200.
- La pagina muestra los totales que vienen del JSON publicado.
- La seccion `Hallazgos clave` esta presente.
- No aparece el encabezado antiguo `Claves territoriales`.
- Los endpoints publicos de JSON tienen candidatos, departamentos y mapa completos.

## Desarrollo Local

### Requisitos

- Node.js 24 recomendado, compatible con la configuracion actual de Vercel.
- npm.

### Instalar y correr

```bash
cd web
npm install
npm run dev
```

Dashboard local: http://localhost:3000

### Comandos Principales

| Comando | Uso |
|---------|-----|
| `npm run dev` | Ejecuta Next.js en desarrollo. |
| `npm run build:data` | Regenera `public/api/` desde `data/gold`. |
| `npm run validate` | Valida contratos de datos, mapa, hallazgos y Vercel. |
| `npm run build` | Valida y compila Next.js. |
| `npm run build:full` | Regenera datos, valida y compila. |
| `npm run verify:prod` | Verifica la URL publica de produccion. |
| `npm run deploy:prod` | Flujo completo y recomendado de despliegue. |
| `npm run lint` | Ejecuta ESLint. |

## Estructura De Datos Publicos

Los archivos consumidos por el dashboard viven en `web/public/api/`:

| Archivo | Contenido |
|---------|-----------|
| `nacional/resumen.json` | Totales nacionales, ganador, segundo y diferencia. |
| `nacional/candidatos.json` | Candidatos nacionales ordenados por votos. |
| `departamentos/lista.json` | Resumen por departamento. |
| `departamentos/detalle.json` | Candidatos y metricas por departamento. |
| `analisis/claves-territoriales.json` | Insumos territoriales usados dentro de `Hallazgos clave`. |
| `mapas/departamentos.json` | GeoJSON simplificado de departamentos. |

Aunque el archivo de analisis conserva el nombre `claves-territoriales.json`, ya no existe una seccion visual separada con ese nombre. Es una fuente de datos interna para la seccion unificada `Hallazgos clave`.

## Componentes Principales

| Componente | Descripcion |
|------------|-------------|
| `MapaElectoral` | Mapa SVG interactivo de Colombia. |
| `CardGanador` | Tarjeta de candidato principal o segundo lugar. |
| `CardResumen` | Metrica resumida. |
| `BarrasCandidatos` | Grafico de barras comparativo. |
| `HallazgosClave` | Seccion unica de analisis nacional y territorial. |

## Vercel

El proyecto enlazado debe ser:

```json
{
  "projectName": "voto-colombia-2026"
}
```

El archivo `web/vercel.json` fija el build command en:

```bash
npm run build
```

Ese build incluye `npm run validate`, por lo que Vercel no deberia publicar una version con datos inconsistentes. Despues del deploy, `npm run deploy:prod` reasigna explicitamente el alias:

```text
voto-colombia-2026.vercel.app
```

## Notas Para Nuevos Analisis

Cuando se agregue un nuevo analisis:

1. Generar sus datos desde `scripts/build-data.js` o desde un JSON producido en `public/api/`.
2. Importarlo estaticamente desde el componente correspondiente.
3. Agregar una validacion minima en `scripts/validate-static-contracts.js`.
4. Si el analisis debe verse en produccion, agregar una verificacion visible en `scripts/verify-production.js`.
5. Publicar con `npm run deploy:prod`.

Este flujo mantiene alineados datos, build y URL publica.

## Branding

El dashboard usa el sistema visual Global Bridge Consultancy:

- Paleta teal con colores por partido.
- Tipografias de sistema para evitar dependencias externas en build.
- Cards con bordes sutiles y jerarquia compacta.
- Hallazgos integrados en una sola lectura nacional-territorial.

## Backend Opcional

El backend FastAPI puede usarse para exploracion local, pero no es requerido por el dashboard publicado:

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API local: http://localhost:8000
Documentacion local: http://localhost:8000/docs
