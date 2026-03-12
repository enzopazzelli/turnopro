-- ============================================
-- 009_mejoras_agenda.sql
-- Fase 1: Mejoras al Core de Agenda y Notificaciones
-- Ejecutar en Supabase SQL Editor DESPUES de 008
-- ============================================

-- ============================================
-- 1.1 MOTIVO EN CITAS
-- Campo para motivo de cita, cancelacion o reprogramacion
-- ============================================
ALTER TABLE citas ADD COLUMN IF NOT EXISTS motivo TEXT;

-- Nuevo tipo de notificacion: cita_reprogramada
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tipo_check
  CHECK (tipo IN (
    'cita_creada', 'cita_confirmada', 'cita_cancelada', 'cita_modificada',
    'cita_reprogramada', 'recordatorio_24h', 'recordatorio_2h',
    'reserva_nueva', 'pago_registrado', 'lista_espera_disponible', 'confirmacion_cita', 'general'
  ));

-- ============================================
-- 1.3 TURNOS RECURRENTES
-- ============================================
ALTER TABLE citas ADD COLUMN IF NOT EXISTS recurrencia TEXT
  CHECK (recurrencia IS NULL OR recurrencia IN ('semanal', 'quincenal', 'mensual'));
ALTER TABLE citas ADD COLUMN IF NOT EXISTS cita_padre_id UUID REFERENCES citas(id) ON DELETE SET NULL;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS recurrencia_fin DATE;

CREATE INDEX IF NOT EXISTS idx_citas_cita_padre ON citas(cita_padre_id);
CREATE INDEX IF NOT EXISTS idx_citas_recurrencia ON citas(recurrencia) WHERE recurrencia IS NOT NULL;

-- ============================================
-- 1.4 SOBRETURNOS
-- ============================================
ALTER TABLE citas ADD COLUMN IF NOT EXISTS sobreturno BOOLEAN DEFAULT false;

-- ============================================
-- 1.5 LISTA DE ESPERA
-- ============================================
CREATE TABLE IF NOT EXISTS lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  paciente_nombre TEXT NOT NULL,
  paciente_telefono TEXT,
  paciente_email TEXT,
  servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
  fecha_preferida DATE,
  horario_preferido TEXT CHECK (horario_preferido IS NULL OR horario_preferido IN ('manana', 'tarde', 'cualquiera')),
  estado TEXT NOT NULL DEFAULT 'esperando'
    CHECK (estado IN ('esperando', 'notificado', 'agendado', 'cancelado')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lista_espera_tenant ON lista_espera(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_professional ON lista_espera(professional_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_estado ON lista_espera(estado);
CREATE INDEX IF NOT EXISTS idx_lista_espera_fecha ON lista_espera(fecha_preferida);

ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lista_espera_select" ON lista_espera
  FOR SELECT USING (tenant_id = public.get_tenant_id_for_user());
CREATE POLICY "lista_espera_insert" ON lista_espera
  FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id_for_user());
CREATE POLICY "lista_espera_update" ON lista_espera
  FOR UPDATE USING (tenant_id = public.get_tenant_id_for_user());
CREATE POLICY "lista_espera_delete" ON lista_espera
  FOR DELETE USING (tenant_id = public.get_tenant_id_for_user());

-- ============================================
-- 1.7 DOBLE OPT-IN DE CONFIRMACION
-- Nuevo estado + token de confirmacion
-- ============================================
ALTER TABLE citas DROP CONSTRAINT IF EXISTS citas_estado_check;
ALTER TABLE citas ADD CONSTRAINT citas_estado_check
  CHECK (estado IN (
    'pendiente', 'pendiente_confirmacion', 'confirmada',
    'en_curso', 'completada', 'cancelada', 'no_asistio'
  ));

ALTER TABLE citas ADD COLUMN IF NOT EXISTS token_confirmacion UUID DEFAULT gen_random_uuid();
ALTER TABLE citas ADD COLUMN IF NOT EXISTS confirmacion_enviada_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_citas_token ON citas(token_confirmacion) WHERE token_confirmacion IS NOT NULL;
