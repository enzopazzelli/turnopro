import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { RegistroForm } from "@/components/auth/registro-form";

const PLAN_LABELS = {
  basico: "Básico — $5.000/mes",
  profesional: "Profesional — $12.000/mes",
  premium: "Premium — $25.000/mes",
};

export default async function RegistroPage({ searchParams }) {
  const params = await searchParams;
  const planInteres = PLAN_LABELS[params?.plan] ? params.plan : null;

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>
          Registrate para comenzar a gestionar tus citas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {planInteres && (
          <div className="mb-4 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm">
            <p className="font-medium text-primary">Plan seleccionado: {PLAN_LABELS[planInteres]}</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Tu cuenta empieza en período de prueba. Te contactaremos para activar el plan.
            </p>
          </div>
        )}
        <RegistroForm planInteres={planInteres} />
        <p className="text-center text-sm text-muted-foreground mt-4">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="text-primary underline">
            Inicia sesion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
