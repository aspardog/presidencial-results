# Bronze → Silver: Limpieza de Datos Electorales

Este directorio contiene los scripts para transformar datos crudos (Bronze) en datos limpios y estandarizados (Silver).

## 📁 Archivos

### `limpieza_datos.R`
Script principal que consolida y limpia los datos electorales.

**Entrada:**
- `data/bronze/raw/electoral/registraduria_2026-06-15/*.csv` (33 archivos CSV)
- O `data/silver/electoral/datos_master.rds` (si Bronze no está disponible)

**Salida:**
- `data/silver/electoral/datos_master.csv`
- `data/silver/electoral/datos_master.parquet`
- `data/silver/electoral/datos_master.rds`
- `data/silver/metadata/electoral/validaciones.txt`
- `data/silver/metadata/electoral/transformaciones.log`
- `data/silver/metadata/electoral/schema.json`
- `logs/limpieza_YYYYMMDD_HHMMSS.log`

**Transformaciones aplicadas:**
1. Consolidación de 33 archivos CSV en uno solo
2. Normalización de nombres de departamentos
   - NORTE DE SAN → NORTE DE SANTANDER
   - SAN ANDRES → SAN ANDRES Y PROVIDENCIA
   - VALLE → VALLE DEL CAUCA
3. Estandarización de códigos DANE (padding con ceros)
4. Creación de columna `DEPNOMBRE_COMPLETO`
5. Creación de columna `TIPO_VOTO` (CANDIDATO, BLANCO, NULO, NO_MARCADO)
6. Creación de columna `MESA_ID` (identificador único)
7. Eliminación de espacios en blanco
8. Validación de tipos de datos

**Uso:**
```r
Rscript scripts/01_bronze_to_silver/limpieza_datos.R
```

---

### `validaciones.R`
Script de validaciones exhaustivas sobre los datos en Silver.

**Entrada:**
- `data/silver/electoral/datos_master.parquet`

**Salida:**
- `data/silver/metadata/electoral/reporte_validaciones.txt`
- Reporte en consola

**Validaciones realizadas:**
1. **Integridad:**
   - Valores nulos
   - Duplicados de MESA_ID
   - Votos negativos

2. **Códigos DANE:**
   - Formato de códigos de departamento (2 dígitos)
   - Formato de códigos de municipio (3 dígitos)
   - Número de departamentos (33 esperados)

3. **Datos electorales:**
   - Categorías de TIPO_VOTO completas
   - Distribución de votos por tipo
   - Número de candidatos

4. **Consistencia:**
   - Mesas con votos anómalos (>500 votos)
   - Relación departamento-municipio

**Uso:**
```r
Rscript scripts/01_bronze_to_silver/validaciones.R
```

---

## 🔄 Flujo de Trabajo

### Opción 1: Desde Bronze (Con archivos originales)

```bash
# 1. Colocar archivos CSV originales en:
#    data/bronze/raw/electoral/registraduria_2026-06-15/

# 2. Ejecutar limpieza
Rscript scripts/01_bronze_to_silver/limpieza_datos.R

# 3. Validar datos
Rscript scripts/01_bronze_to_silver/validaciones.R
```

### Opción 2: Desde Silver existente (Sin Bronze)

```bash
# 1. Si ya existen datos en Silver, el script puede regenerar outputs

Rscript scripts/01_bronze_to_silver/limpieza_datos.R

# 2. Validar datos
Rscript scripts/01_bronze_to_silver/validaciones.R
```

---

## 📊 Datos Generados

### Formatos disponibles en Silver:

| Formato | Tamaño | Uso recomendado |
|---------|--------|-----------------|
| **CSV** | ~174 MB | Inspección manual, compatibilidad |
| **Parquet** | ~5.5 MB | **Recomendado** - Procesamiento eficiente |
| **RDS** | ~6 MB | Trabajo en R |

**¿Cuál usar?**
- Para análisis en R: `datos_master.rds`
- Para procesamiento eficiente: `datos_master.parquet`
- Para inspección/compatibilidad: `datos_master.csv`

---

## 📋 Estructura de Datos

### Columnas originales (19):
- `DEP`, `DEPNOMBRE`, `MUN`, `MUNNOMBRE`
- `ZONA`, `PUESTO`, `PUESNOMBRE`, `MESA`
- `COMUCODIGO`, `COMUNOMBRE`
- `CORCODIGO`, `CORNOMBRE`, `CIR`
- `PAR`, `PARNOMBRE`, `CAN`, `CANCEDULA`, `CANNOMBRE`
- `VOTOS`

### Columnas agregadas (3):
- `DEPNOMBRE_COMPLETO`: Nombre completo normalizado del departamento
- `TIPO_VOTO`: Categoría de voto (CANDIDATO, BLANCO, NULO, NO_MARCADO)
- `MESA_ID`: Identificador único de mesa (formato: DEP_MUN_ZONA_PUESTO_MESA)

**Total: 22 columnas**

---

## 🔍 Calidad de Datos

### Validaciones automáticas:
- ✅ 0 valores nulos en columnas críticas
- ✅ 0 votos negativos
- ✅ 33 departamentos
- ✅ 1,036 municipios
- ✅ 118,313 mesas únicas
- ✅ 11 candidatos

### Metadata generada:
- **validaciones.txt**: Resultados de validaciones básicas
- **transformaciones.log**: Log de transformaciones aplicadas
- **schema.json**: Esquema de los datos (versión, columnas, formatos)
- **reporte_validaciones.txt**: Reporte exhaustivo de validaciones

---

## ⚠️ Notas Importantes

1. **Bronze vacío:** Si Bronze no tiene archivos CSV, el script puede trabajar desde datos existentes en Silver para regenerar outputs.

2. **Logging:** Todos los procesos generan logs en `logs/` con timestamp para trazabilidad.

3. **Idempotencia:** Los scripts son idempotentes - se pueden ejecutar múltiples veces sin problemas.

4. **Dependencias:** Requiere los paquetes de R:
   - `tidyverse`
   - `readr`
   - `stringr`
   - `arrow`

5. **Regeneración:** Si cambias la lógica de limpieza:
   - Modifica `limpieza_datos.R`
   - Re-ejecuta el script
   - Los datos en Silver se regeneran automáticamente

---

## 🚀 Próximos Pasos

Después de ejecutar estos scripts, los datos están listos para agregación en Gold:

```bash
# Desde la raiz del proyecto
Rscript scripts/02_silver_to_gold/ejecutar_todas_agregaciones.R
```

---

## 📚 Referencias

- [Medallion Architecture](../../docs/medallion-architecture-explicacion.txt)
- [Estructura del Proyecto](../../docs/estructura-proyecto.txt)
- [Diccionario de Datos Silver](../../docs/diccionarios/diccionario_silver.md)
