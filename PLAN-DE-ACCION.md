# Plan de Accion: Mejoras TurnoPro (Post Step 9)

Fecha: 2026-03-03

---

## Contexto
Se completaron los pasos 1-9 del roadmap. Estas mejoras surgieron al probar la plataforma. FLUJOS.md ya existe y esta completo con todas las secciones.

---

## Orden de ejecucion

| # | Feature | Riesgo | Estado |
|---|---------|--------|--------|
| 1 | Exportar XLSX en lugar de CSV | Bajo | Pendiente |
| 2 | Fix abogados CRM + audit cross-rubro | Bajo | Pendiente |
| 3 | Guardar paciente desde /reservar | Medio | Pendiente |
| 4 | Horarios con cortes (split schedules) | Alto | Pendiente |
| 5 | Historia clinica automatica | Medio | Pendiente |
| 6 | Landing page mejorada + demo | Bajo | Pendiente |
| 7 | Pagina publica personalizable + QR | Bajo | Pendiente |
| 8 | Onboarding para usuario nuevo (desde Supabase) | Medio | Pendiente |
| 9 | Actualizar FLUJOS.md | Bajo | Pendiente |

---

## Feature 1: Exportar XLSX en lugar de CSV

**Instalar:** `npm install xlsx`

**Nuevo archivo:** `src/lib/exportar-xlsx.js`
- Funcion `exportarXLSX(datos, columnas, encabezados, nombreArchivo)` — misma firma que exportarCSV
- Usa `XLSX.utils.aoa_to_sheet` + `XLSX.writeFile`
- Auto-size columnas

**Modificar (swap import en 4 archivos):**
- `src/components/reportes/tab-reporte-citas.jsx`
- `src/components/reportes/tab-reporte-ingresos.jsx`
- `src/components/reportes/tab-reporte-pacientes.jsx`
- `src/components/facturacion/pagos-tabla.jsx`

Cambiar `import { exportarCSV }` → `import { exportarXLSX }` y reemplazar llamadas. Cambiar texto de boton de "Exportar CSV" a "Exportar Excel".

---

## Feature 2: Fix abogados CRM + audit cross-rubro

**Problema encontrado:** En `paciente-dialog.jsx`, cuando `campos.genero = false` (abogados, contadores, veterinaria), el `<input name="genero">` no se renderiza. El server action hace fallback a `"no_especifica"` pero puede haber edge cases con campos vacios.

**Fix en `src/components/pacientes/paciente-dialog.jsx`:**
- Agregar `<input type="hidden" name="genero" value="no_especifica" />` SIEMPRE que `!campos.genero`
- Asegurar que todos los campos ocultos tengan valores default

**Fix en `src/app/(dashboard)/actions/pacientes.js`:**
- Limpiar TODOS los campos vacios (no solo email y fecha_nacimiento) antes del insert
- Convertir `""` a NULL para: obra_social, numero_afiliado, dni, direccion, notas, telefono

**Audit cross-rubro:**
- Verificar que `selector-paciente.jsx` funciona en cada rubro
- Verificar que expedientes (abogados), vencimientos-fiscales (contadores), mascotas (veterinaria), etc. permiten crear registros
- Verificar terminologia adaptativa (Cliente/Paciente/Tutor) en todos los componentes

---

## Feature 3: Guardar paciente desde /reservar

**Migration en `supabase/migrations/008_mejoras.sql`:**

Reemplazar `crear_cita_publica()` con version que:
1. Busca paciente existente por email (case-insensitive) en el tenant
2. Si no encuentra, busca por nombre_completo + telefono
3. Si no existe, crea nuevo paciente con etiqueta `['reserva_online']`
4. Si existe, actualiza telefono/email si llegan datos nuevos
5. Vincula `paciente_id` en la cita creada
6. Retorna `paciente_id` en el resultado

**Modificar `src/config/rubros.js`:**
- Agregar `"Reserva online"` a `crm.etiquetas` de todos los rubros

**No requiere cambios en `src/app/(public)/actions/reserva.js`** — el RPC maneja todo internamente.

---

## Feature 4: Horarios con cortes (split schedules)

### Problema actual
La tabla `disponibilidad` tiene `UNIQUE(professional_id, dia_semana)` — solo permite UN bloque horario por dia. El usuario necesita, por ejemplo, atender de 9-13 y de 15-20.

### Migration en `008_mejoras.sql`
```sql
ALTER TABLE disponibilidad DROP CONSTRAINT disponibilidad_professional_id_dia_semana_key;
ALTER TABLE disponibilidad ADD COLUMN bloque INTEGER NOT NULL DEFAULT 1;
ALTER TABLE disponibilidad ADD CONSTRAINT disponibilidad_professional_dia_bloque_key
  UNIQUE(professional_id, dia_semana, bloque);
```
- Actualizar `inicializar_disponibilidad_profesional()` con columna `bloque`
- Actualizar validacion de disponibilidad en `crear_cita_publica` para usar `EXISTS` con cualquier bloque

