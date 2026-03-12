/**
 * Wrapper para envio de emails via Resend.
 * Si RESEND_API_KEY no esta configurada, hace log y retorna sin error.
 */
export async function enviarEmail({ destinatario, asunto, contenido }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log("[Email] RESEND_API_KEY no configurada. Email no enviado:", {
      destinatario,
      asunto,
    });
    return { success: false, error: "RESEND_API_KEY no configurada" };
  }

  if (!destinatario) {
    return { success: false, error: "Destinatario no proporcionado" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const fromEmail = process.env.RESEND_FROM_EMAIL || "TurnoPro <noreply@turnopro.app>";

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: destinatario,
      subject: asunto,
      html: contenido,
    });

    if (error) {
      console.error("[Email] Error de Resend:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email] Error al enviar:", err);
    return { success: false, error: err.message };
  }
}
