"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pacienteSchema } from "@/lib/validations/pacientes";

export async function obtenerPacientes(busqueda = "", etiqueta = "") {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { data: [], error: "No se pudo identificar tu cuenta" };
  }

  let query = supabase
    .from("pacientes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("nombre_completo", { ascending: true });

  if (busqueda.trim()) {
    const termino = `%${busqueda.trim()}%`;
    query = query.or(
      `nombre_completo.ilike.${termino},email.ilike.${termino},telefono.ilike.${termino},dni.ilike.${termino}`
    );
  }

  if (etiqueta) {
    query = query.contains("etiquetas", [etiqueta]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener pacientes:", error);
    return { data: [], error: "Error al obtener los pacientes" };
  }

  return { data: data || [], error: null };
}

export async function crearPaciente(prevState, formData) {
  const rawData = {
    nombre_completo: formData.get("nombre_completo"),
    email: formData.get("email") || "",
    telefono: formData.get("telefono") || "",
    dni: formData.get("dni") || "",
    fecha_nacimiento: formData.get("fecha_nacimiento") || "",
    genero: formData.get("genero") || "no_especifica",
    direccion: formData.get("direccion") || "",
    obra_social: formData.get("obra_social") || "",
    numero_afiliado: formData.get("numero_afiliado") || "",
    etiquetas: JSON.parse(formData.get("etiquetas") || "[]"),
    notas: formData.get("notas") || "",
  };

  const resultado = pacienteSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return {
      error: "No se pudo identificar tu cuenta. Intenta cerrar sesion y volver a entrar.",
      fieldErrors: {},
    };
  }

  const insertData = {
    tenant_id: tenantId,
    ...resultado.data,
  };

  // Limpiar campos vacios — evitar "" en columnas que esperan NULL
  const camposOpcionales = ["email", "telefono", "dni", "fecha_nacimiento", "direccion", "obra_social", "numero_afiliado", "notas"];
  for (const campo of camposOpcionales) {
    if (!insertData[campo]) delete insertData[campo];
  }

  const { error } = await supabase.from("pacientes").insert(insertData);

  if (error) {
    console.error("Error al crear paciente:", error);
    return { error: "Error al crear el paciente: " + error.message, fieldErrors: {} };
  }

  revalidatePath("/dashboard/pacientes");
  return { error: null, fieldErrors: {}, success: Date.now() };
}

export async function actualizarPaciente(id, prevState, formData) {
  const rawData = {
    nombre_completo: formData.get("nombre_completo"),
    email: formData.get("email") || "",
    telefono: formData.get("telefono") || "",
    dni: formData.get("dni") || "",
    fecha_nacimiento: formData.get("fecha_nacimiento") || "",
    genero: formData.get("genero") || "no_especifica",
    direccion: formData.get("direccion") || "",
    obra_social: formData.get("obra_social") || "",
    numero_afiliado: formData.get("numero_afiliado") || "",
    etiquetas: JSON.parse(formData.get("etiquetas") || "[]"),
    notas: formData.get("notas") || "",
  };

  const resultado = pacienteSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const updateData = { ...resultado.data };
  // Limpiar campos vacios — convertir "" a null
  const camposOpcionales = ["email", "telefono", "dni", "fecha_nacimiento", "direccion", "obra_social", "numero_afiliado", "notas"];
  for (const campo of camposOpcionales) {
    if (!updateData[campo]) updateData[campo] = null;
  }

  const { error } = await supabase
    .from("pacientes")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar paciente:", error);
    return { error: "Error al actualizar el paciente: " + error.message, fieldErrors: {} };
  }

  revalidatePath("/dashboard/pacientes");
  revalidatePath(`/dashboard/pacientes/${id}`);
  return { error: null, fieldErrors: {}, success: Date.now() };
}

export async function eliminarPaciente(id) {
  const supabase = await createClient();

  // Soft delete: marcar como inactivo
  const { error } = await supabase
    .from("pacientes")
    .update({ activo: false })
    .eq("id", id);

  if (error) {
    console.error("Error al eliminar paciente:", error);
    return { error: "Error al eliminar el paciente" };
  }

  revalidatePath("/dashboard/pacientes");
  return { error: null };
}

export async function obtenerPacienteConHistorial(id) {
  const supabase = await createClient();

  const { data: paciente, error: pacienteError } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single();

  if (pacienteError || !paciente) {
    return { paciente: null, citas: [], error: "Paciente no encontrado" };
  }

  const { data: citas, error: citasError } = await supabase
    .from("citas")
    .select("*, servicios(nombre, color)")
    .eq("paciente_id", id)
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: false });

  if (citasError) {
    console.error("Error al obtener historial:", citasError);
  }

  return { paciente, citas: citas || [], error: null };
}

