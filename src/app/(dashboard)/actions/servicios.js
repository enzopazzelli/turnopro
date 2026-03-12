"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { servicioSchema } from "@/lib/validations/agenda";

export async function crearServicio(prevState, formData) {
  const rawData = {
    nombre: formData.get("nombre"),
    duracion_minutos: formData.get("duracion_minutos"),
    precio: formData.get("precio"),
    descripcion: formData.get("descripcion"),
    color: formData.get("color"),
  };

  const resultado = servicioSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar tu cuenta. Intenta cerrar sesion y volver a entrar.", fieldErrors: {} };
  }

  const { error } = await supabase.from("servicios").insert({
    tenant_id: tenantId,
    ...resultado.data,
  });

  if (error) {
    console.error("Error al crear servicio:", error);
    return { error: "Error al crear el servicio: " + error.message, fieldErrors: {} };
  }

  revalidatePath("/dashboard/servicios");
  revalidatePath("/dashboard/agenda");
  return { error: null, fieldErrors: {}, success: Date.now() };
}

export async function actualizarServicio(id, prevState, formData) {
  const rawData = {
    nombre: formData.get("nombre"),
    duracion_minutos: formData.get("duracion_minutos"),
    precio: formData.get("precio"),
    descripcion: formData.get("descripcion"),
    color: formData.get("color"),
  };

  const resultado = servicioSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("servicios")
    .update(resultado.data)
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar servicio:", error);
    return { error: "Error al actualizar el servicio: " + error.message, fieldErrors: {} };
  }

  revalidatePath("/dashboard/servicios");
  revalidatePath("/dashboard/agenda");
  return { error: null, fieldErrors: {}, success: Date.now() };
}

export async function eliminarServicio(id) {
  const supabase = await createClient();

  const { error } = await supabase.from("servicios").delete().eq("id", id);

  if (error) {
    return { error: "Error al eliminar el servicio" };
  }

  revalidatePath("/dashboard/servicios");
  return { error: null };
}

export async function obtenerServiciosActivos() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("servicios")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  if (error) {
    return { data: [], error: "Error al obtener los servicios" };
  }

  return { data: data || [], error: null };
}

export async function toggleServicioActivo(id, activo) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("servicios")
    .update({ activo })
    .eq("id", id);

  if (error) {
    return { error: "Error al actualizar el servicio" };
  }

  revalidatePath("/dashboard/servicios");
  return { error: null };
}
