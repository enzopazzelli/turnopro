import { NextResponse } from "next/server";

/**
 * Webhook de Mercado Pago.
 * Scaffold para futura implementacion completa.
 * En produccion: verificar firma, buscar pago en BD, actualizar estado.
 */
export async function POST(request) {
  try {
    const body = await request.json();

    console.log("[MercadoPago Webhook] Notificacion recibida:", {
      type: body.type,
      action: body.action,
      data_id: body.data?.id,
    });

    // TODO: Implementar logica completa
    // 1. Verificar firma del webhook (x-signature header)
    // 2. Si type === "payment", consultar estado con verificarPago()
    // 3. Buscar pago en BD por mp_payment_id o external_reference
    // 4. Actualizar estado del pago (mp_status)
    // 5. Notificar al profesional

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[MercadoPago Webhook] Error:", err);
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}
