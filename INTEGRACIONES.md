# TurnoPro — Guía de Integraciones para el Administrador

Este documento explica **exactamente** qué hace cada servicio externo en la app, cuál es el estado actual de cada integración, y los pasos concretos para activarla.

---

## Estado general de integraciones

| Servicio | Estado | Variable(s) requerida(s) | Dificultad |
|----------|--------|--------------------------|------------|
| **Email (Resend)** | ✅ Completamente implementado | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Fácil |
| **Auth — Supabase email** | ✅ Funciona solo | Ninguna (usa Supabase) | Nada |
| **Auth — Magic link** | ✅ Funciona solo | `NEXT_PUBLIC_SITE_URL` correcta | Fácil |
| **Auth — Google OAuth** | ✅ Implementado, pendiente configurar | Google Cloud Console + Supabase | Media |
| **Cron — Recordatorios** | ✅ Implementado | `CRON_SECRET` + Vercel cron o externo | Fácil |
| **WhatsApp** | ⚠️ Scaffold — necesita microservicio externo | `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN` | Alta |
| **Mercado Pago** | ⚠️ Scaffold — cobro manual funciona, pago online no | `MERCADO_PAGO_ACCESS_TOKEN` (futuro) | Media |

---

## 1. Email con Resend ✅

### Qué hace en la app:
Cada vez que se agenda, modifica, cancela o confirma un turno, y cada vez que corre el cron de recordatorios, la app llama a `enviarEmail()` en `src/lib/notificaciones/email.js`. Ese archivo usa la API de Resend para enviar el email.

**Si `RESEND_API_KEY` no está configurada, la app NO da error — simplemente no envía el email y lo loguea en consola.** Por eso es fácil que esté "funcionando" sin emails llegando.

### Qué necesitás:

**Paso 1 — Crear cuenta en Resend**
1. Ir a resend.com → Crear cuenta
2. Confirmá el email de registro

**Paso 2 — Obtener la API Key**
1. En el panel de Resend, ir a **API Keys** (menú lateral)
2. Clic en **Create API Key**
3. Nombre: `turnopro-prod` (o el que quieras)
4. Permisos: `Sending access`
5. Copiar la key — empieza con `re_`. **Solo se muestra una vez, guardala en un lugar seguro.**
6. Agregar en Vercel como variable de entorno:
   ```
   RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXX
   ```

**Paso 3 — Configurar el email remitente**

*Opción A (testing) — sin verificar dominio*
Usar el dominio de Resend directamente. Configurá:
```
RESEND_FROM_EMAIL=TurnoPro <onboarding@resend.dev>
```
> ⚠️ Solo funciona enviando a **tu propio email** registrado en Resend. No sirve para producción real.

*Opción B (producción) — verificar tu dominio*
1. En Resend → **Domains** → **Add Domain**
2. Ingresá tu dominio (ej: `turnopro.ar`)
3. Resend te da 3 registros DNS para agregar en tu proveedor de dominio (NIC.ar, Namecheap, GoDaddy, etc.):
   - Un registro **TXT** para verificar que sos dueño del dominio
   - Un registro **DKIM** (clave de firma para que los emails no entren en spam)
   - Un registro **DMARC** (política anti-spoofing)
4. Agregás esos registros en el panel de DNS de tu dominio
5. Esperás 5-30 minutos y Resend muestra el dominio como "Verified"
6. Configurá:
   ```
   RESEND_FROM_EMAIL=TurnoPro <noreply@turnopro.ar>
   ```

**Paso 4 — Probar**
1. Deployá con las nuevas variables
2. Creá un turno de prueba con tu email personal como paciente
3. Verificá que llegue el email (revisá también el spam)
4. Si no llega, ir a Resend → **Emails** para ver si hubo error de envío

