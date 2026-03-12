import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { obtenerVencimientosFiscales } from "@/app/(dashboard)/actions/contadores";
import { VencimientosFiscalesLista } from "@/components/rubro/contadores/vencimientos-fiscales-lista";

export const metadata = { title: "Vencimientos Fiscales | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("contadores");
  if (!autorizado) return <RubroNoDisponible />;

  const { data: vencimientos } = await obtenerVencimientosFiscales();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vencimientos Fiscales</h1>
      <VencimientosFiscalesLista vencimientosIniciales={vencimientos} />
    </div>
  );
}
