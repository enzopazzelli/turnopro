"use server";

import { createClient } from "@/lib/supabase/server";

export async function obtenerReporteCitas(fechaInicio, fechaFin, { professionalId: filterProfId, sucursalId } = {}) {
  try {
    const supabase = await createClient();
    const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

    if (!tenantId) {
      return { error: "No se pudo identificar tu cuenta", data: null };
    }

    let query = supabase
      .from("citas")
      .select(
        "id, fecha, hora_inicio, hora_fin, estado, paciente_nombre, paciente_telefono, notas, sucursal_id, professional_id, servicios(nombre, precio, duracion_minutos)"
      )
      .eq("tenant_id", tenantId)
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false });

    if (filterProfId) query = query.eq("professional_id", filterProfId);
    if (sucursalId) query = query.eq("sucursal_id", sucursalId);

    const { data: citas, error } = await query;

    if (error) throw error;

    const citasData = citas || [];
    const total = citasData.length;
    const completadas = citasData.filter(
      (c) => c.estado === "completada"
    ).length;
    const canceladas = citasData.filter(
      (c) => c.estado === "cancelada"
    ).length;
    const noAsistio = citasData.filter(
      (c) => c.estado === "no_asistio"
    ).length;
    const tasaCompletacion =
      total > 0 ? Math.round((completadas / total) * 100) : 0;

    return {
      error: null,
      data: {
        citas: citasData.map((c) => ({
          id: c.id,
          fecha: c.fecha,
          horaInicio: c.hora_inicio?.slice(0, 5),
          horaFin: c.hora_fin?.slice(0, 5),
          estado: c.estado,
          paciente: c.paciente_nombre || "Sin nombre",
          telefono: c.paciente_telefono || "",
          servicio: c.servicios?.nombre || "Sin servicio",
          precio: Number(c.servicios?.precio || 0),
          duracion: c.servicios?.duracion_minutos || 0,
          notas: c.notas || "",
        })),
        resumen: {
          total,
          completadas,
          canceladas,
          noAsistio,
          tasaCompletacion,
        },
      },
    };
  } catch (err) {
    console.error("Error en reporte de citas:", err);
    return { error: "Error al generar el reporte de citas", data: null };
  }
}

export async function obtenerReporteIngresos(fechaInicio, fechaFin, { professionalId: filterProfId, sucursalId } = {}) {
  try {
    const supabase = await createClient();
    const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

    if (!tenantId) {
      return { error: "No se pudo identificar tu cuenta", data: null };
    }

    // Intentar obtener pagos reales primero
    let pagosQuery = supabase
      .from("pagos")
      .select(
        "id, fecha_pago, monto, metodo_pago, referencia, anulado, pacientes(nombre_completo), citas(paciente_nombre, hora_inicio, professional_id, sucursal_id, servicios(nombre))"
      )
      .eq("tenant_id", tenantId)
      .eq("anulado", false)
      .gte("fecha_pago", fechaInicio)
      .lte("fecha_pago", fechaFin)
      .order("fecha_pago", { ascending: false });

    const { data: pagos, error: pagosError } = await pagosQuery;

    // Si hay pagos registrados, usar pagos reales
    if (!pagosError && pagos && pagos.length > 0) {
      // Filtrar pagos por profesional/sucursal si la cita tiene esos datos
      let pagosFiltrados = pagos;
      if (filterProfId) {
        pagosFiltrados = pagosFiltrados.filter((p) => !p.citas || p.citas.professional_id === filterProfId);
      }
      if (sucursalId) {
        pagosFiltrados = pagosFiltrados.filter((p) => p.citas?.sucursal_id === sucursalId);
      }

      const filas = pagosFiltrados.map((p) => ({
        id: p.id,
        fecha: p.fecha_pago,
        horaInicio: p.citas?.hora_inicio?.slice(0, 5) || "—",
        paciente: p.pacientes?.nombre_completo || p.citas?.paciente_nombre || "Sin nombre",
        servicio: p.citas?.servicios?.nombre || "Pago directo",
        precio: Number(p.monto),
        metodo_pago: p.metodo_pago,
      }));

      const totalIngresos = filas.reduce((acc, f) => acc + f.precio, 0);
      const promedioIngreso =
        filas.length > 0 ? Math.round(totalIngresos / filas.length) : 0;

      const ingresoPorServicio = {};
      filas.forEach((f) => {
        ingresoPorServicio[f.servicio] =
          (ingresoPorServicio[f.servicio] || 0) + f.precio;
      });

      const servicioMasRentable =
        Object.entries(ingresoPorServicio).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] || "—";

      return {
        error: null,
        data: {
          filas,
          resumen: {
            totalIngresos,
            promedioIngreso,
            totalCitas: filas.length,
            servicioMasRentable,
          },
          fuentePagos: true,
        },
      };
    }

    // Fallback: calcular ingresos estimados desde citas completadas
    let citasQuery = supabase
      .from("citas")
      .select(
        "id, fecha, hora_inicio, paciente_nombre, estado, servicios(nombre, precio)"
      )
      .eq("tenant_id", tenantId)
      .eq("estado", "completada")
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .order("fecha", { ascending: false });

    if (filterProfId) citasQuery = citasQuery.eq("professional_id", filterProfId);
    if (sucursalId) citasQuery = citasQuery.eq("sucursal_id", sucursalId);

    const { data: citas, error } = await citasQuery;

    if (error) throw error;

    const citasData = citas || [];

    const filas = citasData.map((c) => ({
      id: c.id,
      fecha: c.fecha,
      horaInicio: c.hora_inicio?.slice(0, 5),
      paciente: c.paciente_nombre || "Sin nombre",
      servicio: c.servicios?.nombre || "Sin servicio",
      precio: Number(c.servicios?.precio || 0),
    }));

    const totalIngresos = filas.reduce((acc, f) => acc + f.precio, 0);
    const promedioIngreso =
      filas.length > 0 ? Math.round(totalIngresos / filas.length) : 0;

    // Servicio mas rentable
    const ingresoPorServicio = {};
    filas.forEach((f) => {
      ingresoPorServicio[f.servicio] =
        (ingresoPorServicio[f.servicio] || 0) + f.precio;
    });

    const servicioMasRentable =
      Object.entries(ingresoPorServicio).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] || "—";

    return {
      error: null,
      data: {
        filas,
        resumen: {
          totalIngresos,
          promedioIngreso,
          totalCitas: filas.length,
          servicioMasRentable,
        },
        fuentePagos: false,
      },
    };
  } catch (err) {
    console.error("Error en reporte de ingresos:", err);
    return { error: "Error al generar el reporte de ingresos", data: null };
  }
}

