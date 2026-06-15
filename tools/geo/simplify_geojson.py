#!/usr/bin/env python3
"""
Simplifica los GeoJSON electorales para consumo web eficiente.

Este script:
1. Reduce el tamaño de geometrías mediante simplificación topológica
2. Genera archivos separados de municipios por departamento (carga bajo demanda)
3. Preserva todas las propiedades electorales

Uso:
    python simplify_geojson.py

Requisitos:
    pip install -r requirements.txt
"""

import json
import os
from pathlib import Path

import geopandas as gpd
import pandas as pd

# Rutas
PROJECT_ROOT = Path(__file__).parent.parent.parent
GEOJSON_DIR = PROJECT_ROOT / "data" / "gold" / "visualizaciones" / "mapas" / "geojson"
OUTPUT_DIR = PROJECT_ROOT / "data" / "gold" / "visualizaciones" / "mapas" / "simplified"

# Tolerancia de simplificación (grados decimales)
# ~0.01 grados ≈ 1km en Colombia
TOLERANCE_DEPTOS = 0.005  # Más detalle para departamentos
TOLERANCE_MUNICIPIOS = 0.002  # Más detalle para municipios


def simplify_geojson(input_path: Path, output_path: Path, tolerance: float) -> dict:
    """
    Simplifica un GeoJSON y lo guarda.

    Args:
        input_path: Ruta al GeoJSON original
        output_path: Ruta de salida
        tolerance: Tolerancia de simplificación en grados

    Returns:
        dict con estadísticas de la operación
    """
    print(f"Leyendo {input_path.name}...")
    gdf = gpd.read_file(input_path)

    original_size = input_path.stat().st_size / (1024 * 1024)  # MB

    print(f"  - Features: {len(gdf)}")
    print(f"  - Tamaño original: {original_size:.1f} MB")

    # Simplificar geometrías preservando topología
    print(f"  - Simplificando con tolerancia {tolerance}...")
    gdf['geometry'] = gdf['geometry'].simplify(tolerance, preserve_topology=True)

    # Guardar
    output_path.parent.mkdir(parents=True, exist_ok=True)
    gdf.to_file(output_path, driver='GeoJSON')

    new_size = output_path.stat().st_size / (1024 * 1024)  # MB
    reduction = (1 - new_size / original_size) * 100

    print(f"  - Tamaño simplificado: {new_size:.1f} MB")
    print(f"  - Reducción: {reduction:.1f}%")

    return {
        "original_mb": round(original_size, 2),
        "simplified_mb": round(new_size, 2),
        "reduction_percent": round(reduction, 1),
        "features": len(gdf)
    }


def split_municipios_by_departamento(input_path: Path, output_dir: Path, tolerance: float) -> dict:
    """
    Divide el GeoJSON de municipios en archivos separados por departamento.
    Esto permite carga bajo demanda en el frontend.

    Args:
        input_path: Ruta al GeoJSON de municipios
        output_dir: Directorio de salida
        tolerance: Tolerancia de simplificación

    Returns:
        dict con estadísticas
    """
    print(f"\nDividiendo municipios por departamento...")
    gdf = gpd.read_file(input_path)

    # Detectar columna de código de departamento
    dep_col = None
    for col in ['dpto_ccdgo', 'DEP', 'DPTO_CCDGO', 'codigo_departamento', 'COD_DPTO']:
        if col in gdf.columns:
            dep_col = col
            break

    if dep_col is None:
        # Intentar extraer de código de municipio
        if 'mpio_cdpmp' in gdf.columns:
            gdf['DEP'] = gdf['mpio_cdpmp'].astype(str).str[:2]
            dep_col = 'DEP'
        elif 'MPIO_CDPMP' in gdf.columns:
            gdf['DEP'] = gdf['MPIO_CDPMP'].astype(str).str[:2]
            dep_col = 'DEP'
        else:
            raise ValueError("No se encontró columna de departamento en el GeoJSON")

    output_dir.mkdir(parents=True, exist_ok=True)
    stats = {"departamentos": {}}
    total_size = 0

    for dep_code in sorted(gdf[dep_col].unique()):
        # Filtrar municipios del departamento
        gdf_dep = gdf[gdf[dep_col] == dep_code].copy()

        # Simplificar
        gdf_dep['geometry'] = gdf_dep['geometry'].simplify(tolerance, preserve_topology=True)

        # Nombre del archivo
        dep_code_str = str(dep_code).zfill(2)
        output_file = output_dir / f"municipios_{dep_code_str}.geojson"

        # Guardar
        gdf_dep.to_file(output_file, driver='GeoJSON')

        file_size = output_file.stat().st_size / 1024  # KB
        total_size += file_size

        stats["departamentos"][dep_code_str] = {
            "municipios": len(gdf_dep),
            "size_kb": round(file_size, 1)
        }

        print(f"  - Departamento {dep_code_str}: {len(gdf_dep)} municipios, {file_size:.1f} KB")

    stats["total_size_mb"] = round(total_size / 1024, 2)
    stats["num_departamentos"] = len(stats["departamentos"])

    print(f"\nTotal: {stats['num_departamentos']} departamentos, {stats['total_size_mb']:.1f} MB")

    return stats


