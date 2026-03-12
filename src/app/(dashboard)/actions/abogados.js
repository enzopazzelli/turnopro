"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  expedienteSchema,
  vencimientoLegalSchema,
} from "@/lib/validations/rubro-abogados";

// ============================================
// EXPEDIENTES
// ============================================

export async function obtenerExpedientes(busqueda = "", estado = "") {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  let query = supabase
    .from("expedientes")
    .select("*, pacientes(nombre_completo)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (busqueda.trim()) {
    const termino = `%${busqueda.trim()}%`;
    query = query.or(
      `caratula.ilike.${termino},numero_expediente.ilike.${termino}`
    );
  }

  if (estado) {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener expedientes" };
  return { data: data || [], error: null };
}

export async function crearExpediente(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawPacienteId = formData.get("paciente_id");
  const rawData = {
    paciente_id: rawPacienteId || null,
    caratula: formData.get("caratula"),
    numero_expediente: formData.get("numero_expediente"),
    juzgado: formData.get("juzgado"),
    fuero: formData.get("fuero"),
    estado: formData.get("estado") || "activo",
    tipo: formData.get("tipo"),
    descripcion: formData.get("descripcion"),
    notas_privadas: formData.get("notas_privadas"),
    fecha_inicio: formData.get("fecha_inicio"),
  };

  if (!rawData.paciente_id) {
    return { error: "Debes seleccionar un cliente", success: false };
  }

  const validado = expedienteSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("expedientes")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al crear expediente", success: false };

  revalidatePath("/dashboard/expedientes");
  return { error: null, success: true };
}

export async function actualizarExpediente(id, prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawPacienteId = formData.get("paciente_id");
  const rawData = {
    paciente_id: rawPacienteId || null,
    caratula: formData.get("caratula"),
    numero_expediente: formData.get("numero_expediente"),
    juzgado: formData.get("juzgado"),
    fuero: formData.get("fuero"),
    estado: formData.get("estado") || "activo",
    tipo: formData.get("tipo"),
    descripcion: formData.get("descripcion"),
    notas_privadas: formData.get("notas_privadas"),
    fecha_inicio: formData.get("fecha_inicio"),
  };

  if (!rawData.paciente_id) {
    return { error: "Debes seleccionar un cliente", success: false };
  }

  const validado = expedienteSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("expedientes")
    .update(validado.data)
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al actualizar expediente", success: false };

  revalidatePath("/dashboard/expedientes");
  return { error: null, success: true };
}

export async function obtenerExpedienteDetalle(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: null, error: "Sin acceso" };

  const { data: expediente, error } = await supabase
    .from("expedientes")
    .select("*, pacientes(nombre_completo, email, telefono)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error) return { data: null, error: "Error al obtener expediente" };

  const [{ data: documentos }, { data: vencimientos }, { data: etapas }] = await Promise.all([
    supabase
      .from("documentos_legales")
      .select("*")
      .eq("expediente_id", id)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vencimientos_legales")
      .select("*")
      .eq("expediente_id", id)
      .eq("tenant_id", tenantId)
      .order("fecha_vencimiento", { ascending: true }),
    supabase
      .from("etapas_procesales")
      .select("*")
      .eq("expediente_id", id)
      .eq("tenant_id", tenantId)
      .order("fecha", { ascending: true }),
  ]);

  return {
    data: { ...expediente, documentos: documentos || [], vencimientos: vencimientos || [], etapas: etapas || [] },
    error: null,
  };
}

// ============================================
// DOCUMENTOS
// ============================================

export async function subirDocumento(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const archivo = formData.get("archivo");
  const expedienteId = formData.get("expediente_id");
  const nombre = formData.get("nombre") || archivo?.name;
  const notas = formData.get("notas");
  const pacienteId = formData.get("paciente_id") || null;

  if (!archivo || !archivo.size) {
    return { error: "Archivo requerido", success: false };
  }

  const filePath = `${tenantId}/${expedienteId}/${Date.now()}_${archivo.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(filePath, archivo);

  if (uploadError) return { error: "Error al subir archivo", success: false };

  const { data: urlData } = supabase.storage
    .from("documentos")
    .getPublicUrl(filePath);

  const { error } = await supabase.from("documentos_legales").insert({
    tenant_id: tenantId,
    expediente_id: expedienteId,
    paciente_id: pacienteId,
    nombre,
    archivo_url: urlData?.publicUrl || null,
    archivo_path: filePath,
    tipo_archivo: archivo.type,
    tamano_bytes: archivo.size,
    notas,
  });

  if (error) return { error: "Error al registrar documento", success: false };

  revalidatePath(`/dashboard/expedientes/${expedienteId}`);
  return { error: null, success: true };
}

export async function eliminarDocumento(id, expedienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  // Obtener path para borrar del storage
  const { data: doc } = await supabase
    .from("documentos_legales")
    .select("archivo_path")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (doc?.archivo_path) {
    await supabase.storage.from("documentos").remove([doc.archivo_path]);
  }

  const { error } = await supabase
    .from("documentos_legales")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al eliminar documento" };

  revalidatePath(`/dashboard/expedientes/${expedienteId}`);
  return { error: null };
}

// ============================================
// VENCIMIENTOS LEGALES
// ============================================

export async function obtenerVencimientosLegales(filtro = {}) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  let query = supabase
    .from("vencimientos_legales")
    .select("*, expedientes(caratula), pacientes(nombre_completo)")
    .eq("tenant_id", tenantId)
    .order("fecha_vencimiento", { ascending: true });

  if (filtro.completado !== undefined) {
    query = query.eq("completado", filtro.completado);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener vencimientos" };
  return { data: data || [], error: null };
}

export async function crearVencimientoLegal(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    expediente_id: formData.get("expediente_id") || null,
    paciente_id: formData.get("paciente_id") || null,
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    fecha_vencimiento: formData.get("fecha_vencimiento"),
    prioridad: formData.get("prioridad") || "media",
  };

  const validado = vencimientoLegalSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("vencimientos_legales")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al crear vencimiento", success: false };

  revalidatePath("/dashboard/vencimientos");
  return { error: null, success: true };
}

export async function completarVencimiento(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { data: actual } = await supabase
    .from("vencimientos_legales")
    .select("completado")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  const { error } = await supabase
    .from("vencimientos_legales")
    .update({ completado: !actual?.completado })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al actualizar vencimiento" };

  revalidatePath("/dashboard/vencimientos");
  return { error: null };
}

// ============================================
// ETAPAS PROCESALES
// ============================================

export async function crearEtapaProcesalAction(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    expediente_id: formData.get("expediente_id"),
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion") || null,
    fecha: formData.get("fecha"),
    estado: formData.get("estado") || "pendiente",
  };

  if (!rawData.expediente_id || !rawData.titulo || !rawData.fecha) {
    return { error: "Completa los campos obligatorios", success: false };
  }

  const { error } = await supabase
    .from("etapas_procesales")
    .insert({ ...rawData, tenant_id: tenantId });

  if (error) return { error: "Error al crear etapa", success: false };

  revalidatePath("/dashboard/expedientes");
  return { error: null, success: true };
}

export async function eliminarEtapaProcesal(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("etapas_procesales")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al eliminar etapa" };
  revalidatePath("/dashboard/expedientes");
  return { error: null };
}
