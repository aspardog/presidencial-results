"""
Endpoints para datos a nivel nacional.
"""
from fastapi import APIRouter

from app.models.schemas import (
    CandidatoNacional,
    MetricasParticipacion,
    ResumenNacional,
)
from app.services.data_loader import (
    load_candidatos_nacional,
    load_participacion_nacional,
    load_resumen_nacional,
)

router = APIRouter(prefix="/nacional", tags=["Nacional"])


@router.get("/resumen", response_model=ResumenNacional)
async def get_resumen_nacional():
    """
    Obtiene el resumen ejecutivo nacional.

    Incluye total de votos, ganador, segundo lugar y diferencia.
    """
    return load_resumen_nacional()


@router.get("/candidatos", response_model=list[CandidatoNacional])
async def get_candidatos_nacional():
    """
    Obtiene la lista de candidatos con sus resultados nacionales.

    Ordenados por número de votos de mayor a menor.
    """
    return load_candidatos_nacional()


@router.get("/participacion", response_model=MetricasParticipacion)
async def get_participacion_nacional():
    """
    Obtiene las métricas de participación electoral.

    Incluye distribución de votos válidos, blancos, nulos y no marcados.
    """
    return load_participacion_nacional()
