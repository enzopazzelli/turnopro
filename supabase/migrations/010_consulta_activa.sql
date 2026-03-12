-- ============================================
-- 010_consulta_activa.sql
-- Consulta activa: notas durante la consulta + hora de inicio real
-- Ejecutar en Supabase SQL Editor DESPUES de 009
-- ============================================

-- Campo para notas tomadas durante la consulta activa (separado de notas de la cita)
ALTER TABLE citas ADD COLUMN IF NOT EXISTS notas_consulta TEXT;

-- Hora real de inicio de la consulta (cuando el profesional hace click en "Iniciar")
ALTER TABLE citas ADD COLUMN IF NOT EXISTS hora_inicio_consulta TIMESTAMPTZ;

-- Hora real de fin de la consulta (cuando el profesional completa)
ALTER TABLE citas ADD COLUMN IF NOT EXISTS hora_fin_consulta TIMESTAMPTZ;
