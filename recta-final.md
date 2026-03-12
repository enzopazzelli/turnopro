# Recta Final — TurnoPro

Documento de planificación para completar el proyecto. Organizado en fases priorizadas.

---

## Fase 0: Corrección de Bugs Críticos ✅ COMPLETADA

> **Prioridad máxima.** Sin esto funcionando, nada más importa.

### 0.1 — Formularios que no crean/guardan datos ✅
- [x] **Registro**: manejar email duplicado (Supabase devuelve fake user con identities vacío), manejar email confirmation (session null → mensaje informativo), prevenir Enter submit desde paso 1, validación client-side en "Siguiente"
- [x] **Refresh de listas**: agregar `router.refresh()` en `cerrarDialog` de pacientes-cliente, agenda-cliente, y todos los parents de rubro (12 componentes)
- [x] **Stale state**: agregar `key={dialogKey}` con counter en todos los parents que renderizan diálogos, forzando remount completo de useActionState
- [x] **SelectorPaciente**: agregar `type="button"` a los 3 buttons (search results, "Cambiar", recientes) para que no hagan submit del form padre
- [x] **ExpedienteDialog**: corregir edit mode (siempre usaba `crearExpediente`, ahora usa `actualizarExpediente.bind(null, id)` cuando hay expediente)
- [x] **Empty string → null**: convertir `tutor_id`, `paciente_id`, `fecha_nacimiento` vacíos a null en server actions de veterinaria y abogados, con mensajes de error amigables
- [x] **JSON parse**: agregar return con error en catch blocks de contadores (checklists) y odontología (etapas)

### 0.2 — SQL faltante (ejecutado manualmente en Supabase)
- [x] Agregar política RLS anon para `disponibilidad` (faltaba en migración 004)
- [x] Agregar columna `bloque` a tabla `disponibilidad` + actualizar UNIQUE constraint a `(professional_id, dia_semana, bloque)`

### 0.3 — Auth/Registro ✅
- [x] `redirect()` dentro de server actions con `useActionState` causa "An unexpected response was received from the server" — reemplazado por devolver `{ redirectTo }` y manejar redirect en cliente con `useEffect` + `router.push()`
- [x] Fix aplicado en `iniciarSesion` y `registrarse` (ambas usaban `redirect()` con `useActionState`)
- [x] Slug reportado como "en uso" para usuarios nuevos: el bug anterior hacía que signUp + RPC se ejecutaran exitosamente pero el redirect fallara, dejando el tenant creado; al reintentar con otro email + mismo slug, el RPC encontraba el slug existente
- [x] Verificación temprana de slug antes de `signUp()` para evitar crear auth users huérfanos si el slug ya existe

### 0.4 — Facturación/Cobro ✅
- [x] Query de citasHoy no incluía `precio` en servicios → monto sugerido siempre vacío
- [x] `total_pagado` nunca se calculaba → botón "Cobrar" siempre visible, restante siempre = precio total
- [x] Ahora page.js consulta tabla `pagos` y calcula `total_pagado` real por cita
- [x] PagoDialog mejorado: muestra precio, ya pagado, restante, vuelto (efectivo) o saldo a favor (otros métodos)
- [x] `cita_id`/`paciente_id` vacíos convertidos a `undefined` antes de validar
- [x] `dialogKey` + `router.refresh()` en sala de espera

---

## Fase 1: Mejoras al Core de Agenda y Notificaciones ✅ COMPLETADA

> Funcionalidades que impactan el uso diario de todos los rubros.

### 1.1 — Modificación de citas con notificación ✅
- [x] Al editar una cita (cambio de fecha, hora, profesional), notificar al paciente por email e in-app
- [x] Agregar campo `motivo` a la tabla `citas` (motivo de la cita, motivo de cancelación, motivo de reprogramación)
- [x] Al cancelar/reprogramar, requerir motivo obligatorio
- [x] Enviar notificación con el motivo incluido en el mensaje
- [x] Plantilla de notificación: `cita_modificada`, `cita_reprogramada`

### 1.2 — Modificación de horarios con notificación ✅
- [x] Al cambiar disponibilidad horaria, detectar citas existentes que quedan fuera del nuevo horario
- [x] Notificar a pacientes afectados con opción de reprogramar
- [x] Al bloquear una fecha, notificar a pacientes con citas ese día

### 1.3 — Turnos recurrentes ✅
- [x] Modelo de datos: campo `recurrencia` en citas (`null`, `semanal`, `quincenal`, `mensual`)
- [x] Campo `cita_padre_id` para vincular serie de citas recurrentes
- [x] Campo `recurrencia_fin` (fecha fin o cantidad de repeticiones)
- [x] UI en cita-dialog: switch "Turno recurrente" → selector frecuencia + hasta cuándo
- [x] Al crear turno recurrente, generar todas las citas futuras (validar solapamientos)
- [x] Al modificar/cancelar, preguntar: "¿Solo esta cita o toda la serie?" (modificarSerieCitas action)
- [x] Caso de uso principal: psicología — paciente va todos los martes a las 10:00

### 1.4 — Sobreturno manual ✅
- [x] Permitir al profesional/secretaria crear una cita fuera del horario de disponibilidad
- [x] Flag `sobreturno: true` en la cita
- [x] Indicador visual en el calendario (borde naranja dashed, icono ⚡)
- [x] No bloquear por validación de solapamiento si es sobreturno

### 1.5 — Lista de espera ✅
- [x] Tabla `lista_espera` (paciente_id, servicio_id, tenant_id, fecha_preferida, horario_preferido, estado, created_at)
- [x] Botón "Agregar" a lista de espera con dialog completo
- [x] Al liberarse un turno (cancelación), notificar automáticamente a pacientes en lista
- [x] Vista en dashboard para gestionar lista de espera + página dedicada

### 1.6 — Política de cancelación configurable ✅
- [x] En configuración del tenant: horas mínimas antes de cancelar sin cargo (ej: 4hs, 24hs)
- [x] En página pública: mostrar política al reservar
- [x] Configuración con mensaje personalizable

### 1.7 — Doble opt-in de confirmación ✅
- [x] Al crear cita, enviar email/WhatsApp pidiendo confirmación (si habilitado en config)
- [x] Estado intermedio `pendiente_confirmacion` → `confirmada`
- [x] Link/botón en el email para confirmar o cancelar (API /api/confirmar-cita)
- [x] Página HTML de respuesta con confirmación/cancelación visual

### 1.8 — Consulta activa (modal con timer y notas) ✅
- [x] Migración `010_consulta_activa.sql`: columnas `notas_consulta`, `hora_inicio_consulta`, `hora_fin_consulta` en citas
- [x] Server actions: `iniciarConsulta()` (seta estado en_curso + hora inicio), `guardarNotasConsulta()`, `completarConsulta()`
- [x] Fallback graceful si migración 010 no fue ejecutada (usa columnas existentes)
- [x] Componente `ConsultaActiva` (`components/agenda/consulta-activa.jsx`):
  - Timer en tiempo real (calcula desde `hora_inicio_consulta`)
  - Notas con auto-guardado cada 30 segundos
  - Info del paciente, servicio, hora del turno y duración estimada
  - Minimizable: barra flotante bottom-right con dot animado, nombre del paciente, timer y botón expandir
  - Al cerrar el dialog (X o click fuera) se minimiza en vez de cerrar
