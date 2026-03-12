"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, ImagePlus, Upload, Loader2, PenLine } from "lucide-react";
import { subirImagenPerfil } from "@/app/(dashboard)/actions/configuracion";
import { subirFirma } from "@/app/(dashboard)/actions/recetas";
import { useAuthStore } from "@/stores/auth-store";
import { FirmaCanvas } from "./firma-canvas";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function TabPerfil({ configuracionInicial }) {
  const { user, tenant, setUser, setTenant, profesional } = useAuthStore();
  const heroUrl = configuracionInicial?.pagina_publica?.hero_url || tenant?.configuracion?.pagina_publica?.hero_url;

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [heroImgUrl, setHeroImgUrl] = useState(heroUrl || "");
  const [firmaUrl, setFirmaUrl] = useState(profesional?.firma_url || "");
  const [modoFirma, setModoFirma] = useState("subir"); // "subir" | "dibujar"
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [subiendoHero, setSubiendoHero] = useState(false);
  const [subiendoFirma, setSubiendoFirma] = useState(false);

  const avatarInputRef = useRef(null);
  const heroInputRef = useRef(null);
  const firmaInputRef = useRef(null);

  const iniciales = user?.nombre_completo
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  async function handleSubirImagen(archivo, tipo) {
    if (!archivo) return;

    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("tipo", tipo);

    if (tipo === "avatar") setSubiendoAvatar(true);
    else setSubiendoHero(true);

    const { data, error } = await subirImagenPerfil(formData);

    if (tipo === "avatar") setSubiendoAvatar(false);
    else setSubiendoHero(false);

    if (error) {
      toast.error(error);
      return;
    }

    if (tipo === "avatar") {
      setAvatarUrl(data);
      if (user) setUser({ ...user, avatar_url: data });
      toast.success("Foto de perfil actualizada");
    } else {
      setHeroImgUrl(data);
      toast.success("Imagen de portada actualizada");
    }
  }

  function handleAvatarChange(e) {
    const archivo = e.target.files?.[0];
    if (archivo) handleSubirImagen(archivo, "avatar");
  }

  function handleHeroChange(e) {
    const archivo = e.target.files?.[0];
    if (archivo) handleSubirImagen(archivo, "hero");
  }

  async function handleFirmaChange(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoFirma(true);
    const fd = new FormData();
    fd.append("firma", archivo);
    const { error, url } = await subirFirma(fd);
    setSubiendoFirma(false);
    if (error) { toast.error(error); return; }
    setFirmaUrl(url);
    toast.success("Firma digital actualizada");
  }

  return (
    <div className="space-y-6">
      {/* Foto de perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Foto de perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} alt={user?.nombre_completo} />
                <AvatarFallback className="text-2xl">{iniciales}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={subiendoAvatar}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                {subiendoAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{user?.nombre_completo}</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG o WebP. Maximo 5MB.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={subiendoAvatar}
              >
                {subiendoAvatar ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Cambiar foto
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Imagen de portada (hero) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Imagen de portada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta imagen se muestra como fondo en el encabezado de tu pagina publica.
          </p>

          <div
            onClick={() => !subiendoHero && heroInputRef.current?.click()}
            className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-colors"
          >
            {heroImgUrl ? (
              <div className="relative">
                <img
                  src={heroImgUrl}
                  alt="Imagen de portada"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {subiendoHero ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <div className="text-center text-white">
                      <Camera className="h-8 w-8 mx-auto mb-1" />
                      <span className="text-sm">Cambiar imagen</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                {subiendoHero ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-10 w-10" />
                    <span className="text-sm">Click para subir una imagen de portada</span>
                    <span className="text-xs">JPG, PNG o WebP. Maximo 5MB. Recomendado: 1200x400px</span>
                  </>
                )}
              </div>
            )}
            <input
              ref={heroInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleHeroChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Firma digital */}
      {profesional && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              Firma digital
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tu firma aparecera en recetas, indicaciones y certificados generados desde la plataforma.
            </p>

            {/* Preview de firma actual */}
            {firmaUrl && (
              <div className="flex items-center justify-center p-4 bg-white border rounded-lg">
                <img
                  src={firmaUrl}
                  alt="Firma digital"
                  className="max-h-20 object-contain"
                />
              </div>
            )}

            {/* Toggle de modo */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setModoFirma("subir")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  modoFirma === "subir"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Subir imagen
              </button>
              <button
                type="button"
                onClick={() => setModoFirma("dibujar")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  modoFirma === "dibujar"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Dibujar firma
              </button>
            </div>

            {modoFirma === "subir" ? (
              <div>
                <div
                  onClick={() => !subiendoFirma && firmaInputRef.current?.click()}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-colors"
                >
                  <div className="h-24 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    {subiendoFirma ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      <>
                        <PenLine className="h-8 w-8" />
                        <span className="text-sm">Click para subir tu firma</span>
                        <span className="text-xs">PNG con fondo transparente. Maximo 2MB.</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={firmaInputRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/webp"
                    onChange={handleFirmaChange}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <FirmaCanvas onGuardada={(url) => setFirmaUrl(url)} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
