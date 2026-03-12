import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { DocumentosClienteCliente } from "./documentos-cliente-cliente";

export const metadata = { title: "Repositorio de Documentos | TurnoPro" };

export default async function Page() {
  const { autorizado } = await verificarRubro("contadores");
  if (!autorizado) return <RubroNoDisponible />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Repositorio de Documentos</h1>
        <p className="text-muted-foreground text-sm">Archivos organizados por cliente y categoría.</p>
      </div>
      <DocumentosClienteCliente />
    </div>
  );
}
