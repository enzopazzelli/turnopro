import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { obtenerCuestionarios } from "@/app/(dashboard)/actions/psicologia";
import { CuestionariosLista } from "@/components/rubro/psicologia/cuestionarios-lista";

export const metadata = { title: "Cuestionarios | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("psicologia");
  if (!autorizado) return <RubroNoDisponible />;

  const { data: cuestionarios } = await obtenerCuestionarios();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cuestionarios</h1>
      <CuestionariosLista cuestionarios={cuestionarios} />
    </div>
  );
}
