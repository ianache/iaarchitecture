# Architecture AI MVP

Architecture AI convierte un PRD o historias de usuario en un Architecture Package trazable y restringido por evidencia. `knowledge/` y `ontology/` son el System of Record; SQLite solo guarda el estado operativo.

## Requisitos e instalación

- Node.js 22+
- pnpm 9+

```powershell
pnpm install
pnpm typecheck
```

## API

En una terminal:

```powershell
pnpm start:api
```

La API queda en `http://127.0.0.1:3000` y persiste en `.architecture-ai/architecture-ai.sqlite`.

Endpoints: `POST /analyses`, `GET /analyses`, `GET /analyses/:id`, `GET /packages/:id`, `POST /packages/:id/generate`, `GET /packages/:id/traceability`, `GET /packages/:id/decisions`, `POST /decisions/:id/{review|approve|reject|request-changes}` y `GET /decisions/:id/audit`.

Flujo de historial: cree un análisis con `POST /analyses`, consulte los resúmenes persistidos con `GET /analyses` y seleccione uno con `GET /packages/:id`. Esta última consulta es de solo lectura del resultado almacenado: devuelve la misma revisión, decisiones y trazabilidad después de reiniciar la aplicación contra la misma base SQLite, y no modifica los archivos ya generados. Para crear o regenerar los archivos del paquete use explícitamente `POST /packages/:id/generate`; si el análisis aún no tiene resultado, `GET /packages/:id` responde `409` con el código `PACKAGE_NOT_READY`.

Por ejemplo, la generación explícita por API es:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/packages/ANALYSIS-1/generate -ContentType application/json -Body '{"outputDirectory":".architecture-ai/packages"}'
```

For `POST /analyses` from Windows PowerShell with non-ASCII characters, send UTF-8 bytes explicitly. This avoids `FST_ERR_CTP_INVALID_CONTENT_LENGTH`:

```powershell
$body = @{ requirements = 'Login con contraseña y TOTP 2FA'; knowledgeRevision = 'HEAD' } | ConvertTo-Json -Compress
$utf8Body = [System.Text.UTF8Encoding]::new($false).GetBytes($body)
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3000/analyses -ContentType 'application/json; charset=utf-8' -Body $utf8Body
```

## CLI

Con la API ejecutándose:

```powershell
pnpm --filter @architecture-ai/cli build
node apps/cli/dist/main.js analyze --requirements "Customers submit orders" --revision HEAD
node apps/cli/dist/main.js package ANALYSIS-1 --output .architecture-ai/packages/ANALYSIS-1
node apps/cli/dist/main.js review DEC-1 --action review
node apps/cli/dist/main.js review DEC-1 --action approve
node apps/cli/dist/main.js audit DEC-1
```

La CLI usa exactamente la misma API que la web. Use `ARCHITECTURE_AI_API_URL` para cambiar la URL (también se acepta `ARCHITECTURE_AI_API`).

## Aplicación web

Con la API ejecutándose en otra terminal:

```powershell
pnpm --filter @architecture-ai/web dev
```

Abra la URL indicada por Vite, normalmente `http://localhost:5173`. La interfaz permite enviar requisitos, generar el Architecture Package, revisar decisiones, consultar auditoría y navegar la trazabilidad.

Para generar el bundle:

```powershell
pnpm --filter @architecture-ai/web build
```

## Revisión y pruebas

Una decisión significativa debe seguir `DRAFT -> REVIEWED -> APPROVED`; aprobar directamente un borrador devuelve `INVALID_REVIEW_TRANSITION`.

```powershell
node_modules\.bin\vitest.cmd run
pnpm typecheck
```

Las recomendaciones sin evidencia corporativa suficiente se mantienen como recomendaciones que requieren revisión humana; nunca se convierten silenciosamente en conocimiento aprobado.
