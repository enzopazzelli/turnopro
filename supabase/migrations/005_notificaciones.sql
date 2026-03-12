-- =============================================
-- 005_notificaciones.sql
-- Sistema de notificaciones para TurnoPro
-- =============================================

-- Tabla principal de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES users(id) ON DELETE SET NULL,
  destinatario_nombre TEXT,
  destinatario_email TEXT,
  destinatario_telefono TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'cita_creada', 'cita_confirmada', 'cita_cancelada', 'cita_modificada',
    'recordatorio_24h', 'recordatorio_2h', 'reserva_nueva', 'general'
  )),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('in_app', 'email', 'whatsapp')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviada', 'fallida', 'leida')),
  error_detalle TEXT,
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  leida BOOLEAN DEFAULT FALSE,
  leida_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_notificaciones_tenant ON notificaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_canal ON notificaciones(canal);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_no_leidas ON notificaciones(usuario_id, leida) WHERE leida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notificaciones_cita ON notificaciones(cita_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created ON notificaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_inbox ON notificaciones(usuario_id, leida, created_at DESC) WHERE canal = 'in_app';

-- Trigger updated_at (reutiliza la funcion existente)
DROP TRIGGER IF EXISTS set_notificaciones_updated_at ON notificaciones;
CREATE TRIGGER set_notificaciones_updated_at
  BEFORE UPDATE ON notificaciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

-- =============================================
-- RLS
-- =============================================
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios ven notificaciones de su tenant
DROP POLICY IF EXISTS "Usuarios ven notificaciones de su tenant" ON notificaciones;
CREATE POLICY "Usuarios ven notificaciones de su tenant"
  ON notificaciones FOR SELECT
  USING (tenant_id = public.get_tenant_id_for_user());

-- INSERT: usuarios pueden crear notificaciones en su tenant
DROP POLICY IF EXISTS "Usuarios crean notificaciones en su tenant" ON notificaciones;
CREATE POLICY "Usuarios crean notificaciones en su tenant"
  ON notificaciones FOR INSERT
  WITH CHECK (tenant_id = public.get_tenant_id_for_user());

-- UPDATE: usuarios pueden actualizar notificaciones de su tenant
DROP POLICY IF EXISTS "Usuarios actualizan notificaciones de su tenant" ON notificaciones;
CREATE POLICY "Usuarios actualizan notificaciones de su tenant"
  ON notificaciones FOR UPDATE
  USING (tenant_id = public.get_tenant_id_for_user());

-- DELETE: usuarios pueden eliminar notificaciones de su tenant
DROP POLICY IF EXISTS "Usuarios eliminan notificaciones de su tenant" ON notificaciones;
CREATE POLICY "Usuarios eliminan notificaciones de su tenant"
  ON notificaciones FOR DELETE
  USING (tenant_id = public.get_tenant_id_for_user());

-- =============================================
-- RPC: Crear notificacion desde sistema (cron, public)
-- SECURITY DEFINER para bypass RLS
-- =============================================
CREATE OR REPLACE FUNCTION crear_notificacion_sistema(
  p_tenant_id UUID,
  p_usuario_id UUID DEFAULT NULL,
  p_destinatario_nombre TEXT DEFAULT NULL,
  p_destinatario_email TEXT DEFAULT NULL,
  p_destinatario_telefono TEXT DEFAULT NULL,
  p_tipo TEXT DEFAULT 'general',
  p_titulo TEXT DEFAULT '',
  p_mensaje TEXT DEFAULT '',
  p_canal TEXT DEFAULT 'in_app',
  p_cita_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notificaciones (
    tenant_id, usuario_id, destinatario_nombre, destinatario_email,
    destinatario_telefono, tipo, titulo, mensaje, canal, cita_id, metadata,
    estado
  ) VALUES (
    p_tenant_id, p_usuario_id, p_destinatario_nombre, p_destinatario_email,
    p_destinatario_telefono, p_tipo, p_titulo, p_mensaje, p_canal, p_cita_id,
    p_metadata,
    CASE WHEN p_canal = 'in_app' THEN 'enviada' ELSE 'pendiente' END
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- =============================================
-- RPC: Obtener citas para recordatorio
-- Busca citas pendientes/confirmadas en ventana de tiempo
-- Excluye citas que ya tienen una notificacion del mismo tipo
-- =============================================
CREATE OR REPLACE FUNCTION obtener_citas_para_recordatorio(
  p_horas INT,
  p_tipo TEXT
)
RETURNS TABLE (
  cita_id UUID,
  tenant_id UUID,
  professional_id UUID,
  paciente_nombre TEXT,
  paciente_email TEXT,
  paciente_telefono TEXT,
  fecha DATE,
  hora_inicio TIME,
  hora_fin TIME,
  servicio_nombre TEXT,
  profesional_nombre TEXT,
  tenant_nombre TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS cita_id,
    c.tenant_id,
    c.professional_id,
    c.paciente_nombre,
    c.paciente_email,
    c.paciente_telefono,
    c.fecha,
    c.hora_inicio,
    c.hora_fin,
    COALESCE(s.nombre, 'Consulta') AS servicio_nombre,
    COALESCE(u.nombre_completo, 'Profesional') AS profesional_nombre,
    t.nombre AS tenant_nombre
  FROM citas c
  LEFT JOIN servicios s ON s.id = c.servicio_id
  LEFT JOIN professionals p ON p.id = c.professional_id
  LEFT JOIN users u ON u.id = p.user_id
  LEFT JOIN tenants t ON t.id = c.tenant_id
  WHERE c.estado IN ('pendiente', 'confirmada')
    AND (c.fecha + c.hora_inicio) BETWEEN NOW() AND NOW() + (p_horas || ' hours')::INTERVAL
    AND NOT EXISTS (
      SELECT 1 FROM notificaciones n
      WHERE n.cita_id = c.id
        AND n.tipo = p_tipo
    );
END;
$$;

-- =============================================
-- Habilitar Realtime para notificaciones
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
