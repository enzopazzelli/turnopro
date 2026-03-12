import { ReviewsCliente } from "./reviews-cliente";

export const metadata = { title: "Reseñas | TurnoPro" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reseñas de pacientes</h1>
        <p className="text-muted-foreground text-sm">
          Moderá las opiniones antes de publicarlas en tu página pública.
        </p>
      </div>
      <ReviewsCliente />
    </div>
  );
}
