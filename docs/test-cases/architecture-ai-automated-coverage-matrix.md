# Architecture AI — matriz de cobertura automatizada

## Estado base

La suite actual contiene **26 archivos y 81 pruebas Vitest**. Ejecutar:

```powershell
& .\node_modules\.bin\vitest.cmd run --exclude '.worktrees/**' --pool=forks --maxWorkers=1 --minWorkers=1
```

## Mapeo por archivo

| Capa | Archivo | Pruebas | Casos manuales relacionados | Cobertura |
| --- | --- | ---: | --- | --- |
| API | `apps/api/src/routes.test.ts` | 15 | MAN-ANA-02, MAN-ANA-04, MAN-PKG-01/03, MAN-GOV-01/02, MAN-REG-01, MAN-INT-01/02 | Rutas, CORS, errores, regeneración |
| CLI | `apps/cli/src/commands.test.ts` | 2 | MAN-ANA-03, MAN-REG-01, MAN-PUB-02, MAN-INT-01 | Comandos y errores |
| Web | `apps/web/src/App.dom.test.tsx` | 7 | MAN-GOV-01, MAN-REG-01, MAN-PUB-01/02, MAN-WEB-01/02 | Flujo DOM y errores visibles |
| Web | `apps/web/src/DecisionReview.test.tsx` | 7 | MAN-GOV-01/02, MAN-PUB-02, MAN-INT-01 | Cliente API y acciones de revisión |
| Web | `apps/web/src/AnalysisHistory.test.tsx` | 2 | MAN-ANA-01/04, MAN-WEB-01 | Historial y nuevo análisis |
| Web | `apps/web/src/api/client.test.ts` | 1 | MAN-INT-01 | Código y mensaje del API |
| Application | `packages/application/src/analysis-service.test.ts` | 4 | MAN-ANA-02/04, MAN-INT-01 | Persistencia y errores tipados |
| Application | `packages/application/src/package-service.test.ts` | 5 | MAN-PKG-01/02/03 | Lectura/generación de paquete |
| Application | `packages/application/src/governance-service.test.ts` | 2 | MAN-GOV-01/02 | Transiciones y auditoría |
| Application | `packages/application/src/regeneration.test.ts` | 2 | MAN-GOV-03/04, MAN-REG-01, MAN-PUB-01/02 | Rechazo, cambios y regeneración |
| Artifacts | `packages/artifacts/src/package-renderer.test.ts` | 2 | MAN-PKG-01, MAN-SEC-01, MAN-INF-01, MAN-NFR-01 | Archivos y contenido estructurado |
| Domain | `packages/domain/src/schemas.test.ts` | 5 | MAN-KNW-01, MAN-SEC-01, MAN-NFR-01 | Contratos y esquemas |
| Knowledge | `packages/knowledge/src/frontmatter.test.ts` | 2 | MAN-KNW-03, MAN-KNW-05 | Frontmatter OKF |
| Knowledge | `packages/knowledge/src/git-repository.test.ts` | 2 | MAN-KNW-01/02 | Snapshot Git y revisión inválida |
| Retrieval | `packages/retrieval/src/retrieval-service.test.ts` | 2 | MAN-KNW-01/02 | Ranking y revisión de proyección |
| Orchestrator | `packages/orchestrator/src/orchestrator.test.ts` | 3 | MAN-TRC-01/02, MAN-KNW-04, MAN-SEC-01, MAN-INF-01, MAN-NFR-01 | Evidencia, conflicto y análisis de dominio |
| Orchestrator | `packages/orchestrator/src/traceability.test.ts` | 3 | MAN-TRC-01/02 | Cadena y validación de enlaces |
| Orchestrator | `packages/orchestrator/src/evidence-policy.test.ts` | 1 | MAN-KNW-01, MAN-TRC-02 | Precedencia corporativa |
| Skills | `packages/orchestrator/src/skills/design-security.test.ts` | 2 | MAN-SEC-01/02 | Evidencia y brechas de seguridad |
| Skills | `packages/orchestrator/src/skills/design-infrastructure.test.ts` | 1 | MAN-INF-01 | Control de infraestructura |
| Skills | `packages/orchestrator/src/skills/validate-nfr.test.ts` | 2 | MAN-NFR-01/02 | Métricas explícitas y revisión |
| Persistence | `packages/persistence/src/persistence.test.ts` | 2 | MAN-ANA-04, MAN-GOV-01 | Reapertura e historial |
| Governance | `packages/governance/src/review-service.test.ts` | 2 | MAN-GOV-01/02 | Estado y decisión inexistente |
| Governance | `packages/governance/src/git-workspace.test.ts` | 2 | MAN-PUB-02/03/04/05/06 | Worktree aislado y commit |
| E2E | `tests/e2e/architecture-package.test.ts` | 2 | MAN-ANA-02/04, MAN-PKG-01, MAN-TRC-01 | Vertical slice y reinicio |
| E2E | `tests/e2e/governance.test.ts` | 1 | MAN-GOV-01/02 | Revisión humana previa |

## Cobertura exclusivamente manual

- Navegación visual real, accesibilidad percibida y capturas de evidencia.
- Interoperabilidad con API y CLI en procesos separados.
- Inspección humana de diagramas Mermaid y de la branch Git publicada.
- Configuraciones temporales de conocimiento inválido o conflictivo, restauradas después de cada prueba.
- Confirmación de que las recomendaciones pendientes reciben aprobación humana antes de promoción corporativa.

## Criterio de salida

El catálogo manual debe ejecutarse por lo menos una vez por release candidato; la suite automatizada debe terminar sin fallos antes de integrar cambios.
