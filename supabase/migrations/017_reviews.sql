-- ============================================================
-- Migración 017: Reviews / Reseñas de pacientes
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  email text,
  estrellas integer NOT NULL CHECK (estrellas >= 1 AND estrellas <= 5),
  texto text NOT NULL,
  visible boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anon puede insertar reviews (formulario público) siempre que el tenant exista y esté activo
CREATE POLICY "reviews_anon_insert" ON reviews
  FOR INSERT TO anon
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE activo = true));

-- Anon sólo ve reviews aprobadas
CREATE POLICY "reviews_anon_select" ON reviews
  FOR SELECT TO anon
  USING (visible = true);

-- Tenant autenticado puede ver, modificar y eliminar sus propias reviews
CREATE POLICY "reviews_auth_select" ON reviews
  FOR SELECT TO authenticated
  USING (tenant_id = get_tenant_id_for_user());

CREATE POLICY "reviews_auth_update" ON reviews
  FOR UPDATE TO authenticated
  USING (tenant_id = get_tenant_id_for_user());

CREATE POLICY "reviews_auth_delete" ON reviews
  FOR DELETE TO authenticated
  USING (tenant_id = get_tenant_id_for_user());

-- Índices
CREATE INDEX IF NOT EXISTS reviews_tenant_id_idx ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS reviews_visible_idx ON reviews(tenant_id, visible);
