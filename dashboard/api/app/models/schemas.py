"""
Esquemas Pydantic para la API.
"""
from pydantic import BaseModel


# ============================================================
# CANDIDATOS
# ============================================================

class CandidatoBase(BaseModel):
    """Información básica de un candidato."""
    nombre: str
    partido: str
    cedula: str
    color: str


class CandidatoNacional(CandidatoBase):
    """Candidato con resultados nacionales."""
    votos: int
    porcentaje: float
    posicion: int


class CandidatoDepartamento(CandidatoBase):
    """Candidato con resultados en un departamento."""
    votos: int
    porcentaje: float
    posicion: int


class CandidatoMunicipio(CandidatoBase):
    """Candidato con resultados en un municipio."""
    votos: int
    porcentaje: float
    posicion: int


# ============================================================
# RESÚMENES
# ============================================================

class ResumenNacional(BaseModel):
    """Resumen ejecutivo nacional."""
    total_votos: int
    votos_validos: int
    votos_blancos: int
    votos_nulos: int
    votos_no_marcados: int
    total_mesas: int
    total_departamentos: int
    ganador: str
    partido_ganador: str
    votos_ganador: int
    porcentaje_ganador: float
    segundo: str
    votos_segundo: int
    diferencia: int


class MetricasParticipacion(BaseModel):
    """Métricas de participación electoral."""
    total_votos: int
    votos_validos: int
    votos_blancos: int
    votos_nulos: int
    votos_no_marcados: int
    porcentaje_validos: float
    porcentaje_blancos: float
    porcentaje_nulos: float
    porcentaje_no_marcados: float


# ============================================================
# DEPARTAMENTOS
# ============================================================

class DepartamentoResumen(BaseModel):
    """Resumen de un departamento."""
    codigo: str
    nombre: str
    total_votos: int
    ganador: str
    partido_ganador: str
    votos_ganador: int
    porcentaje_ganador: float
    segundo: str
    diferencia: int


class DepartamentoDetalle(DepartamentoResumen):
    """Detalle completo de un departamento."""
    candidatos: list[CandidatoDepartamento]
    total_municipios: int


# ============================================================
# MUNICIPIOS
# ============================================================

class MunicipioResumen(BaseModel):
    """Resumen de un municipio."""
    codigo: str
    codigo_departamento: str
    nombre: str
    nombre_departamento: str
    total_votos: int
    ganador: str
    votos_ganador: int
    porcentaje_ganador: float


class MunicipioDetalle(MunicipioResumen):
    """Detalle completo de un municipio."""
    candidatos: list[CandidatoMunicipio]


# ============================================================
# MAPAS
# ============================================================

class MapMetadata(BaseModel):
    """Metadata para inicializar el mapa."""
    center: list[float]  # [lng, lat]
    zoom: float
    bounds: list[list[float]]  # [[sw_lng, sw_lat], [ne_lng, ne_lat]]
    total_departamentos: int
    total_municipios: int
