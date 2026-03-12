"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recetaSchema } from "@/lib/validations/recetas";

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
  const professionalId = (await supabase.rpc("get_professional_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  let medicamentos = [];
  try {
    medicamentos = JSON.parse(formData.get("medicamentos") || "[]");
  } catch {
    return { error: "Medicamentos invalidos", success: false };
  }

  const rawData = {
    paciente_id: formData.get("paciente_id") || "",
    fecha: formData.get("fecha") || "",
    tipo: formData.get("tipo") || "receta_medicamento",
    diagnostico: formData.get("diagnostico") || "",
    medicamentos,
    contenido: formData.get("contenido") || "",
    indicaciones_generales: formData.get("indicaciones_generales") || "",
  };

  const validado = recetaSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  // Para receta_medicamento, requerir al menos 1 medicamento
  if (validado.data.tipo === "receta_medicamento" && validado.data.medicamentos.length === 0) {
    return { error: "Agrega al menos un medicamento", success: false };
  }

  const insertData = { ...validado.data, tenant_id: tenantId };
  if (professionalId) insertData.professional_id = professionalId;
  if (!insertData.contenido) delete insertData.contenido;
  if (!insertData.diagnostico) delete insertData.diagnostico;
  if (!insertData.indicaciones_generales) delete insertData.indicaciones_generales;

  const { error } = await supabase.from("recetas").insert(insertData);

  if (error) {
    console.error("Error al crear receta:", error);
    return { error: "Error al crear receta: " + error.message, success: false };
  }

  revalidatePath("/dashboard/recetas");
  return { error: null, success: true };
}

export async function obtenerDatosPDF(recetaId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: null, error: "Sin acceso" };

  const { data: receta, error } = await supabase
    .from("recetas")
    .select("*, pacientes(nombre_completo, dni, obra_social, telefono)")
    .eq("id", recetaId)
    .eq("tenant_id", tenantId)
    .single();

  if (error) return { data: null, error: "Error al obtener receta" };

  const { data: profesional } = await supabase
    .from("professionals")
    .select("*, users(nombre_completo)")
    .eq("tenant_id", tenantId)
    .single();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("nombre, rubro, configuracion")
    .eq("id", tenantId)
    .single();

  return {
    data: { receta, profesional, tenant },
    error: null,
  };
}