export async function obtenerReportePacientes(fechaInicio, fechaFin, { professionalId: filterProfId, sucursalId } = {}) {
  try {
    const supabase = await createClient();
    const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

    if (!tenantId) {
      return { error: "No se pudo identificar tu cuenta", data: null };
    }

    // Get citas in range with paciente_id
    let citasQuery = supabase
      .from("citas")
      .select("paciente_id, paciente_nombre, fecha, estado")
      .eq("tenant_id", tenantId)
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .not("estado", "in", '("cancelada")');

    if (filterProfId) citasQuery = citasQuery.eq("professional_id", filterProfId);
    if (sucursalId) citasQuery = citasQuery.eq("sucursal_id", sucursalId);

    const { data: citas, error: citasError } = await citasQuery;

    if (citasError) throw citasError;

    // Get all citas ever for each paciente to determine nuevos vs recurrentes
    const pacienteIds = [
      ...new Set((citas || []).filter((c) => c.paciente_id).map((c) => c.paciente_id)),
    ];

    let primerasCitas = {};
    if (pacienteIds.length > 0) {
      const { data: todasCitas } = await supabase
        .from("citas")
        .select("paciente_id, fecha")
        .eq("tenant_id", tenantId)
        .in("paciente_id", pacienteIds)
        .not("estado", "in", '("cancelada")')
        .order("fecha");

      (todasCitas || []).forEach((c) => {
        if (!primerasCitas[c.paciente_id]) {
          primerasCitas[c.paciente_id] = c.fecha;
        }
      });
    }

    // Group by paciente
    const porPaciente = {};
    (citas || []).forEach((c) => {
      const key = c.paciente_id || c.paciente_nombre || "Sin identificar";
      if (!porPaciente[key]) {
        porPaciente[key] = {
          pacienteId: c.paciente_id,
          nombre: c.paciente_nombre || "Sin nombre",
          totalVisitas: 0,
          completadas: 0,
          noAsistio: 0,
          primeraVisita: c.fecha,
          ultimaVisita: c.fecha,
        };
      }
      porPaciente[key].totalVisitas += 1;
      if (c.estado === "completada") porPaciente[key].completadas += 1;
      if (c.estado === "no_asistio") porPaciente[key].noAsistio += 1;
      if (c.fecha < porPaciente[key].primeraVisita)
        porPaciente[key].primeraVisita = c.fecha;
      if (c.fecha > porPaciente[key].ultimaVisita)
        porPaciente[key].ultimaVisita = c.fecha;
    });

    const filas = Object.values(porPaciente)
      .map((p) => ({
        ...p,
        esNuevo: p.pacienteId
          ? primerasCitas[p.pacienteId] >= fechaInicio
          : true,
      }))
      .sort((a, b) => b.totalVisitas - a.totalVisitas);

    const totalPacientes = filas.length;
    const nuevos = filas.filter((p) => p.esNuevo).length;
    const recurrentes = totalPacientes - nuevos;
    const totalVisitas = filas.reduce((acc, p) => acc + p.totalVisitas, 0);
    const promedioVisitas =
      totalPacientes > 0 ? (totalVisitas / totalPacientes).toFixed(1) : 0;

    return {
      error: null,
      data: {
        filas,
        resumen: {
          totalPacientes,
          nuevos,
          recurrentes,
          promedioVisitas,
        },
      },
    };
  } catch (err) {
    console.error("Error en reporte de pacientes:", err);
    return { error: "Error al generar el reporte de pacientes", data: null };
  }
}

