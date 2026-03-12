# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripcion del Proyecto

**TurnoPro** es una plataforma SaaS multi-tenant de gestion de citas para profesionales independientes y consultorios (dentistas, abogados, veterinarios, medicos, psicologos, contadores). El roadmap y estado de avance esta en `recta-final.md`.

## Stack Tecnico

- **Framework:** Next.js 16 (App Router) — **JavaScript puro, NO TypeScript**
- **Estilos:** Tailwind CSS v4 con shadcn/ui (adaptado a JSX, new-york style)
- **Iconos:** Lucide React
- **Calendario:** react-big-calendar
- **Base de datos/Auth/Storage:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Estado global:** Zustand
- **Formularios:** React Hook Form + Zod
- **Fechas:** date-fns
- **Charts:** Recharts
- **Notificaciones:** Resend (email), WhatsApp API (scaffold), in-app (Supabase Realtime)
- **Animaciones:** Framer Motion
- **PDF:** @react-pdf/renderer
- **Pagos:** Mercado Pago (scaffold)
- **Deploy:** Vercel

## Arquitectura

### Modelo Multi-Tenant
Cada profesional/consultorio es un **tenant** identificado por un slug en la URL (ej: `/dr-martinez`). El aislamiento de datos se aplica con **Row Level Security (RLS)** de Supabase filtrando por `tenant_id`.

### Roles de Usuario
1. **Superadmin** — gestion global de la plataforma (suscripciones, metricas)
2. **Profesional (Admin)** — dueno del consultorio (perfil, servicios, horarios, pacientes)
3. **Secretaria/Recepcionista** — gestion de turnos y pagos (permisos limitados)
4. **Paciente/Cliente** — reserva de turnos, historial, subida de archivos desde paginas publicas

### Grupos de Rutas (App Router)
- `(auth)/` — login, registro, recuperacion de contrasena
- `(dashboard)/` — area protegida: agenda, pacientes, servicios, configuracion, reportes, modulos por rubro
- `(public)/[slug]/` — pagina publica del profesional y reserva de turnos
- `api/` — endpoints backend (cron de recordatorios)

### Modulos por Rubro
La plataforma se adapta segun el `rubro` seleccionado al registrarse. Cada vertical activa modulos especificos:
- **Odontologia:** odontograma interactivo (SVG 5 caras), planes de tratamiento, historia clinica dental
- **Medicina:** historia clinica, signos vitales con graficos (Recharts), recetas con impresion
- **Abogados:** expedientes por cliente, repositorio de documentos (Storage), vencimientos legales
- **Veterinaria:** fichas de mascotas con foto, cartilla de vacunacion con alertas, historial por mascota
- **Psicologia:** notas de sesion con estado emocional, linea de evolucion, cuestionarios PHQ-9/GAD-7
- **Contadores:** vencimientos fiscales por obligacion, checklists de documentacion con progreso

Componentes de rubro van en `components/rubro/{nombre}/`, compartidos en `components/rubro/` (`selector-paciente.jsx`, `guard-rubro.jsx`). Rutas en `(dashboard)/dashboard/{modulo}/`.

### Modelo de Datos (Supabase/PostgreSQL)

14 migraciones SQL en `supabase/migrations/`:
1. `001_auth_multitenant.sql` — tenants, users, professionals + RPC `registrar_profesional()`
2. `002_agenda.sql` — servicios, disponibilidad, fechas_bloqueadas, citas
3. `003_pacientes.sql` — pacientes + FK en citas + pg_trgm
4. `004_pagina_publica.sql` — RLS anon + RPCs para reserva publica
5. `005_notificaciones.sql` — notificaciones + Realtime + RPCs de recordatorios
6. `006_modulos_rubro.sql` — 19 tablas de modulos por rubro + Storage buckets
7. `007_facturacion.sql` — pagos, recibos, vista cuenta_corriente_pacientes, RPC numero recibo
8. `008_bloque_disponibilidad.sql` — columna bloque + UNIQUE constraint en disponibilidad
9. `009_mejoras_agenda.sql` — motivo, recurrencia, sobreturno, lista_espera, pendiente_confirmacion
10. `010_consulta_activa.sql` — notas_consulta, hora_inicio/fin_consulta en citas
11. `011_recetas_v2.sql` — tipo/professional_id/cita_id/contenido en recetas + firma_url + bucket firmas
12. `012_recetas_rubros_no_salud.sql` — tipos de documento para abogados y contadores
13. `013_multi_profesional_sucursales.sql` — invitaciones, sucursales, sucursal_id en citas
14. `014_archivos_pacientes.sql` — archivos_pacientes con categorias + RLS

