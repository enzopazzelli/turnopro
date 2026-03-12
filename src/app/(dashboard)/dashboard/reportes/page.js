import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReportesCliente } from "@/components/reportes/reportes-cliente";
import { verificarFeature, FeatureNoDisponible } from "@/components/rubro/guard-rubro";

export const metadata = {
  title: "Reportes | TurnoPro",
};

export default async function ReportesPage() {
  // Solo profesionales pueden ver reportes
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: u } = await supabase.from("users").select("rol").eq("id", user.id).single();
    if (u?.rol === "secretaria") redirect("/dashboard/agenda");
  }

  const tieneAcceso = await verificarFeature("reportes_avanzados");
  if (!tieneAcceso) return <FeatureNoDisponible feature="reportes_avanzados" />;

  return <ReportesCliente />;
}
