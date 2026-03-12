# Step 7 — Módulos Específicos por Rubro (Plan de Acción)

## Contexto
TurnoPro se adapta según el rubro del profesional. Cada vertical activa módulos específicos en el sidebar y tiene tablas, acciones y componentes propios. La config de rubros existe (`src/config/rubros.js`) con 6 verticales, pero no hay tablas, páginas ni componentes de rubro implementados.

## Estado: PENDIENTE (plan aprobado, sin implementar)

## Dependencia
```bash
npm install @react-pdf/renderer
```

---

## Fase 1: SQL Migration (`supabase/migrations/006_modulos_rubro.sql`)

**19 tablas** organizadas por rubro, todas con `tenant_id`, RLS con `public.get_tenant_id_for_user()`, indices y triggers `updated_at`:

### Odontología (4 tablas)
- `odontogramas` (id, tenant_id, paciente_id, tipo CHECK adulto/infantil, datos JSONB, notas, UNIQUE paciente+tipo)
  - datos JSONB: `{ "11": { "caras": { "mesial": "caries", "oclusal": "sano", ... }, "estado": "presente" }, ... }` — keyed by FDI notation (11-48 adulto, 51-85 infantil)
  - Caras: mesial, distal, oclusal/incisal, vestibular, lingual/palatino
  - Estados cara: sano, caries, obturado, fractura, sellante
  - Estados diente: presente, ausente, implante, corona, protesis
- `planes_tratamiento` (id, tenant_id, paciente_id, titulo, descripcion, estado CHECK pendiente/en_curso/completado/cancelado, costo_total DECIMAL(10,2), notas)
- `etapas_tratamiento` (id, plan_id FK CASCADE, tenant_id, orden INT, descripcion, dientes TEXT[], costo DECIMAL(10,2), estado CHECK pendiente/en_curso/completado, notas, fecha_completada DATE)
- `historias_clinicas_dentales` (id, tenant_id, paciente_id, cita_id FK nullable, fecha DATE, diagnostico, procedimiento, dientes_afectados TEXT[], observaciones)

### Medicina (3 tablas)
- `historias_clinicas` (id, tenant_id, paciente_id, cita_id FK nullable, fecha DATE, motivo_consulta, diagnostico, indicaciones, antecedentes, alergias TEXT[], medicacion_cronica TEXT[], observaciones)
- `signos_vitales` (id, tenant_id, paciente_id, fecha DATE, peso_kg DECIMAL(5,2), altura_cm DECIMAL(5,1), presion_sistolica INT, presion_diastolica INT, temperatura DECIMAL(4,1), frecuencia_cardiaca INT, saturacion_o2 INT, notas)
- `recetas` (id, tenant_id, paciente_id, fecha DATE, diagnostico, medicamentos JSONB `[{nombre, dosis, frecuencia, duracion, indicaciones}]`, indicaciones_generales)

### Abogados (3 tablas)
- `expedientes` (id, tenant_id, paciente_id, caratula, numero_expediente, juzgado, fuero, estado CHECK activo/en_tramite/con_sentencia/archivado/apelado, tipo, descripcion, notas_privadas, fecha_inicio DATE)
- `documentos_legales` (id, tenant_id, expediente_id FK CASCADE, paciente_id, nombre, archivo_url, archivo_path, tipo_archivo, tamano_bytes BIGINT, notas) — sin UPDATE policy (append-only)
- `vencimientos_legales` (id, tenant_id, expediente_id FK nullable, paciente_id nullable, titulo, descripcion, fecha_vencimiento DATE, completado BOOLEAN, prioridad CHECK baja/media/alta/urgente)

### Veterinaria (3 tablas)
- `mascotas` (id, tenant_id, tutor_id FK pacientes CASCADE, nombre, especie CHECK perro/gato/ave/reptil/roedor/otro, raza, peso_kg DECIMAL(6,2), fecha_nacimiento DATE, sexo CHECK macho/hembra, color, microchip, foto_url, notas, activo BOOLEAN)
- `vacunaciones` (id, tenant_id, mascota_id FK CASCADE, vacuna, fecha_aplicacion DATE, fecha_proxima DATE nullable, lote, veterinario, notas)
- `consultas_mascota` (id, tenant_id, mascota_id FK CASCADE, cita_id FK nullable, fecha DATE, motivo, diagnostico, tratamiento, peso_kg DECIMAL(6,2), temperatura DECIMAL(4,1), observaciones)

