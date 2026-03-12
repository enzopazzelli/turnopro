-- ============================================
-- TurnoPro: Schema de Agenda y Calendario
-- Ejecutar en Supabase SQL Editor DESPUES de 001
-- ============================================

-- ============================================
-- 1. FUNCION HELPER: get_professional_id_for_user()
-- ============================================
CREATE OR REPLACE FUNCTION public.get_professional_id_for_user()
RETURNS UUID AS $$
  SELECT p.id FROM public.professionals p
  JOIN public.users u ON u.id = p.user_id
  WHERE u.auth_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 2. TABLA: servicios
-- ============================================
CREATE TABLE IF NOT EXISTS public.servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  duracion_minutos INTEGER NOT NULL DEFAULT 30,
  precio DECIMAL(10,2) DEFAULT 0,
  descripcion TEXT,
  color TEXT DEFAULT '#6366f1',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. TABLA: disponibilidad
-- ============================================
CREATE TABLE IF NOT EXISTS public.disponibilidad (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL DEFAULT '09:00',
  hora_fin TIME NOT NULL DEFAULT '18:00',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professional_id, dia_semana)
);

-- ============================================
-- 4. TABLA: fechas_bloqueadas
-- ============================================
CREATE TABLE IF NOT EXISTS public.fechas_bloqueadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  motivo TEXT,
  todo_el_dia BOOLEAN DEFAULT true,
  hora_inicio TIME,
  hora_fin TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. TABLA: citas
-- ============================================
CREATE TABLE IF NOT EXISTS public.citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  servicio_id UUID REFERENCES public.servicios(id) ON DELETE SET NULL,
  paciente_nombre TEXT NOT NULL,
  paciente_telefono TEXT,
  paciente_email TEXT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','confirmada','en_curso','completada','cancelada','no_asistio')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. INDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_servicios_tenant_id ON public.servicios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_professional_id ON public.disponibilidad(professional_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_tenant_id ON public.disponibilidad(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fechas_bloqueadas_professional_id ON public.fechas_bloqueadas(professional_id);
