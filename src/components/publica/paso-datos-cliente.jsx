"use client";

import { useState } from "react";
import { useReservaStore } from "@/stores/reserva-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft } from "lucide-react";

export function PasoDatosCliente({ terminoPaciente }) {
  const { setDatosCliente, setPaso, datosCliente } = useReservaStore();
  const [errores, setErrores] = useState({});

  const termino = terminoPaciente || "Paciente";

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datos = {
      paciente_nombre: formData.get("paciente_nombre")?.trim(),
      paciente_telefono: formData.get("paciente_telefono")?.trim(),
      paciente_email: formData.get("paciente_email")?.trim(),
      notas: formData.get("notas")?.trim(),
    };

    const nuevosErrores = {};
    if (!datos.paciente_nombre || datos.paciente_nombre.length < 2) {
      nuevosErrores.paciente_nombre = "Nombre requerido (minimo 2 caracteres)";
    }
    if (
      datos.paciente_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.paciente_email)
    ) {
      nuevosErrores.paciente_email = "Email invalido";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setErrores({});
    setDatosCliente(datos);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Tus datos</h2>
        <p className="text-sm text-muted-foreground">
          Completa tus datos para confirmar el turno
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="space-y-2">
          <Label htmlFor="paciente_nombre">
            Nombre completo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="paciente_nombre"
            name="paciente_nombre"
            placeholder={`Nombre del ${termino.toLowerCase()}`}
            defaultValue={datosCliente?.paciente_nombre || ""}
          />
          {errores.paciente_nombre && (
            <p className="text-sm text-destructive">
              {errores.paciente_nombre}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paciente_telefono">Telefono</Label>
          <Input
            id="paciente_telefono"
            name="paciente_telefono"
            type="tel"
            placeholder="Ej: 11 1234-5678"
            defaultValue={datosCliente?.paciente_telefono || ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paciente_email">Email</Label>
          <Input
            id="paciente_email"
            name="paciente_email"
            type="email"
            placeholder="tu@email.com"
            defaultValue={datosCliente?.paciente_email || ""}
          />
          {errores.paciente_email && (
            <p className="text-sm text-destructive">
              {errores.paciente_email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notas">Notas (opcional)</Label>
          <Textarea
            id="notas"
            name="notas"
            placeholder="Informacion adicional para el profesional..."
            rows={3}
            defaultValue={datosCliente?.notas || ""}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={() => setPaso(3)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Cambiar horario
          </Button>
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </div>
  );
}
