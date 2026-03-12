-- ============================================
-- 006_modulos_rubro.sql
-- Tablas para módulos específicos por rubro
-- 19 tablas + Storage buckets + RLS
-- ============================================

-- Función auxiliar para triggers updated_at (CREATE OR REPLACE para idempotencia)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ODONTOLOGÍA (4 tablas)
-- ============================================

CREATE TABLE public.odontogramas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('adulto', 'infantil')) DEFAULT 'adulto',
  datos JSONB NOT NULL DEFAULT '{}',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(paciente_id, tipo)
);

CREATE TABLE public.planes_tratamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'en_curso', 'completado', 'cancelado')) DEFAULT 'pendiente',
  costo_total DECIMAL(10,2) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.etapas_tratamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.planes_tratamiento(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  orden INT NOT NULL DEFAULT 0,
  descripcion TEXT NOT NULL,
  dientes TEXT[],
  costo DECIMAL(10,2) DEFAULT 0,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'en_curso', 'completado')) DEFAULT 'pendiente',
  notas TEXT,
  fecha_completada DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.historias_clinicas_dentales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  cita_id UUID REFERENCES public.citas(id) ON DELETE SET NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnostico TEXT,
  procedimiento TEXT,
  dientes_afectados TEXT[],
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MEDICINA (3 tablas)
-- ============================================

CREATE TABLE public.historias_clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  cita_id UUID REFERENCES public.citas(id) ON DELETE SET NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  motivo_consulta TEXT,
  diagnostico TEXT,
  indicaciones TEXT,
  antecedentes TEXT,
  alergias TEXT[],
  medicacion_cronica TEXT[],
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.signos_vitales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  peso_kg DECIMAL(5,2),
  altura_cm DECIMAL(5,1),
  presion_sistolica INT,
  presion_diastolica INT,
  temperatura DECIMAL(4,1),
  frecuencia_cardiaca INT,
  saturacion_o2 INT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnostico TEXT,
  medicamentos JSONB NOT NULL DEFAULT '[]',
  indicaciones_generales TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ABOGADOS (3 tablas)
-- ============================================

CREATE TABLE public.expedientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  caratula TEXT NOT NULL,
  numero_expediente TEXT,
  juzgado TEXT,
  fuero TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('activo', 'en_tramite', 'con_sentencia', 'archivado', 'apelado')) DEFAULT 'activo',
  tipo TEXT,
  descripcion TEXT,
  notas_privadas TEXT,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.documentos_legales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  archivo_url TEXT,
  archivo_path TEXT,
  tipo_archivo TEXT,
  tamano_bytes BIGINT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.vencimientos_legales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expediente_id UUID REFERENCES public.expedientes(id) ON DELETE SET NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_vencimiento DATE NOT NULL,
  completado BOOLEAN DEFAULT false,
  prioridad TEXT NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')) DEFAULT 'media',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- VETERINARIA (3 tablas)
-- ============================================

CREATE TABLE public.mascotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('perro', 'gato', 'ave', 'reptil', 'roedor', 'otro')),
  raza TEXT,
  peso_kg DECIMAL(6,2),
  fecha_nacimiento DATE,
  sexo TEXT CHECK (sexo IN ('macho', 'hembra')),
  color TEXT,
  microchip TEXT,
  foto_url TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.vacunaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  mascota_id UUID NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
  vacuna TEXT NOT NULL,
  fecha_aplicacion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_proxima DATE,
  lote TEXT,
  veterinario TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.consultas_mascota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  mascota_id UUID NOT NULL REFERENCES public.mascotas(id) ON DELETE CASCADE,
  cita_id UUID REFERENCES public.citas(id) ON DELETE SET NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  motivo TEXT,
  diagnostico TEXT,
  tratamiento TEXT,
  peso_kg DECIMAL(6,2),
  temperatura DECIMAL(4,1),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PSICOLOGÍA (4 tablas)
-- ============================================