- [x] Al completar, guarda notas en historia clínica según rubro:
  - Medicina → `historias_clinicas` (motivo_consulta)
  - Odontología → `historias_clinicas_dentales` (observaciones)
  - Psicología → `notas_sesion` (contenido)
- [x] Integrado en sala de espera: botón "Iniciar consulta" (confirmada) y "Continuar consulta" (en_curso)
- [x] Citas en_curso con borde destacado (ring primary)

### 1.9 — Corrección de bugs críticos ✅
- [x] `formData.get()` devuelve `null` para campos no renderizados → Zod rechaza null silenciosamente → citas y lista de espera no se creaban. Fix: `|| ""` en todos los `formData.get()`
- [x] `ListaEspera` solo se renderizaba con items existentes → imposible agregar el primer elemento
- [x] `cambiarEstadoCita` no seleccionaba `professional_id` → `notificarListaEspera()` fallaba
- [x] `notificarListaEspera()` sin `await` y sin filtro `tenant_id`
- [x] `generarHistoriaInicial()` usaba columnas incorrectas: `alergias: ""` → `[]`, `medicacion_actual` → `medicacion_cronica`, `notas` → `observaciones`

---

## Fase 2: Recetas, Indicaciones y Firma Digital ✅ COMPLETADA (2.3 canvas + 2.4 email agregados)

> Para médicos, psiquiatras, veterinarios, odontólogos y toda profesión que recete.

### 2.1 — Sistema de recetas universal ✅
- [x] Migración `011_recetas_v2.sql`: columnas `tipo`, `professional_id`, `cita_id`, `contenido` en recetas + `firma_url` en professionals + bucket `firmas`
- [x] Tipos: `receta_medicamento`, `indicacion_medica`, `orden_estudio`, `derivacion`, `certificado`
- [x] Formulario de receta reescrito (`receta-dialog.jsx`): selector de tipo, medicamentos dinámicos para recetas, textarea contextual para otros tipos
- [x] Schema Zod (`lib/validations/recetas.js`): validación de tipo enum, medicamentos opcionales, contenido
- [x] Server actions (`actions/recetas.js`): CRUD completo (obtenerRecetas, crearReceta, eliminarReceta, obtenerDatosPDF, subirFirma)
- [x] Guard multi-rubro: `verificarRubro()` acepta string o array, recetas disponible para medicina, odontología, veterinaria, psicología
- [x] Config de rubros actualizada: odontología, veterinaria y psicología ahora incluyen módulo Recetas en sidebar
- [x] Vademécum argentino: ~120 drogas con presentaciones y nombres comerciales (`config/vademecum.js`), autocompletado en campo de medicamento (`MedicamentoAutocomplete`), al seleccionar completa nombre + dosis

### 2.6 — Extensión a rubros no-salud ✅
> Abogacía y contaduría no recetan medicamentos, pero pueden generar documentos profesionales con firma y PDF usando la misma infraestructura.

- [x] Agregar `abogados` y `contadores` al guard y sidebar de recetas (renombrado a "Docs. Profesionales" en sidebar)
- [x] Migración `012_recetas_rubros_no_salud.sql`: amplía CHECK constraint de `tipo` con 10 tipos nuevos
- [x] Tipos para abogacía: `carta_documento`, `dictamen`, `certificacion_firma`, `informe_legal`, `poder`
- [x] Tipos para contaduría: `certificacion_ingresos`, `informe_contable`, `balance`, `dictamen_contador`, `nota_requerimiento`
- [x] `receta-dialog.jsx`: selector de tipo filtrado por rubro (TIPOS_SALUD / TIPOS_ABOGADOS / TIPOS_CONTADORES), labels y placeholders contextuales por tipo
- [x] `receta-lista.jsx`: badges con colores diferenciados para todos los tipos, labels dinámicos (título sección, botón nuevo, columna paciente/cliente, diagnóstico/asunto)
- [x] `receta-pdf.jsx`: títulos PDF para todos los tipos, label dinámico "Paciente"/"Cliente" según `terminoPaciente` del rubro, "Diagnóstico"/"Asunto" y "Indicaciones generales"/"Observaciones"
- [x] `recetas/page.js`: título dinámico "Recetas y documentos" vs "Documentos profesionales" según rubro
- [x] `recetas-page.jsx`: propaga `rubro` a componentes hijos, usa `terminoPaciente` del rubro en SelectorPaciente
- [x] Schema Zod actualizado con los 15 tipos totales
- [x] `obtenerDatosPDF` ahora incluye `rubro` del tenant para PDF contextual

### 2.2 — Generación de PDF profesional ✅
- [x] Template HTML/CSS con window.print() (`receta-pdf.jsx`): encabezado del consultorio, datos del paciente, cuerpo, firma
- [x] Campos del PDF: nombre del profesional, matrícula (numero_matricula), especialidad, datos del consultorio, fecha
- [x] Datos del paciente: nombre, DNI, obra social
- [x] Cuerpo: tabla de medicamentos con posología para recetas, texto libre para otros tipos
- [x] Pie: firma digital (imagen) + nombre + matrícula + "Firma y sello"
- [x] Soporte para todos los tipos (TIPO_TITULOS mapping)
- [x] `RecetaPDFButton` con estado de carga

### 2.3 — Firma digital ✅
- [x] Upload de firma del profesional (imagen PNG/SVG/WebP) en Supabase Storage (bucket `firmas`)
- [x] Server action `subirFirma()`: upload a Storage + actualiza `professionals.firma_url`
- [x] UI de upload en Configuración > Perfil: card con preview, hover para cambiar, acepta PNG/SVG/WebP
- [x] Firma incrustada automáticamente en el PDF generado
- [x] Campo `firma_url` en tabla `professionals` (migración 011)
- [x] Firma con canvas (`components/configuracion/firma-canvas.jsx`): dibujar con mouse/touch, limpiar, guardar directo a Storage; toggle "Subir imagen" / "Dibujar firma" en tab Perfil

### 2.4 — Envío automático por email ✅
- [x] Botón enviar por email en `receta-lista.jsx` (icono Mail, junto a PDF e imprimir)
- [x] Server action `enviarRecetaEmail()`: genera HTML contextual por tipo (lista medicamentos o texto libre), envía vía Resend
- [x] Graceful si paciente sin email o RESEND_API_KEY no configurada
- [x] Historial de recetas por paciente en su ficha (`receta-lista.jsx` con badges de tipo, detalle, acciones)

### 2.5 — Lista de recetas mejorada ✅
- [x] Tabla con columnas: Fecha, Tipo (badge con color), Paciente, Diagnóstico, Detalle, Acciones
- [x] Badge de tipo con colores diferenciados (azul receta, verde indicación, violeta orden, naranja derivación, amarillo certificado)
- [x] Detalle contextual: cuenta de medicamentos para recetas, preview de contenido para otros tipos
- [x] Acciones: ver detalle (dialog), imprimir/PDF, eliminar
- [x] Dialog de detalle con toda la información de la receta

---

## Fase 3: Nuevo Rubro — Oftalmología