Todas las tablas con scope de tenant tienen politicas RLS filtrando por `tenant_id`.

## Comandos de Desarrollo

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de produccion
npm run start        # Iniciar servidor de produccion
npm run lint         # Ejecutar ESLint
```

## Estado Actual del Proyecto

Pasos completados de la hoja de ruta original:
- [x] 1. Setup base (Next.js + Supabase + Tailwind + shadcn)
- [x] 2. Autenticacion y sistema multi-tenant
- [x] 3. Modulo de agenda/calendario (core)
- [x] 4. Gestion de pacientes/clientes (CRM)
- [x] 5. Pagina publica de reserva de turnos
- [x] 6. Sistema de notificaciones
- [x] 7. Modulos especificos por rubro
- [x] 8. Dashboard con analytics y reportes
- [x] 9. Facturacion y pagos (Mercado Pago)
- [ ] 10. Panel de superadmin, testing, optimizacion

Fases de la recta final completadas (ver `recta-final.md` para detalle):
- [x] Fase 0: Correccion de bugs criticos (formularios, facturacion, auth/registro)
- [x] Fase 1: Mejoras al core de agenda (recurrencia, sobreturnos, lista espera, consulta activa)
- [x] Fase 2: Recetas, firma digital, documentos profesionales
- [x] Fase 4: Recursos por profesion Argentina (parcial — tests psico, AFIP, plazos legales, vademecum, vacunas vet)
- [x] Fase 5: Archivos adjuntos + import/export CSV pacientes
- [x] Fase 7: Configuracion consultorio, multi-profesional, sucursales, permisos por rol

## Convenciones

- **Idioma:** Todo el codigo, nombres de variables, rutas y columnas de BD usan nomenclatura en espanol (ej: `pacientes`, `facturacion`, `agenda`, `servicios`, `configuracion`).
- **JavaScript puro** — nunca introducir archivos TypeScript.
- **Organizacion de componentes:** UI reutilizable en `components/ui/`, componentes de dominio agrupados por feature (`components/agenda/`, `components/pacientes/`, etc.), compartidos por rubro en `components/rubro/`.
- **Stores de estado** van en `stores/` (Zustand).
- **Schemas de validacion** van en `lib/validations/` (Zod).
- **Clientes de Supabase** en `lib/supabase/` — separar `client.js` (browser) y `server.js` (server components/actions).
- **Server Actions** en `app/(dashboard)/actions/` — un archivo por dominio.
- **Hooks personalizados** en `hooks/` — `use-user.js`, `use-rubro.js`, `use-notificaciones.js`.
- **Config por rubro** en `config/rubros.js` — modulos, CRM, etiquetas, campos por vertical.
- **Guard de rubro** — cada pagina de modulo usa `verificarRubro()` de `guard-rubro.jsx`.
- **Sidebar dinamico** — items estaticos + modulos del rubro del tenant, definidos en `sidebar-items.js` + `getRubroModulos()`.
- **Patron de componentes:** paginas server (RSC) con `page.js` → componentes client (`"use client"`) con `useActionState` para formularios.
- **Tailwind v4** usa `@theme inline` en `globals.css` en lugar de `tailwind.config.js`.