def create_departamentos_lookup(input_path: Path, output_path: Path) -> None:
    """
    Crea un JSON ligero con solo los datos (sin geometrías) de departamentos.
    Útil para lookups rápidos en el frontend.
    """
    print(f"\nCreando lookup de departamentos...")
    gdf = gpd.read_file(input_path)

    # Extraer solo propiedades (sin geometría)
    records = []
    for _, row in gdf.iterrows():
        record = {k: v for k, v in row.items() if k != 'geometry'}
        # Convertir tipos numpy a Python nativos
        record = {k: (int(v) if isinstance(v, (int, float)) and pd.notna(v) and v == int(v)
                     else float(v) if isinstance(v, float) and pd.notna(v)
                     else str(v) if pd.notna(v) else None)
                 for k, v in record.items()}
        records.append(record)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    size = output_path.stat().st_size / 1024
    print(f"  - Guardado: {output_path.name} ({size:.1f} KB)")


def main():
    print("=" * 60)
    print("SIMPLIFICACIÓN DE GEOJSON ELECTORALES")
    print("=" * 60)

    # Verificar que existen los archivos de entrada
    deptos_path = GEOJSON_DIR / "departamentos_electoral.geojson"
    municipios_path = GEOJSON_DIR / "municipios_electoral.geojson"

    if not deptos_path.exists():
        print(f"ERROR: No se encontró {deptos_path}")
        return

    if not municipios_path.exists():
        print(f"ERROR: No se encontró {municipios_path}")
        return

    print(f"\nDirectorio de entrada: {GEOJSON_DIR}")
    print(f"Directorio de salida: {OUTPUT_DIR}")

    # 1. Simplificar departamentos
    print("\n" + "-" * 40)
    print("1. DEPARTAMENTOS")
    print("-" * 40)

    deptos_stats = simplify_geojson(
        deptos_path,
        OUTPUT_DIR / "departamentos.geojson",
        TOLERANCE_DEPTOS
    )

    # Crear lookup sin geometrías
    create_departamentos_lookup(
        OUTPUT_DIR / "departamentos.geojson",
        OUTPUT_DIR / "departamentos_lookup.json"
    )

    # 2. Simplificar y dividir municipios
    print("\n" + "-" * 40)
    print("2. MUNICIPIOS (por departamento)")
    print("-" * 40)

    municipios_dir = OUTPUT_DIR / "municipios"
    municipios_stats = split_municipios_by_departamento(
        municipios_path,
        municipios_dir,
        TOLERANCE_MUNICIPIOS
    )

    # 3. Resumen final
    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"\nDepartamentos:")
    print(f"  - Original: {deptos_stats['original_mb']} MB")
    print(f"  - Simplificado: {deptos_stats['simplified_mb']} MB")
    print(f"  - Reducción: {deptos_stats['reduction_percent']}%")

    print(f"\nMunicipios (divididos por departamento):")
    print(f"  - Departamentos: {municipios_stats['num_departamentos']}")
    print(f"  - Tamaño total: {municipios_stats['total_size_mb']} MB")

    # Guardar estadísticas
    stats = {
        "departamentos": deptos_stats,
        "municipios": municipios_stats
    }

    stats_path = OUTPUT_DIR / "stats.json"
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)

    print(f"\nEstadísticas guardadas en: {stats_path}")
    print("\n¡Listo!")


if __name__ == "__main__":
    main()
