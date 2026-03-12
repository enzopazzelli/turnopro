const CITAS = [
  { hora: "09:00", nombre: "Juan García", tipo: "Consulta general", color: "emerald" },
  { hora: "10:30", nombre: "Ana López", tipo: "Control anual", color: "blue" },
  { hora: "11:00", nombre: "Carlos M.", tipo: "Odontología", color: "violet" },
  { hora: "12:15", nombre: "María P.", tipo: "Primera consulta", color: "amber" },
];

const COLOR_MAP = {
  emerald: { bar: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-400" },
  blue:    { bar: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/30",    dot: "bg-blue-400" },
  violet:  { bar: "bg-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/30",  dot: "bg-violet-400" },
  amber:   { bar: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/30",   dot: "bg-amber-400" },
};

export function HeroMockup() {
  return (
    <div className="relative select-none pointer-events-none">
      {/* Glow detrás */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-400/25 to-blue-400/20 rounded-3xl blur-3xl scale-110" />

      {/* Ventana principal */}
      <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">

        {/* Barra de título */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/40">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="flex-1 flex justify-center">
            <div className="w-40 h-4 rounded-md bg-muted flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground">turnopro.app/dashboard</span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex" style={{ height: "330px" }}>

          {/* Sidebar */}
          <div className="w-28 border-r bg-muted/10 p-3 space-y-1 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-primary text-primary-foreground mb-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary-foreground/30" />
              <span className="text-[10px] font-semibold">Agenda</span>
            </div>
            {["Clientes", "Servicios", "Reportes", "Config."].map((item) => (
              <div key={item} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground">
                <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />
                <span className="text-[10px]">{item}</span>
              </div>
            ))}
            {/* Mini stat box */}
            <div className="mt-4 rounded-lg bg-primary/10 p-2">
              <p className="text-[9px] text-muted-foreground">Esta semana</p>
              <p className="text-sm font-bold text-primary mt-0.5">18</p>
              <p className="text-[9px] text-muted-foreground">turnos</p>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Cabecera */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-bold">Martes 11 de marzo</p>
                <p className="text-[10px] text-muted-foreground">4 turnos confirmados</p>
              </div>
              <div className="flex gap-1">
                <div className="rounded-md px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium">Día</div>
                <div className="rounded-md px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px]">Sem.</div>
              </div>
            </div>

            {/* Turnos */}
            <div className="space-y-1.5">
              {CITAS.map((c) => {
                const col = COLOR_MAP[c.color];
                return (
                  <div key={c.hora} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${col.bg}`}>
                    <span className="text-[10px] text-muted-foreground w-8 shrink-0 font-mono tabular-nums">{c.hora}</span>
                    <div className={`w-0.5 h-7 rounded-full ${col.bar} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold leading-none truncate">{c.nombre}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.tipo}</p>
                    </div>
                    <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${col.dot}`} />
                  </div>
                );
              })}
            </div>

            {/* Mini bottom bar */}
            <div className="mt-3 pt-2 border-t flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Próximo: <span className="font-medium text-foreground">14:00</span></p>
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium px-2 py-0.5">
                En línea
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badge: confirmación */}
      <div className="absolute -bottom-5 -left-5 bg-background border shadow-xl rounded-xl px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 text-sm">✓</div>
        <div>
          <p className="text-[11px] font-semibold leading-none">Ana López</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Turno confirmado</p>
        </div>
      </div>

      {/* Badge: nuevos turnos */}
      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-violet-600 to-primary text-white rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-lg">
        +3 nuevos hoy
      </div>
    </div>
  );
}
