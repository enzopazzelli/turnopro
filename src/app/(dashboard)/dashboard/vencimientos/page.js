import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { obtenerVencimientosLegales } from "@/app/(dashboard)/actions/abogados";
import { VencimientosLista } from "@/components/rubro/abogados/vencimientos-lista";

export const metadata = { title: "Vencimientos Legales | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("abogados");
  if (!autorizado) return <RubroNoDisponible />;

  const { data: vencimientos } = await obtenerVencimientosLegales();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vencimientos Legales</h1>
      <VencimientosLista vencimientos={vencimientos} />
    </div>
  );
}
