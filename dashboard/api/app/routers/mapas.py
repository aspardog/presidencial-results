"""
Endpoints para datos geoespaciales (GeoJSON).
"""
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.models.schemas import MapMetadata
from app.services.data_loader import (
    load_geojson_departamentos,
    load_geojson_municipios,
    load_map_metadata,
    load_departamento_detalle,
)

router = APIRouter(prefix="/mapas", tags=["Mapas"])


@router.get("/metadata", response_model=MapMetadata)
async def get_map_metadata():
    """
    Obtiene metadata para inicializar el mapa.

    Incluye centro, zoom inicial y bounds de Colombia.
    """
    return load_map_metadata()


@router.get("/departamentos")
async def get_geojson_departamentos() -> Any:
    """
    Obtiene el GeoJSON simplificado de departamentos.

    Incluye geometrías y propiedades electorales (ganador, votos, etc.).
    Optimizado para web (~600 KB).
    """
    geojson = load_geojson_departamentos()

    return JSONResponse(
        content=geojson,
        headers={
            "Cache-Control": "public, max-age=3600",  # Cache por 1 hora
        }
    )


@router.get("/departamentos/{codigo}/municipios")
async def get_geojson_municipios(codigo: str) -> Any:
    """
    Obtiene el GeoJSON simplificado de municipios de un departamento.

    Carga bajo demanda para optimizar el rendimiento.
    """
    # Verificar que el departamento existe
    detalle = load_departamento_detalle(codigo)
    if detalle is None:
        raise HTTPException(
            status_code=404,
            detail=f"Departamento con código {codigo} no encontrado"
        )

    geojson = load_geojson_municipios(codigo)

    return JSONResponse(
        content=geojson,
        headers={
            "Cache-Control": "public, max-age=3600",
        }
    )
