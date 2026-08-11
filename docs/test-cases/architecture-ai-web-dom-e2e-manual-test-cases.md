# Architecture AI — Casos manuales de prueba DOM Web end-to-end

## Objetivo

Validar en navegador el flujo completo de la Web: historial, detalle, generación, revisión humana, aprobación y publicación Git.

## Requisitos previos

- API ejecutándose en `http://127.0.0.1:3000`.
- Web ejecutándose en `http://localhost:5173`.
- Base de datos limpia o identificadores de análisis conocidos.
- Navegador con DevTools disponible.
- Para publicación, la revisión de conocimiento debe ser un commit Git válido y todas las decisiones significativas deben estar aprobadas.

## Datos de prueba

```text
Como usuario, quiero iniciar sesión con contraseña y código 2FA TOTP.

Requisitos:
- Validar la contraseña contra el proveedor de identidad.
- Validar el segundo factor mediante TOTP.
- Bloquear temporalmente la cuenta después de cinco intentos fallidos.
- Auditar todas las autenticaciones.
- Mantener alta disponibilidad.
```

Registrar: `ANALYSIS-*`, revisión, `DEC-*`, estado, branch, commit, capturas de pantalla y mensajes de error.

## Casos de prueba

### WEB-DOM-01 — Cargar historial vacío

1. Abrir `http://localhost:5173` con una base sin análisis.
2. Esperar la carga inicial.

**Esperado:** se muestra `Analysis history`, el mensaje `No analyses yet.` y el botón `New analysis`.

### WEB-DOM-02 — Crear análisis desde el formulario

1. Seleccionar `New analysis`.
2. Introducir los datos de prueba.
3. Usar `HEAD` o una revisión válida.
4. Enviar.

**Esperado:** aparece un `ANALYSIS-*`, no se muestra error CORS y el análisis queda disponible en el historial.

### WEB-DOM-03 — Mostrar estado de carga

1. Repetir la creación con DevTools Network limitado.
2. Observar la pantalla mientras responde la API.

**Esperado:** la pantalla permanece funcional, no se duplican botones ni se pierde el formulario durante la espera.

### WEB-DOM-04 — Abrir detalle del paquete

1. Seleccionar el análisis creado.

**Esperado:** se muestra `Architecture Package: ANALYSIS-*`, estado, revisión, findings, riesgos, decisiones y auditoría.

### WEB-DOM-05 — Generar paquete

1. Seleccionar `Generate package`.
2. Esperar la respuesta.

**Esperado:** el detalle se actualiza, el paquete queda disponible y la navegación no vuelve al historial inesperadamente.

### WEB-DOM-06 — Revisar una decisión

1. En `Decision review`, localizar una decisión con `Status: DRAFT`.
2. Seleccionar el botón visible `Review` en la tarjeta de la decisión.

**Esperado:** la decisión pasa a `REVIEWED`, se actualiza la vista y aparece un evento en `Governance audit`.

### WEB-DOM-07 — Aprobar una decisión revisada

1. Seleccionar `approve` sobre una decisión `REVIEWED`.

**Esperado:** pasa a `APPROVED`, se refresca el detalle y el evento queda visible en auditoría.

### WEB-DOM-08 — Bloquear publicación antes de aprobar

1. Abrir un paquete `DRAFT`, `IN_REVIEW` o `INCOMPLETE`.
2. Observar `Publish reviewed package`.

**Esperado:** el botón está deshabilitado y explica que se deben aprobar las decisiones significativas.

### WEB-DOM-09 — Publicar paquete aprobado

1. Aprobar todas las decisiones significativas.
2. Seleccionar `Publish reviewed package`.

**Esperado:** aparece confirmación con branch y commit, por ejemplo:

```text
Package published on architecture/analysis-1 at <commit>.
```

### WEB-DOM-10 — Error de publicación por estado inválido

1. Intentar publicar un paquete no aprobado mediante una respuesta API `409` con código `INVALID_PACKAGE_STATUS`.

**Esperado:** la Web muestra el código y mensaje, conserva el detalle actual y no presenta la publicación como exitosa.

### WEB-DOM-11 — Error de revisión humana

1. Intentar aprobar directamente una decisión `DRAFT`.

**Esperado:** se muestra `INVALID_REVIEW_TRANSITION`, la decisión conserva su estado y la pantalla sigue operativa.

### WEB-DOM-12 — Error de API o red

1. Detener temporalmente la API o simular una respuesta `500`.
2. Ejecutar una acción de generación, revisión o publicación.

**Esperado:** aparece un mensaje de error visible, no se borran los datos cargados y es posible volver al historial.

### WEB-DOM-13 — Volver al historial después de publicar

1. Desde el detalle publicado, seleccionar `Back`.

**Esperado:** se muestra el historial, el análisis conserva su estado y no se crea un análisis duplicado.

### WEB-DOM-14 — Persistencia después de reinicio

1. Crear/generar/revisar un análisis.
2. Reiniciar la API.
3. Recargar la Web y abrir el mismo análisis.

**Esperado:** permanecen decisiones, auditoría, trazabilidad y estado del paquete.

## Criterios de aprobación

- Todos los casos aplicables terminan en `PASS`.
- No aparecen `TypeError: Failed to fetch`, errores CORS ni pantallas en blanco.
- Los errores muestran código y mensaje del contrato API.
- La publicación solo es posible después de aprobación humana.
- La branch y el commit observados corresponden al paquete publicado.

## Registro de ejecución

| Caso | Resultado | Evidencia | Observaciones |
| --- | --- | --- | --- |
| WEB-DOM-01 | PENDIENTE |  |  |
| WEB-DOM-02 | PENDIENTE |  |  |
| WEB-DOM-03 | PENDIENTE |  |  |
| WEB-DOM-04 | PENDIENTE |  |  |
| WEB-DOM-05 | PENDIENTE |  |  |
| WEB-DOM-06 | PENDIENTE |  |  |
| WEB-DOM-07 | PENDIENTE |  |  |
| WEB-DOM-08 | PENDIENTE |  |  |
| WEB-DOM-09 | PENDIENTE |  |  |
| WEB-DOM-10 | PENDIENTE |  |  |
| WEB-DOM-11 | PENDIENTE |  |  |
| WEB-DOM-12 | PENDIENTE |  |  |
| WEB-DOM-13 | PENDIENTE |  |  |
| WEB-DOM-14 | PENDIENTE |  |  |
