# TurnoPro

Plataforma SaaS multi-tenant de gestion de citas para profesionales independientes y consultorios (odontologos, medicos, abogados, veterinarios, psicologos, contadores).

## Stack Tecnico

- **Framework:** Next.js 16 (App Router, JavaScript puro)
- **Estilos:** Tailwind CSS v4 + shadcn/ui (new-york)
- **Base de datos / Auth / Storage:** Supabase (PostgreSQL + Auth + RLS + Storage + Realtime)
- **Estado:** Zustand
- **Validacion:** Zod + React Hook Form
- **Iconos:** Lucide React
- **Calendario:** react-big-calendar
- **Charts:** Recharts
- **Animaciones:** Framer Motion
- **PDF:** @react-pdf/renderer
- **Email:** Resend
- **Pagos:** Mercado Pago (scaffold)
- **Deploy:** Vercel

## Comandos

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de produccion
npm run start        # Iniciar servidor de produccion
npm run lint         # Ejecutar ESLint
```

## Setup Inicial

1. Clonar el repositorio
2. `npm install`
3. Crear un proyecto en [supabase.com](https://supabase.com)
4. Copiar las keys en `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
5. Ejecutar las migraciones SQL en Supabase SQL Editor (en orden):
   - `supabase/migrations/001_auth_multitenant.sql`
   - `supabase/migrations/002_agenda.sql`
   - `supabase/migrations/003_pacientes.sql`
   - `supabase/migrations/004_pagina_publica.sql`
   - `supabase/migrations/005_notificaciones.sql`
   - `supabase/migrations/006_modulos_rubro.sql`
   - `supabase/migrations/007_facturacion.sql`
   - `supabase/migrations/008_storage_perfiles.sql`
6. Desactivar confirmacion de email en Supabase (Auth > Settings) para desarrollo
7. `npm run dev`

## Progreso

- [x] **Paso 1** — Setup base (Next.js + Supabase + Tailwind + shadcn)
- [x] **Paso 2** — Autenticacion y sistema multi-tenant
- [x] **Paso 3** — Modulo de agenda/calendario
- [x] **Paso 4** — Gestion de pacientes/clientes (CRM adaptable por rubro)
- [x] **Paso 5** — Pagina publica de reserva de turnos
- [x] **Paso 6** — Sistema de notificaciones (email, WhatsApp scaffold, in-app Realtime)
- [x] **Paso 7** — Modulos especificos por rubro (6 verticales, 19 tablas)
- [x] **Paso 8** — Dashboard con analytics y reportes (CSV export)
- [x] **Paso 9** — Facturacion y pagos (Mercado Pago scaffold, recibos PDF)
- [ ] **Paso 10** — Panel de superadmin, testing, optimizacion

## Arquitectura

### Multi-Tenant
Cada consultorio es un tenant con slug unico. Aislamiento de datos via Row Level Security (RLS) en Supabase.

### Roles
- **Superadmin** — gestion global de la plataforma
- **Profesional** — dueno del consultorio (perfil, servicios, horarios, pacientes)
- **Secretaria** — gestion de turnos y pagos (permisos limitados)
- **Paciente** — reserva desde pagina publica, historial

### Estructura de Rutas
- `(auth)/` — login, registro, recuperacion de contrasena
- `(dashboard)/` — area protegida (agenda, pacientes, servicios, horarios, configuracion, reportes, facturacion, modulos por rubro)
- `(public)/[slug]/` — pagina publica del profesional con reserva online
- `api/` — cron de recordatorios, webhook Mercado Pago

### Modulos por Rubro
- **Odontologia:** odontograma SVG interactivo, planes de tratamiento, historia dental
- **Medicina:** historia clinica, signos vitales con graficos, recetas con impresion
- **Abogados:** expedientes, repositorio de documentos, vencimientos legales
- **Veterinaria:** fichas de mascotas con foto, cartilla de vacunacion, historial
- **Psicologia:** notas de sesion, linea de evolucion, cuestionarios PHQ-9/GAD-7
- **Contadores:** vencimientos fiscales, checklists de documentacion

### Pagina Publica
Cada profesional tiene una landing personalizable (`/{slug}`) con:
- Hero con gradiente o imagen de portada custom
- Avatar, especialidad, biografia, redes sociales (Instagram, Facebook, WhatsApp)
- Listado de servicios con precios opcionales
- Horarios de atencion
- Codigo QR para reserva rapida
- Directorio de profesionales en la home de TurnoPro
