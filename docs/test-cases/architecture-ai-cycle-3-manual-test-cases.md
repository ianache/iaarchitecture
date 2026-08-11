# Architecture AI — Casos de prueba manuales del Ciclo 3

## Objetivo

Validar manualmente el workspace de análisis, la generación explícita del Architecture Package, la persistencia, la trazabilidad y el flujo de gobernanza humana de Architecture AI.

## Alcance

Estos casos cubren la Web, la API, la CLI, la persistencia SQLite, la separación entre lectura y generación, la trazabilidad y las transiciones de revisión de decisiones.

## Requisitos previos

- Node.js 22+ y pnpm 9+ instalados.
- Dependencias instaladas con `pnpm install`.
- API iniciada en `http://127.0.0.1:3000`:

  ```powershell
  pnpm start:api
  ```

- Web iniciada en otra terminal:

  ```powershell
  pnpm --filter @architecture-ai/web dev
  ```

- Navegador abierto en la URL indicada por Vite, normalmente `http://localhost:5173`.
- Para las pruebas de CLI:

  ```powershell
  pnpm --filter @architecture-ai/cli build
  ```

## Datos de prueba

Usar la siguiente historia de usuario y requisitos:

```text
Como usuario, quiero iniciar sesión con usuario, contraseña y código 2FA,
para acceder de forma segura a la aplicación.

Requisitos:
- La contraseña debe validarse contra el proveedor de identidad.
- El segundo factor debe validarse mediante TOTP.
- Después de cinco intentos fallidos se debe bloquear temporalmente la cuenta.
- Todas las autenticaciones deben quedar auditadas.
- La solución debe soportar alta disponibilidad.
```

Registrar durante la ejecución:

- ID del análisis (`ANALYSIS-*`).
- Revisión de conocimiento utilizada.
- IDs de decisiones (`DEC-*`).
- Directorio de salida del paquete.
- Evidencias capturadas: respuestas HTTP, pantallas y archivos generados.

## Criterio general de aprobación

Un caso pasa cuando el resultado observado coincide con el resultado esperado y existe evidencia reproducible. Las respuestas deben conservar los códigos de error de la aplicación; no se deben considerar exitosas respuestas que solo muestran un error genérico del navegador.

## Casos de prueba

### Workspace Web e historial

#### TC-01 — Abrir la Web sin análisis

**Precondición:** no existen análisis en la base SQLite.

**Pasos:**

1. Abrir `http://localhost:5173`.
2. Esperar la carga inicial.

**Resultado esperado:** se muestra la pantalla `Analysis history` con el mensaje `No analyses yet.` y el botón `New analysis`.

#### TC-02 — Crear un análisis desde la Web

**Pasos:**

1. Seleccionar `New analysis`.
2. Introducir los datos de prueba.
3. Mantener la revisión `HEAD` o utilizar una revisión válida.
4. Enviar el formulario.

**Resultado esperado:** la API crea un análisis y devuelve un identificador `ANALYSIS-*`. El análisis aparece en el historial.

#### TC-03 — Validar los campos del historial

**Pasos:**

1. Observar la fila del análisis creado.

**Resultado esperado:** la fila muestra ID, estado, revisión de conocimiento y fecha de actualización. El estado inicial es `DRAFT`.

#### TC-04 — Validar el orden del historial

**Pasos:**

1. Crear un segundo análisis.
2. Volver o actualizar el historial.

**Resultado esperado:** el análisis actualizado más recientemente aparece primero.

#### TC-05 — Abrir el detalle de un análisis

**Pasos:**

1. Seleccionar un análisis del historial.

**Resultado esperado:** se abre la pantalla `Architecture Package: ANALYSIS-*` y se muestran el estado del paquete, la revisión de conocimiento, findings y riesgos.

#### TC-06 — Volver al historial y crear uno nuevo

**Pasos:**

1. En el detalle, seleccionar `Back`.
2. Seleccionar `New analysis`.

**Resultado esperado:** `Back` retorna al historial y `New analysis` muestra nuevamente el formulario de requisitos.

### Paquete y artefactos

#### TC-07 — Generar explícitamente el paquete

**Pasos:**

1. Abrir el detalle de un análisis.
2. Seleccionar `Generate package`.

**Resultado esperado:** la operación termina sin error y el paquete queda disponible en el directorio configurado por la aplicación.

#### TC-08 — Validar los archivos del paquete

**Resultado esperado:** el directorio generado contiene, como mínimo:

- `01-architecture-analysis.md`
- `02-architecture-drivers.md`
- `03-solution-architecture.md`
- `04-data-architecture.md`
- `05-security-architecture.md`
- `06-infrastructure-architecture.md`
- `07-compliance-report.md`
- `08-risks-tradeoffs.md`
- `09-adr/`
- `architecture-context.json`
- Diagramas C4/Mermaid generados por el renderer.

