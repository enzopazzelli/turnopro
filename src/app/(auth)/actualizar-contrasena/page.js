"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Lock } from "lucide-react";
import { actualizarContrasena } from "@/app/(auth)/actions";

const estadoInicial = { error: null, success: false };

export default function ActualizarContrasenaPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(actualizarContrasena, estadoInicial);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => router.push("/dashboard"), 2500);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  if (state.success) {
    return (
      <Card>
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <p className="font-medium">¡Contraseña actualizada!</p>
          <p className="text-sm text-muted-foreground">
            Tu contraseña fue cambiada exitosamente. Redirigiendo al dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
        <CardDescription>
          Ingresá tu nueva contraseña para completar el restablecimiento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="pl-9"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmacion">Confirmar contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmacion"
                name="confirmacion"
                type="password"
                placeholder="Repetí la contraseña"
                className="pl-9"
                required
              />
            </div>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Guardando..." : "Establecer nueva contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
