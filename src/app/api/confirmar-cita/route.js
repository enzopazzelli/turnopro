import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Usar admin client para bypasear RLS
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const accion = searchParams.get("accion"); // "confirmar" o "cancelar"

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Buscar cita por token
  const { data: cita, error } = await supabase
    .from("citas")
    .select("id, estado, paciente_nombre, fecha, hora_inicio")
    .eq("token_confirmacion", token)
    .single();

  if (error || !cita) {
    return new Response(paginaHTML("Enlace invalido", "El enlace de confirmacion no es valido o ya fue utilizado.", "error"), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (cita.estado !== "pendiente_confirmacion") {
    const estadoMsg = cita.estado === "confirmada" ? "ya fue confirmada" : `tiene estado "${cita.estado}"`;
    return new Response(paginaHTML("Cita ya procesada", `Esta cita ${estadoMsg}.`, "info"), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (accion === "cancelar") {
    await supabase
      .from("citas")
      .update({ estado: "cancelada", motivo: "Cancelada por el paciente", token_confirmacion: null })
      .eq("id", cita.id);

    return new Response(paginaHTML("Cita cancelada", `Tu cita del ${cita.fecha} ha sido cancelada. Puedes contactar al consultorio para reprogramar.`, "cancelada"), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Confirmar
  await supabase
    .from("citas")
    .update({ estado: "confirmada", token_confirmacion: null })
    .eq("id", cita.id);

  return new Response(paginaHTML("Cita confirmada", `Gracias ${cita.paciente_nombre}, tu cita del ${cita.fecha} a las ${cita.hora_inicio?.slice(0, 5)} ha sido confirmada.`, "confirmada"), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function paginaHTML(titulo, mensaje, tipo) {
  const colores = {
    confirmada: { bg: "#f0fdf4", border: "#86efac", icon: "✓", iconColor: "#16a34a" },
    cancelada: { bg: "#fef2f2", border: "#fca5a5", icon: "✕", iconColor: "#dc2626" },
    error: { bg: "#fef2f2", border: "#fca5a5", icon: "!", iconColor: "#dc2626" },
    info: { bg: "#eff6ff", border: "#93c5fd", icon: "ℹ", iconColor: "#2563eb" },
  };
  const c = colores[tipo] || colores.info;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} — TurnoPro</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f9fafb; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 1rem; }
    .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 420px; width: 100%; padding: 2rem; text-align: center; }
    .icon { width: 48px; height: 48px; border-radius: 50%; background: ${c.bg}; border: 2px solid ${c.border}; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem; color: ${c.iconColor}; }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; color: #111827; }
    p { color: #6b7280; font-size: 0.875rem; line-height: 1.5; margin: 0; }
    .brand { margin-top: 1.5rem; font-size: 0.75rem; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${c.icon}</div>
    <h1>${titulo}</h1>
    <p>${mensaje}</p>
    <p class="brand">TurnoPro</p>
  </div>
</body>
</html>`;
}
