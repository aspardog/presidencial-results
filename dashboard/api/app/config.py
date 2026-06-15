"""
Configuración del backend.
"""
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración de la aplicación."""

    # Nombre de la API
    app_name: str = "Dashboard Electoral API"
    app_version: str = "1.0.0"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Rutas de datos
    project_root: Path = Path(__file__).parent.parent.parent.parent

    @property
    def data_dir(self) -> Path:
        return self.project_root / "data" / "gold"

    @property
    def geojson_dir(self) -> Path:
        return self.project_root / "data" / "gold" / "visualizaciones" / "mapas" / "simplified"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
