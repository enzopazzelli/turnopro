"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { citaSchema } from "@/lib/validations/agenda";
import { notificar } from "@/lib/notificaciones/servicio";
import { generarHistoriaInicial } from "@/lib/historia-inicial";
import { addDays, addWeeks, addMonths, isBefore, parseISO } from "date-fns";

export async function obtenerCitas(fechaInicio, fechaFin, { professionalId: filterProfId } = {}) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { data: [], error: "Sin acceso" };
  }

  let query = supabase
    .from("citas")
    .select("*, servicios(nombre, color, duracion_minutos, precio)")
    .eq("tenant_id", tenantId)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  // Filtrar por profesional si se especifica
  if (filterProfId) {
    query = query.eq("professional_id", filterProfId);
  }

  if (fechaInicio) {
    query = query.gte("fecha", fechaInicio);
  }
  if (fechaFin) {
    query = query.lte("fecha", fechaFin);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: "Error al obtener las citas" };
  }

  return { data: data || [], error: null };
}

// Helper para obtener datos del contexto de notificacion
async function obtenerContextoNotificacion(supabase, tenantId, servicioId, professionalId = null) {
  let servicioNombre = "Consulta";
  if (servicioId) {
    const { data: serv } = await supabase
      .from("servicios")
      .select("nombre")
      .eq("id", servicioId)
      .single();
    if (serv) servicioNombre = serv.nombre;
  }

  let usuario = null;
  if (professionalId) {
    // Buscar por professional_id especifico
    const { data: prof } = await supabase
      .from("professionals")
      .select("user_id")
      .eq("id", professionalId)
      .single();
    if (prof) {
      const { data: u } = await supabase
        .from("users")
        .select("id, nombre_completo")
        .eq("id", prof.user_id)
        .single();
      usuario = u;
    }
  }
  if (!usuario) {
    // Fallback: primer profesional del tenant
    const { data: u } = await supabase
      .from("users")
      .select("id, nombre_completo")
      .eq("tenant_id", tenantId)
      .eq("rol", "profesional")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    usuario = u;
  }

  const { data: tenantData } = await supabase
    .from("tenants")
    .select("nombre")
    .eq("id", tenantId)
    .single();

  return { servicioNombre, usuario, tenantData };
}

