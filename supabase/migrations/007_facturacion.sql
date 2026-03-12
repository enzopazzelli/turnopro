-- ============================================
-- 007_facturacion.sql
-- Modulo de facturacion y pagos
-- ============================================

-- ============================================
-- TABLA: pagos
-- ============================================
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cita_id UUID REFERENCES citas(id) ON DELETE SET NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito', 'mercado_pago', 'obra_social')),
  referencia TEXT,
  notas TEXT,
  anulado BOOLEAN DEFAULT false,
  anulado_at TIMESTAMPTZ,
  anulado_motivo TEXT,
  mp_payment_id TEXT,
  mp_status TEXT,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger updated_at (reutiliza funcion existente de 001)
CREATE TRIGGER set_pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at();

-- Indices
CREATE INDEX idx_pagos_tenant_id ON pagos(tenant_id);
CREATE INDEX idx_pagos_cita_id ON pagos(cita_id);
CREATE INDEX idx_pagos_paciente_id ON pagos(paciente_id);
CREATE INDEX idx_pagos_fecha_pago ON pagos(fecha_pago);

-- RLS
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_select" ON pagos
  FOR SELECT USING (tenant_id = public.get_tenant_id_for_user());

CREATE POLICY "pagos_insert" ON pagos
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id_for_user());

CREATE POLICY "pagos_update" ON pagos
  FOR UPDATE USING (tenant_id = public.get_tenant_id_for_user());

CREATE POLICY "pagos_delete" ON pagos
  FOR DELETE USING (tenant_id = public.get_tenant_id_for_user());

-- ============================================
-- TABLA: recibos
-- ============================================
CREATE TABLE recibos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pago_id UUID NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
  numero_recibo INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'recibo' CHECK (tipo IN ('recibo', 'factura', 'nota_credito')),
  estado TEXT NOT NULL DEFAULT 'emitido' CHECK (estado IN ('emitido', 'anulado')),
  datos_recibo JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, numero_recibo)
);

-- Indices
CREATE INDEX idx_recibos_tenant_id ON recibos(tenant_id);
CREATE INDEX idx_recibos_pago_id ON recibos(pago_id);

-- RLS
ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recibos_select" ON recibos
  FOR SELECT USING (tenant_id = public.get_tenant_id_for_user());

CREATE POLICY "recibos_insert" ON recibos
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id_for_user());

CREATE POLICY "recibos_update" ON recibos
  FOR UPDATE USING (tenant_id = public.get_tenant_id_for_user());

CREATE POLICY "recibos_delete" ON recibos
  FOR DELETE USING (tenant_id = public.get_tenant_id_for_user());

-- ============================================
-- VIEW: cuenta_corriente_pacientes
-- ============================================
CREATE OR REPLACE VIEW cuenta_corriente_pacientes AS
SELECT
  p.id AS paciente_id,
  p.tenant_id,
  p.nombre_completo,
  COALESCE(cargos.total_cargos, 0) AS total_cargos,
  COALESCE(abonos.total_pagos, 0) AS total_pagos,
  COALESCE(cargos.total_cargos, 0) - COALESCE(abonos.total_pagos, 0) AS saldo
FROM pacientes p
LEFT JOIN (
  SELECT
    c.paciente_id,
    SUM(s.precio) AS total_cargos
  FROM citas c
  JOIN servicios s ON s.id = c.servicio_id
  WHERE c.estado NOT IN ('cancelada')
    AND c.paciente_id IS NOT NULL
  GROUP BY c.paciente_id
) cargos ON cargos.paciente_id = p.id
LEFT JOIN (
  SELECT
    pg.paciente_id,
    SUM(pg.monto) AS total_pagos
  FROM pagos pg
  WHERE pg.anulado = false
    AND pg.paciente_id IS NOT NULL
  GROUP BY pg.paciente_id
) abonos ON abonos.paciente_id = p.id
WHERE p.activo = true;

-- ============================================
-- RPC: obtener_siguiente_numero_recibo
-- ============================================
CREATE OR REPLACE FUNCTION obtener_siguiente_numero_recibo(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_siguiente INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_recibo), 0) + 1
  INTO v_siguiente
  FROM recibos
  WHERE tenant_id = p_tenant_id;

  RETURN v_siguiente;
END;
$$;

-- ============================================
-- ALTER: notificaciones tipo CHECK
-- Agregar 'pago_registrado' al constraint
-- ============================================
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tipo_check
  CHECK (tipo IN (
    'cita_creada', 'cita_confirmada', 'cita_cancelada', 'cita_modificada',
    'recordatorio_24h', 'recordatorio_2h', 'reserva_nueva', 'pago_registrado', 'general'
  ));
