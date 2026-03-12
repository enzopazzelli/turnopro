import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { HistoriaDentalPage } from "./historia-dental-page";

export const metadata = { title: "Historia Dental | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("odontologia");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historia Clinica Dental</h1>
      <HistoriaDentalPage />
    </div>
  );
}