### 3.1 — Configuración del rubro
- [ ] Agregar `oftalmologia` en `config/rubros.js` con sus módulos, etiquetas CRM, campos
- [ ] CRM: paciente con campos de obra social, derivado por, antecedentes oftalmológicos
- [ ] Etiquetas: glaucoma, cataratas, miopía, hipermetropía, astigmatismo, presbicia, retinopatía

### 3.2 — Módulos específicos
- [ ] **Ficha oftalmológica**: agudeza visual (OD/OI con/sin corrección), presión intraocular, fondo de ojo
- [ ] **Historial de graduación**: registro cronológico de graduaciones (esfera, cilindro, eje, adición — OD/OI)
- [ ] **Recetas de lentes**: formulario específico con campos ópticos, generable en PDF
- [ ] **Estudios**: adjuntar imágenes (OCT, campimetría, topografía) vía Supabase Storage
- [ ] **Alertas**: control de presión intraocular periódico, seguimiento glaucoma

### 3.3 — Migración SQL
- [ ] Tablas: `fichas_oftalmologicas`, `graduaciones`, `estudios_oftalmologicos`
- [ ] RLS por tenant_id
- [ ] Storage bucket `estudios-oftalmologicos`

---

## Fase 4: Recursos por Profesión (Argentina) ✅ COMPLETADA

> Herramientas y recursos adaptados al contexto profesional argentino.

### 4.1 — Configuración de colegios/asociaciones profesionales ✅
- [x] Migración `015_enlaces_profesionales.sql`: tabla `enlaces_profesionales` (tenant_id, titulo, url, descripcion, categoria, orden) con RLS
- [x] Server actions: `obtenerEnlacesProfesionales()`, `crearEnlaceProfesional()`, `eliminarEnlaceProfesional()` en `actions/configuracion.js`
- [x] Nuevo tab "Recursos" en Configuración (`tab-recursos.jsx`): CRUD de links con categorías (colegio, asociación, recurso, general), dialog de creación, delete, badges por categoría
- [x] `configuracion/page.js` carga enlaces en paralelo y los pasa a `ConfiguracionCliente`

### 4.2 — Tests y escalas para Psicología ✅
- [x] PHQ-9 y GAD-7 (ya implementados) — verificados
- [x] **BDI-II** (Inventario de Depresión de Beck) — 21 items, scoring: Mínimo/Leve/Moderada/Severa
- [x] **STAI Estado** (Ansiedad Estado) — 20 items, escala 1-4, scoring: Baja/Moderada/Alta
- [x] **STAI Rasgo** (Ansiedad Rasgo) — 20 items, escala 1-4, scoring: Baja/Moderada/Alta
- [x] **MoCA** (Montreal Cognitive Assessment) — 29 items por dominio cognitivo, scoring: Normal/Deterioro leve/moderado/severo
- [x] Scoring automático con interpretación para todos los tests
- [x] Opciones de respuesta dinámicas por tipo de cuestionario (0-3 para PHQ/GAD/BDI, 1-4 para STAI, 0-1/0-3 para MoCA)
- [x] Badges con colores diferenciados por tipo (PHQ-9, GAD-7, BDI-II, STAI-E, STAI-R, MoCA)
- [x] Colores de interpretación extendidos (Baja/Alta para STAI, Normal/Deterioro para MoCA)
- [x] Botón "Inicializar tests predefinidos" carga los 6 cuestionarios
- [x] Historial de tests por paciente con gráficos de evolución (ya existía)
- [ ] **SCL-90-R** — pendiente (90 items, complejidad alta)
- [ ] **HTP / Dibujo libre** — pendiente (requiere upload de imagen)

### 4.3 — Recursos para Contadores ✅
- [x] Calendario fiscal AFIP/ARCA precargado (`config/calendario-fiscal.js`): IVA, Ganancias (mensual + anual), Bienes Personales, Monotributo (pago + recategorización), IIBB, Cargas Sociales (F.931)
- [x] Días de vencimiento según terminación de CUIT (último dígito)
- [x] `generarVencimientosMes()`: genera vencimientos para un mes/año según terminación de CUIT
- [x] Server action `cargarVencimientosAFIP()`: carga masiva en tabla vencimientos_fiscales
- [x] UI: botón "Cargar AFIP" en vencimientos fiscales con dialog (mes, año, terminación CUIT)
- [x] Categorías de monotributo actualizadas (A-K con montos)
- [x] Links útiles precargados e integrados en UI de vencimientos fiscales: AFIP/ARCA, ARBA, AGIP, Rentas Córdoba, API Santa Fe, ATM Mendoza, Monotributo, Mis Aplicaciones Web
- [x] Checklist de documentación por tipo de trámite: selector "Usar template" en `checklist-dialog.jsx` con 6 templates predefinidos (IVA Mensual, Ganancias Anual, Monotributo, Bienes Personales, Cargas Sociales F.931, IIBB) — auto-rellena título e ítems, editables antes de crear

### 4.4 — Recursos para Abogados ✅
- [x] Calculadora de plazos procesales en días hábiles judiciales (`config/recursos-legales.js`): excluye fines de semana, feriados nacionales y ferias judiciales; primer día no computable (art. 156 CPCCN)
- [x] Plazos procesales frecuentes precargados (CPCCN): 16 plazos con norma (traslado, apelación, agravios, revocatoria, REF, etc.)
- [x] Calendario de ferias judiciales: verano (enero) e invierno (julio), feriados nacionales 2025-2026
- [x] Modelos de escritos frecuentes: demanda civil, contestación, oficio judicial, cédula de notificación, recurso de apelación — con copiar al portapapeles
- [x] Links útiles: PJN, SCBA, SAIJ, InfoLEG, Boletín Oficial, CPACF, COLPROBA, MEV, Lex Doctor
- [x] Página `/dashboard/recursos-legales` con 4 tabs (Calculadora, Modelos, Ferias/Feriados, Links)
- [x] Módulo "Recursos Legales" agregado al sidebar de abogados

### 4.5 — Recursos para Medicina/Oftalmología ✅
- [x] Vademécum con buscador (`config/vademecum.js`): ~120 drogas argentinas con presentaciones y nombres comerciales, autocompletado en receta-dialog
- [x] CIE-10: buscador de códigos diagnósticos con autocompletado (`config/cie10.js`): ~150 códigos frecuentes, integrado en campo diagnóstico de recetas (rubros salud)
- [x] Página `/dashboard/recursos-medicos`: links a obras sociales (PAMI, OSDE, Swiss Medical, Galeno, IOMA, Medife, Sancor, OSECAC), vademécum/ANMAT, organismos (Ministerio, ANMAT, Nomivac), colegios (AMA, FEMEBA, COMRA, SAC, AAD), emergencias (SAME, CITOXAL)
- [x] Módulo "Recursos Medicos" agregado al sidebar de medicina en `config/rubros.js`

