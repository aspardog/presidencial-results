"""
Dashboard Electoral API - FastAPI Application.

Esta API sirve datos electorales de la capa Gold del proyecto
presidencial-results para consumo del dashboard web.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import departamental, mapas, municipal, nacional
from app.services.data_loader import invalidate_cache

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación."""
    # Startup: pre-cargar datos en cache
    print("Iniciando API...")
    print(f"Directorio de datos: {settings.data_dir}")
    print(f"Directorio GeoJSON: {settings.geojson_dir}")

    # Pre-cargar datos frecuentes
    from app.services.data_loader import (
        load_resumen_nacional,
        load_candidatos_nacional,
        load_departamentos,
        load_geojson_departamentos,
    )

    try:
        load_resumen_nacional()
        load_candidatos_nacional()
        load_departamentos()
        load_geojson_departamentos()
        print("Datos pre-cargados correctamente")
    except Exception as e:
        print(f"Advertencia: No se pudieron pre-cargar todos los datos: {e}")

    yield

    # Shutdown
    print("Cerrando API...")
    invalidate_cache()


# Crear aplicación
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    API para el Dashboard Electoral de Colombia.

    Proporciona acceso a resultados electorales presidenciales
    a nivel nacional, departamental y municipal.

    ## Endpoints

    - **/api/v1/nacional**: Resultados a nivel nacional
    - **/api/v1/departamentos**: Resultados por departamento
    - **/api/v1/municipios**: Resultados por municipio
    - **/api/v1/mapas**: Datos geoespaciales (GeoJSON)

    ## Arquitectura

    Esta API consume datos de la capa Gold del proyecto,
    siguiendo la arquitectura Medallion (Bronze → Silver → Gold).
    """,
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(nacional.router, prefix="/api/v1")
app.include_router(departamental.router, prefix="/api/v1")
app.include_router(municipal.router, prefix="/api/v1")
app.include_router(mapas.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """Endpoint raíz con información de la API."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "endpoints": {
            "nacional": "/api/v1/nacional",
            "departamentos": "/api/v1/departamentos",
            "municipios": "/api/v1/municipios",
            "mapas": "/api/v1/mapas",
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Verificación de salud del servicio."""
    return {"status": "healthy"}


@app.post("/api/v1/cache/invalidate", tags=["Admin"])
async def invalidate_all_cache():
    """Invalida todo el cache de datos."""
    invalidate_cache()
    return {"message": "Cache invalidado correctamente"}
