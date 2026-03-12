/**
 * Scaffold de integracion con Mercado Pago.
 * Similar al patron de WhatsApp: si MERCADOPAGO_ACCESS_TOKEN no existe,
 * se loguea y retorna error graceful.
 */

const API_BASE = "https://api.mercadopago.com";

/**
 * Crea una preferencia de pago en Mercado Pago.
 * @param {{ titulo: string, monto: number, email?: string, referencia?: string }} opciones
 */
export async function crearPreferenciaPago({ titulo, monto, email, referencia }) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    console.log("[MercadoPago] MERCADOPAGO_ACCESS_TOKEN no configurado. Preferencia no creada:", {
      titulo,
      monto,
    });
    return { success: false, error: "MERCADOPAGO_ACCESS_TOKEN no configurado" };
  }

  try {
    const response = await fetch(`${API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: titulo,
            quantity: 1,
            unit_price: monto,
            currency_id: "ARS",
          },
        ],
        payer: email ? { email } : undefined,
        external_reference: referencia || undefined,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/facturacion?status=success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/facturacion?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard/facturacion?status=pending`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/webhooks/mercado-pago`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MercadoPago] Error al crear preferencia:", errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      preferencia_id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    };
  } catch (err) {
    console.error("[MercadoPago] Error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Consulta el estado de un pago en Mercado Pago.
 * @param {string} paymentId
 */
export async function verificarPago(paymentId) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    console.log("[MercadoPago] MERCADOPAGO_ACCESS_TOKEN no configurado.");
    return { success: false, error: "MERCADOPAGO_ACCESS_TOKEN no configurado" };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      status: data.status,
      status_detail: data.status_detail,
      monto: data.transaction_amount,
      metodo: data.payment_method_id,
      external_reference: data.external_reference,
    };
  } catch (err) {
    console.error("[MercadoPago] Error al verificar pago:", err);
    return { success: false, error: err.message };
  }
}