### ¿Qué emails envía la app?
- Turno agendado, confirmado, cancelado, modificado
- Recordatorios 24h y 2h antes (vía cron)
- Doble opt-in de confirmación (link "Confirmar asistencia" / "No puedo asistir")
- Recuperación de contraseña (este lo envía Supabase directamente, no Resend)
- Magic link de login (también lo envía Supabase)

---

## 2. Auth — Emails de Supabase ✅

### Qué hace en la app:
Supabase envía automáticamente los emails de:
- Confirmación de cuenta al registrarse
- Recuperación de contraseña
- Magic link de login

Estos **no pasan por Resend**. Los envía Supabase con su propio sistema. Tienen cuota gratuita: 3 emails/hora en el plan Free, 100/hora en el plan Pro.

### Qué tenés que configurar:

**Paso 1 — URL de redirección (crítico)**

En Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://tu-dominio.vercel.app`
- **Redirect URLs**: agregar `https://tu-dominio.vercel.app/api/auth/callback`

Si no configurás esto, el magic link y la confirmación de email van a dar error.

**Paso 2 — Personalizar los templates (opcional pero recomendado)**

En Supabase → **Authentication → Email Templates**:

*Confirmación de cuenta (Confirm signup)*
```
Asunto: Confirmá tu cuenta en TurnoPro

Hola, hacé clic en el siguiente botón para confirmar tu cuenta:
{{ .ConfirmationURL }}
```

*Recuperación de contraseña (Reset password)*
```
Asunto: Recuperar contraseña — TurnoPro

Hacé clic en el siguiente enlace para resetear tu contraseña:
{{ .ConfirmationURL }}

Este enlace expira en 24 horas.
```

*Magic link (Magic link)*
```
Asunto: Tu enlace de acceso a TurnoPro

Hacé clic aquí para iniciar sesión:
{{ .ConfirmationURL }}

Este enlace expira en 1 hora y es de un solo uso.
```

> La variable `{{ .ConfirmationURL }}` es la URL con el token — Supabase la completa automáticamente.

**Paso 3 — SMTP custom (plan Pro, opcional)**
Si querés que estos emails también vengan desde tu dominio en lugar de `noreply@mail.supabase.io`:
- Supabase → **Project Settings → Auth → SMTP Settings**
- Configurar con las credenciales SMTP de Resend:
  - Host: `smtp.resend.com`
  - Port: `465`
  - Username: `resend`
  - Password: tu `RESEND_API_KEY`
  - From: `noreply@tu-dominio.com`

> Solo disponible en Supabase Pro (~USD 25/mes). En el plan Free no podés cambiar el SMTP.

---

## 3. Auth — Magic Link ✅

### Qué hace en la app:
En la página de login hay un tab "Link mágico". El usuario ingresa su email, la app llama a `signInWithOtp()` de Supabase, y Supabase envía un email con un link único. Al hacer clic, el usuario queda logueado sin contraseña.

### Variable crítica:
```
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

Esta variable le dice a la app a qué URL apuntar el `emailRedirectTo` del OTP. Si no coincide con la URL real de producción, el link lleva a un lugar incorrecto o da error.

**En desarrollo:** `http://localhost:3000`
**En producción:** `https://tu-dominio.vercel.app` (o dominio custom)

> Si cambiás de dominio en el futuro, actualizá esta variable en Vercel **y también** la URL en Supabase Authentication.

---

## 4. Google OAuth ✅

### Qué hace en la app:
Hay un botón "Continuar con Google" en login y registro. Al hacer clic, redirige a Google para autenticar, y Google redirige de vuelta a `/api/auth/callback` con un código de autorización. La app lo intercambia por una sesión.

### Configuración (dos pasos: Google + Supabase):

**Paso 1 — Google Cloud Console**

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un proyecto nuevo (o usar uno existente) — ej: "TurnoPro"
3. En el menú: **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `TurnoPro`
   - User support email: tu email
   - Authorized domains: tu dominio (ej: `turnopro.ar`)
   - Guardá