export async function obtenerPacientesRecientes() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) return { data: [] };

  const { data } = await supabase
    .from("pacientes")
    .select("id, nombre_completo, telefono, email")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("updated_at", { ascending: false })
    .limit(8);

  return { data: data || [] };
}

export async function buscarPacientesParaCita(termino) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) return { data: [] };

  const { data } = await supabase
    .from("pacientes")
    .select("id, nombre_completo, telefono, email")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .ilike("nombre_completo", `%${termino}%`)
    .limit(10);

  return { data: data || [] };
}

// ============================================
// IMPORTAR PACIENTES DESDE CSV
// ============================================

export async function importarPacientesCSV(pacientes) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  let importados = 0;
  let omitidos = 0;

  // Insertar en lotes de 50
  const lote = [];
  for (const p of pacientes) {
    if (!p.nombre_completo?.trim()) {
      omitidos++;
      continue;
    }

    const registro = {
      tenant_id: tenantId,
      nombre_completo: p.nombre_completo.trim(),
    };

    if (p.telefono) registro.telefono = p.telefono.trim();
    if (p.email) registro.email = p.email.trim();
    if (p.dni) registro.dni = p.dni.trim();
    if (p.obra_social) registro.obra_social = p.obra_social.trim();
    if (p.direccion) registro.direccion = p.direccion.trim();
    if (p.notas) registro.notas = p.notas.trim();
    if (p.fecha_nacimiento) {
      // Validar formato de fecha
      const fecha = p.fecha_nacimiento.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        registro.fecha_nacimiento = fecha;
      }
    }

    lote.push(registro);
  }

  // Insertar en bloques
  const TAMANO_LOTE = 50;
  for (let i = 0; i < lote.length; i += TAMANO_LOTE) {
    const bloque = lote.slice(i, i + TAMANO_LOTE);
    const { error, data } = await supabase.from("pacientes").insert(bloque).select("id");
    if (error) {
      console.error("Error al importar lote:", error);
      omitidos += bloque.length;
    } else {
      importados += (data?.length || bloque.length);
    }
  }

  revalidatePath("/dashboard/pacientes");
  return { error: null, importados, omitidos };
}

// ============================================
// ARCHIVOS DE PACIENTES
// ============================================

export async function obtenerArchivosPaciente(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("archivos_pacientes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: "Error al obtener archivos" };
  return { data: data || [], error: null };
}

export async function subirArchivoPaciente(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const archivo = formData.get("archivo");
  const pacienteId = formData.get("paciente_id");
  const nombre = formData.get("nombre")?.trim() || archivo?.name;
  const categoria = formData.get("categoria") || "otros";
  const notas = formData.get("notas")?.trim() || null;

  if (!archivo || !archivo.size) {
    return { error: "Archivo requerido", success: false };
  }

  if (archivo.size > 10 * 1024 * 1024) {
    return { error: "El archivo no puede superar los 10 MB", success: false };
  }

  const filePath = `${tenantId}/pacientes/${pacienteId}/${Date.now()}_${archivo.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(filePath, archivo);

  if (uploadError) {
    console.error("Error upload:", uploadError);
    return { error: "Error al subir el archivo", success: false };
  }

  const { data: urlData } = supabase.storage
    .from("documentos")
    .getPublicUrl(filePath);

  const { error } = await supabase.from("archivos_pacientes").insert({
    tenant_id: tenantId,
    paciente_id: pacienteId,
    nombre,
    archivo_url: urlData?.publicUrl || null,
    archivo_path: filePath,
    tipo_archivo: archivo.type,
    tamano_bytes: archivo.size,
    categoria,
    notas,
  });

  if (error) {
    console.error("Error al registrar archivo:", error);
    return { error: "Error al registrar el archivo", success: false };
  }

  revalidatePath(`/dashboard/pacientes/${pacienteId}`);
  return { error: null, success: true };
}

export async function eliminarArchivoPaciente(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { data: archivo } = await supabase
    .from("archivos_pacientes")
    .select("archivo_path, paciente_id")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (!archivo) return { error: "Archivo no encontrado" };

  if (archivo.archivo_path) {
    await supabase.storage.from("documentos").remove([archivo.archivo_path]);
  }

  const { error } = await supabase
    .from("archivos_pacientes")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al eliminar el archivo" };

  revalidatePath(`/dashboard/pacientes/${archivo.paciente_id}`);
  return { error: null };
}
