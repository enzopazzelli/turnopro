-- ============================================
-- TurnoPro: Pagina Publica de Reserva de Turnos
-- Ejecutar en Supabase SQL Editor DESPUES de 003
-- ============================================

-- ============================================
-- 1. POLITICAS RLS ANON FALTANTES
-- ============================================

-- professionals: acceso anon para ver datos del profesional (tenant activo)
DROP POLICY IF EXISTS "Acceso publico a profesionales de tenants activos" ON public.professionals;
CREATE POLICY "Acceso publico a profesionales de tenants activos"
  ON public.professionals FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = tenant_id AND t.activo = true
    )
  );

-- users: acceso anon limitado (solo profesionales de tenants activos — expone nombre_completo y avatar_url)
DROP POLICY IF EXISTS "Acceso publico a usuarios profesionales" ON public.users;
CREATE POLICY "Acceso publico a usuarios profesionales"
  ON public.users FOR SELECT
  TO anon
  USING (
    rol = 'profesional' AND
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = tenant_id AND t.activo = true
    )
  );

-- fechas_bloqueadas: acceso anon para saber que dias no hay atencion
DROP POLICY IF EXISTS "Acceso publico a fechas bloqueadas" ON public.fechas_bloqueadas;
CREATE POLICY "Acceso publico a fechas bloqueadas"
  ON public.fechas_bloqueadas FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = tenant_id AND t.activo = true
    )
  );

-- ============================================
-- 2. RPC: obtener_horarios_ocupados
-- Retorna solo hora_inicio/hora_fin de citas activas
-- para una fecha dada. NO expone datos de pacientes.
-- ============================================
CREATE OR REPLACE FUNCTION public.obtener_horarios_ocupados(
  p_professional_id UUID,
  p_fecha DATE
)
RETURNS TABLE (hora_inicio TIME, hora_fin TIME) AS $$
BEGIN
  RETURN QUERY
  SELECT c.hora_inicio, c.hora_fin
  FROM public.citas c
  WHERE c.professional_id = p_professional_id
    AND c.fecha = p_fecha
    AND c.estado NOT IN ('cancelada', 'no_asistio');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 3. RPC: crear_cita_publica
-- Inserta una cita desde la pagina publica con
-- validaciones server-side en una sola transaccion.
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

  -- 5. Validar disponibilidad del dia de la semana
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

  -- 8. Insertar la cita
  INSERT INTO public.citas (
    tenant_id, professional_id, servicio_id,
    paciente_nombre, paciente_telefono, paciente_email,
    fecha, hora_inicio, hora_fin, estado, notas
  ) VALUES (
    v_tenant_id, v_professional_id, p_servicio_id,
    p_paciente_nombre, p_paciente_telefono, p_paciente_email,
    p_fecha, p_hora_inicio, p_hora_fin, 'pendiente', p_notas
  )
  RETURNING id INTO v_cita_id;

  RETURN jsonb_build_object(
    'cita_id', v_cita_id,
    'mensaje', 'Turno reservado exitosamente'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
