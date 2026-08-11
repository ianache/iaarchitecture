# Architecture AI — Alcance del próximo ciclo

## Objetivo

Cerrar el flujo de gobernanza y publicación versionable del Architecture Package, conectando las decisiones humanas con un cambio Git revisable y una trazabilidad completa.

## Alcance recomendado

1. **Integración Git Workspace con API, CLI y Web**
   - Crear una branch aislada desde la revisión de conocimiento.
   - Escribir el Architecture Package en el workspace.
   - Generar commit y preparar la revisión/PR.
   - Exponer el estado de branch, commit y revisión en Web y CLI.

2. **Trazabilidad completa**
   - Persistir recomendaciones como entidades del contexto arquitectónico.
   - Representar explícitamente:

     ```text
     Standard / Pattern / ADR
       -> Recommendation
       -> Architecture Decision
       -> Architecture Artifact
     ```

   - Evitar que todos los requisitos compartan implícitamente la primera evidencia recuperada.

3. **Sincronización de gobernanza y paquete**
   - Recalcular el estado del paquete después de cada revisión.
   - Generar una nueva revisión cuando una decisión sea rechazada o requiera cambios.
   - Permitir que solo decisiones aprobadas sean elegibles para promoción corporativa.

4. **Errores y contratos pendientes**
   - Conflictos entre estándares.
   - Metadatos OKF inválidos.
   - Revisiones Git inválidas.
   - Evidencia insuficiente o no resoluble.
   - Enlaces de trazabilidad faltantes.
   - Generación incompleta con estado `INCOMPLETE` y explicación.

5. **Pruebas de integración Web**
   - Incorporar un harness DOM.
   - Cubrir historial → detalle → generación → revisión → retorno al historial.
   - Validar persistencia visual de errores y estados de carga.

## Fuera de este ciclo

- Integración con un proveedor LLM real.
- Ampliación de la base de conocimiento con reference architectures, risks y lessons learned.
- Persistencia productiva del Knowledge Graph y Vector Store.
- Arquitectura multi-agente.
- UI de autoría de conocimiento.
- Colaboración en tiempo real.

## Criterio de salida

Un arquitecto puede crear un análisis, revisar decisiones, generar una revisión Git aislada y seguir la cadena completa desde el requisito hasta el artefacto aprobado, usando indistintamente Web, API o CLI.
