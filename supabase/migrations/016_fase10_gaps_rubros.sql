-- Migración 016: Gaps por rubro (Fase 10)
-- Tablas: desparasitaciones (vet), etapas_procesales (abogados), consentimientos_informados (psico)

-- ============================================================
-- VETERINARIA: Control de desparasitaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS desparasitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('interna', 'externa', 'ambas')),
  producto TEXT NOT NULL,
  dosis TEXT,
  fecha_aplicacion DATE NOT NULL,
  fecha_proxima DATE,
  veterinario TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE desparasitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "desparasitaciones_tenant" ON desparasitaciones
  USING (tenant_id = get_tenant_id_for_user())
  WITH CHECK (tenant_id = get_tenant_id_for_user());

CREATE INDEX idx_desparasitaciones_mascota ON desparasitaciones(mascota_id);
CREATE INDEX idx_desparasitaciones_tenant ON desparasitaciones(tenant_id);

-- ============================================================
-- ABOGADOS: Etapas procesales (timeline por expediente)
-- ============================================================
CREATE TABLE IF NOT EXISTS etapas_procesales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expediente_id UUID NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'completado', 'suspendido')),
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE etapas_procesales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etapas_procesales_tenant" ON etapas_procesales
  USING (tenant_id = get_tenant_id_for_user())
  WITH CHECK (tenant_id = get_tenant_id_for_user());

CREATE INDEX idx_etapas_procesales_expediente ON etapas_procesales(expediente_id);

-- ============================================================
-- PSICOLOGÍA: Consentimientos informados
-- ============================================================
CREATE TABLE IF NOT EXISTS consentimientos_informados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  paciente_nombre TEXT,
  contenido TEXT NOT NULL,
  firmado BOOLEAN DEFAULT false,
  fecha_firma DATE,
  firma_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE consentimientos_informados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consentimientos_tenant" ON consentimientos_informados
  USING (tenant_id = get_tenant_id_for_user())
  WITH CHECK (tenant_id = get_tenant_id_for_user());

CREATE INDEX idx_consentimientos_paciente ON consentimientos_informados(paciente_id);
CREATE INDEX idx_consentimientos_tenant ON consentimientos_informados(tenant_id);
