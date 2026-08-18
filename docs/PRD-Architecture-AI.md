# PRD: Architecture AI — Diseño y roadmap

Fecha: 2026-08-18
Autor: Equipo Architecture AI (generado por asistente)

## Resumen ejecutivo

Esta PRD describe el producto mínimo viable (MVP) y el roadmap para "Architecture AI": una solución asistida por IA que convierte PRD o historias de usuario en Architecture Packages trazables y gobernados, orientada a arquitectos de solución (aplicaciones, datos, infraestructura y seguridad). Se prioriza compatibilidad inicial con SQLite para metadata y uso de modelos on‑prem con Ollama, y soporte para modelos públicos (Gemini, Claude, OpenAI). El objetivo del MVP es entregar recomendaciones arquitectónicas con evidencia rastreable, diagramas exportables y un flujo de revisión humano‑en‑el‑bucle.

## Objetivo y alcance

Objetivo: dotar a arquitectos de solución de una herramienta que genere propuestas arquitectónicas, alternativas y decisiones verificables, con trazabilidad a la evidencia y controles de gobernanza.

Alcance MVP:
- Ingesta de requisitos (texto libre / PRD)
- Pipeline RAG básico usando embeddings (SQLite para metadata y almacenamiento local de vectores simplificado)
- Abstracción de modelos (ModelAdapter) con Ollama on‑prem y soporte para modelos públicos
- Trazabilidad: citations con file path, commit SHA y snippets
- Generación de alternativas + tabla de trade‑offs
- Export de diagramas (Mermaid/PlantUML)
- Flujo de revisión: DRAFT -> REVIEWED -> APPROVED

Fuera de alcance inicial (post‑MVP): simulaciones de coste avanzadas, solver NFR, soporte multimodal complejo y migración completa a vector DB gestionado.

## Audiencia objetivo

- Arquitectos de solución: responsables del diseño de aplicaciones, datos, infraestructura y seguridad.
- Revisores técnicos y responsables de gobernanza que validan decisiones.
- Equipos de desarrollo que consumen el Architecture Package para implementaciones.

## Restricciones y supuestos

- Modelos on‑prem: Ollama estará disponible y contendrá modelos locales para generación y embeddings.
- Modelos públicos: Gemini, Claude y OpenAI podrán usarse como fallback o para tareas no sensibles.
- Base de datos inicial: SQLite para metadatos y persistencia ligera; diseñado para migración a Postgres/pgvector o Qdrant más adelante.
- Seguridad: entradas marcadas como sensibles no se enviarás a modelos públicos por política por defecto.
- Infra: despliegue inicial en servidores locales o contenedores; opcional migración a k8s más adelante.

## Requerimientos funcionales (priorizados)

MVP (imprescindible)
1. ModelAdapter: capa de abstracción que permita llamar a Ollama y a modelos públicos, con parámetros de enrutamiento.
2. Ingesta y embeddings: script/endpoint para validar OKF frontmatter, extraer texto y generar embeddings; persistir referencia a revision (SHA).
3. Recuperación y generación RAG: búsqueda semántica sobre knowledge/ontology + generación de package con cited evidence.
4. Traceability: cada afirmación clave debe incluir citations con {file_path, commit_sha, start_line, end_line, snippet, score}.
5. Export diagramas: generar Mermaid/PlantUML y permitir descarga de PNG/SVG.
6. Workflow de revisión: estados DRAFT/REVIEWED/APPROVED, comentarios y aprobación humana.

Fase siguiente (recomendado)
7. Generación de alternativas y tabla de trade‑offs estructurada.
8. Confidence scoring y verificación cross‑model para mitigar alucinaciones.
9. CLI interactiva y wizard para captura guiada de requisitos.
10. Versionado del knowledge con diffs y pinning de revisions.

## Requerimientos no funcionales

- Seguridad: encriptación at‑rest y in‑transit; RBAC básico con roles (author, reviewer, approver, auditor).
- Privacidad: política por defecto para no enviar datos sensibles a modelos públicos; logs de uso y auditoría.
- Disponibilidad: servicio local con SLAs internos; diseño para ejecución en máquinas con Ollama.
- Rendimiento: generación inicial síncrona para análisis pequeños; tareas largas deben ejecutarse asíncronamente en worker.
- Escalabilidad: arquitectura modular para migración a Postgres+vector store y orquestación multi‑modelo.

## Casos de uso / User stories