CREATE TABLE public.notas_sesion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  cita_id UUID REFERENCES public.citas(id) ON DELETE SET NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  contenido TEXT NOT NULL,
  estado_emocional TEXT,
  temas TEXT[],
  objetivos TEXT,
  tareas TEXT,
  privado BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.evoluciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  puntuacion INT CHECK (puntuacion >= 1 AND puntuacion <= 10),
  area TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.cuestionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('phq9', 'gad7', 'personalizado')) DEFAULT 'personalizado',
  preguntas JSONB NOT NULL DEFAULT '[]',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.respuestas_cuestionario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cuestionario_id UUID NOT NULL REFERENCES public.cuestionarios(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  respuestas JSONB NOT NULL DEFAULT '[]',
  puntuacion_total INT,
  interpretacion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CONTADORES (3 tablas)
-- ============================================

CREATE TABLE public.vencimientos_fiscales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  obligacion TEXT,
  fecha_vencimiento DATE NOT NULL,
  completado BOOLEAN DEFAULT false,
  prioridad TEXT NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')) DEFAULT 'media',
  recurrente BOOLEAN DEFAULT false,
  recurrencia TEXT CHECK (recurrencia IN ('mensual', 'bimestral', 'trimestral', 'semestral', 'anual')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.checklists_documentacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  periodo TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists_documentacion(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  completado BOOLEAN DEFAULT false,
  fecha_completado DATE,
  orden INT DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Odontología
CREATE INDEX idx_odontogramas_tenant ON public.odontogramas(tenant_id);
CREATE INDEX idx_odontogramas_paciente ON public.odontogramas(paciente_id);
CREATE INDEX idx_planes_tratamiento_tenant ON public.planes_tratamiento(tenant_id);
CREATE INDEX idx_planes_tratamiento_paciente ON public.planes_tratamiento(paciente_id);
CREATE INDEX idx_etapas_tratamiento_plan ON public.etapas_tratamiento(plan_id);
CREATE INDEX idx_historias_dentales_tenant ON public.historias_clinicas_dentales(tenant_id);
CREATE INDEX idx_historias_dentales_paciente ON public.historias_clinicas_dentales(paciente_id);

-- Medicina
CREATE INDEX idx_historias_clinicas_tenant ON public.historias_clinicas(tenant_id);
CREATE INDEX idx_historias_clinicas_paciente ON public.historias_clinicas(paciente_id);
CREATE INDEX idx_signos_vitales_tenant ON public.signos_vitales(tenant_id);
CREATE INDEX idx_signos_vitales_paciente ON public.signos_vitales(paciente_id);
CREATE INDEX idx_recetas_tenant ON public.recetas(tenant_id);
CREATE INDEX idx_recetas_paciente ON public.recetas(paciente_id);

-- Abogados
CREATE INDEX idx_expedientes_tenant ON public.expedientes(tenant_id);
CREATE INDEX idx_expedientes_paciente ON public.expedientes(paciente_id);
CREATE INDEX idx_expedientes_estado ON public.expedientes(estado);
CREATE INDEX idx_documentos_legales_tenant ON public.documentos_legales(tenant_id);
CREATE INDEX idx_documentos_legales_expediente ON public.documentos_legales(expediente_id);
CREATE INDEX idx_vencimientos_legales_tenant ON public.vencimientos_legales(tenant_id);
CREATE INDEX idx_vencimientos_legales_fecha ON public.vencimientos_legales(fecha_vencimiento);

-- Veterinaria
CREATE INDEX idx_mascotas_tenant ON public.mascotas(tenant_id);
CREATE INDEX idx_mascotas_tutor ON public.mascotas(tutor_id);
CREATE INDEX idx_vacunaciones_tenant ON public.vacunaciones(tenant_id);
CREATE INDEX idx_vacunaciones_mascota ON public.vacunaciones(mascota_id);
CREATE INDEX idx_consultas_mascota_tenant ON public.consultas_mascota(tenant_id);
CREATE INDEX idx_consultas_mascota_mascota ON public.consultas_mascota(mascota_id);

-- Psicología
CREATE INDEX idx_notas_sesion_tenant ON public.notas_sesion(tenant_id);
CREATE INDEX idx_notas_sesion_paciente ON public.notas_sesion(paciente_id);
CREATE INDEX idx_evoluciones_tenant ON public.evoluciones(tenant_id);
CREATE INDEX idx_evoluciones_paciente ON public.evoluciones(paciente_id);
CREATE INDEX idx_cuestionarios_tenant ON public.cuestionarios(tenant_id);
CREATE INDEX idx_respuestas_cuestionario_tenant ON public.respuestas_cuestionario(tenant_id);
CREATE INDEX idx_respuestas_cuestionario_paciente ON public.respuestas_cuestionario(paciente_id);
CREATE INDEX idx_respuestas_cuestionario_cuestionario ON public.respuestas_cuestionario(cuestionario_id);

-- Contadores
CREATE INDEX idx_vencimientos_fiscales_tenant ON public.vencimientos_fiscales(tenant_id);
CREATE INDEX idx_vencimientos_fiscales_fecha ON public.vencimientos_fiscales(fecha_vencimiento);
CREATE INDEX idx_checklists_tenant ON public.checklists_documentacion(tenant_id);
CREATE INDEX idx_checklists_paciente ON public.checklists_documentacion(paciente_id);
CREATE INDEX idx_checklist_items_checklist ON public.checklist_items(checklist_id);

-- ============================================
-- TRIGGERS updated_at
-- ============================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.odontogramas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.planes_tratamiento
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.etapas_tratamiento
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.historias_clinicas_dentales
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.historias_clinicas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.signos_vitales
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recetas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expedientes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vencimientos_legales
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.mascotas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.consultas_mascota
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notas_sesion
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.evoluciones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cuestionarios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vencimientos_fiscales
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.checklists_documentacion
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Odontología
ALTER TABLE public.odontogramas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.odontogramas FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.planes_tratamiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.planes_tratamiento FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.etapas_tratamiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.etapas_tratamiento FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.historias_clinicas_dentales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.historias_clinicas_dentales FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

-- Medicina
ALTER TABLE public.historias_clinicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.historias_clinicas FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.signos_vitales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.signos_vitales FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.recetas FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

-- Abogados
ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.expedientes FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.documentos_legales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_select" ON public.documentos_legales FOR SELECT
  USING (tenant_id = public.get_tenant_id_for_user());
CREATE POLICY "tenant_insert" ON public.documentos_legales FOR INSERT
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());
CREATE POLICY "tenant_delete" ON public.documentos_legales FOR DELETE
  USING (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.vencimientos_legales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.vencimientos_legales FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

-- Veterinaria
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.mascotas FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.vacunaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.vacunaciones FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.consultas_mascota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.consultas_mascota FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

-- Psicología
ALTER TABLE public.notas_sesion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.notas_sesion FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.evoluciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.evoluciones FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.cuestionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.cuestionarios FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.respuestas_cuestionario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.respuestas_cuestionario FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

-- Contadores
ALTER TABLE public.vencimientos_fiscales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.vencimientos_fiscales FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.checklists_documentacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.checklists_documentacion FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON public.checklist_items FOR ALL
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documentos', 'documentos', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('mascotas', 'mascotas', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage policies: documentos (privado)
CREATE POLICY "tenant_upload_documentos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos' AND (storage.foldername(name))[1] = public.get_tenant_id_for_user()::text);

CREATE POLICY "tenant_read_documentos" ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = public.get_tenant_id_for_user()::text);

CREATE POLICY "tenant_delete_documentos" ON storage.objects FOR DELETE
  USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = public.get_tenant_id_for_user()::text);

-- Storage policies: mascotas (público lectura, upload por tenant)
CREATE POLICY "public_read_mascotas" ON storage.objects FOR SELECT
  USING (bucket_id = 'mascotas');

CREATE POLICY "tenant_upload_mascotas" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'mascotas' AND (storage.foldername(name))[1] = public.get_tenant_id_for_user()::text);

CREATE POLICY "tenant_delete_mascotas" ON storage.objects FOR DELETE
  USING (bucket_id = 'mascotas' AND (storage.foldername(name))[1] = public.get_tenant_id_for_user()::text);
