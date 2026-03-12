-- ============================================================
-- Migración 018: Superadmin — Audit logs + trial_ends_at
-- ============================================================

-- Agregar fecha de vencimiento del trial a tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Inicializar trial_ends_at para tenants en plan trial existentes
UPDATE tenants
  SET trial_ends_at = created_at + interval '14 days'
  WHERE plan = 'trial' AND trial_ends_at IS NULL;

-- ============================================================
-- Tabla de audit logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  accion text NOT NULL,
  entidad text,
  entidad_id uuid,
  datos jsonb DEFAULT '{}',
  ip text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Cada tenant ve sus propios logs (via RLS normal)
DROP POLICY IF EXISTS "audit_logs_tenant_select" ON audit_logs;
CREATE POLICY "audit_logs_tenant_select" ON audit_logs
  FOR SELECT TO authenticated
  USING (tenant_id = get_tenant_id_for_user());

-- Cualquier usuario autenticado puede insertar logs propios
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS audit_logs_tenant_idx ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_accion_idx ON audit_logs(accion);

-- ============================================================
-- Instrucciones para crear la cuenta de superadmin (ejecutar manualmente):
--
-- 1. Crear tenant plataforma (solo una vez):
--    INSERT INTO tenants (slug, nombre, rubro, plan, activo)
--    VALUES ('_plataforma', 'TurnoPro Platform', 'medicina', 'premium', true)
--    ON CONFLICT (slug) DO NOTHING;
--
-- 2. Crear usuario en Supabase Auth (usar Dashboard > Auth > Users > Invite)
--
-- 3. Vincular usuario a tenant plataforma con rol superadmin:
--    INSERT INTO users (auth_id, tenant_id, email, rol, nombre_completo)
--    SELECT
--      au.id, t.id, au.email, 'superadmin', 'Superadmin'
--    FROM auth.users au, tenants t
--    WHERE au.email = 'admin@turnopro.com'
--      AND t.slug = '_plataforma';
-- ============================================================
