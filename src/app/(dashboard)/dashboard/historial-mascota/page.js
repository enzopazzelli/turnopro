import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { HistorialMascotaPage } from "./historial-mascota-page";

export const metadata = { title: "Historial Mascota | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("veterinaria");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historial por Mascota</h1>
      <HistorialMascotaPage />
    </div>
  );
}
