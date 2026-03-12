"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { guardarConfiguracionFacturacion } from "@/app/(dashboard)/actions/configuracion";
import { toast } from "sonner";

export function TabFacturacion({ configuracionInicial }) {
  const config = configuracionInicial?.facturacion || {};
  const [nombreNegocio, setNombreNegocio] = useState(config.nombre_negocio || "");
  const [cuit, setCuit] = useState(config.cuit || "");
  const [direccion, setDireccion] = useState(config.direccion || "");
  const [mercadoPagoHabilitado, setMercadoPagoHabilitado] = useState(config.mercado_pago_habilitado || false);
  const [isPending, startTransition] = useTransition();

  const handleGuardar = () => {
    startTransition(async () => {
      const result = await guardarConfiguracionFacturacion({
        nombre_negocio: nombreNegocio,
        cuit,
        direccion,
        mercado_pago_habilitado: mercadoPagoHabilitado,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Configuracion de facturacion guardada");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Datos del recibo */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del recibo</CardTitle>
          <CardDescription>
            Estos datos apareceran en los recibos generados para tus pacientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_negocio">Nombre del negocio/consultorio</Label>
            <Input
              id="nombre_negocio"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              placeholder="Ej: Consultorio Dr. Martinez"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT/CUIL</Label>
              <Input
                id="cuit"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                placeholder="XX-XXXXXXXX-X"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Direccion</Label>
              <Input
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, Ciudad, Provincia"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mercado Pago */}
      <Card>
        <CardHeader>
          <CardTitle>Mercado Pago</CardTitle>
          <CardDescription>
            Habilita la integracion con Mercado Pago para recibir pagos online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mercado Pago habilitado</p>
              <p className="text-xs text-muted-foreground">
                Requiere configurar MERCADOPAGO_ACCESS_TOKEN en las variables de entorno.
              </p>
            </div>
            <Switch
              checked={mercadoPagoHabilitado}
              onCheckedChange={setMercadoPagoHabilitado}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleGuardar} disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar configuracion"}
      </Button>
    </div>
  );
}