### Modificar `src/app/(dashboard)/actions/disponibilidad.js`
- `guardarDisponibilidad`: por cada dia, DELETE bloques existentes + INSERT nuevos bloques
- Nuevo formato de datos: `{ dia_semana, bloques: [{ hora_inicio, hora_fin, activo }] }`

### Modificar `src/components/agenda/horarios-cliente.jsx`
- Estado cambia de `{ activo, hora_inicio, hora_fin }` a `{ activo, bloques: [{hora_inicio, hora_fin}] }`
- UI: por cada dia activo, mostrar N bloques con hora inicio/fin
- Boton "+" para agregar bloque (max 3 por dia)
- Boton "-" para eliminar bloque (min 1 cuando activo)

### Modificar `src/app/(public)/actions/reserva.js`
- `obtenerSlotsDisponibles`: cambiar `.single()` por query multiple
- Iterar todos los bloques activos del dia para generar slots

### Modificar `src/app/(public)/[slug]/page.js`
- Mostrar multiples bloques por dia (ej: "9:00-13:00 / 15:00-20:00")

---

## Feature 5: Historia clinica automatica

**Nuevo archivo:** `src/lib/historia-inicial.js`
- Funcion `generarHistoriaInicial(supabase, tenantId, pacienteId, citaId, rubro)`
- Switch por rubro:
  - `medicina` → insert en `historias_clinicas` (registro vacio con "Primera consulta")
  - `odontologia` → insert en `historias_clinicas_dentales` + inicializar `odontogramas`
  - `psicologia` → insert en `notas_sesion` con "Primera sesion"
  - `abogados` → insert en `expedientes` con "Nuevo expediente"
  - `veterinaria`, `contadores` → skip (modelos diferentes)
- Verifica si ya existe registro antes de crear (idempotente)

**Modificar `src/app/(dashboard)/actions/citas.js`:**
- En `cambiarEstadoCita`, cuando `nuevoEstado === 'completada'` y hay `paciente_id`:
  - Obtener `tenant.rubro`
  - Llamar `generarHistoriaInicial()` (fire-and-forget, no bloquea el cambio de estado)

---

## Feature 6: Landing page mejorada + solicitud de demo

### Migration en `008_mejoras.sql`
```sql
CREATE TABLE solicitudes_demo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL, email TEXT NOT NULL,
  telefono TEXT, rubro TEXT NOT NULL, mensaje TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'contactado', 'convertido')),
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: anon INSERT, superadmin SELECT
```

### Nuevo: `src/app/actions/demo.js`
- Server action `solicitarDemo` con validacion Zod (nombre, email, rubro requeridos)

### Nuevos componentes en `src/components/landing/`
- `formulario-demo.jsx` — formulario con nombre, email, telefono, rubro (Select), mensaje. useActionState
- `selector-profesion.jsx` — 6 cards clickeables que muestran features relevantes por rubro
- `como-funciona.jsx` — 3 pasos: Registrate → Configura → Recibe turnos
- `precios.jsx` — 3 planes placeholder (Prueba gratis, Profesional, Premium)

### Redisenar `src/app/page.js`
Secciones:
1. Header con logo + CTA login/registro
2. Hero mejorado con mencion de rubros
3. "Para cada profesion" — selector interactivo por rubro
4. "Como funciona" — 3 pasos
5. Features detallados (expandir los 6 actuales)
6. Precios
7. Formulario "Solicitar demo"
8. Footer con links

---

## Feature 7: Pagina publica personalizable + QR

**Instalar:** `npm install qrcode`

### Nuevo: `src/components/configuracion/tab-pagina-publica.jsx`
Campos de personalizacion:
- `mensaje_bienvenida` (textarea)
- `redes_sociales`: instagram, facebook, whatsapp (inputs)
- `color_primario` (input type="color")
- `mostrar_precios` (switch)
- `mostrar_horarios` (switch)

Herramientas:
- Preview QR generado con `qrcode.toDataURL(url)`
- Boton "Descargar QR" (PNG)
- Link compartible para WhatsApp con mensaje pre-formateado
- Boton copiar URL al portapapeles

### Modificar `src/components/configuracion/configuracion-cliente.jsx`
- Agregar tab "Pagina Publica"

### Modificar `src/app/(dashboard)/actions/configuracion.js`
- Nueva action `guardarConfiguracionPaginaPublica`
- Se guarda en `tenant.configuracion.pagina_publica` (JSONB)

### Modificar `src/app/(public)/[slug]/page.js`
- Leer `configuracion.pagina_publica` del tenant
- Mostrar mensaje de bienvenida, redes sociales con iconos
- Aplicar color personalizado via CSS variable
- Respetar toggles de mostrar_precios y mostrar_horarios

---

## Feature 8: Onboarding para usuario creado desde Supabase

