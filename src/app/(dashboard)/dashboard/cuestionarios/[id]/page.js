import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { createClient } from "@/lib/supabase/server";
import { CuestionarioAplicar } from "@/components/rubro/psicologia/cuestionario-aplicar";
import { notFound } from "next/navigation";

export const metadata = { title: "Aplicar Cuestionario | TurnoPro" };

export default async function Page({ params }) {
  const { autorizado, tenantId } = await verificarRubro("psicologia");
  if (!autorizado) return <RubroNoDisponible />;

  const { id } = await params;
  const supabase = await createClient();
  const { data: cuestionario, error } = await supabase
    .from("cuestionarios")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !cuestionario) return notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <CuestionarioAplicar cuestionario={cuestionario} />
    </div>
  );
}
