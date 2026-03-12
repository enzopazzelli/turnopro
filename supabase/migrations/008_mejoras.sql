-- ============================================
-- TurnoPro: Mejoras — paciente auto, horarios con cortes, solicitudes demo
-- Ejecutar en Supabase SQL Editor DESPUES de 007
-- ============================================

-- ============================================
-- 1. HORARIOS CON CORTES (BLOQUES)
-- ============================================

-- Eliminar constraint unique viejo (professional_id, dia_semana)
ALTER TABLE disponibilidad DROP CONSTRAINT IF EXISTS disponibilidad_professional_id_dia_semana_key;

-- Agregar columna bloque
ALTER TABLE disponibilidad ADD COLUMN IF NOT EXISTS bloque INTEGER NOT NULL DEFAULT 1;

-- Nuevo constraint unique con bloque
ALTER TABLE disponibilidad ADD CONSTRAINT disponibilidad_professional_dia_bloque_key
  UNIQUE(professional_id, dia_semana, bloque);

-- Actualizar la funcion de inicializacion para incluir bloque
CREATE OR REPLACE FUNCTION public.inicializar_disponibilidad_profesional(
  p_professional_id UUID,
  p_tenant_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.disponibilidad (professional_id, tenant_id, dia_semana, hora_inicio, hora_fin, activo, bloque)
  SELECT
    p_professional_id,
    p_tenant_id,
    dia,
    '09:00'::TIME,
    '18:00'::TIME,
    CASE WHEN dia BETWEEN 1 AND 5 THEN true ELSE false END,
    1
  FROM generate_series(0, 6) AS dia
  ON CONFLICT (professional_id, dia_semana, bloque) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. CREAR_CITA_PUBLICA CON AUTO-PACIENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.crear_cita_publica(
  p_slug TEXT,
  p_servicio_id UUID,
  p_paciente_nombre TEXT,
  p_paciente_telefono TEXT,
  p_paciente_email TEXT,
  p_fecha DATE,
  p_hora_inicio TIME,
  p_hora_fin TIME,
  p_notas TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_professional_id UUID;
  v_cita_id UUID;
  v_paciente_id UUID;
  v_servicio_valido BOOLEAN;
  v_disponible BOOLEAN;
  v_bloqueado BOOLEAN;
  v_solapado BOOLEAN;
  v_dia_semana INTEGER;
BEGIN
  -- 1. Obtener tenant activo por slug
  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = p_slug AND t.activo = true;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Profesional no encontrado');
  END IF;

  -- 2. Obtener professional_id del tenant
  SELECT p.id INTO v_professional_id
  FROM public.professionals p
  WHERE p.tenant_id = v_tenant_id
  LIMIT 1;

  IF v_professional_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Profesional no encontrado');
  END IF;

  -- 3. Validar que el servicio existe y esta activo para ese tenant
  SELECT EXISTS (
    SELECT 1 FROM public.servicios s
    WHERE s.id = p_servicio_id
      AND s.tenant_id = v_tenant_id
      AND s.activo = true
  ) INTO v_servicio_valido;

  IF NOT v_servicio_valido THEN
    RETURN jsonb_build_object('error', 'Servicio no disponible');
  END IF;

  -- 4. Validar que la fecha no es pasada
  IF p_fecha < CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'No se puede reservar en una fecha pasada');
  END IF;

  -- 5. Validar disponibilidad del dia de la semana (cualquier bloque)
  v_dia_semana := EXTRACT(DOW FROM p_fecha)::INTEGER;

  SELECT EXISTS (
    SELECT 1 FROM public.disponibilidad d
    WHERE d.professional_id = v_professional_id
      AND d.dia_semana = v_dia_semana
      AND d.activo = true
      AND p_hora_inicio >= d.hora_inicio
      AND p_hora_fin <= d.hora_fin
  ) INTO v_disponible;

  IF NOT v_disponible THEN
    RETURN jsonb_build_object('error', 'Horario fuera de disponibilidad');
  END IF;

  -- 6. Validar que no hay bloqueo en la fecha
  SELECT EXISTS (
    SELECT 1 FROM public.fechas_bloqueadas fb
    WHERE fb.professional_id = v_professional_id
      AND fb.fecha = p_fecha
      AND (
        fb.todo_el_dia = true
        OR (p_hora_inicio < fb.hora_fin AND p_hora_fin > fb.hora_inicio)
      )
  ) INTO v_bloqueado;

  IF v_bloqueado THEN
    RETURN jsonb_build_object('error', 'El profesional no atiende en esta fecha/horario');
  END IF;

  -- 7. Validar que no hay solapamiento con citas existentes
  SELECT EXISTS (
    SELECT 1 FROM public.citas c
    WHERE c.professional_id = v_professional_id
      AND c.fecha = p_fecha
      AND c.estado NOT IN ('cancelada', 'no_asistio')
      AND p_hora_inicio < c.hora_fin
      AND p_hora_fin > c.hora_inicio
  ) INTO v_solapado;

  IF v_solapado THEN
    RETURN jsonb_build_object('error', 'El horario seleccionado ya no esta disponible');
  END IF;

  -- 8. Buscar o crear paciente
  IF p_paciente_email IS NOT NULL AND p_paciente_email <> '' THEN
    -- Buscar por email (case-insensitive)
    SELECT id INTO v_paciente_id
    FROM public.pacientes
    WHERE tenant_id = v_tenant_id
      AND LOWER(email) = LOWER(p_paciente_email)
      AND activo = true
    LIMIT 1;
  END IF;

  IF v_paciente_id IS NULL AND p_paciente_nombre IS NOT NULL THEN
    -- Buscar por nombre + telefono
    SELECT id INTO v_paciente_id
    FROM public.pacientes
    WHERE tenant_id = v_tenant_id
      AND LOWER(nombre_completo) = LOWER(p_paciente_nombre)
      AND telefono = p_paciente_telefono
      AND activo = true
    LIMIT 1;
  END IF;

  IF v_paciente_id IS NULL THEN
    -- Crear nuevo paciente
    INSERT INTO public.pacientes (
      tenant_id, nombre_completo, telefono, email, etiquetas
    ) VALUES (
      v_tenant_id, p_paciente_nombre, p_paciente_telefono, p_paciente_email,
      ARRAY['reserva_online']
    )
    RETURNING id INTO v_paciente_id;
  ELSE
    -- Actualizar datos si llegan nuevos
    UPDATE public.pacientes
    SET
      telefono = COALESCE(NULLIF(p_paciente_telefono, ''), telefono),
      email = COALESCE(NULLIF(p_paciente_email, ''), email),
      updated_at = NOW()
    WHERE id = v_paciente_id;
  END IF;

  -- 9. Insertar la cita con paciente_id vinculado
  INSERT INTO public.citas (
    tenant_id, professional_id, servicio_id,
    paciente_nombre, paciente_telefono, paciente_email,
    paciente_id, fecha, hora_inicio, hora_fin, estado, notas
  ) VALUES (
    v_tenant_id, v_professional_id, p_servicio_id,
    p_paciente_nombre, p_paciente_telefono, p_paciente_email,
    v_paciente_id, p_fecha, p_hora_inicio, p_hora_fin, 'pendiente', p_notas
  )
  RETURNING id INTO v_cita_id;

  RETURN jsonb_build_object(
    'cita_id', v_cita_id,
    'paciente_id', v_paciente_id,
    'mensaje', 'Turno reservado exitosamente'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. SOLICITUDES DE DEMO (LANDING PAGE)
-- ============================================

CREATE TABLE IF NOT EXISTS public.solicitudes_demo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  rubro TEXT NOT NULL,
  mensaje TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.solicitudes_demo ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquiera (anon) inserte solicitudes
CREATE POLICY "Insertar solicitudes de demo anon"
  ON public.solicitudes_demo FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Solo superadmin puede ver (cuando se implemente)
CREATE POLICY "Superadmin puede ver solicitudes"
  ON public.solicitudes_demo FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_id = auth.uid()
        AND u.rol = 'superadmin'
    )
  );
