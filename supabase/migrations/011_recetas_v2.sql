-- ============================================
-- 011_recetas_v2.sql
-- Fase 2: Sistema de recetas universal + firma digital
-- Ejecutar en Supabase SQL Editor DESPUES de 010
-- ============================================

-- ============================================
-- 1. AMPLIAR TABLA RECETAS
-- ============================================

-- Tipo de documento (receta, indicacion, orden, derivacion, certificado)
ALTER TABLE recetas ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'receta_medicamento'
  CHECK (tipo IN ('receta_medicamento', 'indicacion_medica', 'orden_estudio', 'derivacion', 'certificado'));

-- Vincular al profesional que emite
ALTER TABLE recetas ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL;

-- Vincular opcionalmente a una cita
ALTER TABLE recetas ADD COLUMN IF NOT EXISTS cita_id UUID REFERENCES citas(id) ON DELETE SET NULL;

-- Contenido libre para tipos que no son receta_medicamento
ALTER TABLE recetas ADD COLUMN IF NOT EXISTS contenido TEXT;

CREATE INDEX IF NOT EXISTS idx_recetas_tipo ON recetas(tipo);
CREATE INDEX IF NOT EXISTS idx_recetas_professional ON recetas(professional_id);
CREATE INDEX IF NOT EXISTS idx_recetas_cita ON recetas(cita_id);

-- Relajar constraint de medicamentos (puede ser vacio para indicaciones/ordenes/etc)
-- medicamentos ya es JSONB DEFAULT '[]', no hay constraint que cambiar

-- ============================================
-- 2. FIRMA DIGITAL EN PROFESSIONALS
-- ============================================

ALTER TABLE professionals ADD COLUMN IF NOT EXISTS firma_url TEXT;

-- ============================================
-- 3. STORAGE BUCKET PARA FIRMAS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('firmas', 'firmas', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "firma_upload" ON storage.objects;
CREATE POLICY "firma_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'firmas');

DROP POLICY IF EXISTS "firma_select" ON storage.objects;
CREATE POLICY "firma_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'firmas');

DROP POLICY IF EXISTS "firma_update" ON storage.objects;
CREATE POLICY "firma_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'firmas');

DROP POLICY IF EXISTS "firma_delete" ON storage.objects;
CREATE POLICY "firma_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'firmas');
