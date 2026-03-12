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

  // Si ya tiene registro en users, redirigir al dashboard
  const { data: existente } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existente) {
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