### 4.6 — Recursos para Veterinaria ✅
- [x] Calendario de vacunación por especie/edad (`config/calendario-vacunacion.js`): esquemas perros y gatos con vacunas obligatorias y opcionales, por semanas de edad + refuerzos anuales
- [x] Listado de antiparasitarios internos y externos por especie (Milbemax, NexGard, Bravecto, Frontline, etc.)
- [x] `calcularVacunasPendientes()`: detecta vacunas pendientes/atrasadas según edad y vacunas aplicadas
- [x] Vademécum veterinario incluido en `config/vademecum.js` (Enrofloxacina, Metacam, Ivomec, NexGard, etc.)
- [x] **UI integrada en mascota-detalle.jsx**: tab "Recomendaciones" con badge de pendientes, muestra vacunas pendientes/atrasadas/refuerzos con color-coding, antiparasitarios internos/externos filtrados por especie

---

## Fase 5: Pacientes — Archivos, CSV e Historial ✅ COMPLETADA

### 5.1 — Archivos adjuntos por paciente ✅
- [x] Migración `014_archivos_pacientes.sql`: tabla `archivos_pacientes` con categorías, RLS por tenant_id
- [x] Server actions: `obtenerArchivosPaciente()`, `subirArchivoPaciente()`, `eliminarArchivoPaciente()`
- [x] Componente `archivos-paciente.jsx`: form de upload (archivo + nombre + categoría + notas), lista con iconos por tipo, download/delete, filtro por categoría con badges
- [x] Tab "Archivos" en ficha del paciente funcional (reemplazó placeholder)
- [x] Categorías: estudios, documentación, consentimientos, imágenes, otros
- [x] Límite 10 MB por archivo, usa bucket `documentos` existente con ruta `tenant_id/pacientes/paciente_id/`
- [x] Iconos diferenciados por tipo de archivo (imagen, PDF, spreadsheet, genérico)

### 5.2 — Importación/exportación CSV de pacientes ✅
- [x] Botón "Exportar" en lista de pacientes: genera CSV con nombre, teléfono, email, DNI, obra social, dirección, etiquetas
- [x] Botón "Importar" en lista de pacientes: abre dialog de importación
- [x] Dialog de importación (`importar-csv-dialog.jsx`) en 3 pasos: subir archivo → preview con mapeo de columnas → resultado
- [x] Parser CSV con soporte para coma y punto y coma, respeta comillas, normaliza encabezados (acentos, espacios)
- [x] Auto-mapeo inteligente de columnas (nombre/paciente → nombre_completo, tel/celular → telefono, correo/mail → email, etc.)
- [x] Mapeo manual editable por columna con dropdown
- [x] Preview de las primeras 5 filas antes de importar
- [x] Server action `importarPacientesCSV()`: inserción en lotes de 50, validación de nombre, reporte de importados/omitidos
- [x] Template CSV descargable con columnas esperadas y ejemplo

---

## Fase 6: Página Pública — Mejoras ✅ COMPLETADA

### 6.1 — Reviews/valoraciones ✅
- [x] Tabla `reviews` en migración `017_reviews.sql` (tenant_id, nombre, email, estrellas 1-5, texto, visible, created_at) con RLS anon INSERT + anon SELECT (visible=true) + auth (todas)
- [x] Formulario público de review en `/[slug]/review` — nombre, email opcional, estrellas (hover interactivo), texto; success state con feedback
- [x] Reviews visibles en página pública: grid de cards con nombre, estrellas, texto, mes/año; promedio + contador
- [x] Link "Dejá tu reseña" al pie de la página pública (siempre disponible)
- [x] Moderación en dashboard `/dashboard/reviews`: ver pendientes y publicadas, aprobar (publicar), ocultar, eliminar
- [x] Link para compartir en dashboard con botón "Copiar link" al portapapeles
- [x] Server actions: `crearReview()` (público), `obtenerReviewsPublicas()` (público), `obtenerReviews()`, `moderarReview()`, `eliminarReview()` (dashboard)
- [x] Ítem "Reseñas" agregado al sidebar con icono Star (visible para todos los rubros)
- [x] Diseño: profesional envía link manualmente, modera antes de publicar; reseñas anónimas con nombre

### 6.2 — Google Maps ✅
- [x] Dirección ya almacenada en `tenants.configuracion.consultorio.direccion` (campo existente desde Fase 7)
- [x] Link a Google Maps en página pública (`https://www.google.com/maps/search/?api=1&query=...`)
- [x] Aparece junto a teléfono y email en sección Contacto, con ícono MapPin

### 6.3 — Branding personalizable ✅
- [x] Tab "Branding" en Configuración (`tab-branding.jsx`): logo + paleta de 8 colores predefinidos + pickers custom
- [x] Paleta predefinida: Azul, Verde, Violeta, Teal, Naranja, Rosa, Rojo, Oscuro — cada uno con color_primario + color_encabezado
- [x] Preview del hero en tiempo real dentro del tab
- [x] Upload de logo reutiliza `subirLogoConsultorio()` existente
- [x] Server action `guardarBranding()` guarda en `tenants.configuracion.branding`
- [x] `BrandingApplicator` client component en layout del dashboard aplica CSS vars `--brand-primary` y `--brand-header`
- [x] Página pública: hero con `backgroundColor: branding.color_encabezado`; botón CTA con `backgroundColor: branding.color_primario`

### 6.4 — Backup de configuración ✅
- [x] Server action `generarBackupConfiguracion()` devuelve JSON con nombre, slug, rubro, configuracion completa + timestamp
- [x] Botón "Descargar backup" en cabecera de la página de Configuración (arriba de los tabs)
- [x] Descarga archivo `.json` nombrado `backup-config-{slug}-{fecha}.json` via blob + URL temporal
- [x] No incluye datos de pacientes (export CSV separado existe en módulo Pacientes)

---

## Fase 7: Configuración del Consultorio — Completar ✅ COMPLETADA

### 7.1 — Datos completos del consultorio ✅
- [x] Tab "Consultorio" en Configuración (`tab-consultorio.jsx`): nombre, dirección, teléfono, email, sitio web, descripción
- [x] Upload de logo del consultorio con preview y eliminación (Storage bucket `perfiles`)
- [x] Server actions: `guardarConfiguracionConsultorio()`, `subirLogoConsultorio()`
- [x] Datos almacenados en `tenants.configuracion.consultorio` (JSONB)
- [x] Logo también se sincroniza a `tenants.logo_url` para página pública
- [x] PDF de recetas actualizado: muestra logo, nombre consultorio, dirección y teléfono en el header
- [x] Emails de notificaciones actualizados: muestran logo y nombre del consultorio (si existe) en lugar de solo tenant_nombre

### 7.2 — Templates de mensajes editables ✅
- [x] Tab "Mensajes" en Configuración (`tab-plantillas.jsx`): 7 tipos de mensaje editables
- [x] Tipos: cita agendada, confirmada, cancelada, reprogramada, recordatorio 24h, recordatorio 2h, nueva reserva
- [x] Variables disponibles: {paciente}, {profesional}, {consultorio}, {fecha}, {hora}, {servicio}, {motivo}
- [x] Vista previa con datos de ejemplo (dialog)
- [x] Botón restaurar a mensaje por defecto por cada tipo
- [x] Server action: `guardarConfiguracionPlantillas()` — almacena en `tenants.configuracion.plantillas`
- [x] `generarPlantilla()` en `plantillas.js` acepta plantillas custom y aplica `aplicarVariables()` con reemplazo de {variables}
- [x] `servicio.js` lee `tenantConfig.plantillas` y las pasa a `generarPlantilla()` automáticamente

