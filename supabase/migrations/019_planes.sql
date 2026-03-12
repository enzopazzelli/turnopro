-- ============================================================
-- Migración 019: Planes con features configurables + overrides por tenant
-- ============================================================

-- Tabla de planes
CREATE TABLE IF NOT EXISTS planes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL UNIQUE,
  label       text NOT NULL,
  descripcion text,
  precio      numeric(10,2) DEFAULT 0,
  features    jsonb NOT NULL DEFAULT '{}',
  limites     jsonb NOT NULL DEFAULT '{}',
  activo      boolean DEFAULT true,
  orden       int DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS trigger_planes_updated_at ON planes;
CREATE TRIGGER trigger_planes_updated_at
  BEFORE UPDATE ON planes
  FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- RLS: solo superadmin puede gestionar planes (se usa service role)
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planes_select_authenticated" ON planes FOR SELECT TO authenticated USING (true);

-- Overrides de features por tenant (permite al superadmin habilitar/deshabilitar
-- features individualmente, sobreescribiendo lo que define el plan)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS features_override jsonb DEFAULT '{}';

-- ============================================================
-- Planes por defecto
-- ============================================================
INSERT INTO planes (nombre, label, descripcion, precio, features, limites, orden) VALUES
(
  'trial',
  'Trial',
  '14 días gratis con funcionalidades básicas',
  0,
  '{
    "pagina_publica": true,
    "recurrencia": false,
    "lista_espera": false,
    "sobreturno": false,
    "consulta_activa": false,
    "recetas": false,
    "firma_digital": false,
    "notificaciones_email": false,
    "notificaciones_whatsapp": false,
    "reportes_avanzados": false,
    "facturacion": false,
    "modulos_rubro": false,
    "archivos_pacientes": false,
    "exportar_csv": false,
    "multi_profesional": false,
    "sucursales": false,
    "historial_clinico": false
  }',
  '{"max_profesionales": 1, "max_citas_mes": 50, "max_pacientes": 30}',
  1
),
(
  'basico',
  'Básico',
  'Para profesionales independientes',
  5000,
  '{
    "pagina_publica": true,
    "recurrencia": true,
    "lista_espera": true,
    "sobreturno": false,
    "consulta_activa": true,
    "recetas": false,
    "firma_digital": false,
    "notificaciones_email": true,
    "notificaciones_whatsapp": false,
    "reportes_avanzados": false,
    "facturacion": true,
    "modulos_rubro": false,
    "archivos_pacientes": false,
    "exportar_csv": false,
    "multi_profesional": false,
    "sucursales": false,
    "historial_clinico": true
  }',
  '{"max_profesionales": 1, "max_citas_mes": null, "max_pacientes": null}',
  2
),
(
  'profesional',
  'Profesional',
  'Para consultorios con equipo',
  12000,
  '{
    "pagina_publica": true,
    "recurrencia": true,
    "lista_espera": true,
    "sobreturno": true,
    "consulta_activa": true,
    "recetas": true,
    "firma_digital": true,
    "notificaciones_email": true,
    "notificaciones_whatsapp": true,
    "reportes_avanzados": true,
    "facturacion": true,
    "modulos_rubro": true,
    "archivos_pacientes": true,
    "exportar_csv": true,
    "multi_profesional": true,
    "sucursales": false,
    "historial_clinico": true
  }',
  '{"max_profesionales": 5, "max_citas_mes": null, "max_pacientes": null}',
  3
),
(
  'premium',
  'Premium',
  'Sin límites, todas las funcionalidades',
  25000,
  '{
    "pagina_publica": true,
    "recurrencia": true,
    "lista_espera": true,
    "sobreturno": true,
    "consulta_activa": true,
    "recetas": true,
    "firma_digital": true,
    "notificaciones_email": true,
    "notificaciones_whatsapp": true,
    "reportes_avanzados": true,
    "facturacion": true,
    "modulos_rubro": true,
    "archivos_pacientes": true,
    "exportar_csv": true,
    "multi_profesional": true,
    "sucursales": true,
    "historial_clinico": true
  }',
  '{"max_profesionales": null, "max_citas_mes": null, "max_pacientes": null}',
  4
)
ON CONFLICT (nombre) DO NOTHING;
