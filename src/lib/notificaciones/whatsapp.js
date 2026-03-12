/**
 * Abstraccion para envio de WhatsApp.
 * Si WHATSAPP_API_URL esta configurada, hace POST al servicio externo.
 * Si no, hace console.log (scaffold para futura integracion con Baileys).
 *
 * Nota: Baileys requiere un servidor persistente (no serverless).
 * En produccion se espera un microservicio separado que exponga un endpoint HTTP.
 */
export async function enviarWhatsApp({ telefono, mensaje }) {
  const apiUrl = process.env.WHATSAPP_API_URL;

  if (!telefono) {
    return { success: false, error: "Telefono no proporcionado" };
  }

  if (!apiUrl) {
    console.log("[WhatsApp] WHATSAPP_API_URL no configurada. Mensaje no enviado:", {
      telefono,
      mensaje: mensaje?.slice(0, 80),
    });
    return { success: false, error: "WHATSAPP_API_URL no configurada" };
  }

  try {
    const apiToken = process.env.WHATSAPP_API_TOKEN || "";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      },
      body: JSON.stringify({
        telefono,
        mensaje,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[WhatsApp] Error del servicio:", errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[WhatsApp] Error al enviar:", err);
    return { success: false, error: err.message };
  }
}
