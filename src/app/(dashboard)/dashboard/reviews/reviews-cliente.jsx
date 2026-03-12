"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Star, Eye, EyeOff, Trash2, MessageSquare, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { obtenerReviews, moderarReview, eliminarReview } from "@/app/(dashboard)/actions/reviews";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

function Estrellas({ valor, className = "" }) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= valor ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export function ReviewsCliente() {
  const router = useRouter();
  const tenant = useAuthStore((s) => s.tenant);
  const [reviews, setReviews] = useState([]);
  const [cargando, setCargando] = useState(true);

  const linkReview = tenant?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${tenant.slug}/review`
    : "";

  async function cargar() {
    setCargando(true);
    const { data } = await obtenerReviews();
    setReviews(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [router]);

  async function handleModerar(id, visible) {
    await moderarReview(id, visible);
    toast.success(visible ? "Reseña publicada" : "Reseña ocultada");
    cargar();
  }

  async function handleEliminar(id) {
    if (!confirm("¿Eliminar esta reseña?")) return;
    await eliminarReview(id);
    toast.success("Reseña eliminada");
    cargar();
  }

  function copiarLink() {
    navigator.clipboard.writeText(linkReview);
    toast.success("Link copiado al portapapeles");
  }

  const pendientes = reviews.filter((r) => !r.visible);
  const publicadas = reviews.filter((r) => r.visible);
  const promedio =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.estrellas, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Link para compartir */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Link para solicitar reseñas</p>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">{linkReview}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copiarLink}>
              <Copy className="h-4 w-4 mr-2" /> Copiar link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Total reseñas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <p className="text-2xl font-bold">{promedio}</p>
              </div>
              <p className="text-xs text-muted-foreground">Promedio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendientes.length}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pendientes de moderación */}
      {pendientes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Pendientes de aprobación ({pendientes.length})
          </h2>
          {pendientes.map((r) => (
            <Card key={r.id} className="border-yellow-200 dark:border-yellow-900">
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{r.nombre}</span>
                      <Estrellas valor={r.estrellas} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                      {r.email && ` · ${r.email}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => handleModerar(r.id, true)}>
                      <Eye className="h-3 w-3 mr-1" /> Publicar
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleEliminar(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{r.texto}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Publicadas */}
      {publicadas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Publicadas ({publicadas.length})
          </h2>
          {publicadas.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4 pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{r.nombre}</span>
                      <Estrellas valor={r.estrellas} />
                      <Badge variant="outline" className="text-green-700 border-green-300 text-xs h-5">Publicada</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground"
                      onClick={() => handleModerar(r.id, false)}>
                      <EyeOff className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleEliminar(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{r.texto}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!cargando && reviews.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Todavía no tenés reseñas</p>
            <p className="text-sm mt-1">Copiá el link y compartilo con tus pacientes para empezar a recibir opiniones.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
