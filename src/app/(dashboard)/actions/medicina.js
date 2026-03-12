"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  historiaClinicaSchema,
  signosVitalesSchema,
  recetaSchema,
} from "@/lib/validations/rubro-medicina";

// ============================================
// HISTORIA CLÍNICA
// ============================================

export async function obtenerAlertasMedicas(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId || !pacienteId) return { alergias: [], medicacion: [] };

  const { data } = await supabase
    .from("historias_clinicas")
    .select("alergias, medicacion_cronica")
    .eq("tenant_id", tenantId)
    .eq("paciente_id", pacienteId);

  const alergias = [...new Set((data || []).flatMap((e) => e.alergias || []))];
  const medicacion = [...new Set((data || []).flatMap((e) => e.medicacion_cronica || []))];
  return { alergias, medicacion };
}

export async function obtenerHistoriaClinica(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("historias_clinicas")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: false });

  if (error) return { data: [], error: "Error al obtener historia clinica" };
  return { data: data || [], error: null };
}

export async function crearEntradaHistoria(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const alergiasRaw = formData.get("alergias") || "";
  const medicacionRaw = formData.get("medicacion_cronica") || "";

  const rawData = {
    paciente_id: formData.get("paciente_id"),
    cita_id: formData.get("cita_id") || null,
    fecha: formData.get("fecha"),
    motivo_consulta: formData.get("motivo_consulta"),
    diagnostico: formData.get("diagnostico"),
    indicaciones: formData.get("indicaciones"),
    antecedentes: formData.get("antecedentes"),
    alergias: alergiasRaw ? alergiasRaw.split(",").map((a) => a.trim()).filter(Boolean) : [],
    medicacion_cronica: medicacionRaw ? medicacionRaw.split(",").map((m) => m.trim()).filter(Boolean) : [],
    observaciones: formData.get("observaciones"),
  };

  const validado = historiaClinicaSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("historias_clinicas")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al crear entrada", success: false };

  revalidatePath("/dashboard/historia-clinica");
  return { error: null, success: true };
}

// ============================================
// SIGNOS VITALES
// ============================================

export async function obtenerSignosVitales(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("signos_vitales")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: true });

  if (error) return { data: [], error: "Error al obtener signos vitales" };
  return { data: data || [], error: null };
}

export async function registrarSignosVitales(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    paciente_id: formData.get("paciente_id"),
    fecha: formData.get("fecha"),
    peso_kg: formData.get("peso_kg") || null,
    altura_cm: formData.get("altura_cm") || null,
    presion_sistolica: formData.get("presion_sistolica") || null,
    presion_diastolica: formData.get("presion_diastolica") || null,
    temperatura: formData.get("temperatura") || null,
    frecuencia_cardiaca: formData.get("frecuencia_cardiaca") || null,
    saturacion_o2: formData.get("saturacion_o2") || null,
    notas: formData.get("notas"),
  };

  const validado = signosVitalesSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("signos_vitales")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al registrar signos vitales", success: false };

  revalidatePath("/dashboard/signos-vitales");
  return { error: null, success: true };
}

// ============================================
// RECETAS
// ============================================

export async function obtenerRecetas(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  let query = supabase
    .from("recetas")
    .select("*, pacientes(nombre_completo)")
    .eq("tenant_id", tenantId)
    .order("fecha", { ascending: false });

  if (pacienteId) {
    query = query.eq("paciente_id", pacienteId);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener recetas" };
  return { data: data || [], error: null };
}

export async function crearReceta(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  let medicamentos = [];
  try {
    medicamentos = JSON.parse(formData.get("medicamentos") || "[]");
  } catch {
    return { error: "Medicamentos invalidos", success: false };
  }

  const rawData = {
    paciente_id: formData.get("paciente_id"),
    fecha: formData.get("fecha"),
    diagnostico: formData.get("diagnostico"),
    medicamentos,
    indicaciones_generales: formData.get("indicaciones_generales"),
  };

  const validado = recetaSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("recetas")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al crear receta", success: false };

  revalidatePath("/dashboard/recetas");
  return { error: null, success: true };
}

export async function obtenerRecetaPDF(recetaId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: null, error: "Sin acceso" };

  const { data: receta, error } = await supabase
    .from("recetas")
    .select("*, pacientes(nombre_completo, dni, obra_social)")
    .eq("id", recetaId)
    .eq("tenant_id", tenantId)
    .single();

  if (error) return { data: null, error: "Error al obtener receta" };

  // Obtener datos del profesional
  const { data: profesional } = await supabase
    .from("professionals")
    .select("*, users(nombre, apellido)")
    .eq("tenant_id", tenantId)
    .single();

  return {
    data: { receta, profesional },
    error: null,
  };
}
