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

Endpoints: `POST /analyses`, `GET /analyses/:id`, `GET /packages/:id`, `GET /packages/:id/traceability`, `GET /packages/:id/decisions` y `POST /decisions/:id/{review|approve|reject|request-changes}`.

## CLI

Con la API ejecutándose:

```powershell
pnpm --filter @architecture-ai/cli build
node apps/cli/dist/main.js analyze --requirements "Customers submit orders" --revision HEAD
node apps/cli/dist/main.js package ANALYSIS-1
node apps/cli/dist/main.js review DEC-1 --action review
node apps/cli/dist/main.js review DEC-1 --action approve
```

La CLI usa exactamente la misma API que la web. Use `ARCHITECTURE_AI_API` para cambiar la URL.

## Aplicación web

Con la API ejecutándose en otra terminal:

```powershell
pnpm --filter @architecture-ai/web dev
```

Abra la URL indicada por Vite, normalmente `http://localhost:5173`. La interfaz permite enviar requisitos, revisar decisiones y consultar trazabilidad.

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
