# TurnoPro — Guía de Configuración Completa

Guía paso a paso para desplegar una nueva instancia de TurnoPro desde cero. Cubre todas las integraciones necesarias para que la plataforma sea comercialmente funcional.

---

## Índice

1. [Prerequisitos — Cuentas y servicios](#1-prerequisitos)
2. [Clonar e instalar dependencias](#2-clonar-e-instalar)
3. [Crear proyecto en Supabase](#3-supabase-proyecto)
4. [Ejecutar migraciones SQL](#4-migraciones-sql)
5. [Scripts SQL adicionales (obligatorios)](#5-scripts-sql-adicionales)
6. [Configurar autenticación en Supabase](#6-supabase-auth)
7. [Variables de entorno](#7-variables-de-entorno)
8. [Deploy en Vercel](#8-vercel-deploy)
9. [Post-deploy: actualizar URLs en Supabase](#9-post-deploy-urls)
10. [Configurar email con Resend](#10-resend-email)
11. [Crear cuenta de Superadmin](#11-crear-superadmin)
12. [Configurar Cron Job (recordatorios)](#12-cron-job)
13. [Google OAuth (opcional)](#13-google-oauth)
14. [WhatsApp (opcional)](#14-whatsapp)
15. [Mercado Pago (opcional)](#15-mercado-pago)
16. [Checklist final antes del lanzamiento](#16-checklist-final)

---

## 1. Prerequisitos

Crear cuentas en los siguientes servicios antes de empezar:

| Servicio | URL | Para qué se usa | Plan mínimo |
|----------|-----|-----------------|-------------|
| **Supabase** | supabase.com | Base de datos, auth, storage, realtime | Free (Pro para producción) |
| **Vercel** | vercel.com | Deploy del frontend Next.js | Hobby (Pro para SLAs) |
| **Resend** | resend.com | Envío de emails transaccionales | Free (3.000/mes) |
| **Node.js** | nodejs.org | Para instalar dependencias localmente | v18+ |

Herramientas locales requeridas:
- Node.js 18 o superior
- npm 9 o superior
- Git

---

## 2. Clonar e instalar

```bash
git clone <URL_DEL_REPO> turnopro
cd turnopro
npm install
```

Verificar que el proyecto levanta en desarrollo:

```bash
npm run dev
# Abrir http://localhost:3000
```

> La app va a mostrar errores de Supabase hasta que configures las variables de entorno. Eso es normal.

---

## 3. Supabase — Crear proyecto

1. Ir a [supabase.com](https://supabase.com) → **New project**
2. Elegir nombre del proyecto (ej: `turnopro-prod`)
3. Elegir región: **South America (São Paulo)** para menor latencia en Argentina
4. Setear una contraseña de base de datos segura y guardarla
5. Esperar ~2 minutos a que el proyecto inicialice

Una vez creado, ir a **Settings → API** y copiar:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ nunca exponer al cliente

---

## 4. Migraciones SQL

Las migraciones deben ejecutarse **en orden** en el SQL Editor de Supabase (**SQL Editor → New query**). Ir a `supabase/migrations/` y ejecutar cada archivo en orden numérico:

| Archivo | Contenido |
|---------|-----------|
| `001_auth_multitenant.sql` | Tenants, users, professionals, RPC `registrar_profesional()` |
| `002_agenda.sql` | Servicios, disponibilidad, fechas bloqueadas, citas |
| `003_pacientes.sql` | Pacientes + FK en citas + búsqueda pg_trgm |
| `004_pagina_publica.sql` | RLS anónimo + RPCs para reserva pública |
| `005_notificaciones.sql` | Notificaciones + Realtime + RPCs de recordatorios |
| `006_modulos_rubro.sql` | 19 tablas de módulos por rubro + Storage buckets `documentos` y `mascotas` |
| `007_facturacion.sql` | Pagos, recibos, vista cuenta corriente, RPC número recibo |
| `008_mejoras.sql` | Columna `bloque` + UNIQUE constraint en disponibilidad |
| `008_storage_perfiles.sql` | Storage bucket `perfiles` (logos, avatares) |
| `009_mejoras_agenda.sql` | Motivo, recurrencia, sobreturno, lista de espera, pendiente confirmación |
| `010_consulta_activa.sql` | Notas de consulta, hora inicio/fin en citas |
| `011_recetas_v2.sql` | Recetas v2 + firma digital + Storage bucket `firmas` |
| `012_recetas_rubros_no_salud.sql` | Tipos de documento para abogados y contadores |
| `013_multi_profesional_sucursales.sql` | Invitaciones, sucursales, `sucursal_id` en citas |
| `014_archivos_pacientes.sql` | Archivos adjuntos por paciente + RLS |
| `015_enlaces_profesionales.sql` | Tabla `enlaces_profesionales` para tab Recursos |
| `016_fase10_gaps_rubros.sql` | Etapas procesales, desparasitaciones, consentimientos informados |
| `017_reviews.sql` | Tabla `reviews` con moderación y RLS anónimo |
| `018_superadmin.sql` | `trial_ends_at` en tenants + tabla `audit_logs` |
| `019_planes.sql` | Tabla `planes` + `features_override` en tenants |

> **Tip:** Si alguna migración falla por conflicto, la mayoría usan `IF NOT EXISTS` y `ON CONFLICT DO NOTHING` — es seguro re-ejecutarlas.

---

## 5. Scripts SQL adicionales (obligatorios)

Estos scripts NO están en los archivos de migración. Ejecutarlos en el SQL Editor después de las migraciones:

### 5.1 — Tabla `solicitudes_demo`

Necesaria para que el formulario de demo de la landing page funcione y para la bandeja de demos del superadmin.

```sql
CREATE TABLE IF NOT EXISTS public.solicitudes_demo (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL,
  email      text NOT NULL,
  telefono   text,
  rubro      text,
  mensaje    text,
  estado     text NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente', 'contactado', 'descartado')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.solicitudes_demo ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante puede enviar una solicitud de demo
CREATE POLICY "anon_insert_demo" ON public.solicitudes_demo
  FOR INSERT TO anon WITH CHECK (true);

-- Solo el service role (superadmin) puede leer y modificar
CREATE POLICY "service_all_demo" ON public.solicitudes_demo
  FOR ALL USING (true);
```

### 5.2 — Fix función de inicialización de horarios

Corrige el error `{}` que aparece en la página de Horarios. El constraint de `disponibilidad` fue actualizado en la migración 008 pero la función quedó con la definición antigua.

Abrir el archivo `supabase/migrations/008_mejoras.sql`, buscar la función `inicializar_disponibilidad_profesional` y ejecutar únicamente esa función (el bloque `CREATE OR REPLACE FUNCTION ... $$ ... $$`).

Si preferís ejecutarlo directamente, el fix es re-crear la función con `ON CONFLICT (professional_id, dia_semana, bloque) DO NOTHING` en lugar de `ON CONFLICT (professional_id, dia_semana) DO NOTHING`.

---

## 6. Supabase Auth — Configuración

### 6.1 — URL de redirección

En Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://tu-dominio.vercel.app`
- **Redirect URLs:** agregar estas dos URLs:
  ```
  https://tu-dominio.vercel.app/api/auth/callback
  http://localhost:3000/api/auth/callback
  ```

> ⚠️ Si no agregás estas URLs, el login con magic link y Google OAuth no van a funcionar.

### 6.2 — Tiempo de sesión (recomendado)

En **Authentication → Settings**:
- **JWT expiry:** `3600` (1 hora) o `86400` (24 horas) según preferencia
- **Refresh token reuse interval:** `10` segundos

### 6.3 — Confirmación de email

Por defecto Supabase requiere confirmar el email antes de poder iniciar sesión. Opciones:

**Opción A — Mantener confirmación de email (recomendado para producción)**
- Personalizar el template del email de confirmación en **Authentication → Email Templates**
- Reemplazar el asunto: `Confirmá tu cuenta en TurnoPro`
- El texto puede incluir la marca del producto

**Opción B — Deshabilitar confirmación (solo para testing)**
- En **Authentication → Settings** → desactivar "Enable email confirmations"
- No recomendado para producción

### 6.4 — Habilitar Realtime

Las notificaciones in-app usan Supabase Realtime. En **Database → Replication**:
- Habilitar `notificaciones` en la lista de tablas con Realtime activado

---

## 7. Variables de entorno

### Desarrollo local

Crear el archivo `.env.local` en la raíz del proyecto (este archivo está en `.gitignore` y nunca se pushea):

```env
# ============================================
# SITE URL
# En desarrollo: http://localhost:3000
# En producción: https://tu-dominio.vercel.app
# ============================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ============================================
# SUPABASE (Settings → API)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# CRON — secreto para proteger /api/cron/recordatorios
# Generar con: openssl rand -hex 32
# ============================================
CRON_SECRET=reemplazar_con_string_largo_y_aleatorio

# ============================================
# EMAIL — Resend (resend.com)
# ============================================
RESEND_API_KEY=re_XXXXXXXXXX
RESEND_FROM_EMAIL=noreply@tu-dominio.com

# ============================================
# WHATSAPP (opcional — ver sección 14)
# ============================================
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=

# ============================================
# MERCADO PAGO (opcional — ver sección 15)
# ============================================
# MERCADO_PAGO_ACCESS_TOKEN=
# MERCADO_PAGO_PUBLIC_KEY=
```

### Producción (Vercel)

Las mismas variables se configuran en Vercel → proyecto → **Settings → Environment Variables**. Cambiar `NEXT_PUBLIC_SITE_URL` a la URL de producción.

---

## 8. Deploy en Vercel

### 8.1 — Conectar repositorio

1. Ir a [vercel.com](https://vercel.com) → **Add New Project**
2. Importar el repositorio de GitHub/GitLab
3. Framework: **Next.js** (se detecta automáticamente)
4. En **Environment Variables**, agregar todas las variables del paso 7 con los valores de producción

### 8.2 — Configuración del proyecto

Vercel detecta automáticamente que es un proyecto Next.js. No requiere configuración adicional en `vercel.json`.

- **Build command:** `next build` (por defecto)
- **Output directory:** `.next` (por defecto)
- **Node.js version:** 18.x o 20.x

### 8.3 — Dominio custom (opcional pero recomendado)

En Vercel → proyecto → **Settings → Domains**:
1. Agregar dominio propio (ej: `turnopro.ar` o `app.turnopro.com`)
2. Seguir las instrucciones para configurar los DNS en tu proveedor de dominio
3. Una vez activo, actualizar `NEXT_PUBLIC_SITE_URL` en Vercel y en Supabase

---

## 9. Post-deploy — Actualizar URLs en Supabase

Después del primer deploy exitoso, actualizar en Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://tu-dominio-real.vercel.app` (o dominio custom)
- **Redirect URLs:** asegurarse de que esté `https://tu-dominio-real.vercel.app/api/auth/callback`

Si cambiás el dominio en el futuro, este paso debe repetirse.

---

## 10. Resend — Configuración de email

### 10.1 — Crear cuenta y API key

1. Crear cuenta en [resend.com](https://resend.com)
2. Ir a **API Keys → Create API Key**
3. Copiar la key y agregarla como `RESEND_API_KEY`

### 10.2 — Verificar dominio (para producción)

Sin dominio verificado, los emails se envían desde `onboarding@resend.dev` (funciona pero no es profesional).

Para usar tu propio dominio:
1. En Resend → **Domains → Add Domain**
2. Ingresar el dominio (ej: `turnopro.ar`)
3. Agregar los registros DNS que indica Resend (TXT para verificación, MX y CNAME para envío)
4. Esperar la verificación (5-30 minutos)
5. Actualizar `RESEND_FROM_EMAIL` a `noreply@tu-dominio.com`

### 10.3 — Plan de Resend

El plan gratuito permite 3.000 emails/mes. Para producción con muchos tenants, evaluar el plan Pro ($20/mes, 50.000 emails/mes).

---

## 11. Crear cuenta de Superadmin

El superadmin es la cuenta que accede al panel `/superadmin` para gestionar tenants, usuarios, planes y demos.

### Paso 1 — Crear tenant `_plataforma`

En Supabase → SQL Editor:

```sql
INSERT INTO tenants (slug, nombre, rubro, plan, activo)
VALUES ('_plataforma', 'TurnoPro Platform', 'medicina', 'premium', true)
ON CONFLICT (slug) DO NOTHING;
```

### Paso 2 — Crear usuario en Supabase Auth

En Supabase → **Authentication → Users → Invite user**:
- Ingresar el email del superadmin (ej: `admin@turnopro.com`)
- Supabase envía un email de invitación para setear la contraseña

### Paso 3 — Vincular usuario con rol superadmin

Después de que el usuario confirme su email, ejecutar en SQL Editor:

```sql
INSERT INTO users (auth_id, tenant_id, email, rol, nombre_completo)
SELECT
  au.id,
  t.id,
  au.email,
  'superadmin',
  'Superadmin'
FROM auth.users au
CROSS JOIN tenants t
WHERE au.email = 'admin@turnopro.com'  -- reemplazar con el email real
  AND t.slug = '_plataforma';
```

### Paso 4 — Verificar acceso

Iniciar sesión con el email del superadmin → el sistema debería redirigir automáticamente a `/superadmin`.

> Si el botón "Admin" no aparece en el topbar del dashboard, verificar que el `rol` en la tabla `users` sea exactamente `superadmin`.

---

## 12. Cron Job — Recordatorios automáticos

Los recordatorios de citas (24h y 2h antes) se envían a través del endpoint `/api/cron/recordatorios`.

### 12.1 — Vercel Cron Jobs

Crear el archivo `vercel.json` en la raíz del proyecto si no existe:

```json
{
  "crons": [
    {
      "path": "/api/cron/recordatorios",
      "schedule": "0 * * * *"
    }
  ]
}
```

Esto ejecuta el cron cada hora en punto. Vercel agrega automáticamente el header `Authorization: Bearer <CRON_SECRET>` si la variable está configurada.

> **Importante:** Los cron jobs en Vercel requieren plan Pro ($20/mes). En el plan Hobby solo pueden ejecutarse una vez por día.

### 12.2 — Alternativa gratuita: cron-job.org

Si no querés pagar Vercel Pro, usar [cron-job.org](https://cron-job.org) (gratuito):

1. Crear cuenta
2. Nuevo cron job:
   - **URL:** `https://tu-dominio.vercel.app/api/cron/recordatorios`
   - **Schedule:** cada 1 hora
   - **Headers:** `Authorization: Bearer tu_CRON_SECRET`

### 12.3 — Probar el endpoint manualmente

```bash
curl -H "Authorization: Bearer tu_CRON_SECRET" \
  https://tu-dominio.vercel.app/api/cron/recordatorios
```

Debe responder `{ "ok": true, "resultados": { ... } }`.

---

## 13. Google OAuth (opcional)

Permite que los usuarios inicien sesión con su cuenta de Google. Muy recomendado para mejorar la conversión de registro.

### 13.1 — Google Cloud Console

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto o usar uno existente
3. Ir a **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Tipo de aplicación: **Web application**
5. Agregar en **Authorized redirect URIs**:
   ```
   https://XXXXXXXXXX.supabase.co/auth/v1/callback
   ```
   (reemplazar `XXXXXXXXXX` con el ID de tu proyecto Supabase)
6. Copiar **Client ID** y **Client Secret**

### 13.2 — Habilitar en Supabase

En Supabase → **Authentication → Providers → Google**:
- Activar **Enable Google provider**
- Pegar **Client ID** y **Client Secret**
- Guardar

### 13.3 — Sin variables de entorno extra

Google OAuth no requiere variables de entorno adicionales en la app. Todo se configura desde Supabase. El código ya está implementado en `login/page.js` y `registro/page.js`.

---

## 14. WhatsApp (opcional)

El sistema ya tiene el scaffold de WhatsApp implementado. Solo necesita un microservicio externo que exponga un endpoint HTTP para enviar mensajes.

### Opción A — Twilio WhatsApp (recomendado, fácil)

1. Crear cuenta en [twilio.com](https://twilio.com)
2. Ir a **Messaging → Senders → WhatsApp Senders** — registrar número o usar sandbox
3. Configurar webhook para recibir mensajes entrantes (opcional)
4. El endpoint que espera la app es `POST /api/whatsapp/send` con body `{ to, message }`

Implementar un pequeño servidor Express/Fastify o serverless function que reciba ese endpoint y llame a la API de Twilio. Deployarlo en Vercel, Railway o Render.

### Opción B — Meta Cloud API (directo, sin intermediario)

1. Registrar empresa en [developers.facebook.com](https://developers.facebook.com)
2. Crear app de tipo **Business → WhatsApp**
3. Obtener **Phone Number ID** y **Access Token permanente**
4. Implementar microservicio que llame a `graph.facebook.com/v18.0/{phone_number_id}/messages`

### Variables de entorno una vez configurado

```env
WHATSAPP_API_URL=https://tu-microservicio.com/api/whatsapp/send
WHATSAPP_API_TOKEN=tu_token_secreto
```

Los tenants habilitan WhatsApp desde **Configuración → Notificaciones**.

---

## 15. Mercado Pago (opcional)

El sistema registra cobros manuales (efectivo, transferencia, etc.) y tiene el scaffold para integrar Mercado Pago. La integración de pagos online no está completamente implementada — el sistema actual registra el intento y deberá completarse con el SDK de MP.

### Obtener credenciales

1. Ir a [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. **Tus integraciones → Crear aplicación**
3. Ir a **Credenciales de producción**:
   - **Access Token** → `MERCADO_PAGO_ACCESS_TOKEN`
   - **Public Key** → `MERCADO_PAGO_PUBLIC_KEY`

```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXX
MERCADO_PAGO_PUBLIC_KEY=APP_USR-XXXXXXXXXX
```

---

## 16. Checklist final antes del lanzamiento

### Base de datos y auth
- [ ] Todas las migraciones (001–019) ejecutadas sin errores
- [ ] Script de `solicitudes_demo` ejecutado (Sección 5.1)
- [ ] Fix de `inicializar_disponibilidad_profesional` ejecutado (Sección 5.2)
- [ ] Realtime habilitado en tabla `notificaciones`
- [ ] Site URL y Redirect URLs actualizadas en Supabase Auth
- [ ] Cuenta de superadmin creada y verificada (`/superadmin` accesible)

### Variables de entorno en Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` apunta al dominio de producción
- [ ] `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] `CRON_SECRET` configurada (string aleatorio largo)
- [ ] `RESEND_API_KEY` y `RESEND_FROM_EMAIL` configuradas

### Email
- [ ] Dominio verificado en Resend (o probado con `onboarding@resend.dev`)
- [ ] Template del email de confirmación de Supabase personalizado con la marca
- [ ] Probar envío de email: crear cuenta → verificar que llega el email de confirmación
- [ ] Probar recordatorio: crear cita 24h en el futuro → disparar cron → verificar email

### Funcionalidad core
- [ ] Registro de nuevo profesional funciona end-to-end
- [ ] Confirmación de email → redirect al dashboard
- [ ] Crear cita desde dashboard funciona
- [ ] Página pública `/[slug]` muestra correctamente
- [ ] Reserva desde página pública funciona
- [ ] Cron de recordatorios responde OK

### Superadmin
- [ ] Acceso a `/superadmin` con cuenta admin
- [ ] Listado de tenants visible
- [ ] Bandeja de demos visible en `/superadmin/demos`
- [ ] Cambio de plan funciona

### Seguridad
- [ ] `.env.local` NO está en el repositorio
- [ ] `SUPABASE_SERVICE_ROLE_KEY` NO está expuesta al cliente (nunca en variables `NEXT_PUBLIC_`)
- [ ] `CRON_SECRET` es un string difícil de adivinar (mínimo 32 caracteres)

---

## Resumen de costos mensuales estimados

| Servicio | Plan recomendado | Costo/mes |
|----------|-----------------|-----------|
| Supabase | Pro | USD 25 |
| Vercel | Pro (para crons cada hora) | USD 20 |
| Resend | Free / Pro | USD 0–20 |
| Dominio .com.ar | — | ~ARS 1.000/año |
| **Total base** | | **USD 45–65/mes** |

> Con el plan Hobby de Vercel (gratuito) y usando cron-job.org como alternativa, el costo puede reducirse a ~USD 25/mes (solo Supabase Pro). El plan Free de Supabase es funcional para desarrollo y proyectos pequeños.

---

## Soporte y recursos

- **Supabase Docs:** docs.supabase.com
- **Next.js App Router:** nextjs.org/docs/app
- **Resend Docs:** resend.com/docs
- **Vercel Cron Jobs:** vercel.com/docs/cron-jobs
