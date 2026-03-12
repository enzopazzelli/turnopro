import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PacienteDetalle } from "@/components/pacientes/paciente-detalle";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: paciente } = await supabase
    .from("pacientes")
    .select("nombre_completo")
    .eq("id", id)
    .single();

  return {
    title: paciente
      ? `${paciente.nombre_completo} | TurnoPro`
      : "Paciente | TurnoPro",
  };
}

export default async function PacienteDetallePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: paciente, error: pacienteError } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single();

  if (pacienteError || !paciente) {
    notFound();
  }

  const { data: citas } = await supabase
    .from("citas")
    .select("*, servicios(nombre, color)")
    .eq("paciente_id", id)
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: false });

  return <PacienteDetalle paciente={paciente} citas={citas || []} />;
}
