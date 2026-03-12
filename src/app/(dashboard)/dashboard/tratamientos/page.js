import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { TratamientosPage } from "./tratamientos-page";

export const metadata = { title: "Planes de Tratamiento | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("odontologia");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Planes de Tratamiento</h1>
      <TratamientosPage />
    </div>
  );
}
