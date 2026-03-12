import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  let authError = null;

  console.log("[callback] params:", { code: !!code, token_hash: !!token_hash, type, admin_access: searchParams.get("admin_access") });

  if (code) {
    // Intercambio de código OAuth (Google, etc.)
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (token_hash && type) {
    // Verificación de magic link / OTP
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    authError = error;
    console.log("[callback] verifyOtp error:", error?.message ?? "none");
  } else {
    console.log("[callback] → invalid_callback");
    return NextResponse.redirect(`${origin}/login?error=invalid_callback`);
  }

  if (authError) {
    console.log("[callback] → auth_error:", authError.message);
    return NextResponse.redirect(`${origin}/login?error=auth_error`);
  }

  // Si es un reset de contraseña, redirigir directamente a la página de nueva contraseña
  if (type === "recovery") {
    const next = searchParams.get("next") || "/actualizar-contrasena";
    return NextResponse.redirect(`${origin}${next}`);
  }

  const adminAccess = searchParams.get("admin_access") === "true";

  // Verificar si el usuario tiene perfil completo
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[callback] user:", user?.id ?? "null");

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Usar RPC SECURITY DEFINER para evitar problemas de RLS tras verifyOtp
  const { data: rows } = await supabase.rpc("obtener_perfil_usuario", {
    p_auth_id: user.id,
  });
  const perfil = rows?.[0] ?? null;

  console.log("[callback] perfil:", perfil ? `${perfil.rol}` : "null");

  if (perfil) {
    if (perfil.rol === "superadmin") {
      console.log("[callback] → /superadmin");
      return NextResponse.redirect(`${origin}/superadmin`);
    }
    const destino = adminAccess
      ? `${origin}/dashboard?admin_access=true`
      : `${origin}/dashboard`;
    console.log("[callback] → destino:", destino);
    return NextResponse.redirect(destino);
  } else {
    console.log("[callback] → /onboarding");
    return NextResponse.redirect(`${origin}/onboarding`);
  }
}