#### TC-09 — Separar lectura y generación

**Pasos:**

1. Generar el paquete y anotar la fecha de modificación de uno de sus archivos.
2. Abrir o actualizar el detalle del análisis varias veces.
3. Revisar nuevamente la fecha de modificación.

**Resultado esperado:** `GET /packages/:id` devuelve el resultado almacenado y no modifica ni regenera los archivos. La generación solo ocurre al seleccionar `Generate package` o invocar el endpoint de generación.

#### TC-10 — Generación con cuerpo inválido

**Pasos:** enviar una solicitud de generación con un cuerpo inválido, por ejemplo:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/packages/ANALYSIS-1/generate `
  -ContentType application/json `
  -Body '{"outputDirectory":123}'
```

**Resultado esperado:** la API responde `400` con `INVALID_REQUEST` y no genera archivos.

### API y persistencia

#### TC-11 — Crear análisis mediante API

```powershell
$body = @{
  requirements = "Login seguro con contraseña y autenticación 2FA TOTP"
  knowledgeRevision = "HEAD"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3000/analyses `
  -ContentType application/json `
  -Body $body
```

**Resultado esperado:** respuesta exitosa con `id`, estado y datos iniciales de trazabilidad.

#### TC-12 — Consultar historial mediante API

```powershell
Invoke-RestMethod http://127.0.0.1:3000/analyses
```

**Resultado esperado:** respuesta `{ analyses: [...] }` con resúmenes, sin incluir innecesariamente todo el `AnalysisResult`. Los resultados están ordenados por `updatedAt` descendente.

#### TC-13 — Consultar un paquete existente

```powershell
Invoke-RestMethod http://127.0.0.1:3000/packages/ANALYSIS-1
```

**Resultado esperado:** respuesta `200` con el resultado persistido, revisión, decisiones, artefactos, findings, riesgos y estado del paquete.

#### TC-14 — Consultar un análisis inexistente

```powershell
Invoke-RestMethod http://127.0.0.1:3000/packages/ANALYSIS-NOT-FOUND
```

**Resultado esperado:** respuesta `404` con código `NOT_FOUND`.

#### TC-15 — Validar análisis sin resultado

**Precondición:** disponer de un registro de análisis sin `result` mediante una base de prueba preparada.

**Pasos:**

1. Ejecutar `GET /packages/:id` sobre ese registro.

**Resultado esperado:** respuesta `409` con código `PACKAGE_NOT_READY`. La aplicación distingue este estado de un fallo de generación.

#### TC-16 — Persistencia después de reiniciar la API

**Pasos:**

1. Crear y generar un análisis.
2. Detener la API.
3. Volver a iniciar la API usando la misma base `.architecture-ai/architecture-ai.sqlite`.
4. Consultar `GET /analyses`.
5. Abrir nuevamente el análisis desde la Web.

**Resultado esperado:** el análisis permanece disponible con la misma revisión, decisiones, trazabilidad y estado del paquete.

### Trazabilidad y conocimiento corporativo

#### TC-17 — Validar la cadena de trazabilidad

```powershell
Invoke-RestMethod http://127.0.0.1:3000/packages/ANALYSIS-1/traceability
```

**Resultado esperado:** los enlaces permiten seguir la cadena:

```text
Requirement
  -> Architecture Driver
  -> Retrieved Knowledge
  -> Standard / Principle / Pattern / ADR
  -> Recommendation
  -> Architecture Decision
  -> Architecture Artifact
```

#### TC-18 — Evidencia corporativa insuficiente

**Pasos:**

1. Ejecutar un análisis con un requisito para el que el repositorio corporativo no tenga evidencia suficiente.
2. Revisar findings, decisiones y recomendaciones.

**Resultado esperado:** la salida clasifica explícitamente la propuesta como recomendación pendiente de revisión. La información paramétrica del LLM no se presenta silenciosamente como estándar o conocimiento corporativo aprobado.

### Gobernanza humana

#### TC-19 — Consultar decisiones

```powershell
Invoke-RestMethod http://127.0.0.1:3000/packages/ANALYSIS-1/decisions
```

**Resultado esperado:** se muestran las decisiones significativas y sus estados. Las decisiones nuevas comienzan en `DRAFT`.

#### TC-20 — Rechazar aprobación directa desde `DRAFT`

**Pasos:**

1. Tomar un `decisionId` real de la respuesta anterior.
2. Ejecutar:

   ```powershell
   Invoke-RestMethod `
     -Method Post `
     -Uri http://127.0.0.1:3000/decisions/DECISION_ID/approve `
     -ContentType application/json `
     -Body '{"reviewer":"human-tester"}'
   ```

**Resultado esperado:** la operación es rechazada con `INVALID_REVIEW_TRANSITION`. Una decisión `DRAFT` no puede aprobarse directamente.

#### TC-21 — Revisar y aprobar una decisión

**Pasos:**

1. Ejecutar la acción `review`:

   ```powershell
   Invoke-RestMethod `
     -Method Post `
     -Uri http://127.0.0.1:3000/decisions/DECISION_ID/review `
     -ContentType application/json `
     -Body '{"reviewer":"human-tester"}'
   ```

2. Ejecutar después la acción `approve` con el mismo `decisionId`.

**Resultado esperado:** la transición es `DRAFT -> REVIEWED -> APPROVED` y ambas acciones quedan registradas.

#### TC-22 — Rechazar o solicitar cambios

**Pasos:** desde la Web o API, ejecutar `reject` o `request-changes` sobre una decisión revisable.

**Resultado esperado:** se actualiza el estado de la decisión, se muestra el error si la operación falla y no se presenta información obsoleta como si fuera aprobada.

#### TC-23 — Consultar auditoría

```powershell
Invoke-RestMethod http://127.0.0.1:3000/decisions/DECISION_ID/audit
```

**Resultado esperado:** la respuesta contiene los eventos de revisión con decisión, revisor, acción, fecha y comentario cuando corresponda. La Web muestra el número de eventos.

### CLI y contrato compartido

#### TC-24 — Crear análisis por CLI

```powershell
node apps/cli/dist/main.js analyze `
  --requirements "Login con contraseña y 2FA TOTP" `
  --revision HEAD
```

**Resultado esperado:** la CLI devuelve el mismo tipo de identificador `ANALYSIS-*` y utiliza la misma API que la Web.

#### TC-25 — Generar paquete por CLI

```powershell
node apps/cli/dist/main.js package ANALYSIS_ID `
  --output .architecture-ai/packages/ANALYSIS_ID
```

**Resultado esperado:** se generan los mismos artefactos que mediante la Web o `POST /packages/:id/generate`.

#### TC-26 — Revisar y auditar por CLI

```powershell
node apps/cli/dist/main.js review DECISION_ID --action review
node apps/cli/dist/main.js review DECISION_ID --action approve
node apps/cli/dist/main.js audit DECISION_ID
```

**Resultado esperado:** las operaciones de CLI actualizan el mismo estado visible posteriormente en la Web y consultable por API.

### CORS y errores de interfaz

#### TC-27 — Validar CORS Web/API

**Pasos:**

1. Mantener la Web en `http://localhost:5173`.
2. Crear un análisis desde el formulario.
3. Observar la consola del navegador.

**Resultado esperado:** la solicitud a `http://127.0.0.1:3000/analyses` termina correctamente y no aparece un error de política CORS ni `TypeError: Failed to fetch`.

#### TC-28 — Mostrar errores de revisión en la Web

**Pasos:**

1. Ejecutar una acción inválida, como aprobar una decisión `DRAFT`.
2. Observar la pantalla.

**Resultado esperado:** la Web muestra el error de la API, conserva la pantalla funcional y no reemplaza los datos actuales por información inconsistente.

## Evidencias recomendadas

Para cada caso registrar:

- ID del caso y fecha.
- Commit o revisión de conocimiento utilizada.
- ID del análisis y decisión cuando aplique.
- Captura de pantalla de la Web.
- Solicitud y respuesta HTTP o salida de CLI.
- Lista de archivos generados.
- Resultado: `PASS` o `FAIL`.
- Observaciones y defectos encontrados.

## Resultado de la ejecución

| Caso | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| TC-01 | PENDIENTE |  |  |
| TC-02 | PENDIENTE |  |  |
| TC-03 | PENDIENTE |  |  |
| TC-04 | PENDIENTE |  |  |
| TC-05 | PENDIENTE |  |  |
| TC-06 | PENDIENTE |  |  |
| TC-07 | PENDIENTE |  |  |
| TC-08 | PENDIENTE |  |  |
| TC-09 | PENDIENTE |  |  |
| TC-10 | PENDIENTE |  |  |
| TC-11 | PENDIENTE |  |  |
| TC-12 | PENDIENTE |  |  |
| TC-13 | PENDIENTE |  |  |
| TC-14 | PENDIENTE |  |  |
| TC-15 | PENDIENTE |  |  |
| TC-16 | PENDIENTE |  |  |
| TC-17 | PENDIENTE |  |  |
| TC-18 | PENDIENTE |  |  |
| TC-19 | PENDIENTE |  |  |
| TC-20 | PENDIENTE |  |  |
| TC-21 | PENDIENTE |  |  |
| TC-22 | PENDIENTE |  |  |
| TC-23 | PENDIENTE |  |  |
| TC-24 | PENDIENTE |  |  |
| TC-25 | PENDIENTE |  |  |
| TC-26 | PENDIENTE |  |  |
| TC-27 | PENDIENTE |  |  |
| TC-28 | PENDIENTE |  |  |
