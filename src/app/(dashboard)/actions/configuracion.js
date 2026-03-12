"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function obtenerConfiguracion() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { data: null, error: "No se pudo identificar el tenant" };
  }

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("configuracion")
    .eq("id", tenantId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: tenant?.configuracion || {}, error: null };
}

export async function guardarConfiguracionNotificaciones(configNotificaciones) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar el tenant" };
  }

  // Leer configuracion actual
  const { data: tenant } = await supabase
    .from("tenants")
    .select("configuracion")
    .eq("id", tenantId)
    .single();

  const configActual = tenant?.configuracion || {};

  // Mergear solo las settings de notificaciones
  const nuevaConfig = {
    ...configActual,
    notificaciones: configNotificaciones,
  };

  const { error } = await supabase
    .from("tenants")
    .update({ configuracion: nuevaConfig })
    .eq("id", tenantId);

  if (error) {
    console.error("Error al guardar configuracion:", error);
    return { error: "Error al guardar la configuracion" };
  }

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}

export async function guardarConfiguracionFacturacion(configFacturacion) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar el tenant" };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("configuracion")
    .eq("id", tenantId)
    .single();

  const configActual = tenant?.configuracion || {};

  const nuevaConfig = {
    ...configActual,
    facturacion: configFacturacion,
  };

  const { error } = await supabase
    .from("tenants")
    .update({ configuracion: nuevaConfig })
    .eq("id", tenantId);

  if (error) {
    console.error("Error al guardar configuracion de facturacion:", error);
    return { error: "Error al guardar la configuracion" };
  }

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}

export async function subirImagenPerfil(formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar el tenant" };
  }

  const archivo = formData.get("archivo");
  const tipo = formData.get("tipo"); // "avatar" o "hero"

  if (!archivo || archivo.size === 0) {
    return { error: "No se selecciono ningun archivo" };
  }

  if (archivo.size > 5 * 1024 * 1024) {
    return { error: "El archivo no puede superar los 5MB" };
  }

  const ext = archivo.name.split(".").pop().toLowerCase();
  const filePath = `${tenantId}/${tipo}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("perfiles")
    .upload(filePath, archivo, { upsert: true });

  if (uploadError) {
    console.error("Error al subir imagen:", uploadError);
    return { error: "Error al subir la imagen" };
  }

  const { data: urlData } = supabase.storage
    .from("perfiles")
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  if (tipo === "avatar") {
    // Guardar en users.avatar_url
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("tenant_id", tenantId)
      .eq("rol", "profesional");

    if (updateError) {
      return { error: "Error al actualizar el avatar" };
    }
  } else if (tipo === "hero") {
    // Guardar en tenant.configuracion.pagina_publica.hero_url
    const { data: tenant } = await supabase
      .from("tenants")
      .select("configuracion")
      .eq("id", tenantId)
      .single();

    const configActual = tenant?.configuracion || {};
    const nuevaConfig = {
      ...configActual,
      pagina_publica: {
        ...(configActual.pagina_publica || {}),
        hero_url: publicUrl,
      },
    };

    const { error: updateError } = await supabase
      .from("tenants")
      .update({ configuracion: nuevaConfig })
      .eq("id", tenantId);

    if (updateError) {
      return { error: "Error al guardar la imagen de portada" };
    }
  }

  revalidatePath("/dashboard/configuracion");
  return { data: publicUrl, error: null };
}

export async function guardarConfiguracionAgenda(configAgenda) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar el tenant" };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("configuracion")
    .eq("id", tenantId)
    .single();

  const configActual = tenant?.configuracion || {};

  const nuevaConfig = {
    ...configActual,
    agenda: configAgenda,
  };

  const { error } = await supabase
    .from("tenants")
    .update({ configuracion: nuevaConfig })
    .eq("id", tenantId);

  if (error) {
    console.error("Error al guardar configuracion de agenda:", error);
    return { error: "Error al guardar la configuracion" };
  }

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}

export async function guardarConfiguracionConsultorio(configConsultorio) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar el tenant" };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("configuracion")
    .eq("id", tenantId)
    .single();

  const configActual = tenant?.configuracion || {};

  const nuevaConfig = {
    ...configActual,
    consultorio: configConsultorio,
  };

  const { error } = await supabase
    .from("tenants")
    .update({ configuracion: nuevaConfig })
    .eq("id", tenantId);

  if (error) {
    console.error("Error al guardar configuracion del consultorio:", error);
    return { error: "Error al guardar la configuracion" };
  }

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}

export async function subirLogoConsultorio(formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar el tenant" };
  }

  const archivo = formData.get("archivo");
  if (!archivo || archivo.size === 0) {
    return { error: "No se selecciono ningun archivo" };
  }

  if (archivo.size > 2 * 1024 * 1024) {
    return { error: "El archivo no puede superar los 2MB" };
  }

  const ext = archivo.name.split(".").pop().toLowerCase();
  const filePath = `${tenantId}/logo_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("perfiles")
    .upload(filePath, archivo, { upsert: true });

  if (uploadError) {
    console.error("Error al subir logo:", uploadError);
    return { error: "Error al subir el logo" };
  }

  const { data: urlData } = supabase.storage
    .from("perfiles")
    .getPublicUrl(filePath);

  const publicUrl = urlData.publicUrl;

  // Also update tenants.logo_url for public page
  await supabase
    .from("tenants")
    .update({ logo_url: publicUrl })
    .eq("id", tenantId);

  revalidatePath("/dashboard/configuracion");
  return { url: publicUrl, error: null };
}

