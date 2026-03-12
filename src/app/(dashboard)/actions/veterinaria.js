"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  mascotaSchema,
  vacunacionSchema,
  consultaMascotaSchema,
} from "@/lib/validations/rubro-veterinaria";

// ============================================
// MASCOTAS
// ============================================

export async function obtenerMascotas(tutorId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  let query = supabase
    .from("mascotas")
    .select("*, pacientes:tutor_id(nombre_completo)")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener mascotas" };
  return { data: data || [], error: null };
}

export async function crearMascota(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    tutor_id: formData.get("tutor_id") || null,
    nombre: formData.get("nombre"),
    especie: formData.get("especie"),
    raza: formData.get("raza"),
    peso_kg: formData.get("peso_kg") || null,
    fecha_nacimiento: formData.get("fecha_nacimiento") || null,
    sexo: formData.get("sexo") || null,
    color: formData.get("color"),
    microchip: formData.get("microchip"),
    notas: formData.get("notas"),
  };

  // Validar tutor_id por separado con mensaje amigable
  if (!rawData.tutor_id) {
    return { error: "Debes seleccionar un tutor", success: false };
  }

  const validado = mascotaSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  // Upload foto si viene
  let foto_url = null;
  const foto = formData.get("foto");
  if (foto && foto.size > 0) {
    const filePath = `${tenantId}/${Date.now()}_${foto.name}`;
    const { error: uploadError } = await supabase.storage
      .from("mascotas")
      .upload(filePath, foto);

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("mascotas")
        .getPublicUrl(filePath);
      foto_url = urlData?.publicUrl || null;
    }
  }

  const { error } = await supabase
    .from("mascotas")
    .insert({ ...validado.data, tenant_id: tenantId, foto_url });

  if (error) return { error: "Error al crear mascota", success: false };

  revalidatePath("/dashboard/mascotas");
  return { error: null, success: true };
}

export async function actualizarMascota(id, prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    tutor_id: formData.get("tutor_id") || null,
    nombre: formData.get("nombre"),
    especie: formData.get("especie"),
    raza: formData.get("raza"),
    peso_kg: formData.get("peso_kg") || null,
    fecha_nacimiento: formData.get("fecha_nacimiento") || null,
    sexo: formData.get("sexo") || null,
    color: formData.get("color"),
    microchip: formData.get("microchip"),
    notas: formData.get("notas"),
  };

  if (!rawData.tutor_id) {
    return { error: "Debes seleccionar un tutor", success: false };
  }

  const validado = mascotaSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const updateData = { ...validado.data };

  const foto = formData.get("foto");
  if (foto && foto.size > 0) {
    const filePath = `${tenantId}/${id}/${Date.now()}_${foto.name}`;
    const { error: uploadError } = await supabase.storage
      .from("mascotas")
      .upload(filePath, foto);

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("mascotas")
        .getPublicUrl(filePath);
      updateData.foto_url = urlData?.publicUrl || null;
    }
  }

  const { error } = await supabase
    .from("mascotas")
    .update(updateData)
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al actualizar mascota", success: false };

  revalidatePath("/dashboard/mascotas");
  return { error: null, success: true };
}

export async function obtenerMascotaDetalle(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: null, error: "Sin acceso" };

  const { data: mascota, error } = await supabase
    .from("mascotas")
    .select("*, pacientes:tutor_id(nombre_completo, telefono, email)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error) return { data: null, error: "Error al obtener mascota" };

  const [{ data: vacunas }, { data: consultas }, { data: desparasitaciones }] = await Promise.all([
    supabase
      .from("vacunaciones")
      .select("*")
      .eq("mascota_id", id)
      .eq("tenant_id", tenantId)
      .order("fecha_aplicacion", { ascending: false }),
    supabase
      .from("consultas_mascota")
      .select("*")
      .eq("mascota_id", id)
      .eq("tenant_id", tenantId)
      .order("fecha", { ascending: false }),
    supabase
      .from("desparasitaciones")
      .select("*")
      .eq("mascota_id", id)
      .eq("tenant_id", tenantId)
      .order("fecha_aplicacion", { ascending: false }),
  ]);

  return {
    data: { ...mascota, vacunas: vacunas || [], consultas: consultas || [], desparasitaciones: desparasitaciones || [] },
    error: null,
  };
}

// ============================================
// VACUNACIÓN
// ============================================

export async function registrarVacunacion(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    mascota_id: formData.get("mascota_id"),
    vacuna: formData.get("vacuna"),
    fecha_aplicacion: formData.get("fecha_aplicacion"),
    fecha_proxima: formData.get("fecha_proxima") || null,
    lote: formData.get("lote"),
    veterinario: formData.get("veterinario"),
    notas: formData.get("notas"),
  };

  const validado = vacunacionSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("vacunaciones")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al registrar vacunacion", success: false };

  revalidatePath("/dashboard/mascotas");
  revalidatePath("/dashboard/vacunacion");
  return { error: null, success: true };
}

export async function obtenerCartillaVacunacion(mascotaId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("vacunaciones")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("mascota_id", mascotaId)
    .order("fecha_aplicacion", { ascending: false });

  if (error) return { data: [], error: "Error al obtener cartilla" };
  return { data: data || [], error: null };
}

// ============================================
// CONSULTAS
// ============================================

export async function crearConsultaMascota(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    mascota_id: formData.get("mascota_id"),
    cita_id: formData.get("cita_id") || null,
    fecha: formData.get("fecha"),
    motivo: formData.get("motivo"),
    diagnostico: formData.get("diagnostico"),
    tratamiento: formData.get("tratamiento"),
    peso_kg: formData.get("peso_kg") || null,
    temperatura: formData.get("temperatura") || null,
    observaciones: formData.get("observaciones"),
  };

  const validado = consultaMascotaSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("consultas_mascota")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al crear consulta", success: false };

  revalidatePath("/dashboard/mascotas");
  revalidatePath("/dashboard/historial-mascota");
  return { error: null, success: true };
}

export async function obtenerHistorialMascota(mascotaId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("consultas_mascota")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("mascota_id", mascotaId)
    .order("fecha", { ascending: false });

  if (error) return { data: [], error: "Error al obtener historial" };
  return { data: data || [], error: null };
}

// ============================================
// DESPARASITACIONES
// ============================================

export async function obtenerDesparasitaciones(mascotaId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("desparasitaciones")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("mascota_id", mascotaId)
    .order("fecha_aplicacion", { ascending: false });

  if (error) return { data: [], error: "Error al obtener desparasitaciones" };
  return { data: data || [], error: null };
}

export async function registrarDesparasitacion(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    mascota_id: formData.get("mascota_id"),
    tipo: formData.get("tipo"),
    producto: formData.get("producto"),
    dosis: formData.get("dosis") || null,
    fecha_aplicacion: formData.get("fecha_aplicacion"),
    fecha_proxima: formData.get("fecha_proxima") || null,
    veterinario: formData.get("veterinario") || null,
    notas: formData.get("notas") || null,
  };

  if (!rawData.mascota_id || !rawData.tipo || !rawData.producto || !rawData.fecha_aplicacion) {
    return { error: "Completa los campos obligatorios", success: false };
  }

  const { error } = await supabase
    .from("desparasitaciones")
    .insert({ ...rawData, tenant_id: tenantId });

  if (error) return { error: "Error al registrar desparasitacion", success: false };

  revalidatePath("/dashboard/mascotas");
  return { error: null, success: true };
}

export async function eliminarDesparasitacion(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("desparasitaciones")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al eliminar" };
  revalidatePath("/dashboard/mascotas");
  return { error: null };
}
