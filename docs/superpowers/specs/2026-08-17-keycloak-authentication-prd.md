# PRD: Autenticación, recuperación de contraseña y cierre de sesión con Red Hat Keycloak

Date: 2026-08-17
Status: Draft

## 1. Objetivo del producto

Proporcionar un flujo seguro, consistente y reutilizable de autenticación para usuarios de la plataforma, utilizando Red Hat Keycloak como proveedor de identidad y acceso (IdP). El sistema debe permitir:

- iniciar sesión con credenciales de usuario,
- restablecer la contraseña cuando el usuario la olvida,
- cerrar sesión de forma segura y explícita,
- proteger la sesión frente a accesos no autorizados,
- mantener trazabilidad y auditoría de las acciones relacionadas con autenticación y sesión.

El objetivo es ofrecer una experiencia segura para usuarios finales y operadores, with Keycloak como sistema central de identidad, evitando lógica de autenticación duplicada en aplicaciones cliente y backend.

## 2. Alcance

### Incluye

- autenticación con usuario y contraseña en Keycloak,
- recuperación de contraseña por correo electrónico,
- flujo de cierre de sesión local y global,
- manejo de sesiones con expiración configurable,
- soporte para roles y permisos basados en grupos y claims,
- integración con frontend y backend usando tokens OIDC/OAuth2,
- registro de eventos de autenticación y renovación de sesión para auditoría.

### No incluye

- autenticación social (Google, GitHub, Microsoft, etc.) en esta fase,
- registro de usuario auto-servicio,
- MFA opcional o obligatorio más allá de la política base de Keycloak,
- SSO entre dominios externos no definidos en el alcance inicial,
- gestión completa de identidad para empleados externos o terceros.

## 3. Usuarios y actores

### 3.1 Usuario final

Un usuario que accede a la aplicación con credenciales corporativas y requiere autenticación, recuperación de contraseña y cierre de sesión.

### 3.2 Administrador de seguridad

Responsable de configurar Keycloak, clientes OAuth, roles, grupos, políticas de sesión y correos transaccionales.

### 3.3 Equipo de plataforma y desarrollo

Configura la integración con Keycloak, protege endpoints backend y asegura que el frontend maneje tokens y estados de sesión correctamente.

## 4. Objetivos de negocio

1. Reducir la complejidad operativa de la identidad en la aplicación.
2. Estandarizar la autenticación y sesiones mediante Keycloak.
3. Mejorar la seguridad mediante políticas de sesión y restablecimiento de credenciales.
4. Permitir una experiencia consistente para usuarios en web y APIs.
5. Asegurar trazabilidad y seguimientos de incidentes de seguridad.

## 5. Requisitos funcionales

### 5.1 Inicio de sesión

- El usuario debe poder iniciar sesión con correo o nombre de usuario y contraseña.
- La aplicación debe redirigir al flujo de login de Keycloak si la sesión no está activa.
- La autenticación debe validar credenciales en Keycloak usando OpenID Connect.
- El sistema debe aceptar un redirect URI configurado explícitamente por cliente.
- Si las credenciales son inválidas, la aplicación debe mostrar un mensaje claro y sin revelar demasiada información técnica.
- Si el usuario está bloqueado o deshabilitado, debe mostrar un mensaje de acceso denegado con orientación a soporte.

### 5.2 Recuperación de contraseña

- El usuario debe poder iniciar un flujo de recuperación desde la pantalla de login.
- El sistema debe enviar una URL segura o código de recuperación a la dirección de correo registrada.
- El usuario debe completar un formulario con contraseña nueva y confirmación.
- La contraseña nueva debe cumplir las políticas definidas por Keycloak.
- El flujo debe invalidar tokens antiguos relacionados con la recuperación y evitar reutilización de enlaces.
- El sistema debe registrar el evento de solicitud y finalización del restablecimiento para auditoría.

### 5.3 Cierre de sesión

- El usuario debe poder cerrar sesión desde la aplicación.
- El cierre de sesión debe invalidar el token local y la sesión de Keycloak asociada.
- La sesión debe ser destruida de forma segura, sin dejar cookies o tokens persistentes activos.
- El usuario debe ser redireccionado a la pantalla de login o a una vista pública sin acceso autenticado.
- En el caso de sesiones multitab, un logout global debe cerrar todas las sesiones activas del usuario dentro del realm.

### 5.4 Manejo de sesiones

- La sesión debe expirar en un tiempo configurable por política.
- La aplicación debe detectar sesiones expiradas y forzar re-autenticación.
- El sistema debe manejar renovación automática de tokens cuando corresponda.
- Los tokens expirados o inválidos deben invalidar la sesión activa y llevar al usuario al flujo de login.

## 6. Requisitos no funcionales

### 6.1 Seguridad

- La autenticación debe ejecutarse a través de Keycloak como fuente de verdad.
- La aplicación debe usar OAuth 2.0 / OIDC con flujo Authorization Code + PKCE.
- Los secretos del cliente deben estar protegidos y nunca expuestos en frontend.
- Las credenciales de usuario nunca deben almacenarse en la base de datos de la aplicación.
- El backend debe validar claims, roles y audience de los tokens recibidos.
- Se deben registrar eventos de login, logout, error de autenticación y restablecimiento de contraseña.

### 6.2 Disponibilidad

- El sistema debe soportar tiempos de respuesta aceptables para el login y logout.
- La aplicación debe degradar graceful si Keycloak no está disponible, mostrando un error controlado.
- La disponibilidad de Keycloak debe evaluarse bajo un SLA definido por la organización.