CREATE INDEX IF NOT EXISTS idx_fechas_bloqueadas_fecha ON public.fechas_bloqueadas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_tenant_id ON public.citas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_citas_professional_id ON public.citas(professional_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON public.citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON public.citas(estado);

-- ============================================
-- 7. TRIGGERS (reusar actualizar_updated_at)
-- ============================================
DROP TRIGGER IF EXISTS trigger_servicios_updated_at ON public.servicios;
CREATE TRIGGER trigger_servicios_updated_at
  BEFORE UPDATE ON public.servicios
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_disponibilidad_updated_at ON public.disponibilidad;
CREATE TRIGGER trigger_disponibilidad_updated_at
  BEFORE UPDATE ON public.disponibilidad
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_citas_updated_at ON public.citas;
CREATE TRIGGER trigger_citas_updated_at
  BEFORE UPDATE ON public.citas
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();

-- ============================================
-- 8. RLS: Habilitar
-- ============================================
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechas_bloqueadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. POLITICAS RLS: servicios
-- ============================================
DROP POLICY IF EXISTS "Usuarios ven servicios de su tenant" ON public.servicios;
CREATE POLICY "Usuarios ven servicios de su tenant"
  ON public.servicios FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios crean servicios en su tenant" ON public.servicios;
CREATE POLICY "Usuarios crean servicios en su tenant"
  ON public.servicios FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios actualizan servicios de su tenant" ON public.servicios;
CREATE POLICY "Usuarios actualizan servicios de su tenant"
  ON public.servicios FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios eliminan servicios de su tenant" ON public.servicios;
CREATE POLICY "Usuarios eliminan servicios de su tenant"
  ON public.servicios FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

-- Acceso anonimo a servicios activos (pagina publica)
DROP POLICY IF EXISTS "Acceso publico a servicios activos" ON public.servicios;
CREATE POLICY "Acceso publico a servicios activos"
  ON public.servicios FOR SELECT
  TO anon
  USING (activo = true);

-- ============================================
-- 10. POLITICAS RLS: disponibilidad
-- ============================================
DROP POLICY IF EXISTS "Usuarios ven disponibilidad de su tenant" ON public.disponibilidad;
CREATE POLICY "Usuarios ven disponibilidad de su tenant"
  ON public.disponibilidad FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios crean disponibilidad en su tenant" ON public.disponibilidad;
CREATE POLICY "Usuarios crean disponibilidad en su tenant"
  ON public.disponibilidad FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios actualizan disponibilidad de su tenant" ON public.disponibilidad;
CREATE POLICY "Usuarios actualizan disponibilidad de su tenant"
  ON public.disponibilidad FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios eliminan disponibilidad de su tenant" ON public.disponibilidad;
CREATE POLICY "Usuarios eliminan disponibilidad de su tenant"
  ON public.disponibilidad FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

-- Acceso anonimo (pagina publica de reserva)
DROP POLICY IF EXISTS "Acceso publico a disponibilidad activa" ON public.disponibilidad;
CREATE POLICY "Acceso publico a disponibilidad activa"
  ON public.disponibilidad FOR SELECT
  TO anon
  USING (activo = true);

-- ============================================
-- 11. POLITICAS RLS: fechas_bloqueadas
-- ============================================
DROP POLICY IF EXISTS "Usuarios ven fechas bloqueadas de su tenant" ON public.fechas_bloqueadas;
CREATE POLICY "Usuarios ven fechas bloqueadas de su tenant"
  ON public.fechas_bloqueadas FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios crean fechas bloqueadas en su tenant" ON public.fechas_bloqueadas;
CREATE POLICY "Usuarios crean fechas bloqueadas en su tenant"
  ON public.fechas_bloqueadas FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios eliminan fechas bloqueadas de su tenant" ON public.fechas_bloqueadas;
CREATE POLICY "Usuarios eliminan fechas bloqueadas de su tenant"
  ON public.fechas_bloqueadas FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

-- ============================================
-- 12. POLITICAS RLS: citas
-- ============================================
DROP POLICY IF EXISTS "Usuarios ven citas de su tenant" ON public.citas;
CREATE POLICY "Usuarios ven citas de su tenant"
  ON public.citas FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios crean citas en su tenant" ON public.citas;
CREATE POLICY "Usuarios crean citas en su tenant"
  ON public.citas FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios actualizan citas de su tenant" ON public.citas;
CREATE POLICY "Usuarios actualizan citas de su tenant"
  ON public.citas FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user())
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

DROP POLICY IF EXISTS "Usuarios eliminan citas de su tenant" ON public.citas;
CREATE POLICY "Usuarios eliminan citas de su tenant"
  ON public.citas FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

-- ============================================
-- 13. FUNCION: inicializar_disponibilidad_profesional()
-- ============================================
CREATE OR REPLACE FUNCTION public.inicializar_disponibilidad_profesional(
  p_professional_id UUID,
  p_tenant_id UUID
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.disponibilidad (professional_id, tenant_id, dia_semana, hora_inicio, hora_fin, activo)
  VALUES
    (p_professional_id, p_tenant_id, 0, '09:00', '18:00', false),
    (p_professional_id, p_tenant_id, 1, '09:00', '18:00', true),
    (p_professional_id, p_tenant_id, 2, '09:00', '18:00', true),
    (p_professional_id, p_tenant_id, 3, '09:00', '18:00', true),
    (p_professional_id, p_tenant_id, 4, '09:00', '18:00', true),
    (p_professional_id, p_tenant_id, 5, '09:00', '18:00', true),
    (p_professional_id, p_tenant_id, 6, '09:00', '18:00', false)
  ON CONFLICT (professional_id, dia_semana) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
