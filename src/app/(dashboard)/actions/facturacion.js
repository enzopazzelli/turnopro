"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pagoSchema, anulacionPagoSchema } from "@/lib/validations/facturacion";
import { notificar } from "@/lib/notificaciones/servicio";

export async function registrarPago(prevState, formData) {
  const rawData = {
    monto: formData.get("monto"),
    metodo_pago: formData.get("metodo_pago"),
    referencia: formData.get("referencia"),
    notas: formData.get("notas"),
    fecha_pago: formData.get("fecha_pago"),
    cita_id: formData.get("cita_id") || undefined,
    paciente_id: formData.get("paciente_id") || undefined,
  };

  const resultado = pagoSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { error: "No se pudo identificar tu cuenta", fieldErrors: {} };
  }

  const insertData = {
    tenant_id: tenantId,
    monto: resultado.data.monto,
    metodo_pago: resultado.data.metodo_pago,
    referencia: resultado.data.referencia || null,
    notas: resultado.data.notas || null,
    fecha_pago: resultado.data.fecha_pago,
    cita_id: resultado.data.cita_id || null,
    paciente_id: resultado.data.paciente_id || null,
  };

  const { data: pago, error } = await supabase
    .from("pagos")
    .insert(insertData)
    .select("id, paciente_id, cita_id, monto")
    .single();

  if (error) {
    console.error("Error al registrar pago:", error);
    return { error: "Error al registrar el pago: " + error.message, fieldErrors: {} };
  }

  // Notificar pago registrado
  try {
    let pacienteNombre = "Paciente";
    if (pago.paciente_id) {
      const { data: pac } = await supabase
        .from("pacientes")
        .select("nombre_completo")
        .eq("id", pago.paciente_id)
        .single();
      if (pac) pacienteNombre = pac.nombre_completo;
    } else if (pago.cita_id) {
      const { data: cita } = await supabase
        .from("citas")
        .select("paciente_nombre")
        .eq("id", pago.cita_id)
        .single();
      if (cita) pacienteNombre = cita.paciente_nombre;
    }

    const { data: usuario } = await supabase
      .from("users")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("rol", "profesional")
      .single();

    notificar({
      tenant_id: tenantId,
      tipo: "pago_registrado",
      usuario_id: usuario?.id,
      canales: ["in_app"],
      contexto: {
        paciente_nombre: pacienteNombre,
        monto: pago.monto,
      },
    });
  } catch (notifErr) {
    console.error("Error al notificar pago:", notifErr);
  }

  revalidatePath("/dashboard/facturacion");
  revalidatePath("/dashboard/agenda");
  return { error: null, fieldErrors: {}, success: Date.now() };
}

export async function obtenerPagos(filtros = {}) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { data: [], error: "No se pudo identificar el tenant" };
  }

  let query = supabase
    .from("pagos")
    .select("*, pacientes(nombre_completo), citas(paciente_nombre, servicios(nombre, precio))")
    .eq("tenant_id", tenantId)
    .order("fecha_pago", { ascending: false })
    .order("created_at", { ascending: false });

  if (filtros.fecha_inicio) {
    query = query.gte("fecha_pago", filtros.fecha_inicio);
  }
  if (filtros.fecha_fin) {
    query = query.lte("fecha_pago", filtros.fecha_fin);
  }
  if (filtros.metodo_pago) {
    query = query.eq("metodo_pago", filtros.metodo_pago);
  }
  if (filtros.paciente_id) {
    query = query.eq("paciente_id", filtros.paciente_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener pagos:", error);
    return { data: [], error: "Error al obtener los pagos" };
  }

  return { data: data || [], error: null };
}

export async function obtenerPagosDeCita(citaId) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .eq("cita_id", citaId)
    .eq("anulado", false)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: "Error al obtener pagos de la cita" };
  }

  return { data: data || [], error: null };
}

