import { UserPlus, Settings, CalendarCheck } from "lucide-react";

const pasos = [
  {
    numero: "01",
    icono: UserPlus,
    titulo: "Registrate",
    descripcion: "Creá tu cuenta gratis en menos de 2 minutos. Elegí tu profesión y personalizá tu perfil con logo y colores.",
  },
  {
    numero: "02",
    icono: Settings,
    titulo: "Configurá",
    descripcion: "Definí tus servicios, horarios de atención y preferencias de notificación. Listo para operar.",
  },
  {
    numero: "03",
    icono: CalendarCheck,
    titulo: "Recibí turnos",
    descripcion: "Compartí tu página pública y empezá a recibir reservas online 24/7 sin intermediarios.",
  },
];

export function ComoFunciona() {
  return (
    <div className="grid gap-8 sm:grid-cols-3 relative">
      {/* Línea conectora (solo desktop) */}
      <div className="hidden sm:block absolute top-10 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-border" />

      {pasos.map((paso) => {
        const Icono = paso.icono;
        return (
          <div key={paso.numero} className="relative text-center space-y-4">
            {/* Círculo con número */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-background border-2 border-border" />
              <div className="relative flex flex-col items-center">
                <span className="text-[10px] font-mono font-bold text-primary">{paso.numero}</span>
                <Icono className="h-6 w-6 text-foreground mt-0.5" />
              </div>
            </div>
            <h3 className="font-semibold text-lg">{paso.titulo}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{paso.descripcion}</p>
          </div>
        );
      })}
    </div>
  );
}
