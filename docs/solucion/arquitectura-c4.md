# Arquitectura de Architecture AI (modelo C4)

Fecha: 2026-08-18

Este documento describe la arquitectura del sistema **Architecture AI** siguiendo el estándar [C4 Model](https://c4model.com) (Contexto → Contenedores → Componentes), sustituyendo a los antiguos `descripcion-aplicacion.md` y `explicacion-cuatro-partes.md`, cuyo contenido narrativo queda consolidado e integrado aquí.

Architecture AI convierte requisitos de negocio o PRDs en un *Architecture Package* trazable: un conjunto de decisiones arquitectónicas respaldadas por evidencia documental, sujetas a revisión humana antes de considerarse definitivas. El sistema no genera arquitectura desde cero — cada recomendación se contrasta contra una base de conocimiento corporativa (`knowledge/` + `ontology/`) versionada en Git.

---

## Nivel 1 — Diagrama de Contexto

Muestra el sistema como una caja única, sus usuarios y los sistemas externos con los que se integra.

```mermaid
C4Context
    title Contexto del sistema — Architecture AI

    Person(architect, "Arquitecto de solución", "Redacta requisitos/PRDs y compara alternativas arquitectónicas")
    Person(reviewer, "Revisor / Aprobador", "Valida decisiones y evidencia antes de aprobarlas")

    System(architectureAi, "Architecture AI", "Convierte requisitos en un Architecture Package trazable, con evidencia y gobernanza")

    System_Ext(knowledgeRepo, "Repositorio de Knowledge", "Git: principios, estándares, patrones, NFR, ADRs y ontología (knowledge/, ontology/)")
    System_Ext(ollama, "Ollama (on-prem)", "Modelos de generación y embeddings ejecutados localmente")
    System_Ext(publicModels, "Modelos públicos", "OpenAI, Gemini, Claude — usados como fallback o para tareas no sensibles")

    Rel(architect, architectureAi, "Envía requisitos, revisa alternativas", "HTTPS")
    Rel(reviewer, architectureAi, "Revisa y aprueba decisiones", "HTTPS")
    Rel(architectureAi, knowledgeRepo, "Lee evidencia versionada, publica cambios de conocimiento", "Git")
    Rel(architectureAi, ollama, "Genera texto y embeddings", "HTTP API")
    Rel(architectureAi, publicModels, "Genera texto y embeddings (si la política de sensibilidad lo permite)", "HTTPS API")
```

**Por qué importa:** el sistema nunca "adivina" arquitectura — cada respuesta depende de evidencia recuperada del repositorio de conocimiento, y el envío a modelos públicos está sujeto a política de sensibilidad de datos.

---

## Nivel 2 — Diagrama de Contenedores

Descompone Architecture AI en sus unidades desplegables.

```mermaid
C4Container
    title Contenedores — Architecture AI

    Person(architect, "Arquitecto de solución")
    Person(reviewer, "Revisor / Aprobador")

    System_Boundary(architectureAi, "Architecture AI") {
        Container(webUi, "Web UI", "React + Vite (apps/web)", "Crear análisis, revisar decisiones, navegar trazabilidad, autoría de knowledge change requests")
        Container(cli, "CLI", "Node.js + Commander (apps/cli)", "Automatización por terminal: analyze, package, review, publish, knowledge-*")
        Container(api, "API", "Node.js + Fastify (apps/api)", "Orquesta el análisis, expone REST, aplica gobernanza y trazabilidad")
        ContainerDb(sqlite, "Base de datos operativa", "SQLite (.architecture-ai/architecture-ai.sqlite)", "Estado de análisis, decisiones, revisiones, auditoría y knowledge change requests")
    }

    System_Ext(knowledgeRepo, "Repositorio de Knowledge", "Git — knowledge/ + ontology/")
    System_Ext(ollama, "Ollama (on-prem)")
    System_Ext(publicModels, "Modelos públicos (OpenAI/Gemini/Claude)")

    Rel(architect, webUi, "Usa", "HTTPS")
    Rel(reviewer, webUi, "Usa", "HTTPS")
    Rel(architect, cli, "Usa", "Terminal")

    Rel(webUi, api, "Llama", "REST/JSON")
    Rel(cli, api, "Llama", "REST/JSON")

    Rel(api, sqlite, "Lee/escribe estado operativo", "SQL")
    Rel(api, knowledgeRepo, "Lee evidencia, publica knowledge change requests", "Git / filesystem")
    Rel(api, ollama, "Genera / embebe", "HTTP")
    Rel(api, publicModels, "Genera / embebe (fallback)", "HTTPS")
```

**Nota de persistencia:** SQLite guarda el *estado de ejecución* (`analyses`, `decisions`, `reviews`, `audit_events`, `analysis_result_versions`, `knowledge_change_requests`); el repositorio Git es la *fuente de verdad documental*. Esta separación es intencional: `knowledge/` y `ontology/` nunca se mezclan con el estado transaccional.

---

## Nivel 3 — Diagrama de Componentes (contenedor API)

El contenedor **API** concentra la lógica de negocio. Sus componentes principales, organizados por *package* del monorepo:

```mermaid
C4Component
    title Componentes — contenedor API

    Container_Boundary(api, "API (Fastify)") {
        Component(routes, "HTTP Routes", "apps/api/src/app.ts", "Endpoints /analyses, /packages, /decisions, /knowledge-change-requests")

        Component(analysisSvc, "AnalysisService", "@architecture-ai/application", "Crea y regenera análisis")
        Component(governanceSvc, "GovernanceService", "@architecture-ai/application", "Transiciones review/approve/reject y auditoría de decisiones")
        Component(packageSvc, "PackageService", "@architecture-ai/application", "Genera y lee el Architecture Package")
        Component(publicationSvc, "PublicationService", "@architecture-ai/application", "Publica el package en el repositorio Git")
        Component(kcrSvc, "KnowledgeChangeRequestService", "@architecture-ai/application", "Ciclo de vida de cambios propuestos a knowledge/")

        Component(orchestrator, "ArchitectureOrchestrator", "@architecture-ai/orchestrator", "Pipeline de skills: drivers, diseño (app/datos/integración/seguridad/infra), validación NFR y estándares, trazabilidad")
        Component(retrieval, "RetrievalService", "@architecture-ai/retrieval", "Recuperación de evidencia: proyección de grafo + vectorial + full-text sobre el knowledge indexado")
        Component(modelAdapter, "ModelAdapter", "apps/api/src/services", "Abstracción sobre Ollama y modelos públicos (generate / embed / healthcheck)")

        Component(repos, "Repositories", "@architecture-ai/persistence", "AnalysisRepository, ReviewRepository, KnowledgeChangeRequestRepository sobre SQLite")
        Component(renderers, "Artifact Renderers", "@architecture-ai/artifacts", "Mermaid/PlantUML, Markdown, ADR y JSON del Architecture Package")
        Component(gitWorkspace, "LocalGitWorkspace", "@architecture-ai/governance", "Commits y branches sobre el repositorio de knowledge")
    }

    ContainerDb(sqlite, "SQLite", "Persistencia")
    System_Ext(knowledgeRepo, "Repositorio de Knowledge (Git)")
    System_Ext(ollama, "Ollama")
    System_Ext(publicModels, "Modelos públicos")

    Rel(routes, analysisSvc, "usa")
    Rel(routes, governanceSvc, "usa")
    Rel(routes, packageSvc, "usa")
    Rel(routes, publicationSvc, "usa")
    Rel(routes, kcrSvc, "usa")

    Rel(analysisSvc, orchestrator, "ejecuta análisis")
    Rel(orchestrator, retrieval, "recupera evidencia")
    Rel(retrieval, sqlite, "lee proyecciones indexadas")
    Rel(orchestrator, modelAdapter, "genera texto/embeddings")
    Rel(modelAdapter, ollama, "HTTP")
    Rel(modelAdapter, publicModels, "HTTPS")

    Rel(analysisSvc, repos, "persiste análisis")
    Rel(governanceSvc, repos, "persiste revisiones/auditoría")
    Rel(kcrSvc, repos, "persiste change requests")
    Rel(repos, sqlite, "SQL")

    Rel(packageSvc, renderers, "renderiza artefactos")
    Rel(publicationSvc, gitWorkspace, "publica package")
    Rel(kcrSvc, gitWorkspace, "publica knowledge change request")
    Rel(gitWorkspace, knowledgeRepo, "commit/push")
```

**Sobre `ArchitectureOrchestrator`:** internamente ejecuta una cadena de *skills* (`identify-drivers`, `design-application`, `design-data`, `design-integration`, `design-security`, `design-infrastructure`, `validate-nfr`, `validate-standards`, `architecture-review`) que transforman requisitos + evidencia en drivers, recomendaciones y decisiones con trazabilidad. Se representa como un único componente porque, a nivel C4, son variaciones de una misma responsabilidad (generación de decisiones), no límites de despliegue independientes.

---

## Flujo end-to-end

1. El arquitecto envía requisitos desde la Web UI o la CLI → `POST /analyses`.
2. `AnalysisService` crea el registro y delega en `ArchitectureOrchestrator`.
3. El orquestador pide evidencia a `RetrievalService` (que combina búsqueda por palabra clave, vectorial y de grafo sobre `knowledge/` indexado).
4. El orquestador ejecuta sus skills: identifica drivers, valida NFR/estándares, genera decisiones y recomendaciones citando evidencia (`file_path`, `commit_sha`, `snippet`).
5. `AnalysisService` persiste el resultado vía `Repositories` (SQLite).
6. El revisor aprueba/rechaza decisiones vía `GovernanceService` (`POST /decisions/:id/:action`), quedando auditado.
7. `PackageService` renderiza el Architecture Package (Mermaid/PlantUML, Markdown, ADRs, JSON de trazabilidad) usando `Artifact Renderers`.
8. `PublicationService` publica el package (y `KnowledgeChangeRequestService` publica cambios a `knowledge/`) en el repositorio Git vía `LocalGitWorkspace`.

---

## Mapeo con la explicación anterior ("4 partes")

La documentación previa describía el sistema en 4 partes narrativas. Su equivalencia en términos C4:

| Parte (doc. anterior)                          | Componente(s) C4 equivalentes                                      |
|-------------------------------------------------|----------------------------------------------------------------------|
| 1. Entrada y análisis de requisitos              | `HTTP Routes` + `AnalysisService`                                    |
| 2. Recuperación de evidencia y conocimiento      | `RetrievalService` + Repositorio de Knowledge (Git)                  |
| 3. Orquestación y generación de decisiones       | `ArchitectureOrchestrator` + `ModelAdapter` + Ollama/Modelos públicos |
| 4. Persistencia, revisión y paquete final        | `Repositories` (SQLite) + `GovernanceService` + `PackageService` + `PublicationService` + `Artifact Renderers` |

---

## Gobernanza y trazabilidad (por qué esta arquitectura, no un LLM genérico)

- **Evidencia antes que opinión:** toda recomendación cita evidencia (`file_path`, `commit_sha`, `start_line`, `end_line`, `snippet`, `score`); si no hay evidencia suficiente, el sistema lo marca explícitamente en vez de inventar.
- **Trazabilidad de extremo a extremo:** `ArchitectureOrchestrator` mantiene enlaces entre requisito → driver → evidencia → recomendación → decisión → artefacto.
- **Revisión humana obligatoria:** las decisiones transitan `DRAFT → REVIEWED → APPROVED` vía `GovernanceService`; ninguna decisión significativa se acepta automáticamente.
- **Separación conocimiento/estado:** `knowledge/` + `ontology/` (Git) son la verdad documental; SQLite es solo estado de ejecución — esto permite auditar y versionar el conocimiento independientemente del histórico de análisis.
- **Sensibilidad de datos:** el `ModelAdapter` enruta según política — inputs marcados como sensibles no salen hacia modelos públicos por defecto.

---

## Referencias

- Requisitos de producto y roadmap: [PRD-Architecture-AI.md](../PRD-Architecture-AI.md)
- Ontología de conceptos arquitectónicos: `ontology/architecture-ontology.yaml`
- Estándares, principios y NFR citables como evidencia: `knowledge/`
