-- ============================================
-- TurnoPro: Multi-Profesional + Sucursales (Plan Premium)
-- ============================================

-- ============================================
-- 1. TABLA: sucursales
-- ============================================
CREATE TABLE IF NOT EXISTS public.sucursales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  activa BOOLEAN DEFAULT true,
  es_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sucursales_tenant_id ON public.sucursales(tenant_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_sucursales_updated_at ON public.sucursales;
CREATE TRIGGER trigger_sucursales_updated_at
  BEFORE UPDATE ON public.sucursales
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();

-- RLS
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant puede ver sus sucursales" ON public.sucursales;
CREATE POLICY "Tenant puede ver sus sucursales"
  ON public.sucursales FOR SELECT
  USING (tenant_id = (SELECT get_tenant_id_for_user()));

DROP POLICY IF EXISTS "Tenant puede insertar sucursales" ON public.sucursales;
CREATE POLICY "Tenant puede insertar sucursales"
  ON public.sucursales FOR INSERT
  WITH CHECK (tenant_id = (SELECT get_tenant_id_for_user()));

DROP POLICY IF EXISTS "Tenant puede actualizar sus sucursales" ON public.sucursales;
CREATE POLICY "Tenant puede actualizar sus sucursales"
  ON public.sucursales FOR UPDATE
  USING (tenant_id = (SELECT get_tenant_id_for_user()));

DROP POLICY IF EXISTS "Tenant puede eliminar sus sucursales" ON public.sucursales;
CREATE POLICY "Tenant puede eliminar sus sucursales"
  ON public.sucursales FOR DELETE
  USING (tenant_id = (SELECT get_tenant_id_for_user()));

-- ============================================
-- 2. Columnas opcionales en citas para multi-profesional y sucursal
-- ============================================
-- professional_id ya existe en citas (002_agenda.sql)
-- Agregar sucursal_id
ALTER TABLE public.citas ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES public.sucursales(id);

-- ============================================
-- 3. Tabla de invitaciones para nuevos profesionales
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'profesional' CHECK (rol IN ('profesional', 'secretaria')),
  nombre TEXT,
  token UUID DEFAULT gen_random_uuid() UNIQUE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'expirada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_invitaciones_tenant_id ON public.invitaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_token ON public.invitaciones(token);

ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant puede ver sus invitaciones" ON public.invitaciones;
CREATE POLICY "Tenant puede ver sus invitaciones"
  ON public.invitaciones FOR SELECT
  USING (tenant_id = (SELECT get_tenant_id_for_user()));

DROP POLICY IF EXISTS "Tenant puede crear invitaciones" ON public.invitaciones;
CREATE POLICY "Tenant puede crear invitaciones"
  ON public.invitaciones FOR INSERT
  WITH CHECK (tenant_id = (SELECT get_tenant_id_for_user()));

DROP POLICY IF EXISTS "Tenant puede actualizar invitaciones" ON public.invitaciones;
CREATE POLICY "Tenant puede actualizar invitaciones"
  ON public.invitaciones FOR UPDATE
  USING (tenant_id = (SELECT get_tenant_id_for_user()));

DROP POLICY IF EXISTS "Tenant puede eliminar invitaciones" ON public.invitaciones;
CREATE POLICY "Tenant puede eliminar invitaciones"
  ON public.invitaciones FOR DELETE
  USING (tenant_id = (SELECT get_tenant_id_for_user()));
