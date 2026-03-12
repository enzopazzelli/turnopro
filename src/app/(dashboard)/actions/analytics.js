"use server";

import { createClient } from "@/lib/supabase/server";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  subDays,
  subMonths,
  parseISO,
  eachDayOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";

function calcularRangoPeriodo(periodo) {
  const ahora = new Date();
  switch (periodo) {
    case "hoy":
      return {
        inicio: format(ahora, "yyyy-MM-dd"),
        fin: format(ahora, "yyyy-MM-dd"),
      };
    case "semana":
      return {
        inicio: format(startOfWeek(ahora, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        fin: format(endOfWeek(ahora, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "trimestre":
      return {
        inicio: format(startOfQuarter(ahora), "yyyy-MM-dd"),
        fin: format(endOfQuarter(ahora), "yyyy-MM-dd"),
      };
    case "mes":
    default:
      return {
        inicio: format(startOfMonth(ahora), "yyyy-MM-dd"),
        fin: format(endOfMonth(ahora), "yyyy-MM-dd"),
      };
  }
}

export async function obtenerDatosAnalytics(periodo = "mes") {
  try {
    const supabase = await createClient();
    const professionalId = (
      await supabase.rpc("get_professional_id_for_user")
    ).data;
    const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

    if (!professionalId || !tenantId) {
      return { error: "No se pudo identificar tu cuenta", data: null };
    }

    const hoy = format(new Date(), "yyyy-MM-dd");
    const horaActual = format(new Date(), "HH:mm:ss");
    const { inicio, fin } = calcularRangoPeriodo(periodo);
    const hace30dias = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const hace6meses = subMonths(new Date(), 6).toISOString();

    const [
      citasHoyRes,
      proximaCitaRes,
      totalPacientesRes,
      ingresosPeriodoRes,
      citasUltimos30Res,
      estadosPeriodoRes,
      serviciosPeriodoRes,
      horariosPeriodoRes,
      citasConPacienteRes,
    ] = await Promise.all([
      // Citas de hoy
      supabase
        .from("citas")
        .select("id, estado")
        .eq("professional_id", professionalId)
        .eq("fecha", hoy),

      // Proxima cita
      supabase
        .from("citas")
        .select("paciente_nombre, hora_inicio, servicios(nombre)")
        .eq("professional_id", professionalId)
        .eq("fecha", hoy)
        .gt("hora_inicio", horaActual)
        .in("estado", ["pendiente", "confirmada"])
        .order("hora_inicio")
        .limit(1)
        .maybeSingle(),

      // Total pacientes activos
      supabase
        .from("pacientes")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("activo", true),

      // Pagos reales del periodo
      supabase
        .from("pagos")
        .select("monto")
        .eq("tenant_id", tenantId)
        .eq("anulado", false)
        .gte("fecha_pago", inicio)
        .lte("fecha_pago", fin),

      // Citas ultimos 30 dias (para grafico de tendencia)
      supabase
        .from("citas")
        .select("fecha")
        .eq("professional_id", professionalId)
        .gte("fecha", hace30dias)
        .not("estado", "in", '("cancelada")'),

      // Estados del periodo
      supabase
        .from("citas")
        .select("estado")
        .eq("professional_id", professionalId)
        .gte("fecha", inicio)
        .lte("fecha", fin),

      // Servicios del periodo
      supabase
        .from("citas")
        .select("servicio_id, servicios(nombre, color)")
        .eq("professional_id", professionalId)
        .gte("fecha", inicio)
        .lte("fecha", fin)
        .not("servicio_id", "is", null),

      // Horarios del periodo
      supabase
        .from("citas")
        .select("hora_inicio")
        .eq("professional_id", professionalId)
        .gte("fecha", inicio)
        .lte("fecha", fin)
        .not("estado", "in", '("cancelada")'),

      // Citas con paciente_id (ultimos 6 meses) para nuevos vs recurrentes
      supabase
        .from("citas")
        .select("paciente_id, fecha")
        .eq("professional_id", professionalId)
        .gte("fecha", format(subMonths(new Date(), 6), "yyyy-MM-dd"))
        .not("estado", "in", '("cancelada")')
        .not("paciente_id", "is", null),
    ]);

    // --- Procesar metricas ---

    const citasHoyData = citasHoyRes.data || [];
    const citasHoyTotal = citasHoyData.length;
    const citasHoyPendientes = citasHoyData.filter(
      (c) => c.estado === "pendiente"
    ).length;

    const proximaCita = proximaCitaRes.data;

    const totalPacientes = totalPacientesRes.count || 0;

    // Si hay pagos reales, usar esos; si no, fallback a estimado
    const pagosReales = ingresosPeriodoRes.data || [];
    let ingresosPeriodo;
    if (pagosReales.length > 0) {
      ingresosPeriodo = pagosReales.reduce(
        (acc, p) => acc + Number(p.monto || 0),
        0
      );
    } else {
      // Fallback: estimar desde citas completadas (sin tabla pagos aun)
      const { data: citasEstimadas } = await supabase
        .from("citas")
        .select("servicios(precio)")
        .eq("professional_id", professionalId)
        .eq("estado", "completada")
        .gte("fecha", inicio)
        .lte("fecha", fin);
      ingresosPeriodo = (citasEstimadas || []).reduce(
        (acc, c) => acc + Number(c.servicios?.precio || 0),
        0
      );
    }

    // --- Tasa de ausentismo ---
    const estadosPeriodoData = estadosPeriodoRes.data || [];
    const completadas = estadosPeriodoData.filter(
      (c) => c.estado === "completada"
    ).length;
    const noAsistio = estadosPeriodoData.filter(
      (c) => c.estado === "no_asistio"
    ).length;
    const totalParaAusentismo = completadas + noAsistio;
    const tasaAusentismo =
      totalParaAusentismo > 0
        ? Math.round((noAsistio / totalParaAusentismo) * 100)
        : 0;

    // --- Citas del periodo (para KPI) ---
    const citasPeriodoTotal = estadosPeriodoData.length;

    // --- Citas por dia (30 dias) ---
    const citasPorDiaMap = {};
    (citasUltimos30Res.data || []).forEach((c) => {
      citasPorDiaMap[c.fecha] = (citasPorDiaMap[c.fecha] || 0) + 1;
    });

    const dias = eachDayOfInterval({
      start: subDays(new Date(), 30),
      end: new Date(),
    });

    const citasPorDia = dias.map((dia) => {
      const fecha = format(dia, "yyyy-MM-dd");
      return {
        fecha: format(dia, "dd/MM"),
        total: citasPorDiaMap[fecha] || 0,
      };
    });

    // --- Distribucion de estados ---
    const estadosMap = {};
    estadosPeriodoData.forEach((c) => {
      estadosMap[c.estado] = (estadosMap[c.estado] || 0) + 1;
    });

    const coloresEstado = {
      pendiente: "#f59e0b",
      confirmada: "#3b82f6",
      en_curso: "#6366f1",
      completada: "#22c55e",
      cancelada: "#ef4444",
      no_asistio: "#6b7280",
    };

    const labelsEstado = {
      pendiente: "Pendiente",
      confirmada: "Confirmada",
      en_curso: "En curso",
      completada: "Completada",
      cancelada: "Cancelada",
      no_asistio: "No asistio",
    };

    const distribucionEstados = Object.entries(estadosMap).map(
      ([estado, total]) => ({
        estado: labelsEstado[estado] || estado,
        total,
        color: coloresEstado[estado] || "#9ca3af",
      })
    );

    // --- Servicios demandados (top 5) ---
    const serviciosMap = {};
    (serviciosPeriodoRes.data || []).forEach((c) => {
      const id = c.servicio_id;
      if (!serviciosMap[id]) {
        serviciosMap[id] = {
          nombre: c.servicios?.nombre || "Sin nombre",
          color: c.servicios?.color || "#6366f1",
          total: 0,
        };
      }
      serviciosMap[id].total += 1;
    });

    const serviciosDemandados = Object.values(serviciosMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // --- Horarios pico ---
    const horariosMap = {};
    (horariosPeriodoRes.data || []).forEach((c) => {
      const hora = c.hora_inicio?.slice(0, 2);
      if (hora) {
        horariosMap[hora] = (horariosMap[hora] || 0) + 1;
      }
    });

    const horariosPico = [];
    for (let h = 7; h <= 21; h++) {
      const horaStr = String(h).padStart(2, "0");
      horariosPico.push({
        hora: `${horaStr}:00`,
        total: horariosMap[horaStr] || 0,
      });
    }

    // --- Pacientes nuevos vs recurrentes (ultimos 6 meses) ---
    const citasConPaciente = citasConPacienteRes.data || [];
    const primeraVisitaPorPaciente = {};
    citasConPaciente.forEach((c) => {
      if (
        !primeraVisitaPorPaciente[c.paciente_id] ||
        c.fecha < primeraVisitaPorPaciente[c.paciente_id]
      ) {
        primeraVisitaPorPaciente[c.paciente_id] = c.fecha;
      }
    });

    const nuevosRecurrentesPorMes = {};
    citasConPaciente.forEach((c) => {
      const mes = c.fecha.slice(0, 7); // yyyy-MM
      if (!nuevosRecurrentesPorMes[mes]) {
        nuevosRecurrentesPorMes[mes] = { nuevos: new Set(), recurrentes: new Set() };
      }
      const esPrimeraVisita =
        primeraVisitaPorPaciente[c.paciente_id]?.slice(0, 7) === mes;
      if (esPrimeraVisita) {
        nuevosRecurrentesPorMes[mes].nuevos.add(c.paciente_id);
      } else {
        nuevosRecurrentesPorMes[mes].recurrentes.add(c.paciente_id);
      }
    });

    const pacientesNuevosVsRecurrentes = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = subMonths(new Date(), i);
      const mes = format(fecha, "yyyy-MM");
      const data = nuevosRecurrentesPorMes[mes];
      pacientesNuevosVsRecurrentes.push({
        mes: format(fecha, "MMM", { locale: es }),
        nuevos: data?.nuevos?.size || 0,
        recurrentes: data?.recurrentes?.size || 0,
      });
    }

    return {
      error: null,
      data: {
        metricas: {
          citasHoy: citasHoyTotal,
          citasHoyPendientes,
          citasPeriodo: citasPeriodoTotal,
          totalPacientes,
          proximaCita: proximaCita
            ? {
                nombre: proximaCita.paciente_nombre,
                hora: proximaCita.hora_inicio?.slice(0, 5),
                servicio: proximaCita.servicios?.nombre,
              }
            : null,
          ingresosPeriodo,
          tasaAusentismo,
          totalNoAsistio: noAsistio,
        },
        citasPorDia,
        distribucionEstados,
        serviciosDemandados,
        horariosPico,
        pacientesNuevosVsRecurrentes,
      },
    };
  } catch (err) {
    console.error("Error en analytics:", err);
    return { error: "Error al cargar los datos del dashboard", data: null };
  }
}
