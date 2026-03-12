# Variables de entorno para Vercel

Cargalas en Vercel → tu proyecto → **Settings → Environment Variables**.

---

## ✅ OBLIGATORIAS — sin estas la app no funciona

| Variable | Valor | Dónde encontrarlo |
|----------|-------|-------------------|
| `NEXT_PUBLIC_SITE_URL` | `https://turnopro-snowy.vercel.app` | URL de producción asignada por Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lqbumbjhwpjhrklakdug.supabase.co` | Tu `.env.local` / Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (la clave larga) | Tu `.env.local` / Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` | Tu `.env.local` / Supabase → Settings → API → service_role |
| `CRON_SECRET` | Generar uno nuevo (ver abajo) | Lo generás vos — instrucciones abajo |

### Cómo generar el CRON_SECRET
Abrí una terminal y ejecutá:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copiá el resultado y usalo como valor. Ejemplo de cómo queda:
```
a3f9b2c1d4e567890abcdef1234567890abcdef1234567890abcdef1234567890
```

> ⚠️ El `CRON_SECRET` de tu `.env.local` dice `mi_secreto_cron_12345` — ese es inseguro, generá uno nuevo para producción.

---

## 📧 EMAIL — necesarias para que lleguen los emails

| Variable | Valor | Dónde encontrarlo |
|----------|-------|-------------------|
| `RESEND_API_KEY` | `re_XXXXXXXXXX` | resend.com → API Keys → Create API Key |
| `RESEND_FROM_EMAIL` | `TurnoPro <noreply@tu-dominio.com>` | Lo definís vos con tu dominio verificado en Resend |

> Sin estas dos variables los emails no se envían. La app no da error — simplemente no manda nada.

**Para testing rápido sin dominio propio:**
```
RESEND_FROM_EMAIL=TurnoPro <onboarding@resend.dev>
```
(Solo funciona enviando a tu propio email de Resend)

---

## 💬 WHATSAPP — opcionales, dejar vacías por ahora

| Variable | Valor | Cuándo cargarla |
|----------|-------|-----------------|
| `WHATSAPP_API_URL` | URL de tu relay | Cuando implementes WhatsApp (ver INTEGRACIONES.md) |
| `WHATSAPP_API_TOKEN` | Secreto del relay | Junto con la anterior |

> Dejarlas vacías no rompe nada.

---

## 💳 MERCADO PAGO — opcionales, dejar vacías por ahora

| Variable | Valor | Cuándo cargarla |
|----------|-------|-----------------|
| `MERCADO_PAGO_ACCESS_TOKEN` | `APP_USR-XXXX` | Cuando se implemente el pago online |
| `MERCADO_PAGO_PUBLIC_KEY` | `APP_USR-XXXX` | Junto con la anterior |

> El cobro manual (efectivo, transferencia, etc.) ya funciona sin estas variables.

---

## Orden recomendado para el primer deploy

1. Cargá las **5 obligatorias** con los valores de tu `.env.local` (excepto `NEXT_PUBLIC_SITE_URL` que todavía no sabés)
2. Cargá las **2 de email** (Resend)
3. Hacé el deploy
4. Copiá la URL que te da Vercel (ej: `turnopro-abc123.vercel.app`)
5. Actualizá `NEXT_PUBLIC_SITE_URL` con esa URL
6. Actualizá también en Supabase → **Authentication → URL Configuration** → Site URL y Redirect URL

---

## Resumen visual para copiar/pegar en Vercel

```
NEXT_PUBLIC_SITE_URL         → https://TU-URL.vercel.app
NEXT_PUBLIC_SUPABASE_URL     → https://lqbumbjhwpjhrklakdug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY → eyJhbGci... (copiá de .env.local)
SUPABASE_SERVICE_ROLE_KEY    → sb_secret_... (copiá de .env.local)
CRON_SECRET                  → (generá uno nuevo con el comando de arriba)
RESEND_API_KEY               → re_... (de resend.com)
RESEND_FROM_EMAIL            → TurnoPro <noreply@tu-dominio.com>
```