### Psicología (4 tablas)
- `notas_sesion` (id, tenant_id, paciente_id, cita_id FK nullable, fecha DATE, contenido TEXT NOT NULL, estado_emocional, temas TEXT[], objetivos, tareas, privado BOOLEAN DEFAULT true)
- `evoluciones` (id, tenant_id, paciente_id, fecha DATE, titulo, descripcion, puntuacion INT CHECK 1-10, area)
- `cuestionarios` (id, tenant_id, nombre, descripcion, tipo CHECK phq9/gad7/personalizado, preguntas JSONB `[{texto, tipo, min, max, opciones}]`, activo BOOLEAN)
- `respuestas_cuestionario` (id, tenant_id, cuestionario_id FK CASCADE, paciente_id, respuestas JSONB, puntuacion_total INT, interpretacion, fecha DATE)

### Contadores (3 tablas)
- `vencimientos_fiscales` (id, tenant_id, paciente_id nullable, titulo, descripcion, obligacion, fecha_vencimiento DATE, completado BOOLEAN, prioridad CHECK, recurrente BOOLEAN, recurrencia CHECK mensual/bimestral/trimestral/semestral/anual)
- `checklists_documentacion` (id, tenant_id, paciente_id, titulo, periodo, notas)
- `checklist_items` (id, checklist_id FK CASCADE, tenant_id, descripcion, completado BOOLEAN, fecha_completado DATE, orden INT, notas)

### Storage Buckets
- `documentos` (privado, 10MB, PDF/images/Word) — path: `{tenantId}/{expedienteId}/{filename}`
- `mascotas` (público, 5MB, images) — path: `{tenantId}/{mascotaId}/{filename}`

### RLS Pattern (todas las tablas)
```sql
-- SELECT, INSERT, UPDATE, DELETE filtrando por:
tenant_id = public.get_tenant_id_for_user()
```

---

## Fase 2: Constantes + Sidebar dinámico

### Modificar `src/lib/constants.js`
```javascript
ESTADOS_DIENTE = { PRESENTE, AUSENTE, IMPLANTE, CORONA, PROTESIS }
ESTADOS_CARA_DIENTE = { SANO, CARIES, OBTURADO, FRACTURA, SELLANTE }
ESPECIES_MASCOTA = [{ valor: 'perro', nombre: 'Perro' }, ...]
ESTADOS_EXPEDIENTE = [{ valor: 'activo', nombre: 'Activo' }, ...]
PRIORIDADES = [{ valor: 'baja', nombre: 'Baja', color: '#22c55e' }, ...]
OBLIGACIONES_FISCALES = [{ valor: 'iva', nombre: 'IVA' }, ...]
```

### Modificar `src/config/rubros.js`
- Agregar propiedad `icono` (lucide-react) a cada módulo objeto
- Actualizar `ruta` para incluir prefijo `/dashboard`
- Iconos sugeridos: CircleDot (odontograma), ClipboardList (tratamientos), FileHeart (historia dental), Activity (signos vitales), Pill (recetas), FolderOpen (expedientes), FileUp (documentos), CalendarClock (vencimientos), PawPrint (mascotas), Syringe (vacunación), NotebookPen (notas sesión), TrendingUp (evolución), ClipboardCheck (cuestionarios), ListChecks (checklists)

### Modificar `src/components/layout/sidebar.jsx`
- Después de items estáticos: `<Separator>` + label del rubro + módulos dinámicos
- Usar `getRubroModulos(tenant.rubro)` para obtener módulos
- Cada módulo renderiza Link con icono y nombre
- Si sidebar colapsado, solo icono con title tooltip

---

## Fase 3: Validaciones (6 archivos en `src/lib/validations/`)
- `rubro-odontologia.js`: odontogramaSchema, planTratamientoSchema, etapaTratamientoSchema, historiaDentalSchema
- `rubro-medicina.js`: historiaClinicaSchema, signosVitalesSchema, recetaSchema, medicamentoSchema
- `rubro-abogados.js`: expedienteSchema, documentoLegalSchema, vencimientoLegalSchema
- `rubro-veterinaria.js`: mascotaSchema, vacunacionSchema, consultaMascotaSchema
- `rubro-psicologia.js`: notaSesionSchema, evolucionSchema, cuestionarioSchema, respuestaCuestionarioSchema
- `rubro-contadores.js`: vencimientoFiscalSchema, checklistSchema, checklistItemSchema

---

