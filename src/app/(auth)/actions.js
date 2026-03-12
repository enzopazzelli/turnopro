"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, registroSchema } from "@/lib/validations/auth";
import { registrarAuditLog } from "@/lib/audit";

export async function iniciarSesion(prevState, formData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const resultado = loginSchema.safeParse(rawData);

  if (!resultado.success) {
    return {
      error: null,
      fieldErrors: resultado.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: resultado.data.email,
    password: resultado.data.password,
  });

  if (error) {
    return {
      error: "Email o contrasena incorrectos",
      fieldErrors: {},
    };
  }

  // Audit log + detectar rol para redirect
  let redirectTo = "/dashboard";
  if (authData?.user) {
    const { data: usuario } = await supabase
      .from("users")
      .select("id, tenant_id, rol")
      .eq("auth_id", authData.user.id)
      .single();
    if (usuario) {
      await registrarAuditLog({
        tenant_id: usuario.tenant_id,
        user_id: usuario.id,
        accion: "login",
        datos: { email: resultado.data.email },
      });
      if (usuario.rol === "superadmin") redirectTo = "/superadmin";
    }
  }

  return {
    error: null,
    fieldErrors: {},
    redirectTo,
  };
}

export async function registrarse(prevState, formData) {
  const planInteres = formData.get("plan_interes") || null;
  const rawData = {
    nombre_completo: formData.get("nombre_completo"),
    email: formData.get("email"),
    password: formData.get("password"),
    nombre_consultorio: formData.get("nombre_consultorio"),
    slug: formData.get("slug"),
    rubro: formData.get("rubro"),
  };

  const resultado = registroSchema.safeParse(rawData);

  if (!resultado.success) {
    return {
      error: null,
      fieldErrors: resultado.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Verificar si el slug ya existe antes de crear el auth user
  const { data: slugExiste } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", resultado.data.slug)
    .maybeSingle();

  if (slugExiste) {
    return {
      error: "Este slug ya esta en uso, elige otro",
      fieldErrors: {},
    };
  }

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: resultado.data.email,
    password: resultado.data.password,
  });

  if (authError) {
    return {
      error: authError.message === "User already registered"
        ? "Este email ya esta registrado"
        : authError.message,
      fieldErrors: {},
    };
  }

  // Supabase devuelve un user "fake" con identities vacío si el email ya existe
  // (para prevenir enumeración de emails cuando email confirmation está activado)
  if (!authData.user || authData.user.identities?.length === 0) {
    return {
      error: "Este email ya esta registrado. Si ya te registraste, revisa tu email para confirmar tu cuenta.",
      fieldErrors: {},
    };
  }

  // 2. Crear tenant + user + professional atomicamente
  const { data: rpcData, error: rpcError } = await supabase.rpc("registrar_profesional", {
    p_auth_id: authData.user.id,
    p_email: resultado.data.email,
    p_nombre_completo: resultado.data.nombre_completo,
    p_nombre_consultorio: resultado.data.nombre_consultorio,
    p_slug: resultado.data.slug,
    p_rubro: resultado.data.rubro,
  });

  if (rpcError) {
    const mensajeSlug = rpcError.message.includes("slug")
      ? "Este slug ya esta en uso, elige otro"
      : "Error al crear la cuenta. Intenta de nuevo.";
    return {
      error: mensajeSlug,
      fieldErrors: {},
    };
  }

  // Guardar plan_interes en configuracion del tenant si vino desde precios
  if (planInteres && rpcData?.tenant_id) {
    try {
      const admin = createAdminClient();
      const { data: t } = await admin.from("tenants").select("configuracion").eq("id", rpcData.tenant_id).single();
      await admin.from("tenants").update({
        configuracion: { ...(t?.configuracion || {}), plan_interes: planInteres },
      }).eq("id", rpcData.tenant_id);
    } catch (_) {
      // No bloquear el registro si esto falla
    }
  }

  // Si no hay session (email confirmation habilitado), informar al usuario
  if (!authData.session) {
    return {
      error: null,
      fieldErrors: {},
      success: true,
      message: "Cuenta creada. Revisa tu email para confirmar tu cuenta antes de iniciar sesion.",
    };
  }

  // Devolver exito con redirect — NO usar redirect() dentro de useActionState
  // porque causa "An unexpected response was received from the server"
  return {
    error: null,
    fieldErrors: {},
    success: true,
    redirectTo: "/dashboard",
  };
}

export async function enviarMagicLink(prevState, formData) {
  const email = formData.get("email") || "";

  const resultado = z.string().email("Ingresa un email valido").safeParse(email);

  if (!resultado.success) {
    return {
      error: "Ingresa un email valido",
      fieldErrors: { email: ["Ingresa un email valido"] },
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: resultado.data,
    options: {
      emailRedirectTo: `${siteUrl}/api/auth/callback`,
    },
  });

  if (error) {
    return {
      error: "No se pudo enviar el link. Intenta de nuevo.",
      fieldErrors: {},
    };
  }

  return {
    error: null,
    fieldErrors: {},
    success: true,
    message: `Te enviamos un link a ${resultado.data}. Revisa tu bandeja de entrada.`,
  };
}

export async function solicitarRecuperacion(prevState, formData) {
  const email = (formData.get("email") || "").trim();
  const resultado = z.string().email("Ingresa un email válido").safeParse(email);

  if (!resultado.success) {
    return { error: "Ingresa un email válido", success: false };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(resultado.data, {
    redirectTo: `${siteUrl}/api/auth/callback`,
  });

  // Siempre devolvemos éxito para no revelar si el email existe
  if (error) console.error("Error enviando recovery:", error);

  return {
    error: null,
    success: true,
    message: `Si existe una cuenta con ${resultado.data}, recibirás un email con el link para restablecer tu contraseña.`,
  };
}

export async function actualizarContrasena(prevState, formData) {
  const password = formData.get("password") || "";
  const confirmacion = formData.get("confirmacion") || "";

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres", success: false };
  }
  if (password !== confirmacion) {
    return { error: "Las contraseñas no coinciden", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "No se pudo actualizar la contraseña. El link puede haber expirado.", success: false };
  }

  return { error: null, success: true };
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