1. Como arquitecto, quiero subir un PRD y obtener un Architecture Package con decisiones y evidencia para presentarlo a stakeholders.
2. Como revisor, quiero ver los snippets de evidencia que sustentan cada decisión y comentar inline antes de aprobar.
3. Como arquitecto, quiero comparar 3 alternativas arquitectónicas con pros/cons y estimaciones de impacto.
4. Como responsable de seguridad, quiero asegurarme de que los inputs sensibles no salgan de la infraestructura on‑prem.
5. Como desarrollador, quiero exportar un diagrama C4/mermaid para integrarlo en la documentación.

## Criterios de aceptación (MVP)

- Un análisis genera un package que incluye: decisiones, rationale, citations (archivo+SHA+snippet) y al menos 2 diagramas (component / deployment) exportables.
- Las citas enlazan a archivos existentes en knowledge/ con commit SHA y fragmento visible.
- Existe un endpoint/CLI para reindexar knowledge y regenerar embeddings.
- Modelo on‑prem Ollama puede ser seleccionado por política y usado para generación/embeddings.
- Workflow de revisión funciona con transiciones válidas y registro de comentarios.

## Arquitectura propuesta (alto nivel)

La arquitectura completa (contexto, contenedores, componentes y esquema de persistencia) está documentada con el estándar C4 en [docs/solucion/arquitectura-c4.md](solucion/arquitectura-c4.md). En resumen: una API Fastify orquesta el análisis (`ArchitectureOrchestrator`) sobre evidencia recuperada de `knowledge/`+`ontology/` (Git), usa `ModelAdapter` para enrutar a Ollama on-prem o modelos públicos, y persiste el estado operativo (análisis, decisiones, revisiones, auditoría) en SQLite; Web UI y CLI consumen esa API vía REST.

## Backlog inicial (por prioridad)

MVP (P0)
- Implementar ModelAdapter con soporte Ollama + placeholders para Gemini/Claude/OpenAI.
- Endpoint POST /analyses que acepte requirements y modelPolicy opcional.
- Script CLI/endpoint reindex (scripts/ingest_embeddings.mjs).
- Persistencia de citations en evidence_citation al generar package.
- Exporter de diagramas (mermaid/plantuml) en POST /packages/:id/generate.
- Review workflow básico (endpoints y tablas reviews).

P1
- Generación estructurada de alternativas y tabla de trade‑offs.
- Cross‑model verification orchestrator (llamadas a 2 modelos para validar facts).
- UI: Evidence viewer y diagram preview.

P2
- Confidence scoring y heurísticas anti‑alucinación.
- CLI interactive wizard para capturar requisitos.
- Integración básica con Slack/GitHub.

P3
- Preparar migración a Postgres + pgvector / Qdrant.
- Simulador de costs y constraint solver NFR.

## Riesgos y mitigaciones

Riesgo: Alucinaciones y recomendaciones sin evidencia.
- Mitigación: exigir citations en output; cross‑model verification; gate humano para aprobación.

Riesgo: Envío accidental de datos sensibles a modelos públicos.
- Mitigación: política por defecto que rehúsa envío; flags sensitivity en frontmatter; logs de bloqueo.

Riesgo: Limitaciones de rendimiento con SQLite y vectores.
- Mitigación: diseño para migración a Postgres/pgvector o Qdrant; uso de caches y límites de tamaño en queries.

Riesgo: Dependencia de Ollama y modelos locales.
- Mitigación: fallback a modelos públicos cuando policy lo permita; monitor de healthcheck y métricas.

## Roadmap y timeline (alto nivel)

Suponiendo 1 backend, 1 frontend, 1 infra, 1 arquitecto producto:
- Semana 1–2: ModelAdapter (Ollama), endpoints POST /analyses y reindex, scripts de ingest.
- Semana 3–4: Persistencia citations, export diagramas, UI básica de evidencia y revisión.
- Semana 5–6: Variants/tradeoffs, cross‑model verification, confidence scoring básico.
- Mes 3+: Integraciones, migración a Postgres/vector store y features avanzadas.

## Next steps / acciones inmediatas

1. Añadir migrations SQL para las tablas propuestas (SQLite). Puedo generar el SQL si lo deseas.
2. Implementar ModelAdapter scaffold (interfaces y ejemplos de llamadas a Ollama).
3. Crear scripts/ingest_embeddings.mjs y documentar variables de entorno para Ollama y modelos públicos.
4. Actualizar README con instrucciones de configuración de política de modelos y reindex.

---

Si todo es correcto, este documento se ha guardado en `docs/PRD-Architecture-AI.md` en la rama por defecto del repositorio. Puedo además generar las migrations SQL y el scaffold del ModelAdapter en un segundo paso — dime si quieres que los incluya ahora en la misma rama.