"use server";

import { createClient } from "@/lib/supabase/server";
import { reservaSchema } from "@/lib/validations/reserva";
import { notificar } from "@/lib/notificaciones/servicio";

export async function obtenerDatosProfesional(slug) {
  const supabase = await createClient();

  // Obtener tenant por slug
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (tenantError || !tenant) {
    return null;
  }

  // Obtener profesional con datos del usuario
  const { data: profesional } = await supabase
    .from("professionals")
    .select("id, especialidad, biografia, numero_matricula")
    .eq("tenant_id", tenant.id)
    .single();

  if (!profesional) {
    return null;
  }

  // Obtener datos del usuario (nombre, avatar)
  const { data: usuario } = await supabase
    .from("users")
    .select("nombre_completo, avatar_url")
    .eq("tenant_id", tenant.id)
    .eq("rol", "profesional")
    .single();

  // Obtener servicios activos
  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, nombre, duracion_minutos, precio, descripcion, color")
    .eq("tenant_id", tenant.id)
    .eq("activo", true)
    .order("nombre");

  // Obtener disponibilidad activa (multiples bloques por dia)
  const { data: disponibilidadRaw } = await supabase
    .from("disponibilidad")
    .select("dia_semana, hora_inicio, hora_fin, activo, bloque")
    .eq("professional_id", profesional.id)
    .eq("activo", true)
    .order("dia_semana")
    .order("bloque");

  // Agrupar bloques por dia
  const disponibilidadMap = {};
  for (const d of (disponibilidadRaw || [])) {
    if (!disponibilidadMap[d.dia_semana]) {
      disponibilidadMap[d.dia_semana] = { dia_semana: d.dia_semana, bloques: [] };
    }
    disponibilidadMap[d.dia_semana].bloques.push({
      hora_inicio: d.hora_inicio,
      hora_fin: d.hora_fin,
    });
  }
  const disponibilidad = Object.values(disponibilidadMap);

  return {
    tenant,
    profesional: {
      ...profesional,
      nombre_completo: usuario?.nombre_completo || "",
      avatar_url: usuario?.avatar_url || null,
    },
    servicios: servicios || [],
    disponibilidad: disponibilidad || [],
  };
}

export async function obtenerSlotsDisponibles(slug, fecha, servicioId) {
  const supabase = await createClient();

  // 1. Obtener tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) return [];

  // 2. Obtener profesional
  const { data: profesional } = await supabase
    .from("professionals")
    .select("id")
    .eq("tenant_id", tenant.id)
    .single();

  if (!profesional) return [];

  // 3. Obtener duracion del servicio
  const { data: servicio } = await supabase
    .from("servicios")
    .select("duracion_minutos")
    .eq("id", servicioId)
    .eq("tenant_id", tenant.id)
    .eq("activo", true)
    .single();

  if (!servicio) return [];

  const duracion = servicio.duracion_minutos;

  // 4. Obtener dia de la semana (0=domingo, 6=sabado)
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const fechaObj = new Date(anio, mes - 1, dia);
  const diaSemana = fechaObj.getDay();

  // 5. Obtener disponibilidad para ese dia (multiples bloques)
  const { data: bloquesDia } = await supabase
    .from("disponibilidad")
    .select("hora_inicio, hora_fin")
    .eq("professional_id", profesional.id)
    .eq("dia_semana", diaSemana)
    .eq("activo", true)
    .order("hora_inicio");

  if (!bloquesDia || bloquesDia.length === 0) return [];

  // 6. Verificar si hay bloqueo en esa fecha
  const { data: bloqueados } = await supabase
    .from("fechas_bloqueadas")
    .select("todo_el_dia, hora_inicio, hora_fin")
    .eq("professional_id", profesional.id)
    .eq("fecha", fecha);

  // Si hay bloqueo de todo el dia, no hay slots
  if (bloqueados?.some((b) => b.todo_el_dia)) return [];

  // 7. Obtener horarios ocupados via RPC
  const { data: ocupados } = await supabase.rpc("obtener_horarios_ocupados", {
    p_professional_id: profesional.id,
    p_fecha: fecha,
  });

  // 8. Generar slots iterando sobre cada bloque de disponibilidad
  const slots = [];

  for (const bloque of bloquesDia) {
    const [inicioH, inicioM] = bloque.hora_inicio.split(":").map(Number);
    const [finH, finM] = bloque.hora_fin.split(":").map(Number);
    const inicioMinutos = inicioH * 60 + inicioM;
    const finMinutos = finH * 60 + finM;

    for (let min = inicioMinutos; min + duracion <= finMinutos; min += duracion) {
      const slotInicio = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
      const slotFin = `${String(Math.floor((min + duracion) / 60)).padStart(2, "0")}:${String((min + duracion) % 60).padStart(2, "0")}`;

      // Verificar que no esta ocupado
      const estaOcupado = ocupados?.some(
        (o) => slotInicio < o.hora_fin && slotFin > o.hora_inicio
      );

      if (estaOcupado) continue;

      // Verificar bloqueos parciales
      const estaBloqueado = bloqueados?.some(
        (b) =>
          !b.todo_el_dia &&
          b.hora_inicio &&
          b.hora_fin &&
          slotInicio < b.hora_fin &&
          slotFin > b.hora_inicio
      );

      if (estaBloqueado) continue;

      slots.push({ hora_inicio: slotInicio, hora_fin: slotFin });
    }
  }

  return slots;
}

