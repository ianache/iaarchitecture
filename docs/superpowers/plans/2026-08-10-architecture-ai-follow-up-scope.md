# Architecture AI — Siguiente ciclo de implementación

## Objetivo

Cerrar el criterio de salida del MVP ampliado: un arquitecto puede analizar, gobernar, publicar y revisar un Architecture Package usando Web, API o CLI, con errores explicables y trazabilidad operable.

## Alcance

1. **Publicación Git desde CLI**
   - Nuevo comando `publish <analysisId>`.
   - Opciones para branch y URL de API.
   - Mostrar branch, commit, directorio y archivos publicados.
   - Reutilizar exactamente el endpoint API existente.

2. **Contratos de error y diagnósticos**
   - Código y mensaje estable para revisión Git inválida.
   - Código y mensaje estable para metadatos OKF inválidos.
   - Código y mensaje estable para conflictos de estándares.
   - Diagnóstico persistido para paquetes `INCOMPLETE`.
   - Errores CLI y Web deben conservar el código del API.

3. **Pruebas de integración Web**
   - Historial → detalle → generación → revisión → aprobación → publicación.
   - Publicación deshabilitada antes de `APPROVED`.
   - Estados de carga y errores visibles sin perder el contexto de pantalla.
   - El cliente Web sigue usando el mismo API que la CLI.

## Fuera de alcance

- Creación real de Pull Requests en GitHub/GitLab.
- Proveedor LLM real.
- Autoría de conocimiento.
- Persistencia productiva de Graph/Vector Store.
- Multi-agent y colaboración en tiempo real.

## Criterios de aceptación

- `architecture-ai publish ANALYSIS-1` invoca `/packages/ANALYSIS-1/publish` y muestra el resultado.
- Un paquete no aprobado no puede publicarse y devuelve `INVALID_PACKAGE_STATUS`.
- Un paquete `INCOMPLETE` incluye una explicación de sus deficiencias.
- Los errores estructurados se conservan en CLI y Web.
- La suite completa permanece verde.
