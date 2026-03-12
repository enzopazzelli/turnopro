import { TIPOS_NOTIFICACION } from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatearFecha(fecha) {
  if (!fecha) return "";
  try {
    const fechaObj = typeof fecha === "string" ? new Date(fecha + "T00:00:00") : fecha;
    return format(fechaObj, "EEEE d 'de' MMMM", { locale: es });
  } catch {
    return fecha;
  }
}

function formatearHora(hora) {
  if (!hora) return "";
  return hora.slice(0, 5);
}

/**
 * Reemplaza variables {paciente}, {profesional}, etc. en un template string.
 */
function aplicarVariables(template, variables) {
  return template
    .replace(/{paciente}/g, variables.paciente_nombre || "Paciente")
    .replace(/{profesional}/g, variables.profesional_nombre || "el profesional")
    .replace(/{consultorio}/g, variables.tenant_nombre || "")
    .replace(/{fecha}/g, variables.fechaStr || "")
    .replace(/{hora}/g, variables.horaStr || "")
    .replace(/{servicio}/g, variables.servicio_nombre || "Consulta")
    .replace(/{motivo}/g, variables.motivoStr || "")
    .trim();
}

/**
 * Genera titulo y mensaje segun el tipo de notificacion.
 * Si el tenant tiene plantillas custom en configuracion.plantillas, las usa.
 * @param {string} tipo - Tipo de notificacion
 * @param {object} contexto - Datos del contexto
 * @param {object} [plantillasCustom] - Plantillas custom del tenant (configuracion.plantillas)
 * @returns {{ titulo: string, mensaje: string }}
 */
