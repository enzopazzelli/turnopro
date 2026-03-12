"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registrarse } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { generarSlug } from "@/lib/validations/auth";
import { RUBROS } from "@/config/rubros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

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

const estadoInicial = { error: null, fieldErrors: {} };

export function RegistroForm({ planInteres = null }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    registrarse,
    estadoInicial
  );
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  // Manejar redirect desde el server action
  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state.redirectTo, router]);
  const [paso, setPaso] = useState(1);
  const [slug, setSlug] = useState("");
  const [rubroSeleccionado, setRubroSeleccionado] = useState("");
  const [erroresPaso1, setErroresPaso1] = useState({});

  const handleNombreConsultorio = (e) => {
    const valor = e.target.value;
    setSlug(generarSlug(valor));
  };

  function handleSiguiente() {
    const form = document.getElementById("registro-form");
    const nombre = form.querySelector("#nombre_completo")?.value?.trim();
    const email = form.querySelector("#email")?.value?.trim();
    const password = form.querySelector("#password")?.value;

    const errores = {};
    if (!nombre || nombre.length < 2) errores.nombre_completo = "El nombre debe tener al menos 2 caracteres";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.email = "Ingresa un email valido";
    if (!password || password.length < 6) errores.password = "La contrasena debe tener al menos 6 caracteres";

    if (Object.keys(errores).length > 0) {
      setErroresPaso1(errores);
      return;
    }

    setErroresPaso1({});
    setPaso(2);
  }

  // Solo mostrar errores del paso 2 si venimos de un submit real (state.fieldErrors tiene datos)
  const tienErroresPaso2 =
    state.fieldErrors?.nombre_consultorio ||
    state.fieldErrors?.slug ||
    state.fieldErrors?.rubro;

  const tienErroresPaso1 =
    state.fieldErrors?.nombre_completo ||
    state.fieldErrors?.email ||
    state.fieldErrors?.password;

  // Si hay errores del server, ir al paso correspondiente
  const pasoEfectivo =
    tienErroresPaso1 && paso === 2 ? 1 : tienErroresPaso2 && paso === 1 ? 2 : paso;

  return (
    <form
      id="registro-form"
      action={formAction}
      onKeyDown={(e) => {
        if (e.key === "Enter" && pasoEfectivo === 1) {
          e.preventDefault();
          handleSiguiente();
        }
      }}
      className="space-y-4"
    >
      {planInteres && (
        <input type="hidden" name="plan_interes" value={planInteres} />
      )}
      {state.error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {state.error}
        </div>
      )}
      {state.success && state.message && (
        <div className="bg-green-100 text-green-800 text-sm p-3 rounded-md">
          {state.message}
        </div>
      )}

      {/* Google OAuth */}
      <div className={cn(pasoEfectivo !== 1 && "hidden")}>
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
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              o crea tu cuenta con email
            </span>
          </div>
        </div>
      </div>

      {/* Indicador de progreso */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium transition-colors",
            pasoEfectivo >= 1
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {pasoEfectivo > 1 ? <Check className="h-4 w-4" /> : "1"}
        </div>
        <div
          className={cn(
            "flex-1 h-1 rounded-full transition-colors",
            pasoEfectivo >= 2 ? "bg-primary" : "bg-muted"
          )}
        />
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium transition-colors",
            pasoEfectivo >= 2
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          2
        </div>
      </div>

      {/* Paso 1: Datos personales — siempre en DOM, oculto con CSS */}
      <div className={cn(pasoEfectivo !== 1 && "hidden")}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre completo</Label>
            <Input
              id="nombre_completo"
              name="nombre_completo"
              placeholder="Dr. Juan Martinez"
            />
            {(erroresPaso1.nombre_completo || state.fieldErrors?.nombre_completo) && (
              <p className="text-sm text-destructive">
                {erroresPaso1.nombre_completo || state.fieldErrors.nombre_completo[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
            />
            {(erroresPaso1.email || state.fieldErrors?.email) && (
              <p className="text-sm text-destructive">
                {erroresPaso1.email || state.fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <Input id="password" name="password" type="password" />
            {(erroresPaso1.password || state.fieldErrors?.password) && (
              <p className="text-sm text-destructive">
                {erroresPaso1.password || state.fieldErrors.password[0]}
              </p>
            )}
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={handleSiguiente}
          >
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Paso 2: Datos del consultorio — siempre en DOM, oculto con CSS */}
      <div className={cn(pasoEfectivo !== 2 && "hidden")}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_consultorio">Nombre del consultorio</Label>
            <Input
              id="nombre_consultorio"
              name="nombre_consultorio"
              placeholder="Consultorio Martinez"
              onChange={handleNombreConsultorio}
            />
            {state.fieldErrors?.nombre_consultorio && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.nombre_consultorio[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL de tu pagina</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                turnopro.com/
              </span>
              <Input
                id="slug"
                name="slug"
                placeholder="dr-martinez"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            {state.fieldErrors?.slug && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.slug[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Rubro</Label>
            <input type="hidden" name="rubro" value={rubroSeleccionado} />
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(RUBROS).map(([key, rubro]) => {
                const Icono = rubro.icono;
                const seleccionado = rubroSeleccionado === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRubroSeleccionado(key)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm",
                      seleccionado
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icono
                      className="h-6 w-6"
                      style={{ color: rubro.color }}
                    />
                    <span className="font-medium">{rubro.nombre}</span>
                  </button>
                );
              })}
            </div>
            {state.fieldErrors?.rubro && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.rubro[0]}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setPaso(1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atras
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