## Fase 4: Server Actions (6 archivos en `src/app/(dashboard)/actions/`)

### `odontologia.js`
- `obtenerOdontograma(pacienteId, tipo='adulto')` — fetch o crear default
- `guardarOdontograma(odontogramaId, datos)` — update JSONB
- `obtenerPlanesTratamiento(pacienteId)` — list con etapas
- `crearPlanTratamiento(prevState, formData)` — plan + etapas
- `actualizarEstadoEtapa(etapaId, estado)` — quick toggle
- `obtenerHistoriaDental(pacienteId)` — list ordered by fecha DESC
- `crearEntradaHistoriaDental(prevState, formData)`

### `medicina.js`
- `obtenerHistoriaClinica(pacienteId)` — list
- `crearEntradaHistoria(prevState, formData)` — con alergias/medicacion arrays
- `obtenerSignosVitales(pacienteId)` — list para charts
- `registrarSignosVitales(prevState, formData)`
- `obtenerRecetas(pacienteId)` — list
- `crearReceta(prevState, formData)` — con medicamentos JSONB
- `obtenerRecetaPDF(recetaId)` — datos para PDF client-side

### `abogados.js`
- `obtenerExpedientes(busqueda, estado)` — list con search/filter
- `crearExpediente(prevState, formData)`
- `actualizarExpediente(id, prevState, formData)`
- `obtenerExpedienteDetalle(id)` — con documentos y vencimientos
- `subirDocumento(prevState, formData)` — upload a Supabase Storage bucket "documentos"
- `eliminarDocumento(id)` — delete storage + DB
- `obtenerVencimientosLegales(filtro)`
- `crearVencimientoLegal(prevState, formData)`
- `completarVencimiento(id)`

### `veterinaria.js`
- `obtenerMascotas(tutorId?)` — list todas o por tutor
- `crearMascota(prevState, formData)` — con foto upload a bucket "mascotas"
- `actualizarMascota(id, prevState, formData)`
- `obtenerMascotaDetalle(id)` — con vacunas y consultas
- `registrarVacunacion(prevState, formData)`
- `obtenerCartillaVacunacion(mascotaId)`
- `crearConsultaMascota(prevState, formData)`
- `obtenerHistorialMascota(mascotaId)`

### `psicologia.js`
- `obtenerNotasSesion(pacienteId)` — ordered by fecha DESC
- `crearNotaSesion(prevState, formData)`
- `actualizarNotaSesion(id, prevState, formData)`
- `obtenerEvoluciones(pacienteId)` — para timeline
- `registrarEvolucion(prevState, formData)`
- `obtenerCuestionarios()` — list del tenant
- `crearCuestionario(prevState, formData)` — personalizado
- `aplicarCuestionario(prevState, formData)` — respuestas + scoring
- `obtenerRespuestasCuestionario(pacienteId, cuestionarioId)`
- `inicializarCuestionariosPredefinidos()` — seed PHQ-9 y GAD-7

### `contadores.js`
- `obtenerVencimientosFiscales(filtro)`
- `crearVencimientoFiscal(prevState, formData)`
- `completarVencimientoFiscal(id)`
- `obtenerChecklists(pacienteId)`
- `crearChecklist(prevState, formData)` — con items iniciales
- `toggleChecklistItem(itemId, completado)`
- `agregarChecklistItem(checklistId, prevState, formData)`
- `eliminarChecklistItem(itemId)`

---

## Fase 5: Componentes (40 archivos en `src/components/rubro/`)

### Odontología (`odontologia/`, 6 archivos)
- `diente-svg.jsx`: SVG 40x50, 5 caras como polygons, colores por estado, click handler por cara
- `odontograma-completo.jsx`: 4 cuadrantes FDI (18-11, 21-28, 31-38, 48-41), leyenda, popover selector de estado por cara, botón "Guardar cambios"
- `plan-tratamiento-dialog.jsx`: useActionState, etapas dinámicas (add/remove), cada etapa: descripción, dientes, costo
- `planes-tratamiento-lista.jsx`: Tabla/cards con estado badge, costo_total, progreso (X/Y etapas completadas)
- `historia-dental-dialog.jsx`: fecha, diagnostico, procedimiento, dientes_afectados (comma-separated), observaciones
- `historia-dental-cliente.jsx`: Tabla: fecha, diagnostico, procedimiento, dientes. "Nueva entrada" button

