# Explicación de las 4 partes principales de la aplicación

## Parte 1: Entrada y análisis de requisitos

La primera parte es la entrada del problema. El usuario aporta un PRD, una historia de usuario o un conjunto de requisitos técnicos y funcionales. Ese texto es la materia prima del sistema.

La aplicación convierte esa entrada en un “análisis” formal, creando un registro y asociándolo con una revisión de conocimiento específica. Esto es importante porque la arquitectura no se analiza sin contexto: cada análisis queda vinculado a una versión concreta del repositorio de conocimiento.

### Qué hace esta parte

- recibe el texto del usuario,
- valida que no esté vacío,
- crea un registro de análisis,
- asocia la revisión Git del conocimiento,
- prepara el contexto para el orquestador.

### Por qué es importante

Sin esta parte, la app no tendría un punto de partida ni trazabilidad. Todo análisis debe poder rastrearse a un requisito concreto, a una revisión concreta y a una evidencia concreta.

---

## Parte 2: Recuperación de evidencia y conocimiento

La segunda parte es la base intelectual del sistema. Aquí la aplicación no hace suposiciones arbitrarias; consulta la base de conocimiento corporativa.

Esta base está compuesta por:

- documentos markdown en `knowledge/`,
- estándares, principios, patrones y NFR,
- una ontología en `ontology/`.

### Qué hace esta parte

- selecciona documentos relevantes para el requisito,
- aplica filtros por metadatos,
- recupera patrones y directrices,
- identifica estándares y riesgos,
- determina qué evidencia tiene prioridad y qué conflicto existe.

### Por qué es importante

La arquitectura se valida contra evidencia. Esto evita que la IA “adivine” soluciones sin soporte documental. Además, si hay conflicto entre estándares o falta evidencia suficiente, la app lo marca explícitamente y no lo oculta.

---

## Parte 3: Orquestación y generación de decisiones

La tercera parte es el núcleo funcional: la orquestación del análisis. Aquí se ejecuta la lógica de transformación del requisito en arquitectura.

El `ArchitectureOrchestrator` toma los requisitos y la evidencia recuperada, y produce un conjunto de resultados, como:

- drivers de arquitectura,
- recomendaciones,
- decisiones técnicas,
- riesgos,
- trazabilidad,
- artefactos generados,
- diagnósticos de cumplimiento o faltantes.

### Qué hace esta parte

- relaciona requisitos con drivers,
- valida estándares y NFRs,
- genera decisiones con justificación,
- produce trazabilidad entre elementos,
- identifica si la solución está completa o si requiere revisión humana.

### Por qué es importante

Es la parte que transforma un requisito en un conjunto de decisiones arquitectónicas concretas. Es la “motor” de la aplicación: convierte texto en una propuesta técnica con evidencia y explicación.

---

## Parte 4: Persistencia, revisión y paquete final

La cuarta parte cubre la parte operativa y de gobernanza. Aquí se guarda el resultado y se valida si la propuesta puede ser considerada final.

### Persistencia

La app usa SQLite para registrar:

- análisis,
- resultados,
- decisiones,
- revisiones,
- historial de cambios,
- estado del paquete.

### Revisión humana

Las decisiones importantes no se aprueban automáticamente. Hay flujos de revisión y aprobación que permiten:

- revisar decisiones,
- pedir cambios,
- aprobar o rechazar,
- auditar la historia.

### Paquete final

Cuando el análisis está listo, se genera un Architecture Package compuesto por artefactos y documentación. Este paquete representa la salida ejecutable y revisable del sistema.

### Por qué es importante

Sin esta parte, la app produciría recomendaciones sueltas, pero no un resultado formal, trazable y gobernado. La aplicación exige que las decisiones importantes sean revisadas, no simplemente generadas.

---

## Resumen

Las 4 partes principales son:

1. Entrada de requisitos.
2. Recuperación de evidencia corporativa.
3. Orquestación y generación de decisiones arquitectónicas.
4. Persistencia, revisión humana y paquete final.

Juntas forman un ciclo completo:

requisito → evidencia → análisis → decisión → artefacto → revisión → resultado final.

Esta estructura es la que hace que la aplicación sea más que un generador de texto: es una herramienta de arquitectura basada en evidencia, trazabilidad y gobernanza.
