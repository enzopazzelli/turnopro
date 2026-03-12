"use client";

import { useState, useRef, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Palette, Upload, Loader2, Trash2, Check } from "lucide-react";
import { guardarBranding, subirLogoConsultorio } from "@/app/(dashboard)/actions/configuracion";
import { toast } from "sonner";

const PALETAS = [
  { id: "azul",    nombre: "Azul",      color_primario: "#2563eb", color_encabezado: "#1e3a8a" },
  { id: "verde",   nombre: "Verde",     color_primario: "#16a34a", color_encabezado: "#14532d" },
  { id: "violeta", nombre: "Violeta",   color_primario: "#7c3aed", color_encabezado: "#4c1d95" },
  { id: "teal",    nombre: "Teal",      color_primario: "#0d9488", color_encabezado: "#134e4a" },
  { id: "naranja", nombre: "Naranja",   color_primario: "#ea580c", color_encabezado: "#7c2d12" },
  { id: "rosa",    nombre: "Rosa",      color_primario: "#db2777", color_encabezado: "#831843" },
  { id: "rojo",    nombre: "Rojo",      color_primario: "#dc2626", color_encabezado: "#7f1d1d" },
  { id: "oscuro",  nombre: "Oscuro",    color_primario: "#374151", color_encabezado: "#111827" },
];

export function TabBranding({ configuracionInicial }) {
  const branding = configuracionInicial?.branding || {};
  const [logoUrl, setLogoUrl] = useState(branding.logo_url || "");
  const [colorPrimario, setColorPrimario] = useState(branding.color_primario || "#2563eb");
  const [colorEncabezado, setColorEncabezado] = useState(branding.color_encabezado || "#1e3a8a");
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

  function seleccionarPaleta(paleta) {
    setColorPrimario(paleta.color_primario);
    setColorEncabezado(paleta.color_encabezado);
  }

  function handleGuardar() {
    startTransition(async () => {
      const { error } = await guardarBranding({
        logo_url: logoUrl,
        color_primario: colorPrimario,
        color_encabezado: colorEncabezado,
      });
      if (error) toast.error(error);
      else toast.success("Branding guardado");
    });
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Identidad visual
          </CardTitle>
          <CardDescription>
            El logo y los colores se aplican en tu página pública y en el panel de gestión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
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
                  <Palette className="h-6 w-6" />
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
                    <><Upload className="h-4 w-4 mr-2" /> {logoUrl ? "Cambiar logo" : "Subir logo"}</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG o SVG. Máximo 2MB.</p>
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

          {/* Paletas predefinidas */}
          <div className="space-y-3">
            <Label>Paleta de colores</Label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PALETAS.map((paleta) => {
                const activa =
                  colorPrimario === paleta.color_primario &&
                  colorEncabezado === paleta.color_encabezado;
                return (
                  <button
                    key={paleta.id}
                    type="button"
                    onClick={() => seleccionarPaleta(paleta)}
                    className="relative flex flex-col items-center gap-1 group"
                    title={paleta.nombre}
                  >
                    <div
                      className="h-10 w-10 rounded-full border-2 transition-transform group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${paleta.color_encabezado} 50%, ${paleta.color_primario} 50%)`,
                        borderColor: activa ? "hsl(var(--foreground))" : "transparent",
                      }}
                    >
                      {activa && (
                        <Check className="h-3 w-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{paleta.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colores personalizados */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color-primario">Color de acento (botones / enlaces)</Label>
              <div className="flex items-center gap-2">
                <input
                  id="color-primario"
                  type="color"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  className="h-9 w-14 rounded border cursor-pointer p-0.5 bg-background"
                />
                <span className="text-sm font-mono text-muted-foreground">{colorPrimario}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color-encabezado">Color de encabezado / hero</Label>
              <div className="flex items-center gap-2">
                <input
                  id="color-encabezado"
                  type="color"
                  value={colorEncabezado}
                  onChange={(e) => setColorEncabezado(e.target.value)}
                  className="h-9 w-14 rounded border cursor-pointer p-0.5 bg-background"
                />
                <span className="text-sm font-mono text-muted-foreground">{colorEncabezado}</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Vista previa del encabezado</Label>
            <div
              className="rounded-lg p-5 flex items-center gap-4"
              style={{ backgroundColor: colorEncabezado }}
            >
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-contain bg-white/10 p-1" />
              )}
              <div className="text-white space-y-1">
                <p className="font-bold text-base">Nombre del consultorio</p>
                <p className="text-sm opacity-70">Especialidad · Ciudad</p>
              </div>
              <div className="ml-auto">
                <div
                  className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: colorPrimario }}
                >
                  Reservar turno
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleGuardar} disabled={guardando}>
          <Save className="h-4 w-4 mr-2" />
          {guardando ? "Guardando..." : "Guardar branding"}
        </Button>
      </div>
    </div>
  );
}