### Medicina (`medicina/`, 8 archivos)
- `historia-clinica-lista.jsx`: Tabla con alertas rojas si paciente tiene alergias, expandir para ver detalles
- `historia-clinica-dialog.jsx`: useActionState, campos clínicos, alergias como tag input (comma → TEXT[]), medicacion_cronica tag input
- `signos-vitales-chart.jsx`: Recharts ResponsiveContainer + LineChart, líneas para peso/presión/temperatura, toggle por métrica, XAxis con fecha formateada
- `signos-vitales-dialog.jsx`: Inputs numéricos: peso, altura, presiones, temperatura, FC, SpO2
- `signos-vitales-tabla.jsx`: Tabla fallback/companion al chart
- `receta-dialog.jsx`: useActionState, medicamentos lista dinámica (nombre, dosis, frecuencia, duración, indicaciones), serializado como JSON hidden field
- `receta-lista.jsx`: Tabla: fecha, paciente, medicamentos count, botones "Ver" y "Descargar PDF"
- `receta-pdf.jsx`: "use client", @react-pdf/renderer Document/Page/View/Text, header profesional, datos paciente, tabla medicamentos, firma. Genera blob URL para download

### Abogados (`abogados/`, 6 archivos)
- `expedientes-lista.jsx`: Tabla con search bar, filtro por estado (badges), columnas: carátula, número, cliente, estado, fecha
- `expediente-dialog.jsx`: useActionState, paciente_id search (patrón de cita-dialog), carátula, número, juzgado, fuero, tipo, descripción, notas privadas
- `expediente-detalle.jsx`: Tabs — Info (card), Documentos (lista + upload), Vencimientos (lista + crear)
- `documento-upload.jsx`: Input file, muestra progress, llama subirDocumento, lista archivos con nombre/tamaño/fecha/download/delete
- `vencimientos-lista.jsx`: Tabla sorted by fecha, vencidos en rojo, checkbox completar, prioridad badge coloreado
- `vencimiento-dialog.jsx`: useActionState, titulo, descripción, fecha, prioridad select, expediente_id select opcional

### Veterinaria (`veterinaria/`, 7 archivos)
- `mascotas-lista.jsx`: Grid cards (foto o icono especie placeholder), nombre, especie, raza, tutor. Search + filtro especie
- `mascota-dialog.jsx`: useActionState, tutor search, nombre, especie select, raza, peso, fecha_nacimiento, sexo select, color, microchip, foto file input
- `mascota-detalle.jsx`: Tabs — Info (card con foto), Vacunación (cartilla + registrar), Historial (consultas + nueva)
- `vacunacion-dialog.jsx`: useActionState, vacuna, fecha_aplicacion, fecha_proxima, lote, veterinario, notas
- `cartilla-vacunacion.jsx`: Tabla: vacuna, fecha, próxima (highlight si vencida/próxima), lote, veterinario
- `consulta-mascota-dialog.jsx`: useActionState, fecha, motivo, diagnostico, tratamiento, peso, temperatura, observaciones
- `historial-mascota.jsx`: Tabla expandible: fecha, motivo, diagnostico, peso

### Psicología (`psicologia/`, 8 archivos)
- `notas-sesion-lista.jsx`: Cards: fecha, excerpt contenido, estado_emocional badge, temas tags, icono candado (privado)
- `nota-sesion-dialog.jsx`: useActionState, fecha, contenido textarea (10+ rows), estado_emocional select (ansioso/triste/neutro/esperanzado/enojado/tranquilo/confundido), temas tag input, objetivos textarea, tareas textarea
- `linea-evolucion.jsx`: Timeline vertical CSS (dots + connecting lines) + Recharts LineChart de puntuación. "Registrar evolución" button
- `evolucion-dialog.jsx`: useActionState, fecha, titulo, descripción textarea, puntuación 1-10 (number input), area select (ansiedad/depresión/autoestima/relaciones/trabajo/otro)
- `cuestionarios-lista.jsx`: Tabla: nombre, tipo badge (PHQ-9/GAD-7/personalizado), nro preguntas. Acciones: "Aplicar", "Ver respuestas"
- `cuestionario-aplicar.jsx`: Renderiza preguntas JSONB, escala 0-3 con radio buttons, calcula total, interpretación automática para PHQ-9/GAD-7
- `cuestionario-crear-dialog.jsx`: useActionState, nombre, descripción, preguntas dinámicas (add/remove, cada una: texto, tipo, escala)
- `cuestionario-resultados.jsx`: Tabla aplicaciones (fecha, score, interpretación) + Recharts LineChart de scores over time

