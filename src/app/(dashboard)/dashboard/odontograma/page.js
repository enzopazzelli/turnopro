import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { OdontogramaPage } from "./odontograma-page";

export const metadata = { title: "Odontograma | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("odontologia");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Odontograma</h1>
      <OdontogramaPage />
    </div>
  );
}
