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

`GET /analyses` devuelve el historial persistido como resúmenes, sin incluir el resultado completo. `GET /packages/:id` es una consulta de solo lectura del resultado almacenado; no genera archivos. Para crear o regenerar los archivos del paquete use explícitamente `POST /packages/:id/generate`.

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
