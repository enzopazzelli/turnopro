"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notificar } from "@/lib/notificaciones/servicio";
import { addDays, format, getDay, startOfDay, isBefore } from "date-fns";

export async function guardarDisponibilidad(prevState, formData) {
  const diasJson = formData.get("dias");

  let dias;
  try {
    dias = JSON.parse(diasJson);
  } catch {
    return { error: "Datos invalidos" };
  }

  const supabase = await createClient();
  const professionalId = (await supabase.rpc("get_professional_id_for_user")).data;
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!professionalId || !tenantId) {
    return { error: "No se pudo identificar tu cuenta. Intenta cerrar sesion y volver a entrar." };
  }

  // Guardar disponibilidad anterior para detectar cambios
  const { data: dispAnterior } = await supabase
    .from("disponibilidad")
    .select("dia_semana, hora_inicio, hora_fin, activo")
    .eq("professional_id", professionalId);

  // Para cada dia, eliminar bloques existentes e insertar los nuevos
  for (const dia of dias) {
    const { error: deleteError } = await supabase
      .from("disponibilidad")
      .delete()
      .eq("professional_id", professionalId)
      .eq("dia_semana", dia.dia_semana);

    if (deleteError) {
      return { error: `Error al actualizar el dia ${dia.dia_semana}` };
    }

    if (dia.activo && dia.bloques && dia.bloques.length > 0) {
      const registros = dia.bloques.map((bloque, idx) => ({
        professional_id: professionalId,
        tenant_id: tenantId,
        dia_semana: dia.dia_semana,
        hora_inicio: bloque.hora_inicio,
        hora_fin: bloque.hora_fin,
        activo: true,
        bloque: idx + 1,
      }));

      const { error: insertError } = await supabase
        .from("disponibilidad")
        .insert(registros);

      if (insertError) {
        return { error: `Error al guardar bloques del dia ${dia.dia_semana}` };
      }
    } else {
      const { error: insertError } = await supabase
        .from("disponibilidad")
        .insert({
          professional_id: professionalId,
          tenant_id: tenantId,
          dia_semana: dia.dia_semana,
          hora_inicio: "09:00",
          hora_fin: "18:00",
          activo: false,
          bloque: 1,
        });

      if (insertError) {
        return { error: `Error al guardar el dia ${dia.dia_semana}` };
      }
    }
  }

  // 1.2: Detectar citas afectadas y notificar
  try {
    await notificarCitasAfectadasPorHorario(supabase, {
      professionalId,
      tenantId,
      diasNuevos: dias,
      dispAnterior: dispAnterior || [],
    });
  } catch (err) {
    console.error("Error al notificar citas afectadas:", err);
  }

  revalidatePath("/dashboard/horarios");
  return { error: null, success: Date.now() };
}

export async function inicializarDisponibilidad() {
  const supabase = await createClient();
  const professionalId = (await supabase.rpc("get_professional_id_for_user")).data;
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  await supabase.rpc("inicializar_disponibilidad_profesional", {
    p_professional_id: professionalId,
    p_tenant_id: tenantId,
  });

  revalidatePath("/dashboard/horarios");
}

// Buscar citas futuras que quedan fuera del nuevo horario y notificar
async function notificarCitasAfectadasPorHorario(supabase, { professionalId, tenantId, diasNuevos, dispAnterior }) {
  const hoy = format(new Date(), "yyyy-MM-dd");

  // Buscar citas futuras pendientes/confirmadas
  const { data: citasFuturas } = await supabase
    .from("citas")
    .select("id, paciente_nombre, paciente_email, paciente_telefono, fecha, hora_inicio, hora_fin, servicio_id")
    .eq("professional_id", professionalId)
    .gte("fecha", hoy)
    .in("estado", ["pendiente", "confirmada"])
    .eq("sobreturno", false);

  if (!citasFuturas || citasFuturas.length === 0) return;

  // Crear mapa de disponibilidad nueva por dia
  const dispNueva = {};
  for (const dia of diasNuevos) {
    if (dia.activo && dia.bloques && dia.bloques.length > 0) {
      dispNueva[dia.dia_semana] = dia.bloques;
    } else {
      dispNueva[dia.dia_semana] = null; // dia no disponible
    }
  }

  const citasAfectadas = [];

  for (const cita of citasFuturas) {
    const fechaCita = new Date(cita.fecha + "T00:00:00");
    const diaSemana = getDay(fechaCita); // 0=domingo...6=sabado

    const bloques = dispNueva[diaSemana];

    if (!bloques) {
      // Dia fue desactivado, cita queda afectada
      citasAfectadas.push(cita);
      continue;
    }

    // Verificar si la cita cabe en algun bloque
    const citaInicio = cita.hora_inicio.slice(0, 5);
    const citaFin = cita.hora_fin.slice(0, 5);
    const cabeEnAlgunBloque = bloques.some(
      (b) => citaInicio >= b.hora_inicio && citaFin <= b.hora_fin
    );

    if (!cabeEnAlgunBloque) {
      citasAfectadas.push(cita);
    }
  }

  if (citasAfectadas.length === 0) return;

  // Obtener datos para la notificacion
  const { data: usuario } = await supabase
    .from("users")
    .select("nombre_completo")
    .eq("tenant_id", tenantId)
    .eq("rol", "profesional")
    .single();

  const { data: tenantData } = await supabase
    .from("tenants")
    .select("nombre")
    .eq("id", tenantId)
    .single();

  for (const cita of citasAfectadas) {
    let servicioNombre = "Consulta";
    if (cita.servicio_id) {
      const { data: serv } = await supabase
        .from("servicios")
        .select("nombre")
        .eq("id", cita.servicio_id)
        .single();
      if (serv) servicioNombre = serv.nombre;
    }

    notificar({
      tenant_id: tenantId,
      tipo: "cita_modificada",
      cita_id: cita.id,
      destinatario_nombre: cita.paciente_nombre,
      destinatario_email: cita.paciente_email,
      destinatario_telefono: cita.paciente_telefono,
      contexto: {
        paciente_nombre: cita.paciente_nombre,
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        servicio_nombre: servicioNombre,
        profesional_nombre: usuario?.nombre_completo,
        tenant_nombre: tenantData?.nombre,
        motivo: "Cambio en el horario de atencion del profesional. Por favor contactanos para reprogramar.",
      },
    });
  }
}