export async function enviarRecetaEmail(recetaId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { data: receta, error: recetaError } = await supabase
    .from("recetas")
    .select("*, pacientes(nombre_completo, dni, obra_social, email, telefono)")
    .eq("id", recetaId)
    .eq("tenant_id", tenantId)
    .single();

  if (recetaError || !receta) return { error: "Receta no encontrada" };

  const paciente = receta.pacientes;
  if (!paciente?.email) return { error: "El paciente no tiene email registrado" };

  const { data: profesional } = await supabase
    .from("professionals")
    .select("*, users(nombre_completo)")
    .eq("tenant_id", tenantId)
    .single();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("nombre, configuracion")
    .eq("id", tenantId)
    .single();

  const nombreProfesional = profesional?.users?.nombre_completo || "Profesional";
  const nombreConsultorio = tenant?.configuracion?.consultorio?.nombre || tenant?.nombre || "Consultorio";
  const matricula = profesional?.numero_matricula ? `Mat. ${profesional.numero_matricula}` : "";

  const TIPO_TITULOS = {
    receta_medicamento: "Receta Medica",
    indicacion_medica: "Indicacion Medica",
    orden_estudio: "Orden de Estudios",
    derivacion: "Derivacion",
    certificado: "Certificado Medico",
    carta_documento: "Carta Documento",
    dictamen: "Dictamen",
    informe_legal: "Informe Legal",
    poder: "Poder",
    certificacion_firma: "Certificacion de Firma",
    certificacion_ingresos: "Certificacion de Ingresos",
    informe_contable: "Informe Contable",
    balance: "Balance",
    dictamen_contador: "Dictamen de Contador",
    nota_requerimiento: "Nota / Requerimiento",
  };
  const titulo = TIPO_TITULOS[receta.tipo] || "Documento";

  let cuerpoPrincipal = "";
  if (receta.tipo === "receta_medicamento" && receta.medicamentos?.length > 0) {
    const items = receta.medicamentos.map((m) => {
      const partes = [m.nombre];
      if (m.dosis) partes.push(`Dosis: ${m.dosis}`);
      if (m.frecuencia) partes.push(`Frecuencia: ${m.frecuencia}`);
      if (m.duracion) partes.push(`Duracion: ${m.duracion}`);
      if (m.indicaciones) partes.push(`Indicaciones: ${m.indicaciones}`);
      return `<li style="margin-bottom:8px"><strong>${partes[0]}</strong>${partes.length > 1 ? "<br>" + partes.slice(1).join(" — ") : ""}</li>`;
    }).join("");
    cuerpoPrincipal = `<ul style="padding-left:20px">${items}</ul>`;
  } else if (receta.contenido) {
    cuerpoPrincipal = `<p style="white-space:pre-line">${receta.contenido}</p>`;
  }

  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
      <div style="background:#f8fafc;padding:20px 24px;border-bottom:3px solid #3b82f6">
        <h2 style="margin:0;font-size:20px">${nombreConsultorio}</h2>
        <p style="margin:4px 0 0;color:#64748b;font-size:14px">${nombreProfesional}${matricula ? " \u2014 " + matricula : ""}</p>
      </div>
      <div style="padding:24px">
        <h3 style="margin:0 0 16px;font-size:18px;color:#3b82f6">${titulo}</h3>
        <p style="margin:0 0 8px"><strong>Paciente:</strong> ${paciente.nombre_completo}</p>
        ${receta.diagnostico ? `<p style="margin:0 0 8px"><strong>Diagnostico / Asunto:</strong> ${receta.diagnostico}</p>` : ""}
        <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px">${cuerpoPrincipal}</div>
        ${receta.indicaciones_generales ? `<p style="margin:8px 0"><strong>Indicaciones:</strong> ${receta.indicaciones_generales}</p>` : ""}
        <p style="margin:16px 0 0;font-size:13px;color:#94a3b8">Este documento fue generado desde TurnoPro.</p>
      </div>
    </div>
  `;

  const { enviarEmail } = await import("@/lib/notificaciones/email");
  const resultado = await enviarEmail({
    destinatario: paciente.email,
    asunto: `${titulo} \u2014 ${nombreConsultorio}`,
    contenido: htmlContent,
  });

  if (!resultado.success) {
    return { error: resultado.error || "Error al enviar el email" };
  }
  return { error: null };
}

export async function eliminarReceta(recetaId) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("recetas")
    .delete()
    .eq("id", recetaId);

  if (error) return { error: "Error al eliminar receta" };

  revalidatePath("/dashboard/recetas");
  return { error: null };
}

export async function subirFirma(formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  const professionalId = (await supabase.rpc("get_professional_id_for_user")).data;
  if (!tenantId || !professionalId) return { error: "Sin acceso" };

  const archivo = formData.get("firma");
  if (!archivo || archivo.size === 0) return { error: "No se selecciono archivo" };

  const ext = archivo.name.split(".").pop();
  const path = `${tenantId}/${professionalId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("firmas")
    .upload(path, archivo, { upsert: true });

  if (uploadError) {
    console.error("Error al subir firma:", uploadError);
    return { error: "Error al subir la firma" };
  }

  const { data: urlData } = supabase.storage.from("firmas").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("professionals")
    .update({ firma_url: urlData.publicUrl })
    .eq("id", professionalId);

  if (updateError) return { error: "Error al guardar la firma" };

  revalidatePath("/dashboard/configuracion");
  return { error: null, url: urlData.publicUrl };
}
