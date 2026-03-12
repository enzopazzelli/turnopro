"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, CheckCircle } from "lucide-react";
import { solicitarDemo } from "@/app/actions/demo";

const rubros = [
  { valor: "odontologia", nombre: "Odontologia" },
  { valor: "medicina", nombre: "Medicina" },
  { valor: "abogados", nombre: "Abogacia" },
  { valor: "veterinaria", nombre: "Veterinaria" },
  { valor: "psicologia", nombre: "Psicologia" },
  { valor: "contadores", nombre: "Contaduria" },
];

const estadoInicial = { error: null, fieldErrors: {}, success: null };

export function FormularioDemo() {
  const [state, formAction, pending] = useActionState(solicitarDemo, estadoInicial);
  const formRef = useRef(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  if (state.success) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-xl font-semibold">Solicitud enviada</h3>
          <p className="text-muted-foreground">
            Nos pondremos en contacto contigo pronto para coordinar una demo personalizada.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Solicita una demo</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demo-nombre">Nombre *</Label>
              <Input
                id="demo-nombre"
                name="nombre"
                placeholder="Tu nombre"
                required
              />
              {state.fieldErrors?.nombre && (
                <p className="text-sm text-destructive">{state.fieldErrors.nombre[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email *</Label>
              <Input
                id="demo-email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
              />
              {state.fieldErrors?.email && (
                <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demo-telefono">Telefono</Label>
              <Input
                id="demo-telefono"
                name="telefono"
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-rubro">Profesion *</Label>
              <Select name="rubro" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {rubros.map((r) => (
                    <SelectItem key={r.valor} value={r.valor}>
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors?.rubro && (
                <p className="text-sm text-destructive">{state.fieldErrors.rubro[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo-mensaje">Mensaje</Label>
            <Textarea
              id="demo-mensaje"
              name="mensaje"
              placeholder="Contanos sobre tu consultorio (opcional)"
              rows={3}
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            <Send className="h-4 w-4 mr-2" />
            {pending ? "Enviando..." : "Solicitar demo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