4. Ir a **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `TurnoPro Web`
   - Authorized redirect URIs — agregar esta URL exacta:
     ```
     https://[ID-DE-TU-PROYECTO].supabase.co/auth/v1/callback
     ```
     (El ID lo encontrás en Supabase → Settings → General → Reference ID)
5. Clic en **Create** → copiar **Client ID** y **Client Secret**

**Paso 2 — Supabase**

1. En Supabase → **Authentication → Providers → Google**
2. Activar el toggle **Enable Google provider**
3. Pegar el **Client ID** y **Client Secret** de Google
4. Guardá

**Paso 3 — Sin variables de entorno extra**
No hay variables de entorno que agregar en la app. Todo se maneja desde Supabase. Una vez configurado, el botón de Google funciona automáticamente.

**Probar:** Ir al login → clic en "Continuar con Google" → debería abrir la pantalla de selección de cuenta de Google → al elegir una cuenta, redirigir al dashboard.

---

## 5. Cron — Recordatorios automáticos ✅

### Qué hace en la app:
Existe el endpoint `GET /api/cron/recordatorios`. Cuando se llama, la app busca en la base de datos todas las citas que tienen turno en las próximas 24 horas (y 2 horas) y envía un email/WhatsApp a cada paciente.

Este endpoint **no se llama solo** — necesita algo externo que lo llame periódicamente.

### Variable requerida:
```
CRON_SECRET=una_cadena_larga_y_aleatoria
```
Esta variable protege el endpoint para que solo vos (o el servicio de cron) pueda llamarlo. Generala así:
```bash
# En cualquier terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Ejemplo de resultado: `a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1`

### Opción A — Vercel Cron Jobs (recomendado, requiere Vercel Pro)

Crear el archivo `vercel.json` en la raíz del proyecto:
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
Esto llama al endpoint a las :00 de cada hora. Vercel agrega automáticamente el header `Authorization: Bearer CRON_SECRET`.

> Requiere Vercel Pro (USD 20/mes). En Vercel Hobby el cron puede correr máximo una vez por día.

### Opción B — cron-job.org (gratuito)

1. Crear cuenta en [cron-job.org](https://cron-job.org)
2. **Create cronjob**:
   - Title: `TurnoPro — Recordatorios`
   - URL: `https://tu-dominio.vercel.app/api/cron/recordatorios`
   - Schedule: cada 1 hora (seleccionar en el calendario visual)
   - En **Headers** → Add header:
     - Name: `Authorization`
     - Value: `Bearer tu_CRON_SECRET`
3. Guardar y activar

**Verificar que funciona:**
```
GET https://tu-dominio.vercel.app/api/cron/recordatorios
Header: Authorization: Bearer tu_CRON_SECRET

Respuesta esperada:
{ "ok": true, "timestamp": "...", "resultados": { "recordatorio_24h": {...}, "recordatorio_2h": {...} } }
```

---

## 6. WhatsApp ⚠️

### Estado real: SCAFFOLD

La app ya tiene toda la lógica implementada. Cuando un turno se crea/modifica/cancela y el tenant tiene WhatsApp habilitado, la app hace esto:

```
POST https://[WHATSAPP_API_URL]
Authorization: Bearer [WHATSAPP_API_TOKEN]
Content-Type: application/json

{
  "telefono": "+5491112345678",
  "mensaje": "*Recordatorio de turno*\n\nHola Ana, te recordamos tu turno..."
}
```

**El problema:** la app espera que haya un servicio HTTP externo que reciba ese POST y lo envíe por WhatsApp. Ese servicio no está incluido en este repositorio — hay que construirlo o contratar uno.

### Por qué no está incluido:
WhatsApp no tiene una API directa simple. Las opciones son:
- **Meta Cloud API** — la API oficial, requiere aprobación de negocio por Meta
- **Twilio** — proveedor comercial, cobra por mensaje
- **Baileys/whatsapp-web.js** — librería no oficial que usa una cuenta de WhatsApp normal (riesgo de ban)

### Opción A — Meta Cloud API (recomendada para producción)

