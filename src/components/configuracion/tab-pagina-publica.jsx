"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download, Share2, QrCode, ExternalLink } from "lucide-react";
import { guardarConfiguracionPaginaPublica } from "@/app/(dashboard)/actions/configuracion";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

export function TabPaginaPublica({ configuracionInicial }) {
  const tenant = useAuthStore((s) => s.tenant);
  const slug = tenant?.slug;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const urlPublica = slug ? `${baseUrl}/${slug}` : "";

  const configPP = configuracionInicial?.pagina_publica || {};

  const [config, setConfig] = useState({
    mensaje_bienvenida: configPP.mensaje_bienvenida || "",
    instagram: configPP.instagram || "",
    facebook: configPP.facebook || "",
    whatsapp: configPP.whatsapp || "",
    color_primario: configPP.color_primario || "#2563eb",
    mostrar_precios: configPP.mostrar_precios !== false,
    mostrar_horarios: configPP.mostrar_horarios !== false,
  });

  const [guardando, setGuardando] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  // Generar QR
  useEffect(() => {
    if (urlPublica) {
      QRCode.toDataURL(urlPublica, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [urlPublica]);

  function actualizar(campo, valor) {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleGuardar() {
    setGuardando(true);
    const { error } = await guardarConfiguracionPaginaPublica(config);
    setGuardando(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Configuracion de pagina publica guardada");
    }
  }

  function copiarUrl() {
    navigator.clipboard.writeText(urlPublica);
    toast.success("URL copiada al portapapeles");
  }

  function compartirWhatsApp() {
    const mensaje = encodeURIComponent(
      `Reserva tu turno online: ${urlPublica}`
    );
    window.open(`https://wa.me/?text=${mensaje}`, "_blank");
  }

  function descargarQR() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = qrDataUrl;
    link.click();
  }

  return (
    <div className="space-y-6">
      {/* URL y QR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Tu pagina publica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={urlPublica} readOnly className="flex-1" />
            <Button variant="outline" size="icon" onClick={copiarUrl} title="Copiar URL">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" asChild title="Abrir pagina">
              <a href={urlPublica} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {qrDataUrl && (
              <div className="border rounded-lg p-2">
                <img src={qrDataUrl} alt="Codigo QR" className="w-48 h-48" />
              </div>
            )}
            <div className="space-y-3">
              <Button variant="outline" onClick={descargarQR}>
                <Download className="h-4 w-4 mr-2" />
                Descargar QR (PNG)
              </Button>
              <Button variant="outline" onClick={compartirWhatsApp} className="block">
                <Share2 className="h-4 w-4 mr-2 inline" />
                Compartir por WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalizacion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personalizacion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mensaje_bienvenida">Mensaje de bienvenida</Label>
            <Textarea
              id="mensaje_bienvenida"
              value={config.mensaje_bienvenida}
              onChange={(e) => actualizar("mensaje_bienvenida", e.target.value)}
              placeholder="Ej: Bienvenido a nuestro consultorio. Reserva tu turno online."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color_primario">Color primario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="color_primario"
                  value={config.color_primario}
                  onChange={(e) => actualizar("color_primario", e.target.value)}
                  className="h-10 w-10 rounded cursor-pointer"
                />
                <Input
                  value={config.color_primario}
                  onChange={(e) => actualizar("color_primario", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Mostrar precios de servicios</Label>
              <p className="text-xs text-muted-foreground">Visible en la pagina publica</p>
            </div>
            <Switch
              checked={config.mostrar_precios}
              onCheckedChange={(v) => actualizar("mostrar_precios", v)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Mostrar horarios de atencion</Label>
              <p className="text-xs text-muted-foreground">Visible en la pagina publica</p>
            </div>
            <Switch
              checked={config.mostrar_horarios}
              onCheckedChange={(v) => actualizar("mostrar_horarios", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Redes sociales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={config.instagram}
              onChange={(e) => actualizar("instagram", e.target.value)}
              placeholder="@tu_consultorio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              value={config.facebook}
              onChange={(e) => actualizar("facebook", e.target.value)}
              placeholder="https://facebook.com/tu_consultorio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_num">WhatsApp (numero)</Label>
            <Input
              id="whatsapp_num"
              value={config.whatsapp}
              onChange={(e) => actualizar("whatsapp", e.target.value)}
              placeholder="+54 11 1234-5678"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleGuardar} disabled={guardando}>
        {guardando ? "Guardando..." : "Guardar configuracion"}
      </Button>
    </div>
  );
}