### 6.3 Rendimiento

- El tiempo de respuesta para login debe ser inferior a 3 segundos en condiciones normales.
- El flujo de recuperación de contraseña no debe bloquear el resto de la aplicación.
- Los tokens y sesiones deben renovarse sin afectar negativamente la experiencia del usuario.

### 6.4 Observabilidad

- La solución debe registrar eventos de:
  - login exitoso,
  - login fallido,
  - logout,
  - password reset solicitado,
  - password reset completado,
  - token expirado,
  - access denied por permisos.
- Los logs deben permitir auditoría operativa y análisis forense.

## 7. Arquitectura propuesta con Red Hat Keycloak

### 7.1 Componentes

- Frontend: aplicación web que redirige a Keycloak para login y logout.
- Backend: API que valida tokens JWT y autoriza peticiones.
- Keycloak: IdP central con realm, clientes, roles, grupos, políticas y SMTP.
- Base de datos: almacenamiento de usuarios y configuración del realm en Keycloak.
- SMTP/Email provider: para restablecimiento de contraseña.

### 7.2 Integración

- El cliente web debe configurarse como cliente OIDC público o confidencial según la arquitectura.
- El backend debe configurarse como cliente confidencial para validar tokens con JWKS o introspection.
- La autenticación se basa en Authorization Code flow con PKCE para navegador.
- El backend debe incluir validación de issuer, audience y expiración de token.
- El frontend debe almacenar tokens seguros de forma apropiada según el contexto de ejecución.

## 8. Flujos de usuario

### 8.1 Flujo de autenticación

```text
Usuario -> Frontend -> Keycloak Login
Keycloak -> Validar credenciales
Keycloak -> Generar tokens (ID token + access token + refresh token)
Frontend -> Almacenar sesión
Frontend -> Consultar backend con access token
Backend -> Validar token y autorizar acceso
```

### 8.2 Flujo de recuperación de contraseña

```text
Usuario -> Frontend -> Link "Olvidé mi contraseña"
Frontend -> Keycloak -> Solicitud de reset
Keycloak -> Enviar email con enlace o código
Usuario -> Frontend -> Completar nueva contraseña
Frontend -> Keycloak -> Validar y actualizar contraseña
Keycloak -> Confirmar éxito
Frontend -> Mostrar mensaje de confirmación
```

### 8.3 Flujo de logout

```text
Usuario -> Frontend -> Botón cerrar sesión
Frontend -> Keycloak -> Logout endpoint
Keycloak -> Invalidar sesión y tokens
Frontend -> Limpiar estado local
Frontend -> Redirigir a login o home pública
```

## 9. Reglas de negocio

1. Todos los accesos protegidos deben requerir una sesión válida en Keycloak.
2. Cada usuario debe tener una identidad única dentro del realm.
3. La recuperación de contraseña solo debe ser posible para usuarios con correo válido y activo.
4. Las sesiones sin actividad deben expirar según política.
5. Cualquier intento de acceso con token inválido debe ser rechazado por el backend.
6. La ejecución de acciones sensibles debe exigir un token vigente.
7. Los eventos de autenticación deben quedar registrados para futuras auditorías.

## 10. Criterios de aceptación

### 10.1 Autenticación

- Un usuario con credenciales válidas puede iniciar sesión correctamente.
- Un usuario con credenciales inválidas recibe mensaje claro y sin información confidencial.
- El sistema mantiene una sesión válida con expiración prudente.
- El backend rechaza accesos con tokens expirados o no válidos.

### 10.2 Recuperación de contraseña

- Un usuario con correo registrado puede solicitar recuperación de contraseña.
- El sistema envía la instrucción de restablecimiento por correo.
- Un enlace o código válido permite cambiar la contraseña.
- La nueva contraseña debe cumplir seguridad y longitud mínima.
- Un enlace vencido o ya usado no debe permitir cambios.

### 10.3 Cierre de sesión

- El usuario puede cerrar sesión desde la UI.
- Tras logout, la sesión queda invalidada en Keycloak.
- El acceso posterior a recursos protegidos requiere re-autenticación.
- El frontend elimina tokens y estado local al cerrar sesión.

### 10.4 Auditoría

- El sistema registra eventos relevantes de login, logout, y recuperación de contraseña.
- Los logs permiten identificar usuario, timestamp, origen y resultado.

## 11. Riesgos y consideraciones

- Configuración incorrecta de redirect URIs puede bloquear login o logout.
- Política insuficiente de sesión puede permitir uso prolongado de sesiones no deseadas.
- JWT mal validados pueden permitir acceso no autorizado.
- Un failure al enviar correos de recuperación puede impedir la operación.
- El logout del frontend sin invalidar Keycloak puede dejar sesiones abiertas.

## 12. Recomendaciones de implementación

- Usar Keycloak como IdP único para todos los clientes autorizados.
- Implementar PKCE en clientes web.
- Definir realm, client roles y grupos desde el inicio.
- Configurar SMTP real para recuperación de contraseña.
- Habilitar auditoría y políticas de sesión en Keycloak.
- Enviar información útil para UX, pero no datos sensibles a través del frontend.

## 13. Cierre

Este PRD define una base segura y operativa para autenticación, recuperación de contraseña y cierre de sesión con Red Hat Keycloak. El enfoque prioriza políticas de seguridad, trazabilidad, experiencia del usuario y gobernanza centralizada de identidad, evitando la proliferación de mecanismos de sesión propios en cada cliente.