**Costo:** Gratis hasta 1.000 conversaciones/mes, luego ~USD 0.05–0.08 por conversación según país.

**Paso 1 — Crear cuenta de Meta Business**
1. Ir a [business.facebook.com](https://business.facebook.com) → Crear cuenta
2. Completar los datos de empresa

**Paso 2 — Crear app en Meta Developers**
1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. **My Apps → Create App**
3. Tipo: **Business**
4. En el dashboard de la app, buscar **WhatsApp** y hacer clic en **Set up**

**Paso 3 — Configurar número de teléfono**
1. En el panel de WhatsApp, ir a **Getting started**
2. Agregar un número de teléfono real (el que va a aparecer como remitente de los mensajes)
3. Meta puede pedir verificación del número

**Paso 4 — Obtener credenciales**
- **Phone Number ID** — identificador del número
- **WhatsApp Business Account ID**
- **Permanent Access Token** — en la sección de tokens del sistema

**Paso 5 — Crear el microservicio relay**

Necesitás un endpoint HTTP que reciba `{ telefono, mensaje }` y llame a la API de Meta. La forma más simple es una Vercel Serverless Function dentro del mismo proyecto o en uno nuevo.

Crear `src/app/api/whatsapp/send/route.js`:

```javascript
export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.WHATSAPP_API_TOKEN}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { telefono, mensaje } = await request.json();

  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  // Formatear número: quitar el + y espacios
  const numeroFormateado = telefono.replace(/[^0-9]/g, "");

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numeroFormateado,
        type: "text",
        text: { body: mensaje },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    return Response.json({ error: data }, { status: 500 });
  }
  return Response.json({ success: true, id: data.messages?.[0]?.id });
}
```

**Paso 6 — Variables de entorno a agregar en Vercel:**
```
META_PHONE_NUMBER_ID=123456789012345
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxx
WHATSAPP_API_URL=https://tu-dominio.vercel.app/api/whatsapp/send
WHATSAPP_API_TOKEN=mismo_secreto_que_uses_para_autenticar_el_relay
```

> ⚠️ `WHATSAPP_API_TOKEN` es un secreto que vos definís. El relay lo chequea para asegurarse de que solo tu app lo llame.

### Opción B — Twilio WhatsApp (más fácil de configurar)

**Costo:** USD 0.005 por mensaje (muy barato para el volumen de una PyME).

1. Crear cuenta en [twilio.com](https://twilio.com)
2. Ir a **Messaging → Senders → WhatsApp Senders**
   - Opción rápida para testing: usar el **Sandbox** de WhatsApp (no requiere aprobación, pero los destinatarios deben primero enviar un mensaje al sandbox)
   - Para producción: registrar tu número con aprobación de Meta (Twilio lo gestiona por vos)
3. Obtener: **Account SID** y **Auth Token** del panel
4. Crear el relay (igual que antes) pero llamando a la API de Twilio:

```javascript
// En el relay, reemplazar el fetch de Meta por:
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER; // ej: "whatsapp:+14155238886"

const response = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      From: twilioNumber,
      To: `whatsapp:${telefono}`,
      Body: mensaje,
    }),
  }
);
```

### Resumen WhatsApp

| | Meta Cloud API | Twilio |
|--|---------------|--------|
| Costo | Gratis 1k conv/mes, luego ~$0.07 | $0.005/mensaje |
| Setup | Complejo (aprobación Meta) | Fácil (sandbox inmediato) |
| Riesgo de ban | Ninguno (oficial) | Ninguno (usa Meta por detrás) |
| Para testing | Sandbox disponible | Sandbox disponible |

**Recomendación:** Empezar con Twilio Sandbox para probar, luego migrar a Meta Cloud API cuando quieras producción real.

---

## 7. Mercado Pago ⚠️

### Estado real: SCAFFOLD PARCIAL

El sistema de cobros **funciona completamente sin Mercado Pago**: los profesionales pueden registrar pagos en efectivo, transferencia, tarjeta o débito manual. Todo eso ya funciona.

Lo que NO está implementado todavía: que el paciente pague online desde la página pública antes de confirmar el turno.

### Para el registro manual de cobros (lo que funciona hoy):
No necesitás ninguna variable de Mercado Pago. El módulo de Facturación ya funciona para registrar, consultar y generar recibos.

### Para habilitar pago online en el futuro:

**Paso 1 — Obtener credenciales**
1. Ir a [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Iniciar sesión con tu cuenta de Mercado Pago
3. Ir a **Mis aplicaciones → Crear nueva aplicación**
4. En **Credenciales de producción**:
   - Copiar **Access Token** (empieza con `APP_USR-`)
   - Copiar **Public Key** (empieza con `APP_USR-`)

**Paso 2 — Variables de entorno (cuando se implemente)**
```
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXX
MERCADO_PAGO_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXX
```

**Paso 3 — Para testing primero**
Mercado Pago tiene un entorno de pruebas con credenciales separadas (Test credentials). Usarlas durante el desarrollo para no procesar pagos reales.

> El módulo de pago online no está implementado aún. Tener las credenciales guardadas no hace nada por ahora — cuando se implemente la funcionalidad, ya estarán listas.

---

## Checklist de integraciones por prioridad

### Obligatorio para que la app funcione en producción:
- [ ] `NEXT_PUBLIC_SITE_URL` apunta al dominio de producción real
- [ ] URLs en Supabase Auth actualizadas (Site URL + Redirect URLs)
- [ ] Templates de email de Supabase personalizados con la marca

### Muy recomendado (sin esto los emails no llegan):
- [ ] `RESEND_API_KEY` configurada
- [ ] Dominio verificado en Resend
- [ ] `RESEND_FROM_EMAIL` con dominio propio
- [ ] `CRON_SECRET` configurada
- [ ] Cron job activo (Vercel Pro o cron-job.org)
- [ ] Probar que un email de test llega correctamente

### Opcional pero agrega valor:
- [ ] Google OAuth configurado (Google Cloud Console + Supabase)
- [ ] WhatsApp configurado (elegir opción A o B, crear relay)
- [ ] Credenciales Mercado Pago guardadas para cuando se implemente pago online

---

## Tabla de variables de entorno — referencia rápida

| Variable | Dónde obtenerla | Requerida |
|----------|----------------|-----------|
| `NEXT_PUBLIC_SITE_URL` | Tu URL de Vercel/dominio propio | ✅ Sí |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | ✅ Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | ✅ Sí |
| `CRON_SECRET` | Generarlo vos (string aleatorio largo) | ✅ Sí |
| `RESEND_API_KEY` | Resend → API Keys | 📧 Para emails |
| `RESEND_FROM_EMAIL` | Vos lo definís (ej: `noreply@turnopro.ar`) | 📧 Para emails |
| `WHATSAPP_API_URL` | URL de tu relay (interno o externo) | 💬 Para WhatsApp |
| `WHATSAPP_API_TOKEN` | Vos lo definís (secreto del relay) | 💬 Para WhatsApp |
| `META_PHONE_NUMBER_ID` | Meta Developers → WhatsApp | 💬 Si usás Meta |
| `META_ACCESS_TOKEN` | Meta Developers → System Users | 💬 Si usás Meta |
| `TWILIO_ACCOUNT_SID` | Twilio → Console | 💬 Si usás Twilio |
| `TWILIO_AUTH_TOKEN` | Twilio → Console | 💬 Si usás Twilio |
| `TWILIO_WHATSAPP_NUMBER` | Twilio → WhatsApp Senders | 💬 Si usás Twilio |
| `MERCADO_PAGO_ACCESS_TOKEN` | MP → Desarrolladores → Credenciales | 💳 Futuro |
| `MERCADO_PAGO_PUBLIC_KEY` | MP → Desarrolladores → Credenciales | 💳 Futuro |
