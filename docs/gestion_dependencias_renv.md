# Gestion de dependencias R con renv

El proyecto usa `renv` para mantener una biblioteca R aislada y reproducible.
Las versiones exactas estan registradas en `renv.lock`; `DESCRIPTION` declara
los paquetes que el proyecto utiliza directamente.

## Archivos versionados

- `.Rprofile`: activa `renv` al iniciar R desde la raiz del proyecto.
- `renv.lock`: fija la version de R y de cada paquete.
- `renv/activate.R`: activa o instala `renv` cuando sea necesario.
- `renv/settings.json`: configura snapshots de tipo `explicit`.
- `DESCRIPTION`: lista las dependencias directas en `Imports`.

La biblioteca instalada en `renv/library/` es local a cada equipo y esta
excluida de Git. No debe copiarse ni versionarse.

## Preparar un entorno nuevo

Se recomienda usar la version de R registrada en `renv.lock`. Desde la raiz:

```bash
Rscript --vanilla scripts/00_setup/install_packages.R
Rscript --vanilla scripts/00_setup/verificar_dependencias.R
```

El primer comando restaura las versiones del lockfile. El segundo comprueba
que no falten paquetes y que la biblioteca este sincronizada.

La restauracion requiere acceso a los repositorios indicados en `renv.lock`.
Algunos paquetes, especialmente `arrow`, pueden requerir binarios compatibles
o herramientas de compilacion segun el sistema operativo.

## Agregar una dependencia

1. Instale el paquete dentro del entorno activo:

```r
renv::install("nombre_paquete")
```

2. Agregue el paquete a `Imports` en `DESCRIPTION`.
3. Use el paquete mediante `paquete::funcion()` o `library(paquete)`.
4. Actualice y verifique el lockfile:

```bash
Rscript --vanilla scripts/00_setup/actualizar_lockfile.R
Rscript --vanilla scripts/00_setup/verificar_dependencias.R
```

Debe incluirse en `DESCRIPTION` solo si el codigo del proyecto lo usa
directamente. Las dependencias transitivas son resueltas por `renv`.
El script genera el snapshot con los metadatos de la biblioteca instalada,
por lo que no necesita consultar CRAN para registrar un cambio local.

## Actualizar una dependencia

Las actualizaciones deben ser intencionales:

```r
renv::update("nombre_paquete")
```

Despues ejecute `actualizar_lockfile.R`, revise los cambios en `renv.lock` y
corra el pipeline afectado. Para actualizar todo el entorno puede usarse
`renv::update()`, pero el cambio y su validacion tendran mayor alcance.

## Eliminar una dependencia

1. Retire su uso del codigo.
2. Elimine la entrada de `DESCRIPTION`.
3. Ejecute:

```r
renv::remove("nombre_paquete")
renv::snapshot(type = "explicit")
```

## Comandos de diagnostico

```r
renv::status()
renv::dependencies()
renv::diagnostics()
```

Si la biblioteca difiere del lockfile, restaure el estado registrado:

```r
renv::restore()
```

Si el cambio local es deliberado y ya fue probado, actualice el lockfile:

```r
renv::snapshot(type = "explicit")
```

No use `install.packages()` como flujo normal dentro del proyecto: puede
instalar una version diferente sin registrar la decision en `renv.lock`.

Los scripts de mantenimiento se ejecutan con `--vanilla` para evitar cargar
dos veces el activador de `renv`; cada script selecciona el proyecto de forma
explicita. Los scripts del pipeline se ejecutan sin esa opcion y usan la
activacion automatica de `.Rprofile`.

## Politica del proyecto

- `DESCRIPTION` es la fuente de dependencias directas.
- `renv.lock` es la fuente de versiones reproducibles.
- Los cambios a dependencias deben incluir ambos archivos cuando corresponda.
- Antes de integrar cambios, `verificar_dependencias.R` debe terminar con
  codigo cero.
- No se versionan `renv/library/`, caches ni archivos de usuario.
