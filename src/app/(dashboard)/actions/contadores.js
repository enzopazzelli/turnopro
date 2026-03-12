"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  vencimientoFiscalSchema,
  checklistSchema,
  checklistItemSchema,
} from "@/lib/validations/rubro-contadores";

// ============================================
// VENCIMIENTOS FISCALES
// ============================================

export async function obtenerVencimientosFiscales(filtro = {}) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  let query = supabase
    .from("vencimientos_fiscales")
    .select("*, pacientes(nombre_completo)")
    .eq("tenant_id", tenantId)
    .order("fecha_vencimiento", { ascending: true });

  if (filtro.obligacion) {
    query = query.eq("obligacion", filtro.obligacion);
  }
  if (filtro.completado !== undefined) {
    query = query.eq("completado", filtro.completado);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener vencimientos" };
  return { data: data || [], error: null };
}

export async function crearVencimientoFiscal(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    paciente_id: formData.get("paciente_id") || null,
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    obligacion: formData.get("obligacion"),
    fecha_vencimiento: formData.get("fecha_vencimiento"),
    prioridad: formData.get("prioridad") || "media",
    recurrente: formData.get("recurrente") === "true",
    recurrencia: formData.get("recurrencia") || null,
  };

  const validado = vencimientoFiscalSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("vencimientos_fiscales")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al crear vencimiento", success: false };

  revalidatePath("/dashboard/vencimientos-fiscales");
  return { error: null, success: true };
}

export async function completarVencimientoFiscal(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { data: actual } = await supabase
    .from("vencimientos_fiscales")
    .select("completado")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  const { error } = await supabase
    .from("vencimientos_fiscales")
    .update({ completado: !actual?.completado })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al actualizar vencimiento" };

  revalidatePath("/dashboard/vencimientos-fiscales");
  return { error: null };
}

export async function cargarVencimientosAFIP(mes, anio, terminacionCuit) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { generarVencimientosMes } = await import("@/config/calendario-fiscal");
  const vencimientos = generarVencimientosMes(mes, anio, terminacionCuit);

  if (vencimientos.length === 0) return { error: "No hay vencimientos para este periodo" };

  const registros = vencimientos.map((v) => ({ ...v, tenant_id: tenantId }));
  const { error } = await supabase.from("vencimientos_fiscales").insert(registros);

  if (error) return { error: "Error al cargar vencimientos: " + error.message };

  revalidatePath("/dashboard/vencimientos-fiscales");
  return { error: null, cantidad: registros.length };
}

// ============================================
// CHECKLISTS
// ============================================

export async function obtenerChecklists(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  let query = supabase
    .from("checklists_documentacion")
    .select("*, checklist_items(*), pacientes(nombre_completo)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (pacienteId) {
    query = query.eq("paciente_id", pacienteId);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener checklists" };
  return { data: data || [], error: null };
}

export async function crearChecklist(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  let items = [];
  try {
    items = JSON.parse(formData.get("items") || "[]");
  } catch {
    return { error: "Error al procesar los items del checklist", success: false };
  }

  const rawData = {
    paciente_id: formData.get("paciente_id") || null,
    titulo: formData.get("titulo"),
    periodo: formData.get("periodo"),
    notas: formData.get("notas"),
    items,
  };

  const validado = checklistSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { items: validItems, ...checklistData } = validado.data;

  const { data: checklist, error } = await supabase
    .from("checklists_documentacion")
    .insert({ ...checklistData, tenant_id: tenantId })
    .select()
    .single();

  if (error) return { error: "Error al crear checklist", success: false };

  // Crear items si hay
  if (validItems && validItems.length > 0) {
    const itemsInsert = validItems.map((item, i) => ({
      checklist_id: checklist.id,
      tenant_id: tenantId,
      descripcion: item.descripcion,
      orden: i,
    }));
    await supabase.from("checklist_items").insert(itemsInsert);
  }

  revalidatePath("/dashboard/checklists");
  return { error: null, success: true };
}

export async function toggleChecklistItem(itemId, completado) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const updateData = {
    completado,
    fecha_completado: completado ? new Date().toISOString().split("T")[0] : null,
  };

  const { error } = await supabase
    .from("checklist_items")
    .update(updateData)
    .eq("id", itemId)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al actualizar item" };

  revalidatePath("/dashboard/checklists");
  return { error: null };
}

export async function agregarChecklistItem(checklistId, prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    checklist_id: checklistId,
    descripcion: formData.get("descripcion"),
    orden: Number(formData.get("orden")) || 0,
  };

  const validado = checklistItemSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("checklist_items")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al agregar item", success: false };

  revalidatePath("/dashboard/checklists");
  return { error: null, success: true };
}

export async function eliminarChecklistItem(itemId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("checklist_items")
    .delete()
    .eq("id", itemId)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al eliminar item" };

  revalidatePath("/dashboard/checklists");
  return { error: null };
}