### 7.3 — Múltiples profesionales (plan premium) ✅
- [x] Migración `013_multi_profesional_sucursales.sql`: tabla `invitaciones` con token/estado/expiración
- [x] Tab "Equipo" en Configuración (`tab-equipo.jsx`): lista de miembros, invitaciones pendientes
- [x] Server actions: `obtenerEquipo()`, `crearInvitacion()`, `cancelarInvitacion()`
- [x] Gate por plan: solo plan Profesional o Premium puede invitar miembros
- [x] Validaciones: email duplicado, ya en equipo, invitación ya pendiente
- [x] UI muestra roles (Profesional/Secretaria), badges, avatar, corona para owner
- [x] Selector de profesional en cita-dialog (si hay >1 profesional)
- [x] Vista de agenda consolidada con filtro por profesional
- [x] Nombre del profesional visible en eventos en vista consolidada + borde de color por profesional
- [x] Server actions (`crearCita`, `actualizarCita`) aceptan `professional_id` del formulario con validación server-side
- [x] `obtenerCitas` refactorizado: consulta por `tenant_id` con filtro opcional por profesional
- [x] `obtenerContextoNotificacion` soporta múltiples profesionales (busca por professional_id específico)
- [x] Permisos por rol (`lib/permisos.js`): profesional = acceso completo, secretaria = agenda + pacientes + facturación + lista espera
- [x] Sidebar filtrado por rol (oculta Servicios, Horarios, Reportes, Configuración, módulos de rubro para secretarias)
- [x] Protección server-side: páginas de configuración, servicios, horarios y reportes redirigen a secretarias
- [x] Helper `verificarPermisoServer()` para validación en server actions

### 7.4 — Múltiples sucursales (plan premium) ✅
- [x] Tabla `sucursales` con RLS (tenant_id, nombre, dirección, teléfono, email, activa, es_principal)
- [x] Columna `sucursal_id` agregada a tabla `citas`
- [x] UI en tab "Equipo": lista de sucursales, crear/eliminar, badge principal/inactiva
- [x] Server actions: `obtenerSucursales()`, `crearSucursal()`, `actualizarSucursal()`, `eliminarSucursal()`
- [x] Gate por plan: solo plan Premium puede crear múltiples sucursales
- [x] Primera sucursal se marca automáticamente como principal; principal no se puede eliminar
- [x] Selector de sucursal en cita-dialog (si hay sucursales)
- [x] `crearCita` y `actualizarCita` guardan `sucursal_id` en la cita
- [x] Agenda page.js obtiene sucursales del tenant y las pasa al componente
- [x] Filtro por sucursal en agenda (dropdown, filtra eventos del calendario)
- [x] Filtro por sucursal en reportes (citas, ingresos, pacientes) — dropdown en header + parámetro en server actions

---

## Fase 8: Auth — Métodos adicionales ✅ COMPLETADA

### 8.1 — Magic link ✅
- [x] Opción "Iniciar sesión con link mágico" en login (tab "Link magico")
- [x] Server action `enviarMagicLink()`: usa `signInWithOtp()` con `emailRedirectTo` a `/api/auth/callback`
- [x] Redirect post-login al dashboard (o /onboarding si es usuario nuevo)

### 8.2 — Google OAuth ✅
- [x] Botón "Continuar con Google" en login y registro
- [x] Client-side: `signInWithOAuth({ provider: "google", redirectTo: origin + "/api/auth/callback" })`
- [x] Ruta `/api/auth/callback`: intercambia code OAuth o verifica token_hash (magic link), luego redirige a /dashboard o /onboarding según si el usuario tiene perfil
- [x] Si el usuario ya existe con email/password, Supabase vincula las cuentas automáticamente

---

## Fase 9: Dashboard y Analytics ✅ COMPLETADA

### 9.1 — Servicios más demandados ✅
- [x] Server action `obtenerReporteServicios()` — agrupa citas por servicio, cuenta total/completadas/canceladas, calcula ingresos estimados
- [x] Gráfico de barras horizontal (Recharts, layout="vertical") ranking de servicios por citas
- [x] Tabla de detalle con columnas: posición, servicio, total, completadas, canceladas, ingresos
- [x] Cards de resumen: total citas, servicios activos, servicio más demandado

### 9.2 — Horarios pico ✅
- [x] Server action `obtenerReporteHorarios()` — extrae hora de `hora_inicio` y día de semana de `fecha`
- [x] Gráfico de barras por hora del día (6:00–21:00) con intensidad de color según ocupación
- [x] Gráfico de barras por día de la semana (Lun–Dom)
- [x] Cards de resumen: total citas, hora pico, día más ocupado

---

## Fase 10: Mejoras por Rubro ✅ COMPLETADA (parcial)

### 10.1 — Odontología
- [ ] Registro fotográfico antes/después (upload imágenes con comparación side-by-side)
- [ ] Recetas PDF (integrar con sistema de recetas universal de Fase 2)

### 10.2 — Medicina ✅
- [ ] Adjuntar estudios/imágenes a la historia clínica (Storage) — pendiente
- [x] Alertas de alergias y medicación crónica: badge "Alergias" + badge "Med. crónica" en header de historia clínica; banner de alerta en cita-dialog cuando se selecciona paciente con alergias (solo rubro medicina via `useAuthStore`)
- [x] Server action `obtenerAlertasMedicas(pacienteId)` — agrega alergias + medicación de todas las entradas

### 10.3 — Abogados ✅
- [x] Seguimiento de estados procesales: tabla `etapas_procesales` (migración 016) + componente timeline `etapas-procesales.jsx` + tab "Etapas" en expediente-detalle
- [x] Server actions: `crearEtapaProcesalAction()`, `eliminarEtapaProcesal()` en abogados.js
- [ ] Registro de honorarios y pagos parciales por expediente — pendiente
- [ ] Notas privadas por caso — ya existía campo `notas_privadas` en expedientes

### 10.4 — Veterinaria ✅
- [x] Control de desparasitaciones: tabla `desparasitaciones` (migración 016) + `desparasitacion-dialog.jsx` + `desparasitaciones-lista.jsx` + tab en mascota-detalle
- [x] Alertas de próxima dosis (vencida / en X días) con badges de color
- [x] Server actions: `obtenerDesparasitaciones()`, `registrarDesparasitacion()`, `eliminarDesparasitacion()` en veterinaria.js
- [ ] Recetas y tratamientos (integrar con sistema universal) — pendiente

### 10.5 — Psicología ✅
- [x] Consentimiento informado digital: tabla `consentimientos_informados` (migración 016)
- [x] Template editable con texto base de consentimiento psicológico
- [x] `consentimiento-dialog.jsx` — crear consentimiento con switch "Firmado"
- [x] Page `/dashboard/consentimientos` con lista, marcar firmado, expandir texto, eliminar
- [x] Módulo agregado en `config/rubros.js` para psicología

### 10.6 — Contadores ✅
- [x] Repositorio de documentos por cliente: page `/dashboard/documentos-cliente` que usa `ArchivosPaciente` existente (migration 014)
- [x] Selector de cliente + vista de archivos categorizados
- [x] Módulo agregado en `config/rubros.js` para contadores
- [ ] Notas y seguimiento por trámite — pendiente

