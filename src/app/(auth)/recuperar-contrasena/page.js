"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { solicitarRecuperacion } from "@/app/(auth)/actions";

const estadoInicial = { error: null, success: false, message: null };

export default function RecuperarContrasenaPage() {
  const [state, formAction, pending] = useActionState(solicitarRecuperacion, estadoInicial);

  if (state.success) {
    return (
      <Card>
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <p className="font-medium">Email enviado</p>
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al inicio de sesión
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
        <CardDescription>
          Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                className="pl-9"
                required
                autoFocus
              />
            </div>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Enviar link de recuperación"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/login" className="hover:text-foreground transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio de sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
