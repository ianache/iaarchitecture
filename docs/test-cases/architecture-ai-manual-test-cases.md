# Architecture AI — catálogo maestro de casos manuales

## Propósito

Este catálogo cubre el MVP actual: análisis basado en conocimiento corporativo, trazabilidad, paquete versionable, Seguridad, Infraestructura, NFR, gobierno humano, regeneración y publicación mediante Web, API y CLI.

Los catálogos históricos `architecture-ai-cycle-3-manual-test-cases.md` y `architecture-ai-web-dom-e2e-manual-test-cases.md` se conservan como evidencia de ciclos anteriores. Este es el índice operativo vigente.

## Preparación común

1. Instalar dependencias: `pnpm install`.
2. Iniciar API: `pnpm start:api`.
3. Iniciar Web: `pnpm --filter @architecture-ai/web dev`.
4. Compilar CLI: `pnpm --filter @architecture-ai/cli build`.
5. Usar la historia siguiente, adaptando la revisión de conocimiento a `HEAD` o a un SHA válido:

```text
Como usuario, quiero iniciar sesión con contraseña y TOTP 2FA.
La solución debe soportar 99.9% de disponibilidad, p95 menor a 200 ms,
RTO menor a 30 minutos y RPO menor a 5 minutos. Las autenticaciones deben auditarse.
```

Registrar por cada ejecución: ID `ANALYSIS-*`, SHA de conocimiento, IDs `DEC-*`, URL/resultado, archivos generados, fecha, evidencia y resultado `PASS` o `FAIL`.

## Análisis y persistencia

### MAN-ANA-01 — Crear análisis desde Web

**Pasos:** abrir `http://localhost:5173`, seleccionar **New analysis**, ingresar la historia y enviar.

**Esperado:** aparece `Architecture Package: ANALYSIS-*`; el historial contiene el nuevo análisis, su revisión y estado.

### MAN-ANA-02 — Crear análisis por API

**Pasos:** ejecutar:

```powershell
$body = @{ requirements = 'Login con contraseña y TOTP 2FA'; knowledgeRevision = 'HEAD' } | ConvertTo-Json -Compress
$utf8Body = [System.Text.UTF8Encoding]::new($false).GetBytes($body)
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/analyses -ContentType 'application/json; charset=utf-8' -Body $utf8Body
```

**Esperado:** `201` con ID, estado y cantidad de enlaces de trazabilidad.

### MAN-ANA-03 — Crear análisis por CLI

**Pasos:** ejecutar `node apps/cli/dist/main.js analyze --requirements "Login con TOTP 2FA" --revision HEAD`.

**Esperado:** devuelve el mismo contrato que la API; la Web puede abrir el ID creado.

### MAN-ANA-04 — Historial y reinicio

**Pasos:** crear dos análisis, reiniciar API y consultar `GET /analyses`.

**Esperado:** ambos persisten, están ordenados por `updatedAt` descendente y no incluyen el resultado completo en el resumen.

## Conocimiento, evidencia y trazabilidad

### MAN-KNW-01 — Evidencia corporativa aprobada

**Pasos:** analizar un requisito alineado con un estándar del repositorio `knowledge/`.

**Esperado:** la recomendación contiene IDs de evidencia, fuente y revisión Git; el estándar corporativo tiene precedencia sobre sugerencias no corporativas.

### MAN-KNW-02 — Revisión Git inválida

**Pasos:** enviar `knowledgeRevision: "does-not-exist"` por API.

**Esperado:** `400` con `{ code: "INVALID_REVISION", message }`.

### MAN-KNW-03 — Metadatos OKF inválidos

**Precondición:** usar una copia temporal del repositorio de conocimiento con frontmatter obligatorio inválido.

**Pasos:** ejecutar un análisis contra esa revisión temporal; restaurar la copia después de la prueba.

**Esperado:** `400` con `INVALID_OKF_METADATA`; no se genera ni publica paquete.

### MAN-KNW-04 — Conflicto de estándares

**Precondición:** revisión de prueba con dos estándares recuperables y `conflictsWith` recíproco.

**Esperado:** `409` con `STANDARDS_CONFLICT`, identificando el conflicto sin elegir silenciosamente un estándar.