export async function crearCita(prevState, formData) {
  const rawData = {
    paciente_nombre: formData.get("paciente_nombre") || "",
    paciente_telefono: formData.get("paciente_telefono") || "",
    paciente_email: formData.get("paciente_email") || "",
    paciente_id: formData.get("paciente_id") || "",
    servicio_id: formData.get("servicio_id") || "",
    fecha: formData.get("fecha") || "",
    hora_inicio: formData.get("hora_inicio") || "",
    hora_fin: formData.get("hora_fin") || "",
    estado: formData.get("estado") || "pendiente",
    notas: formData.get("notas") || "",
    motivo: formData.get("motivo") || "",
    sobreturno: formData.get("sobreturno") === "true",
    recurrencia: formData.get("recurrencia") || "",
    recurrencia_fin: formData.get("recurrencia_fin") || "",
  };

  const resultado = citaSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  // Usar professional_id del formulario si se selecciono, sino el del usuario actual
  const formProfessionalId = formData.get("professional_id") || "";
  let professionalId = formProfessionalId || (await supabase.rpc("get_professional_id_for_user")).data;

  // Validar que el profesional pertenece al tenant
  if (formProfessionalId) {
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("id", formProfessionalId)
      .eq("tenant_id", tenantId)
      .single();
    if (!prof) {
      professionalId = (await supabase.rpc("get_professional_id_for_user")).data;
    }
  }

  const sucursalId = formData.get("sucursal_id") || null;

  if (!tenantId || !professionalId) {
    return { error: "No se pudo identificar tu cuenta. Intenta cerrar sesion y volver a entrar.", fieldErrors: {} };
  }

  // Validar solapamiento (saltar si es sobreturno)
  if (!resultado.data.sobreturno) {
    const { data: citasSolapadas } = await supabase
      .from("citas")
      .select("id")
      .eq("professional_id", professionalId)
      .eq("fecha", resultado.data.fecha)
      .lt("hora_inicio", resultado.data.hora_fin)
      .gt("hora_fin", resultado.data.hora_inicio)
      .not("estado", "in", '("cancelada","no_asistio")');

    if (citasSolapadas && citasSolapadas.length > 0) {
      return {
        error: "Ya existe una cita en ese horario",
        fieldErrors: {},
      };
    }
  }

  // Verificar si tenant tiene confirmacion de cita habilitada (1.7)
  const { data: tenantConfig } = await supabase
    .from("tenants")
    .select("configuracion")
    .eq("id", tenantId)
    .single();

  const confirmacionHabilitada = tenantConfig?.configuracion?.agenda?.confirmacion_cita?.habilitada;

  const insertData = {
    tenant_id: tenantId,
    professional_id: professionalId,
    ...resultado.data,
  };

  if (sucursalId) insertData.sucursal_id = sucursalId;

  // Si confirmacion habilitada, crear como pendiente_confirmacion
  if (confirmacionHabilitada && insertData.estado === "pendiente") {
    insertData.estado = "pendiente_confirmacion";
  }

  if (!insertData.servicio_id) delete insertData.servicio_id;
  if (!insertData.paciente_id) delete insertData.paciente_id;
  if (!insertData.motivo) delete insertData.motivo;
  if (!insertData.recurrencia) delete insertData.recurrencia;
  if (!insertData.recurrencia_fin) delete insertData.recurrencia_fin;
  if (!insertData.sobreturno) delete insertData.sobreturno;

  const { data: citaCreada, error } = await supabase
    .from("citas")
    .insert(insertData)
    .select("id, paciente_nombre, paciente_email, paciente_telefono, fecha, hora_inicio, servicio_id")
    .single();

  if (error) {
    console.error("Error al crear cita:", error);
    return { error: "Error al crear la cita: " + error.message, fieldErrors: {} };
  }

  // Generar citas recurrentes si aplica
  if (resultado.data.recurrencia && resultado.data.recurrencia_fin) {
    try {
      await generarCitasRecurrentes(supabase, {
        citaPadreId: citaCreada.id,
        tenantId,
        professionalId,
        datos: resultado.data,
        recurrencia: resultado.data.recurrencia,
        recurrenciaFin: resultado.data.recurrencia_fin,
      });
    } catch (recErr) {
      console.error("Error al generar citas recurrentes:", recErr);
    }
  }

  // Notificar creacion
  try {
    const { servicioNombre, usuario, tenantData } = await obtenerContextoNotificacion(
      supabase, tenantId, citaCreada.servicio_id, professionalId
    );

    // Generar link de confirmacion si aplica
    let linkConfirmacion = null;
    const tipoNotif = confirmacionHabilitada ? "confirmacion_cita" : "cita_creada";
    if (confirmacionHabilitada) {
      // Obtener token de la cita recien creada
      const { data: citaToken } = await supabase
        .from("citas")
        .select("token_confirmacion")
        .eq("id", citaCreada.id)
        .single();
      if (citaToken?.token_confirmacion) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        linkConfirmacion = `${baseUrl}/api/confirmar-cita?token=${citaToken.token_confirmacion}`;
      }
    }

    notificar({
      tenant_id: tenantId,
      tipo: tipoNotif,
      cita_id: citaCreada.id,
      destinatario_nombre: citaCreada.paciente_nombre,
      destinatario_email: citaCreada.paciente_email,
      destinatario_telefono: citaCreada.paciente_telefono,
      link_confirmacion: linkConfirmacion,
      contexto: {
        paciente_nombre: citaCreada.paciente_nombre,
        fecha: citaCreada.fecha,
        hora_inicio: citaCreada.hora_inicio,
        servicio_nombre: servicioNombre,
        profesional_nombre: usuario?.nombre_completo,
        tenant_nombre: tenantData?.nombre,
      },
    });
  } catch (notifErr) {
    console.error("Error al notificar cita creada:", notifErr);
  }

  revalidatePath("/dashboard/agenda");
  return { error: null, fieldErrors: {}, success: Date.now() };
}

