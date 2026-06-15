#!/usr/bin/env python3
"""Verifica los prerrequisitos para generar GeoJSON electorales.

La union espacial se implementara cuando existan geometrias oficiales de
departamentos y municipios en la capa Silver.
"""

from pathlib import Path


GEOMETRY_CANDIDATES = {
    "departamentos": (
        Path("data/silver/geograficos/geometrias_deptos.geojson"),
        Path("data/silver/geograficos/departamentos.geojson"),
    ),
    "municipios": (
        Path("data/silver/geograficos/geometrias_municipios.geojson"),
        Path("data/silver/geograficos/municipios.geojson"),
    ),
}

ELECTORAL_INPUTS = {
    "departamentos": Path(
        "data/gold/departamental/diferencias_primer_segundo.csv"
    ),
    "municipios": Path(
        "data/gold/municipal/votos_por_candidato_mun.parquet"
    ),
}

FUTURE_OUTPUTS = {
    "departamentos": Path(
        "data/gold/visualizaciones/mapas/geojson/colombia_deptos_votos.geojson"
    ),
    "municipios": Path(
        "data/gold/visualizaciones/mapas/geojson/colombia_municipios_votos.geojson"
    ),
}


def first_existing(paths: tuple[Path, ...]) -> Path | None:
    return next((path for path in paths if path.exists()), None)


def main() -> int:
    missing_electoral = [
        str(path) for path in ELECTORAL_INPUTS.values() if not path.exists()
    ]
    if missing_electoral:
        print("ERROR: faltan agregaciones electorales de la fase 3:")
        for path in missing_electoral:
            print(f"  - {path}")
        return 1

    geometry_inputs = {
        level: first_existing(paths)
        for level, paths in GEOMETRY_CANDIDATES.items()
    }
    missing_geometry = [
        level for level, path in geometry_inputs.items() if path is None
    ]

    if missing_geometry:
        print("GeoJSON pendiente: no hay geometrías oficiales en Silver.")
        for level in missing_geometry:
            expected = ", ".join(
                str(path) for path in GEOMETRY_CANDIDATES[level]
            )
            print(f"  - {level}: se esperaba uno de {expected}")
        print("No se generaron archivos GeoJSON vacíos.")
        return 0

    print("Las geometrías ya existen, pero la unión espacial aún no está implementada.")
    for level, source in geometry_inputs.items():
        print(f"  - {level}: {source} -> {FUTURE_OUTPUTS[level]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
