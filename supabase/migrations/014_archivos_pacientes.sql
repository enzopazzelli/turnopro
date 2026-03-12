-- ============================================
-- 014: Archivos adjuntos de pacientes
-- ============================================

-- Tabla de archivos
CREATE TABLE IF NOT EXISTS public.archivos_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  archivo_url TEXT,
  archivo_path TEXT NOT NULL,
  tipo_archivo TEXT,
  tamano_bytes BIGINT,
  categoria TEXT DEFAULT 'otros' CHECK (categoria IN ('estudios', 'documentacion', 'consentimientos', 'imagenes', 'otros')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_archivos_pacientes_tenant ON public.archivos_pacientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_archivos_pacientes_paciente ON public.archivos_pacientes(paciente_id);

-- RLS
ALTER TABLE public.archivos_pacientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "archivos_pacientes_select" ON public.archivos_pacientes;
CREATE POLICY "archivos_pacientes_select" ON public.archivos_pacientes
  FOR SELECT USING (tenant_id = (SELECT get_tenant_id_for_user()));

DROP POLICY IF EXISTS "archivos_pacientes_insert" ON public.archivos_pacientes;
CREATE POLICY "archivos_pacientes_insert" ON public.archivos_pacientes
  FOR INSERT WITH CHECK (tenant_id = (SELECT get_tenant_id_for_user()));

DROP POLICY IF EXISTS "archivos_pacientes_delete" ON public.archivos_pacientes;
CREATE POLICY "archivos_pacientes_delete" ON public.archivos_pacientes
  FOR DELETE USING (tenant_id = (SELECT get_tenant_id_for_user()));

-- Bucket de storage (si no existe ya el bucket documentos, crear uno dedicado)
-- Usamos el bucket "documentos" existente que ya tiene las policies correctas
-- La estructura sera: tenant_id/pacientes/paciente_id/timestamp_filename