export async function obtenerReporteServicios(fechaInicio, fechaFin, { professionalId: filterProfId, sucursalId } = {}) {
  try {
    const supabase = await createClient();
    const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
    if (!tenantId) return { error: "No se pudo identificar tu cuenta", data: null };

    let query = supabase
      .from("citas")
      .select("id, estado, servicios(nombre, precio)")
      .eq("tenant_id", tenantId)
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin);

    if (filterProfId) query = query.eq("professional_id", filterProfId);
    if (sucursalId) query = query.eq("sucursal_id", sucursalId);

    const { data: citas, error } = await query;
    if (error) throw error;

    const citasData = citas || [];

    const porServicio = {};
    citasData.forEach((c) => {
      const nombre = c.servicios?.nombre || "Sin servicio";
      const precio = Number(c.servicios?.precio || 0);
      if (!porServicio[nombre]) {
        porServicio[nombre] = { nombre, total: 0, completadas: 0, canceladas: 0, ingresos: 0 };
      }
      porServicio[nombre].total += 1;
      if (c.estado === "completada") {
        porServicio[nombre].completadas += 1;
        porServicio[nombre].ingresos += precio;
      }
      if (c.estado === "cancelada") porServicio[nombre].canceladas += 1;
    });

    const filas = Object.values(porServicio).sort((a, b) => b.total - a.total);

    return {
      error: null,
      data: {
        filas,
        resumen: {
          totalServicios: filas.length,
          servicioTop: filas[0]?.nombre || "—",
          totalCitas: citasData.length,
        },
      },
    };
  } catch (err) {
    console.error("Error en reporte de servicios:", err);
    return { error: "Error al generar el reporte de servicios", data: null };
  }
}

export async function obtenerReporteHorarios(fechaInicio, fechaFin, { professionalId: filterProfId, sucursalId } = {}) {
  try {
    const supabase = await createClient();
    const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
    if (!tenantId) return { error: "No se pudo identificar tu cuenta", data: null };

    let query = supabase
      .from("citas")
      .select("hora_inicio, fecha, estado")
      .eq("tenant_id", tenantId)
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .not("estado", "eq", "cancelada");

    if (filterProfId) query = query.eq("professional_id", filterProfId);
    if (sucursalId) query = query.eq("sucursal_id", sucursalId);

    const { data: citas, error } = await query;
    if (error) throw error;

    const citasData = citas || [];

    const DIAS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
    const porHora = {};
    const porDia = { Dom: 0, Lun: 0, Mar: 0, Mie: 0, Jue: 0, Vie: 0, Sab: 0 };

    citasData.forEach((c) => {
      if (c.hora_inicio) {
        const hora = parseInt(c.hora_inicio.split(":")[0], 10);
        porHora[hora] = (porHora[hora] || 0) + 1;
      }
      if (c.fecha) {
        const diaSemana = new Date(c.fecha + "T12:00:00").getDay();
        porDia[DIAS[diaSemana]] = (porDia[DIAS[diaSemana]] || 0) + 1;
      }
    });

    const horasData = [];
    for (let h = 6; h <= 21; h++) {
      horasData.push({ hora: `${h}:00`, cantidad: porHora[h] || 0 });
    }

    const diasData = DIAS.map((d) => ({ dia: d, cantidad: porDia[d] || 0 }));

    const horaPico = [...horasData].sort((a, b) => b.cantidad - a.cantidad)[0];
    const diaPico = [...diasData].sort((a, b) => b.cantidad - a.cantidad)[0];

    return {
      error: null,
      data: {
        horasData,
        diasData,
        resumen: {
          horaPico: horaPico?.cantidad > 0 ? horaPico.hora : "—",
          diaPico: diaPico?.cantidad > 0 ? diaPico.dia : "—",
          totalCitas: citasData.length,
        },
      },
    };
  } catch (err) {
    console.error("Error en reporte de horarios:", err);
    return { error: "Error al generar el reporte de horarios", data: null };
  }
}
