"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fechaBloqueadaSchema } from "@/lib/validations/agenda";
import { notificar } from "@/lib/notificaciones/servicio";

export async function obtenerFechasBloqueadas() {
  const supabase = await createClient();
  const professionalId = (await supabase.rpc("get_professional_id_for_user"))
    .data;

  const { data, error } = await supabase
    .from("fechas_bloqueadas")
    .select("*")
    .eq("professional_id", professionalId)
    .order("fecha", { ascending: true });

  if (error) {
    return { data: [], error: "Error al obtener fechas bloqueadas" };
  }

  return { data: data || [], error: null };
}

export async function crearFechaBloqueada(prevState, formData) {
  const rawData = {
    fecha: formData.get("fecha"),
    motivo: formData.get("motivo"),
  };

  const resultado = fechaBloqueadaSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  const professionalId = (await supabase.rpc("get_professional_id_for_user"))
    .data;

  const { error } = await supabase.from("fechas_bloqueadas").insert({
    tenant_id: tenantId,
    professional_id: professionalId,
    ...resultado.data,
  });

  if (error) {
    return { error: "Error al bloquear la fecha", fieldErrors: {} };
  }

  // 1.2: Notificar a pacientes con citas ese dia
  try {
    await notificarCitasEnFechaBloqueada(supabase, {
      professionalId,
      tenantId,
      fecha: resultado.data.fecha,
      motivo: resultado.data.motivo,
    });
  } catch (err) {
    console.error("Error al notificar citas afectadas por bloqueo:", err);
  }

  revalidatePath("/dashboard/agenda");
  return { error: null, fieldErrors: {}, success: true };
}

export async function eliminarFechaBloqueada(id) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("fechas_bloqueadas")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "Error al desbloquear la fecha" };
  }

  revalidatePath("/dashboard/agenda");
  return { error: null };
}

async function notificarCitasEnFechaBloqueada(supabase, { professionalId, tenantId, fecha, motivo }) {
  // Buscar citas pendientes/confirmadas en esa fecha
  const { data: citasAfectadas } = await supabase
    .from("citas")
    .select("id, paciente_nombre, paciente_email, paciente_telefono, hora_inicio, servicio_id")
    .eq("professional_id", professionalId)
    .eq("fecha", fecha)
    .in("estado", ["pendiente", "confirmada"]);

  if (!citasAfectadas || citasAfectadas.length === 0) return;

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
      tipo: "cita_cancelada",
      cita_id: cita.id,
      destinatario_nombre: cita.paciente_nombre,
      destinatario_email: cita.paciente_email,
      destinatario_telefono: cita.paciente_telefono,
      contexto: {
        paciente_nombre: cita.paciente_nombre,
        fecha,
        hora_inicio: cita.hora_inicio,
        servicio_nombre: servicioNombre,
        profesional_nombre: usuario?.nombre_completo,
        tenant_nombre: tenantData?.nombre,
        motivo: motivo || "Fecha bloqueada por el profesional. Por favor contactanos para reprogramar.",
      },
    });
  }
}
