import { enviarEmail } from "./email";
import { enviarWhatsApp } from "./whatsapp";
import { CANALES_NOTIFICACION } from "@/lib/constants";

/**
 * Genera HTML simple para emails transaccionales.
 */
export function generarHtmlEmail({ titulo, mensaje, profesional_nombre, tenant_nombre, logo_url, link_confirmacion }) {
  const botonesConfirmacion = link_confirmacion
    ? `
        <div style="margin:20px 0;text-align:center;">
          <a href="${link_confirmacion}&accion=confirmar"
             style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;margin-right:8px;">
            Confirmar asistencia
          </a>
          <a href="${link_confirmacion}&accion=cancelar"
             style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
            No puedo asistir
          </a>
        </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:20px;">
    <tr>
      <td style="background-color:#ffffff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        ${logo_url ? `<img src="${logo_url}" alt="Logo" style="max-height:40px;max-width:120px;margin-bottom:8px;display:block;" />` : ""}
        <h1 style="margin:0 0 8px;font-size:20px;color:#18181b;">
          ${tenant_nombre || "TurnoPro"}
        </h1>
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:16px 0;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#18181b;">${titulo}</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46;">
          ${mensaje}
        </p>
        ${botonesConfirmacion}
        ${profesional_nombre ? `<p style="margin:0;font-size:13px;color:#71717a;">— ${profesional_nombre}</p>` : ""}
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:16px;">
        <p style="margin:0;font-size:12px;color:#a1a1aa;">
          Enviado por TurnoPro
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Despacha una notificacion por el canal indicado.
 * @param {string} canal - 'in_app' | 'email' | 'whatsapp'
 * @param {object} datos
 * @returns {{ success: boolean, error?: string }}
 */
export async function enviarPorCanal(canal, datos) {
  switch (canal) {
    case CANALES_NOTIFICACION.EMAIL: {
      const html = generarHtmlEmail({
        titulo: datos.titulo,
        mensaje: datos.mensaje,
        profesional_nombre: datos.profesional_nombre,
        tenant_nombre: datos.tenant_nombre,
        logo_url: datos.logo_url,
        link_confirmacion: datos.link_confirmacion,
      });
      return enviarEmail({
        destinatario: datos.destinatario_email,
        asunto: datos.titulo,
        contenido: html,
      });
    }

    case CANALES_NOTIFICACION.WHATSAPP: {
      let msg = `*${datos.titulo}*\n\n${datos.mensaje}`;
      if (datos.link_confirmacion) {
        msg += `\n\nConfirmar: ${datos.link_confirmacion}&accion=confirmar`;
        msg += `\nCancelar: ${datos.link_confirmacion}&accion=cancelar`;
      }
      return enviarWhatsApp({
        telefono: datos.destinatario_telefono,
        mensaje: msg,
      });
    }

    case CANALES_NOTIFICACION.IN_APP:
      return { success: true };

    default:
      return { success: false, error: `Canal desconocido: ${canal}` };
  }
}
