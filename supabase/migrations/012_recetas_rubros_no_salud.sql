-- ============================================
-- 012_recetas_rubros_no_salud.sql
-- Fase 2.6: Documentos profesionales para abogados y contadores
-- Ejecutar en Supabase SQL Editor DESPUES de 011
-- ============================================

-- Ampliar CHECK constraint de tipo para incluir tipos de abogados y contadores
ALTER TABLE recetas DROP CONSTRAINT IF EXISTS recetas_tipo_check;

ALTER TABLE recetas ADD CONSTRAINT recetas_tipo_check
  CHECK (tipo IN (
    -- Salud
    'receta_medicamento',
    'indicacion_medica',
    'orden_estudio',
    'derivacion',
    'certificado',
    -- Abogados
    'carta_documento',
    'dictamen',
    'certificacion_firma',
    'informe_legal',
    'poder',
    -- Contadores
    'certificacion_ingresos',
    'informe_contable',
    'balance',
    'dictamen_contador',
    'nota_requerimiento'
  ));
