# Architecture AI — Fase 2: Architecture Package y gobernanza

## Contexto

La Fase 1 dejó operativo el flujo de análisis persistido: la API recibe requisitos, usa la revisión Git fijada del Knowledge Base, genera análisis determinista, guarda decisiones en SQLite y expone el flujo a CLI y Web.

La principal brecha es que el resultado todavía se consume principalmente como JSON. La siguiente fase debe convertirlo en un Architecture Package versionable y completar la gobernanza auditable sin introducir multiagentes, autenticación ni infraestructura externa.

## Objetivo

Permitir que una user story produzca un paquete físico, versionable y trazable, que pueda ser revisado y auditado por humanos mediante API, CLI y Web usando exactamente las mismas capacidades.

Flujo objetivo:

```text
User Story
  -> AnalysisService
  -> persisted AnalysisResult
  -> PackageService
  -> Architecture Package on disk
  -> Human Review
  -> Approval or Changes Requested
  -> Audit History
```

## Alcance

### 1. Servicios de aplicación

Crear una capa `packages/application` que concentre los casos de uso y evite que las rutas API contengan reglas de negocio:

- `AnalysisService`: crear y recuperar análisis persistidos.
- `PackageService`: generar paquetes desde un análisis persistido.
- `GovernanceService`: revisar, aprobar, rechazar, solicitar cambios y consultar auditoría.
- `DeterministicArchitectureModel`: mantener el modelo local determinista como implementación por defecto.

La API, CLI y Web serán adaptadores delgados. Ninguno accederá directamente al orquestador, SQLite o renderer.

### 2. Generación física del paquete

Añadir:

```text
POST /packages/:id/generate
```

Entrada:

```json
{
  "outputDirectory": ".architecture-ai/packages"
}
```

El resultado se escribirá en un directorio por análisis y contendrá como mínimo:

```text
01-architecture-analysis.md
02-architecture-drivers.md
03-solution-architecture.md
04-data-architecture.md
05-security-architecture.md
06-infrastructure-architecture.md
07-compliance-report.md
08-risks-tradeoffs.md
09-adr/*.md
architecture-context.json
diagrams/*.mmd
```

El renderer existente será reutilizado. La fuente de los archivos será únicamente el resultado persistido y el contexto con evidencia; no se volverá a ejecutar el modelo de forma implícita durante la generación.

### 3. Gobernanza y auditoría

Mantener y hacer cumplir:

```text
DRAFT -> REVIEWED -> APPROVED
```

Reglas:

- `DRAFT` no puede aprobarse directamente.
- Toda acción de revisión registra reviewer, acción, comentario y timestamp.
- `APPROVE`, `REJECT` y `REQUEST_CHANGES` actualizan la decisión persistida.
- La auditoría es append-only y se consulta mediante:

```text
GET /decisions/:id/audit
```

Las decisiones sin evidencia suficiente permanecen explícitas y no se convierten en conocimiento corporativo aprobado.

### 4. CLI

El comando `package` dejará de limitarse a leer JSON y solicitará generación física:

```powershell
node apps/cli/dist/main.js package ANALYSIS-21 --output .architecture-ai/packages
```

El comando mostrará el directorio y los archivos generados. Los errores de API producirán salida clara y código de salida distinto de cero.

### 5. Web

La interfaz añadirá:

- botón para generar el paquete;
- lista de archivos generados;
- pantalla de auditoría por decisión;
- estados visibles de carga, generación fallida, evidencia insuficiente y revisión pendiente.

La Web seguirá consumiendo únicamente la API.

## Persistencia y seguridad de alcance

- SQLite seguirá siendo estado operativo, no System of Record corporativo.
- Los paquetes locales se escribirán bajo `.architecture-ai/` por defecto.
- El Knowledge Base Git y la ontología no se modificarán automáticamente.
- Ninguna decisión se promocionará a conocimiento aprobado sin una acción humana explícita.
- No se añadirán autenticación, colaboración en tiempo real, despliegue cloud, chat libre ni edición visual de diagramas.

## Errores y contratos

Se conservarán los códigos existentes y se añadirán respuestas consistentes para generación y auditoría:

- `NOT_FOUND`: análisis o decisión inexistente.
- `PACKAGE_GENERATION_FAILED`: renderer o filesystem fallido.
- `INVALID_REVIEW_TRANSITION`: transición de gobernanza inválida.
- `INSUFFICIENT_EVIDENCE`: no existe evidencia corporativa suficiente.
- `PERSISTENCE_ERROR`: fallo de SQLite.

## Criterios de aceptación

1. Un análisis persistido puede generar todos los archivos obligatorios del Architecture Package.
2. La generación es repetible desde el mismo resultado persistido.
3. Reiniciar la API no pierde análisis, decisiones ni auditoría.
4. La CLI y la Web generan el paquete mediante la misma API.
5. La aprobación directa de un `DRAFT` sigue siendo rechazada.
6. `REVIEWED -> APPROVED` registra auditoría y actualiza la decisión persistida.
7. La Web muestra los archivos generados, trazabilidad, decisiones y auditoría.
8. Las pruebas end-to-end cubren API, CLI, Web, persistencia y errores principales.
9. El flujo sigue funcionando sin credenciales de LLM ni infraestructura externa.

## Decisión recomendada

Implementar primero la capa de servicios y el endpoint de generación, después completar CLI/Web y cerrar con pruebas de reinicio y auditoría. Esto reduce el riesgo de duplicar reglas de negocio en los clientes y convierte el resultado actual en un artefacto utilizable por equipos de arquitectura.
