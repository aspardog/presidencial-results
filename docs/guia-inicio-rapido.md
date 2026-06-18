# Guia de inicio rapido

## 1. Preparar el entorno

Ejecute todos los comandos desde la raiz del proyecto.

Verifique las herramientas:

```bash
Rscript --version
python3 --version
```

Restaure y verifique las dependencias exactas registradas en `renv.lock`:

```bash
Rscript --vanilla scripts/00_setup/install_packages.R
Rscript --vanilla scripts/00_setup/verificar_dependencias.R
```

Al abrir R desde la raiz, `.Rprofile` activa automaticamente la biblioteca
privada del proyecto. Consulte
[gestion_dependencias_renv.md](gestion_dependencias_renv.md) antes de agregar
o actualizar paquetes.

## 2. Crear la estructura

```bash
Rscript scripts/00_setup/crear_estructura.R
```

El comando es idempotente: puede ejecutarse sobre la estructura existente.

## 3. Elegir punto de inicio

### Opcion A: estado actual

Silver ya existe. Puede ir directamente a las agregaciones:

```bash
Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R
Rscript scripts/02_silver_to_gold/ejecutar_fase_4.R
```

### Opcion B: reconstruccion completa

Coloque los 33 CSV originales en la ruta que lee `limpieza_datos.R`:

```text
data/bronze/raw/electoral/registraduria_2026-06-15/
```

Luego ejecute:

```bash
Rscript scripts/01_bronze_to_silver/limpieza_datos.R
Rscript scripts/01_bronze_to_silver/validaciones.R
Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R
Rscript scripts/02_silver_to_gold/ejecutar_fase_4.R
```

Si esa ruta no existe o no contiene CSV, la limpieza reutiliza el RDS Silver
existente. Esto regenera formatos y metadata, pero no constituye una
reconstruccion desde la fuente original.

## 4. Verificar resultados

Silver:

```text
data/silver/electoral/datos_master.parquet
data/silver/electoral/datos_master.rds
data/silver/electoral/datos_master.csv
```

Gold:

```text
data/gold/nacional/
data/gold/departamental/
data/gold/municipal/
data/gold/visualizaciones/dashboard/
```

Totales esperados:

- 922.214 registros Silver.
- 23.399.401 votos totales.
- 22.683.841 votos a candidatos.
- 33 departamentos.
- 1.122 claves `DEP + MUN`.
- 118.313 mesas.

## 5. Comandos individuales

```bash
Rscript scripts/02_silver_to_gold/electoral/agregacion_nacional.R
Rscript scripts/02_silver_to_gold/electoral/agregacion_departamental.R
Rscript scripts/02_silver_to_gold/electoral/agregacion_municipal.R
Rscript scripts/02_silver_to_gold/visualizaciones/preparar_dashboard.R
python3 scripts/02_silver_to_gold/visualizaciones/generar_geojson.py
```

## 6. GeoJSON

La fase de dashboard genera JSON nacionales y de participacion en
`data/gold/visualizaciones/dashboard/`. Para la verificacion de mapas se
requieren geometrias departamentales y municipales transformadas a GeoJSON en
`data/silver/geograficos/`.

El estado actual es:

- `data/silver/geograficos/geometrias_deptos.geojson`: disponible.
- `data/silver/geograficos/geometrias_municipios.geojson`: disponible.
- Generacion del GeoJSON electoral Gold desde el pipeline R: pendiente.
- Capas electorales estaticas del dashboard: disponibles.

`generar_geojson.py` valida prerequisitos y finaliza sin producir archivos
vacios. Si las geometrias existen, informa que la union espacial aun no esta
implementada en el pipeline R.

El dashboard usa insumos GeoJSON existentes bajo
`data/gold/visualizaciones/mapas/`. Para regenerar su API estatica, incluidas
las capas municipales divididas por departamento, ejecute:

```bash
cd dashboard/web
npm install
npm run build:data
npm run validate
```

La validacion comprueba los contratos nacionales y departamentales, y tambien
el matching entre los 1.122 municipios del GeoJSON DANE y los resultados
electorales. Consulte [../dashboard/README.md](../dashboard/README.md) para el
flujo completo de desarrollo y despliegue.

## 7. Solucion de problemas

`No existe el dataset Silver requerido`:

- Confirme que exista `data/silver/electoral/datos_master.parquet`.
- Si dispone de Bronze, ejecute la limpieza.

`Faltan productos Gold requeridos`:

- Ejecute primero `ejecutar_todas_agregaciones.R`.

Advertencias `sysctlbyname` de Arrow en macOS:

- En el entorno restringido pueden aparecer al detectar CPU.
- No invalidan la ejecucion si el comando termina con codigo cero.

`renv` reporta que el proyecto esta fuera de sincronizacion:

- Ejecute `Rscript --vanilla scripts/00_setup/install_packages.R` para restaurar el
  estado de `renv.lock`.
- Si el cambio fue intencional, actualice primero `DESCRIPTION` y luego ejecute
  `Rscript --vanilla scripts/00_setup/actualizar_lockfile.R`.
