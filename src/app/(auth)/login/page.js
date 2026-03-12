import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Iniciar Sesion</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground mt-4">
          No tienes cuenta?{" "}
          <Link href="/registro" className="text-primary underline">
            Registrate
          </Link>
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/superadmin"
            className="flex items-center gap-1 text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
          >
            <ShieldCheck className="h-2.5 w-2.5" />
            Admin
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
