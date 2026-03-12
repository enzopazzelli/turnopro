import { DollarSign } from "lucide-react";
import { FacturacionCliente } from "@/components/facturacion/facturacion-cliente";
import { verificarFeature, FeatureNoDisponible } from "@/components/rubro/guard-rubro";

export const metadata = {
  title: "Facturacion — TurnoPro",
};

export default async function FacturacionPage() {
  const tieneAcceso = await verificarFeature("facturacion");
  if (!tieneAcceso) return <FeatureNoDisponible feature="facturacion" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Facturacion
        </h1>
        <p className="text-muted-foreground">
          Registra pagos, genera recibos y gestiona la cuenta corriente de tus pacientes.
        </p>
      </div>

      <FacturacionCliente />
    </div>
  );
}