export async function actualizarCita(id, prevState, formData) {
  const rawData = {
    paciente_nombre: formData.get("paciente_nombre") || "",
    paciente_telefono: formData.get("paciente_telefono") || "",
    paciente_email: formData.get("paciente_email") || "",
    paciente_id: formData.get("paciente_id") || "",
    servicio_id: formData.get("servicio_id") || "",
    fecha: formData.get("fecha") || "",
    hora_inicio: formData.get("hora_inicio") || "",
    hora_fin: formData.get("hora_fin") || "",
    estado: formData.get("estado") || "pendiente",
    notas: formData.get("notas") || "",
    motivo: formData.get("motivo") || "",
    sobreturno: formData.get("sobreturno") === "true",
  };

  const resultado = citaSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  // Usar professional_id del formulario si se selecciono, sino el del usuario actual
  const formProfessionalId = formData.get("professional_id") || "";
  let professionalId = formProfessionalId || (await supabase.rpc("get_professional_id_for_user")).data;

  if (formProfessionalId && tenantId) {
    const { data: prof } = await supabase
      .from("professionals")
      .select("id")
      .eq("id", formProfessionalId)
      .eq("tenant_id", tenantId)
      .single();
    if (!prof) {
      professionalId = (await supabase.rpc("get_professional_id_for_user")).data;
    }
  }

  const sucursalId = formData.get("sucursal_id") || null;

  if (!professionalId) {
    return { error: "No se pudo identificar al profesional.", fieldErrors: {} };
  }

  // Obtener cita anterior para detectar cambios
  const { data: citaAnterior } = await supabase
    .from("citas")
    .select("fecha, hora_inicio, hora_fin, estado, paciente_nombre, paciente_email, paciente_telefono, tenant_id, servicio_id")
    .eq("id", id)
    .single();

  if (!citaAnterior) {
    return { error: "Cita no encontrada.", fieldErrors: {} };
  }

  // Si se cancela, requerir motivo
  if (resultado.data.estado === "cancelada" && citaAnterior.estado !== "cancelada") {
    if (!resultado.data.motivo) {
      return { error: null, fieldErrors: { motivo: ["El motivo es requerido al cancelar una cita"] } };
    }
  }

  // Validar solapamiento excluyendo la cita actual (saltar si sobreturno)
  if (!resultado.data.sobreturno) {
    const { data: citasSolapadas } = await supabase
      .from("citas")
      .select("id")
      .eq("professional_id", professionalId)
      .eq("fecha", resultado.data.fecha)
      .lt("hora_inicio", resultado.data.hora_fin)
      .gt("hora_fin", resultado.data.hora_inicio)
      .not("estado", "in", '("cancelada","no_asistio")')
      .neq("id", id);

    if (citasSolapadas && citasSolapadas.length > 0) {
      return {
        error: "Ya existe una cita en ese horario",
        fieldErrors: {},
      };
    }
  }

  const updateData = { ...resultado.data };
  if (!updateData.servicio_id) updateData.servicio_id = null;
  if (!updateData.paciente_id) updateData.paciente_id = null;
  if (!updateData.motivo) delete updateData.motivo;
  if (!updateData.sobreturno) delete updateData.sobreturno;
  // No enviar recurrencia en update
  delete updateData.recurrencia;
  delete updateData.recurrencia_fin;

  // Actualizar profesional y sucursal si se enviaron
  if (formProfessionalId) updateData.professional_id = professionalId;
  if (sucursalId) updateData.sucursal_id = sucursalId;

  const { data: citaActualizada, error } = await supabase
    .from("citas")
    .update(updateData)
    .eq("id", id)
    .select("id, tenant_id, paciente_nombre, paciente_email, paciente_telefono, fecha, hora_inicio, servicio_id, estado")
    .single();

  if (error) {
    console.error("Error al actualizar cita:", error);
    return { error: "Error al actualizar la cita: " + error.message, fieldErrors: {} };
  }

  // Detectar tipo de cambio para la notificacion
  const fechaCambio = citaAnterior.fecha !== resultado.data.fecha;
  const horaCambio = citaAnterior.hora_inicio.slice(0, 5) !== resultado.data.hora_inicio.slice(0, 5);
  const fueReprogramada = fechaCambio || horaCambio;
  const fueCancelada = resultado.data.estado === "cancelada" && citaAnterior.estado !== "cancelada";

  if (fueReprogramada || fueCancelada || citaAnterior.estado !== resultado.data.estado) {
    try {
      const { servicioNombre, usuario, tenantData } = await obtenerContextoNotificacion(
        supabase, citaActualizada.tenant_id, citaActualizada.servicio_id, professionalId
      );

      let tipo = "cita_modificada";
      if (fueCancelada) {
        tipo = "cita_cancelada";
      } else if (fueReprogramada) {
        tipo = "cita_reprogramada";
      } else if (resultado.data.estado === "confirmada") {
        tipo = "cita_confirmada";
      }

      notificar({
        tenant_id: citaActualizada.tenant_id,
        tipo,
        cita_id: citaActualizada.id,
        destinatario_nombre: citaActualizada.paciente_nombre,
        destinatario_email: citaActualizada.paciente_email,
        destinatario_telefono: citaActualizada.paciente_telefono,
        contexto: {
          paciente_nombre: citaActualizada.paciente_nombre,
          fecha: citaActualizada.fecha,
          hora_inicio: citaActualizada.hora_inicio,
          servicio_nombre: servicioNombre,
          profesional_nombre: usuario?.nombre_completo,
          tenant_nombre: tenantData?.nombre,
          motivo: resultado.data.motivo,
          fecha_anterior: citaAnterior.fecha,
          hora_anterior: citaAnterior.hora_inicio,
        },
      });
    } catch (notifErr) {
      console.error("Error al notificar cita modificada:", notifErr);
    }
  }

  // Generar historia clinica si se completa
  if (resultado.data.estado === "completada" && citaAnterior.estado !== "completada") {
    try {
      const { data: cita } = await supabase
        .from("citas")
        .select("paciente_id")
        .eq("id", id)
        .single();

      if (cita?.paciente_id) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("rubro")
          .eq("id", citaActualizada.tenant_id)
          .single();
        if (tenant?.rubro) {
          generarHistoriaInicial(supabase, citaActualizada.tenant_id, cita.paciente_id, id, tenant.rubro);
        }
      }
    } catch (histErr) {
      console.error("Error al generar historia clinica:", histErr);
    }
  }

  revalidatePath("/dashboard/agenda");
  return { error: null, fieldErrors: {}, success: Date.now() };
}

