"""
Endpoints para datos a nivel departamental.
"""
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    DepartamentoDetalle,
    DepartamentoResumen,
    MunicipioResumen,
)
from app.services.data_loader import (
    load_departamento_detalle,
    load_departamentos,
    load_municipios_departamento,
)

router = APIRouter(prefix="/departamentos", tags=["Departamentos"])


@router.get("", response_model=list[DepartamentoResumen])
async def get_departamentos():
    """
    Obtiene la lista de todos los departamentos con resumen.

    Incluye ganador y votos principales para cada departamento.
    """
    return load_departamentos()


@router.get("/{codigo}", response_model=DepartamentoDetalle)
async def get_departamento(codigo: str):
    """
    Obtiene el detalle completo de un departamento.

    Incluye resultados de todos los candidatos.
    """
    result = load_departamento_detalle(codigo)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"Departamento con código {codigo} no encontrado"
        )

    return result


@router.get("/{codigo}/municipios", response_model=list[MunicipioResumen])
async def get_municipios_departamento(codigo: str):
    """
    Obtiene los municipios de un departamento con sus resultados.
    """
    municipios = load_municipios_departamento(codigo)

    if not municipios:
        # Verificar si el departamento existe
        detalle = load_departamento_detalle(codigo)
        if detalle is None:
            raise HTTPException(
                status_code=404,
                detail=f"Departamento con código {codigo} no encontrado"
            )

    return municipios