### MAN-TRC-01 — Cadena completa de trazabilidad

**Pasos:** consultar `GET /packages/ANALYSIS_ID/traceability` y `architecture-context.json`.

**Esperado:** se puede recorrer `Requirement → Driver → Evidence/Knowledge → Recommendation → Decision → Artifact`.

### MAN-TRC-02 — Evidencia insuficiente

**Pasos:** analizar un requisito para el que no existe conocimiento corporativo coincidente.

**Esperado:** recomendación y/o control quedan en revisión humana; el modelo no se presenta como estándar aprobado y el paquete expone diagnóstico `INCOMPLETE` cuando corresponde.

## Paquete y artefactos

### MAN-PKG-01 — Generar paquete explícitamente

**Pasos:** usar **Generate package** en Web o `POST /packages/ANALYSIS_ID/generate`.

**Esperado:** se crean `01` a `08`, `09-adr/`, `architecture-context.json` y diagramas Mermaid.

### MAN-PKG-02 — Lectura sin regeneración

**Pasos:** anotar la fecha de un archivo generado; abrir repetidamente `GET /packages/ANALYSIS_ID`.

**Esperado:** la lectura devuelve el resultado persistido y no cambia archivos ni vuelve a orquestar.

### MAN-PKG-03 — Cuerpo de generación inválido

**Pasos:** enviar `{"outputDirectory":123}` a `POST /packages/ANALYSIS_ID/generate`.

**Esperado:** `400 INVALID_REQUEST`, sin archivos nuevos.

## Seguridad, Infraestructura y NFR

### MAN-SEC-01 — Control de seguridad respaldado

**Pasos:** analizar requisito MFA con estándar corporativo recuperable relacionado.

**Esperado:** `05-security-architecture.md` lista un control `VALIDATED`, requisito origen y evidencia; incluye identidad, autorización, secretos, protección de datos y auditoría como alcance.

### MAN-SEC-02 — Brecha de seguridad sin evidencia

**Pasos:** analizar un control de seguridad sin estándar coincidente.

**Esperado:** el control queda `PENDING_REVIEW`, sin evidencia, y se lista una brecha para aprobación humana.

### MAN-INF-01 — Control de infraestructura trazable

**Pasos:** analizar disponibilidad con evidencia corporativa asociada.

**Esperado:** `06-infrastructure-architecture.md` muestra control, estado, requisito y evidencia; cubre topología, resiliencia, observabilidad, escalado, backup y recuperación.

### MAN-INF-02 — Recuperación sin objetivo respaldado

**Pasos:** analizar requisitos de recuperación sin estándar coincidente.

**Esperado:** el documento muestra brecha y supuesto; no declara RTO/RPO como política aprobada.

### MAN-NFR-01 — NFR cuantificados

**Pasos:** usar la historia común y generar el paquete.

**Esperado:** `07-compliance-report.md` incluye disponibilidad `99.9 %`, latencia `200 ms`, RTO `30 minutes` y RPO `5 minutes`, con estado, requisito y evidencia cuando exista.

### MAN-NFR-02 — NFR no cuantificado

**Pasos:** analizar “el servicio debe ser altamente disponible” sin porcentaje ni evidencia.

**Esperado:** la validación queda `PENDING_REVIEW` con objetivo `Not specified`; no se inventa un umbral.

## Gobierno, regeneración y publicación

### MAN-GOV-01 — Revisar y aprobar

**Pasos:** ejecutar `review` y después `approve` para cada decisión significativa, mediante Web, API o CLI.

**Esperado:** transición `DRAFT → REVIEWED → APPROVED`; auditoría contiene ambos eventos y el paquete llega a `APPROVED` cuando todas las decisiones significativas lo están.

### MAN-GOV-02 — Aprobar directamente desde DRAFT

**Pasos:** invocar `POST /decisions/DECISION_ID/approve` sin revisar antes.

**Esperado:** `409 INVALID_REVIEW_TRANSITION`; estado y pantalla permanecen consistentes.

### MAN-GOV-03 — Solicitar cambios

**Pasos:** sobre una decisión aprobada, ejecutar `request-changes`.

**Esperado:** paquete pasa a `DRAFT`, presenta diagnóstico `Regeneration required:` y no puede publicarse.