export function generarPlantilla(tipo, contexto = {}, plantillasCustom = {}) {
  const {
    paciente_nombre = "Paciente",
    fecha,
    hora_inicio,
    servicio_nombre = "Consulta",
    profesional_nombre = "el profesional",
    tenant_nombre = "",
    monto,
    motivo,
    fecha_anterior,
    hora_anterior,
  } = contexto;

  const fechaStr = formatearFecha(fecha);
  const horaStr = formatearHora(hora_inicio);
  const motivoStr = motivo ? `Motivo: ${motivo}.` : "";

  const vars = { paciente_nombre, profesional_nombre, tenant_nombre, fechaStr, horaStr, servicio_nombre, motivoStr };

  // Check for custom template
  const customTemplate = plantillasCustom?.[tipo];
  if (customTemplate) {
    // Derive titulo from defaults below, but use custom message
    const titulos = {
      [TIPOS_NOTIFICACION.CITA_CREADA]: "Cita agendada",
      [TIPOS_NOTIFICACION.CITA_CONFIRMADA]: "Cita confirmada",
      [TIPOS_NOTIFICACION.CITA_CANCELADA]: "Cita cancelada",
      [TIPOS_NOTIFICACION.CITA_MODIFICADA]: "Cita modificada",
      [TIPOS_NOTIFICACION.CITA_REPROGRAMADA]: "Cita reprogramada",
      [TIPOS_NOTIFICACION.RECORDATORIO_24H]: "Recordatorio: cita manana",
      [TIPOS_NOTIFICACION.RECORDATORIO_2H]: "Recordatorio: cita en 2 horas",
      [TIPOS_NOTIFICACION.RESERVA_NUEVA]: "Nueva reserva recibida",
    };
    return {
      titulo: titulos[tipo] || "Notificacion",
      mensaje: aplicarVariables(customTemplate, vars),
    };
  }

  const plantillas = {
    [TIPOS_NOTIFICACION.CITA_CREADA]: {
      titulo: "Cita agendada",
      mensaje: `Hola ${paciente_nombre}, tu cita de ${servicio_nombre} fue agendada para el ${fechaStr} a las ${horaStr} con ${profesional_nombre}.`,
    },
    [TIPOS_NOTIFICACION.CITA_CONFIRMADA]: {
      titulo: "Cita confirmada",
      mensaje: `Hola ${paciente_nombre}, tu cita de ${servicio_nombre} del ${fechaStr} a las ${horaStr} ha sido confirmada.`,
    },
    [TIPOS_NOTIFICACION.CITA_CANCELADA]: {
      titulo: "Cita cancelada",
      mensaje: `Hola ${paciente_nombre}, tu cita de ${servicio_nombre} del ${fechaStr} a las ${horaStr} ha sido cancelada.${motivoStr ? ` ${motivoStr}` : " Contactanos para reagendar."}`,
    },
    [TIPOS_NOTIFICACION.CITA_MODIFICADA]: {
      titulo: "Cita modificada",
      mensaje: `Hola ${paciente_nombre}, tu cita fue actualizada. Nueva fecha: ${fechaStr} a las ${horaStr} (${servicio_nombre}).${motivoStr ? ` ${motivoStr}` : ""}`,
    },
    [TIPOS_NOTIFICACION.CITA_REPROGRAMADA]: {
      titulo: "Cita reprogramada",
      mensaje: (() => {
        const fechaAntStr = formatearFecha(fecha_anterior);
        const horaAntStr = formatearHora(hora_anterior);
        let msg = `Hola ${paciente_nombre}, tu cita de ${servicio_nombre}`;
        if (fechaAntStr && horaAntStr) {
          msg += ` del ${fechaAntStr} a las ${horaAntStr}`;
        }
        msg += ` fue reprogramada para el ${fechaStr} a las ${horaStr}.`;
        if (motivoStr) msg += ` ${motivoStr}`;
        return msg;
      })(),
    },
    [TIPOS_NOTIFICACION.RECORDATORIO_24H]: {
      titulo: "Recordatorio: cita manana",
      mensaje: `Hola ${paciente_nombre}, te recordamos que tienes una cita de ${servicio_nombre} manana ${fechaStr} a las ${horaStr} con ${profesional_nombre}.`,
    },
    [TIPOS_NOTIFICACION.RECORDATORIO_2H]: {
      titulo: "Recordatorio: cita en 2 horas",
      mensaje: `Hola ${paciente_nombre}, te recordamos que tienes una cita de ${servicio_nombre} hoy a las ${horaStr} con ${profesional_nombre}.`,
    },
    [TIPOS_NOTIFICACION.RESERVA_NUEVA]: {
      titulo: "Nueva reserva recibida",
      mensaje: `${paciente_nombre} reservo una cita de ${servicio_nombre} para el ${fechaStr} a las ${horaStr}.`,
    },
    [TIPOS_NOTIFICACION.PAGO_REGISTRADO]: {
      titulo: "Pago registrado",
      mensaje: monto
        ? `Se registro un pago de $${Number(monto).toLocaleString("es-AR")} para ${paciente_nombre}.`
        : `Se registro un pago para ${paciente_nombre}.`,
    },
    [TIPOS_NOTIFICACION.LISTA_ESPERA_DISPONIBLE]: {
      titulo: "Turno disponible",
      mensaje: `Hola ${paciente_nombre}, se libero un turno de ${servicio_nombre} para el ${fechaStr}. Reservalo antes de que se ocupe.`,
    },
    [TIPOS_NOTIFICACION.CONFIRMACION_CITA]: {
      titulo: "Confirma tu cita",
      mensaje: `Hola ${paciente_nombre}, tienes una cita de ${servicio_nombre} el ${fechaStr} a las ${horaStr} con ${profesional_nombre}. Por favor confirma tu asistencia.`,
    },
    [TIPOS_NOTIFICACION.GENERAL]: {
      titulo: "Notificacion",
      mensaje: contexto.mensaje || "Tienes una nueva notificacion.",
    },
  };

  return plantillas[tipo] || plantillas[TIPOS_NOTIFICACION.GENERAL];
}