export async function eliminarCita(id) {
  const supabase = await createClient();

  const { error } = await supabase.from("citas").delete().eq("id", id);

  if (error) {
    return { error: "Error al eliminar la cita" };
  }

  revalidatePath("/dashboard/agenda");
  return { error: null };
}

export async function cambiarEstadoCita(id, nuevoEstado, motivo = null) {
  const supabase = await createClient();

  // Si se cancela, requerir motivo
  if (nuevoEstado === "cancelada" && !motivo) {
    return { error: "Debes indicar un motivo para cancelar la cita", requiere_motivo: true };
  }

  const updateData = { estado: nuevoEstado };
  if (motivo) updateData.motivo = motivo;

  const { data: citaData, error } = await supabase
    .from("citas")
    .update(updateData)
    .eq("id", id)
    .select("id, tenant_id, professional_id, paciente_nombre, paciente_email, paciente_telefono, paciente_id, fecha, hora_inicio, servicio_id")
    .single();

  if (error) {
    return { error: "Error al cambiar el estado de la cita" };
  }

  // Notificar si se confirma o cancela
  if (nuevoEstado === "confirmada" || nuevoEstado === "cancelada") {
    try {
      const { servicioNombre, usuario, tenantData } = await obtenerContextoNotificacion(
        supabase, citaData.tenant_id, citaData.servicio_id
      );

      const tipo = nuevoEstado === "confirmada" ? "cita_confirmada" : "cita_cancelada";

      notificar({
        tenant_id: citaData.tenant_id,
        tipo,
        cita_id: citaData.id,
        destinatario_nombre: citaData.paciente_nombre,
        destinatario_email: citaData.paciente_email,
        destinatario_telefono: citaData.paciente_telefono,
        contexto: {
          paciente_nombre: citaData.paciente_nombre,
          fecha: citaData.fecha,
          hora_inicio: citaData.hora_inicio,
          servicio_nombre: servicioNombre,
          profesional_nombre: usuario?.nombre_completo,
          tenant_nombre: tenantData?.nombre,
          motivo,
        },
      });

      // Si se cancela, notificar a lista de espera
      if (nuevoEstado === "cancelada") {
        await notificarListaEspera(supabase, citaData);
      }
    } catch (notifErr) {
      console.error("Error al notificar cambio de estado:", notifErr);
    }
  }

  // Generar historia clinica automatica al completar primera cita
  if (nuevoEstado === "completada" && citaData.paciente_id) {
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("rubro")
        .eq("id", citaData.tenant_id)
        .single();

      if (tenant?.rubro) {
        generarHistoriaInicial(supabase, citaData.tenant_id, citaData.paciente_id, citaData.id, tenant.rubro);
      }
    } catch (histErr) {
      console.error("Error al generar historia clinica:", histErr);
    }
  }

  revalidatePath("/dashboard/agenda");
  return { error: null };
}

// --- Turnos recurrentes (1.3) ---