---

## Fase 11: Panel de Superadmin ✅ COMPLETADA

### 11.1 — Gestión de tenants/clientes ✅
- [x] Listado de todos los tenants con búsqueda y filtros (nombre/slug, rubro, plan) en `/superadmin/tenants`
- [x] Detalle de tenant: datos, stats (citas, pacientes, ingresos del mes), lista de usuarios en `/superadmin/tenants/[id]`
- [x] Acciones: activar/desactivar tenant, cambiar plan, extender trial +14/+30 días
- [x] Migración 018 agrega columna `trial_ends_at` a `tenants`
- [x] Checkboxes por fila + seleccionar todos → eliminación masiva con confirmación
- [x] Botón eliminar por fila con dialog de confirmación (lista nombres afectados + advertencia irreversible)
- [x] `eliminarTenant()` / `eliminarTenants()`: elimina en cascada desde PostgreSQL + borra auth.users vía admin API; protege `_plataforma`
- [x] Botón impersonar por fila: genera magic link con `admin_access=true`, instrucciones paso a paso, copiar al portapapeles
- [x] `impersonarTenant()`: encuentra al profesional owner del tenant y genera link de acceso

### 11.2 — Gestión de usuarios ✅
- [x] Buscar usuarios por email o nombre, filtrar por rol en `/superadmin/usuarios`
- [x] Cambiar contraseña directamente desde el panel (Supabase admin API `updateUserById`)
- [x] Generar link de acceso (magic link) para impersonación — copiado al portapapeles, válido 1 hora
- [x] Activar/desactivar usuarios individualmente
- [x] Botón eliminar por fila: elimina de tabla `users` + `auth.users`; protege cuentas superadmin

### 11.3 — Recuperación de datos ✅ (parcial)
- [x] Stats de citas, pacientes e ingresos de cualquier tenant visibles en el detalle del tenant
- [ ] Restaurar registros eliminados (soft delete) — pendiente
- [ ] Exportar datos de tenant — pendiente

### 11.4 — Logs y auditoría ✅
- [x] Tabla `audit_logs` (tenant_id, user_id, accion, entidad, entidad_id, datos JSONB, created_at) en migración 018
- [x] Helper `lib/audit.js` con `registrarAuditLog()` usando admin client (bypass RLS, non-blocking)
- [x] Eventos instrumentados: login de usuarios, cambio de plan, activar/desactivar tenant, cambio de contraseña por admin, activar/desactivar usuario
- [x] Vista en `/superadmin/audit`: timeline expandible con datos JSON, filtro por acción, botón refresh
- [x] RLS: cada tenant ve sus propios logs; superadmin ve todo via service role

### 11.5 — Métricas globales ✅
- [x] Dashboard en `/superadmin`: KPI cards (tenants, usuarios, citas totales, citas del mes, ingresos del mes, en trial)
- [x] Gráfico de barras: distribución por rubro (con colores por rubro)
- [x] Gráfico de barras: distribución por plan
- [x] Gráfico de crecimiento: nuevos tenants en los últimos 6 meses

### 11.6 — Planes y suscripciones ✅ (asignación, sin enforcement)
- [x] Planes existentes: trial, basico, profesional, premium (definidos en migración 001)
- [x] Superadmin puede cambiar el plan de cualquier tenant desde el detalle
- [x] Al cambiar a trial, se setea automáticamente `trial_ends_at` a 14 días
- [ ] Enforcement de límites por plan (bloquear features) — **pendiente, ver Fase 13**

### 11.7 — Impersonación con banner de admin ✅
- [x] Al generar link de impersonación, se pasa `?admin_access=true` en el redirectTo
- [x] `api/auth/callback` lee el param y redirige a `/dashboard?admin_access=true`
- [x] `AdminAccessBanner` (componente client): detecta `?admin_access=true` y persiste en `sessionStorage`
- [x] Banner ámbar visible en todo el dashboard indicando "Estás viendo el panel de [nombre]"
- [x] Botón "Cerrar sesión" en el banner limpia sessionStorage y cierra la sesión del tenant

