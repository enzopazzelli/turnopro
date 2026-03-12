import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { obtenerMascotaDetalle } from "@/app/(dashboard)/actions/veterinaria";
import { MascotaDetalle } from "@/components/rubro/veterinaria/mascota-detalle";
import { notFound } from "next/navigation";

export const metadata = { title: "Mascota | TurnoPro" };

export default async function Page({ params }) {
  const { autorizado } = await verificarRubro("veterinaria");
  if (!autorizado) return <RubroNoDisponible />;

  const { id } = await params;
  const { data: mascota, error } = await obtenerMascotaDetalle(id);

  if (error || !mascota) return notFound();

  return <MascotaDetalle mascota={mascota} />;
}
