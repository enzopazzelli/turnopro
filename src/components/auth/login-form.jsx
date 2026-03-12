"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { iniciarSesion, enviarMagicLink } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const estadoInicial = { error: null, fieldErrors: {} };

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("auth_error");
  const [modo, setModo] = useState("password"); // "password" | "magic"
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const [statePass, formActionPass, pendingPass] = useActionState(
    iniciarSesion,
    estadoInicial
  );
  const [stateMagic, formActionMagic, pendingMagic] = useActionState(
    enviarMagicLink,
    estadoInicial
  );

  useEffect(() => {
    if (statePass.redirectTo) {
      router.push(statePass.redirectTo);
    }
  }, [statePass.redirectTo, router]);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    // El navegador redirige automáticamente a Google
  };

  return (
    <div className="space-y-4">
      {/* Error de auth (ej: link expirado redirigido desde /) */}
      {authError && (
        <div className="flex items-start gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={loadingGoogle}
      >
        {loadingGoogle ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continuar con Google
      </Button>

      {/* Divisor */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">o</span>
        </div>
      </div>

      {/* Tabs modo */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setModo("password")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            modo === "password"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Con contrasena
        </button>
        <button
          type="button"
          onClick={() => setModo("magic")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            modo === "magic"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Link magico
        </button>
      </div>

      {/* Formulario con contraseña */}
      {modo === "password" && (
        <form action={formActionPass} className="space-y-4">
          {statePass.error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {statePass.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
            />
            {statePass.fieldErrors?.email && (
              <p className="text-sm text-destructive">
                {statePass.fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contrasena</Label>
              <Link
                href="/recuperar-contrasena"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required />
            {statePass.fieldErrors?.password && (
              <p className="text-sm text-destructive">
                {statePass.fieldErrors.password[0]}
              </p>
            )}
          </div>

          <Button className="w-full" type="submit" disabled={pendingPass}>
            {pendingPass ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </Button>
        </form>
      )}

      {/* Formulario magic link */}
      {modo === "magic" && (
        <form action={formActionMagic} className="space-y-4">
          {stateMagic.error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {stateMagic.error}
            </div>
          )}

          {stateMagic.success ? (
            <div className="bg-green-100 text-green-800 text-sm p-4 rounded-md text-center space-y-1">
              <Mail className="h-5 w-5 mx-auto mb-2" />
              <p className="font-medium">Revisa tu email</p>
              <p>{stateMagic.message}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Te enviaremos un link para ingresar sin contrasena.
              </p>
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                />
                {stateMagic.fieldErrors?.email && (
                  <p className="text-sm text-destructive">
                    {stateMagic.fieldErrors.email[0]}
                  </p>
                )}
              </div>
              <Button className="w-full" type="submit" disabled={pendingMagic}>
                {pendingMagic ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar link
                  </>
                )}
              </Button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
