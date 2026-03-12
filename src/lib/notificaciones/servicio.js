"use server";

import { createClient } from "@/lib/supabase/server";
import { generarPlantilla } from "./plantillas";
import { enviarPorCanal } from "./canales";
import { CANALES_NOTIFICACION } from "@/lib/constants";

/**
 * Funcion principal de notificaciones. Fire-and-forget: nunca lanza error.
 *
 * @param {object} opciones
 * @param {string} opciones.tenant_id - ID del tenant
 * @param {string} opciones.tipo - Tipo de notificacion (cita_creada, etc.)
 * @param {object} opciones.contexto - Datos para la plantilla (paciente_nombre, fecha, etc.)
 * @param {string} [opciones.usuario_id] - ID del usuario destinatario (para in_app)
 * @param {string} [opciones.destinatario_nombre] - Nombre del destinatario
 * @param {string} [opciones.destinatario_email] - Email del destinatario
 * @param {string} [opciones.destinatario_telefono] - Telefono del destinatario
 * @param {string} [opciones.cita_id] - ID de la cita relacionada
 * @param {string[]} [opciones.canales] - Canales especificos a usar (override config)
 * @param {string} [opciones.link_confirmacion] - Link para confirmar/cancelar cita
 */
export async function notificar(opciones) {
  try {
    const {
      tenant_id,
      tipo,
      contexto = {},
      usuario_id,
      destinatario_nombre,
      destinatario_email,
      destinatario_telefono,
      cita_id,
      canales: canalesOverride,
      link_confirmacion,
    } = opciones;

    if (!tenant_id || !tipo) {
      console.warn("[Notificaciones] tenant_id y tipo son requeridos");
      return;
    }

    // Leer configuracion del tenant (needed for channels + custom templates)
    const supabase = await createClient();
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("configuracion")
      .eq("id", tenant_id)
      .single();

    const tenantConfig = tenantData?.configuracion || {};

    // Generar contenido del mensaje (with custom templates if set)
    const { titulo, mensaje } = generarPlantilla(tipo, contexto, tenantConfig.plantillas);

    // Determinar canales habilitados
    let canalesActivos = canalesOverride;

    if (!canalesActivos) {
      const config = tenantConfig.notificaciones || {};

      canalesActivos = [];

      // In-app siempre activo si hay usuario_id
      if (usuario_id) {
        canalesActivos.push(CANALES_NOTIFICACION.IN_APP);
      }

      // Email si esta habilitado y hay destinatario
      if (config.email_habilitado !== false && destinatario_email) {
        canalesActivos.push(CANALES_NOTIFICACION.EMAIL);
      }

      // WhatsApp si esta habilitado y hay telefono
      if (config.whatsapp_habilitado && destinatario_telefono) {
        canalesActivos.push(CANALES_NOTIFICACION.WHATSAPP);
      }
    }

    // Enviar por cada canal
    for (const canal of canalesActivos) {
      try {
        // Insertar registro en BD via RPC (bypass RLS)
        const supabase = await createClient();
        const { data: notifId } = await supabase.rpc("crear_notificacion_sistema", {
          p_tenant_id: tenant_id,
          p_usuario_id: usuario_id || null,
          p_destinatario_nombre: destinatario_nombre || contexto.paciente_nombre || null,
          p_destinatario_email: destinatario_email || null,
          p_destinatario_telefono: destinatario_telefono || null,
          p_tipo: tipo,
          p_titulo: titulo,
          p_mensaje: mensaje,
          p_canal: canal,
          p_cita_id: cita_id || null,
          p_metadata: contexto,
        });

        // Despachar por canal externo (email, whatsapp)
        if (canal !== CANALES_NOTIFICACION.IN_APP) {
          const consultorio = tenantConfig.consultorio || {};
          const resultado = await enviarPorCanal(canal, {
            destinatario_email,
            destinatario_telefono,
            titulo,
            mensaje,
            profesional_nombre: contexto.profesional_nombre,
            tenant_nombre: consultorio.nombre || contexto.tenant_nombre,
            logo_url: consultorio.logo_url,
            link_confirmacion,
          });

          // Actualizar estado de la notificacion
          if (notifId) {
            const updateData = resultado.success
              ? { estado: "enviada" }
              : { estado: "fallida", error_detalle: resultado.error };

            await supabase
              .from("notificaciones")
              .update(updateData)
              .eq("id", notifId);
          }
        }
      } catch (canalErr) {
        console.error(`[Notificaciones] Error en canal ${canal}:`, canalErr);
      }
    }
  } catch (err) {
    console.error("[Notificaciones] Error general:", err);
  }
}
