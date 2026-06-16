# Security Policy

## Supported Versions

Este proyecto está en desarrollo activo. Solo la versión más reciente recibe actualizaciones de seguridad.

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x: |

## Reporting a Vulnerability

Si descubres una vulnerabilidad de seguridad en este proyecto, por favor repórtala de manera responsable:

1. **NO** abras un issue público con detalles de la vulnerabilidad
2. Contacta al mantenedor del repositorio por un canal privado antes de publicar detalles.
3. Incluye una descripción detallada de la vulnerabilidad
4. Proporciona pasos para reproducir el problema si es posible
5. Indica el impacto potencial

### Qué esperar

- Confirmaremos la recepción de tu reporte dentro de 48 horas
- Te mantendremos informado sobre el progreso de la solución
- Te notificaremos cuando la vulnerabilidad haya sido corregida
- Reconoceremos tu contribución (si lo deseas) en el changelog

## Buenas Prácticas de Seguridad

### Para Usuarios

1. **Nunca compartas archivos con datos sensibles**: Los archivos `.env`, `credentials.json`, o cualquier archivo con datos personales NO deben ser compartidos o subidos al repositorio.

2. **Revisa los datos de entrada**: Si trabajas con datos electorales de fuentes externas, verifica su integridad antes de procesarlos.

3. **Mantén tus dependencias sincronizadas**: usa `scripts/00_setup/install_packages.R`, `scripts/00_setup/verificar_dependencias.R` y, cuando corresponda, `scripts/00_setup/actualizar_lockfile.R` para trabajar con el estado registrado en `renv.lock`.

### Para Desarrolladores

1. **No hardcodees credenciales**: Usa variables de entorno o archivos de configuración local (que están en .gitignore).

2. **Validación de entrada**: Todos los datos externos deben ser validados antes de su procesamiento.

3. **Sanitización de datos**: Al generar visualizaciones o exportar datos, asegúrate de no exponer información sensible.

4. **Revisión de código**: Los pull requests deben ser revisados antes de ser fusionados.

## Archivos Sensibles Protegidos

El archivo `.gitignore` está configurado para prevenir el commit de:

- Archivos de configuración local (`.env`, `config.local.R`, `secrets.json`)
- Credenciales (`.httr-oauth`, `credentials.json`)
- Datos personales en archivos grandes (`.csv`, `.parquet`, `.rds`)
- Logs que puedan contener información sensible

Si detectas que algún archivo sensible fue accidentalmente commiteado, repórtalo inmediatamente.

## Alcance de Seguridad

Este proyecto procesa datos electorales públicos. Sin embargo:

- **Datos personales**: NO procesamos datos personales identificables de votantes
- **Datos agregados**: Solo trabajamos con resultados agregados a nivel de mesa electoral o superior
- **Fuentes oficiales**: Los datos deben provenir de fuentes oficiales (Registraduría Nacional)

## Dependencias y CVEs

Monitoreamos las vulnerabilidades conocidas (CVEs) en nuestras dependencias de R, Python y Node.js. Si descubres una vulnerabilidad en una dependencia, por favor:

1. Verifica si ya existe un issue en el repositorio de la dependencia
2. Repórtala siguiendo este proceso si afecta a este proyecto
3. Si es posible, propón una actualización o parche

## Historial de Seguridad

| Fecha | Descripción | Severidad | Estado |
|-------|-------------|-----------|--------|
| - | No hay vulnerabilidades reportadas | - | - |

---

Última actualización: 2026-06-16
