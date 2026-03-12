"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SmilePlus,
  Stethoscope,
  Scale,
  PawPrint,
  Brain,
  Calculator,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { completarOnboarding } from "@/app/(auth)/actions-onboarding";

const rubros = [
  { id: "odontologia", nombre: "Odontologia", icono: SmilePlus, color: "#06b6d4" },
  { id: "medicina", nombre: "Medicina", icono: Stethoscope, color: "#ef4444" },
  { id: "abogados", nombre: "Abogacia", icono: Scale, color: "#8b5cf6" },
  { id: "veterinaria", nombre: "Veterinaria", icono: PawPrint, color: "#22c55e" },
  { id: "psicologia", nombre: "Psicologia", icono: Brain, color: "#f59e0b" },
  { id: "contadores", nombre: "Contaduria", icono: Calculator, color: "#3b82f6" },
];

const estadoInicial = { error: null, fieldErrors: {} };

export function OnboardingWizard() {
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState({
    rubro: "",
    nombre_completo: "",
    especialidad: "",
    telefono: "",
    nombre_consultorio: "",
    slug: "",
  });

  const [state, formAction, pending] = useActionState(completarOnboarding, estadoInicial);
  const formRef = useRef(null);

  function actualizar(campo, valor) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));

    // Auto-generar slug desde nombre consultorio
    if (campo === "nombre_consultorio") {
      const slug = valor
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 50);
      setDatos((prev) => ({ ...prev, nombre_consultorio: valor, slug }));
    }
  }

  const pasos = [
    { titulo: "Profesion", descripcion: "Selecciona tu rubro" },
    { titulo: "Datos personales", descripcion: "Tu informacion profesional" },
    { titulo: "Consultorio", descripcion: "Configura tu consultorio" },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center gap-2">
        {pasos.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i + 1 <= paso
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < pasos.length - 1 && (
              <div
                className={`h-0.5 w-8 ${
                  i + 1 < paso ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{pasos[paso - 1].titulo}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {pasos[paso - 1].descripcion}
          </p>
        </CardHeader>
        <CardContent>
          {/* Paso 1: Seleccionar rubro */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {rubros.map((rubro) => {
                  const Icono = rubro.icono;
                  const seleccionado = datos.rubro === rubro.id;
                  return (
                    <Card
                      key={rubro.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        seleccionado ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => actualizar("rubro", rubro.id)}
                    >
                      <CardContent className="flex flex-col items-center gap-2 py-4">
                        <Icono className="h-8 w-8" style={{ color: rubro.color }} />
                        <span className="text-sm font-medium">{rubro.nombre}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Button
                className="w-full"
                disabled={!datos.rubro}
                onClick={() => setPaso(2)}
              >
                Continuar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Paso 2: Datos personales */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre completo *</Label>
                <Input
                  id="nombre_completo"
                  value={datos.nombre_completo}
                  onChange={(e) => actualizar("nombre_completo", e.target.value)}
                  placeholder="Dr. Juan Martinez"
                />
                {state.fieldErrors?.nombre_completo && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.nombre_completo[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidad">Especialidad</Label>
                <Input
                  id="especialidad"
                  value={datos.especialidad}
                  onChange={(e) => actualizar("especialidad", e.target.value)}
                  placeholder="Ej: Ortodoncista, Penalista, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Telefono</Label>
                <Input
                  id="telefono"
                  value={datos.telefono}
                  onChange={(e) => actualizar("telefono", e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPaso(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atras
                </Button>
                <Button
                  className="flex-1"
                  disabled={!datos.nombre_completo}
                  onClick={() => setPaso(3)}
                >
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Paso 3: Datos consultorio */}
          {paso === 3 && (
            <form ref={formRef} action={formAction} className="space-y-4">
              {/* Hidden fields para los datos anteriores */}
              <input type="hidden" name="rubro" value={datos.rubro} />
              <input type="hidden" name="nombre_completo" value={datos.nombre_completo} />
              <input type="hidden" name="especialidad" value={datos.especialidad} />
              <input type="hidden" name="telefono" value={datos.telefono} />

              <div className="space-y-2">
                <Label htmlFor="nombre_consultorio">Nombre del consultorio *</Label>
                <Input
                  id="nombre_consultorio"
                  name="nombre_consultorio"
                  value={datos.nombre_consultorio}
                  onChange={(e) => actualizar("nombre_consultorio", e.target.value)}
                  placeholder="Consultorio Dr. Martinez"
                />
                {state.fieldErrors?.nombre_consultorio && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.nombre_consultorio[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL personalizada *</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">turnopro.com/</span>
                  <Input
                    id="slug"
                    name="slug"
                    value={datos.slug}
                    onChange={(e) =>
                      setDatos((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="dr-martinez"
                  />
                </div>
                {state.fieldErrors?.slug && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.slug[0]}
                  </p>
                )}
              </div>

              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setPaso(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atras
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={pending || !datos.nombre_consultorio || !datos.slug}
                >
                  {pending ? "Configurando..." : "Completar registro"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
