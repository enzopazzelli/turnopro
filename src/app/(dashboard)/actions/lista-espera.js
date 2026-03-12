"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listaEsperaSchema } from "@/lib/validations/agenda";

export async function obtenerListaEspera() {
  const supabase = await createClient();
  const professionalId = (await supabase.rpc("get_professional_id_for_user")).data;

  if (!professionalId) {
    return { data: [], error: "No se pudo identificar al profesional" };
  }

  const { data, error } = await supabase
    .from("lista_espera")
    .select("*, servicios(nombre, color)")
    .eq("professional_id", professionalId)
    .in("estado", ["esperando", "notificado"])
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error: "Error al obtener la lista de espera" };
  }

  return { data: data || [], error: null };
}

export async function agregarAListaEspera(prevState, formData) {
  const rawData = {
    paciente_nombre: formData.get("paciente_nombre") || "",
    paciente_telefono: formData.get("paciente_telefono") || "",
    paciente_email: formData.get("paciente_email") || "",
    paciente_id: formData.get("paciente_id") || "",
    servicio_id: formData.get("servicio_id") || "",
    fecha_preferida: formData.get("fecha_preferida") || "",
    horario_preferido: formData.get("horario_preferido") || "",
    notas: formData.get("notas") || "",
  };

  const resultado = listaEsperaSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  const professionalId = (await supabase.rpc("get_professional_id_for_user")).data;

  if (!tenantId || !professionalId) {
    return { error: "No se pudo identificar tu cuenta.", fieldErrors: {} };
  }

  const insertData = {
    tenant_id: tenantId,
    professional_id: professionalId,
    ...resultado.data,
  };

  if (!insertData.paciente_id) delete insertData.paciente_id;
  if (!insertData.servicio_id) delete insertData.servicio_id;
  if (!insertData.fecha_preferida) delete insertData.fecha_preferida;
  if (!insertData.horario_preferido) delete insertData.horario_preferido;

  const { error } = await supabase.from("lista_espera").insert(insertData);

  if (error) {
    console.error("Error al agregar a lista de espera:", error);
    return { error: "Error al agregar a la lista de espera", fieldErrors: {} };
  }

  revalidatePath("/dashboard/agenda");
  return { error: null, fieldErrors: {}, success: Date.now() };
}

export async function cambiarEstadoListaEspera(id, nuevoEstado) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lista_espera")
    .update({ estado: nuevoEstado })
    .eq("id", id);

  if (error) {
    return { error: "Error al actualizar el estado" };
  }

  revalidatePath("/dashboard/agenda");
  return { error: null };
}

export async function eliminarDeListaEspera(id) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lista_espera")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "Error al eliminar de la lista de espera" };
  }

  revalidatePath("/dashboard/agenda");
  return { error: null };
}