async function generarCitasRecurrentes(supabase, { citaPadreId, tenantId, professionalId, datos, recurrencia, recurrenciaFin }) {
  const fechaInicio = parseISO(datos.fecha);
  const fechaLimite = parseISO(recurrenciaFin);
  const citasAInsertar = [];
  let fechaActual = fechaInicio;

  const avanzarFecha = (f) => {
    switch (recurrencia) {
      case "semanal": return addWeeks(f, 1);
      case "quincenal": return addWeeks(f, 2);
      case "mensual": return addMonths(f, 1);
      default: return addWeeks(f, 1);
    }
  };

  // Generar hasta 52 citas recurrentes maximo (1 ano semanal)
  const maxCitas = 52;
  let count = 0;

  fechaActual = avanzarFecha(fechaActual);

  while (isBefore(fechaActual, fechaLimite) && count < maxCitas) {
    const fechaStr = fechaActual.toISOString().split("T")[0];

    // Verificar solapamiento
    const { data: solapadas } = await supabase
      .from("citas")
      .select("id")
      .eq("professional_id", professionalId)
      .eq("fecha", fechaStr)
      .lt("hora_inicio", datos.hora_fin)
      .gt("hora_fin", datos.hora_inicio)
      .not("estado", "in", '("cancelada","no_asistio")');

    if (!solapadas || solapadas.length === 0) {
      citasAInsertar.push({
        tenant_id: tenantId,
        professional_id: professionalId,
        servicio_id: datos.servicio_id || null,
        paciente_nombre: datos.paciente_nombre,
        paciente_telefono: datos.paciente_telefono || null,
        paciente_email: datos.paciente_email || null,
        paciente_id: datos.paciente_id || null,
        fecha: fechaStr,
        hora_inicio: datos.hora_inicio,
        hora_fin: datos.hora_fin,
        estado: "pendiente",
        notas: datos.notas || null,
        cita_padre_id: citaPadreId,
        recurrencia,
      });
    }

    fechaActual = avanzarFecha(fechaActual);
    count++;
  }

  if (citasAInsertar.length > 0) {
    // Limpiar nulls
    const limpias = citasAInsertar.map((c) => {
      const obj = { ...c };
      if (!obj.servicio_id) delete obj.servicio_id;
      if (!obj.paciente_id) delete obj.paciente_id;
      return obj;
    });
    await supabase.from("citas").insert(limpias);
  }

  return citasAInsertar.length;
}

export async function modificarSerieCitas(citaPadreId, accion, motivo = null) {
  const supabase = await createClient();

  if (accion === "cancelar_serie") {
    const updateData = { estado: "cancelada" };
    if (motivo) updateData.motivo = motivo;

    // Cancelar la cita padre
    await supabase
      .from("citas")
      .update(updateData)
      .eq("id", citaPadreId);

    // Cancelar todas las citas hijas futuras
    const hoy = new Date().toISOString().split("T")[0];
    await supabase
      .from("citas")
      .update(updateData)
      .eq("cita_padre_id", citaPadreId)
      .gte("fecha", hoy)
      .not("estado", "in", '("completada","cancelada")');

    revalidatePath("/dashboard/agenda");
    return { error: null };
  }

  return { error: "Accion no reconocida" };
}

// --- Consulta activa ---

export async function iniciarConsulta(citaId) {
  const supabase = await createClient();
  const ahora = new Date().toISOString();

  // Intentar con columnas nuevas, fallback sin ellas
  let result = await supabase
    .from("citas")
    .update({ estado: "en_curso", hora_inicio_consulta: ahora })
    .eq("id", citaId)
    .select("id, tenant_id, paciente_nombre, paciente_id, fecha, hora_inicio, servicio_id, hora_inicio_consulta, notas_consulta, notas, servicios(nombre, color, duracion_minutos)")
    .single();

  if (result.error) {
    // Fallback: columnas de migracion 010 no existen aun
    result = await supabase
      .from("citas")
      .update({ estado: "en_curso" })
      .eq("id", citaId)
      .select("id, tenant_id, paciente_nombre, paciente_id, fecha, hora_inicio, servicio_id, notas, servicios(nombre, color, duracion_minutos)")
      .single();

    if (result.error) {
      console.error("Error al iniciar consulta:", result.error);
      return { error: "Error al iniciar la consulta", data: null };
    }

    // Simular hora_inicio_consulta con el timestamp actual
    result.data.hora_inicio_consulta = ahora;
    result.data.notas_consulta = "";
  }

  revalidatePath("/dashboard/agenda");
  return { error: null, data: result.data };
}

