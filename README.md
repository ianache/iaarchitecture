# Architecture AI MVP

Architecture AI turns a PRD or user stories into an evidence-constrained, traceable Architecture Package. Git Markdown/OKF and the ontology are the System of Record; graph and vector retrieval are derived projections.

## 1. Requisitos

- Node.js 22+
- pnpm 9+

## 2. Instalación y compilación

Desde la raíz del repositorio:

```powershell
pnpm install
pnpm typecheck
```

El corpus corporativo está en `knowledge/` y la ontología mínima en `ontology/`. Las solicitudes de análisis deben incluir una revisión Git válida.

## 3. Iniciar la API

La API se ejecuta en `http://127.0.0.1:3000`:

```powershell
pnpm typecheck
pnpm start:api
```

La terminal queda ocupada mientras el servidor está activo. Para detenerlo, presiona `Ctrl+C`.

Endpoints principales:

```text
POST /analyses
GET  /analyses/:id
GET  /packages/:id
GET  /packages/:id/traceability
GET  /packages/:id/decisions
```

Ejemplo:

```powershell
$body = @{ requirements = "Customers submit orders and publish fulfillment events"; knowledgeRevision = (git rev-parse HEAD).Trim() } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:3000/analyses -Method Post -ContentType "application/json" -Body $body
```

## 4. Ejecutar la CLI

Compilar la CLI:

```powershell
pnpm --filter @architecture-ai/cli build
```

Mostrar ayuda:

```powershell
node apps/cli/dist/main.js --help
```

Comandos disponibles:

```powershell
node apps/cli/dist/main.js analyze --requirements "Customers submit orders" --revision HEAD
node apps/cli/dist/main.js package ANALYSIS-1
node apps/cli/dist/main.js review DEC-1 --action approve
```

Estado actual: la CLI valida y muestra la solicitud en JSON; todavía no invoca automáticamente la API.

## 5. Aplicación web

Los componentes React están en `apps/web/`. Actualmente no existe un servidor Vite ni un `index.html`, por lo que la interfaz todavía no se puede abrir como aplicación web independiente.

Sí se puede validar su compilación:

```powershell
pnpm --filter @architecture-ai/web build
```

La interfaz web requiere posteriormente añadir el entrypoint Vite y el comando `start:web`.

## 6. Pruebas

```powershell
node_modules\.bin\vitest.cmd run --run --exclude ".worktrees/**"
pnpm typecheck
```

El paquete generado contiene los documentos numerados, ADRs, diagramas Mermaid y `architecture-context.json`.

Las sugerencias basadas únicamente en conocimiento del modelo se clasifican como recomendaciones que requieren revisión; nunca se convierten silenciosamente en conocimiento corporativo aprobado.
