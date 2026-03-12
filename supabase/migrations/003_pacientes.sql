-- ============================================
-- TurnoPro: Schema de Pacientes (CRM)
-- Ejecutar en Supabase SQL Editor DESPUES de 002
-- ============================================

-- ============================================
-- 1. EXTENSION: pg_trgm para busqueda por similitud
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 2. TABLA: pacientes
-- ============================================
CREATE TABLE IF NOT EXISTS public.pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  dni TEXT,
  fecha_nacimiento DATE,
  genero TEXT DEFAULT 'no_especifica'
    CHECK (genero IN ('masculino', 'femenino', 'otro', 'no_especifica')),
  direccion TEXT,
  obra_social TEXT,
  numero_afiliado TEXT,
  etiquetas TEXT[] DEFAULT '{}',
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. ALTER TABLE citas: agregar paciente_id
-- ============================================
ALTER TABLE public.citas
  ADD COLUMN IF NOT EXISTS paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL;

-- ============================================
-- 4. INDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pacientes_tenant_id ON public.pacientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre_trgm ON public.pacientes USING gin (nombre_completo gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_pacientes_email ON public.pacientes(email);
CREATE INDEX IF NOT EXISTS idx_pacientes_dni ON public.pacientes(dni);
CREATE INDEX IF NOT EXISTS idx_pacientes_etiquetas ON public.pacientes USING gin (etiquetas);
CREATE INDEX IF NOT EXISTS idx_citas_paciente_id ON public.citas(paciente_id);

-- ============================================
-- 5. TRIGGER: updated_at
-- ============================================
DROP TRIGGER IF EXISTS trigger_pacientes_updated_at ON public.pacientes;
CREATE TRIGGER trigger_pacientes_updated_at
  BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();

-- ============================================
-- 6. RLS: Habilitar
-- ============================================
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. POLITICAS RLS: pacientes
-- ============================================
DROP POLICY IF EXISTS "Usuarios ven pacientes de su tenant" ON public.pacientes;
CREATE POLICY "Usuarios ven pacientes de su tenant"
  ON public.pacientes FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios crean pacientes en su tenant" ON public.pacientes;
CREATE POLICY "Usuarios crean pacientes en su tenant"
  ON public.pacientes FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios actualizan pacientes de su tenant" ON public.pacientes;
CREATE POLICY "Usuarios actualizan pacientes de su tenant"
  ON public.pacientes FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios eliminan pacientes de su tenant" ON public.pacientes;
CREATE POLICY "Usuarios eliminan pacientes de su tenant"
  ON public.pacientes FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());
