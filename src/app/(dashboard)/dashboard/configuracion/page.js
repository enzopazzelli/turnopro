import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerConfiguracion, obtenerEnlacesProfesionales } from "@/app/(dashboard)/actions/configuracion";
import { ConfiguracionCliente } from "@/components/configuracion/configuracion-cliente";

export const metadata = {
  title: "Configuracion | TurnoPro",
};

export default async function ConfiguracionPage() {
  // Solo profesionales pueden acceder a configuracion
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: usuario } = await supabase
      .from("users")
      .select("rol")
      .eq("id", user.id)
      .single();
    if (usuario?.rol === "secretaria") {
      redirect("/dashboard/agenda");
    }
  }

  const [{ data: configuracion }, { data: enlaces }] = await Promise.all([
    obtenerConfiguracion(),
    obtenerEnlacesProfesionales(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra las preferencias de tu consultorio.
        </p>
      </div>

      <ConfiguracionCliente configuracion={configuracion || {}} enlaces={enlaces || []} />
    </div>
  );
}
