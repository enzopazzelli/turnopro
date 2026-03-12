# FLUJOS.md — Documentacion completa de flujos y configuracion de TurnoPro

---

## Indice

1. [Autenticacion y Multi-Tenant](#1-autenticacion-y-multi-tenant)
2. [Agenda y Calendario](#2-agenda-y-calendario)
3. [Gestion de Pacientes / CRM](#3-gestion-de-pacientes--crm)
4. [Pagina Publica y Reserva de Turnos](#4-pagina-publica-y-reserva-de-turnos)
5. [Notificaciones](#5-notificaciones)
6. [Modulos por Rubro](#6-modulos-por-rubro)
7. [Dashboard y Reportes](#7-dashboard-y-reportes)
8. [Facturacion y Pagos](#8-facturacion-y-pagos)
9. [Variables de Entorno](#9-variables-de-entorno)
10. [Migraciones SQL](#10-migraciones-sql)
11. [Mapa de Integracion entre Modulos](#11-mapa-de-integracion-entre-modulos)

---

## 1. Autenticacion y Multi-Tenant

### Flujo de Registro (2 pasos)

1. El usuario navega a `/registro`.
2. **Paso 1 — Datos personales:** ingresa nombre completo, email y contrasena.
3. **Paso 2 — Consultorio:** ingresa nombre del consultorio, slug (URL publica) y selecciona el rubro (odontologia, medicina, abogados, veterinaria, psicologia, contadores).
4. Al enviar:
   - Validacion client-side con `registroSchema` (Zod).
   - Crea usuario en Supabase Auth con `signUp()`.
   - Llama al RPC `registrar_profesional()` (SECURITY DEFINER) que crea atomicamente: tenant + user + professional.
   - Redirige a `/dashboard` si todo es exitoso.
   - Muestra error si el email ya existe o el slug esta en uso.

### Flujo de Login

1. El usuario navega a `/login`.
2. Ingresa email y contrasena.
3. Validacion con `loginSchema`.
4. Llama a `supabase.auth.signInWithPassword()`.
5. Exito: redirige a `/dashboard`. Error: muestra "Email o contrasena incorrectos".

### Flujo de Logout

1. El usuario hace clic en el boton de cerrar sesion.
2. Ejecuta `cerrarSesion()` (server action).
3. Limpia el estado de auth (Zustand store).
4. Redirige a `/login`.

### Modelo Multi-Tenant

- Cada profesional/consultorio es un **tenant** con un `slug` unico (ej: `/dr-martinez`).
- Todas las tablas tienen columna `tenant_id` con **Row Level Security (RLS)** que filtra por `get_tenant_id_for_user()`.
- Un tenant puede tener multiples usuarios (profesional, secretaria).
- El aislamiento es total: ningun usuario puede ver datos de otro tenant.

### Roles

| Rol | Permisos |
|-----|----------|
| `profesional` | Acceso completo al dashboard, servicios, horarios, pacientes, configuracion |
| `secretaria` | Gestion de turnos y pagos (permisos limitados) |
| `paciente` | Reserva de turnos desde pagina publica, historial propio |
| `superadmin` | Gestion global de la plataforma (pendiente Step 10) |

### Proteccion de Rutas

- **Middleware** (`src/middleware.js`): intercepta cada request, actualiza la sesion de Supabase SSR.
- Rutas `/dashboard/*` requieren autenticacion; si no hay sesion, redirige a `/login`.
- Rutas `/login` y `/registro` redirigen a `/dashboard` si el usuario ya esta autenticado.

### Gestion de Sesion (Client-Side)

- **AuthProvider** (`components/layout/auth-provider.jsx`): envuelve el layout del dashboard.
  - Al montar: carga datos iniciales del usuario desde server component.
  - Suscribe a `supabase.auth.onAuthStateChange()` para detectar `SIGNED_OUT` (limpia estado + redirige) y `TOKEN_REFRESHED` (refresca router).
- **Zustand Auth Store** (`stores/auth-store.js`): almacena `usuario`, `tenant`, `profesional`, `cargando`.
- **useUser Hook** (`hooks/use-user.js`): lee del store y deriva `rol`, `esProfesional`, `esSecretaria`, `nombreCompleto`, `iniciales`.

### Archivos clave

| Archivo | Funcion |
|---------|---------|
| `src/app/(auth)/actions.js` | Server actions: `iniciarSesion`, `registrarse`, `cerrarSesion` |
| `src/stores/auth-store.js` | Estado global de autenticacion |
| `src/hooks/use-user.js` | Hook para acceder a datos del usuario |
| `src/components/layout/auth-provider.jsx` | Provider que inicializa auth |
| `src/middleware.js` | Proteccion de rutas + sesion SSR |
| `supabase/migrations/001_auth_multitenant.sql` | Tablas: tenants, users, professionals + RPC |

---

## 2. Agenda y Calendario

### Vista del Calendario

1. El profesional navega a `/dashboard/agenda`.
2. La pagina server carga: citas de 3 meses (anterior, actual, siguiente), servicios activos, citas de hoy.
3. El cliente renderiza:
   - **react-big-calendar** con vistas semana/mes/dia (locale en espanol).
   - Slots de 15 minutos, rango horario 7:00 - 21:00.
   - Eventos coloreados segun el servicio asignado.
   - **Sala de Espera** en panel lateral derecho (visible en pantallas grandes).

### Crear una Cita

1. El usuario hace clic en un slot vacio del calendario o en el boton "Nueva cita".
2. Se abre `CitaDialog` con fecha/hora pre-llenadas (si se hizo clic en un slot).
3. El usuario:
   - Busca y selecciona un paciente existente (autocomplete con debounce) o ingresa nombre manualmente.
   - Selecciona un servicio (auto-calcula `hora_fin` segun `duracion_minutos` del servicio).
   - Confirma fecha, hora de inicio, hora de fin.
   - Agrega notas opcionales.
4. Al enviar:
   - Valida con `citaSchema` (Zod).
   - Verifica solapamiento de horarios (misma fecha + mismo profesional + rango de hora superpuesto).
   - Inserta en BD con `tenant_id` + `professional_id`.
   - Dispara notificacion `cita_creada` al paciente.
   - Cierra dialog y muestra toast de exito.

### Editar una Cita

1. Clic en un evento del calendario.
2. `CitaDialog` se abre en modo edicion con todos los campos pre-llenados.
3. Se pueden cambiar todos los campos incluyendo el estado.
4. Al enviar: misma validacion + verificacion de solapamiento (excluyendo la cita actual).
5. Si el servicio tiene precio > 0, se muestra un **resumen de pagos** (precio del servicio / total pagado / restante) con boton "Registrar pago".

### Sala de Espera (Panel de Hoy)

La Sala de Espera muestra las citas del dia actual ordenadas por hora, con transiciones de estado rapidas:

| Estado actual | Boton disponible | Siguiente estado |
|---------------|-----------------|-----------------|
| Pendiente | Confirmar | Confirmada |
| Confirmada | Iniciar | En curso |
| En curso | Completar | Completada |
| Completada | Cobrar | (abre dialog de pago) |

Cada cita muestra:
- Nombre del paciente, rango horario, servicio con indicador de color.
- Badge de estado de la cita.
- Badge de estado de pago (pendiente/parcial/pagado) si el servicio tiene precio.

### Gestion de Servicios

1. El profesional navega a `/dashboard/servicios`.
2. Tabla con todos los servicios del tenant.
3. Columnas: nombre, color, precio, duracion (minutos), toggle activo/inactivo.
4. Acciones: crear (ServicioDialog), editar, eliminar, activar/desactivar.
5. Los servicios se usan en citas y en la pagina publica de reserva.

### Gestion de Horarios (Disponibilidad)

1. El profesional navega a `/dashboard/horarios`.
2. Si no existen registros, se auto-inicializan los 7 dias (lunes-domingo).
3. Editor semanal: cada dia tiene un toggle (activo/inactivo) + hora inicio + hora fin.
4. Al guardar: actualiza los 7 registros en la BD.
5. La disponibilidad se usa en la pagina publica para generar slots reservables.

### Fechas Bloqueadas

- Se pueden crear fechas bloqueadas (vacaciones, feriados) con motivo opcional.
- Esas fechas se excluyen del calendario de reserva publica.
- CRUD desde una seccion dedicada.

### Archivos clave

| Archivo | Funcion |
|---------|---------|
| `src/components/agenda/agenda-cliente.jsx` | Wrapper de react-big-calendar |
| `src/components/agenda/cita-dialog.jsx` | Formulario crear/editar cita + resumen pagos |
| `src/components/agenda/sala-espera.jsx` | Panel de citas de hoy + cobro |
| `src/components/agenda/estado-badge.jsx` | Badge con color por estado |
| `src/app/(dashboard)/actions/citas.js` | CRUD + cambio estado + notificaciones |
| `src/app/(dashboard)/actions/servicios.js` | CRUD servicios |
| `src/app/(dashboard)/actions/disponibilidad.js` | Guardar/inicializar disponibilidad |
| `src/stores/agenda-store.js` | Estado: vista, fecha, dialog |

---

## 3. Gestion de Pacientes / CRM

### Lista de Pacientes

1. El usuario navega a `/dashboard/pacientes`.
2. Carga todos los pacientes activos del tenant (ordenados por nombre).
3. Interfaz:
   - Buscador con debounce (busca en nombre, email, telefono, DNI via pg_trgm).
   - Filtros por etiqueta (badges toggle).
   - Tabla: nombre, telefono, email, obra social (si aplica), etiquetas, acciones.
   - Clic en una fila navega al detalle del paciente.

### Crear/Editar Paciente

1. Boton "Nuevo paciente" o icono de edicion.
2. `PacienteDialog` con campos adaptativos segun el rubro:

| Campo | Odonto/Medicina/Psico | Abogados/Contadores | Veterinaria |
|-------|----------------------|--------------------|----|
| nombre_completo | Si | Si | Si |
| telefono, email, dni, direccion | Si | Si | Si |
| genero | Si | No | No |
| fecha_nacimiento | Si | No | Si |
| obra_social, numero_afiliado | Si | No | No |
| etiquetas | Si (rubro-specific) | Si | Si |
| notas | Si | Si | Si |

3. Al enviar: inserta/actualiza con `tenant_id`.

### Eliminar Paciente

- Soft delete: marca `activo = false`.
- El paciente no aparece en la lista pero los datos se conservan.

### Detalle de Paciente

1. Navegar a `/dashboard/pacientes/[id]`.
2. Header: avatar con iniciales, nombre, etiquetas, botones "Agendar cita" y "Editar".
3. Tabs:

| Tab | Contenido |
|-----|-----------|
| **Informacion** | Datos personales + cobertura medica (si aplica) + notas |
| **Historial** | Tabla con todas las citas (fecha, hora, servicio, estado, notas) |
| **Cuenta Corriente** | Resumen de saldo + tabla de movimientos (cargos/abonos) + boton "Cobrar" |
| **Archivos** | Placeholder para futura gestion de documentos |

### Adaptacion por Rubro

La configuracion CRM se define en `src/config/rubros.js`, con un objeto `crm` por rubro:

```
crm: {
  terminoPlural: "Pacientes" | "Clientes" | "Tutores",
  campos: { obra_social, numero_afiliado, genero, fecha_nacimiento },
  etiquetas: ["VIP", "Urgente", ...],
  columnaExtra: "Obra social" | null
}
```

- El sidebar muestra dinamicamente el termino correcto (Pacientes/Clientes/Tutores).
- Los formularios y tablas muestran/ocultan campos segun `campos`.
- Las etiquetas disponibles cambian por rubro.

### Archivos clave

| Archivo | Funcion |
|---------|---------|
| `src/components/pacientes/pacientes-cliente.jsx` | Lista con busqueda y filtros |
| `src/components/pacientes/paciente-dialog.jsx` | Formulario adaptativo por rubro |
| `src/components/pacientes/paciente-detalle.jsx` | Detalle con tabs (info, historial, cuenta corriente, archivos) |
| `src/app/(dashboard)/actions/pacientes.js` | CRUD + busqueda full-text |
| `src/config/rubros.js` | Configuracion CRM por rubro |
| `src/hooks/use-rubro.js` | Hook para acceder a config del rubro del tenant |

---

## 4. Pagina Publica y Reserva de Turnos

### Perfil Publico del Profesional

1. Cualquier persona (sin autenticacion) visita `/{slug}` (ej: `/dr-martinez`).
2. La pagina muestra:
   - Avatar, nombre, especialidad, biografia del profesional.
   - Grilla de servicios activos (color, duracion, precio).
   - Horario semanal de disponibilidad.
   - Boton "Reservar turno" (CTA).
3. Acceso anonimo: RLS permite lectura publica de professionals, servicios, disponibilidad.
4. Metadata SEO generada dinamicamente (titulo, descripcion).

### Wizard de Reserva (5 pasos)

Al hacer clic en "Reservar turno", navega a `/{slug}/reservar`:

**Paso 1 — Seleccionar Servicio:**
- Grilla de cards clickeables con nombre, duracion, precio y color del servicio.
- Al seleccionar uno, avanza al paso 2.

**Paso 2 — Seleccionar Fecha:**
- Calendario (react-day-picker) con dias deshabilitados:
  - Fechas pasadas.
  - Dias sin disponibilidad (ej: si domingos esta inactivo).
  - Fechas bloqueadas (vacaciones del profesional).
- Al seleccionar una fecha, avanza al paso 3.

**Paso 3 — Seleccionar Horario:**
- Genera slots de tiempo disponibles para la fecha seleccionada.
- Filtra horarios ocupados (citas existentes) y bloqueados.
- Muestra skeleton loading mientras carga.
- Grilla de botones con cada horario disponible.

**Paso 4 — Datos del Cliente:**
- Formulario:
  - Nombre completo (requerido).
  - Telefono, email, notas (opcionales).
- La terminologia se adapta al rubro (Paciente/Cliente/Tutor).

**Paso 5 — Confirmacion:**
- Resumen: servicio, fecha, hora, datos del cliente.
- Boton "Confirmar reserva" con `useActionState`.
- Al confirmar: llama al RPC `crear_cita_publica()` (SECURITY DEFINER, valida todo server-side).
- Exito: pantalla de "Reserva confirmada" con opcion "Reservar otro turno".
- Envia notificacion `reserva_nueva` al profesional (in-app) y al paciente (email si configurado).

### Transiciones animadas

- Cada paso tiene transiciones con `AnimatePresence` (Framer Motion).
- Indicador de progreso visual de 5 pasos con checkmarks.

### Seguridad

- RPC `crear_cita_publica()` es SECURITY DEFINER: ejecuta con permisos elevados.
- Valida: disponibilidad, solapamiento, fecha no bloqueada, servicio activo.
- El paciente anonimo nunca tiene acceso directo a las tablas.

### Archivos clave

| Archivo | Funcion |
|---------|---------|
| `src/app/(public)/[slug]/page.js` | Perfil publico con SEO |
| `src/app/(public)/[slug]/reservar/page.js` | Pagina del wizard de reserva |
| `src/components/publica/asistente-reserva.jsx` | Orquestador del wizard |
| `src/components/publica/paso-*.jsx` | Componentes de cada paso (5 archivos) |
| `src/stores/reserva-store.js` | Estado del wizard (Zustand) |
| `src/app/(public)/actions/reserva.js` | Server actions: obtenerDatos, obtenerSlots, crearReserva |

---

## 5. Notificaciones

### Canales Disponibles

| Canal | Tecnologia | Estado |
|-------|-----------|--------|
| **In-App** | Supabase Realtime + Zustand | Funcional |
| **Email** | Resend (API) | Funcional (requiere RESEND_API_KEY) |
| **WhatsApp** | HTTP POST a servicio externo | Scaffold (requiere WHATSAPP_API_URL) |

### Tipos de Notificacion

| Tipo | Trigger | Destinatario |
|------|---------|-------------|
| `cita_creada` | Al crear una cita | Paciente |
| `cita_confirmada` | Al confirmar una cita | Paciente |
| `cita_cancelada` | Al cancelar una cita | Paciente |
| `cita_modificada` | Al editar una cita | Paciente |
| `recordatorio_24h` | Cron automatico (24h antes) | Paciente |
| `recordatorio_2h` | Cron automatico (2h antes) | Paciente |
| `reserva_nueva` | Al recibir reserva publica | Profesional |
| `pago_registrado` | Al registrar un pago | Profesional (in-app) |
| `general` | Manual / sistema | Variable |

### Panel de Notificaciones In-App

1. El profesional hace clic en el icono de campana (topbar).
2. Popover muestra:
   - Ultimas notificaciones en ScrollArea.
   - Boton "Marcar todas leidas" (si hay no leidas).
   - Link a la pagina completa de historial.
3. Cada notificacion muestra: icono por tipo (coloreado), titulo, mensaje, tiempo relativo, punto azul si no leida.
4. Al hacer clic en una notificacion: se marca como leida.
5. Nuevas notificaciones llegan en **tiempo real** via Supabase Realtime + toast de sonner.

### Historial de Notificaciones

- Pagina `/dashboard/notificaciones`.
- Lista completa con filtros por tipo y canal.
- Paginacion para historial extenso.

### Configuracion de Notificaciones

Ruta: `/dashboard/configuracion` > tab "Notificaciones".

Opciones configurables:

| Opcion | Default | Descripcion |
|--------|---------|-------------|
| Email habilitado | Si | Toggle global para canal email |
| WhatsApp habilitado | No | Toggle global para canal WhatsApp |
| Recordatorio 24h | Si | Enviar recordatorio 24h antes de la cita |
| Recordatorio 2h | No | Enviar recordatorio 2h antes de la cita |
| Toggles por tipo | Todos activos | Activar/desactivar cada tipo de notificacion por canal |

La configuracion se guarda en `tenant.configuracion.notificaciones` (campo JSONB en tabla tenants).

### Cron de Recordatorios Automaticos

- Endpoint: `/api/cron/recordatorios`.
- Configurado en `vercel.json` para ejecutarse cada 30 minutos.
- Flujo:
  1. Valida `CRON_SECRET` del header.
  2. Usa cliente Supabase con service role key (bypass RLS).
  3. Llama RPC `obtener_citas_para_recordatorio(horas)` para citas a 24h y 2h.
  4. Para cada cita: verifica config del tenant, genera plantilla, inserta notificacion, envia email + whatsapp.

### Flujo interno de envio (fire-and-forget)

```
notificar(opciones) →
  1. Genera plantilla (titulo + mensaje) segun tipo
  2. Lee configuracion del tenant
  3. Determina canales activos (in_app siempre si hay usuario_id; email/whatsapp segun config)
  4. Para cada canal:
     a. Inserta registro en BD via RPC crear_notificacion_sistema
     b. Si es email: enviarEmail() via Resend
     c. Si es WhatsApp: enviarWhatsApp() via HTTP POST
     d. Actualiza estado de la notificacion (enviada/fallida)
  5. Nunca lanza error (fire-and-forget)
```

### Archivos clave

| Archivo | Funcion |
|---------|---------|
| `src/lib/notificaciones/servicio.js` | `notificar()` — funcion principal |
| `src/lib/notificaciones/plantillas.js` | Genera titulo + mensaje por tipo |
| `src/lib/notificaciones/canales.js` | Dispatcher email/whatsapp + HTML email |
| `src/lib/notificaciones/email.js` | Envio via Resend |
| `src/lib/notificaciones/whatsapp.js` | Scaffold WhatsApp (POST externo) |
| `src/components/notificaciones/panel-notificaciones.jsx` | Popover campana en topbar |
| `src/components/configuracion/tab-notificaciones.jsx` | Config toggles |
| `src/app/api/cron/recordatorios/route.js` | Cron de recordatorios |
| `src/hooks/use-notificaciones.js` | Hook con carga inicial + Realtime |

---

## 6. Modulos por Rubro

### Arquitectura de Rubros

Al registrarse, el profesional selecciona un rubro. El sistema adapta la plataforma:

1. **Sidebar dinamico:** muestra modulos especificos del rubro despues de los items estaticos.
2. **CRM adaptativo:** campos visibles, etiquetas y terminologia cambian por rubro.
3. **Guard de rubro:** cada pagina de modulo ejecuta `verificarRubro()` server-side; si el rubro no coincide, muestra `RubroNoDisponible`.

### Modulos por Rubro

#### Odontologia

| Modulo | Ruta | Descripcion |
|--------|------|-------------|
| Odontograma | `/dashboard/odontograma` | SVG interactivo con 5 caras por diente. Clic en diente abre popover para cambiar estado (sano, caries, obturado, fractura, sellante). Colores codificados. |
| Planes de Tratamiento | `/dashboard/tratamientos` | CRUD de planes con etapas. Cada plan vinculado a un paciente. Seguimiento de progreso. |
| Historia Dental | `/dashboard/historia-dental` | Historia clinica dental completa por paciente. |

#### Medicina General

| Modulo | Ruta | Descripcion |
|--------|------|-------------|
| Historia Clinica | `/dashboard/historia-clinica` | Registro medico completo del paciente. |
| Signos Vitales | `/dashboard/signos-vitales` | Registro con Recharts LineChart (toggle entre metricas: presion, temperatura, peso, etc.). |
| Recetas | `/dashboard/recetas` | Creacion de recetas con items. Impresion HTML via `window.print()`. |

#### Abogados

| Modulo | Ruta | Descripcion |
|--------|------|-------------|
| Expedientes | `/dashboard/expedientes` | CRUD con detalle en tabs (info, documentos, vencimientos). |
| Documentos | (dentro de expediente) | Upload a Supabase Storage bucket `documentos`. RLS por tenant. |
| Vencimientos | `/dashboard/vencimientos` | Fechas limite legales con alertas de prioridad. |

#### Veterinaria

| Modulo | Ruta | Descripcion |
|--------|------|-------------|
| Mascotas | `/dashboard/mascotas` | Grid de cards con foto, nombre, especie. Detalle en `/dashboard/mascotas/[id]`. |
| Vacunacion | `/dashboard/vacunacion` | Cartilla con alertas de vacunas vencidas. |
| Historial | `/dashboard/historial-mascota` | Consultas expandibles por mascota. |

#### Psicologia

| Modulo | Ruta | Descripcion |
|--------|------|-------------|
| Notas de Sesion | `/dashboard/notas-sesion` | Registro con estado emocional (ansioso, triste, neutro, etc.). |
| Evolucion | `/dashboard/evolucion` | Timeline con Recharts por area (ansiedad, depresion, autoestima). |
| Cuestionarios | `/dashboard/cuestionarios` | PHQ-9 (depresion) y GAD-7 (ansiedad). Scoring automatico con interpretacion. |

#### Contadores

| Modulo | Ruta | Descripcion |
|--------|------|-------------|
| Vencimientos Fiscales | `/dashboard/vencimientos-fiscales` | Filtro por obligacion (IVA, Ganancias, IIBB, Monotributo, etc.). Prioridades con color. |
| Checklists | `/dashboard/checklists` | Documentacion interactiva con barra de progreso. Items check/uncheck. |

### Patron de implementacion

Todos los modulos siguen el mismo patron:
1. **Pagina server** (`page.js`): ejecuta `verificarRubro()`, carga datos iniciales, renderiza componente client.
2. **Componente client** (`"use client"`): usa `useActionState` para formularios, `useTransition` para acciones.
3. **Server actions**: archivo dedicado en `actions/` con CRUD por modulo.
4. **Validaciones**: schema Zod en `lib/validations/rubro-{nombre}.js`.

### Archivos clave

| Archivo | Funcion |
|---------|---------|
| `src/config/rubros.js` | Config completa por rubro (modulos, CRM, iconos, rutas) |
| `src/components/rubro/guard-rubro.jsx` | `verificarRubro()` + componente `RubroNoDisponible` |
| `src/components/rubro/selector-paciente.jsx` | Buscador de pacientes compartido |
| `src/components/layout/sidebar-items.js` | Items estaticos + `getRubroModulos()` |
| `src/components/rubro/{rubro}/*.jsx` | 40+ componentes especificos por rubro |
| `src/app/(dashboard)/actions/{rubro}.js` | 6 archivos de server actions por rubro |
| `src/lib/validations/rubro-*.js` | 6 archivos de schemas Zod por rubro |

---

## 7. Dashboard y Reportes

### Dashboard Principal

1. El profesional navega a `/dashboard`.
2. Selector de periodo: **Hoy** | **Semana** | **Mes** | **Trimestre**.
3. Se muestran 5 tarjetas KPI con animaciones Framer Motion (stagger):

| KPI | Descripcion |
|-----|-------------|
| Citas | Total del periodo + pendientes de hoy |
| Pacientes | Total de pacientes activos |
| Proxima Cita | Siguiente cita pendiente de hoy (nombre, hora, servicio) |
| Ingresos | Total cobrado en el periodo (desde pagos reales, fallback a estimado) |
| Ausentismo | Porcentaje de no-asistio + cantidad |

4. Se muestran 5 graficos (Recharts):

| Grafico | Tipo | Datos |
|---------|------|-------|
| Tendencia de Citas | LineChart | Citas por dia (ultimos 30 dias) |
| Distribucion de Estados | PieChart | Cantidad por estado (pendiente, confirmada, etc.) |
| Servicios Demandados | BarChart | Top 5 servicios mas solicitados |
| Horarios Pico | LineChart | Cantidad de citas por hora (7:00-21:00) |
| Nuevos vs Recurrentes | BarChart (stacked) | Pacientes nuevos vs recurrentes por mes (ultimos 6 meses) |

### Reportes

Ruta: `/dashboard/reportes`.

Selector de rango de fechas con 4 presets (ultima semana, ultimo mes, ultimo trimestre, este ano) + calendario de seleccion manual.

3 tabs de reportes:

#### Tab: Reporte de Citas

- **Cards resumen:** Total, Completadas, Canceladas, No asistio, Tasa de completacion.
- **Tabla:** Todas las citas del periodo con fecha, hora, paciente, servicio, precio, estado (EstadoBadge).
- **Exportar CSV.**

#### Tab: Reporte de Ingresos

- **Cards resumen:** Ingresos totales, Promedio por cita, Citas completadas, Servicio mas rentable.
- **Tabla:** Detalle de ingresos.
  - Si hay pagos registrados: muestra fecha, paciente, servicio, monto, **metodo de pago** (columna extra).
  - Si no hay pagos: fallback a estimado desde precio de servicios en citas completadas.
- **Exportar CSV.**

#### Tab: Reporte de Pacientes

- **Cards resumen:** Total pacientes, Nuevos, Recurrentes, Promedio de visitas.
- **Tabla:** Pacientes con badge nuevo/recurrente, total visitas, completadas, no asistio, primera y ultima visita.
- **Exportar CSV.**

### Exportacion CSV

- Generacion client-side en `lib/exportar-csv.js`.
- BOM + UTF-8 para compatibilidad con Excel.
- Nombre del archivo con prefijo descriptivo.

### Archivos clave

| Archivo | Funcion |
|---------|---------|
| `src/app/(dashboard)/dashboard/page.js` | Pagina del dashboard (client, useState periodo) |
| `src/components/dashboard/dashboard-cliente.jsx` | Layout KPIs + graficos + animaciones |
| `src/app/(dashboard)/actions/analytics.js` | `obtenerDatosAnalytics(periodo)` |
| `src/components/reportes/reportes-cliente.jsx` | Tabs de reportes + selector rango |
| `src/components/reportes/selector-rango-fechas.jsx` | Popover + Calendar + presets |
| `src/components/reportes/tab-reporte-*.jsx` | 3 tabs de reportes |
| `src/app/(dashboard)/actions/reportes.js` | 3 server actions de reportes |
| `src/lib/exportar-csv.js` | Utilidad de exportacion CSV |

---

## 8. Facturacion y Pagos

### 8.1 Metodos de Pago

| Metodo | Clave | Uso tipico |
|--------|-------|------------|
| Efectivo | `efectivo` | Pago en mano |
| Transferencia | `transferencia` | CBU/CVU/alias — anotar N° de operacion en "Referencia" |
| Tarjeta debito | `tarjeta_debito` | Posnet/terminal — referencia = N° de cupon |
| Tarjeta credito | `tarjeta_credito` | Posnet/terminal — anotar cuotas en "Notas" |
| Mercado Pago | `mercado_pago` | Scaffold para cobro online (ver seccion 8.5) |
| Obra social | `obra_social` | Para rubros de salud — referencia = N° de autorizacion |

### 8.2 Puntos de Cobro

Hay 4 lugares desde donde se puede registrar un pago:

| Ubicacion | Ruta/Componente | Pre-llena |
|-----------|----------------|-----------|
| Sala de Espera | `/dashboard/agenda` panel lateral | Cita + paciente + monto del servicio |
| Editar Cita | Dialog de cita (modo edicion) | Cita + paciente + monto del servicio |
| Facturacion | `/dashboard/facturacion` > tab Pagos | Nada (pago libre) |
| Detalle Paciente | `/dashboard/pacientes/[id]` > tab Cuenta Corriente | Paciente |

En todos los casos se abre `PagoDialog` con los campos: monto, metodo de pago, fecha (default hoy), referencia, notas.

### 8.3 Tabla de Pagos

Ruta: `/dashboard/facturacion` > tab "Pagos".

- **3 cards resumen:** Total cobrado, Cantidad de pagos, Metodo mas usado.
- **Filtros:** Rango de fechas (selector con presets), metodo de pago (select).
- **Tabla:** Fecha, Paciente, Servicio, Monto, Metodo (badge), Referencia, Acciones.
- **Acciones por pago:** Generar recibo (icono documento), Anular (icono prohibido).
- **Boton "Registrar pago"** para pagos nuevos.
- **Exportar CSV.**
- Pagos anulados se muestran tachados con badge "Anulado".

### 8.4 Cuenta Corriente

Ruta: `/dashboard/facturacion` > tab "Cuenta Corriente".

Tambien disponible en `/dashboard/pacientes/[id]` > tab "Cuenta Corriente".

**Vista resumen:**
- Lista de pacientes con saldo > 0, ordenados por deuda mayor.
- Cada fila muestra: nombre, total cargos, total pagos, saldo pendiente, boton "Cobrar".
- Expandir una fila muestra los movimientos cronologicos.

**Movimientos:**
- **Cargo:** se genera automaticamente por cada cita con servicio (precio del servicio).
- **Abono:** cada pago registrado no anulado.
- Columnas: Fecha, Tipo (cargo/abono con icono), Concepto, Monto, Saldo acumulado.

**Calculo del saldo:**
```
Saldo = SUM(precio servicios de citas no canceladas) - SUM(pagos no anulados)
```

La vista `cuenta_corriente_pacientes` en PostgreSQL calcula esto automaticamente.

### 8.5 Recibos PDF

**Generar un recibo:**
1. Desde la tabla de pagos, clic en icono de documento en un pago.
2. Se crea un registro en tabla `recibos` con numero secuencial por tenant.
3. El recibo guarda un snapshot JSONB (`datos_recibo`) con todos los datos al momento de la emision (tenant, paciente, pago, servicio, cita).

**Descargar PDF:**
1. Desde la tab "Recibos" en `/dashboard/facturacion`.
2. Tabla con todos los recibos: N° recibo, paciente, fecha, monto, metodo, estado (emitido/anulado).
3. Boton "PDF" descarga el recibo como A4 via `@react-pdf/renderer`.

**Contenido del PDF:**
- Header: nombre del negocio, CUIT, direccion (desde config facturacion).
- Numero de recibo (formato #0001).
- Datos del paciente: nombre, DNI, direccion, telefono.
- Detalle: concepto (servicio + fecha cita), monto.
- Total recibido (destacado en verde).
- Info de pago: metodo, fecha, referencia.
- Footer: "Documento no fiscal — Generado por TurnoPro".

**Configurar datos del recibo:** Dashboard > Configuracion > tab Facturacion.

### 8.6 Mercado Pago (Scaffold)

**Estado actual:** estructura de codigo lista, requiere credenciales para funcionar.

**Archivos:**
- `src/lib/mercadopago/servicio.js` — `crearPreferenciaPago()` y `verificarPago()`.
- `src/app/api/webhooks/mercado-pago/route.js` — POST handler (solo loguea).

**Para activar en produccion:**
1. Crear aplicacion en [developers.mercadopago.com](https://www.mercadopago.com.ar/developers).
2. Obtener Access Token de produccion.
3. Agregar a `.env.local`:
   ```
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxx
   NEXT_PUBLIC_APP_URL=https://tu-dominio.com
   ```
4. Configurar webhook en panel de MP apuntando a: `https://tu-dominio.com/api/webhooks/mercado-pago`.
5. Completar logica del webhook: verificar firma, buscar pago en BD, actualizar estado (`mp_status`), notificar al profesional.

**Lo que falta implementar:**
- Generacion automatica de links de pago para pacientes.
- Actualizacion automatica del estado del pago via webhook.
- Integracion con pagina publica de reserva (pagar al reservar).

**Toggle:** Dashboard > Configuracion > tab Facturacion > "Mercado Pago habilitado".

### 8.7 Anulacion de Pagos

1. Desde la tabla de pagos, clic en icono "Anular".
2. Se abre `AnularPagoDialog` con campo motivo obligatorio.
3. Al confirmar: marca `anulado = true`, guarda `anulado_at` y `anulado_motivo`.
4. El pago anulado se muestra tachado y **no suma** en totales, cuenta corriente ni reportes.
5. Accion irreversible.

### 8.8 Configuracion de Facturacion

Ruta: Dashboard > Configuracion > tab "Facturacion".

| Campo | Descripcion | Donde se usa |
|-------|-------------|-------------|
| Nombre del negocio | Titulo en el PDF del recibo | Header del recibo |
| CUIT/CUIL | Identificacion fiscal | Debajo del nombre en el recibo |
| Direccion | Direccion fiscal | Header del recibo |
| Mercado Pago habilitado | Toggle on/off | Futuro cobro online |

Se guarda en `tenant.configuracion.facturacion` (campo JSONB).

### 8.9 Integracion con Reportes

- **Reporte de ingresos:** si hay pagos registrados, usa la tabla `pagos` como fuente de datos (muestra columna "Metodo"). Si no hay pagos, hace fallback al calculo estimado (SUM de servicios.precio en citas completadas).
- **Dashboard KPI "Ingresos":** misma logica — pagos reales con fallback a estimado.

### Archivos clave

| Archivo | Funcion |
|---------|---------|
| `src/components/facturacion/pago-dialog.jsx` | Dialog para registrar pago |
| `src/components/facturacion/anular-pago-dialog.jsx` | Dialog para anular pago |
| `src/components/facturacion/pagos-tabla.jsx` | Tabla principal + KPIs + filtros |
| `src/components/facturacion/cuenta-corriente.jsx` | Lista pacientes con saldo + movimientos |
| `src/components/facturacion/recibo-pdf.jsx` | Template PDF A4 + `descargarReciboPDF()` |
| `src/components/facturacion/facturacion-cliente.jsx` | Tabs (Pagos, Cuenta Corriente, Recibos) |
| `src/components/facturacion/estado-pago-badge.jsx` | Badge por estado de pago |
| `src/app/(dashboard)/actions/facturacion.js` | 8 server actions de facturacion |
| `src/lib/validations/facturacion.js` | `pagoSchema`, `anulacionPagoSchema` |
| `src/lib/mercadopago/servicio.js` | Scaffold Mercado Pago |
| `src/components/configuracion/tab-facturacion.jsx` | Config datos recibo + MP toggle |

---

## 9. Variables de Entorno

Archivo: `.env.local` (no versionado).

### Requeridas

| Variable | Descripcion |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (ej: `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anonima de Supabase (publica, para client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (privada, solo server-side, bypass RLS) |

### Opcionales

| Variable | Descripcion | Default si no existe |
|----------|-------------|---------------------|
| `RESEND_API_KEY` | API key de [Resend](https://resend.com) para envio de emails | Log en consola, email no enviado |
| `WHATSAPP_API_URL` | URL del servicio externo de WhatsApp | Log en consola, WhatsApp no enviado |
| `WHATSAPP_API_TOKEN` | Token de autenticacion para el servicio WhatsApp | Sin autenticacion |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token de Mercado Pago (produccion) | Log en consola, MP no funciona |
| `NEXT_PUBLIC_APP_URL` | URL base de la app (para callbacks de MP y emails) | Vacio |
| `CRON_SECRET` | Secret para autenticar el cron de recordatorios | Cron rechaza requests |

### Ejemplo `.env.local`

```env
# Supabase (requeridas)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email (opcional)
RESEND_API_KEY=re_xxxxx

# WhatsApp scaffold (opcional)
WHATSAPP_API_URL=https://tu-servicio-whatsapp.com/send
WHATSAPP_API_TOKEN=token_xxxxx

# Mercado Pago scaffold (opcional)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
CRON_SECRET=un-secreto-largo-y-seguro
```

---

## 10. Migraciones SQL

Ejecutar en orden en el **SQL Editor** de Supabase.

| # | Archivo | Contenido |
|---|---------|-----------|
| 1 | `001_auth_multitenant.sql` | Tablas: tenants, users, professionals. RPC `registrar_profesional()`. Funcion `get_tenant_id_for_user()`. Trigger `actualizar_updated_at()`. RLS. |
| 2 | `002_agenda.sql` | Tablas: servicios, disponibilidad, fechas_bloqueadas, citas. Helpers de horarios. RLS. |
| 3 | `003_pacientes.sql` | Tabla: pacientes. FK `paciente_id` en citas. Indice pg_trgm para busqueda full-text. RLS. |
| 4 | `004_pagina_publica.sql` | RLS anonimo para lectura publica. RPCs: `obtener_horarios_ocupados`, `crear_cita_publica` (SECURITY DEFINER). |
| 5 | `005_notificaciones.sql` | Tabla: notificaciones. Realtime habilitado. RPCs: `crear_notificacion_sistema`, `obtener_citas_para_recordatorio`. RLS. |
| 6 | `006_modulos_rubro.sql` | 19 tablas de modulos por rubro. Storage buckets (documentos, mascotas). Funcion `handle_updated_at()`. Triggers. RLS. |
| 7 | `007_facturacion.sql` | Tablas: pagos, recibos. Vista: `cuenta_corriente_pacientes`. RPC: `obtener_siguiente_numero_recibo`. ALTER notificaciones CHECK. RLS. |

---

## 11. Mapa de Integracion entre Modulos

```
Auth (tenant_id) ─────────────────────────────────────────────────────
    │
    ├── Agenda ──────────────┬── Notificaciones
    │   (citas, servicios,   │   (cita_creada, confirmada,
    │    disponibilidad,     │    cancelada, modificada,
    │    fechas bloqueadas)  │    recordatorios 24h/2h)
    │         │              │
    │         │              ├── Facturacion
    │         │              │   (pagos, recibos,
    │         │              │    cuenta corriente,
    │         │              │    pago_registrado notif)
    │         │              │
    │         ├──────────────┤
    │         │              │
    │   Pacientes/CRM ──────┤
    │   (busqueda, etiquetas,│
    │    campos por rubro,   │
    │    cuenta corriente)   │
    │                        │
    ├── Pagina Publica ──────┤
    │   (/{slug}, reserva    │   (reserva_nueva notif)
    │    5 pasos, anon RLS)  │
    │                        │
    ├── Modulos por Rubro ───┘
    │   (odonto, medicina,
    │    abogados, vet,
    │    psico, contadores)
    │
    └── Dashboard/Reportes
        (KPIs, graficos,
         3 reportes + CSV,
         ingresos desde pagos)
```

### Puntos clave de integracion

| Modulo A | Modulo B | Integracion |
|----------|----------|-------------|
| Auth | Todos | `tenant_id` en cada tabla, RLS universal |
| Agenda | Pacientes | FK opcional `paciente_id` en citas; autocomplete en dialog |
| Agenda | Notificaciones | Triggers en crear/editar/cambiar estado de cita |
| Agenda | Facturacion | Precio servicio, boton cobrar en sala espera, resumen pagos en edicion |
| Pacientes | Facturacion | Cuenta corriente por paciente, boton cobrar en detalle |
| Pacientes | Rubro | Campos visibles y terminologia adaptada por rubro |
| Pagina Publica | Agenda | Misma tabla `citas`, mismos servicios y disponibilidad |
| Pagina Publica | Notificaciones | `reserva_nueva` al profesional |
| Facturacion | Reportes | Ingresos reales desde tabla pagos (fallback a estimado) |
| Facturacion | Dashboard | KPI ingresos desde pagos reales |
| Facturacion | Notificaciones | `pago_registrado` in-app al profesional |

---

## 12. Mejoras v2

### 12.1 Exportacion XLSX

- Reemplazada la exportacion CSV por **XLSX** (libreria `xlsx`) en reportes y facturacion.
- Funcion `exportarXLSX(datos, columnas, encabezados, nombreArchivo)` en `src/lib/exportar-xlsx.js`.
- Auto-size de columnas para mejor legibilidad en Excel.
- Archivos afectados: `tab-reporte-citas.jsx`, `tab-reporte-ingresos.jsx`, `tab-reporte-pacientes.jsx`, `pagos-tabla.jsx`.

### 12.2 Horarios con Cortes (Bloques)

Permite configurar multiples bloques horarios por dia (ej: 9:00-13:00 y 15:00-20:00).

**Cambios en BD (migracion 008):**
- Columna `bloque INTEGER` en tabla `disponibilidad`.
- Constraint unique: `(professional_id, dia_semana, bloque)`.
- Funcion `inicializar_disponibilidad_profesional()` actualizada.

**UI en `/dashboard/horarios`:**
- Cada dia activo muestra N bloques de horario (max 3).
- Boton "+" para agregar bloque, "-" para eliminar.
- Al guardar: DELETE todos los bloques del dia + INSERT nuevos.

**Reserva publica:**
- `obtenerSlotsDisponibles()` itera sobre todos los bloques activos del dia para generar slots.
- Pagina publica muestra horarios agrupados: "9:00-13:00 / 15:00-20:00".
- RPC `crear_cita_publica()` valida contra cualquier bloque con `EXISTS`.

### 12.3 Paciente Automatico desde Reserva Publica

Al reservar un turno desde `/{slug}/reservar`, el RPC `crear_cita_publica()` ahora:

1. Busca paciente existente por email (case-insensitive) en el tenant.
2. Si no encuentra, busca por nombre_completo + telefono.
3. Si no existe, crea nuevo paciente con etiqueta `['reserva_online']`.
4. Si existe, actualiza telefono/email si llegan datos nuevos.
5. Vincula `paciente_id` en la cita creada.

Etiqueta `"reserva_online"` agregada a todos los rubros en `rubros.js`.

### 12.4 Historia Clinica Automatica

Al completar la primera cita de un paciente (`cambiarEstadoCita` → `completada`), se genera automaticamente un registro inicial de historia clinica segun el rubro:

| Rubro | Tabla | Contenido inicial |
|-------|-------|-------------------|
| Medicina | `historias_clinicas` | Registro vacio con nota automatica |
| Odontologia | `historias_clinicas_dentales` + `odontogramas` | Historia + odontograma vacio |
| Psicologia | `notas_sesion` | Primera sesion con estado emocional "neutro" |
| Abogados | `expedientes` | Expediente "Nuevo expediente" con estado "activo" |
| Veterinaria / Contadores | — | Skip (modelos diferentes) |

Implementado en `src/lib/historia-inicial.js`. Es idempotente (verifica existencia antes de crear) y fire-and-forget (no bloquea el flujo).

### 12.5 Landing Page Mejorada

Pagina principal (`/`) rediseñada con secciones:

1. **Hero** con mencion de rubros y CTA.
2. **Features** (6 cards: agenda, pacientes, notificaciones, reportes, seguridad, reserva+QR).
3. **Para cada profesion** — selector interactivo de 6 rubros con features especificas.
4. **Como funciona** — 3 pasos (Registrate, Configura, Recibe turnos).
5. **Precios** — 3 planes placeholder (Prueba/Profesional/Premium).
6. **Solicitud de demo** — formulario con validacion Zod + tabla `solicitudes_demo` en BD.
7. **Footer** mejorado con navegacion.
8. **Header sticky** con links de navegacion interna.

Archivos nuevos:
- `src/components/landing/selector-profesion.jsx`
- `src/components/landing/como-funciona.jsx`
- `src/components/landing/precios.jsx`
- `src/components/landing/formulario-demo.jsx`
- `src/app/actions/demo.js`

### 12.6 Pagina Publica Personalizable + QR

**Configuracion** en Dashboard > Configuracion > tab "Pagina Publica":

| Campo | Efecto |
|-------|--------|
| Mensaje de bienvenida | Se muestra debajo del perfil en la pagina publica |
| Redes sociales (Instagram, Facebook, WhatsApp) | Links visibles en la pagina publica |
| Color primario | Personalizacion visual (futuro) |
| Mostrar precios | Toggle para ocultar/mostrar precios de servicios |
| Mostrar horarios | Toggle para ocultar/mostrar horarios de atencion |

**Codigo QR:**
- Generado con libreria `qrcode` (toDataURL).
- Descargar como PNG.
- Compartir por WhatsApp con mensaje pre-formateado.
- Copiar URL al portapapeles.

Se guarda en `tenant.configuracion.pagina_publica` (JSONB).

### 12.7 Flujo de Onboarding

Para usuarios creados directamente en Supabase Auth (sin pasar por `/registro`):

1. El usuario se autentica e intenta acceder a `/dashboard`.
2. El layout verifica si existe registro en tabla `users` con su `auth_id`.
3. Si no existe → redirige a `/onboarding`.
4. **Wizard de 3 pasos:**
   - Paso 1: Seleccionar rubro (6 cards con iconos).
   - Paso 2: Datos personales (nombre, especialidad, telefono).
   - Paso 3: Datos del consultorio (nombre, slug auto-generado).
5. Al completar: llama al RPC `registrar_profesional()` existente.
6. Redirige a `/dashboard`.

Archivos:
- `src/app/(auth)/onboarding/page.js` — pagina server con verificacion.
- `src/components/auth/onboarding-wizard.jsx` — wizard client.
- `src/app/(auth)/actions-onboarding.js` — server action con validacion Zod.

### 12.8 Migracion 008

Archivo: `supabase/migrations/008_mejoras.sql`.

Contenido:
1. ALTER `disponibilidad` para agregar `bloque` + nuevo constraint unique.
2. `CREATE OR REPLACE FUNCTION crear_cita_publica()` con auto-creacion de paciente.
3. `CREATE TABLE solicitudes_demo` con RLS (anon INSERT, superadmin SELECT).
4. Actualizada `inicializar_disponibilidad_profesional()` con columna `bloque`.
