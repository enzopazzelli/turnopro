"use client";

import { useState, useRef, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Building2, Upload, Loader2, Trash2 } from "lucide-react";
import { guardarConfiguracionConsultorio, subirLogoConsultorio } from "@/app/(dashboard)/actions/configuracion";
import { toast } from "sonner";

export function TabConsultorio({ configuracionInicial }) {
  const config = configuracionInicial?.consultorio || {};
  const [nombre, setNombre] = useState(config.nombre || "");
  const [direccion, setDireccion] = useState(config.direccion || "");
  const [telefono, setTelefono] = useState(config.telefono || "");
  const [email, setEmail] = useState(config.email || "");
  const [descripcion, setDescripcion] = useState(config.descripcion || "");
  const [sitio_web, setSitioWeb] = useState(config.sitio_web || "");
  const [logoUrl, setLogoUrl] = useState(config.logo_url || "");
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [guardando, startTransition] = useTransition();
  const logoInputRef = useRef(null);

  async function handleLogoChange(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoLogo(true);
    const fd = new FormData();
    fd.append("archivo", archivo);
    const { error, url } = await subirLogoConsultorio(fd);
    setSubiendoLogo(false);
    if (error) { toast.error(error); return; }
    setLogoUrl(url);
    toast.success("Logo actualizado");
  }

  function handleGuardar() {
    startTransition(async () => {
      const { error } = await guardarConfiguracionConsultorio({
        nombre,
        direccion,
        telefono,
        email,
        descripcion,
        sitio_web,
        logo_url: logoUrl,
      });
      if (error) toast.error(error);
      else toast.success("Datos del consultorio guardados");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Datos del consultorio
          </CardTitle>
          <CardDescription>
            Esta informacion aparece en recetas, recibos, emails y tu pagina publica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo del consultorio</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative group">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-16 w-16 rounded-lg object-contain border bg-white p-1"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                  <Building2 className="h-6 w-6" />
                </div>
              )}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={subiendoLogo}
                >
                  {subiendoLogo ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> {logoUrl ? "Cambiar" : "Subir logo"}</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG o SVG. Maximo 2MB.</p>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cons-nombre">Nombre del consultorio / estudio</Label>
            <Input
              id="cons-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Consultorio Dr. Martinez"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cons-telefono">Telefono</Label>
              <Input
                id="cons-telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: (011) 4567-8901"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cons-email">Email de contacto</Label>
              <Input
                id="cons-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="consultorio@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cons-direccion">Direccion</Label>
            <Input
              id="cons-direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Av. Corrientes 1234, CABA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cons-web">Sitio web</Label>
            <Input
              id="cons-web"
              value={sitio_web}
              onChange={(e) => setSitioWeb(e.target.value)}
              placeholder="https://www.miconsultorio.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cons-descripcion">Descripcion</Label>
            <Textarea
              id="cons-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Breve descripcion del consultorio, especialidades, servicios destacados..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleGuardar} disabled={guardando}>
          <Save className="h-4 w-4 mr-2" />
          {guardando ? "Guardando..." : "Guardar datos del consultorio"}
        </Button>
      </div>
    </div>
  );
}
