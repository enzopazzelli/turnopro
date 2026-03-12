"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  odontogramaSchema,
  planTratamientoSchema,
  etapaTratamientoSchema,
  historiaDentalSchema,
} from "@/lib/validations/rubro-odontologia";

// ============================================
// ODONTOGRAMA
// ============================================

export async function obtenerOdontograma(pacienteId, tipo = "adulto") {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: null, error: "Sin acceso" };

  const { data, error } = await supabase
    .from("odontogramas")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("paciente_id", pacienteId)
    .eq("tipo", tipo)
    .single();

  if (error && error.code === "PGRST116") {
    // No existe, crear uno vacío
    const { data: nuevo, error: errInsert } = await supabase
      .from("odontogramas")
      .insert({ tenant_id: tenantId, paciente_id: pacienteId, tipo, datos: {} })
      .select()
      .single();

    if (errInsert) return { data: null, error: "Error al crear odontograma" };
    return { data: nuevo, error: null };
  }

  if (error) return { data: null, error: "Error al obtener odontograma" };
  return { data, error: null };
}

export async function guardarOdontograma(odontogramaId, datos, notas) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("odontogramas")
    .update({ datos, notas })
    .eq("id", odontogramaId)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al guardar odontograma" };

  revalidatePath("/dashboard/odontograma");
  return { error: null };
}

// ============================================
// PLANES DE TRATAMIENTO
// ============================================

export async function obtenerPlanesTratamiento(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("planes_tratamiento")
    .select("*, etapas_tratamiento(*)")
    .eq("tenant_id", tenantId)
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: "Error al obtener planes" };
  return { data: data || [], error: null };
}

export async function crearPlanTratamiento(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    paciente_id: formData.get("paciente_id"),
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    costo_total: formData.get("costo_total") || 0,
    notas: formData.get("notas"),
  };

  const validado = planTratamientoSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { data: plan, error } = await supabase
    .from("planes_tratamiento")
    .insert({ ...validado.data, tenant_id: tenantId })
    .select()
    .single();

  if (error) return { error: "Error al crear plan", success: false };

  // Crear etapas si vienen en el form
  const etapasJson = formData.get("etapas");
  if (etapasJson) {
    try {
      const etapas = JSON.parse(etapasJson);
      if (etapas.length > 0) {
        const etapasInsert = etapas.map((e, i) => ({
          plan_id: plan.id,
          tenant_id: tenantId,
          orden: i,
          descripcion: e.descripcion,
          dientes: e.dientes || [],
          costo: e.costo || 0,
        }));
        await supabase.from("etapas_tratamiento").insert(etapasInsert);
      }
    } catch {
      return { error: "Error al procesar las etapas del tratamiento", success: false };
    }
  }

  revalidatePath("/dashboard/tratamientos");
  return { error: null, success: true };
}

export async function actualizarEstadoEtapa(etapaId, estado) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const updateData = { estado };
  if (estado === "completado") {
    updateData.fecha_completada = new Date().toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("etapas_tratamiento")
    .update(updateData)
    .eq("id", etapaId)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al actualizar etapa" };

  revalidatePath("/dashboard/tratamientos");
  return { error: null };
}

// ============================================
// HISTORIA CLÍNICA DENTAL
// ============================================

export async function obtenerHistoriaDental(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("historias_clinicas_dentales")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: false });

  if (error) return { data: [], error: "Error al obtener historia dental" };
  return { data: data || [], error: null };
}

export async function crearEntradaHistoriaDental(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const dientesRaw = formData.get("dientes_afectados") || "";
  const rawData = {
    paciente_id: formData.get("paciente_id"),
    cita_id: formData.get("cita_id") || null,
    fecha: formData.get("fecha"),
    diagnostico: formData.get("diagnostico"),
    procedimiento: formData.get("procedimiento"),
    dientes_afectados: dientesRaw ? dientesRaw.split(",").map((d) => d.trim()).filter(Boolean) : [],
    observaciones: formData.get("observaciones"),
  };

  const validado = historiaDentalSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("historias_clinicas_dentales")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al crear entrada", success: false };

  revalidatePath("/dashboard/historia-dental");
  return { error: null, success: true };
}
