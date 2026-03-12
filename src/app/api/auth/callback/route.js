import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  let authError = null;

  if (code) {
    // Intercambio de código OAuth (Google, etc.)
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (token_hash && type) {
    // Verificación de magic link / OTP
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    authError = error;
  } else {
    return NextResponse.redirect(`${origin}/login?error=invalid_callback`);
  }

  if (authError) {
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

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  const { data: perfil } = await supabase
    .from("users")
    .select("id, rol")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (perfil) {
    if (perfil.rol === "superadmin") {
      return NextResponse.redirect(`${origin}/superadmin`);
    }
    const destino = adminAccess
      ? `${origin}/dashboard?admin_access=true`
      : `${origin}/dashboard`;
    return NextResponse.redirect(destino);
  } else {
    // Usuario nuevo sin perfil → completar onboarding
    return NextResponse.redirect(`${origin}/onboarding`);
  }
}
