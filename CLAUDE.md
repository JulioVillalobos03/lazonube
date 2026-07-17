# CLAUDE.md — LazoNube | Plataforma de Invitaciones Digitales

> **Versión:** 3.1.1
> **Estado:** Especificación maestra aprobada para implementación por fases
> **Última actualización:** 2026-07-13
> **Idioma del documento:** Español
> **Idioma obligatorio del código:** Inglés

---

## 0. Propósito y autoridad de este documento

Este archivo es la **fuente maestra de verdad** del producto, la arquitectura y las reglas de negocio de la plataforma de invitaciones digitales.

Debe ser leído por cualquier persona o agente de IA antes de:

- Diseñar una vista.
- Crear o modificar una migración.
- Implementar un endpoint.
- Agregar una entidad o relación.
- Cambiar un flujo de compra.
- Crear una plantilla.
- Modificar autenticación, permisos, pagos, almacenamiento o RSVP.
- Generar pruebas.
- Proponer infraestructura.

### 0.1 Orden de precedencia

Cuando exista una contradicción, se seguirá este orden:

1. Decisiones explícitas del propietario del producto.
2. Este documento.
3. ADRs aprobados en `docs/adr/`.
4. Contratos compartidos y especificación OpenAPI vigente, cuando corresponda.
5. Documentación específica del repositorio.
6. Código existente.
7. Suposiciones del desarrollador o agente.

Un agente de IA **no debe resolver silenciosamente una contradicción estructural**. Debe conservar la compatibilidad, documentar la decisión y crear o actualizar un ADR.

### 0.2 Qué significa V1 en este documento

V1 significa la primera versión comercial lista para clientes reales. No es un prototipo visual.

La V1 debe ser:

- Segura.
- Cobráble.
- Observable.
- Recuperable ante errores.
- Compatible con todos los tipos de evento definidos.
- Utilizable en móvil.
- Capaz de operar con datos reales de invitados y pagos.

### 0.3 Niveles de entrega y significado de “completo”

El proyecto se desarrollará mediante entregas acumulativas. Ninguna fase se considera completa únicamente porque existan pantallas o código parcial.

| Nivel             | Significado                                                            | Fases requeridas |
| ----------------- | ---------------------------------------------------------------------- | ---------------- |
| `technical_alpha` | Fundaciones técnicas y primera vertical funcional en staging           | 0 y 1            |
| `commercial_beta` | Flujo comercial principal utilizable por clientes piloto               | 0 a 5            |
| `commercial_core` | Producto listo para lanzamiento público sin control de acceso avanzado | 0 a 6            |
| `v1_complete`     | Alcance completo definido para V1, incluido control de acceso          | 0 a 7            |

Reglas:

- Una fase solo puede cerrarse cuando cumple su **gate de salida**.
- No se comienza una fase dependiente con defectos críticos abiertos de la fase anterior.
- Un entregable visual sin autorización, persistencia, validación, pruebas y estados de error no está terminado.
- La `commercial_beta` puede operar con usuarios reales seleccionados, pero no sustituye la aceptación de `v1_complete`.
- El modo offline de check-in pertenece a la fase final y no debe bloquear la validación comercial del flujo principal.

---

# 1. Resumen ejecutivo

LazoNube permite crear, personalizar, pagar, publicar y administrar invitaciones digitales para diferentes tipos de eventos.

No se posicionará únicamente como un catálogo de páginas bonitas. El producto debe resolver el ciclo operativo completo de una invitación:

1. Crear el evento.
2. Elegir una plantilla.
3. Personalizarla.
4. Previsualizar antes de pagar.
5. Publicar.
6. Compartir por WhatsApp u otros medios.
7. Controlar invitados, grupos y acompañantes.
8. Recibir respuestas RSVP.
9. Asignar acceso a momentos específicos del evento.
10. Realizar check-in mediante QR en los planes que lo incluyan.
11. Consultar métricas y exportar información.

La plataforma tendrá dos líneas comerciales:

1. **Autoservicio:** el cliente configura y publica su invitación.
2. **Servicio personalizado:** el equipo diseña y configura la invitación por el cliente.

La arquitectura será un **monolito modular full-stack** construido con Nuxt, Nitro, TypeScript, Prisma ORM y PostgreSQL.

La interfaz, la API, la autenticación y las reglas de negocio vivirán en un solo repositorio. En producción podrán ejecutarse como procesos separados —servidor web, worker y tareas programadas— pero compartirán el mismo código, contratos, modelos y despliegue coordinado.

No se utilizarán microservicios en la V1.

---

# 2. Visión del producto

## 2.1 Visión

Construir una plataforma mexicana de invitaciones digitales que combine diseño, organización de invitados, confirmaciones y control de acceso en una experiencia simple, especialmente optimizada para el uso mediante WhatsApp.

## 2.2 Problema principal

Las personas organizadoras suelen distribuir información en mensajes, imágenes, hojas de cálculo y conversaciones separadas. Esto provoca:

- Invitados que no confirman.
- Acompañantes no contemplados.
- Información desactualizada.
- Dudas repetitivas.
- Errores en horarios y ubicaciones.
- Poco control sobre el aforo.
- Dificultad para saber quién recibió o abrió la invitación.
- Falta de control en accesos.

## 2.3 Propuesta de valor

> Crea una invitación elegante, compártela por WhatsApp y controla confirmaciones, acompañantes y accesos desde un solo lugar.

## 2.4 Promesa principal

> Disfruta la organización de tu evento sin perseguir confirmaciones ni perder el control de tus invitados.

---

# 3. Objetivos

## 3.1 Objetivo principal

Permitir que una persona configure, pague y publique una invitación digital funcional sin asistencia técnica, y que pueda comenzar a recibir confirmaciones en el mismo día.

## 3.2 Objetivos de producto

- Ofrecer todos los tipos de evento definidos desde la V1.
- Permitir previsualizar con datos reales antes de pagar.
- Reducir el tiempo de creación de una invitación.
- Centralizar información, invitados y RSVP.
- Manejar invitaciones por persona, pareja, familia o grupo.
- Evitar sobrepasar el número de lugares autorizados.
- Facilitar el envío manual mediante WhatsApp sin depender de WhatsApp Business API.
- Soportar varios momentos dentro de un evento.
- Permitir colaboradores o coanfitriones.
- Permitir check-in QR en el plan correspondiente.
- Ofrecer una ruta clara de autoservicio a servicio personalizado.

## 3.3 Objetivos técnicos

- Mantener interfaz y servidor dentro de una sola aplicación full-stack, sin mezclar responsabilidades.
- Exponer una API versionada bajo `/api/v1`, aun cuando sea consumida desde el mismo origen.
- Evitar cualquier acceso de componentes Vue o código de navegador a Prisma o PostgreSQL.
- Compartir tipos y validaciones mediante contratos Zod ubicados en `shared/`.
- Mantener una única fuente de verdad para reglas, precios, permisos y límites.
- Utilizar almacenamiento de objetos para archivos.
- Ejecutar tareas pesadas en un worker independiente del proceso HTTP.
- Soportar crecimiento sin migrar prematuramente a microservicios.
- Asegurar idempotencia en pagos, webhooks, jobs y operaciones críticas.
- Mantener historial de versiones de invitaciones y plantillas.
- Permitir despliegues seguros mediante pruebas, Prisma Migrate, migraciones expand-contract y feature flags.
- Poder separar la API en el futuro sin reescribir el dominio ni las rutas públicas.

## 3.4 No objetivos de la V1

- Editor libre drag and drop.
- Marketplace de diseñadores.
- Aplicación móvil nativa.
- WhatsApp Business API automática.
- Sistema de afiliados.
- Facturación fiscal automática.
- Video hospedado por la plataforma.
- Constructor de sitios web de propósito general.
- Código HTML, CSS o JavaScript arbitrario ingresado por clientes.
- Microservicios.
- Acceso directo navegador-base de datos.
- Desplegar el servidor principal exclusivamente en un runtime edge.

---

# 4. Tipos de evento disponibles desde V1

Todos los planes comerciales podrán utilizar cualquiera de estos tipos. El tipo de evento no determinará el precio.

| Clave interna | Nombre visible     | Perfil inicial                                          |
| ------------- | ------------------ | ------------------------------------------------------- |
| `wedding`     | Boda               | Pareja, ceremonia, recepción, padrinos, mesa de regalos |
| `quinceanera` | XV años            | Festejada, padres, padrinos, ceremonia, recepción       |
| `birthday`    | Cumpleaños         | Festejado, edad opcional, fiesta principal              |
| `baby_shower` | Baby shower        | Familia, nombre del bebé opcional, regalos              |
| `baptism`     | Bautizo            | Niño o niña, padres, padrinos, ceremonia y recepción    |
| `graduation`  | Graduación         | Graduado, institución, ceremonia y celebración          |
| `corporate`   | Evento corporativo | Empresa, agenda, ponentes, registro y sedes             |
| `other`       | Otro evento        | Perfil genérico configurable                            |

## 4.1 Regla fundamental de implementación

Los tipos de evento deben ser **configurables**, no ramas de código duplicadas.

Está prohibido crear lógica extensa como:

```ts
if (eventType === 'wedding') {
  // large duplicated workflow
}
```

El sistema utilizará perfiles en `event_types` para definir:

- Secciones predeterminadas.
- Etiquetas.
- Segmentos sugeridos.
- Preguntas RSVP iniciales.
- Campos opcionales.
- Compatibilidad de plantillas.

## 4.2 Secciones comunes

Las siguientes secciones podrán utilizarse en cualquier tipo de evento:

- Portada o hero.
- Cuenta regresiva.
- Mensaje principal.
- Detalles del evento.
- Momentos o segmentos.
- Ubicaciones y mapa.
- Itinerario.
- Galería.
- Código de vestimenta.
- Mesa de regalos.
- Hospedaje.
- Transporte.
- Preguntas frecuentes.
- Contacto.
- RSVP.
- Pases.

## 4.3 Requisitos de catálogo para lanzamiento

- Mínimo 12 familias visuales de plantillas.
- Cada tipo de evento debe tener al menos 6 plantillas compatibles.
- Una plantilla puede ser compatible con varios tipos.
- No se duplicará una plantilla solo para cambiar textos.
- Las miniaturas deben mostrar variantes reales por tipo de evento.

---

# 5. Posicionamiento y diferenciadores

## 5.1 Posicionamiento

La plataforma no competirá únicamente por tener música, galería, mapa o contador. Esas funciones son estándar.

Se diferenciará mediante:

1. Invitaciones por familia o grupo.
2. Lugares máximos por grupo.
3. Acceso diferente a ceremonia, recepción u otros momentos.
4. RSVP configurable por evento y por persona.
5. Mensajes preparados para WhatsApp.
6. Cambio de plantilla sin perder información.
7. Colaboradores con permisos.
8. Historial de cambios.
9. Pases QR y check-in web.
10. Configuración antes de pagar.
11. Servicio personalizado conectado al mismo sistema.

## 5.2 Principios competitivos

- El invitado no debe crear una cuenta.
- La invitación debe cargar rápidamente en un teléfono de gama media.
- Compartir debe requerir pocos pasos.
- La información principal debe entenderse sin hacer scroll excesivo.
- El cliente debe saber cuántos lugares están confirmados, no solo cuántas respuestas existen.
- El producto debe hablar de “lugares”, “familias”, “acompañantes” y “momentos del evento”, no solo de contactos.

---

# 6. Usuarios y roles

## 6.1 Roles de plataforma

| Rol             | Descripción                                               |
| --------------- | --------------------------------------------------------- |
| `customer`      | Cliente que crea y compra eventos                         |
| `super_admin`   | Acceso total a la plataforma                              |
| `content_admin` | Administra plantillas y contenido                         |
| `support_agent` | Atiende usuarios y eventos sin acceso financiero completo |
| `finance_admin` | Consulta órdenes, pagos, reembolsos y reportes            |

## 6.2 Roles dentro de un evento

| Rol                | Capacidades                                         |
| ------------------ | --------------------------------------------------- |
| `owner`            | Control total, pagos, miembros y eliminación        |
| `admin`            | Edita evento, invitación, invitados y configuración |
| `guest_manager`    | Administra grupos, invitados, RSVP y mensajes       |
| `checkin_operator` | Escanea pases y consulta acceso limitado            |
| `viewer`           | Solo lectura de métricas e invitados autorizados    |

## 6.3 Reglas de roles

- Todo evento debe tener exactamente un `owner` activo.
- El propietario puede transferir la propiedad a otro usuario verificado.
- Un evento puede tener varios colaboradores según su plan.
- Un colaborador solo verá eventos a los que pertenece.
- Un usuario administrativo de plataforma no será automáticamente miembro del evento.
- Los accesos administrativos extraordinarios deben quedar registrados en `audit_logs`.

---

# 7. Modelo comercial

## 7.1 Tipo de cobro

- Pago único por evento.
- No habrá suscripción obligatoria en la V1.
- Los precios se almacenarán en versiones inmutables.
- Ningún precio se hardcodeará en interfaz o servidor.
- Los tipos de evento estarán disponibles en todos los planes.

## 7.2 Planes iniciales recomendados

Los precios son hipótesis comerciales iniciales y podrán modificarse mediante nuevas versiones sin alterar compras anteriores.

| Plan        |   Precio inicial | Funciones principales                                        |
| ----------- | ---------------: | ------------------------------------------------------------ |
| `preview`   |           $0 MXN | Edición y vista previa con marca de agua; sin publicación    |
| `essential` |         $699 MXN | Publicación, secciones base, RSVP básico, hasta 150 lugares  |
| `organize`  |       $1,299 MXN | Grupos privados, preguntas RSVP, exportación y colaboradores |
| `control`   |       $2,499 MXN | QR, check-in, mesas, más capacidad y modo offline limitado   |
| `custom`    | Desde $3,499 MXN | Diseño y configuración asistidos; cotización individual      |

## 7.3 Matriz inicial de límites

| Capacidad                     |      Preview | Essential |        Organize |  Control |
| ----------------------------- | -----------: | --------: | --------------: | -------: |
| Publicar                      |           No |        Sí |              Sí |       Sí |
| Lugares invitados             | 20 de prueba |       150 |             500 |    1,000 |
| Grupos privados               |           No |        No |              Sí |       Sí |
| Preguntas RSVP personalizadas |            0 |         0 |              10 |       25 |
| Colaboradores adicionales     |            0 |         1 |               3 |        6 |
| Segmentos del evento          |            2 |         3 |               8 |       15 |
| Activos multimedia            |            5 |        25 |              60 |      120 |
| Almacenamiento                |        25 MB |    150 MB |          350 MB |     1 GB |
| Exportación CSV               |           No |    Básica |        Completa | Completa |
| Mesas                         |           No |        No | Opcional simple |       Sí |
| Pases QR                      |           No |        No |              No |       Sí |
| Check-in                      |           No |        No |              No |       Sí |
| Historial de versiones        |            3 |        10 |              30 |      100 |

## 7.4 Complementos

- Lugares adicionales.
- Almacenamiento adicional.
- Extensión de vigencia.
- Dominio personalizado.
- Configuración asistida.
- Carga inicial de invitados.
- Concierge de confirmaciones.
- Diseño imprimible.
- Plantilla exclusiva.

## 7.5 Entitlements

Las capacidades compradas se materializarán en `event_entitlements`.

Está prohibido condicionar funciones directamente por nombre de plan:

```ts
// Forbidden
if (event.plan === 'control') {
  // ...
}
```

Se debe consultar la capacidad:

```ts
await entitlementService.allows(event.id, 'checkin.enabled')
```

Esto permite:

- Cambiar planes sin reescribir lógica.
- Agregar complementos.
- Dar beneficios manuales.
- Mantener compras históricas.
- Hacer promociones.

---

# 8. Alcance funcional de V1

## 8.1 Catálogo y adquisición

- Landing pública.
- Catálogo filtrable por tipo, estilo, color y características.
- Vista demo de cada plantilla.
- Comparación de planes.
- Preguntas frecuentes.
- Solicitud de diseño personalizado.
- Inicio de edición sin pago.

## 8.2 Editor

- Editor basado en formularios y secciones.
- Vista previa móvil y escritorio.
- Autosave.
- Reordenamiento de secciones permitidas.
- Activar o desactivar secciones.
- Cambio de colores dentro de límites de la plantilla.
- Selección tipográfica dentro de opciones autorizadas.
- Subida de imágenes y música.
- Cambio de plantilla sin perder contenido compatible.
- Historial de versiones.
- Publicación y pausa.

## 8.3 Eventos

- Todos los tipos definidos.
- Uno o varios segmentos.
- Fechas, zonas horarias y ubicaciones.
- Acceso diferenciado por grupo.
- Colaboradores.
- Configuración de expiración.

## 8.4 Invitados y RSVP

- Invitados individuales.
- Parejas, familias y grupos.
- Lugares máximos.
- Adultos y menores.
- Respuestas por grupo o persona.
- Preguntas configurables.
- Restricciones alimentarias opcionales.
- Edición de respuesta hasta fecha límite.
- Exportación.
- Métricas.

## 8.5 WhatsApp asistido

- Generación de mensaje por grupo.
- Botón `wa.me` o equivalente.
- Mensajes para invitación inicial, recordatorio y agradecimiento.
- Copiar enlace.
- Registro manual de `sent_at`.
- Sin envío automático desde la plataforma en V1.

## 8.6 Pagos

- Mercado Pago Checkout Pro.
- Webhooks firmados.
- Órdenes y pagos idempotentes.
- Activación automática.
- Reintento seguro de conciliación.
- Reembolsos administrados.

## 8.7 QR y check-in

Disponible únicamente cuando los entitlements lo permitan:

- Pase QR por grupo o persona.
- Acceso por segmento.
- Estados activo, revocado y usado.
- Escáner web móvil.
- Búsqueda manual de invitados.
- Registro de operador y dispositivo.
- Detección de duplicados.
- Modo offline limitado mediante manifiesto descargado previamente.

## 8.8 Administración de plataforma

- Dashboard.
- Usuarios.
- Eventos.
- Plantillas y versiones.
- Tipos de evento.
- Planes, versiones y características.
- Órdenes y pagos.
- Solicitudes personalizadas.
- Archivos rechazados.
- Auditoría.
- Soporte.
- Métricas de conversión y operación.

---

# 9. Flujos principales

## 9.1 Flujo de autoservicio

```text
Visitante
  → Explora plantillas
  → Selecciona tipo de evento y plantilla
  → Crea borrador temporal
  → Introduce datos básicos
  → Sube una imagen
  → Ve una vista previa real
  → Se registra o inicia sesión
  → Continúa editando
  → Selecciona plan
  → Servidor crea orden
  → Mercado Pago procesa el pago
  → Webhook verificado confirma el pago
  → Worker aplica entitlements
  → Cliente publica
  → Comparte enlace general o enlaces por grupo
  → Invitados responden RSVP
  → Cliente consulta métricas
```

## 9.2 Flujo de invitación personalizada

```text
Visitante
  → Envía solicitud personalizada
  → Soporte revisa requerimientos
  → Se genera cotización
  → Cliente acepta
  → Paga anticipo configurable
  → Diseñador configura una plantilla exclusiva o adaptación
  → Cliente revisa versiones
  → Cliente aprueba
  → Paga saldo pendiente
  → Invitación se publica
```

Regla inicial de pago personalizado:

- 50% para iniciar.
- 50% antes de publicar.
- El administrador puede configurar otro esquema en la cotización.

## 9.3 Flujo RSVP privado

```text
Cliente crea grupo
  → Define lugares y segmentos permitidos
  → Sistema genera enlace opaco
  → Cliente abre WhatsApp con mensaje preparado
  → Invitado abre enlace
  → Servidor identifica el grupo sin mostrar el token
  → Invitado indica asistentes y respuestas
  → Servidor valida límites de forma transaccional
  → Se guarda una nueva submission
  → Dashboard se actualiza
```

