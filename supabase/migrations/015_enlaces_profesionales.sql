-- Migración 015: Tabla de enlaces profesionales (colegios, asociaciones, recursos)
-- Cada profesional puede guardar links a sus colegios y asociaciones

CREATE TABLE IF NOT EXISTS enlaces_profesionales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  url text NOT NULL,
  descripcion text,
  categoria text DEFAULT 'general', -- general, colegio, asociacion, recurso
  orden integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enlaces_profesionales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso_por_tenant" ON enlaces_profesionales
  USING (tenant_id = get_tenant_id_for_user())
  WITH CHECK (tenant_id = get_tenant_id_for_user());