export async function guardarNotasConsulta(citaId, notasConsulta) {
  const supabase = await createClient();

  // Intentar guardar en notas_consulta, fallback a notas
  const { error } = await supabase
    .from("citas")
    .update({ notas_consulta: notasConsulta })
    .eq("id", citaId);

  if (error) {
    // Fallback: columna no existe, guardar en notas
    const { error: err2 } = await supabase
      .from("citas")
      .update({ notas: notasConsulta })
      .eq("id", citaId);

    if (err2) return { error: "Error al guardar notas" };
  }

  return { error: null };
}

export async function completarConsulta(citaId, notasConsulta) {
  const supabase = await createClient();

  let result = await supabase
    .from("citas")
    .update({
      estado: "completada",
      notas_consulta: notasConsulta,
      hora_fin_consulta: new Date().toISOString(),
    })
    .eq("id", citaId)
    .select("id, tenant_id, paciente_id, paciente_nombre, fecha, hora_inicio, servicio_id")
    .single();

  if (result.error) {
    // Fallback: columnas de migracion 010 no existen
    result = await supabase
      .from("citas")
      .update({ estado: "completada", notas: notasConsulta })
      .eq("id", citaId)
      .select("id, tenant_id, paciente_id, paciente_nombre, fecha, hora_inicio, servicio_id")
      .single();

    if (result.error) {
      console.error("Error al completar consulta:", result.error);
      return { error: "Error al completar la consulta" };
    }
  }

  const cita = result.data;

  // Guardar en historia clinica si hay paciente vinculado
  if (cita.paciente_id && notasConsulta) {
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("rubro")
        .eq("id", cita.tenant_id)
        .single();

      if (tenant?.rubro) {
        await guardarConsultaEnHistoria(
          supabase,
          cita.tenant_id,
          cita.paciente_id,
          citaId,
          tenant.rubro,
          notasConsulta
        );
      }
    } catch (histErr) {
      console.error("Error al guardar en historia clinica:", histErr);
    }
  }

  revalidatePath("/dashboard/agenda");
  return { error: null };
}

async function guardarConsultaEnHistoria(supabase, tenantId, pacienteId, citaId, rubro, notas) {
  const fecha = new Date().toISOString().split("T")[0];

  switch (rubro) {
    case "medicina":
      await supabase.from("historias_clinicas").insert({
        tenant_id: tenantId,
        paciente_id: pacienteId,
        cita_id: citaId,
        fecha,
        motivo_consulta: notas,
        observaciones: "",
      });
      break;

    case "odontologia":
      await supabase.from("historias_clinicas_dentales").insert({
        tenant_id: tenantId,
        paciente_id: pacienteId,
        cita_id: citaId,
        fecha,
        observaciones: notas,
      });
      break;

    case "psicologia":
      await supabase.from("notas_sesion").insert({
        tenant_id: tenantId,
        paciente_id: pacienteId,
        cita_id: citaId,
        fecha,
        contenido: notas,
        estado_emocional: "neutro",
      });
      break;

    default:
      // Para otros rubros, las notas quedan en citas.notas_consulta
      break;
  }
}

// --- Lista de espera: notificar al cancelar (1.5) ---

async function notificarListaEspera(supabase, citaCancelada) {
  try {
    const { data: espera } = await supabase
      .from("lista_espera")
      .select("*")
      .eq("tenant_id", citaCancelada.tenant_id)
      .eq("professional_id", citaCancelada.professional_id)
      .eq("estado", "esperando")
      .order("created_at", { ascending: true })
      .limit(3);

    if (!espera || espera.length === 0) return;

    // Obtener datos del profesional
    const { servicioNombre, usuario, tenantData } = await obtenerContextoNotificacion(
      supabase, citaCancelada.tenant_id, citaCancelada.servicio_id
    );

    for (const item of espera) {
      // Notificar a cada paciente en la lista
      notificar({
        tenant_id: citaCancelada.tenant_id,
        tipo: "lista_espera_disponible",
        destinatario_nombre: item.paciente_nombre,
        destinatario_email: item.paciente_email,
        destinatario_telefono: item.paciente_telefono,
        contexto: {
          paciente_nombre: item.paciente_nombre,
          fecha: citaCancelada.fecha,
          hora_inicio: citaCancelada.hora_inicio,
          servicio_nombre: servicioNombre,
          profesional_nombre: usuario?.nombre_completo,
          tenant_nombre: tenantData?.nombre,
        },
      });

      // Marcar como notificado
      await supabase
        .from("lista_espera")
        .update({ estado: "notificado" })
        .eq("id", item.id);
    }
  } catch (err) {
    console.error("Error al notificar lista de espera:", err);
  }
}
