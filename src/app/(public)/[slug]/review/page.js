"use client";

import { useActionState, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Star, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearReview } from "@/app/(public)/actions/reviews";
import { APP_NAME } from "@/lib/constants";

const estadoInicial = { error: null, success: false };

export default function ReviewPage() {
  const params = useParams();
  const slug = params?.slug || "";
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, formAction, pending] = useActionState(crearReview, estadoInicial);

  if (state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">¡Gracias por tu opinión!</h1>
          <p className="text-muted-foreground">
            Tu reseña fue enviada con éxito. Será publicada una vez que el profesional la apruebe.
          </p>
          <Button asChild variant="outline">
            <Link href={`/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al perfil
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b py-4 px-6">
        <Link href={`/${slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Volver al perfil
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center pt-12 pb-16 px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">Dejá tu reseña</h1>
            <p className="text-muted-foreground text-sm">
              Tu opinión ayuda a otros pacientes a elegir mejor.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="estrellas" value={estrellas} />

            {/* Calificación con estrellas */}
            <div className="space-y-2">
              <Label>Calificación *</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEstrellas(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        i <= (hover || estrellas)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {estrellas > 0 && (
                <p className="text-xs text-muted-foreground">
                  {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][estrellas]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Tu nombre *</Label>
              <Input id="nombre" name="nombre" placeholder="Ej: María García" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input id="email" name="email" type="email" placeholder="tu@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="texto">Tu comentario *</Label>
              <Textarea
                id="texto"
                name="texto"
                rows={4}
                placeholder="Contá tu experiencia..."
                required
              />
            </div>

            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              <Send className="h-4 w-4 mr-2" />
              {pending ? "Enviando..." : "Enviar reseña"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Gestionado con{" "}
            <Link href="/" className="hover:text-foreground transition-colors font-medium">
              {APP_NAME}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
