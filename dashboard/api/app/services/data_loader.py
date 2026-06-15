"""
Servicio para cargar y cachear datos de la capa Gold.
"""
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

from app.config import get_settings

settings = get_settings()

# Colores por partido (consistentes con el frontend)
COLORES_PARTIDO: dict[str, str] = {
    "DEFENSORES DE LA PATRIA": "#1E40AF",
    "MOVIMIENTO POLÍTICO PACTO HISTÓRICO": "#DC2626",
    "PARTIDO CENTRO DEMOCRÁTICO": "#7C3AED",
    "PARTIDO POLÍTICO DIGNIDAD & COMPROMISO": "#059669",
    "CON CLAUDIA IMPARABLES": "#F59E0B",
    "ROMPER EL SISTEMA": "#EC4899",
    "COALICIÓN F.A.M.I.L.I.A": "#14B8A6",
    "PARTIDO DEMÓCRATA COLOMBIANO": "#6366F1",
    "SONDRA MACOLLINS, LA ABOGADA DE HIERRO": "#84CC16",
    "PARTIDO POLÍTICO LA FUERZA": "#F97316",
    "PARTIDO ECOLOGISTA COLOMBIANO": "#22C55E",
}

DEFAULT_COLOR = "#6B7280"  # Gris para partidos no mapeados


CODIGO_ELECTORAL_A_DANE: dict[str, str] = {
    "01": "05",  # ANTIOQUIA
    "03": "08",  # ATLANTICO
    "05": "13",  # BOLIVAR
    "07": "15",  # BOYACA
    "09": "17",  # CALDAS
    "11": "19",  # CAUCA
    "12": "20",  # CESAR
    "13": "23",  # CORDOBA
    "15": "25",  # CUNDINAMARCA
    "16": "11",  # BOGOTA D.C.
    "17": "27",  # CHOCO
    "19": "41",  # HUILA
    "21": "47",  # MAGDALENA
    "23": "52",  # NARIÑO
    "24": "66",  # RISARALDA
    "25": "54",  # NORTE DE SANTANDER
    "26": "63",  # QUINDIO
    "27": "68",  # SANTANDER
    "28": "70",  # SUCRE
    "29": "73",  # TOLIMA
    "31": "76",  # VALLE DEL CAUCA
    "40": "81",  # ARAUCA
    "44": "18",  # CAQUETA
    "46": "85",  # CASANARE
    "48": "44",  # LA GUAJIRA
    "50": "94",  # GUAINIA
    "52": "50",  # META
    "54": "95",  # GUAVIARE
    "56": "88",  # SAN ANDRES Y PROVIDENCIA
    "60": "91",  # AMAZONAS
    "64": "86",  # PUTUMAYO
    "68": "97",  # VAUPES
    "72": "99",  # VICHADA
}

CODIGO_DANE_A_ELECTORAL: dict[str, str] = {
    dane: electoral for electoral, dane in CODIGO_ELECTORAL_A_DANE.items()
}


def get_color_partido(partido: str) -> str:
    """Obtiene el color asociado a un partido."""
    return COLORES_PARTIDO.get(partido, DEFAULT_COLOR)


# ============================================================
# CARGA DE DATOS NACIONALES
# ============================================================

@lru_cache(maxsize=1)
def load_resumen_nacional() -> dict[str, Any]:
    """Carga el resumen ejecutivo nacional."""
    json_path = settings.data_dir / "visualizaciones" / "dashboard" / "summary_nacional.json"

    if json_path.exists():
        with open(json_path, encoding="utf-8") as f:
            data = json.load(f)

        # Mapear campos del JSON existente al schema esperado
        # El JSON tiene: total_votos, votos_candidatos, total_mesas, ganador, etc.
        # Necesitamos agregar campos faltantes
        participacion = _leer_metricas_participacion()

        return {
            "total_votos": data.get("total_votos", 0),
            "votos_validos": data.get("votos_candidatos", participacion["votos_validos"]),
            "votos_blancos": data.get("votos_blancos", participacion["votos_blancos"]),
            "votos_nulos": data.get("votos_nulos", participacion["votos_nulos"]),
            "votos_no_marcados": data.get("votos_no_marcados", participacion["votos_no_marcados"]),
            "total_mesas": data.get("total_mesas", 0),
            "total_departamentos": 33,
            "ganador": data.get("ganador", ""),
            "partido_ganador": _get_partido_ganador(data.get("ganador", "")),
            "votos_ganador": data.get("votos_ganador", 0),
            "porcentaje_ganador": data.get("porcentaje_ganador", 0),
            "segundo": data.get("segundo", ""),
            "votos_segundo": data.get("votos_segundo", 0),
            "diferencia": data.get("diferencia", 0),
        }

    # Fallback: calcular desde CSV
    return _calcular_resumen_nacional()