### Escenario
Un superadmin crea un usuario directamente en Supabase Auth. Ese usuario tiene sesion pero no tiene registro en `users`, `tenants`, ni `professionals`. Al iniciar sesion debe completar su configuracion.

### Nuevo: `src/app/(auth)/onboarding/page.js`
- Server component que verifica si ya tiene tenant (si si → redirect /dashboard)

### Nuevo: `src/components/auth/onboarding-wizard.jsx`
Wizard de 3 pasos:
1. **Seleccionar rubro** — 6 cards con iconos desde `rubros.js`
2. **Datos personales** — nombre_completo, especialidad, telefono
3. **Datos consultorio** — nombre_consultorio, slug (auto-generado desde nombre)
- Al completar: llama `registrar_profesional()` RPC existente
- Envia notificacion in-app al superadmin (cuando exista panel)

### Nuevo: `src/app/(auth)/actions-onboarding.js`
- Server action `completarOnboarding`
- Verifica que no tenga ya un tenant
- Llama al RPC `registrar_profesional` con el auth_id existente
- Redirect a /dashboard

### Modificar `src/app/(dashboard)/layout.js`
- Si usuario autenticado pero sin registro en `users` table → redirect a `/onboarding`

### Modificar `src/lib/supabase/middleware.js`
- Permitir `/onboarding` para usuarios autenticados (no redirigir a /dashboard)

---

## Feature 9: Actualizar FLUJOS.md

Al final, agregar secciones para:
- Horarios con cortes (multiples bloques)
- Paciente automatico desde reserva
- Historia clinica automatica
- Landing y solicitud de demo
- Pagina publica personalizable + QR
- Flujo de onboarding

---

## Resumen de archivos

### Nuevos (12 archivos)
| Archivo | Feature |
|---------|---------|
| `src/lib/exportar-xlsx.js` | 1 |
| `src/lib/historia-inicial.js` | 5 |
| `src/app/actions/demo.js` | 6 |
| `src/components/landing/formulario-demo.jsx` | 6 |
| `src/components/landing/selector-profesion.jsx` | 6 |
| `src/components/landing/como-funciona.jsx` | 6 |
| `src/components/landing/precios.jsx` | 6 |
| `src/components/configuracion/tab-pagina-publica.jsx` | 7 |
| `src/app/(auth)/onboarding/page.js` | 8 |
| `src/components/auth/onboarding-wizard.jsx` | 8 |
| `src/app/(auth)/actions-onboarding.js` | 8 |
| `supabase/migrations/008_mejoras.sql` | 3, 4, 6 |

### Modificados (17 archivos)
| Archivo | Features |
|---------|----------|
| `package.json` | 1, 7 (xlsx, qrcode) |
| `src/components/reportes/tab-reporte-citas.jsx` | 1 |
| `src/components/reportes/tab-reporte-ingresos.jsx` | 1 |
| `src/components/reportes/tab-reporte-pacientes.jsx` | 1 |
| `src/components/facturacion/pagos-tabla.jsx` | 1 |
| `src/components/pacientes/paciente-dialog.jsx` | 2 |
| `src/app/(dashboard)/actions/pacientes.js` | 2 |
| `src/config/rubros.js` | 3 |
| `src/app/(dashboard)/actions/disponibilidad.js` | 4 |
| `src/components/agenda/horarios-cliente.jsx` | 4 |
| `src/app/(dashboard)/dashboard/horarios/page.js` | 4 |
| `src/app/(public)/actions/reserva.js` | 4 |
| `src/app/(public)/[slug]/page.js` | 4, 7 |
| `src/app/(dashboard)/actions/citas.js` | 5 |
| `src/app/page.js` | 6 |
| `src/components/configuracion/configuracion-cliente.jsx` | 7 |
| `src/app/(dashboard)/actions/configuracion.js` | 7 |
| `src/app/(dashboard)/layout.js` | 8 |
| `src/lib/supabase/middleware.js` | 8 |

---

## Verificacion

1. **XLSX:** Exportar desde reportes y facturacion → archivo .xlsx se abre en Excel correctamente
2. **Abogados:** Crear cliente desde /dashboard/pacientes con rubro abogados → se crea sin error
3. **Reserva → Paciente:** Reservar turno desde /{slug}/reservar → verificar registro en tabla pacientes con etiqueta "reserva_online"
4. **Horarios con cortes:** Configurar 2 bloques (9-13, 15-20) → /reservar muestra slots correctos sin gap de 13-15
5. **Historia clinica:** Completar primera cita de paciente → se crea registro vacio de historia segun rubro
6. **Landing:** Visitar / → ver nueva landing, enviar solicitud demo → verificar en BD solicitudes_demo
7. **QR:** Dashboard > Configuracion > Pagina Publica → generar QR, descargar, escanear → lleva a /{slug}
8. **Onboarding:** Crear user en Supabase Auth → iniciar sesion → redirige a /onboarding → completar wizard → acceso a /dashboard