export async function anularPago(pagoId, prevState, formData) {
  const rawData = {
    motivo: formData.get("motivo"),
  };

  const resultado = anulacionPagoSchema.safeParse(rawData);
  if (!resultado.success) {
    return { error: null, fieldErrors: resultado.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("pagos")
    .update({
      anulado: true,
      anulado_at: new Date().toISOString(),
      anulado_motivo: resultado.data.motivo,
    })
    .eq("id", pagoId);

  if (error) {
    console.error("Error al anular pago:", error);
    return { error: "Error al anular el pago", fieldErrors: {} };
  }

  revalidatePath("/dashboard/facturacion");
  revalidatePath("/dashboard/agenda");
  return { error: null, fieldErrors: {}, success: Date.now() };
}

export async function generarRecibo(pagoId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { data: null, error: "No se pudo identificar el tenant" };
  }

  // Verificar si ya existe recibo para este pago
  const { data: reciboExistente } = await supabase
    .from("recibos")
    .select("id, numero_recibo")
    .eq("pago_id", pagoId)
    .eq("estado", "emitido")
    .maybeSingle();

  if (reciboExistente) {
    return { data: reciboExistente, error: null, yaExiste: true };
  }

  // Obtener pago con datos relacionados
  const { data: pago, error: pagoError } = await supabase
    .from("pagos")
    .select("*, pacientes(nombre_completo, dni, direccion, telefono, email), citas(paciente_nombre, fecha, hora_inicio, servicios(nombre, precio))")
    .eq("id", pagoId)
    .single();

  if (pagoError || !pago) {
    return { data: null, error: "Pago no encontrado" };
  }

  // Obtener datos del tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("nombre, configuracion")
    .eq("id", tenantId)
    .single();

  // Obtener siguiente numero
  const { data: numero } = await supabase.rpc("obtener_siguiente_numero_recibo", {
    p_tenant_id: tenantId,
  });

  const datosFacturacion = tenant?.configuracion?.facturacion || {};

  const datosRecibo = {
    tenant: {
      nombre: tenant?.nombre || "",
      nombre_negocio: datosFacturacion.nombre_negocio || tenant?.nombre || "",
      cuit: datosFacturacion.cuit || "",
      direccion: datosFacturacion.direccion || "",
    },
    paciente: {
      nombre: pago.pacientes?.nombre_completo || pago.citas?.paciente_nombre || "Sin nombre",
      dni: pago.pacientes?.dni || "",
      direccion: pago.pacientes?.direccion || "",
      telefono: pago.pacientes?.telefono || "",
      email: pago.pacientes?.email || "",
    },
    pago: {
      monto: Number(pago.monto),
      metodo_pago: pago.metodo_pago,
      referencia: pago.referencia,
      fecha_pago: pago.fecha_pago,
    },
    servicio: pago.citas?.servicios
      ? {
          nombre: pago.citas.servicios.nombre,
          precio: Number(pago.citas.servicios.precio),
        }
      : null,
    cita: pago.citas
      ? {
          fecha: pago.citas.fecha,
          hora: pago.citas.hora_inicio?.slice(0, 5),
        }
      : null,
  };

  const { data: recibo, error: reciboError } = await supabase
    .from("recibos")
    .insert({
      tenant_id: tenantId,
      pago_id: pagoId,
      numero_recibo: numero,
      tipo: "recibo",
      estado: "emitido",
      datos_recibo: datosRecibo,
    })
    .select("id, numero_recibo, datos_recibo, created_at")
    .single();

  if (reciboError) {
    console.error("Error al generar recibo:", reciboError);
    return { data: null, error: "Error al generar el recibo" };
  }

  revalidatePath("/dashboard/facturacion");
  return { data: recibo, error: null };
}

export async function obtenerRecibos(filtros = {}) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { data: [], error: "No se pudo identificar el tenant" };
  }

  let query = supabase
    .from("recibos")
    .select("*, pagos(monto, metodo_pago, fecha_pago, pacientes(nombre_completo), citas(paciente_nombre))")
    .eq("tenant_id", tenantId)
    .order("numero_recibo", { ascending: false });

  if (filtros.estado) {
    query = query.eq("estado", filtros.estado);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener recibos:", error);
    return { data: [], error: "Error al obtener los recibos" };
  }

  return { data: data || [], error: null };
}

export async function obtenerCuentaCorriente(pacienteId) {
  const supabase = await createClient();

  // Obtener cargos (citas con servicio)
  const { data: citas } = await supabase
    .from("citas")
    .select("id, fecha, hora_inicio, estado, paciente_nombre, servicios(nombre, precio)")
    .eq("paciente_id", pacienteId)
    .not("estado", "in", '("cancelada")')
    .order("fecha", { ascending: true });

  // Obtener pagos
  const { data: pagos } = await supabase
    .from("pagos")
    .select("id, monto, metodo_pago, fecha_pago, anulado, referencia, notas")
    .eq("paciente_id", pacienteId)
    .order("fecha_pago", { ascending: true })
    .order("created_at", { ascending: true });

  // Construir movimientos cronologicos
  const movimientos = [];

  (citas || []).forEach((cita) => {
    if (cita.servicios?.precio) {
      movimientos.push({
        tipo: "cargo",
        fecha: cita.fecha,
        concepto: cita.servicios.nombre || "Consulta",
        monto: Number(cita.servicios.precio),
        detalle: `Cita ${cita.hora_inicio?.slice(0, 5) || ""}`,
        id: cita.id,
      });
    }
  });

  (pagos || []).forEach((pago) => {
    movimientos.push({
      tipo: pago.anulado ? "anulacion" : "abono",
      fecha: pago.fecha_pago,
      concepto: pago.anulado ? "Pago anulado" : "Pago",
      monto: Number(pago.monto),
      detalle: pago.referencia || "",
      metodo_pago: pago.metodo_pago,
      id: pago.id,
      anulado: pago.anulado,
    });
  });

  // Ordenar por fecha
  movimientos.sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Calcular saldo acumulado
  let saldo = 0;
  movimientos.forEach((m) => {
    if (m.tipo === "cargo") {
      saldo += m.monto;
    } else if (m.tipo === "abono") {
      saldo -= m.monto;
    }
    m.saldo = saldo;
  });

  const totalCargos = movimientos
    .filter((m) => m.tipo === "cargo")
    .reduce((acc, m) => acc + m.monto, 0);
  const totalPagos = movimientos
    .filter((m) => m.tipo === "abono")
    .reduce((acc, m) => acc + m.monto, 0);

  return {
    data: {
      movimientos,
      totalCargos,
      totalPagos,
      saldo: totalCargos - totalPagos,
    },
    error: null,
  };
}

export async function obtenerResumenCuentaCorriente() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (!tenantId) {
    return { data: [], error: "No se pudo identificar el tenant" };
  }

  // Usar la vista cuenta_corriente_pacientes
  const { data, error } = await supabase
    .from("cuenta_corriente_pacientes")
    .select("*")
    .eq("tenant_id", tenantId)
    .gt("saldo", 0)
    .order("saldo", { ascending: false });

  if (error) {
    console.error("Error al obtener cuenta corriente:", error);
    return { data: [], error: "Error al obtener la cuenta corriente" };
  }

  return { data: data || [], error: null };
}