## 9.4 Flujo de check-in

```text
Operador inicia sesión
  → Selecciona evento y segmento
  → Autoriza dispositivo
  → Descarga manifiesto de pases si habrá modo offline
  → Escanea QR o busca invitado
  → Sistema valida pase, segmento, estado y usos
  → Registra check-in
  → Si está offline, guarda operación local firmada
  → Al recuperar conexión sincroniza
  → Conflictos se marcan para revisión
```

---

# 10. Reglas de negocio globales

## 10.1 Reglas de creación y preview

- Un visitante puede iniciar un borrador sin pagar.
- Antes de registrarse, el borrador se asocia a un `draft_token` seguro.
- Al registrarse, el borrador se reclama mediante una operación idempotente.
- La vista previa gratuita lleva marca de agua.
- Los borradores gratuitos inactivos durante 60 días se eliminan.
- Un borrador no puede recibir RSVP reales.

## 10.2 Reglas de publicación

- Solo un evento con entitlement `invitation.publish` puede publicarse.
- Debe existir al menos un segmento futuro o vigente.
- Debe existir título, fecha, zona horaria y medio de contacto.
- Las imágenes deben estar en estado `ready`.
- La invitación publicada debe apuntar a una versión inmutable.
- Editar una invitación publicada crea una nueva versión.
- Publicar una versión nueva invalida caché anterior.
- Pausar no elimina datos ni cancela pagos.

## 10.3 Cambio de plantilla

- El contenido se conserva por claves semánticas de sección.
- Las secciones no soportadas se desactivan, no se eliminan.
- Los medios siguen perteneciendo al evento.
- El cambio crea una nueva versión.
- El cliente debe ver una comparación previa antes de confirmar.

## 10.4 Fechas y zonas horarias

- Todos los timestamps se almacenan en UTC en PostgreSQL.
- Cada evento guarda una zona horaria IANA.
- La zona inicial en México será `America/Mexico_City`.
- La interfaz muestra fechas en la zona del evento, no necesariamente en la del usuario.
- Los segmentos pueden cruzar medianoche.

## 10.5 Vigencia y retención

- La invitación pagada puede publicarse hasta 12 meses antes del primer segmento.
- Permanece pública hasta 30 días después del último segmento.
- El dashboard permanece disponible durante 180 días después del evento.
- Antes de la eliminación se enviarán avisos a 30, 7 y 1 día.
- Invitados, RSVP y medios se eliminan o anonimizan después del periodo operativo, salvo extensión.
- Datos de pagos y auditoría se conservan según obligaciones legales y contables.
- La eliminación legal definitiva debe ejecutarse mediante jobs auditables.

## 10.6 Invitados y capacidad

- Un lugar representa una persona autorizada.
- Un grupo puede tener límites separados de adultos, menores y total.
- El total confirmado nunca puede exceder el entitlement ni el límite del grupo.
- La validación final ocurre en servidor dentro de una transacción Prisma.
- Una respuesta RSVP puede editarse si el evento lo permite y no pasó la fecha límite.
- Cada edición genera una nueva submission; no se sobreescribe el historial.

## 10.7 Segmentos

- Un evento debe tener al menos un segmento.
- Un grupo puede tener acceso a todos o solo a ciertos segmentos.
- El número de lugares puede variar por segmento.
- Un pase no debe revelar segmentos no autorizados.

## 10.8 Música

- El cliente debe declarar que tiene derechos o autorización para utilizar el audio.
- No se descargará música desde YouTube, Spotify u otras plataformas.
- Se podrá elegir música de una biblioteca autorizada o subir un archivo permitido.
- El reproductor debe respetar las restricciones de autoplay del navegador.
- Debe existir control visible para pausar o silenciar.

## 10.9 Pagos

- La interfaz nunca define el precio final.
- El servidor calcula el monto desde `plan_versions` y complementos.
- El resultado del redirect no activa la compra.
- Solo un webhook validado y conciliado puede confirmar el pago.
- Cada llamada de creación de pago usa una idempotency key.
- Los webhooks se almacenan antes de procesarse.
- Un webhook duplicado no debe duplicar activaciones.
- La activación y la actualización de la orden ocurren en una transacción.

## 10.10 Eliminación

- Los clientes pueden solicitar eliminar su evento.
- Si existe una obligación de retención, se elimina el contenido operativo y se conserva únicamente el mínimo legal.
- Un pago no se elimina físicamente.
- Un evento con disputa financiera no puede purgarse hasta resolverla.

---

# 11. Estados y ciclos de vida

## 11.1 Estado del evento

```text
draft
awaiting_payment
active
completed
archived
scheduled_for_deletion
deleted
```

Transiciones principales:

```text
draft → awaiting_payment
awaiting_payment → active
active → completed
completed → archived
archived → scheduled_for_deletion
scheduled_for_deletion → deleted
```

## 11.2 Estado de invitación

```text
draft
published
paused
expired
```

## 11.3 Estado de media

```text
pending_upload
uploaded
processing
ready
rejected
quarantined
deleted
```

## 11.4 Estado de orden

```text
draft
pending_payment
paid
partially_paid
failed
canceled
refunded
partially_refunded
chargeback
```

## 11.5 Estado RSVP por invitado

```text
pending
accepted
declined
maybe
```

`maybe` solo estará disponible si la configuración del evento lo permite.

## 11.6 Estado de pase

```text
active
revoked
expired
fully_used
```

---

# 12. Arquitectura general

## 12.1 Estilo arquitectónico

LazoNube utilizará un **monolito modular full-stack**.

Esto significa:

- Una sola aplicación Nuxt para la interfaz y el servidor HTTP.
- Rutas API implementadas con Nitro en `server/api/`.
- Prisma ORM disponible únicamente en código de servidor.
- PostgreSQL como fuente principal de datos.
- Un worker Node separado para procesos asíncronos.
- Tareas programadas ejecutadas por cron, usando el mismo repositorio.
- Un solo repositorio y un solo lenguaje principal: TypeScript.
- Separación por módulos de dominio, no por microservicios.

## 12.2 Diagrama

```mermaid
flowchart LR
    U[Cliente o invitado] --> CF[Cloudflare DNS / WAF]
    CF --> WEB[Nuxt 4 + Nitro en Railway]
    WEB --> DB[(Railway PostgreSQL)]
    WEB --> QUEUE[(pg-boss en PostgreSQL)]
    WORKER[Node Worker en Railway] --> QUEUE
    WORKER --> DB
    WEB --> R2P[(Cloudflare R2 privado)]
    WEB --> R2C[(Cloudflare R2 público / CDN)]
    WORKER --> R2P
    WORKER --> R2C
    WEB --> MP[Mercado Pago]
    WORKER --> MP
    WORKER --> EMAIL[Resend]
    WEB --> GOOGLE[Google OAuth]
    WEB --> SENTRY[Sentry]
    WORKER --> SENTRY
    WEB --> PH[PostHog]
    CRON[Railway Cron] --> DB
    CRON --> QUEUE
```

## 12.3 Procesos desplegables

| Proceso     | Responsabilidad                                   | Comando conceptual          |
| ----------- | ------------------------------------------------- | --------------------------- |
| `web`       | SSR, dashboard, API, auth y webhooks              | `npm run start`             |
| `worker`    | Jobs, media, emails, conciliación y exportaciones | `npm run worker`            |
| `cron`      | Encolar tareas periódicas y mantenimiento         | `npm run cron:<task>`       |
| `migration` | Aplicar migraciones antes del release             | `npx prisma migrate deploy` |

Los procesos pueden desplegarse como servicios distintos para aislar recursos, pero pertenecen a la misma aplicación y versión de código.

## 12.4 Repositorio

| Repositorio | Responsabilidad                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `lazonube`  | Marketing, invitaciones públicas, dashboard, editor, API, autenticación, dominio, persistencia, workers, pruebas y despliegue |

No se crearán repositorios separados para interfaz y servidor durante la V1.

## 12.5 Módulos de dominio

- Identity.
- Catalog.
- Events.
- Invitations.
- Media.
- Guests.
- RSVP.
- Messaging.
- Billing.
- CheckIn.
- CustomDesign.
- Administration.
- Audit.

Cada módulo puede contener:

```text
server/modules/<module>/
├── <module>.service.ts
├── <module>.repository.ts
├── <module>.policy.ts
├── <module>.mapper.ts
├── <module>.errors.ts
├── <module>.events.ts
└── __tests__/
```

Los módulos comparten la misma aplicación y base de datos, pero no deben importar arbitrariamente archivos internos de otros módulos. La comunicación entre módulos ocurre mediante servicios públicos, contratos o eventos internos.

## 12.6 Capas

```text
Vue page or component
  → composable or server-aware data function
  → /api/v1 Nitro route
  → Zod validation
  → authentication and policy
  → domain service
  → repository
  → Prisma Client
  → PostgreSQL
```

Reglas:

- `app/` nunca importa Prisma.
- `shared/` nunca importa módulos exclusivos de Node ni Prisma Client.
- `server/api/` no contiene reglas de negocio complejas.
- `server/modules/` no depende de componentes Vue.
- Los repositories encapsulan consultas complejas y persistencia.
- Los services coordinan casos de uso, transacciones e integraciones.
- Los mappers producen DTOs y evitan exponer registros Prisma directamente.

## 12.7 Comunicación

- API REST bajo `/api/v1`.
- API del mismo origen en producción: `https://lazonube.com/api/v1`.
- JSON UTF-8.
- Campos API en camelCase.
- Contratos Zod compartidos para validación y tipos.
- OpenAPI 3.1 generado o actualizado para endpoints públicos, integraciones y documentación.
- Eventos internos TypeScript para desacoplar procesos dentro del monolito.
- pg-boss para trabajo asíncrono persistente.
- No habrá comunicación directa navegador-base de datos.

## 12.8 Regla de Prisma

Prisma es una dependencia exclusiva del servidor.

Permitido:

```ts
// server/modules/events/event.repository.ts
import { prisma } from '~/server/db/prisma'
```

Prohibido:

```ts
// app/pages/app/events/index.vue
import { prisma } from '~/server/db/prisma'
```

Los componentes consumen datos con `$fetch`, `useFetch` o `useAsyncData` contra rutas Nitro.

---

# 13. Tecnologías aprobadas

## 13.1 Aplicación full-stack

| Área                 | Decisión                                                           |
| -------------------- | ------------------------------------------------------------------ |
| Framework            | Nuxt 4.x                                                           |
| UI                   | Vue 3 Composition API                                              |
| Lenguaje             | TypeScript en modo estricto                                        |
| Servidor             | Nitro sobre Node.js                                                |
| Render               | SSR e híbrido mediante route rules                                 |
| Estilos              | Tailwind CSS 4                                                     |
| Estado de cliente    | Pinia solo cuando el estado sea realmente compartido               |
| Datos remotos        | `useFetch`, `useAsyncData` y `$fetch`                              |
| Formularios          | VeeValidate + Zod                                                  |
| Contratos            | Zod en `shared/contracts` y OpenAPI 3.1 para documentación externa |
| Internacionalización | `@nuxtjs/i18n`                                                     |
| Iconos               | `@nuxt/icon`                                                       |
| Utilidades           | VueUse                                                             |
| Gestor de paquetes   | npm exclusivamente                                                 |
| Analítica            | PostHog                                                            |
| Errores              | Sentry                                                             |

### Reglas de interfaz

- Utilizar `<script setup lang="ts">`.
- No usar `any` sin justificación documentada.
- No hardcodear textos visibles; usar i18n.
- No almacenar secretos ni tokens de sesión en localStorage.
- No almacenar Tailwind classes arbitrarias provenientes de la base de datos.
- El editor y dashboard pueden comportarse como SPA después de autenticarse.
- Las invitaciones públicas deben usar SSR o render híbrido.
- Las páginas no deben depender de modelos Prisma.
- Los tipos de respuesta deben provenir de contratos compartidos o DTOs explícitos.

## 13.2 Servidor integrado

| Área                     | Decisión                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Framework HTTP           | Nitro dentro de Nuxt                                                                                                    |
| Runtime                  | Node.js 24 LTS, fijado por major en `.nvmrc` y `package.json`; parches actualizados mediante lockfile e imagen de build |
| API                      | REST `/api/v1`                                                                                                          |
| Validación               | Zod                                                                                                                     |
| Base de datos            | PostgreSQL 18 administrado en Railway y fijado por major                                                                |
| ORM                      | Prisma ORM 7.x, fijado mediante `package-lock.json`                                                                     |
| Migraciones              | Prisma Migrate                                                                                                          |
| Auth                     | Better Auth integrado con Nuxt/Nitro                                                                                    |
| Login social             | Google provider de Better Auth                                                                                          |
| Sesiones                 | Persistidas en PostgreSQL y entregadas mediante cookies `httpOnly`                                                      |
| Autorización             | Policies propias por módulo y roles almacenados en dominio                                                              |
| Colas                    | pg-boss sobre PostgreSQL                                                                                                |
| Scheduler                | Railway Cron para encolar tareas periódicas                                                                             |
| Cache inicial            | Memoria de proceso solo para datos no críticos; ETag y caché HTTP/CDN para contenido público                            |
| Cache distribuida futura | Redis únicamente cuando métricas lo justifiquen                                                                         |
| Archivos                 | Cloudflare R2 mediante AWS SDK for JavaScript v3                                                                        |
| Imágenes                 | Sharp en el worker                                                                                                      |
| Audio                    | FFmpeg en el worker cuando el flujo lo requiera                                                                         |
| Email                    | Resend Node SDK                                                                                                         |
| Pagos                    | Mercado Pago Checkout Pro                                                                                               |
| Pruebas                  | Vitest para unitarias e integración; Playwright para E2E                                                                |
| Logs                     | JSON estructurado                                                                                                       |
| Errores                  | Sentry                                                                                                                  |

### Reglas de servidor

- Las rutas Nitro deben ser delgadas.
- Toda entrada debe validarse con Zod.
- Toda escritura protegida debe ejecutar una policy.
- Los services contienen casos de uso; los repositories contienen persistencia.
- No se devolverán objetos Prisma directamente al navegador.
- Las operaciones críticas utilizan transacciones.
- Los webhooks y jobs son idempotentes.
- Ninguna ruta HTTP debe procesar imágenes, audio o exportaciones pesadas sin encolarlas.

## 13.3 Datos e infraestructura

| Componente                | Proveedor recomendado                    |
| ------------------------- | ---------------------------------------- |
| Aplicación web y API      | Railway persistent service               |
| Worker                    | Railway persistent service               |
| PostgreSQL                | Railway PostgreSQL                       |
| Tareas programadas        | Railway Cron                             |
| Object storage            | Cloudflare R2                            |
| CDN de medios             | Cloudflare mediante `media.lazonube.com` |
| DNS y WAF                 | Cloudflare                               |
| Email transaccional       | Resend                                   |
| Pagos México              | Mercado Pago                             |
| OAuth                     | Google Cloud / Google Identity           |
| Analítica de producto     | PostHog                                  |
| Monitorización de errores | Sentry                                   |
| Repositorio y CI          | GitHub + GitHub Actions                  |

## 13.4 Servicios aprobados para lanzamiento

| Servicio      | Configuración inicial                                         | Regla de escalamiento                                                                     |
| ------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Railway       | Proyecto con `web`, `worker`, `cron` y PostgreSQL             | Escalar memoria, CPU o réplicas con métricas; separar Redis solo cuando sea necesario     |
| PostgreSQL    | Una instancia por entorno                                     | Escalar por CPU, RAM, almacenamiento, conexiones y latencia                               |
| pg-boss       | Colas `default`, `media`, `billing` y `email` según necesidad | Ajustar concurrencia por cola; migrar cargas específicas a Redis/BullMQ solo mediante ADR |
| Cloudflare R2 | Standard; originales privados y derivados públicos            | Aplicar cuotas, lifecycle y deduplicación                                                 |
| Resend        | Plan acorde al volumen real                                   | Subir de plan antes de superar cuota o límites de dominio                                 |
| Mercado Pago  | Pago por operación                                            | No existe activación por retorno del navegador                                            |

### Presupuesto operativo

- Desarrollo y pruebas pueden iniciar con recursos mínimos.
- Producción debe contemplar al menos el servicio web, worker, PostgreSQL, R2, email y observabilidad.
- Configurar límites y alertas de gasto en Railway, Cloudflare y proveedores externos.
- Los precios externos deben verificarse inmediatamente antes de contratar.
- Ningún agente debe migrar de proveedor únicamente por una promoción temporal.

## 13.5 Gestor de paquetes

- El proyecto utiliza `npm` exclusivamente.
- Se versiona `package-lock.json`.
- Desarrollo local: `npm install`.
- CI/CD: `npm ci`.
- No se permite crear `pnpm-lock.yaml`, `yarn.lock` ni `bun.lock`.
- No se alternan gestores de paquetes dentro del repositorio.
- Todo cambio de dependencias debe actualizar y confirmar `package-lock.json`.

## 13.6 Versiones

- Las dependencias se fijan mediante `package-lock.json`.
- Node se fija mediante `.nvmrc` y `engines.node`.
- Las actualizaciones menores y parches pueden automatizarse con Dependabot o Renovate.
- Los majors requieren ADR y pruebas de regresión.
- No se escribirá una versión exacta de una dependencia dentro de lógica de negocio.
- No se adoptarán versiones preview de Prisma, Nuxt o Better Auth en producción sin ADR.

---

# 14. Entornos

## 14.1 Local

Docker Compose debe proporcionar:

- PostgreSQL.
- LocalStack Community con S3 como almacenamiento local compatible; usar un bucket R2 de desarrollo como alternativa cuando se necesite validar comportamiento específico de R2.
- Mailpit para inspección de correo.
- Redis opcional únicamente para pruebas de compatibilidad futura.

La aplicación Nuxt y el worker se ejecutan normalmente en el host para mejorar hot reload.

Procesos locales mínimos:

```bash
npm run dev
npm run worker:dev
```

Prisma utiliza una base de datos local independiente. Nunca se conecta desarrollo a producción.

## 14.2 Staging

- Environment `staging` independiente en Railway.
- Servicios `web`, `worker` y `cron` separados.
- PostgreSQL separado.
- Buckets R2 separados o nombres con sufijo `staging`.
- Credenciales de prueba de Mercado Pago.
- Dominio o subdominio de email de staging.
- Sentry y PostHog con environment independiente.
- Protección HTTP Basic o allowlist cuando el entorno no sea público.
- Datos ficticios; nunca copiar datos personales de producción.

Dominios sugeridos:

```text
staging.lazonube.com
media-staging.lazonube.com
```

## 14.3 Producción

```text
lazonube.com                     Marketing, catálogo e invitaciones públicas
lazonube.com/app                 Editor y dashboard
lazonube.com/admin               Administración
lazonube.com/api/v1              API Nitro del mismo origen
media.lazonube.com               Derivados públicos en R2
```

Las URLs firmadas de carga utilizan el endpoint S3 de R2, no `media.lazonube.com`.

## 14.4 Regla de dominios

- Se compra un solo dominio principal.
- Las rutas de aplicación y API comparten origen.
- Los subdominios no requieren comprar dominios adicionales.
- Cloudflare administra DNS, proxy, TLS y WAF.
- Railway sirve la aplicación Node mediante dominio personalizado.
- `media.lazonube.com` se conecta al bucket público o capa de entrega configurada para R2.
- Los registros de validación ACME, DKIM, SPF, DMARC, OAuth y propiedad deben conservarse.
- No se utilizará un subdominio `api` en V1 salvo que una integración externa lo requiera y exista ADR.

## 14.5 Variables por entorno

- Cada environment debe tener credenciales propias.
- Los secretos no se copian entre staging y producción.
- Las variables públicas deben comenzar con `NUXT_PUBLIC_` únicamente cuando deban llegar al navegador.
- `DATABASE_URL`, secretos de auth, R2 y Mercado Pago nunca son públicos.
- Las migraciones se ejecutan contra la base del environment correspondiente antes de activar el release.