export async function crearReserva(prevState, formData) {
  const rawData = {
    servicio_id: formData.get("servicio_id"),
    fecha: formData.get("fecha"),
    hora_inicio: formData.get("hora_inicio"),
    paciente_nombre: formData.get("paciente_nombre"),
    paciente_telefono: formData.get("paciente_telefono"),
    paciente_email: formData.get("paciente_email"),
    notas: formData.get("notas"),
  };

  const resultado = reservaSchema.safeParse(rawData);
  if (!resultado.success) {
    return {
      error: null,
      fieldErrors: resultado.error.flatten().fieldErrors,
      success: null,
    };
  }

  const slug = formData.get("slug");
  const horaFin = formData.get("hora_fin");

  if (!slug || !horaFin) {
    return {
      error: "Datos incompletos para la reserva",
      fieldErrors: {},
      success: null,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("crear_cita_publica", {
    p_slug: slug,
    p_servicio_id: resultado.data.servicio_id,
    p_paciente_nombre: resultado.data.paciente_nombre,
    p_paciente_telefono: resultado.data.paciente_telefono || null,
    p_paciente_email: resultado.data.paciente_email || null,
    p_fecha: resultado.data.fecha,
    p_hora_inicio: resultado.data.hora_inicio,
    p_hora_fin: horaFin,
    p_notas: resultado.data.notas || null,
  });

  if (error) {
    console.error("Error al crear reserva:", error);
    return {
      error: "Error al procesar la reserva. Intente nuevamente.",
      fieldErrors: {},
      success: null,
    };
  }

  if (data?.error) {
    return {
      error: data.error,
      fieldErrors: {},
      success: null,
    };
  }

  // Enviar notificaciones de reserva
  try {
    // Obtener datos del tenant y profesional para las notificaciones
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, nombre")
      .eq("slug", slug)
      .single();

    if (tenant) {
      const { data: usuario } = await supabase
        .from("users")
        .select("id, nombre_completo")
        .eq("tenant_id", tenant.id)
        .eq("rol", "profesional")
        .single();

      let servicioNombre = "Consulta";
      const { data: serv } = await supabase
        .from("servicios")
        .select("nombre")
        .eq("id", resultado.data.servicio_id)
        .single();
      if (serv) servicioNombre = serv.nombre;

      const contexto = {
        paciente_nombre: resultado.data.paciente_nombre,
        fecha: resultado.data.fecha,
        hora_inicio: resultado.data.hora_inicio,
        servicio_nombre: servicioNombre,
        profesional_nombre: usuario?.nombre_completo,
        tenant_nombre: tenant.nombre,
      };

      // Notificacion al paciente (email/whatsapp)
      notificar({
        tenant_id: tenant.id,
        tipo: "cita_creada",
        cita_id: data?.cita_id,
        destinatario_nombre: resultado.data.paciente_nombre,
        destinatario_email: resultado.data.paciente_email,
        destinatario_telefono: resultado.data.paciente_telefono,
        contexto,
      });

      // Notificacion al profesional (in_app + email)
      if (usuario) {
        notificar({
          tenant_id: tenant.id,
          tipo: "reserva_nueva",
          cita_id: data?.cita_id,
          usuario_id: usuario.id,
          destinatario_nombre: usuario.nombre_completo,
          contexto,
          canales: ["in_app"],
        });
      }
    }
  } catch (notifErr) {
    console.error("Error al notificar reserva:", notifErr);
  }

  return {
    error: null,
    fieldErrors: {},
    success: data,
  };
}