### MAN-GOV-04 — Rechazar

**Pasos:** sobre una decisión aprobada, ejecutar `reject`.

**Esperado:** mismo bloqueo de regeneración y preservación del evento de auditoría.

### MAN-REG-01 — Regenerar después de cambios

**Pasos:** ejecutar `POST /analyses/ANALYSIS_ID/regenerate`, `node apps/cli/dist/main.js regenerate ANALYSIS_ID` o **Regenerate architecture** en Web.

**Esperado:** se conserva el resultado anterior en historial, se crea generación siguiente, las decisiones vuelven a revisión y publicación permanece bloqueada hasta aprobarlas de nuevo.

### MAN-PUB-01 — Publicación bloqueada sin aprobación

**Pasos:** intentar publicar antes de aprobar todas las decisiones.

**Esperado:** botón Web deshabilitado y API/CLI devuelven `INVALID_PACKAGE_STATUS`.

### MAN-PUB-02 — Publicar paquete aprobado

**Pasos:** aprobar decisiones, ejecutar `node apps/cli/dist/main.js publish ANALYSIS_ID` o **Publish reviewed package**.

**Esperado:** se crea branch/worktree aislado, commit de revisión y resultado con branch, commit, directorio y archivos.

### MAN-PUB-03 — Auditoría y revisión Git

**Pasos:** revisar la branch indicada por la publicación y consultar `GET /decisions/DECISION_ID/audit`.

**Esperado:** paquete y auditoría son reproducibles desde la revisión Git fijada; el checkout activo no cambia.

## API, CLI y Web

### MAN-INT-01 — Contrato de error estable

**Pasos:** provocar `INVALID_OKF_METADATA`, `INVALID_REVISION`, `STANDARDS_CONFLICT`, `INSUFFICIENT_EVIDENCE` o `TRACEABILITY_INCOMPLETE` en una configuración de prueba.

**Esperado:** API conserva `{ code, message }`; CLI y Web muestran ambos valores sin ocultar el código.

### MAN-INT-02 — CORS

**Pasos:** usar Web en `http://localhost:5173` contra API `http://127.0.0.1:3000` y crear análisis.

**Esperado:** preflight y POST funcionan sin error CORS.

### MAN-WEB-01 — Flujo visual completo

**Pasos:** historial → nuevo análisis → detalle → review → approve → publish → back.

**Esperado:** las acciones y estados visibles coinciden con API; errores no eliminan el detalle visible.

### MAN-WEB-02 — Error de red o publicación

**Pasos:** simular API no disponible o publicación `409`.

**Esperado:** aparece alerta con error; el detalle y sus decisiones siguen visibles.

### MAN-KNW-05 — Metadatos OKF inválidos

**Precondición:** crear un archivo de conocimiento con frontmatter YAML inválido (por ejemplo, sin campos obligatorios).

**Pasos:** intentar usar ese archivo en un análisis.

**Esperado:** falla con `INVALID_OKF_METADATA`.

### MAN-PUB-04 — Propuesta estándar válida y publicación

**Pasos:** crear un paquete con una propuesta de estándar válida, aprobar todas las decisiones y publicar.

**Esperado:** la publicación ocurre exitosamente en una rama Git aislada.

### MAN-PUB-05 — Prohibición de publicación sin aprobación

**Pasos:** intentar publicar un paquete cuyas decisiones aún no han sido aprobadas (`DRAFT` o `REVIEWED`).

**Esperado:** publicación rechazada, operación abortada con código de error apropiado.

### MAN-PUB-06 — Aislamiento de revisiones

**Pasos:** luego de publicar una propuesta estándar en su rama aislada, realizar un análisis usando la revisión `HEAD` de la rama principal.

**Esperado:** la nueva propuesta estándar no es devuelta ni afecta el resultado, confirmando que permanece aislada hasta ser integrada.

## Registro de ejecución

| Caso | Estado | Fecha | Evidencia | Observaciones |
| --- | --- | --- | --- | --- |
| MAN-ANA-01 a MAN-WEB-02 | PENDIENTE |  |  |  |
| MAN-KNW-05, MAN-PUB-04 a MAN-PUB-06 | PENDIENTE |  |  |  |