export async function guardarConfiguracionPaginaPublica(configPaginaPublica) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar el tenant" };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("configuracion")
    .eq("id", tenantId)
    .single();

  const configActual = tenant?.configuracion || {};

  const nuevaConfig = {
    ...configActual,
    pagina_publica: configPaginaPublica,
  };

  const { error } = await supabase
    .from("tenants")
    .update({ configuracion: nuevaConfig })
    .eq("id", tenantId);

  if (error) {
    console.error("Error al guardar configuracion de pagina publica:", error);
    return { error: "Error al guardar la configuracion" };
  }

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}

// ============================================
// ENLACES PROFESIONALES (colegios, asociaciones)
// ============================================

export async function obtenerEnlacesProfesionales() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("enlaces_profesionales")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { data: [], error: "Error al obtener enlaces" };
  return { data: data || [], error: null };
}

export async function crearEnlaceProfesional(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const titulo = (formData.get("titulo") || "").trim();
  const url = (formData.get("url") || "").trim();
  const descripcion = (formData.get("descripcion") || "").trim();
  const categoria = formData.get("categoria") || "general";

  if (!titulo) return { error: "El titulo es requerido", success: false };
  if (!url) return { error: "La URL es requerida", success: false };

  const urlNormalizada = url.startsWith("http") ? url : `https://${url}`;

  const { error } = await supabase
    .from("enlaces_profesionales")
    .insert({ tenant_id: tenantId, titulo, url: urlNormalizada, descripcion: descripcion || null, categoria });

  if (error) return { error: "Error al guardar el enlace", success: false };

  revalidatePath("/dashboard/configuracion");
  return { error: null, success: true };
}

export async function eliminarEnlaceProfesional(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("enlaces_profesionales")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al eliminar el enlace" };

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}

export async function guardarBranding(branding) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "No se pudo identificar el tenant" };

  const { data: tenant } = await supabase
    .from("tenants")
    .select("configuracion")
    .eq("id", tenantId)
    .single();

  const configActual = tenant?.configuracion || {};
  const nuevaConfig = { ...configActual, branding };

  const { error } = await supabase
    .from("tenants")
    .update({ configuracion: nuevaConfig })
    .eq("id", tenantId);

  if (error) return { error: "Error al guardar el branding" };
  revalidatePath("/dashboard/configuracion");
  return { error: null };
}

export async function generarBackupConfiguracion() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: null, error: "Sin acceso" };

  const { data: tenant } = await supabase
    .from("tenants")
    .select("nombre, slug, rubro, configuracion, created_at")
    .eq("id", tenantId)
    .single();

  if (!tenant) return { data: null, error: "Error al obtener datos" };

  return {
    data: {
      exportado_en: new Date().toISOString(),
      nombre: tenant.nombre,
      slug: tenant.slug,
      rubro: tenant.rubro,
      configuracion: tenant.configuracion || {},
    },
    error: null,
  };
}

export async function guardarConfiguracionPlantillas(plantillas) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar el tenant" };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("configuracion")
    .eq("id", tenantId)
    .single();

  const configActual = tenant?.configuracion || {};

  const nuevaConfig = {
    ...configActual,
    plantillas,
  };

  const { error } = await supabase
    .from("tenants")
    .update({ configuracion: nuevaConfig })
    .eq("id", tenantId);

  if (error) {
    console.error("Error al guardar plantillas:", error);
    return { error: "Error al guardar las plantillas" };
  }

  revalidatePath("/dashboard/configuracion");
  return { error: null };
}