def _get_partido_ganador(nombre_candidato: str) -> str:
    """Obtiene el partido del candidato ganador."""
    # Mapeo de candidato a partido
    candidatos_partidos = {
        "ABELARDO DE LA ESPRIELLA": "DEFENSORES DE LA PATRIA",
        "IVÁN CEPEDA CASTRO": "MOVIMIENTO POLÍTICO PACTO HISTÓRICO",
        "PALOMA VALENCIA LASERNA": "PARTIDO CENTRO DEMOCRÁTICO",
        "SERGIO FAJARDO VALDERRAMA": "PARTIDO POLÍTICO DIGNIDAD & COMPROMISO",
        "CLAUDIA LÓPEZ": "CON CLAUDIA IMPARABLES",
    }
    return candidatos_partidos.get(nombre_candidato, "")


def _calcular_resumen_nacional() -> dict[str, Any]:
    """Calcula el resumen nacional desde los CSV."""
    # Cargar votos por candidato
    candidatos_path = settings.data_dir / "nacional" / "votos_por_candidato.csv"
    if not candidatos_path.exists():
        return {}

    df = pd.read_csv(candidatos_path)

    # Ordenar por votos
    df = df.sort_values("TOTAL_VOTOS", ascending=False)

    ganador = df.iloc[0]
    segundo = df.iloc[1] if len(df) > 1 else None

    # Cargar métricas de participación
    participacion = _leer_metricas_participacion()
    votos_blancos = participacion["votos_blancos"]
    votos_nulos = participacion["votos_nulos"]
    votos_no_marcados = participacion["votos_no_marcados"]

    total_votos = int(df["TOTAL_VOTOS"].sum()) + votos_blancos + votos_nulos + votos_no_marcados

    return {
        "total_votos": total_votos,
        "votos_validos": int(df["TOTAL_VOTOS"].sum()),
        "votos_blancos": votos_blancos,
        "votos_nulos": votos_nulos,
        "votos_no_marcados": votos_no_marcados,
        "total_mesas": 118313,  # Valor conocido
        "total_departamentos": 33,
        "ganador": ganador["CANNOMBRE"],
        "partido_ganador": ganador["PARNOMBRE"],
        "votos_ganador": int(ganador["TOTAL_VOTOS"]),
        "porcentaje_ganador": round(ganador["PORCENTAJE"], 2),
        "segundo": segundo["CANNOMBRE"] if segundo is not None else "",
        "votos_segundo": int(segundo["TOTAL_VOTOS"]) if segundo is not None else 0,
        "diferencia": int(ganador["TOTAL_VOTOS"] - segundo["TOTAL_VOTOS"]) if segundo is not None else 0,
    }


@lru_cache(maxsize=1)
def load_candidatos_nacional() -> list[dict[str, Any]]:
    """Carga los candidatos con resultados nacionales."""
    csv_path = settings.data_dir / "nacional" / "votos_por_candidato.csv"

    if not csv_path.exists():
        return []

    df = pd.read_csv(csv_path)
    df = df.sort_values("TOTAL_VOTOS", ascending=False)

    candidatos = []
    for i, row in df.iterrows():
        candidatos.append({
            "nombre": row["CANNOMBRE"],
            "partido": row["PARNOMBRE"],
            "cedula": str(row.get("CANCEDULA", "")),
            "votos": int(row["TOTAL_VOTOS"]),
            "porcentaje": round(row["PORCENTAJE"], 2),
            "posicion": int(row.get("POSICION", len(candidatos) + 1)),
            "color": get_color_partido(row["PARNOMBRE"]),
        })

    return candidatos


@lru_cache(maxsize=1)
def load_participacion_nacional() -> dict[str, Any]:
    """Carga métricas de participación nacional."""
    metricas = _leer_metricas_participacion()
    total = metricas["total_votos"]

    return {
        **metricas,
        "porcentaje_validos": round(metricas["votos_validos"] / total * 100, 2) if total else 0,
        "porcentaje_blancos": round(metricas["votos_blancos"] / total * 100, 2) if total else 0,
        "porcentaje_nulos": round(metricas["votos_nulos"] / total * 100, 2) if total else 0,
        "porcentaje_no_marcados": round(metricas["votos_no_marcados"] / total * 100, 2) if total else 0,
    }


