import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { ConsentimientosCliente } from "./consentimientos-cliente";

export const metadata = { title: "Consentimientos | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("psicologia");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Consentimientos Informados</h1>
      <ConsentimientosCliente />
    </div>
  );
}
