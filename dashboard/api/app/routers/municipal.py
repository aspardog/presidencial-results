"""
Endpoints para datos a nivel municipal.
"""
from fastapi import APIRouter, HTTPException

from app.models.schemas import MunicipioDetalle
from app.services.data_loader import load_municipios_departamento

router = APIRouter(prefix="/municipios", tags=["Municipios"])


@router.get("/{codigo_dep}/{codigo_mun}", response_model=MunicipioDetalle)
async def get_municipio(codigo_dep: str, codigo_mun: str):
    """
    Obtiene el detalle de un municipio específico.

    Args:
        codigo_dep: Código del departamento (2 dígitos)
        codigo_mun: Código del municipio (3 dígitos)
    """
    municipios = load_municipios_departamento(codigo_dep)

    for mun in municipios:
        if mun["codigo"] == codigo_mun.zfill(3):
            # Por ahora retornamos el resumen como detalle
            # TODO: Cargar candidatos del municipio
            return {
                **mun,
                "candidatos": []  # Placeholder
            }

    raise HTTPException(
        status_code=404,
        detail=f"Municipio {codigo_mun} no encontrado en departamento {codigo_dep}"
    )