---

# 15. Autenticación y autorización

## 15.1 Solución

Se utilizará Better Auth integrado con Nuxt y Nitro, persistiendo usuarios, cuentas, sesiones y verificaciones en PostgreSQL mediante el adapter correspondiente.

Better Auth resuelve autenticación. Las reglas de autorización del producto continúan siendo responsabilidad de LazoNube.

## 15.2 Autenticación web

- Cookie de sesión `httpOnly`.
- `Secure` en producción.
- `SameSite=Lax` salvo requerimiento documentado.
- Cookies limitadas al dominio y path necesarios.
- Rotación o invalidación de sesión después de cambios sensibles.
- Sesiones persistidas en PostgreSQL.
- No almacenar tokens de sesión en localStorage.
- No exponer cookies a JavaScript.

## 15.3 Métodos

- Email y contraseña.
- Google OAuth.
- Recuperación de contraseña.
- Verificación de email obligatoria antes de publicar o pagar.
- MFA obligatorio para roles administrativos antes de producción.

## 15.4 Integración Nitro

La ruta de autenticación se expondrá mediante un handler catch-all:

```text
/api/auth/**
```

Los endpoints del dominio bajo `/api/v1` obtendrán la sesión en servidor y producirán un actor autenticado normalizado.

Ejemplo conceptual:

```ts
const actor = await requireActor(event)
await eventPolicy.assertCanUpdate(actor, eventId)
```

## 15.5 Invitados públicos

- No crean cuenta.
- Los enlaces privados usan tokens aleatorios de al menos 128 bits.
- Los tokens se almacenan hasheados.
- Los logs no deben registrar tokens completos.
- Se establecerá `Referrer-Policy: no-referrer` en rutas privadas.
- Los tokens de grupo no se reutilizan como cookies de autenticación.

## 15.6 Autorización

- Toda escritura protegida utiliza una policy del módulo correspondiente.
- Las rutas API no implementan permisos complejos inline.
- Los jobs revalidan alcance de entidad cuando corresponda.
- Un ID válido no implica autorización.
- Los endpoints administrativos requieren rol de plataforma.
- Los roles de evento se verifican por membresía activa.
- Los accesos extraordinarios de soporte se registran en `audit_logs`.

## 15.7 Protección de acciones sensibles

- Cambios de email, contraseña y MFA requieren sesión reciente.
- Acciones financieras requieren reautenticación.
- Transferir propiedad requiere confirmación explícita.
- Revocar sesiones invalida las sesiones persistidas.
- Los intentos sospechosos aplican rate limiting y auditoría.

---

# 16. Arquitectura de almacenamiento de archivos

## 16.1 Proveedor elegido

Cloudflare R2 es el almacenamiento principal porque:

- Es compatible con la API S3.
- Permite cargas directas mediante URLs firmadas.
- Evita enrutar archivos pesados por el servidor Nitro.
- Reduce costos de transferencia de salida estándar.
- Puede conectarse a un dominio propio.

La integración se implementará con AWS SDK for JavaScript v3 desde código de servidor.

## 16.2 Buckets

### Bucket privado

Contenido:

- Originales.
- Archivos pendientes.
- Archivos rechazados temporalmente.
- Exportaciones privadas.
- Manifiestos de check-in.

### Bucket público

Contenido:

- Imágenes sanitizadas y optimizadas.
- Miniaturas.
- Audio aprobado.
- Assets públicos de invitaciones.

No se publicará un original sin procesamiento.

## 16.3 Estructura de claves

```text
{environment}/events/{event_ulid}/assets/{asset_ulid}/original.{ext}
{environment}/events/{event_ulid}/assets/{asset_ulid}/cover-1600.avif
{environment}/events/{event_ulid}/assets/{asset_ulid}/gallery-1200.webp
{environment}/events/{event_ulid}/assets/{asset_ulid}/thumb-400.webp
{environment}/events/{event_ulid}/audio/{asset_ulid}/stream.mp3
```

No usar nombres originales como ruta pública.

## 16.4 Flujo de subida

```text
Interfaz solicita upload session
  → Nitro valida usuario, evento, MIME, tamaño y cuota
  → Service crea media_asset en pending_upload
  → Servidor genera URL firmada corta para bucket privado
  → Interfaz sube directamente a R2
  → Interfaz notifica finalización
  → Nitro verifica objeto con HEAD y checksum
  → Service cambia estado a uploaded y encola job
  → Worker detecta tipo real, procesa y elimina metadatos
  → Worker crea variantes en bucket público
  → media_asset cambia a ready
  → Invitación puede referenciar assetId
```

## 16.5 Validaciones de archivos

### Imágenes

- Permitidos: JPEG, PNG, WebP y HEIC cuando Sharp y el entorno lo soporten.
- Tamaño máximo por original: 12 MB.
- Dimensión máxima aceptada: 12,000 × 12,000 px.
- Se debe decodificar y volver a codificar.
- Se elimina EXIF y geolocalización.
- Se generan AVIF/WebP y fallback cuando sea necesario.
- No se acepta SVG de usuario en V1.

### Audio

- Permitidos: MP3, M4A/AAC y OGG.
- Tamaño máximo: 20 MB.
- Duración máxima: 10 minutos.
- Se normalizan metadata y nombre.
- Se valida el tipo real.
- El usuario confirma que posee derechos de uso.
- El procesamiento se ejecuta en worker con límites de CPU, memoria y duración.

### Otros

- Video no permitido en V1.
- PDFs no forman parte de la invitación pública.
- Archivos desconocidos se ponen en cuarentena.

## 16.6 Reglas de cuota

- La cuota se calcula por bytes reales almacenados del original más derivados.
- Los archivos eliminados dejan de contar después de purgarse.
- Una subida no debe iniciar si excederá la cuota estimada.
- Los assets compartidos entre versiones del mismo evento no se duplican.
- Un asset no se elimina físicamente mientras esté referenciado.

## 16.7 Seguridad operacional

- Las credenciales R2 existen solo en servidor y worker.
- Las URLs firmadas tienen expiración corta y se limitan a una operación y objeto.
- El bucket privado no tiene acceso público.
- El worker descarga originales a almacenamiento temporal efímero y los elimina al terminar.
- Ningún payload de job incluye bytes del archivo; solo identificadores.

---

# 17. Sistema de plantillas

## 17.1 Principio

Una plantilla define presentación y capacidades, no los datos operativos del evento.

## 17.2 Componentes

- `templates`: identidad comercial.
- `template_versions`: versión inmutable del diseño.
- `template_event_types`: compatibilidad.
- `renderer_key`: componente permitido.
- `design_tokens_json`: colores, tipografías, espaciado y formas.
- `default_content_json`: contenido inicial.
- `available_sections_json`: secciones soportadas.

## 17.3 Seguridad

- No se guarda HTML arbitrario.
- No se ejecuta JavaScript desde la base de datos.
- Solo se permiten `renderer_key` registrados en código.
- Los tokens de diseño se validan contra un esquema.
- URLs y colores se sanitizan.

## 17.4 Versionado

- Una versión publicada no se modifica.
- Un cambio visual crea una nueva `template_version`.
- Invitaciones existentes continúan con su versión hasta que el usuario migre.
- La migración debe tener un preview y poder revertirse.

## 17.5 Contrato visual

Ejemplo conceptual:

```json
{
  "schemaVersion": 1,
  "templateVersion": "01J...",
  "theme": {
    "primaryColor": "#183B56",
    "secondaryColor": "#F4E9E2",
    "headingFont": "Cormorant Garamond",
    "bodyFont": "Inter",
    "radius": "large"
  },
  "sections": [
    {
      "id": "hero",
      "rendererKey": "hero.centered.v1",
      "enabled": true,
      "order": 10,
      "content": {
        "eyebrow": "Nuestra boda",
        "title": "Ana & Luis"
      }
    }
  ]
}
```

## 17.6 Reglas del editor

- El editor modifica datos validados, no código.
- Autosave con debounce y control de versión.
- `lock_version` para detectar ediciones concurrentes.
- Si existe conflicto, responder `409 Conflict` con información para resolverlo.
- Cada publicación crea un snapshot.

---

# 18. Modelo de datos

## 18.1 Convenciones

- PostgreSQL.
- Prisma ORM como capa principal de persistencia.
- Prisma Migrate como historial de esquema.
- Claves primarias ULID almacenadas como `varchar(26)` en entidades de negocio.
- Los ULID se generan mediante `@default(ulid())` en Prisma, de acuerdo con ADR-012. Los casos que necesiten conocer el ID antes de persistir utilizan una utilidad de servidor compatible con ULID y lo pasan explícitamente.
- Las tablas administradas por Better Auth pueden seguir la convención requerida por su adapter; cualquier desviación debe documentarse.
- `created_at` y `updated_at` en UTC.
- `deleted_at` solo en entidades recuperables.
- Dinero como `bigint` en centavos; nunca `float` ni `decimal` para totales de órdenes.
- Los DTO convierten `bigint` a string o number seguro según contrato; nunca se serializa `BigInt` directamente.
- Moneda ISO 4217, inicialmente `MXN`.
- Estados como `varchar` con restricciones y validación Zod; evitar enums nativos PostgreSQL salvo ADR.
- JSONB solo para configuración variable, respuestas flexibles o snapshots.
- Tokens sensibles almacenados como hash.
- Emails normalizados en minúsculas.
- Índices compuestos para búsquedas frecuentes.
- Las fechas llegan al API en ISO 8601.

## 18.2 Prisma Schema

- El archivo principal será `prisma/schema.prisma`.
- Los nombres de modelos Prisma utilizan PascalCase.
- Los campos TypeScript utilizan camelCase.
- Las tablas y columnas físicas utilizan snake_case mediante `@@map` y `@map` cuando sea necesario.
- Las relaciones deben declarar comportamiento de borrado explícito.
- No usar `db push` para producción.
- `prisma migrate dev` es exclusivo de desarrollo.
- `prisma migrate deploy` aplica migraciones versionadas en staging y producción.
- Las migraciones SQL generadas pueden editarse para índices funcionales, parciales, constraints y características PostgreSQL no expresadas completamente en Prisma Schema.

Ejemplo conceptual:

```prisma
model Event {
  id          String   @id @db.VarChar(26)
  ownerId     String   @map("owner_id") @db.VarChar(26)
  title       String   @db.VarChar(180)
  status      String   @db.VarChar(30)
  lockVersion Int      @default(0) @map("lock_version")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([ownerId, status])
  @@map("events")
}
```

## 18.3 SQL complementario

Prisma no sustituye todas las capacidades de PostgreSQL. Se permite SQL manual dentro de migraciones para:

- Índices funcionales como `lower(email)`.
- Índices parciales.
- Constraints `CHECK`.
- Unique indexes condicionales.
- Extensiones aprobadas.
- Triggers estrictamente justificados.
- Backfills y migraciones expand-contract.

Toda modificación manual debe permanecer dentro de `prisma/migrations/` y tener pruebas.