### 11.8 — Auth: olvide mi contraseña ✅
- [x] Página `/olvide-contrasena`: form de email → `solicitarRecuperacion()` → `resetPasswordForEmail()` con redirectTo
- [x] Página `/actualizar-contrasena`: form nueva contraseña → `actualizarContrasena()` → `updateUser({ password })`
- [x] HashErrorHandler en root layout: captura errores del hash (#error=otp_expired etc.) y redirige a `/login?auth_error=...`
- [x] LoginForm muestra banner de error amigable si viene `?auth_error=` en la URL (AlertTriangle icon)
- [x] Link "¿Olvidaste tu contraseña?" agregado al login form

### 11.9 — Auth UX para superadmin ✅
- [x] Botón "Cerrar sesión" en el footer del sidebar de superadmin (`sidebar-superadmin.jsx`) — usa `cerrarSesion()` de `(auth)/actions`
- [x] Link discreto "Admin" en la página de login (`login/page.js`): texto 10px, muted-foreground/30, icono ShieldCheck, debajo del link de registro

### 11.10 — Bandeja de solicitudes de demo ✅
- [x] Tabla `solicitudes_demo` (nombre, email, telefono, rubro, mensaje, estado, created_at) — SQL a ejecutar en Supabase
- [x] Server actions: `obtenerSolicitudesDemo({ estado })`, `actualizarEstadoDemo(id, nuevoEstado)` en `superadmin.js`
- [x] Página `/superadmin/demos`: lista de solicitudes con filtro por estado, badge de pendientes en el título
- [x] Card por solicitud: nombre, email (mailto), teléfono (tel link), rubro badge, mensaje, fecha
- [x] Estados: `pendiente` (amarillo), `contactado` (azul), `descartado` (gris); botones para cambiar estado
- [x] Sidebar superadmin: ítem "Demos" con icono Inbox entre Planes y Audit Log
- [x] Formulario de demo en landing guarda directamente en la tabla sin enviar email

### 11.11 — Flujo de plan desde landing ✅
- [x] Botones de precios en landing (`precios.jsx`): Trial → `/registro`, planes pagos → `/registro?plan=X`
- [x] Página de registro lee `?plan` de searchParams, valida contra whitelist, muestra banner "Plan seleccionado"
- [x] `RegistroForm` recibe `planInteres` como prop, lo envía como `<input type="hidden">`
- [x] Server action `registrarse()` captura `plan_interes`, tras RPC exitosa lo guarda en `tenants.configuracion.plan_interes` (admin client para bypass RLS)
- [x] Superadmin tenants list: badge naranja "Solicitó: X" bajo el plan actual cuando `configuracion.plan_interes` difiere del `plan` actual

### Arquitectura del superadmin
- Ruta `/superadmin` con route group propio `(superadmin)` y layout independiente
- Guard en layout: verifica `users.rol === 'superadmin'`; redirige a `/dashboard` si no
- `lib/supabase/admin.js`: cliente service role (bypass RLS total) — server-only
- Botón "Admin" visible en el topbar del dashboard solo para usuarios con `rol === 'superadmin'`
- Setup manual: crear tenant `_plataforma` + user con `rol = 'superadmin'` (instrucciones en migración 018)

---

## Fase 13: Planes y Feature Gating ✅ COMPLETADA

> Planes predefinidos con módulos habilitados, más overrides manuales por tenant desde el superadmin.

### 13.1 — Migración SQL `019_planes.sql` ✅
- [x] Tabla `planes` (id, nombre, label, precio, descripcion, features JSONB, limites JSONB, activo, orden)
- [x] Planes iniciales: `trial`, `basico`, `profesional`, `premium` con features y límites
- [x] Columna `features_override` JSONB en tabla `tenants` (overrides sobre el plan base)
- [x] 17 features definidas: `pagina_publica`, `recurrencia`, `lista_espera`, `sobreturno`, `consulta_activa`, `recetas`, `firma_digital`, `notificaciones_email`, `notificaciones_whatsapp`, `reportes_avanzados`, `facturacion`, `modulos_rubro`, `archivos_pacientes`, `exportar_csv`, `multi_profesional`, `sucursales`, `historial_clinico`
- [x] Límites: `max_profesionales`, `max_citas_mes`, `max_pacientes` (null = ilimitado)
- [x] RLS: cualquier usuario autenticado puede leer planes; escritura solo via service role

### 13.2 — Utility `lib/features.js` ✅
- [x] `FEATURES_LISTA`, `FEATURES_LABELS`, `LIMITES_LABELS` — constantes
- [x] `PLAN_FEATURES_DEFAULT` — fallback estático cuando la tabla no existe
- [x] `getTenantFeatures(tenant, planData?)` — mergea features del plan + overrides del tenant
- [x] `tenantTiene(tenant, feature)` — boolean para gating
- [x] `tenantLimite(tenant, limite)` — límite numérico efectivo (null = sin límite)

### 13.3 — Gestión de planes en superadmin ✅
- [x] Página `/superadmin/planes`: cards de los 4 planes con lista de features habilitadas/deshabilitadas
- [x] Dialog "Editar plan": precio, descripción, límites (toggle ilimitado/numérico), toggles por feature
- [x] Botón "Restaurar defaults" en dialog de edición
- [x] `actualizarPlan()` server action con audit log
- [x] En detalle de tenant (`/superadmin/tenants/[id]`): sección "Overrides de features" con botones OFF/AUTO/ON por feature
- [x] Distingue visualmente "heredado del plan" vs "override activo" (fondo ámbar)
- [x] `actualizarTenantOverride()` server action con audit log

### 13.4 — Enforcement en la app ✅ COMPLETADA
- [x] `PlanGate` component (`components/plan-gate.jsx`): renderiza children o card "bloqueado" con plan mínimo requerido; prop `inline` para badge compacto
- [x] `tab-equipo.jsx`: usa `tenantTiene(tenant, "multi_profesional")` y `tenantTiene(tenant, "sucursales")` en lugar de checks hardcodeados de plan
- [x] `actions/equipo.js`: idem en `crearInvitacion` y `crearSucursal` (query incluye `features_override`)
- [x] Sidebar filtra items con `feature` por plan: Lista de espera, Facturación, Reportes se ocultan si el plan no los incluye
- [x] Módulos de rubro (sidebar) se ocultan si `modulos_rubro` no está habilitado
- [x] `verificarFeature(feature)` helper server-side en `guard-rubro.jsx` + `FeatureNoDisponible` component
- [x] Pages bloqueadas server-side: `facturacion/page.js`, `reportes/page.js`, `recetas/page.js` — muestran pantalla de "plan no disponible" si el tenant no tiene la feature
- [x] Botones Exportar/Importar CSV en `pacientes-cliente.jsx` envueltos en `<PlanGate feature="exportar_csv" fallback={null}>`

### 13.5 — UX de upgrade ✅
- [x] Dialog "Actualizar plan" en `PlanGate`: muestra plan actual, plan mínimo requerido, tabla de comparación de features por plan, botón "Ver planes"
- [x] Página `/planes` (`src/app/planes/page.js`): cards por plan (Trial/Básico/Profesional/Premium), tabla de features agrupadas por categoría, CTA a registro

---

## Fase 14: Rediseño de la Landing ✅ COMPLETADA

### 14.1 — Landing page ✅
- [x] Hero con badge "Nuevo", tipografía grande (5xl–7xl), glow de fondo con `blur-3xl`, CTA doble
- [x] Barra de stats (4 números clave: rubros, días trial, en la nube, 24/7)
- [x] Bento grid de features: 2 cards grandes (agenda + módulos por rubro) + 7 normales con hover
- [x] Tags de contexto en las cards grandes (Recurrente, Lista espera, etc.)
- [x] Sección "Para cada profesión" con `SelectorProfesion` existente
- [x] Sección de testimonios con estrellas
- [x] Directorio de profesionales (componente existente)
- [x] Eyebrow labels en uppercase (Funcionalidades / Verticales / Precios / etc.)
- [x] Demo en card con `rounded-3xl`
- [x] Footer simplificado (logo + links + copyright)

### 14.2 — Cómo funciona ✅
- [x] Pasos numerados `01/02/03` con círculos centrados
- [x] Línea conectora horizontal en desktop (posicionada absolutamente)

### 14.3 — Precios ✅
- [x] 4 columnas: Trial / Básico / Profesional / Premium
- [x] Checkmarks ✓ vs `—` por feature (visible/tenue)
- [x] Badge "Más popular" en plan Profesional
- [x] Precio + período + descripción por plan
- [x] Sincronizado con límites reales del sistema de planes

### 14.4 — Identidad visual y color ✅
- [x] Fondo dot-pattern (`@layer utilities .bg-dot-pattern`) — puntos sutiles en claro y oscuro
- [x] Gradiente hero: blobs violeta + azul difuminados con `blur-3xl`
- [x] Texto hero con gradiente CSS (`from-violet-600 via-primary to-blue-600`)
- [x] Cards de features con colores individuales (6 tonos distintos)
- [x] Barra de stats con números en gradiente
- [x] CTA section con fondo gradiente y backdrop-blur

### 14.5 — Mockup de app ✅
- [x] Componente `hero-mockup.jsx`: ventana de app CSS-only decorativa (select-none, pointer-events-none)
- [x] Elementos: traffic-light dots, URL bar, sidebar nav, 4 bloques de cita coloreados (emerald/blue/violet/amber), mini stat box, badge flotante "Ana López - Turno confirmado", pill "+3 nuevos hoy"
- [x] Layout hero 2 columnas en desktop (texto izquierda, mockup derecha)

### 14.6 — Theme toggle en landing ✅
- [x] `ThemeToggle` agregado al header de la landing (independiente del dashboard)
- [x] El modo claro/oscuro de la landing no afecta ni depende del estado guardado en el dashboard

---

## Fase 12: Testing y Optimización ✅ PARCIAL

### 12.1 — Testing
- [ ] Tests unitarios de Server Actions críticas (citas, pacientes, pagos, auth)
- [ ] Tests de integración de flujos completos (registro → crear paciente → crear cita → cobrar)
- [ ] Tests de RLS (verificar aislamiento de datos entre tenants)
- [ ] Tests de formularios (validación, submit, feedback)

### 12.2 — Optimización de rendimiento ✅ (parcial)
- [ ] Audit con Lighthouse (performance, accessibility, SEO)
- [ ] Optimización de imágenes (next/image, formatos modernos)
- [x] Lazy loading de componentes pesados: `AgendaCliente` (react-big-calendar, `ssr: false`), `ReportesCliente` (Recharts, `ssr: false`), 5 tabs de reportes vía `dynamic()`
- [ ] Paginación server-side en listados grandes (citas, pagos, logs) — pacientes ya usa search server-side

### 12.3 — Accesibilidad ✅ (parcial)
- [x] `aria-label` en botón de menú de usuario (topbar)
- [x] `sr-only` ya presente en theme toggle y botón menú móvil
- [ ] Keyboard navigation completa (tab order, focus management)
- [ ] Contraste de colores suficiente (WCAG AA)
- [ ] Screen reader: labels descriptivos en formularios

### 12.4 — SEO y meta tags ✅ (parcial)
- [x] Open Graph + Twitter Cards en páginas públicas de profesionales (título, descripción, logo)
- [x] Metadata base en root layout: title template, keywords, OpenGraph, Twitter
- [x] `sitemap.js`: sitemap dinámico con páginas estáticas + slugs de todos los tenants activos
- [x] `robots.js`: robots.txt — permite `/`, bloquea `/dashboard/`, `/superadmin/`, `/api/`
- [ ] Structured data (JSON-LD) para profesionales (LocalBusiness schema)

---

## Orden de ejecución sugerido

```
Fase 0  → Bugs críticos de formularios (URGENTE)
Fase 1  → Core de agenda (turnos recurrentes, notificaciones, sobreturnos)
Fase 2  → Recetas y firma digital
Fase 3  → Nuevo rubro: Oftalmología
Fase 4  → Recursos por profesión (Argentina)
Fase 5  → Archivos y CSV de pacientes
Fase 6  → Mejoras página pública ✅
Fase 7  → Configuración del consultorio
Fase 8  → Auth adicional (Magic link, Google OAuth)
Fase 9  → Analytics: servicios demandados, horarios pico
Fase 10 → Gaps por rubro
Fase 11 → Panel de superadmin
Fase 12 → Testing y optimización
```

> **Nota:** Las fases pueden ejecutarse en paralelo donde no haya dependencias.
> La Fase 0 es bloqueante — sin formularios funcionales el resto no tiene sentido.
> Las fases 1-3 son las de mayor impacto para el producto.
> La fase 11 (superadmin) puede comenzarse en paralelo con las fases 4-10.

---

## Estado al 2026-03-11 — Progreso y recomendaciones

### Completado
- Fases 0, 1, 2, 4, 5, 6, 7, 8, 9, 10 (parcial), 11, 12 (parcial), 13, 14 — **~99% de la recta final completado**

### SQL pendiente de ejecutar manualmente en Supabase

> ⚠️ Estos scripts no se pueden aplicar desde código — deben ejecutarse en el SQL Editor de Supabase.

**1. Tabla `solicitudes_demo`** — necesaria para la bandeja de demos del superadmin
```sql
CREATE TABLE IF NOT EXISTS public.solicitudes_demo (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  email       text NOT NULL,
  telefono    text,
  rubro       text,
  mensaje     text,
  estado      text NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','contactado','descartado')),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.solicitudes_demo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon insert" ON public.solicitudes_demo FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "service read" ON public.solicitudes_demo FOR ALL USING (true);
```

**2. Fix función `inicializar_disponibilidad_profesional`** — corrige error `{}` en página de Horarios
El UNIQUE constraint original `(professional_id, dia_semana)` fue reemplazado en migración 008 por `(professional_id, dia_semana, bloque)`, pero la función quedó con la definición vieja. Re-ejecutar la función actualizada desde `008_bloque_disponibilidad.sql`.

---

### Pendiente (orden recomendado)

**1. Fase 3 — Oftalmología** *(único rubro sin implementar)*
Requiere migración SQL + componentes específicos: ficha oftalmológica (agudeza visual OD/OI, PIO, fondo de ojo), historial de graduaciones, recetas de lentes con campos ópticos, adjuntar estudios (OCT, campimetría).

**2. Items pendientes por rubro (Fase 10)**
- 10.1: Registro fotográfico antes/después (odontología) — comparación side-by-side
- 10.2: Adjuntar estudios/imágenes a historia clínica (medicina) — usar bucket Storage existente
- 10.3: Honorarios y pagos parciales por expediente (abogados)
- 10.4: Recetas y tratamientos veterinarios — ya integrado parcialmente
- 10.6: Notas y seguimiento por trámite (contadores)

**3. Fase 12 — Testing y optimización** *(antes del lanzamiento)*
- Lighthouse audit (performance, accessibility, SEO)
- Paginación server-side en listados grandes (citas, pagos, audit logs)
- JSON-LD structured data (LocalBusiness) en páginas públicas de profesionales
- Tests de RLS (aislamiento entre tenants)

---

### Sugerencias para próximas iteraciones

**A. Onboarding guiado post-registro** *(alta prioridad de conversión)*
Al crear la cuenta, llevar al usuario por un wizard de 4 pasos antes del dashboard: (1) completar perfil profesional + matrícula, (2) configurar horarios, (3) crear primer servicio, (4) compartir link de reservas. Reduce la tasa de abandono del primer acceso.

**B. Notificaciones push / WhatsApp** *(diferenciador de plan Premium)*
El scaffold de WhatsApp ya existe. Integrar Twilio o Meta Cloud API para enviar recordatorios por WhatsApp al paciente. Es la feature que más valoran los profesionales argentinos para reducir ausencias.

**C. Dashboard de métricas del profesional** *(mejora retención)*
Agregar a la página principal del dashboard: tasa de asistencia (asistió vs canceló), ingresos del mes vs mes anterior, próximas citas del día con foto del paciente. Pequeñas mejoras que hacen al producto "sticky".

**D. Límites de plan con enforcement suave** *(monetización)*
Los límites (`max_citas_mes`, `max_pacientes`) están definidos en la tabla `planes` pero no se verifican en las actions. Implementar verificación antes de crear cita/paciente con mensaje claro "Alcanzaste el límite del Trial — actualizá tu plan".

**E. Limpiar `plan_interes` tras activar plan** *(dato de conversión limpio)*
Cuando el superadmin cambia el plan de un tenant (`cambiarPlanTenant`), debería limpiar `configuracion.plan_interes` para que el badge naranja desaparezca automáticamente sin intervención manual.

**F. Email de bienvenida post-registro** *(conversión)*
Actualmente el registro confirma por email de Supabase pero no hay email propio de bienvenida. Enviar un email con Resend presentando el producto, el link al dashboard y los primeros pasos. Incluir `plan_interes` si vino de la página de precios.

**G. Página de estado del sistema** *(confianza)*
Una página pública simple `/status` que muestre uptime de Supabase y del deploy. Mejora la percepción de profesionalismo ante clientes enterprise.

**H. Recuperar contraseña robustecido** *(UX)*
El flujo actual usa `type=recovery` de Supabase pero el callback redirige al dashboard. Debería redirigir específicamente a `/actualizar-contrasena` y mostrar el token en la sesión para que el usuario no tenga que loguearse de nuevo.