def _leer_metricas_participacion() -> dict[str, int]:
    """Lee votos validos, blancos, nulos y no marcados desde el CSV nacional."""
    csv_path = settings.data_dir / "nacional" / "metricas_participacion.csv"

    if not csv_path.exists():
        return {
            "total_votos": 0,
            "votos_validos": 0,
            "votos_blancos": 0,
            "votos_nulos": 0,
            "votos_no_marcados": 0,
        }

    df = pd.read_csv(csv_path)
    votos_col = "TOTAL_VOTOS" if "TOTAL_VOTOS" in df.columns else "TOTAL"

    def votos(tipo: str) -> int:
        return int(df[df["TIPO_VOTO"] == tipo][votos_col].sum())

    total = int(df[votos_col].sum())
    return {
        "total_votos": total,
        "votos_validos": votos("CANDIDATO"),
        "votos_blancos": votos("BLANCO"),
        "votos_nulos": votos("NULO"),
        "votos_no_marcados": votos("NO_MARCADO"),
    }


# ============================================================
# CARGA DE DATOS DEPARTAMENTALES
# ============================================================

@lru_cache(maxsize=1)
def load_departamentos() -> list[dict[str, Any]]:
    """Carga la lista de departamentos con resumen."""
    csv_path = settings.data_dir / "departamental" / "votos_por_candidato_depto.csv"

    if not csv_path.exists():
        return []

    df = pd.read_csv(csv_path)

    # Agrupar por departamento y obtener ganador
    departamentos = []
    for dep_code in df["DEP"].unique():
        dep_df = df[df["DEP"] == dep_code].sort_values("VOTOS", ascending=False)

        if len(dep_df) == 0:
            continue

        ganador = dep_df.iloc[0]
        segundo = dep_df.iloc[1] if len(dep_df) > 1 else None

        departamentos.append({
            "codigo": str(dep_code).zfill(2),
            "nombre": ganador["DEPNOMBRE_COMPLETO"],
            "total_votos": int(dep_df["VOTOS"].sum()),
            "ganador": ganador["CANNOMBRE"],
            "partido_ganador": ganador["PARNOMBRE"],
            "votos_ganador": int(ganador["VOTOS"]),
            "porcentaje_ganador": round(ganador["PORCENTAJE_DEPTO"], 2),
            "segundo": segundo["CANNOMBRE"] if segundo is not None else "",
            "diferencia": int(ganador["VOTOS"] - segundo["VOTOS"]) if segundo is not None else 0,
        })

    return sorted(departamentos, key=lambda x: x["codigo"])


@lru_cache(maxsize=64)
def load_departamento_detalle(codigo: str) -> dict[str, Any] | None:
    """Carga el detalle de un departamento específico."""
    csv_path = settings.data_dir / "departamental" / "votos_por_candidato_depto.csv"

    if not csv_path.exists():
        return None

    codigo_electoral = _normalizar_codigo_departamento(codigo)
    df = pd.read_csv(csv_path)
    dep_df = df[df["DEP"].astype(str).str.zfill(2) == codigo_electoral]

    if len(dep_df) == 0:
        return None

    dep_df = dep_df.sort_values("VOTOS", ascending=False)
    ganador = dep_df.iloc[0]
    segundo = dep_df.iloc[1] if len(dep_df) > 1 else None

    candidatos = []
    for _, row in dep_df.iterrows():
        candidatos.append({
            "nombre": row["CANNOMBRE"],
            "partido": row["PARNOMBRE"],
            "cedula": str(row.get("CANCEDULA", "")),
            "votos": int(row["VOTOS"]),
            "porcentaje": round(row["PORCENTAJE_DEPTO"], 2),
            "posicion": int(row["POSICION"]),
            "color": get_color_partido(row["PARNOMBRE"]),
        })

    # Contar municipios
    mun_path = settings.data_dir / "municipal" / "votos_por_candidato_mun.csv"
    total_municipios = 0
    if mun_path.exists():
        mun_df = pd.read_csv(mun_path)
        total_municipios = len(
            mun_df[mun_df["DEP"].astype(str).str.zfill(2) == codigo_electoral]["MUN"].unique()
        )

    return {
        "codigo": codigo_electoral,
        "nombre": ganador["DEPNOMBRE_COMPLETO"],
        "total_votos": int(dep_df["VOTOS"].sum()),
        "ganador": ganador["CANNOMBRE"],
        "partido_ganador": ganador["PARNOMBRE"],
        "votos_ganador": int(ganador["VOTOS"]),
        "porcentaje_ganador": round(ganador["PORCENTAJE_DEPTO"], 2),
        "segundo": segundo["CANNOMBRE"] if segundo is not None else "",
        "diferencia": int(ganador["VOTOS"] - segundo["VOTOS"]) if segundo is not None else 0,
        "candidatos": candidatos,
        "total_municipios": total_municipios,
    }