## 18.4 Diagrama de alto nivel

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : authenticates
    USERS ||--o{ ACCOUNTS : connects
    USERS ||--o{ EVENTS : owns
    USERS ||--o{ EVENT_MEMBERS : participates
    EVENTS ||--o{ EVENT_MEMBERS : has
    EVENT_TYPES ||--o{ EVENTS : classifies
    EVENTS ||--o{ EVENT_SEGMENTS : contains
    EVENTS ||--|| INVITATIONS : presents
    TEMPLATES ||--o{ TEMPLATE_VERSIONS : versions
    TEMPLATE_VERSIONS ||--o{ INVITATIONS : renders
    INVITATIONS ||--o{ INVITATION_VERSIONS : snapshots
    EVENTS ||--o{ MEDIA_ASSETS : owns
    EVENTS ||--o{ GUEST_GROUPS : invites
    GUEST_GROUPS ||--o{ GUESTS : contains
    GUEST_GROUPS ||--o{ GUEST_GROUP_SEGMENT_ACCESS : receives
    EVENT_SEGMENTS ||--o{ GUEST_GROUP_SEGMENT_ACCESS : grants
    EVENTS ||--|| RSVP_FORMS : configures
    RSVP_FORMS ||--o{ RSVP_QUESTIONS : asks
    GUEST_GROUPS ||--o{ RSVP_SUBMISSIONS : submits
    RSVP_SUBMISSIONS ||--o{ RSVP_ANSWERS : contains
    GUESTS ||--o{ PASSES : receives
    PASSES ||--o{ CHECKINS : records
    EVENTS ||--o{ TABLES : arranges
    TABLES ||--o{ TABLE_ASSIGNMENTS : contains
    GUESTS ||--o{ TABLE_ASSIGNMENTS : assigned
    USERS ||--o{ ORDERS : places
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ PAYMENTS : receives
    EVENTS ||--o{ EVENT_ENTITLEMENTS : grants
```

## 18.5 Transacciones

Usar `prisma.$transaction` para:

- Crear evento y membresía owner.
- Validar y guardar RSVP sin exceder lugares.
- Confirmar pago y aplicar entitlements.
- Publicar snapshot e invalidar referencias.
- Incrementar usos de pase.
- Transferir propiedad.

Cuando exista riesgo de concurrencia:

- Usar el nivel de aislamiento adecuado.
- Implementar reintentos limitados para conflictos serializables.
- Aplicar SQL parametrizado mediante `$queryRaw` o `$executeRaw` solo cuando Prisma Client no exprese la operación.
- Nunca interpolar entrada del usuario en SQL raw.

---

# 19. Tablas principales

Todas las tablas incluyen timestamps salvo indicación contraria.

## 19.1 Identidad

Better Auth administra las tablas operativas de autenticación. El esquema definitivo debe generarse o revisarse contra la versión instalada antes de la primera migración y fijarse en el repositorio.

### `users`

| Campo            | Tipo                 | Regla                         |
| ---------------- | -------------------- | ----------------------------- |
| `id`             | varchar(26)          | PK, ULID de dominio           |
| `name`           | varchar(120)         | requerido                     |
| `email`          | varchar(254)         | único normalizado             |
| `email_verified` | boolean              | default false                 |
| `image`          | text nullable        | avatar opcional               |
| `locale`         | varchar(10)          | default `es-MX`               |
| `timezone`       | varchar(64)          | default `America/Mexico_City` |
| `platform_role`  | varchar(40)          | default `customer`            |
| `status`         | varchar(30)          | active, suspended, deleted    |
| `last_login_at`  | timestamptz nullable |                               |
| `created_at`     | timestamptz          |                               |
| `updated_at`     | timestamptz          |                               |
| `deleted_at`     | timestamptz nullable | soft delete de dominio        |

Índices:

- Unique funcional sobre `lower(email)`.
- `platform_role, status`.

### `sessions`

Campos mínimos compatibles con Better Auth:

- `id`.
- `user_id`.
- `token` o hash según adapter/configuración.
- `expires_at`.
- `ip_address` nullable.
- `user_agent` nullable.
- `created_at`.
- `updated_at`.

Reglas:

- El token no se expone en logs.
- Las sesiones pueden revocarse por usuario o dispositivo.
- Los metadatos se minimizan y retienen por tiempo limitado.

### `accounts`

Representa credenciales y proveedores externos:

- `id`.
- `user_id`.
- `account_id`.
- `provider_id`.
- `access_token` cifrado o no persistido cuando no sea necesario.
- `refresh_token` cifrado o no persistido cuando no sea necesario.
- `access_token_expires_at` nullable.
- `refresh_token_expires_at` nullable.
- `scope` nullable.
- `id_token` cifrado o no persistido cuando no sea necesario.
- `password` hash nullable para credenciales locales, según adapter.
- timestamps.

Unique: `provider_id, account_id`.

### `verifications`

Usada para verificaciones de email, recuperación y flujos temporales:

- `id`.
- `identifier`.
- `value` hasheado cuando sea sensible.
- `expires_at`.
- timestamps.

### `user_consents`

| Campo              | Tipo                  |
| ------------------ | --------------------- |
| `id`               | ULID                  |
| `user_id`          | ULID nullable         |
| `consent_type`     | varchar(60)           |
| `document_version` | varchar(30)           |
| `accepted_at`      | timestamptz           |
| `ip_hash`          | varchar(128) nullable |
| `metadata_json`    | jsonb nullable        |

No se deben modificar manualmente las tablas de Better Auth sin revisar compatibilidad con el adapter y generar migración.

## 19.2 Catálogo

### `event_types`

| Campo                  | Tipo               |
| ---------------------- | ------------------ |
| `id`                   | ULID               |
| `key`                  | varchar(50) unique |
| `name_i18n_key`        | varchar(100)       |
| `description_i18n_key` | varchar(150)       |
| `status`               | varchar(20)        |
| `sort_order`           | integer            |
| `profile_json`         | jsonb              |

`profile_json` contiene defaults, no datos de clientes.

### `templates`

| Campo                | Tipo                 |
| -------------------- | -------------------- |
| `id`                 | ULID                 |
| `key`                | varchar(80) unique   |
| `name`               | varchar(120)         |
| `description`        | text nullable        |
| `status`             | varchar(30)          |
| `style_tags_json`    | jsonb                |
| `thumbnail_asset_id` | ULID nullable        |
| `created_by`         | ULID                 |
| `deleted_at`         | timestamptz nullable |

### `template_versions`

| Campo                     | Tipo                 |
| ------------------------- | -------------------- |
| `id`                      | ULID                 |
| `template_id`             | ULID FK              |
| `version_number`          | integer              |
| `schema_version`          | integer              |
| `renderer_family`         | varchar(80)          |
| `design_tokens_json`      | jsonb                |
| `default_content_json`    | jsonb                |
| `available_sections_json` | jsonb                |
| `published_at`            | timestamptz nullable |
| `created_by`              | ULID                 |

Unique: `template_id, version_number`.

### `template_event_types`

| Campo                  | Tipo           |
| ---------------------- | -------------- |
| `template_id`          | ULID FK        |
| `event_type_id`        | ULID FK        |
| `is_featured`          | boolean        |
| `preview_content_json` | jsonb nullable |

PK compuesta: `template_id, event_type_id`.

## 19.3 Eventos

### `events`

| Campo                     | Tipo                 | Regla                  |
| ------------------------- | -------------------- | ---------------------- |
| `id`                      | ULID                 | PK                     |
| `owner_id`                | ULID FK              |                        |
| `event_type_id`           | ULID FK              |                        |
| `title`                   | varchar(180)         |                        |
| `internal_name`           | varchar(180)         | dashboard              |
| `timezone`                | varchar(64)          | IANA                   |
| `locale`                  | varchar(10)          | default `es-MX`        |
| `status`                  | varchar(30)          | lifecycle              |
| `first_segment_at`        | timestamptz nullable | denormalizado          |
| `last_segment_at`         | timestamptz nullable | denormalizado          |
| `rsvp_deadline_at`        | timestamptz nullable |                        |
| `public_until_at`         | timestamptz nullable |                        |
| `data_retention_until_at` | timestamptz nullable |                        |
| `settings_json`           | jsonb                | preferencias generales |
| `lock_version`            | integer              | concurrencia           |
| `deleted_at`              | timestamptz nullable |                        |

Índices:

- `owner_id, status`.
- `event_type_id, status`.
- `last_segment_at`.

### `event_members`

| Campo         | Tipo                 |
| ------------- | -------------------- |
| `id`          | ULID                 |
| `event_id`    | ULID FK              |
| `user_id`     | ULID FK              |
| `role`        | varchar(30)          |
| `invited_by`  | ULID nullable        |
| `accepted_at` | timestamptz nullable |
| `revoked_at`  | timestamptz nullable |

Unique: `event_id, user_id`.

### `event_segments`

| Campo           | Tipo                   |
| --------------- | ---------------------- |
| `id`            | ULID                   |
| `event_id`      | ULID FK                |
| `key`           | varchar(60)            |
| `title`         | varchar(150)           |
| `description`   | text nullable          |
| `starts_at`     | timestamptz            |
| `ends_at`       | timestamptz nullable   |
| `venue_name`    | varchar(180) nullable  |
| `address`       | text nullable          |
| `latitude`      | numeric(10,7) nullable |
| `longitude`     | numeric(10,7) nullable |
| `maps_url`      | text nullable          |
| `visibility`    | varchar(20)            |
| `sort_order`    | integer                |
| `settings_json` | jsonb nullable         |

Unique recomendado: `event_id, key`.

## 19.4 Invitaciones

### `invitations`

| Campo                 | Tipo                 |
| --------------------- | -------------------- |
| `id`                  | ULID                 |
| `event_id`            | ULID unique FK       |
| `template_version_id` | ULID FK              |
| `slug`                | varchar(100)         |
| `status`              | varchar(30)          |
| `access_mode`         | varchar(30)          |
| `current_version_id`  | ULID nullable        |
| `published_at`        | timestamptz nullable |
| `paused_at`           | timestamptz nullable |
| `expires_at`          | timestamptz nullable |
| `seo_json`            | jsonb nullable       |
| `lock_version`        | integer              |

Unique funcional sobre `lower(slug)`.

### `invitation_versions`

| Campo                 | Tipo                  |
| --------------------- | --------------------- |
| `id`                  | ULID                  |
| `invitation_id`       | ULID FK               |
| `version_number`      | integer               |
| `schema_version`      | integer               |
| `template_version_id` | ULID FK               |
| `content_json`        | jsonb                 |
| `change_summary`      | varchar(255) nullable |
| `created_by`          | ULID                  |
| `published_at`        | timestamptz nullable  |

Unique: `invitation_id, version_number`.

### `invitation_asset_references`

| Campo                   | Tipo         |
| ----------------------- | ------------ |
| `invitation_version_id` | ULID FK      |
| `media_asset_id`        | ULID FK      |
| `usage_key`             | varchar(100) |

Permite impedir borrar assets usados.

## 19.5 Media

### `media_assets`

| Campo               | Tipo                  |
| ------------------- | --------------------- |
| `id`                | ULID                  |
| `event_id`          | ULID FK               |
| `uploaded_by`       | ULID FK               |
| `kind`              | varchar(30)           |
| `status`            | varchar(30)           |
| `visibility`        | varchar(20)           |
| `original_bucket`   | varchar(100)          |
| `original_key`      | text                  |
| `public_bucket`     | varchar(100) nullable |
| `mime_type`         | varchar(120)          |
| `original_filename` | varchar(255) nullable |
| `size_bytes`        | bigint                |
| `checksum_sha256`   | varchar(64) nullable  |
| `width`             | integer nullable      |
| `height`            | integer nullable      |
| `duration_seconds`  | integer nullable      |
| `variants_json`     | jsonb nullable        |
| `alt_text`          | varchar(255) nullable |
| `rejection_reason`  | varchar(255) nullable |
| `ready_at`          | timestamptz nullable  |
| `deleted_at`        | timestamptz nullable  |

Índices:

- `event_id, status`.
- `checksum_sha256`.
- `deleted_at`.

### `upload_sessions`

| Campo                 | Tipo                 |
| --------------------- | -------------------- |
| `id`                  | ULID                 |
| `media_asset_id`      | ULID FK              |
| `user_id`             | ULID FK              |
| `expires_at`          | timestamptz          |
| `completed_at`        | timestamptz nullable |
| `expected_size_bytes` | bigint               |
| `expected_mime_type`  | varchar(120)         |

## 19.6 Invitados

### `guest_groups`

| Campo                | Tipo                  |
| -------------------- | --------------------- |
| `id`                 | ULID                  |
| `event_id`           | ULID FK               |
| `display_name`       | varchar(180)          |
| `private_token_hash` | varchar(128) unique   |
| `max_adults`         | integer               |
| `max_children`       | integer               |
| `max_total`          | integer               |
| `status`             | varchar(30)           |
| `preferred_channel`  | varchar(30) nullable  |
| `contact_phone`      | varchar(30) nullable  |
| `contact_email`      | varchar(254) nullable |
| `sent_at`            | timestamptz nullable  |
| `first_opened_at`    | timestamptz nullable  |
| `last_opened_at`     | timestamptz nullable  |
| `last_reminder_at`   | timestamptz nullable  |
| `notes`              | text nullable         |
| `metadata_json`      | jsonb nullable        |
| `deleted_at`         | timestamptz nullable  |

Índices:

- `event_id, status`.
- `event_id, lower(display_name)`.
- `private_token_hash` unique.

### `guests`

| Campo                | Tipo                  |
| -------------------- | --------------------- |
| `id`                 | ULID                  |
| `guest_group_id`     | ULID FK               |
| `first_name`         | varchar(120)          |
| `last_name`          | varchar(120) nullable |
| `guest_type`         | varchar(20)           |
| `is_primary_contact` | boolean               |
| `phone`              | varchar(30) nullable  |
| `email`              | varchar(254) nullable |
| `rsvp_status`        | varchar(20)           |
| `notes`              | text nullable         |
| `deleted_at`         | timestamptz nullable  |

### `guest_group_segment_access`

| Campo              | Tipo             |
| ------------------ | ---------------- |
| `id`               | ULID             |
| `guest_group_id`   | ULID FK          |
| `event_segment_id` | ULID FK          |
| `max_adults`       | integer nullable |
| `max_children`     | integer nullable |
| `max_total`        | integer          |

Unique: `guest_group_id, event_segment_id`.

### `guest_segment_responses`

| Campo              | Tipo                 |
| ------------------ | -------------------- |
| `id`               | ULID                 |
| `guest_id`         | ULID FK              |
| `event_segment_id` | ULID FK              |
| `status`           | varchar(20)          |
| `responded_at`     | timestamptz nullable |

Unique: `guest_id, event_segment_id`.

## 19.7 RSVP

### `rsvp_forms`

| Campo                  | Tipo                 |
| ---------------------- | -------------------- |
| `id`                   | ULID                 |
| `event_id`             | ULID unique FK       |
| `version_number`       | integer              |
| `enabled`              | boolean              |
| `deadline_at`          | timestamptz nullable |
| `allow_edits`          | boolean              |
| `allow_maybe`          | boolean              |
| `confirmation_message` | text nullable        |
| `settings_json`        | jsonb nullable       |

### `rsvp_questions`

| Campo             | Tipo                  |
| ----------------- | --------------------- |
| `id`              | ULID                  |
| `rsvp_form_id`    | ULID FK               |
| `key`             | varchar(80)           |
| `type`            | varchar(30)           |
| `scope`           | varchar(20)           |
| `label`           | varchar(255)          |
| `help_text`       | varchar(255) nullable |
| `required`        | boolean               |
| `options_json`    | jsonb nullable        |
| `validation_json` | jsonb nullable        |
| `condition_json`  | jsonb nullable        |
| `sort_order`      | integer               |
| `active`          | boolean               |

Tipos permitidos inicialmente:

- `short_text`.
- `long_text`.
- `single_choice`.
- `multiple_choice`.
- `boolean`.
- `number`.
- `dietary`.
- `segment_attendance`.

### `rsvp_submissions`

| Campo               | Tipo                  |
| ------------------- | --------------------- |
| `id`                | ULID                  |
| `guest_group_id`    | ULID FK               |
| `rsvp_form_id`      | ULID FK               |
| `submission_number` | integer               |
| `source`            | varchar(30)           |
| `submitted_at`      | timestamptz           |
| `ip_hash`           | varchar(128) nullable |
| `user_agent_hash`   | varchar(128) nullable |
| `is_current`        | boolean               |

Unique: `guest_group_id, submission_number`.

### `rsvp_answers`

| Campo                | Tipo          |
| -------------------- | ------------- |
| `id`                 | ULID          |
| `rsvp_submission_id` | ULID FK       |
| `rsvp_question_id`   | ULID FK       |
| `guest_id`           | ULID nullable |
| `answer_json`        | jsonb         |

## 19.8 Mesas y check-in

### `tables`

| Campo        | Tipo          |
| ------------ | ------------- |
| `id`         | ULID          |
| `event_id`   | ULID FK       |
| `name`       | varchar(100)  |
| `capacity`   | integer       |
| `sort_order` | integer       |
| `notes`      | text nullable |

Unique: `event_id, name`.

### `table_assignments`

| Campo        | Tipo                 |
| ------------ | -------------------- |
| `id`         | ULID                 |
| `table_id`   | ULID FK              |
| `guest_id`   | ULID FK              |
| `seat_label` | varchar(40) nullable |

Unique: `guest_id` por evento.

### `passes`

| Campo            | Tipo                 |
| ---------------- | -------------------- |
| `id`             | ULID                 |
| `event_id`       | ULID FK              |
| `guest_group_id` | ULID nullable        |
| `guest_id`       | ULID nullable        |
| `token_hash`     | varchar(128) unique  |
| `status`         | varchar(30)          |
| `max_uses`       | integer              |
| `used_count`     | integer              |
| `valid_from`     | timestamptz nullable |
| `valid_until`    | timestamptz nullable |
| `revoked_at`     | timestamptz nullable |

Constraint: debe existir `guest_group_id` o `guest_id`, no ambos vacíos.

### `pass_segment_access`

| Campo              | Tipo    |
| ------------------ | ------- |
| `pass_id`          | ULID FK |
| `event_segment_id` | ULID FK |
| `max_uses`         | integer |
| `used_count`       | integer |

PK compuesta.

### `checkin_devices`

| Campo               | Tipo                 |
| ------------------- | -------------------- |
| `id`                | ULID                 |
| `event_id`          | ULID FK              |
| `authorized_by`     | ULID FK              |
| `name`              | varchar(120)         |
| `device_token_hash` | varchar(128)         |
| `last_seen_at`      | timestamptz nullable |
| `revoked_at`        | timestamptz nullable |

### `checkins`

| Campo                  | Tipo                  |
| ---------------------- | --------------------- |
| `id`                   | ULID                  |
| `event_id`             | ULID FK               |
| `event_segment_id`     | ULID FK               |
| `pass_id`              | ULID FK               |
| `operator_user_id`     | ULID FK               |
| `device_id`            | ULID nullable         |
| `result`               | varchar(30)           |
| `scanned_at`           | timestamptz           |
| `synced_at`            | timestamptz nullable  |
| `offline_operation_id` | varchar(100) nullable |
| `metadata_json`        | jsonb nullable        |

Unique parcial recomendado sobre `offline_operation_id` cuando no sea null.

## 19.9 Planes, órdenes y pagos

### `plans`

| Campo        | Tipo               |
| ------------ | ------------------ |
| `id`         | ULID               |
| `key`        | varchar(50) unique |
| `name`       | varchar(100)       |
| `status`     | varchar(20)        |
| `sort_order` | integer            |

### `plan_versions`

| Campo            | Tipo                 |
| ---------------- | -------------------- |
| `id`             | ULID                 |
| `plan_id`        | ULID FK              |
| `version_number` | integer              |
| `price_cents`    | bigint               |
| `currency`       | char(3)              |
| `limits_json`    | jsonb                |
| `features_json`  | jsonb                |
| `valid_from`     | timestamptz          |
| `valid_until`    | timestamptz nullable |

Nunca editar precio histórico; crear una nueva versión.

### `orders`

| Campo                | Tipo                 |
| -------------------- | -------------------- |
| `id`                 | ULID                 |
| `user_id`            | ULID FK              |
| `event_id`           | ULID nullable FK     |
| `status`             | varchar(30)          |
| `currency`           | char(3)              |
| `subtotal_cents`     | bigint               |
| `discount_cents`     | bigint               |
| `tax_cents`          | bigint               |
| `total_cents`        | bigint               |
| `external_reference` | varchar(120) unique  |
| `paid_at`            | timestamptz nullable |
| `metadata_json`      | jsonb nullable       |

### `order_items`

| Campo              | Tipo          |
| ------------------ | ------------- |
| `id`               | ULID          |
| `order_id`         | ULID FK       |
| `item_type`        | varchar(40)   |
| `reference_id`     | ULID nullable |
| `description`      | varchar(255)  |
| `quantity`         | integer       |
| `unit_price_cents` | bigint        |
| `total_cents`      | bigint        |
| `snapshot_json`    | jsonb         |

### `payments`

| Campo                    | Tipo                  |
| ------------------------ | --------------------- |
| `id`                     | ULID                  |
| `order_id`               | ULID FK               |
| `provider`               | varchar(30)           |
| `provider_payment_id`    | varchar(120) nullable |
| `provider_preference_id` | varchar(120) nullable |
| `idempotency_key`        | varchar(100) unique   |
| `status`                 | varchar(30)           |
| `amount_cents`           | bigint                |
| `currency`               | char(3)               |
| `payment_method`         | varchar(80) nullable  |
| `approved_at`            | timestamptz nullable  |
| `failure_code`           | varchar(120) nullable |
| `provider_payload_json`  | jsonb nullable        |

Unique: `provider, provider_payment_id` cuando exista.

### `webhook_events`

| Campo               | Tipo                  |
| ------------------- | --------------------- |
| `id`                | ULID                  |
| `provider`          | varchar(30)           |
| `provider_event_id` | varchar(191) nullable |
| `signature_valid`   | boolean               |
| `payload_json`      | jsonb                 |
| `headers_json`      | jsonb                 |
| `received_at`       | timestamptz           |
| `processed_at`      | timestamptz nullable  |
| `status`            | varchar(30)           |
| `error_message`     | text nullable         |

Unique cuando sea posible: `provider, provider_event_id`.

### `event_entitlements`

| Campo         | Tipo                 |
| ------------- | -------------------- |
| `id`          | ULID                 |
| `event_id`    | ULID FK              |
| `feature_key` | varchar(100)         |
| `value_json`  | jsonb                |
| `source_type` | varchar(40)          |
| `source_id`   | ULID nullable        |
| `starts_at`   | timestamptz          |
| `ends_at`     | timestamptz nullable |
| `revoked_at`  | timestamptz nullable |

Índice: `event_id, feature_key, revoked_at`.

## 19.10 Operación

### `custom_requests`

Campos mínimos:

- `id`.
- `user_id` nullable.
- `event_type_id`.
- `contact_name`.
- `email`.
- `phone`.
- `event_date`.
- `budget_range`.
- `description`.
- `status`.
- `assigned_to`.
- `internal_notes`.
- `quote_json`.

### `outbound_messages`

Registra mensajes preparados, no necesariamente enviados por API:

- `event_id`.
- `guest_group_id`.
- `type`.
- `channel`.
- `content_snapshot`.
- `generated_at`.
- `marked_sent_at`.
- `created_by`.

### `audit_logs`

- Actor.
- Acción.
- Tipo e ID de entidad.
- Valores anteriores y posteriores reducidos.
- IP hash.
- User agent hash.
- Correlation ID.
- Fecha.

No guardar contraseñas, tokens, audio ni contenido sensible completo.

### `outbox_events`

Soporta el patrón transactional outbox para efectos asíncronos críticos.

| Campo            | Tipo                 | Regla                       |
| ---------------- | -------------------- | --------------------------- |
| `id`             | ULID                 | PK                          |
| `aggregate_type` | varchar(80)          | módulo o agregado de origen |
| `aggregate_id`   | ULID nullable        | entidad relacionada         |
| `event_type`     | varchar(120)         | nombre estable en inglés    |
| `event_version`  | integer              | versión del payload         |
| `payload_json`   | jsonb                | IDs y metadata mínima       |
| `correlation_id` | varchar(64)          | trazabilidad                |
| `available_at`   | timestamptz          | fecha mínima de despacho    |
| `published_at`   | timestamptz nullable | encolado confirmado         |
| `attempt_count`  | integer              | default 0                   |
| `last_error`     | text nullable        | sanitizado                  |
| `locked_at`      | timestamptz nullable | lock de dispatcher          |
| `created_at`     | timestamptz          |                             |

Índices:

- `published_at, available_at`.
- `aggregate_type, aggregate_id`.
- `event_type, event_version`.

Reglas:

- Se inserta dentro de la misma transacción que el cambio de dominio.
- El dispatcher es idempotente y utiliza locks seguros.
- No se almacenan secretos ni payloads grandes.
- Los registros publicados se purgan mediante política de retención auditada.

---

# 20. Contrato público de invitación

El servidor ensambla un DTO público. La interfaz no consume directamente tablas ni objetos Prisma.

Ejemplo conceptual:

```json
{
  "schemaVersion": 1,
  "invitation": {
    "slug": "ana-y-luis",
    "status": "published",
    "accessMode": "hybrid",
    "template": {
      "rendererFamily": "editorial-romantic-v1",
      "designTokens": {}
    }
  },
  "event": {
    "type": "wedding",
    "title": "Ana & Luis",
    "timezone": "America/Mexico_City",
    "segments": []
  },
  "content": {
    "sections": []
  },
  "guestContext": {
    "groupId": null,
    "displayName": null,
    "maxTotal": null,
    "allowedSegmentIds": []
  },
  "rsvp": {
    "enabled": true,
    "deadline": null,
    "questions": []
  },
  "meta": {
    "version": 12,
    "updatedAt": "2026-07-13T12:00:00Z"
  }
}
```

Reglas:

- El contrato se define con Zod en `shared/contracts/public-invitation.ts`.
- El tipo TypeScript se infiere desde el esquema Zod.
- El endpoint valida el DTO antes de enviarlo en pruebas y desarrollo.
- No exponer IDs internos innecesarios.
- No exponer teléfonos de otros invitados.
- No exponer notas internas.
- No exponer tokens.
- No serializar `BigInt` directamente.
- URLs de media se generan desde `media_assets`.
- El DTO puede variar según contexto de grupo.
- Los cambios incompatibles requieren incrementar `schemaVersion`.
- Las páginas Vue renderizan el DTO; nunca consultan Prisma.

---

# 21. API REST

## 21.1 Convenciones

- Base: `/api/v1`.
- Mismo origen que la aplicación web.
- Respuestas de error con estructura compatible con `application/problem+json`.
- Correlation ID por request.
- Paginación consistente.
- Fechas ISO 8601.
- Campos JSON en camelCase.
- Base de datos en snake_case.
- Modelos TypeScript en PascalCase y campos camelCase.
- Contratos Zod en `shared/contracts/`.
- OpenAPI en `docs/openapi/openapi.yaml` o generado desde contratos, sin convertirse en una segunda fuente de verdad.
- Los handlers Nitro viven en `server/api/v1/`.

## 21.2 Patrón de endpoint

```ts
// server/api/v1/events/index.post.ts
import { createEventInputSchema } from '~/shared/contracts/events'
import { createEvent } from '~/server/modules/events/event.service'

export default defineEventHandler(async (requestEvent) => {
  const actor = await requireActor(requestEvent)
  const input = await readValidatedBody(
    requestEvent,
    createEventInputSchema.parse,
  )

  return createEvent({ actor, input })
})
```

Reglas:

- El handler autentica, valida y delega.
- El service ejecuta policies, reglas y transacciones.
- El mapper devuelve el DTO.
- Prisma no se usa directamente en el handler salvo endpoints de infraestructura excepcionalmente simples y documentados.

## 21.3 Auth

Better Auth expone sus rutas bajo:

```text
ALL    /api/auth/**
```

Rutas de dominio relacionadas:

```text
GET    /api/v1/auth/me
POST   /api/v1/auth/logout-all
GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/{sessionId}
```

Registro, login, recuperación, verificación y OAuth utilizan los endpoints soportados por la integración Better Auth.

## 21.4 Catálogo

```text
GET    /api/v1/event-types
GET    /api/v1/templates
GET    /api/v1/templates/{templateId}
GET    /api/v1/templates/{templateId}/preview
GET    /api/v1/plans
```

## 21.5 Eventos

```text
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/{eventId}
PATCH  /api/v1/events/{eventId}
DELETE /api/v1/events/{eventId}
POST   /api/v1/events/{eventId}/transfer-ownership
GET    /api/v1/events/{eventId}/members
POST   /api/v1/events/{eventId}/members
PATCH  /api/v1/events/{eventId}/members/{memberId}
DELETE /api/v1/events/{eventId}/members/{memberId}
```

## 21.6 Segmentos

```text
GET    /api/v1/events/{eventId}/segments
POST   /api/v1/events/{eventId}/segments
PATCH  /api/v1/events/{eventId}/segments/{segmentId}
DELETE /api/v1/events/{eventId}/segments/{segmentId}
POST   /api/v1/events/{eventId}/segments/reorder
```

## 21.7 Invitación y versiones

```text
GET    /api/v1/events/{eventId}/invitation
PUT    /api/v1/events/{eventId}/invitation
POST   /api/v1/events/{eventId}/invitation/change-template
POST   /api/v1/events/{eventId}/invitation/publish
POST   /api/v1/events/{eventId}/invitation/pause
POST   /api/v1/events/{eventId}/invitation/resume
GET    /api/v1/events/{eventId}/invitation/versions
GET    /api/v1/events/{eventId}/invitation/versions/{versionId}
POST   /api/v1/events/{eventId}/invitation/versions/{versionId}/restore
```

## 21.8 Publicación

```text
GET    /api/v1/public/invitations/{slug}
POST   /api/v1/public/invitations/{slug}/resolve-access
GET    /api/v1/public/invitations/{slug}/rsvp
POST   /api/v1/public/invitations/{slug}/rsvp
```

El token privado se envía mediante el mecanismo acordado y no se persiste en analytics, logs ni URLs de terceros.

## 21.9 Media

```text
GET    /api/v1/events/{eventId}/media
POST   /api/v1/events/{eventId}/media/upload-sessions
POST   /api/v1/events/{eventId}/media/{assetId}/complete
PATCH  /api/v1/events/{eventId}/media/{assetId}
DELETE /api/v1/events/{eventId}/media/{assetId}
```

## 21.10 Invitados y grupos

```text
GET    /api/v1/events/{eventId}/guest-groups
POST   /api/v1/events/{eventId}/guest-groups
GET    /api/v1/events/{eventId}/guest-groups/{groupId}
PATCH  /api/v1/events/{eventId}/guest-groups/{groupId}
DELETE /api/v1/events/{eventId}/guest-groups/{groupId}
POST   /api/v1/events/{eventId}/guest-groups/import
GET    /api/v1/events/{eventId}/guest-groups/export
POST   /api/v1/events/{eventId}/guest-groups/{groupId}/regenerate-link
POST   /api/v1/events/{eventId}/guest-groups/{groupId}/mark-sent
POST   /api/v1/events/{eventId}/guest-groups/{groupId}/guests
PATCH  /api/v1/events/{eventId}/guests/{guestId}
DELETE /api/v1/events/{eventId}/guests/{guestId}
```

## 21.11 RSVP administrativo

```text
GET    /api/v1/events/{eventId}/rsvp-form
PUT    /api/v1/events/{eventId}/rsvp-form
GET    /api/v1/events/{eventId}/rsvp-submissions
GET    /api/v1/events/{eventId}/rsvp-summary
POST   /api/v1/events/{eventId}/rsvp-submissions/{submissionId}/make-current
```

## 21.12 Mesas, pases y check-in

```text
GET    /api/v1/events/{eventId}/tables
POST   /api/v1/events/{eventId}/tables
PATCH  /api/v1/events/{eventId}/tables/{tableId}
DELETE /api/v1/events/{eventId}/tables/{tableId}
POST   /api/v1/events/{eventId}/table-assignments
DELETE /api/v1/events/{eventId}/table-assignments/{assignmentId}
POST   /api/v1/events/{eventId}/passes/generate
POST   /api/v1/events/{eventId}/passes/{passId}/revoke
POST   /api/v1/events/{eventId}/checkin/devices
POST   /api/v1/events/{eventId}/checkin/manifest
POST   /api/v1/events/{eventId}/checkin/scan
POST   /api/v1/events/{eventId}/checkin/sync
GET    /api/v1/events/{eventId}/checkin/summary
```

## 21.13 Órdenes y pagos

```text
POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/{orderId}
POST   /api/v1/orders/{orderId}/checkout/mercado-pago
POST   /api/v1/orders/{orderId}/reconcile
POST   /api/v1/webhooks/mercado-pago
```

## 21.14 Solicitudes personalizadas

```text
POST   /api/v1/custom-requests
GET    /api/v1/custom-requests/{requestId}
GET    /api/v1/admin/custom-requests
GET    /api/v1/admin/custom-requests/{requestId}
PATCH  /api/v1/admin/custom-requests/{requestId}
POST   /api/v1/admin/custom-requests/{requestId}/quote
```

## 21.15 Administración

```text
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/users
GET    /api/v1/admin/events
GET    /api/v1/admin/orders
GET    /api/v1/admin/payments
GET    /api/v1/admin/audit-logs
POST   /api/v1/admin/templates
POST   /api/v1/admin/templates/{templateId}/versions
POST   /api/v1/admin/templates/{templateId}/publish-version
POST   /api/v1/admin/plan-versions
```

## 21.16 Serialización

- No devolver instancias Prisma.
- Convertir nombres físicos snake_case a camelCase mediante mapper.
- Convertir `bigint` según contrato.
- Omitir campos internos con listas explícitas, no mediante eliminación posterior.
- Validar DTOs críticos con Zod.
- Mantener respuestas estables aunque cambie el esquema físico.

---

# 22. RSVP

## 22.1 Principios

- Debe ser rápido y usable sin cuenta.
- Debe funcionar en móvil.
- Las preguntas se muestran según reglas condicionales.
- Las capacidades se validan en servidor.
- Debe distinguir grupo, invitado y segmento.

## 22.2 Preguntas obligatorias del sistema

Aunque el formulario sea configurable, el sistema debe poder obtener:

- Quién responde.
- Quién asistirá.
- A qué segmentos asistirá.
- Cuántos lugares se ocuparán.

## 22.3 Seguridad pública

- Rate limit por token, IP hash y slug.
- Honeypot.
- CAPTCHA adaptativo después de comportamiento sospechoso.
- Máximo de intentos por ventana.
- No confirmar si un teléfono o email existe en otro evento.
- Respuestas de error no enumerables.

## 22.4 Ediciones

- Se conserva historial.
- Solo una submission es `is_current`.
- Las métricas usan la submission actual.
- Cambios después del deadline requieren permiso del organizador.

---

# 23. WhatsApp asistido

## 23.1 Alcance V1

La plataforma no envía mensajes automáticamente. Genera el contenido y abre WhatsApp.

## 23.2 Plantillas de mensaje

- Invitación inicial.
- Recordatorio de RSVP.
- Confirmación recibida.
- Cambio importante.
- Agradecimiento posterior.

## 23.3 Variables

```text
{{group_name}}
{{event_title}}
{{event_date}}
{{max_places}}
{{invitation_url}}
{{rsvp_deadline}}
{{organizer_name}}
```

## 23.4 Reglas

- La URL privada corresponde al grupo.
- No incluir datos de otros invitados.
- El cliente puede editar el mensaje antes de abrir WhatsApp.
- Marcar como enviado es una acción manual.
- Analytics no captura el token privado.

---

# 24. Pagos con Mercado Pago

## 24.1 Solución inicial

Mercado Pago Checkout Pro para reducir complejidad y alcance PCI.

Toda integración se ejecuta desde código de servidor. El navegador nunca recibe el access token privado.

## 24.2 Creación de checkout

1. El cliente selecciona plan y add-ons.
2. Nitro autentica al usuario.
3. El service valida elegibilidad y entitlements existentes.
4. El servidor calcula totales desde `plan_versions`.
5. Dentro de una transacción Prisma se crean orden, items y pago pendiente.
6. Se genera una idempotency key única.
7. El adapter de Mercado Pago crea la preferencia con `external_reference` igual al ID público de la orden.
8. Se guarda `provider_preference_id`.
9. La interfaz recibe únicamente la URL o identificador necesario para redirigir.

## 24.3 Webhook

1. Nitro recibe la request en `/api/v1/webhooks/mercado-pago`.
2. Persiste headers y payload sanitizado en `webhook_events` antes de procesar.
3. Valida `x-signature` y datos requeridos.
4. Rechaza o marca firma inválida.
5. Encola `ProcessMercadoPagoWebhook` en pg-boss.
6. Responde rápidamente al proveedor.
7. El worker consulta el pago directamente a Mercado Pago.
8. Compara referencia, monto, moneda y cuenta.
9. Procesa dentro de una transacción Prisma.
10. Aplica entitlements una sola vez.
11. Marca webhook como procesado.

## 24.4 Idempotencia

- `payments.idempotency_key` es única.
- `provider, provider_payment_id` es único cuando existe.
- `provider, provider_event_id` es único cuando el proveedor lo entrega.
- Aplicar entitlements debe tolerar reintentos.
- Un webhook repetido termina correctamente sin duplicar activaciones.
- Un job reintentado consulta el estado persistido antes de escribir.

## 24.5 Conciliación

- Un cron encola revisión de pagos pendientes.
- El usuario puede solicitar conciliación con rate limit.
- El redirect de éxito solo muestra “estamos confirmando tu pago” hasta tener confirmación real.
- La conciliación utiliza el adapter de Mercado Pago, no datos del navegador.

## 24.6 Reembolsos

- Solo roles financieros.
- Reautenticación obligatoria.
- Motivo obligatorio.
- Registro de auditoría.
- Revocar entitlements únicamente según política de reembolso.
- No eliminar orden, pago ni webhook.

## 24.7 Adapter

La integración externa se encapsula:

```text
server/integrations/mercado-pago/
├── mercado-pago.client.ts
├── mercado-pago.checkout.ts
├── mercado-pago.webhook.ts
├── mercado-pago.mapper.ts
└── mercado-pago.types.ts
```

Los módulos de dominio no deben depender directamente del SDK.

---

# 25. QR y check-in

## 25.1 Contenido del QR

El QR contendrá una URL corta o token opaco. Nunca contendrá:

- Nombre completo.
- Teléfono.
- Email.
- Número de mesa.
- Datos de RSVP.

## 25.2 Validación online

Validar:

- Firma o hash del token.
- Estado del pase.
- Evento.
- Segmento.
- Ventana temporal.
- Número máximo de usos.
- Entitlement activo.

La actualización de `used_count` debe usar bloqueo transaccional.

## 25.3 Modo offline limitado

Antes del evento:

- Un dispositivo autorizado solicita un manifiesto.
- El manifiesto contiene identificadores no reversibles y límites mínimos necesarios.
- Se cifra y firma.
- Tiene expiración corta.

Durante el modo offline:

- El dispositivo valida localmente.
- Guarda `offline_operation_id` único.
- No muestra datos no descargados.

Al sincronizar:

- El servidor deduplica.
- Aplica operaciones válidas.
- Marca conflictos y duplicados.
- Conserva registro de ambos escaneos.

## 25.4 Fallback manual

El operador puede buscar por:

- Nombre de grupo.
- Nombre de invitado.
- Últimos cuatro dígitos del teléfono, si existe.

Debe evitar mostrar la lista completa sin necesidad.

---

# 26. Seguridad y privacidad

## 26.1 Datos personales

La plataforma puede almacenar:

- Nombres.
- Teléfonos.
- Emails.
- Relaciones de grupo.
- Asistencia.
- Restricciones alimentarias.
- Datos de menores.

Por lo tanto debe existir:

- Aviso de privacidad.
- Términos de servicio.
- Política de retención.
- Consentimiento versionado.
- Exportación.
- Eliminación.
- Proceso de incidentes.

La documentación legal debe ser revisada por un profesional en México antes del lanzamiento.

## 26.2 Controles

- TLS obligatorio.
- Cookies seguras.
- CSRF.
- Rate limiting.
- Validación de archivos.
- Hash de tokens.
- Secretos solo en variables de entorno.
- Principio de mínimo privilegio.
- Backups y restauración probada.
- Auditoría de acciones sensibles.
- Dependencias escaneadas.
- Content Security Policy.
- Protección de clickjacking.
- `Referrer-Policy` estricta en enlaces privados.

## 26.3 Información sensible

- Las restricciones alimentarias son opcionales.
- Su propósito debe explicarse.
- Solo miembros autorizados pueden verlas.
- No deben aparecer en exportaciones genéricas sin selección explícita.
- Se eliminan con los datos operativos del evento.

## 26.4 Administración

- Requerir MFA para roles administrativos antes de producción.
- Sesiones administrativas con menor duración.
- Acciones financieras requieren reautenticación.
- Acceso de soporte a un evento debe registrarse.

---

# 27. Rendimiento, SEO y accesibilidad

## 27.1 Presupuestos de rendimiento

Invitación pública móvil:

- LCP objetivo menor a 2.5 segundos en p75.
- CLS menor a 0.1.
- INP menor a 200 ms en p75.
- JavaScript inicial objetivo menor a 200 KB comprimidos, excluyendo media.
- Imagen hero responsiva y precargada solo cuando corresponda.

API:

- p95 de lectura simple menor a 500 ms.
- p95 de escritura normal menor a 800 ms.
- Operaciones pesadas pasan a jobs.

## 27.2 Caché

- Payload público con ETag.
- Caché CDN corta y revalidación.
- Purga al publicar o pausar.
- Assets con nombres inmutables y caché larga.
- Nunca cachear respuestas privadas compartidas.

## 27.3 SEO

- Landing y catálogo indexables.
- Demos de plantilla indexables cuando aporten valor.
- Invitaciones reales con `noindex` por defecto.
- Open Graph configurable con imagen sanitizada.
- Sitemap solo para contenido comercial.
- JSON-LD en páginas de marketing cuando corresponda.

## 27.4 Accesibilidad

Objetivo WCAG 2.2 AA:

- Contraste validado.
- Navegación por teclado.
- Focus visible.
- Labels de formulario.
- Mensajes de error anunciados.
- Texto alternativo.
- Respeto a `prefers-reduced-motion`.
- Música no inicia sin interacción cuando el navegador lo prohíbe.
- Formularios RSVP utilizables con lectores de pantalla.

---

# 28. Analítica y métricas

## 28.1 Métrica norte

> Eventos publicados que reciben al menos 10 lugares confirmados mediante RSVP.

## 28.2 Embudo

- Visita a catálogo.
- Apertura de demo.
- Inicio de borrador.
- Personalización significativa.
- Registro.
- Vista previa completa.
- Inicio de checkout.
- Pago confirmado.
- Publicación.
- Primer enlace compartido.
- Primer RSVP.
- Diez lugares confirmados.

## 28.3 Métricas operativas

- Tiempo medio para publicar.
- Conversión por plantilla.
- Conversión por tipo de evento.
- Invitaciones abiertas.
- Grupos pendientes.
- Lugares confirmados y rechazados.
- Incidencias de pago.
- Tiempo de procesamiento de media.
- Errores de webhook.
- Duplicados de check-in.
- Solicitudes de soporte por evento.

## 28.4 Privacidad analítica

- No enviar nombres, teléfonos, emails ni tokens a PostHog.
- Identificadores analíticos deben ser internos o pseudónimos.
- Respetar consentimiento de cookies cuando aplique.

---

# 29. Observabilidad

## 29.1 Logs

Logs estructurados JSON con:

- Timestamp.
- Level.
- Environment.
- Service: `web`, `worker` o `cron`.
- Release o commit SHA.
- Correlation ID.
- Job ID cuando corresponda.
- User ID cuando sea seguro.
- Event ID cuando sea relevante.
- Action.
- Duration.

No registrar:

- Contraseñas.
- Tokens completos.
- Cookies.
- Credenciales.
- URLs firmadas completas.
- Payloads completos de datos personales sin sanitizar.

## 29.2 Correlation ID

- Nitro acepta un correlation ID válido o genera uno.
- El ID se incluye en respuestas de error.
- Los jobs reciben el correlation ID de origen como metadata.
- El worker crea un nuevo trace y conserva referencia al request original.

## 29.3 Errores

Sentry en interfaz, servidor y worker:

- Source maps privados.
- Release identificada por commit.
- Environment.
- Correlation ID.
- Datos personales reducidos.
- Integración separada para errores de navegador y servidor.

## 29.4 Colas

Debe existir visibilidad de:

- Jobs pendientes.
- Jobs activos.
- Retries.
- Dead letters o jobs fallidos definitivamente.
- Duración por tipo.
- Antigüedad del job más viejo.
- Concurrencia por cola.

El dashboard de pg-boss puede habilitarse solo para administración interna protegida o mediante herramienta operativa separada.

## 29.5 Alertas mínimas

- Aplicación web caída.
- Tasa de errores 5xx elevada.
- Worker detenido.
- Jobs críticos fallidos.
- Webhooks de pago sin procesar.
- Uso de almacenamiento cercano a límites.
- Conexiones PostgreSQL saturadas.
- Latencia elevada.
- Certificados o dominios próximos a expirar.
- Errores repetidos de procesamiento de media.

## 29.6 Health checks

```text
GET /up
GET /health/live
GET /health/ready
```

- `live` confirma que el proceso responde.
- `ready` verifica PostgreSQL y dependencias críticas con timeout corto.
- El worker debe emitir heartbeat observable.
- Los health checks no exponen secretos ni detalles internos.

---

# 30. Pruebas

## 30.1 Herramientas

| Tipo            | Herramienta                                    |
| --------------- | ---------------------------------------------- |
| Unitarias       | Vitest                                         |
| Integración     | Vitest + PostgreSQL real de pruebas            |
| Componentes Vue | Vitest + Vue Test Utils                        |
| API             | Vitest contra handlers/services y base aislada |
| E2E             | Playwright                                     |
| Contract        | Zod + OpenAPI validation                       |

No usar SQLite como sustituto de PostgreSQL en pruebas de reglas transaccionales.

## 30.2 Unitarias

- Entitlements.
- Límites de invitados.
- Cálculo de precio.
- Estados.
- Validaciones de template schema.
- Generación y hash de tokens.
- Policies.
- Mappers y DTOs.

## 30.3 Integración

- Better Auth y sesiones.
- Policies con datos reales.
- Transacciones RSVP.
- Webhooks de pago.
- Idempotencia de jobs.
- Upload sessions.
- Publicación y caché.
- Check-in concurrente.
- Migraciones Prisma.
- SQL manual de índices y constraints.

## 30.4 Contract tests

- Esquemas Zod contra respuestas del servidor.
- OpenAPI contra rutas públicas documentadas.
- Compatibilidad de fixtures.
- `schemaVersion` de invitaciones.
- Errores `application/problem+json`.

## 30.5 E2E

Flujos obligatorios:

1. Crear borrador y registrarse.
2. Editar y previsualizar.
3. Simular pago y activar.
4. Publicar.
5. Crear grupo y responder RSVP.
6. Cambiar plantilla.
7. Pausar y reanudar.
8. Generar y escanear pase.
9. Colaborador con permisos limitados.
10. Usuario no autorizado recibe 403.
11. Sesión revocada deja de autorizar requests.
12. Webhook repetido no duplica entitlements.

## 30.6 Base de datos de pruebas

- Base PostgreSQL exclusiva por suite o worker de CI.
- Ejecutar `prisma migrate deploy` antes de pruebas de integración.
- Limpiar mediante transacciones, truncado controlado o schemas temporales.
- Nunca usar producción.
- Factories en TypeScript.
- Seeds deterministas.

## 30.7 Reglas

- Una corrección de bug debe incluir prueba de regresión.
- Ningún webhook se considera terminado sin pruebas de duplicado.
- Ningún límite de capacidad se considera terminado sin prueba de concurrencia.
- Ningún job crítico se considera terminado sin prueba de retry.
- No usar datos de producción en pruebas.
- Mockear proveedores externos detrás de adapters; no mockear Prisma en pruebas que validan persistencia.

---

# 31. CI/CD

## 31.1 Estrategia de ramas aprobada

Se utilizará una estrategia sencilla compatible con un equipo pequeño y agentes de IA:

```text
feature/* or fix/*
        ↓ pull request
      develop
        ↓ release pull request
       main
```

Reglas:

- `develop` representa el siguiente release y despliega automáticamente a staging.
- `main` representa producción y siempre debe ser desplegable.
- Todo trabajo ordinario se realiza en una rama `feature/<english-name>`, `fix/<english-name>`, `refactor/<english-name>` o `chore/<english-name>`.
- Está prohibido desarrollar directamente sobre `main` o `develop`.
- Los cambios de `develop` a `main` se realizan mediante pull request de release.
- Los hotfixes parten de `main`, regresan a `main` mediante PR y después se sincronizan hacia `develop`.
- Los nombres de ramas, commits y pull requests se escriben en inglés.

## 31.2 Checks obligatorios de pull request

La CI del único repositorio debe ejecutar:

1. `npm ci`.
2. Verificar que solo exista `package-lock.json`.
3. Verificar formato.
4. ESLint.
5. Typecheck.
6. `prisma format --check` o comando equivalente aprobado.
7. `prisma validate`.
8. Generar Prisma Client.
9. Levantar PostgreSQL 18 de pruebas.
10. Aplicar `prisma migrate deploy`.
11. Unit tests.
12. Integration tests.
13. Validación de contratos y OpenAPI.
14. Build Nuxt para Node.
15. Playwright smoke en cambios que afecten interfaz, autenticación o rutas críticas.
16. Auditoría de dependencias de producción.

Un pull request no puede fusionarse si falla cualquiera de los checks requeridos.

## 31.3 PostgreSQL en CI

- GitHub Actions utilizará `postgres:18-alpine` como service container.
- La base de CI será descartable y nunca compartirá credenciales con staging o producción.
- Antes de integration tests se ejecutará `npx prisma migrate deploy`.
- Los seeds de prueba deben ser deterministas y ejecutarse explícitamente.
- Si producción cambia de major PostgreSQL, Docker Compose y CI deben actualizarse en el mismo ADR y release técnico.
- No usar SQLite como sustituto de PostgreSQL.

## 31.4 Workflows mínimos

El repositorio debe incluir:

```text
.github/workflows/ci.yml
.github/workflows/e2e.yml
.github/workflows/security.yml
.github/dependabot.yml
```

Responsabilidades:

- `ci.yml`: lint, typecheck, Prisma, migraciones, unit/integration tests y build.
- `e2e.yml`: Playwright contra una aplicación iniciada con PostgreSQL de pruebas.
- `security.yml`: auditoría de dependencias y análisis de código cuando GitHub Advanced Security esté disponible.
- Dependabot: actualizaciones semanales de npm y GitHub Actions, agrupando parches y minors compatibles.

## 31.5 Protección de ramas

`develop` y `main` deben requerir:

- Pull request antes de merge.
- Todos los checks obligatorios exitosos.
- Conversaciones resueltas.
- Rama actualizada antes de fusionar cuando GitHub lo permita.
- Bloqueo de force push y eliminación.
- Al menos una aprobación cuando exista otra persona disponible; para trabajo individual, el propietario revisa el diff y la evidencia del agente antes del merge.

`main` adicionalmente debe requerir:

- Pull request desde `develop` o rama `hotfix/*`.
- Environment de GitHub `production` con aprobación manual del propietario.
- Smoke test de staging exitoso antes del release.

## 31.6 Entornos de GitHub

Crear:

- `staging`.
- `production`.

Reglas:

- Los secretos de cada environment son independientes.
- `production` requiere aprobación manual.
- Los jobs solo reciben secretos después de entrar al environment correspondiente.
- Nunca guardar credenciales de producción como repository variables no protegidas.
- Preferir integración nativa Railway-GitHub o tokens de despliegue con el mínimo alcance.

## 31.7 Despliegue a staging

1. Merge a `develop`.
2. CI completa en verde.
3. Railway construye el commit aprobado.
4. El pre-deploy del servicio web ejecuta `npx prisma migrate deploy` una sola vez.
5. Railway despliega `web`.
6. Railway despliega `worker` desde el mismo commit.
7. Los cron services usan el mismo release.
8. El healthcheck `/health/ready` debe responder correctamente.
9. Se ejecuta smoke test de autenticación, API y lectura de base de datos.
10. El resultado queda registrado en el pull request o release notes.

## 31.8 Despliegue a producción

1. Crear PR de `develop` hacia `main`.
2. Confirmar que todas las fases incluidas cumplen su gate de salida.
3. Confirmar backup o punto de restauración antes de migraciones de riesgo medio o alto.
4. Aprobar el environment `production`.
5. Ejecutar `npx prisma migrate deploy` como pre-deploy único.
6. Desplegar `web` y `worker` desde el mismo commit SHA.
7. Activar cron services del mismo release.
8. Esperar healthcheck exitoso.
9. Ejecutar smoke tests productivos no destructivos.
10. Confirmar Sentry, logs y cola.
11. Crear tag semántico y release notes.
12. Si un smoke test crítico falla, detener el rollout, revertir el deployment o desactivar la feature mediante flag.

## 31.9 Build y comandos productivos

La aplicación productiva usa el output Node de Nuxt/Nitro:

```bash
npm run build
node .output/server/index.mjs
```

Comandos aprobados:

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "start": "node .output/server/index.mjs",
    "postinstall": "prisma generate",
    "prisma:generate": "prisma generate",
    "prisma:validate": "prisma validate",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "worker:dev": "tsx watch worker/index.ts",
    "worker:start": "node .output-worker/index.js",
    "lint": "eslint .",
    "typecheck": "nuxt typecheck",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test"
  }
}
```

Los nombres pueden ajustarse técnicamente, pero todos los workflows y documentación deben usar una única convención.

## 31.10 Migraciones

- Prisma Migrate es la única autoridad de cambios de esquema.
- `prisma db push` no se usa en staging ni producción.
- No renombrar o eliminar columnas en el mismo despliegue que deja de usarlas.
- Aplicar estrategia expand-contract.
- Las migraciones deben revisarse antes del merge.
- Índices parciales, funcionales y constraints no expresables se agregan en SQL versionado dentro de la migración.
- Operaciones largas se separan del request y del arranque normal.
- Los backfills grandes se ejecutan como jobs o scripts auditados.
- Una migración fallida bloquea el despliegue.
- Nunca editar una migración ya aplicada en staging o producción; crear una nueva migración correctiva.

## 31.11 Compatibilidad web-worker

- `web` y `worker` deben ejecutar la misma versión de contratos y esquema.
- Los jobs deben tolerar una ventana breve de despliegue mixto.
- Cambios incompatibles en payloads requieren `jobVersion` nuevo.
- No eliminar un processor hasta vaciar o migrar sus jobs pendientes.
- Un rollback de código no debe asumir que puede revertir destructivamente una migración ya aplicada.

## 31.12 Evidencia de CI/CD completo

CI/CD se considera configurado cuando:

- Un PR con error de lint queda bloqueado.
- Un PR con migración inválida queda bloqueado.
- Integration tests utilizan PostgreSQL 18 real.
- Un merge a `develop` despliega staging y supera healthcheck.
- Un release a `main` requiere aprobación del propietario.
- Staging y producción usan secretos y bases separados.
- Se documentó un rollback de aplicación y una restauración de base de datos.

# 32. Estructura del repositorio

## 32.1 Estructura principal

Todos los nombres de archivos y directorios de código deben estar en inglés.

```text
lazonube/
├── app/
│   ├── assets/
│   ├── components/
│   │   ├── base/
│   │   ├── catalog/
│   │   ├── editor/
│   │   ├── invitation/
│   │   ├── guests/
│   │   ├── rsvp/
│   │   ├── checkin/
│   │   └── admin/
│   ├── composables/
│   ├── layouts/
│   ├── middleware/
│   ├── pages/
│   │   ├── index.vue
│   │   ├── templates/
│   │   ├── invitation/
│   │   ├── app/
│   │   └── admin/
│   ├── plugins/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   └── app.vue
├── server/
│   ├── api/
│   │   ├── auth/
│   │   └── v1/
│   ├── auth/
│   ├── db/
│   │   └── prisma.ts
│   ├── integrations/
│   │   ├── cloudflare-r2/
│   │   ├── google/
│   │   ├── mercado-pago/
│   │   ├── posthog/
│   │   ├── resend/
│   │   └── sentry/
│   ├── middleware/
│   ├── modules/
│   │   ├── identity/
│   │   ├── catalog/
│   │   ├── events/
│   │   ├── invitations/
│   │   ├── media/
│   │   ├── guests/
│   │   ├── rsvp/
│   │   ├── messaging/
│   │   ├── billing/
│   │   ├── checkin/
│   │   ├── custom-design/
│   │   ├── administration/
│   │   └── audit/
│   ├── queue/
│   ├── utils/
│   └── workers/
├── shared/
│   ├── constants/
│   ├── contracts/
│   ├── schemas/
│   ├── types/
│   └── utils/
├── worker/
│   ├── index.ts
│   ├── processors/
│   └── runtime/
├── cron/
│   ├── enqueue-retention.ts
│   ├── reconcile-payments.ts
│   └── expire-invitations.ts
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── i18n/
├── public/
├── tests/
│   ├── fixtures/
│   ├── integration/
│   ├── unit/
│   └── e2e/
├── docs/
│   ├── adr/
│   ├── openapi/
│   ├── runbooks/
│   └── architecture/
├── scripts/
├── .github/
│   └── workflows/
├── .env.example
├── .nvmrc
├── Dockerfile
├── docker-compose.yml
├── nuxt.config.ts
├── package.json
├── package-lock.json
├── prisma.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## 32.2 Organización de un módulo

```text
server/modules/guests/
├── guest.contract.ts
├── guest.errors.ts
├── guest.events.ts
├── guest.mapper.ts
├── guest.policy.ts
├── guest.repository.ts
├── guest.service.ts
└── __tests__/
```

Reglas:

- Los contratos compartidos con navegador viven en `shared/contracts`, no dentro del módulo servidor.
- Los tipos internos no deben exportarse por comodidad si exponen persistencia.
- Los repositories pueden importar Prisma.
- Los services pueden importar repositories e interfaces de integraciones.
- Los handlers API importan services y contratos.
- Los componentes Vue no importan nada desde `server/`.

## 32.3 Prisma Client singleton

`server/db/prisma.ts` contiene la única inicialización aprobada de Prisma Client para el proceso web.

El worker puede reutilizar la misma factory, pero debe cerrar conexiones al terminar procesos one-off.

No crear `new PrismaClient()` dentro de rutas, services o loops.

## 32.4 Alias

- `~/` y `@/` se usan según configuración de Nuxt.
- `~~/` puede apuntar a la raíz cuando sea necesario.
- Evitar imports relativos profundos.
- Los aliases no deben ocultar dependencias circulares.

---

# 33. Convenciones de código

## 33.1 Idioma

Todo el código debe estar en inglés:

- Archivos.
- Directorios.
- Variables.
- Métodos.
- Funciones.
- Clases.
- Interfaces.
- Types.
- Modelos Prisma.
- Campos TypeScript.
- Rutas internas.
- Tests.
- Commits.
- Comentarios.
- Variables de entorno.
- Nombres de jobs.
- Nombres de colas.
- Mensajes técnicos y códigos de error.

El documento funcional y el texto visible pueden estar en español. El texto visible utiliza i18n.

Ejemplo correcto:

```ts
const confirmedPlaces = await guestService.countConfirmedPlaces(eventId)
```

Ejemplo prohibido:

```ts
const lugaresConfirmados = await servicioInvitados.contarLugares(eventId)
```

## 33.2 Git

Conventional commits:

```text
feat:
fix:
refactor:
test:
docs:
chore:
perf:
security:
```

Los mensajes posteriores al prefijo también deben escribirse en inglés.

## 33.3 Nombres

- TypeScript: camelCase para variables y funciones.
- Types, interfaces, classes y componentes Vue: PascalCase.
- Componentes Vue: nombres descriptivos de varias palabras.
- Prisma models: PascalCase.
- Prisma fields: camelCase.
- DB: snake_case mediante mapping.
- API JSON: camelCase.
- Feature keys: dot notation, por ejemplo `checkin.enabled`.
- Queue names: kebab-case, por ejemplo `process-uploaded-image`.
- Environment variables: SCREAMING_SNAKE_CASE.

## 33.4 TypeScript

- `strict: true`.
- No usar `any` sin comentario y issue asociado.
- Preferir `unknown` y validación.
- No usar non-null assertion salvo invariantes probadas.
- Inferir tipos desde Zod cuando el contrato sea la fuente.
- No duplicar manualmente interfaces equivalentes al contrato.
- Evitar enums TypeScript cuando una unión literal sea suficiente.
- Las funciones públicas de módulos deben declarar return type cuando mejore estabilidad.

## 33.5 Calidad

- No código comentado abandonado.
- No TODO sin issue o contexto.
- No dependencias sin justificar.
- No duplicar reglas entre navegador y servidor como autoridad.
- La interfaz puede replicar validaciones para UX, pero el servidor decide.
- No exponer objetos Prisma como DTO.
- No realizar queries dentro de loops cuando pueda evitarse.
- No usar SQL raw salvo necesidad documentada y parámetros seguros.
- No crear una segunda instancia de Prisma por request.

## 33.6 Formato

- ESLint como autoridad de lint.
- Prettier o formatter aprobado de forma consistente.
- Tailwind classes ordenadas mediante tooling aprobado.
- Prisma Schema formateado con Prisma formatter.
- Todo archivo termina con newline.

---

# 34. Reglas obligatorias para agentes de IA

## 34.1 Antes de escribir código

El agente debe:

1. Leer este documento.
2. Identificar el módulo afectado.
3. Revisar contratos Zod y OpenAPI cuando aplique.
4. Revisar `prisma/schema.prisma` y migraciones existentes.
5. Revisar services, repositories, policies y tests del flujo.
6. Verificar entitlements y roles.
7. Verificar si la operación requiere transacción o idempotencia.
8. Evitar introducir una segunda fuente de verdad.
9. Confirmar que todos los nombres de código estén en inglés.

## 34.2 Prohibiciones

Un agente no debe:

- Crear un segundo proyecto servidor para una feature ordinaria.
- Importar Prisma dentro de `app/`, componentes, stores o composables del navegador.
- Acceder directamente a PostgreSQL desde la interfaz.
- Crear `new PrismaClient()` por request.
- Guardar auth tokens en localStorage.
- Hardcodear precios.
- Hardcodear funciones por nombre de plan.
- Hardcodear flujos separados por cada tipo de evento.
- Confiar en montos dla interfaz.
- Activar una compra por query params de retorno.
- Guardar tokens privados en texto plano.
- Guardar HTML o JavaScript de usuarios.
- Borrar pagos o webhooks.
- Modificar una template version publicada.
- Publicar originales de media sin sanitizar.
- Exponer datos personales en logs o analytics.
- Implementar una escritura sin Policy.
- Implementar una operación crítica sin idempotencia.
- Ejecutar procesamiento pesado dentro del request HTTP.
- Usar `prisma db push` en staging o producción.
- Editar la base de datos manualmente fuera de una migración aprobada.
- Devolver objetos Prisma directamente como respuesta.
- Crear nombres de código en español.
- Introducir Redis, microservicios o otro proveedor sin ADR.

## 34.3 Obligaciones al modificar datos

- Actualizar `prisma/schema.prisma` cuando corresponda.
- Crear migración Prisma.
- Revisar y, si hace falta, editar el SQL generado.
- Actualizar factory o builder de tests.
- Actualizar seed cuando corresponda.
- Actualizar repository y mapper.
- Actualizar contratos Zod.
- Actualizar OpenAPI si cambia una API documentada.
- Agregar pruebas.
- Documentar la decisión si cambia arquitectura.
- Evaluar compatibilidad con jobs pendientes y releases anteriores.

## 34.4 Obligaciones al agregar una feature

- Definir feature key y entitlement.
- Definir roles autorizados.
- Definir estados y errores.
- Definir contrato de entrada y salida.
- Definir analytics sin PII.
- Definir pruebas.
- Definir comportamiento en planes sin acceso.
- Definir comportamiento cuando el proveedor externo falla.
- Definir si requiere job, cron o procesamiento síncrono.
- Definir estrategia de idempotencia.
- Definir impacto de migración y rollback.

## 34.5 Respuestas esperadas de agentes

Cuando un agente proponga una implementación debe incluir:

- Módulos afectados.
- Archivos a crear o modificar.
- Cambios Prisma y migraciones.
- Endpoints.
- Contratos Zod.
- Reglas de autorización.
- Transacciones e idempotencia.
- Jobs o cron involucrados.
- Casos de prueba.
- Riesgos.
- Compatibilidad hacia atrás.

## 34.6 Regla de simplificación

La arquitectura full-stack no autoriza mezclar capas.

“Un solo proyecto” significa compartir repositorio y runtime, no ejecutar queries de base de datos desde componentes ni colocar toda la lógica dentro de handlers Nitro.

---

# 35. Variables de entorno

## 35.1 Públicas

Solo variables seguras para el navegador:

```env
NUXT_PUBLIC_APP_URL=
NUXT_PUBLIC_MEDIA_URL=
NUXT_PUBLIC_POSTHOG_KEY=
NUXT_PUBLIC_POSTHOG_HOST=
NUXT_PUBLIC_SENTRY_DSN=
NUXT_PUBLIC_ENVIRONMENT=
NUXT_PUBLIC_GOOGLE_CLIENT_ID=
```

No exponer secretos con prefijo `NUXT_PUBLIC_`.

## 35.2 Servidor web

```env
NODE_ENV=
APP_NAME=LazoNube
APP_URL=
APP_ENV=
APP_VERSION=
PORT=

DATABASE_URL=
DIRECT_DATABASE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
SESSION_COOKIE_DOMAIN=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

R2_ACCOUNT_ID=
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PRIVATE_BUCKET=
R2_PUBLIC_BUCKET=
R2_PUBLIC_URL=https://media.lazonube.com

RESEND_API_KEY=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME=

MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_WEBHOOK_SECRET=

SENTRY_DSN=
POSTHOG_API_KEY=
POSTHOG_HOST=

TOKEN_HASH_SECRET=
ENCRYPTION_KEY=
```

## 35.3 Worker

El worker comparte únicamente las variables necesarias:

```env
NODE_ENV=
APP_ENV=
APP_VERSION=
DATABASE_URL=

R2_ACCOUNT_ID=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PRIVATE_BUCKET=
R2_PUBLIC_BUCKET=
R2_PUBLIC_URL=

RESEND_API_KEY=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME=

MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=

SENTRY_DSN=
TOKEN_HASH_SECRET=
ENCRYPTION_KEY=
```

No proporcionar al worker secretos de Google OAuth si no los utiliza.

## 35.4 Local

`.env.example` contiene nombres y valores no sensibles de ejemplo.

Docker Compose puede exponer:

```env
DATABASE_URL=postgresql://lazonube:lazonube@localhost:5433/lazonube
S3_ENDPOINT=http://localhost:4566
MAILPIT_URL=http://localhost:8025
```

## 35.5 Reglas

- Nunca copiar `.env` al repositorio.
- No registrar variables de entorno.
- Rotar secretos después de exposición.
- Staging y producción usan secretos diferentes.
- `DIRECT_DATABASE_URL` solo se usa cuando el proveedor requiera una conexión directa para migraciones.
- Las variables se validan al arranque con Zod.
- El proceso debe fallar temprano si falta una variable crítica.

---

# 36. Procesos asíncronos

## 36.1 Tecnología

pg-boss utiliza PostgreSQL para persistir y distribuir jobs. Esto evita agregar Redis durante la etapa inicial.

El worker es un proceso Node de larga duración desplegado desde el mismo repositorio.

## 36.2 Colas iniciales

```text
default
media
billing
email
exports
checkin
retention
```

La separación lógica por cola permite configurar concurrencia, prioridad y recursos distintos.

## 36.3 Jobs mínimos

- `ProcessUploadedImage`.
- `ProcessUploadedAudio`.
- `DeleteExpiredUploadSession`.
- `PurgeDeletedMediaAsset`.
- `SendTransactionalEmail`.
- `ProcessMercadoPagoWebhook`.
- `ReconcilePendingPayment`.
- `ApplyEventEntitlements`.
- `ExpireInvitations`.
- `SendRetentionWarnings`.
- `PurgeExpiredEventData`.
- `GenerateGuestExport`.
- `GenerateCheckinManifest`.
- `SyncOfflineCheckins`.
- `InvalidatePublicInvitationCache`.

Nombres de clases, funciones, archivos y colas deben estar en inglés.

## 36.4 Reglas

- Todos los jobs deben ser idempotentes.
- Configurar retries y exponential backoff cuando aplique.
- Guardar causa de fallo sanitizada.
- Alertar cuando un job crítico agote reintentos.
- No incluir payloads grandes; pasar IDs y metadata mínima.
- Incluir `correlationId`, `jobVersion` y actor cuando sea necesario.
- Verificar estado actual antes de ejecutar efectos externos.
- Cerrar recursos al finalizar procesos one-off.
- Limitar concurrencia de media según CPU y memoria.

## 36.5 Encolado transaccional

Cuando una operación requiera persistir datos y encolar trabajo de forma atómica:

- Usar la capacidad de pg-boss para crear jobs dentro de la transacción compatible, o
- Implementar patrón transactional outbox mediante una tabla aprobada.

No confirmar un estado que dependa de un job si existe riesgo de perder el encolado.

## 36.6 Scheduler

Railway Cron ejecuta scripts cortos que encolan trabajo y terminan.

Ejemplos:

```text
cron/reconcile-payments.ts
cron/expire-invitations.ts
cron/send-retention-warnings.ts
cron/purge-expired-data.ts
```

Los cron jobs:

- Operan en UTC.
- No procesan miles de registros dentro del proceso cron; encolan lotes.
- Utilizan locks o claves de idempotencia.
- Pueden reejecutarse sin duplicar resultados.

## 36.7 Evolución

Redis y BullMQ solo se evaluarán cuando existan métricas que demuestren:

- Contención significativa en PostgreSQL.
- Necesidad de throughput mayor.
- Scheduling o rate limiting no cubierto adecuadamente.
- Aislamiento operacional requerido.

El cambio requiere ADR y una interfaz de queue que evite reescribir los casos de uso.

---

# 37. Emails transaccionales

Mínimos:

- Verificación de correo.
- Recuperación de contraseña.
- Invitación a colaborar.
- Pago recibido.
- Pago pendiente o fallido.
- Evento publicado.
- Cambio importante de cuenta.
- Avisos de expiración y retención.
- Resumen RSVP opcional.

Reglas:

- Enviar mediante cola.
- Dominio verificado.
- SPF, DKIM y DMARC.
- Plantillas versionadas.
- Links firmados y con expiración cuando sean sensibles.
- No incluir listas completas de invitados por email.

---

# 38. Errores de API

## 38.1 Formato

Formato recomendado compatible con Problem Details:

```json
{
  "type": "https://lazonube.com/problems/guest-capacity-exceeded",
  "title": "Guest capacity exceeded",
  "status": 422,
  "detail": "The selected group cannot confirm more than four places.",
  "instance": "/api/v1/public/invitations/ana-y-luis/rsvp",
  "code": "GUEST_CAPACITY_EXCEEDED",
  "correlationId": "01J...",
  "errors": {
    "guests": ["The group limit is four places."]
  }
}
```

El texto técnico y los códigos internos están en inglés. La interfaz puede traducir mensajes mediante `code` e i18n.

## 38.2 Implementación

- Los módulos lanzan errores de dominio tipados.
- Un middleware Nitro transforma errores conocidos a Problem Details.
- Errores Zod se convierten a `errors` por campo.
- Errores Prisma nunca se exponen directamente.
- Violaciones únicas o de foreign key se mapean a códigos de dominio cuando sean esperables.
- Los errores inesperados devuelven un mensaje genérico y se reportan a Sentry.
- `correlationId` siempre se devuelve.

## 38.3 Códigos mínimos

- `AUTHENTICATION_REQUIRED`.
- `EMAIL_NOT_VERIFIED`.
- `FORBIDDEN`.
- `ENTITLEMENT_REQUIRED`.
- `EVENT_LIMIT_EXCEEDED`.
- `GUEST_CAPACITY_EXCEEDED`.
- `RSVP_CLOSED`.
- `INVITATION_NOT_PUBLISHED`.
- `INVITATION_VERSION_CONFLICT`.
- `MEDIA_NOT_READY`.
- `UPLOAD_QUOTA_EXCEEDED`.
- `PAYMENT_PENDING`.
- `PAYMENT_MISMATCH`.
- `PASS_INVALID`.
- `PASS_ALREADY_USED`.
- `SEGMENT_ACCESS_DENIED`.
- `VALIDATION_FAILED`.
- `RESOURCE_NOT_FOUND`.
- `IDEMPOTENCY_CONFLICT`.
- `EXTERNAL_PROVIDER_UNAVAILABLE`.

## 38.4 HTTP status

- 400: request mal formado.
- 401: autenticación requerida.
- 403: actor autenticado sin permiso.
- 404: recurso inexistente o no visible.
- 409: conflicto de versión o idempotencia.
- 422: validación o regla de negocio.
- 429: rate limit.
- 500: fallo inesperado.
- 502/503: proveedor externo no disponible cuando corresponda.

---

# 39. Criterios de aceptación de V1

La V1 no está terminada hasta cumplir lo siguiente:

## 39.1 Producto

- Todos los tipos de evento pueden crear y publicar una invitación.
- Cada tipo tiene plantillas compatibles y datos de ejemplo.
- El usuario puede editar antes de pagar.
- El cambio de plantilla conserva contenido.
- El usuario puede crear segmentos.
- Essential recibe RSVP básico.
- Organize maneja grupos privados y preguntas.
- Control genera pases y registra check-ins.
- El panel muestra lugares, no solo respuestas.

## 39.2 Arquitectura

- Existe un solo repositorio `lazonube`.
- Nuxt atiende interfaz y API Nitro.
- Prisma solo se importa en servidor.
- Las rutas API usan services y policies.
- El proceso web no ejecuta procesamiento pesado.
- Worker y web usan el mismo release.
- Los contratos Zod son la fuente de entrada y salida compartida.
- La aplicación funciona con API del mismo origen.

## 39.3 Pagos

- Pago aprobado activa exactamente una vez.
- Webhook duplicado no duplica entitlements.
- Monto distinto no activa.
- Firma inválida no activa.
- Pago pendiente puede conciliarse.
- Existe flujo de reembolso administrativo.
- El redirect del navegador no activa una compra.

## 39.4 Media

- La carga va directo a R2.
- Nitro valida cuotas y genera URL firmada.
- Originales no son públicos.
- EXIF se elimina.
- Variantes responsivas se generan en worker.
- Un archivo inválido se rechaza.
- Un job repetido no duplica variantes ni cuotas.

## 39.5 Seguridad

- Better Auth funciona con dominio real y cookies seguras.
- No hay tokens de sesión en localStorage.
- Policies cubren escrituras.
- Rate limit en rutas públicas.
- Tokens privados hasheados.
- MFA administrativo activo.
- Logs sin secretos.
- Prisma y DATABASE_URL no llegan al bundle del navegador.

## 39.6 Base de datos

- Prisma Migrate controla el esquema.
- Todas las migraciones productivas pasan por `prisma migrate deploy`.
- Índices funcionales y constraints SQL requeridos están versionados.
- Restauración de PostgreSQL fue probada.
- RSVP y check-in tienen pruebas de concurrencia.

## 39.7 Calidad

- CI verde.
- E2E críticos verdes.
- Worker y cron observables.
- Alertas configuradas.
- Documentos legales publicados.
- Runbooks de pagos, jobs, base de datos y caídas disponibles.

---

# 40. Plan de desarrollo por fases

## 40.1 Reglas generales de ejecución

- Las fases son acumulativas y se implementan en orden.
- Cada fase debe producir una aplicación desplegable en staging.
- Cada issue pertenece a una sola fase y debe enlazar sus criterios de aceptación.
- Una fase puede dividirse en sprints, pero no puede declararse completa hasta superar su gate de salida.
- Los entregables no incluidos en una fase se mantienen fuera de alcance aunque el esquema de datos ya los contemple.
- Toda fase debe actualizar documentación, contratos, migraciones, pruebas y runbooks afectados.
- Los proveedores externos se integran primero mediante sandbox o credenciales de staging.

## 40.2 Fase 0 — Repository and platform foundations

### Objetivo

Crear un repositorio reproducible, seguro y desplegable que permita a un agente de IA desarrollar sin improvisar estructura, comandos o infraestructura.

### Alcance obligatorio

- Repositorio privado `lazonube` en GitHub.
- Ramas `develop` y `main` protegidas.
- Nuxt 4 con TypeScript strict y Node.js 24 LTS.
- npm y `package-lock.json` como único gestor.
- Estructura base `app/`, `server/`, `shared/`, `worker/`, `cron/`, `prisma/`, `tests/` y `docs/`.
- Docker Compose con PostgreSQL 18, LocalStack S3 y Mailpit.
- Prisma 7 configurado con PostgreSQL y client generator explícito.
- `.env.example` y validación de variables mediante Zod.
- ESLint, formatter, Vitest y Playwright instalados.
- Endpoints `/up`, `/health/live` y `/health/ready`.
- CI de GitHub Actions con PostgreSQL real.
- Railway staging con `web`, `worker` y PostgreSQL.
- Sentry inicial en web y servidor, sin PII.
- ADRs fundamentales aceptados y versionados.

### Fuera de alcance

- Registro de clientes.
- Editor.
- Pagos.
- Invitados.
- Plantillas comerciales definitivas.

### Gate de salida

La fase está completa cuando:

- Un clon limpio puede ejecutar `npm ci`, levantar Docker y arrancar Nuxt siguiendo el README.
- `npm run lint`, `npm run typecheck`, `npm run prisma:validate`, tests base y `npm run build` pasan localmente y en CI.
- `prisma migrate deploy` crea una base vacía sin intervención manual.
- Staging responde `/health/ready` y confirma conexión a PostgreSQL.
- Un cambio con lint roto no puede fusionarse.
- No existen secretos reales en Git ni en el historial.
- El documento `REPOSITORY_AND_CI_SETUP.md` fue completado y marcado con evidencia.

## 40.3 Fase 1 — Identity and first vertical slice

### Objetivo

Validar toda la arquitectura con una primera funcionalidad vertical real: autenticación y administración básica de un evento propio.

### Alcance obligatorio

- Better Auth con Prisma adapter.
- Email y contraseña.
- Verificación de email.
- Recuperación de contraseña.
- Google OAuth en staging.
- Sesiones persistidas con cookies `httpOnly`.
- Roles de plataforma mínimos.
- Models de usuario, sesión, cuenta y verificación.
- Models iniciales `EventType`, `Event` y `EventMember`.
- Crear, consultar y actualizar un evento.
- Policy de owner y rechazo para usuarios ajenos.
- Contratos Zod y Problem Details.
- Dashboard mínimo con estados loading, empty y error.
- Auditoría de login y escrituras críticas sin guardar secretos.

### Pruebas obligatorias

- Registro, verificación, login y logout.
- Recuperación de contraseña con proveedor de email simulado.
- Sesión revocada no autoriza requests.
- Un usuario no puede leer o modificar eventos de otro.
- Crear evento genera owner membership en la misma transacción.
- E2E desde registro hasta ver el evento en dashboard.

### Gate de salida

- El flujo funciona localmente y en staging.
- No hay tokens en localStorage.
- Todas las escrituras ejecutan policy.
- Los DTO no exponen objetos Prisma.
- Better Auth migrations y models están bajo Prisma Migrate.
- La primera vertical demuestra UI → Nitro → service → repository → Prisma → PostgreSQL.

## 40.4 Fase 2 — Catalog, event configuration and editor core

### Objetivo

Permitir crear un borrador configurable, seleccionar plantilla y editar contenido con preview antes de pagar.

### Alcance obligatorio

- Todos los tipos de evento definidos como perfiles configurables.
- Catálogo inicial con al menos una familia visual funcional y datos de ejemplo para cada tipo.
- Models `Template`, `TemplateVersion`, `TemplateEventType`, `Invitation` e `InvitationVersion`.
- Segmentos del evento.
- Contrato `InvitationContentV1` aprobado.
- Editor por formularios y secciones.
- Activar, desactivar y reordenar secciones permitidas.
- Autosave con debounce.
- `lockVersion` y respuesta `409` para concurrencia.
- Preview móvil y escritorio con marca de agua.
- Cambio de plantilla con reporte de compatibilidad.
- Snapshot de versión al publicar una revisión interna.

### Pruebas obligatorias

- Los tipos de evento usan configuración, no ramas duplicadas.
- El contenido inválido es rechazado por el discriminated union de Zod.
- Un conflicto de edición devuelve `INVITATION_VERSION_CONFLICT`.
- Cambiar plantilla conserva contenido compatible y desactiva lo no soportado.
- Una versión publicada o congelada no se modifica.

### Gate de salida

- Un usuario autenticado crea evento, selecciona plantilla, edita, refresca y conserva datos.
- El preview usa el mismo renderer contractual que la invitación pública.
- El editor no guarda HTML, JavaScript ni clases Tailwind arbitrarias.
- Existe al menos una vertical visual completa en móvil y escritorio.
- Todas las operaciones cuentan con tests de autorización y versionado.

## 40.5 Fase 3 — Media pipeline and public publication

### Objetivo

Permitir cargar media de forma segura, procesarla en background y publicar una invitación rápida y versionada.

### Alcance obligatorio

- Buckets o entornos R2 privados y públicos separados.
- Upload sessions y URLs firmadas cortas.
- Carga directa navegador → R2.
- Verificación de tamaño, MIME real, checksum y cuota.
- Worker pg-boss para imágenes.
- Sharp para eliminar EXIF y generar variantes.
- Flujo de audio permitido con validación; FFmpeg solo donde sea necesario.
- Invitación pública SSR bajo `/invitation/:slug`.
- DTO público ensamblado, sin leer tablas directamente en componentes.
- ETag, caché pública corta e invalidación al publicar o pausar.
- Historial y restore de versiones.
- SEO comercial y `noindex` por defecto para invitaciones reales.

### Pruebas obligatorias

- Original privado no es accesible públicamente.
- Archivo inválido o con cuota excedida se rechaza.
- Job repetido no duplica derivados.
- Publicar requiere todos los media assets en `ready`.
- Pausar invalida caché y oculta la invitación.
- Restore crea una nueva versión, no reescribe historial.

### Gate de salida

- Una invitación puede publicarse desde staging y abrirse en móvil mediante URL pública.
- Las imágenes optimizadas se sirven desde `media` y no desde disco local.
- La publicación mantiene p75 objetivo razonable en pruebas controladas y no bloquea por procesamiento pesado.
- Worker, retries, dead-letter handling y alertas básicas fueron probados.

## 40.6 Fase 4 — Plans, entitlements and payments

### Objetivo

Hacer el producto cobrable y activar capacidades exactamente una vez después de confirmar un pago real.

### Alcance obligatorio

- `Plan`, `PlanVersion`, `Order`, `OrderItem`, `Payment`, `WebhookEvent` y `EventEntitlement`.
- Precios históricos inmutables en centavos.
- Cálculo de totales exclusivamente en servidor.
- Entitlements por feature key.
- Mercado Pago Checkout Pro en sandbox.
- Idempotency keys.
- Persistencia del webhook antes de procesarlo.
- Verificación de firma y consulta del pago al proveedor.
- Activación transaccional exactamente una vez.
- Conciliación manual con rate limit y cron automático.
- Emails de pago recibido, pendiente y fallido.
- Reembolso administrativo inicial con auditoría.

### Pruebas obligatorias

- Redirect exitoso no activa compra.
- Firma inválida no activa compra.
- Monto, moneda o referencia incorrectos no activan.
- Webhook duplicado no duplica entitlements.
- Reintento después de fallo parcial converge al mismo estado.
- El cliente no puede enviar un precio arbitrario.

### Gate de salida

- Un pago sandbox aprobado activa un evento una sola vez.
- Los estados de orden y pago son conciliables y auditables.
- Existe runbook para pagos pendientes, webhooks fallidos y reembolsos.
- Ninguna función consulta directamente el nombre del plan para autorizarse.

## 40.7 Fase 5 — Guest groups, WhatsApp and RSVP

### Objetivo

Completar el ciclo comercial principal: publicar, compartir y recibir confirmaciones controladas.

### Alcance obligatorio

- Grupos de invitados e invitados individuales.
- Límites de adultos, menores y total.
- Acceso por segmento.
- Tokens privados de al menos 128 bits almacenados como hash.
- Mensajes editables para WhatsApp y enlaces por grupo.
- Registro manual de enviado y aperturas sin capturar tokens en analytics.
- Formulario RSVP configurable.
- Submissions inmutables con una versión actual.
- Validación transaccional de capacidad.
- Exportación CSV mediante worker.
- Dashboard con lugares pendientes, aceptados y rechazados.
- Rate limit, honeypot y protección adaptativa.

### Pruebas obligatorias

- Dos confirmaciones concurrentes no exceden capacidad.
- Token inválido no enumera grupos.
- Edición crea nueva submission y conserva historial.
- Deadline y permisos de edición se respetan.
- Segmentos no autorizados no se exponen.
- Analytics no recibe PII ni token privado.

### Gate de salida — `commercial_beta`

- Un cliente piloto puede crear, pagar, publicar, compartir y recibir RSVP sin intervención técnica.
- El dashboard muestra lugares reales, no solo respuestas.
- Exportación, mensajes y recordatorios manuales funcionan.
- Los flujos críticos tienen E2E y runbooks de soporte.
- No existen defectos críticos abiertos en auth, pago, publicación o RSVP.

## 40.8 Fase 6 — Administration, content and launch hardening

### Objetivo

Convertir la beta comercial en un producto operable públicamente por el negocio.

### Alcance obligatorio

- Dashboard administrativo.
- Administración de usuarios, eventos y estado operativo.
- Administración de plantillas y versiones.
- Órdenes, pagos, reembolsos y conciliación para roles financieros.
- Solicitudes de diseño personalizado.
- Acceso de soporte auditado.
- Audit logs consultables.
- Métricas de conversión y operación sin PII.
- MFA para roles administrativos.
- Runbooks de incidentes, pagos, jobs, storage y base de datos.
- Backup y restauración probados.
- Seguridad, accesibilidad y rendimiento revisados.
- Términos, privacidad, cookies y política de retención publicados después de revisión profesional.
- Contenido comercial suficiente: mínimo 12 familias visuales para declarar V1 completa; la beta puede iniciar con menos.
- Cada tipo de evento debe tener al menos 6 plantillas compatibles antes de declarar el catálogo V1 completo.

### Pruebas obligatorias

- Roles administrativos limitan correctamente finanzas, soporte y contenido.
- Toda acción extraordinaria queda auditada.
- Restauración de backup en entorno aislado.
- Smoke tests productivos no destructivos.
- Revisión WCAG 2.2 AA en rutas críticas.
- Presupuestos de rendimiento verificados en invitaciones representativas.

### Gate de salida — `commercial_core`

- El equipo puede operar clientes, pagos, plantillas y soporte sin editar la base manualmente.
- Producción tiene alertas, backups, rollback y propietarios definidos.
- Los documentos legales están publicados.
- Se completó beta cerrada y se resolvieron defectos críticos y altos acordados.
- El flujo principal puede lanzarse públicamente aunque el control de acceso avanzado continúe en fase 7.

## 40.9 Fase 7 — Tables, QR and check-in control

### Objetivo

Completar las capacidades avanzadas del plan Control y cerrar el alcance total de V1.

### Alcance obligatorio

- Mesas y asignaciones.
- Pases por grupo o persona.
- Acceso y usos por segmento.
- QR con token opaco.
- Dispositivos autorizados.
- Escáner web móvil.
- Búsqueda manual limitada.
- Bloqueo transaccional para usos.
- Detección de duplicados.
- Manifiesto offline cifrado, firmado y con expiración.
- Cola local de operaciones offline.
- Sincronización idempotente y resolución de conflictos.
- Métricas y reportes de check-in.

### Pruebas obligatorias

- El QR no contiene PII.
- Escaneos concurrentes no exceden `maxUses`.
- Pase revocado, expirado o de segmento incorrecto se rechaza.
- `offlineOperationId` se deduplica.
- Conflictos offline quedan visibles para revisión.
- Un dispositivo revocado no descarga ni sincroniza manifiestos.

### Gate de salida — `v1_complete`

- El plan Control genera pases y registra check-ins online.
- El modo offline limitado fue probado en dispositivos móviles reales y con pérdida de conectividad.
- Los reportes concilian operaciones online y offline.
- Todos los criterios de aceptación de la sección 39 están cumplidos.
- No existen defectos críticos abiertos y los defectos altos restantes tienen aceptación explícita del propietario.

## 40.10 Regla de avance entre fases

Antes de abrir la siguiente fase debe existir un documento de cierre con:

- Lista de entregables terminados.
- Enlaces a pull requests y migraciones.
- Evidencia de CI y E2E.
- Evidencia de staging.
- Riesgos residuales.
- Issues diferidos y fase destino.
- Confirmación del propietario del producto.

El agente de IA no puede autodeclarar una fase como completa. Puede preparar la evidencia, pero el propietario aprueba el gate.

# 41. KPIs de lanzamiento

Primeros 90 días:

- Conversión catálogo → borrador: objetivo inicial 8%.
- Borrador → registro: 35%.
- Registro con preview → checkout: 12%.
- Checkout → pago confirmado: 65%.
- Pago → publicación: 80%.
- Publicación → primer RSVP: 70%.
- Tiempo medio pago → publicación: menor a 24 horas.
- Soporte: menos de 1.5 tickets por evento pagado.
- Tasa de reembolso: menor a 5%.
- Tasa de webhooks procesados sin intervención: superior a 99%.

Estos valores son objetivos iniciales y deben revisarse con datos reales.

---

# 42. Riesgos y mitigaciones

| Riesgo                             | Mitigación                                        |
| ---------------------------------- | ------------------------------------------------- |
| Alcance grande por todos los tipos | Perfiles configurables y plantillas reutilizables |
| Exceso de personalización          | Editor por secciones y tokens validados           |
| Costos de almacenamiento           | Cuotas, variantes, deduplicación y retención      |
| Pagos desincronizados              | Webhooks firmados, idempotencia y conciliación    |
| Abuso de RSVP                      | Tokens, rate limit y CAPTCHA adaptativo           |
| Pérdida de datos                   | Backups y pruebas de restauración                 |
| Mala conectividad en eventos       | Modo offline limitado y búsqueda manual           |
| Fuga de datos en analytics         | Prohibición de PII y tokens                       |
| Dependencia de proveedores         | Interfaces de infraestructura y S3 compatibility  |
| Plantillas rotas por cambios       | Versiones inmutables y migraciones explícitas     |
| Soporte elevado                    | Preview real, onboarding y validaciones claras    |

---

# 43. Decisiones de arquitectura y registro ADR

## 43.1 Decisiones aceptadas para iniciar

Las siguientes decisiones quedan cerradas por esta versión. Deben materializarse como archivos ADR en `docs/adr/` durante la Fase 0.

### ADR-001 — Domain and route strategy

Estado: `accepted`.

- Dominio principal: `lazonube.com`.
- `www.lazonube.com` redirige al dominio canónico.
- Marketing, invitaciones, dashboard, admin y API comparten origen.
- Rutas principales: `/`, `/templates`, `/invitation/:slug`, `/app`, `/admin` y `/api/v1`.
- Auth utiliza `/api/auth/**`.
- Media pública utiliza `media.lazonube.com`.
- Las URLs firmadas de R2 utilizan el endpoint S3 nativo, no el dominio público.
- No se crea `api.lazonube.com` en V1.

### ADR-002 — Invitation content schema

Estado: `accepted`.

`InvitationVersion.contentJson` almacena exclusivamente presentación editable y referencias semánticas. No duplica invitados, pagos, órdenes ni estados operativos.

Contrato base:

```ts
const invitationContentV1Schema = z.object({
  schemaVersion: z.literal(1),
  global: z.object({
    locale: z.string(),
    themeOverrides: themeOverridesSchema.optional(),
  }),
  sections: z.array(
    z.discriminatedUnion('type', [
      heroSectionSchema,
      countdownSectionSchema,
      messageSectionSchema,
      detailsSectionSchema,
      itinerarySectionSchema,
      gallerySectionSchema,
      dressCodeSectionSchema,
      giftsSectionSchema,
      lodgingSectionSchema,
      transportSectionSchema,
      faqSectionSchema,
      contactSectionSchema,
      rsvpSectionSchema,
    ]),
  ),
})
```

Cada sección contiene:

- `id`: ULID estable dentro de la invitación.
- `type`: tipo semántico permitido.
- `rendererKey`: renderer registrado en código.
- `enabled`: boolean.
- `order`: integer.
- `content`: objeto validado por tipo.
- `settings`: configuración validada y limitada.

Reglas:

- Media se referencia mediante `assetId`, nunca mediante ruta arbitraria.
- Segmentos y fechas operativas se resuelven desde el dominio `Events` al ensamblar el DTO público.
- No se guardan HTML, JavaScript, Vue components, Tailwind classes o URLs no sanitizadas.
- Todo cambio incompatible crea `schemaVersion` nuevo y migrador explícito.

### ADR-003 — Media processing baseline

Estado: `accepted`.

- Sharp procesa imágenes en el worker.
- Original máximo: 12 MB y 12,000 × 12,000 px.
- Salidas iniciales: AVIF y WebP, con fallback cuando sea necesario.
- Variantes iniciales: `cover-1600`, `gallery-1200` y `thumb-400`.
- EXIF y geolocalización se eliminan mediante decodificación y recodificación.
- La concurrencia del worker de media comienza en 2 y se ajusta por memoria/CPU.
- FFmpeg solo se instala en el worker que procese audio.

### ADR-004 — Queue abstraction

Estado: `accepted`.

- Proveedor inicial: pg-boss sobre PostgreSQL.
- El dominio depende de una interfaz `QueueClient`, no de pg-boss directamente.
- Los payloads contienen `jobVersion`, `correlationId` e IDs mínimos.
- Los processors viven en un registry separado del caso de uso.
- Migrar a Redis/BullMQ requiere métricas y nuevo ADR.

### ADR-005 — Public cache invalidation

Estado: `accepted`.

- Assets derivados usan nombres inmutables y caché larga.
- DTO público usa ETag basado en `invitationVersionId`.
- La invitación pública usa caché CDN corta con revalidación.
- Publicar, pausar, reanudar o restaurar encola `InvalidatePublicInvitationCache`.
- Nunca se comparte caché entre contextos privados de grupos.

### ADR-010 — PostgreSQL testing strategy

Estado: `accepted`.

- Local y CI usan PostgreSQL 18.
- GitHub Actions usa service container `postgres:18-alpine`.
- Integration tests aplican migraciones reales.
- No se usa SQLite.
- Tests de concurrencia usan transacciones reales y conexiones separadas.

### ADR-011 — Better Auth and MFA

Estado: `accepted`.

- Better Auth se integra mediante Nitro y Prisma adapter.
- Modelos base: user, session, account y verification generados/revisados antes de la primera migración.
- Email/password y Google OAuth se habilitan en Fase 1.
- Las sesiones viven en PostgreSQL y cookies `httpOnly`.
- El rol de plataforma pertenece al model de dominio del usuario.
- MFA se habilita obligatoriamente para roles administrativos antes de producción.
- Cambios sensibles requieren sesión reciente.

### ADR-012 — ULID strategy

Estado: `accepted`.

- Entidades de negocio usan `String @id @default(ulid()) @db.VarChar(26)`.
- Foreign keys usan `String @db.VarChar(26)`.
- Los IDs son opacos y no sustituyen autorización.
- Better Auth puede conservar el formato requerido por su adapter si una actualización lo exige; cualquier excepción queda documentada.
- No mezclar UUID, autoincrement y ULID dentro del mismo módulo sin justificación.

### ADR-013 — Transactional enqueue

Estado: `accepted`.

- Para efectos críticos se utilizará transactional outbox como patrón por defecto.
- La transacción de dominio inserta el estado y un registro `OutboxEvent`.
- Un dispatcher idempotente convierte outbox events en jobs pg-boss.
- El evento se marca publicado solo después de encolar correctamente.
- Se permiten jobs directos únicamente cuando perder el job no deja el dominio en estado inconsistente.

### ADR-014 — PostgreSQL connections and pooling

Estado: `accepted`.

- Prisma 7 usa `@prisma/adapter-pg` y el driver `pg` en runtime Node.
- Web y worker usan pools separados y límites configurables.
- `DATABASE_URL` se usa para runtime dentro de Railway private networking cuando esté disponible.
- `DIRECT_DATABASE_URL` se reserva para migraciones si el proveedor lo requiere.
- El número máximo de conexiones se calcula considerando réplicas web, worker, CI y procesos de migración.
- No se incrementan réplicas sin revisar el connection budget.

### ADR-015 — Job payload versioning

Estado: `accepted`.

- Todo job persistente incluye `jobVersion` integer.
- El processor soporta la versión actual y al menos la anterior durante despliegues compatibles.
- Cambios incompatibles crean un job name o version nueva.
- No se eliminan processors antiguos hasta verificar que no existen jobs pendientes.

## 43.2 ADRs que siguen pendientes por depender de negocio o fases posteriores

- ADR-006: formato criptográfico final del manifiesto offline, antes de Fase 7.
- ADR-007: política comercial de cancelaciones y reembolsos, antes de Fase 4.
- ADR-008: reglas legales finales de retención en México, antes de Fase 6.
- ADR-009: integración de dominio personalizado, antes de implementar el add-on.

## 43.3 Regla de ADR

- Todo ADR utiliza el formato `Context`, `Decision`, `Consequences`, `Alternatives` y `Status`.
- Un ADR aceptado no se edita para cambiar su decisión; se crea uno nuevo que lo reemplaza.
- Un ADR no debe cambiar la visión ni las reglas centrales sin actualizar este archivo.

# 44. Definición de terminado

## 44.1 Definition of Done de una tarea

Una tarea está terminada cuando:

- Cumple sus criterios de aceptación y reglas de negocio.
- Tiene autorización y policy cuando corresponde.
- Tiene validación Zod en servidor.
- Tiene estados loading, empty, success y error cuando existe interfaz.
- Es responsive y cumple accesibilidad aplicable.
- Tiene pruebas unitarias o de integración proporcionales al riesgo.
- Una corrección de bug incluye prueba de regresión.
- Actualiza contratos y OpenAPI si cambia API.
- Actualiza Prisma Schema y migración si cambia datos.
- Incluye mapper o DTO si expone datos.
- No introduce PII, secretos o tokens en logs y analytics.
- No rompe compatibilidad sin estrategia expand-contract.
- Considera idempotencia, concurrencia y retries.
- Considera web, worker, outbox y cron cuando corresponda.
- Usa nombres de código en inglés.
- Pasa CI.
- Fue desplegada y verificada en staging cuando afecta un flujo ejecutable.
- Está documentada y no deja TODO sin issue.

## 44.2 Definition of Done de una feature

Además de cumplir todas sus tareas:

- Existe un flujo de usuario completo, no únicamente componentes aislados.
- Los roles permitidos y prohibidos están probados.
- Los errores de proveedor tienen comportamiento definido.
- Los eventos analíticos no contienen PII.
- Existen estados vacíos y recuperación ante errores.
- Se actualizó el runbook si la feature requiere operación o soporte.
- Existe compatibilidad con datos y releases anteriores.
- El propietario validó el comportamiento en staging.

## 44.3 Definition of Done de una fase

Una fase está completa cuando:

- Todos sus entregables obligatorios están terminados.
- Su gate de salida de la sección 40 está satisfecho.
- No existen defectos críticos abiertos.
- Los defectos altos están resueltos o aceptados explícitamente con issue y fecha objetivo.
- CI, E2E y staging tienen evidencia.
- Las migraciones fueron aplicadas en staging desde una base limpia y desde la versión anterior.
- Los runbooks y documentación fueron actualizados.
- Los riesgos residuales y trabajo diferido están registrados.
- El propietario del producto aprueba el cierre.

## 44.4 Evidencia mínima de cierre

Cada fase debe producir `docs/releases/phase-<number>-closure.md` con:

```text
Status
Scope completed
Pull requests
Database migrations
Automated test evidence
Staging evidence
Security and privacy review
Known issues
Deferred work
Rollback notes
Owner approval
```

El agente de IA puede generar y mantener este documento, pero no puede registrar la aprobación del propietario sin confirmación explícita.

# 45. Fuentes técnicas verificadas

Consultadas el 2026-07-13. Deben revisarse nuevamente antes de actualizar versiones mayores o contratar planes.

## Runtime y base de datos

- Node.js releases: https://nodejs.org/en/about/previous-releases
- PostgreSQL versioning policy: https://www.postgresql.org/support/versioning/

## Nuxt y Nitro

- Nuxt 4 documentation: https://nuxt.com/docs/4.x
- Nuxt server directory: https://nuxt.com/docs/4.x/directory-structure/server
- Nuxt server engine: https://nuxt.com/docs/4.x/guide/concepts/server-engine
- Nuxt deployment: https://nuxt.com/docs/4.x/getting-started/deployment

## Prisma

- Prisma Nuxt guide: https://www.prisma.io/docs/guides/frameworks/nuxt
- Prisma Migrate: https://www.prisma.io/docs/orm/prisma-migrate
- Development and production migrations: https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production
- Prisma transactions: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- Unsupported database features and custom SQL migrations: https://www.prisma.io/docs/orm/prisma-migrate/workflows/unsupported-database-features

## Autenticación

- Better Auth documentation: https://www.better-auth.com/docs
- Better Auth Nuxt integration: https://www.better-auth.com/docs/integrations/nuxt
- Better Auth Nitro integration: https://better-auth.com/docs/integrations/nitro
- Better Auth basic usage: https://better-auth.com/docs/basic-usage

## GitHub Actions

- Node.js workflows: https://docs.github.com/actions/automating-builds-and-tests/building-and-testing-nodejs
- PostgreSQL service containers: https://docs.github.com/actions/guides/creating-postgresql-service-containers
- Environments: https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment
- Secrets: https://docs.github.com/actions/security-guides/using-secrets-in-github-actions

## Railway

- Railway documentation: https://docs.railway.com
- Nuxt deployment: https://docs.railway.com/guides/nuxt
- PostgreSQL: https://docs.railway.com/databases/postgresql
- Cron jobs: https://docs.railway.com/cron-jobs
- Workers and queues guidance: https://docs.railway.com/guides/cron-workers-queues
- Railway pricing: https://railway.com/pricing

## Queue

- pg-boss repository and documentation: https://github.com/timgit/pg-boss

## Desarrollo local S3

- LocalStack installation: https://docs.localstack.cloud/aws/getting-started/installation/
- LocalStack S3: https://docs.localstack.cloud/aws/services/s3/

## Cloudflare R2

- R2 architecture: https://developers.cloudflare.com/r2/how-r2-works/
- R2 pricing: https://developers.cloudflare.com/r2/pricing/
- R2 public buckets: https://developers.cloudflare.com/r2/buckets/public-buckets/
- R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- R2 direct uploads: https://developers.cloudflare.com/r2/objects/upload-objects/
- R2 S3 compatibility: https://developers.cloudflare.com/r2/api/s3/api/

## Integraciones

- Mercado Pago Webhooks: https://www.mercadopago.com.mx/developers/en/docs/your-integrations/notifications/webhooks
- Mercado Pago idempotency and Checkout documentation: https://www.mercadopago.com.mx/developers/
- Resend documentation: https://resend.com/docs/introduction
- Resend Node SDK examples: https://resend.com/docs/api-reference/emails/send-email
- PostHog product analytics: https://posthog.com/docs/product-analytics
- PostHog feature flags: https://posthog.com/docs/feature-flags
- Sentry JavaScript documentation: https://docs.sentry.io/platforms/javascript/

## Regla de verificación

- Preferir documentación oficial y repositorios primarios.
- No fijar planes o precios externos como verdad permanente.
- Registrar en ADR cualquier cambio importante motivado por una actualización de proveedor.

---

# 46. Resumen obligatorio para agentes

Antes de modificar LazoNube, recordar:

1. Todos los tipos de evento existen desde V1.
2. La variación por tipo se resuelve con configuración, no duplicación.
3. LazoNube es un monolito modular full-stack en un solo repositorio.
4. Nuxt atiende interfaz y API mediante Nitro.
5. Prisma solo puede utilizarse en código de servidor.
6. El navegador nunca accede directamente a PostgreSQL.
7. Las rutas API son delgadas; services y policies contienen las reglas.
8. Los contratos compartidos se definen con Zod.
9. Todo el código, archivos, variables, modelos, rutas técnicas y tests se escriben en inglés.
10. Los archivos viven en object storage, no en disco local de producción.
11. Los originales son privados; los derivados sanitizados pueden ser públicos.
12. Los clientes editan antes de pagar.
13. Los pagos se activan por webhook validado, no por redirect.
14. Las funciones se controlan por entitlements, no por strings de plan.
15. Invitaciones, plantillas y respuestas críticas tienen historial.
16. Los tokens se hashean.
17. Las operaciones críticas son idempotentes y transaccionales.
18. Ningún dato personal debe llegar a analytics o logs sin necesidad.
19. Todo endpoint de escritura requiere Policy.
20. Los objetos Prisma no se exponen como DTO.
21. Prisma Migrate administra el esquema; `db push` no se usa en producción.
22. Web, worker y cron comparten repositorio, modelos y release.
23. Las tareas pesadas se ejecutan en worker mediante pg-boss.
24. PostgreSQL funciona como base principal y cola inicial.
25. Redis solo se agrega cuando métricas y ADR lo justifiquen.
26. R2 se contrata directamente y se accede mediante AWS SDK S3-compatible.
27. Producción se despliega inicialmente en Railway con servicios `web`, `worker`, `cron` y PostgreSQL.
28. Cloudflare administra DNS, WAF y entrega de medios.
29. La API permanece versionada bajo `/api/v1` aunque sea del mismo origen.
30. Todo cambio de contrato actualiza Zod, pruebas y OpenAPI cuando corresponda.
31. Todo cambio de datos actualiza Prisma Schema, migración, factories y pruebas.
32. La interfaz utiliza npm y `package-lock.json` exclusivamente.
33. No se introducen microservicios, otro backend independiente o acceso directo a DB sin ADR.
34. Simplificar infraestructura no significa mezclar responsabilidades.
35. El desarrollo se ejecuta por fases y ninguna fase cierra sin superar su gate de salida.
36. `develop` despliega staging y `main` representa producción.
37. Local y CI utilizan PostgreSQL 18; Node.js utiliza la línea 24 LTS.
38. Los efectos críticos se coordinan mediante transactional outbox.
39. La beta comercial requiere completar las fases 0 a 5; V1 completa requiere la fase 7.

---
