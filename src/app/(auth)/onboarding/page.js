import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/auth/onboarding-wizard";
import { CalendarDays } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Completar registro | ${APP_NAME}`,
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Si ya tiene registro en users, redirigir al destino correcto
  // RPC SECURITY DEFINER bypasea RLS sin depender del admin client
  const { data: rows } = await supabase.rpc("obtener_perfil_usuario", {
    p_auth_id: user.id,
  });
  const existente = rows?.[0] ?? null;

  if (existente) {
    if (existente.rol === "superadmin") redirect("/superadmin");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-8">
        <CalendarDays className="h-8 w-8 text-primary" />
        <span className="font-bold text-2xl">{APP_NAME}</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Bienvenido a {APP_NAME}</h1>
        <p className="text-muted-foreground mt-2">
          Completa tu perfil para empezar a usar la plataforma.
        </p>
      </div>

      <OnboardingWizard />
    </div>
  );
}
