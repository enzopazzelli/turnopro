import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { obtenerMascotas } from "@/app/(dashboard)/actions/veterinaria";
import { MascotasLista } from "@/components/rubro/veterinaria/mascotas-lista";

export const metadata = { title: "Mascotas | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("veterinaria");
  if (!autorizado) return <RubroNoDisponible />;

  const { data: mascotas } = await obtenerMascotas();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mascotas</h1>
      <MascotasLista mascotasIniciales={mascotas} />
    </div>
  );
}
