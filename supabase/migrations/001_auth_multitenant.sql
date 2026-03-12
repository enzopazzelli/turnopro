-- ============================================
-- TurnoPro: Schema de Autenticacion Multi-Tenant
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLA: tenants (consultorios/negocios)
-- ============================================
CREATE TABLE public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rubro TEXT NOT NULL CHECK (rubro IN ('odontologia', 'medicina', 'abogados', 'veterinaria', 'psicologia', 'contadores')),
  logo_url TEXT,
  colores JSONB DEFAULT '{"primario": "#6366f1", "secundario": "#818cf8"}'::jsonb,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'basico', 'profesional', 'premium')),
  configuracion JSONB DEFAULT '{}'::jsonb,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. TABLA: users (usuarios de la plataforma)
-- ============================================
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'profesional' CHECK (rol IN ('superadmin', 'profesional', 'secretaria', 'paciente')),
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  avatar_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(auth_id)
);

-- ============================================
-- 3. TABLA: professionals (datos del profesional)
-- ============================================
CREATE TABLE public.professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  especialidad TEXT,
  biografia TEXT,
  numero_matricula TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- 4. INDICES
-- ============================================
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_professionals_tenant_id ON public.professionals(tenant_id);
CREATE INDEX idx_professionals_user_id ON public.professionals(user_id);

-- ============================================
-- 5. TRIGGER: actualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();

CREATE TRIGGER trigger_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();

-- ============================================
-- 6. FUNCION HELPER: get_tenant_id_for_user()
-- ============================================
CREATE OR REPLACE FUNCTION public.get_tenant_id_for_user()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 7. RLS: Habilitar Row Level Security
-- ============================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. POLITICAS RLS: tenants
-- ============================================

-- Usuarios autenticados ven solo su tenant
CREATE POLICY "Usuarios ven su tenant"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = public.get_tenant_id_for_user());

-- Profesionales pueden actualizar su tenant
CREATE POLICY "Profesionales actualizan su tenant"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (id = public.get_tenant_id_for_user())
  WITH CHECK (id = public.get_tenant_id_for_user());

-- Acceso anonimo a tenants activos (pagina publica)
CREATE POLICY "Acceso publico a tenants activos"
  ON public.tenants FOR SELECT
  TO anon
  USING (activo = true);

-- ============================================
-- 9. POLITICAS RLS: users
-- ============================================

-- Usuarios ven usuarios de su mismo tenant
CREATE POLICY "Usuarios ven su tenant"
  ON public.users FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

-- Usuarios pueden actualizar su propio registro
CREATE POLICY "Usuarios actualizan su perfil"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- ============================================
-- 10. POLITICAS RLS: professionals
-- ============================================

-- Usuarios ven profesionales de su tenant
CREATE POLICY "Usuarios ven profesionales de su tenant"
  ON public.professionals FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_tenant_id_for_user());

-- Profesionales actualizan su propio registro
CREATE POLICY "Profesionales actualizan su perfil"
  ON public.professionals FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- ============================================
-- 11. FUNCION: registrar_profesional()
-- Crea tenant + user + professional atomicamente
-- SECURITY DEFINER para bypasear RLS durante registro
-- ============================================
CREATE OR REPLACE FUNCTION public.registrar_profesional(
  p_auth_id UUID,
  p_email TEXT,
  p_nombre_completo TEXT,
  p_nombre_consultorio TEXT,
  p_slug TEXT,
  p_rubro TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_professional_id UUID;
BEGIN
  -- Validar que el slug no exista
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'El slug "%" ya esta en uso', p_slug;
  END IF;

  -- Crear tenant
  INSERT INTO public.tenants (nombre, slug, rubro)
  VALUES (p_nombre_consultorio, p_slug, p_rubro)
  RETURNING id INTO v_tenant_id;

  -- Crear usuario
  INSERT INTO public.users (auth_id, tenant_id, email, rol, nombre_completo)
  VALUES (p_auth_id, v_tenant_id, p_email, 'profesional', p_nombre_completo)
  RETURNING id INTO v_user_id;

  -- Crear registro de profesional
  INSERT INTO public.professionals (user_id, tenant_id)
  VALUES (v_user_id, v_tenant_id)
  RETURNING id INTO v_professional_id;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'user_id', v_user_id,
    'professional_id', v_professional_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
