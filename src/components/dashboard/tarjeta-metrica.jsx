import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TarjetaMetrica({ titulo, valor, descripcion, icono: Icono }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        {Icono && <Icono className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
        {descripcion && (
          <p className="text-xs text-muted-foreground">{descripcion}</p>
        )}
      </CardContent>
    </Card>
  );
}
