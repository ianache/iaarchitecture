# Descripción de la aplicación Architecture AI

## Visión general

Architecture AI es una aplicación para transformar requisitos de negocio o PRDs en un Architecture Package trazable, con decisiones documentadas y validadas contra evidencia corporativa. La idea central es convertir una necesidad funcional en un conjunto de artefactos arquitectónicos con base documental, trazabilidad y revisión humana.

La aplicación no trabaja solo con el modelo de IA. Se apoya en una base de conocimiento estructurada, en un repositorio Git y en una ontología que define los conceptos arquitectónicos relevantes. Esto permite que el sistema genere respuestas con contexto real, no con suposiciones aisladas.

## 1) Entrada: requisitos del usuario

El proceso comienza cuando un usuario introduce texto con requisitos o historias de usuario. Los ejemplos pueden ser:

- "Necesitamos login con MFA para usuarios internos"
- "Debemos implementar una API REST con trazabilidad y auditoría"
- "La solución debe cumplir NFR de disponibilidad, seguridad y observabilidad"

Ese contenido llega a la API o a la interfaz web, donde se registra como un análisis nuevo.

## 2) Base de conocimiento y evidencia

La aplicación toma esos requisitos y los compara con una colección de documentos almacenados bajo `knowledge/` y la ontología en `ontology/`.

- `knowledge/` contiene principios, estándares, patrones, anti-patrones, NFR, ADR, etc.
- `ontology/architecture-ontology.yaml` define qué significa cada concepto y cómo se relacionan entre sí.

Esto hace que la solución no genere arquitectura desde cero sin contexto. Debe apoyarse en evidencia previamente definida y aprobada por la organización.

## 3) Recuperación de contexto y análisis arquitectónico

El módulo de orquestación recibe los requisitos y consulta la evidencia disponible. A partir de ello:

- identifica drivers de arquitectura,
- detecta restricciones,
- evalúa estándares aplicables,
- busca recomendaciones internas,
- valida compatibilidad con NFRs,
- identifica riesgos y dependencias,
- genera decisiones arquitectónicas con justificación.

El elemento central es el `ArchitectureOrchestrator`, que no solo produce un resultado, sino que mantiene trazabilidad entre:

- requisito,
- driver,
- evidencia,
- recomendación,
- decisión,
- artefacto generado.

## 4) Generación del Architecture Package

Una vez analizado el caso, la app genera un package de arquitectura con múltiples artefactos, por ejemplo:

- análisis general,
- drivers de arquitectura,
- diseño de solución,
- arquitectura de datos,
- seguridad,
- infraestructura,
- riesgos y trade-offs,
- ADRs,
- diagramas,
- archivo de trazabilidad JSON.

Este paquete es la salida principal del sistema: un conjunto de documentos explicando no solo qué decisión se tomó, sino también por qué y con qué evidencia.

## 5) Revisión humana y gobernanza

La aplicación está diseñada para incluir una capa de revisión humana. No todo lo que propone la IA queda aceptado automáticamente.

Existen estados como:

- `DRAFT`
- `REVIEWED`
- `APPROVED`

y decisiones que requieren aprobación manual para ser consideradas definitivas. Esto evita que la IA convierta recomendaciones no verificadas en conocimiento corporativo.

## 6) Persistencia y estado operacional

La app usa SQLite para guardar el estado operativo del sistema:

- análisis creados,
- resultados generados,
- decisiones,
- revisiones,
- historial de cambios.

Por otra parte, Git + Markdown se usa como sistema de registro de conocimiento y evidencia. La lógica central es:

- `knowledge/` y `ontology/` = verdad documental y estructural
- SQLite = estado de ejecución y seguimiento del flujo

## 7) Interfaces del sistema

La aplicación tiene tres mecanismos de acceso:

### API

Permite programar solicitudes y obtener resultados de análisis o generación de paquetes.

### CLI

Permite ejecutar comandos desde terminal para la misma lógica de backend.

### Web UI

Permite a un usuario interactuar visualmente con el proceso: crear análisis, revisar decisiones, navegar trazabilidad y consultar auditoría.

## 8) Flujo general del sistema

El flujo típico es:

1. El usuario envía un requisito.
2. El backend crea un registro de análisis.
3. El orquestador busca evidencia relevante.
4. Se generan drivers, decisiones y recomendaciones.
5. La app crea un Architecture Package.
6. El usuario revisa y aprueba decisiones importantes.
7. El resultado queda registrado y puede exportarse o publicarse.

## 9) Diferencia clave frente a una app generativa simple

La principal característica de Architecture AI es que no responde como un asistente generalista. Tiene reglas de gobernanza:

- evidencia antes que opinión,
- trazabilidad para cada decisión,
- revisión humana para decisiones importantes,
- validación frente a estándares y principios,
- separación entre conocimiento corporativo y sugerencias generadas.

Eso convierte la aplicación en una herramienta de arquitectura empresarial y gobernanza, no solo en un generador de texto.
