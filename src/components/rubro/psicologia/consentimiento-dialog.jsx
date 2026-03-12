"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { crearConsentimiento } from "@/app/(dashboard)/actions/psicologia";

const TEMPLATE_DEFAULT = `CONSENTIMIENTO INFORMADO PARA TRATAMIENTO PSICOLÓGICO

El/La abajo firmante declara haber sido informado/a de:

1. La naturaleza y objetivos del tratamiento psicológico propuesto.
2. Los procedimientos, técnicas y metodologías a utilizar.
3. Los beneficios esperados y posibles riesgos o efectos secundarios.
4. El carácter confidencial de la información compartida, con las excepciones legales vigentes.
5. Su derecho a interrumpir el tratamiento en cualquier momento sin necesidad de justificación.
6. El encuadre terapéutico: frecuencia de sesiones, honorarios y modalidad de pago.

En consecuencia, presto mi conformidad para iniciar y continuar el proceso terapéutico con el/la profesional tratante.`;

const estadoInicial = { error: null, success: false };

export function ConsentimientoDialog({ abierto, onCerrar, pacienteId, pacienteNombre }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearConsentimiento, estadoInicial);
  const [firmado, setFirmado] = useState(false);

  useEffect(() => {
    if (state.success) { router.refresh(); onCerrar(); }
  }, [state.success, router, onCerrar]);

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo consentimiento informado</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="paciente_id" value={pacienteId || ""} />
          <input type="hidden" name="paciente_nombre" value={pacienteNombre || ""} />
          <input type="hidden" name="firmado" value={firmado ? "true" : "false"} />

          <div className="space-y-2">
            <Label htmlFor="contenido">Texto del consentimiento *</Label>
            <Textarea
              id="contenido"
              name="contenido"
              rows={14}
              defaultValue={TEMPLATE_DEFAULT}
              className="font-mono text-xs"
              required
            />
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/40">
            <Switch
              id="firmado"
              checked={firmado}
              onCheckedChange={setFirmado}
            />
            <Label htmlFor="firmado" className="cursor-pointer">
              Marcar como firmado por el paciente (fecha de hoy)
            </Label>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar consentimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
