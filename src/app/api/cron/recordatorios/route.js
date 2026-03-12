import { createClient } from "@supabase/supabase-js";
import { generarPlantilla } from "@/lib/notificaciones/plantillas";
import { enviarPorCanal } from "@/lib/notificaciones/canales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron endpoint para enviar recordatorios de citas.
 * Usa Supabase Admin client (service role key) para bypass RLS.
 * Protegido por CRON_SECRET en header Authorization.
 */
export async function GET(request) {
  // Verificar autenticacion
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: "Variables de entorno de Supabase no configuradas" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const resultados = {
    recordatorio_24h: { enviados: 0, errores: 0 },
    recordatorio_2h: { enviados: 0, errores: 0 },
  };

  // Procesar recordatorios de 24h
  await procesarRecordatorios(supabase, 24, "recordatorio_24h", resultados);

  // Procesar recordatorios de 2h
  await procesarRecordatorios(supabase, 2, "recordatorio_2h", resultados);

  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    resultados,
  });
}

async function procesarRecordatorios(supabase, horas, tipo, resultados) {
  try {
    const { data: citas, error } = await supabase.rpc(
      "obtener_citas_para_recordatorio",
      { p_horas: horas, p_tipo: tipo }
    );

    if (error) {
      console.error(`[Cron] Error al obtener citas para ${tipo}:`, error);
      return;
    }

    if (!citas || citas.length === 0) return;

    for (const cita of citas) {
      try {
        // Verificar si el tenant tiene recordatorios habilitados
        const { data: tenant } = await supabase
          .from("tenants")
          .select("configuracion")
          .eq("id", cita.tenant_id)
          .single();

        const config = tenant?.configuracion?.notificaciones || {};
        const recordatorioActivo = tipo === "recordatorio_24h"
          ? config.recordatorio_24h !== false
          : config.recordatorio_2h === true;

        if (!recordatorioActivo) continue;

        const contexto = {
          paciente_nombre: cita.paciente_nombre,
          fecha: cita.fecha,
          hora_inicio: cita.hora_inicio,
          servicio_nombre: cita.servicio_nombre,
          profesional_nombre: cita.profesional_nombre,
          tenant_nombre: cita.tenant_nombre,
        };

        const { titulo, mensaje } = generarPlantilla(tipo, contexto);

        // Insertar notificacion en BD
        await supabase.rpc("crear_notificacion_sistema", {
          p_tenant_id: cita.tenant_id,
          p_destinatario_nombre: cita.paciente_nombre,
          p_destinatario_email: cita.paciente_email,
          p_destinatario_telefono: cita.paciente_telefono,
          p_tipo: tipo,
          p_titulo: titulo,
          p_mensaje: mensaje,
          p_canal: "email",
          p_cita_id: cita.cita_id,
          p_metadata: contexto,
        });

        // Enviar por email si hay email
        if (cita.paciente_email && config.email_habilitado !== false) {
          await enviarPorCanal("email", {
            destinatario_email: cita.paciente_email,
            titulo,
            mensaje,
            profesional_nombre: cita.profesional_nombre,
            tenant_nombre: cita.tenant_nombre,
          });
        }

        // Enviar por WhatsApp si habilitado y hay telefono
        if (cita.paciente_telefono && config.whatsapp_habilitado) {
          await enviarPorCanal("whatsapp", {
            destinatario_telefono: cita.paciente_telefono,
            titulo,
            mensaje,
          });
        }

        resultados[tipo].enviados++;
      } catch (citaErr) {
        console.error(`[Cron] Error procesando cita ${cita.cita_id}:`, citaErr);
        resultados[tipo].errores++;
      }
    }
  } catch (err) {
    console.error(`[Cron] Error general en ${tipo}:`, err);
  }
}
