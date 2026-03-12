"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgendaStore } from "@/stores/agenda-store";
import { CitaDialog } from "./cita-dialog";

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  allDay: "Todo el dia",
  previous: "Anterior",
  next: "Siguiente",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "No hay citas en este rango",
  showMore: (total) => `+${total} mas`,
};

export function AgendaCliente({ citasIniciales, servicios, profesionales = [], sucursales = [] }) {
  const router = useRouter();
  const {
    vistaActual,
    fechaActual,
    dialogCitaAbierto,
    citaSeleccionada,
    fechaPreseleccionada,
    setVista,
    setFecha,
    abrirDialogNuevaCita: abrirNueva,
    abrirDialogEditarCita: abrirEditar,
    cerrarDialog: cerrarDialogStore,
  } = useAgendaStore();

  const [dialogKey, setDialogKey] = useState(0);
  const [filtroProfesional, setFiltroProfesional] = useState("todos");
  const [filtroSucursal, setFiltroSucursal] = useState("todas");

  const abrirDialogNuevaCita = useCallback((fecha) => {
    setDialogKey((k) => k + 1);
    abrirNueva(fecha);
  }, [abrirNueva]);

  const abrirDialogEditarCita = useCallback((cita) => {
    setDialogKey((k) => k + 1);
    abrirEditar(cita);
  }, [abrirEditar]);

  const cerrarDialog = useCallback(() => {
    cerrarDialogStore();
    router.refresh();
  }, [cerrarDialogStore, router]);

  // Transform citas to calendar events
  const eventos = useMemo(() => {
    return citasIniciales
      .filter((c) => c.estado !== "cancelada" && c.estado !== "no_asistio")
      .filter((c) => filtroProfesional === "todos" || c.professional_id === filtroProfesional)
      .filter((c) => filtroSucursal === "todas" || c.sucursal_id === filtroSucursal)
      .map((cita) => {
        const start = new Date(`${cita.fecha}T${cita.hora_inicio}`);
        const end = new Date(`${cita.fecha}T${cita.hora_fin}`);

        let title = cita.paciente_nombre;
        if (cita.sobreturno) title = `⚡ ${title}`;
        if (cita.recurrencia || cita.cita_padre_id) title = `🔁 ${title}`;
        // Mostrar nombre del profesional en vista consolidada
        if (filtroProfesional === "todos" && profesionales.length > 1) {
          const prof = profesionales.find((p) => p.id === cita.professional_id);
          if (prof) title = `${title} · ${prof.nombre_completo.split(" ")[0]}`;
        }

        return {
          id: cita.id,
          title,
          start,
          end,
          resource: cita,
        };
      });
  }, [citasIniciales, filtroProfesional, filtroSucursal, profesionales]);

  const handleSelectSlot = useCallback(
    ({ start }) => {
      abrirDialogNuevaCita(start);
    },
    [abrirDialogNuevaCita]
  );

  const handleSelectEvent = useCallback(
    (event) => {
      abrirDialogEditarCita(event.resource);
    },
    [abrirDialogEditarCita]
  );

  const eventPropGetter = useCallback((event) => {
    const color = event.resource?.servicios?.color || "#6366f1";
    const esSobreturno = event.resource?.sobreturno;
    const esPorConfirmar = event.resource?.estado === "pendiente_confirmacion";

    // En vista consolidada con multiples profesionales, usar borde izquierdo con color del profesional
    let borderLeft = "none";
    if (filtroProfesional === "todos" && profesionales.length > 1) {
      const profIndex = profesionales.findIndex((p) => p.id === event.resource?.professional_id);
      const profColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
      borderLeft = `4px solid ${profColors[profIndex % profColors.length]}`;
    }

    return {
      style: {
        backgroundColor: esPorConfirmar ? `${color}99` : color,
        borderColor: color,
        color: "#fff",
        borderRadius: "4px",
        border: esSobreturno ? "2px dashed #f97316" : "none",
        borderLeft: borderLeft !== "none" ? borderLeft : undefined,
        fontSize: "0.8rem",
        opacity: esPorConfirmar ? 0.7 : 1,
      },
    };
  }, [filtroProfesional, profesionales]);

  const minTime = new Date();
  minTime.setHours(7, 0, 0);

  const maxTime = new Date();
  maxTime.setHours(21, 0, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
        <div className="flex items-center gap-2">
          {sucursales.length > 1 && (
            <Select value={filtroSucursal} onValueChange={setFiltroSucursal}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sucursales</SelectItem>
                {sucursales.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {profesionales.length > 1 && (
            <Select value={filtroProfesional} onValueChange={setFiltroProfesional}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos los profesionales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los profesionales</SelectItem>
                {profesionales.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => abrirDialogNuevaCita()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva cita
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          view={vistaActual}
          onView={setVista}
          date={fechaActual}
          onNavigate={setFecha}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          step={15}
          timeslots={4}
          min={minTime}
          max={maxTime}
          messages={messages}
          culture="es"
          style={{ height: "calc(100vh - 200px)" }}
        />
      </div>

      <CitaDialog
        key={dialogKey}
        abierto={dialogCitaAbierto}
        onCerrar={cerrarDialog}
        cita={citaSeleccionada}
        servicios={servicios}
        profesionales={profesionales}
        sucursales={sucursales}
        fechaPreseleccionada={fechaPreseleccionada}
      />
    </div>
  );
}