#### PHQ-9 Scoring
- 9 preguntas depresión, escala 0-3
- 0-4 mínimo, 5-9 leve, 10-14 moderada, 15-19 moderadamente severa, 20-27 severa

#### GAD-7 Scoring
- 7 preguntas ansiedad, escala 0-3
- 0-4 mínimo, 5-9 leve, 10-14 moderada, 15-21 severa

### Contadores (`contadores/`, 5 archivos)
- `vencimientos-fiscales-lista.jsx`: Tabla con filtro obligación, vencidos en rojo, completar checkbox
- `vencimiento-fiscal-dialog.jsx`: useActionState, titulo, obligación select (IVA/Ganancias/IIBB/Monotributo/BienesPers/Otro), paciente select, fecha, prioridad, recurrente switch, recurrencia select
- `checklists-cliente.jsx`: Cards con progress bar (X/Y completados), click expande
- `checklist-dialog.jsx`: useActionState, titulo, periodo, paciente, items dinámicos (add/remove text inputs)
- `checklist-detalle.jsx`: Checkboxes interactivos, agregar item inline, delete items, porcentaje completado

---

## Fase 6: Páginas (20 archivos en `src/app/(dashboard)/dashboard/`)

Cada página: server component con guard de rubro + selector de paciente donde aplique.

Guard pattern:
```javascript
const supabase = await createClient();
const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
const { data: tenant } = await supabase.from("tenants").select("rubro").eq("id", tenantId).single();
if (tenant?.rubro !== 'odontologia') {
  return <div className="text-center py-12 text-muted-foreground">Este modulo no esta disponible para tu rubro.</div>;
}
```

### Odontología (3)
- `odontograma/page.js` — Patient selector + OdontogramaCompleto
- `tratamientos/page.js` — Patient selector + PlanesTratamientoLista + PlanTratamientoDialog
- `historia-dental/page.js` — Patient selector + HistoriaDentalCliente

### Medicina (3)
- `historia-clinica/page.js` — Patient selector + HistoriaClinicaLista
- `signos-vitales/page.js` — Patient selector + SignosVitalesChart + SignosVitalesTabla
- `recetas/page.js` — Patient selector + RecetaLista + RecetaDialog

### Abogados (4)
- `expedientes/page.js` — ExpedientesLista + ExpedienteDialog
- `expedientes/[id]/page.js` — ExpedienteDetalle (tabs: info, documentos, vencimientos)
- `documentos/page.js` — Cross-case document browser
- `vencimientos/page.js` — VencimientosLista

### Veterinaria (4)
- `mascotas/page.js` — MascotasLista + MascotaDialog
- `mascotas/[id]/page.js` — MascotaDetalle (tabs: info, vacunación, historial)
- `vacunacion/page.js` — Overview vacunas próximas/vencidas
- `historial-mascota/page.js` — Pet selector + HistorialMascota

### Psicología (4)
- `notas-sesion/page.js` — Patient selector + NotasSesionLista
- `evolucion/page.js` — Patient selector + LineaEvolucion
- `cuestionarios/page.js` — CuestionariosLista + crear/inicializar
- `cuestionarios/[id]/page.js` — CuestionarioAplicar (select patient, fill, submit)

### Contadores (2)
- `vencimientos-fiscales/page.js` — VencimientosFiscalesLista
- `checklists/page.js` — Client selector + ChecklistsCliente

---

## Resumen: 76 archivos total

| Categoría | Cantidad |
|-----------|----------|
| Migración SQL | 1 |
| Archivos a modificar | 3 (constants.js, rubros.js, sidebar.jsx) |
| Validaciones Zod | 6 |
| Server Actions | 6 |
| Componentes | 40 |
| Páginas | 20 |

---

## Verificación
1. Ejecutar `006_modulos_rubro.sql` en Supabase
2. `npm run dev` — sidebar muestra módulos según rubro del tenant
3. Odontograma: click caras → colores → guardar → recargar = persiste
4. Signos vitales: registrar varios → gráficos Recharts renderizan
5. Recetas: crear → descargar PDF funcional
6. Expedientes: crear → subir documento → descargar desde Storage
7. Mascotas: crear con foto → agregar vacunas → registrar consultas
8. Cuestionarios: inicializar PHQ-9/GAD-7 → aplicar → ver resultados + scoring
9. Checklists: crear → toggle items → barra progreso actualiza
10. `npm run build` — sin errores de compilación
