import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { obtenerExpedienteDetalle } from "@/app/(dashboard)/actions/abogados";
import { ExpedienteDetalle } from "@/components/rubro/abogados/expediente-detalle";
import { notFound } from "next/navigation";

export const metadata = { title: "Expediente | TurnoPro" };

export default async function Page({ params }) {
  const { autorizado } = await verificarRubro("abogados");
  if (!autorizado) return <RubroNoDisponible />;

  const { id } = await params;
  const { data: expediente, error } = await obtenerExpedienteDetalle(id);

  if (error || !expediente) return notFound();

  return <ExpedienteDetalle expediente={expediente} />;
}