# ============================================================
# CARGA DE DATOS MUNICIPALES
# ============================================================

@lru_cache(maxsize=64)
def load_municipios_departamento(codigo_departamento: str) -> list[dict[str, Any]]:
    """Carga los municipios de un departamento."""
    csv_path = settings.data_dir / "municipal" / "votos_por_candidato_mun.csv"

    if not csv_path.exists():
        return []

    codigo_electoral = _normalizar_codigo_departamento(codigo_departamento)
    df = pd.read_csv(csv_path)
    dep_df = df[df["DEP"].astype(str).str.zfill(2) == codigo_electoral]

    if len(dep_df) == 0:
        return []

    municipios = []
    for mun_code in dep_df["MUN"].unique():
        mun_df = dep_df[dep_df["MUN"] == mun_code].sort_values("VOTOS", ascending=False)

        if len(mun_df) == 0:
            continue

        ganador = mun_df.iloc[0]

        municipios.append({
            "codigo": str(mun_code).zfill(3),
            "codigo_departamento": codigo_electoral,
            "nombre": ganador.get("MUNNOMBRE", f"Municipio {mun_code}"),
            "nombre_departamento": ganador.get("DEPNOMBRE_COMPLETO", ""),
            "total_votos": int(mun_df["VOTOS"].sum()),
            "ganador": ganador["CANNOMBRE"],
            "votos_ganador": int(ganador["VOTOS"]),
            "porcentaje_ganador": round(ganador.get("PORCENTAJE_MUN", 0), 2),
        })

    return sorted(municipios, key=lambda x: x["codigo"])


# ============================================================
# CARGA DE GEOJSON
# ============================================================

@lru_cache(maxsize=1)
def load_geojson_departamentos() -> dict[str, Any]:
    """Carga el GeoJSON simplificado de departamentos."""
    geojson_path = settings.geojson_dir / "departamentos.geojson"

    if not geojson_path.exists():
        return {"type": "FeatureCollection", "features": []}

    with open(geojson_path, encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=64)
def load_geojson_municipios(codigo_departamento: str) -> dict[str, Any]:
    """Carga el GeoJSON simplificado de municipios de un departamento."""
    # Mapeo de códigos electorales a códigos DANE
    codigo_dane = _codigo_electoral_a_dane(codigo_departamento)

    geojson_path = settings.geojson_dir / "municipios" / f"municipios_{codigo_dane}.geojson"

    if not geojson_path.exists():
        return {"type": "FeatureCollection", "features": []}

    with open(geojson_path, encoding="utf-8") as f:
        return json.load(f)


def _codigo_electoral_a_dane(codigo_electoral: str) -> str:
    """
    Convierte código electoral de la Registraduría a código DANE.

    La Registraduría usa códigos secuenciales (01-72) mientras que
    DANE usa códigos estándar (05, 08, 11, etc.).
    """
    codigo = codigo_electoral.zfill(2)
    return CODIGO_ELECTORAL_A_DANE.get(codigo, codigo)


def _normalizar_codigo_departamento(codigo: str) -> str:
    """Acepta código electoral o DANE y retorna el código electoral."""
    codigo_normalizado = codigo.zfill(2)
    return CODIGO_DANE_A_ELECTORAL.get(codigo_normalizado, codigo_normalizado)


def load_map_metadata() -> dict[str, Any]:
    """Carga metadata para inicializar el mapa."""
    return {
        "center": [-74.0, 4.5],  # Centro aproximado de Colombia
        "zoom": 5,
        "bounds": [[-82.0, -5.0], [-66.0, 13.0]],  # Bounds de Colombia
        "total_departamentos": 33,
        "total_municipios": 1122,
    }


# ============================================================
# UTILIDADES
# ============================================================

def invalidate_cache():
    """Invalida todo el cache de datos."""
    load_resumen_nacional.cache_clear()
    load_candidatos_nacional.cache_clear()
    load_participacion_nacional.cache_clear()
    load_departamentos.cache_clear()
    load_departamento_detalle.cache_clear()
    load_municipios_departamento.cache_clear()
    load_geojson_departamentos.cache_clear()
    load_geojson_municipios.cache_clear()
