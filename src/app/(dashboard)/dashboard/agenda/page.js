import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { AgendaCliente } from "@/components/agenda/agenda-cliente";
import { SalaDeEspera } from "@/components/agenda/sala-espera";
import { ListaEspera } from "@/components/agenda/lista-espera";

export const metadata = {
  title: "Agenda | TurnoPro",
};

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: professionalId, error: rpcError } = await supabase.rpc("get_professional_id_for_user");
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;

  if (rpcError || !professionalId) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive text-sm">
            No se pudo cargar la informacion del profesional. Asegurate de haber ejecutado
            la migracion SQL (002_agenda.sql) en Supabase y que tu cuenta este configurada correctamente.
          </p>
          {rpcError && (
            <p className="text-destructive/70 text-xs mt-2">
              Error: {rpcError.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  const hoy = new Date();
  const fechaInicio = format(startOfMonth(subMonths(hoy, 1)), "yyyy-MM-dd");
  const fechaFin = format(endOfMonth(addMonths(hoy, 1)), "yyyy-MM-dd");

  const [citasResult, serviciosResult, citasHoyResult, listaEsperaResult, profesionalesResult, sucursalesResult] = await Promise.all([
    supabase
      .from("citas")
      .select("*, servicios(nombre, color, duracion_minutos, precio)")
      .eq("tenant_id", tenantId)
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .order("fecha")
      .order("hora_inicio"),
    supabase
      .from("servicios")
      .select("*")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("citas")
      .select("*, servicios(nombre, color, duracion_minutos, precio)")
      .eq("tenant_id", tenantId)
      .eq("fecha", format(hoy, "yyyy-MM-dd"))
      .not("estado", "in", '("cancelada","no_asistio")')
      .order("hora_inicio", { ascending: true }),
    supabase
      .from("lista_espera")
      .select("*, servicios(nombre, color)")
      .eq("professional_id", professionalId)
      .in("estado", ["esperando", "notificado"])
      .order("created_at", { ascending: true }),
    // Obtener todos los profesionales del tenant
    supabase
      .from("users")
      .select("id, nombre_completo, email, professionals(id, especialidad)")
      .eq("tenant_id", tenantId)
      .eq("rol", "profesional")
      .order("created_at", { ascending: true }),
    // Obtener sucursales del tenant
    supabase
      .from("sucursales")
      .select("id, nombre, direccion, activa, es_principal")
      .eq("tenant_id", tenantId)
      .eq("activa", true)
      .order("es_principal", { ascending: false })
      .order("nombre"),
  ]);

  const citas = citasResult.data || [];
  const servicios = serviciosResult.data || [];
  const citasHoy = citasHoyResult.data || [];
  const listaEspera = listaEsperaResult.data || [];

  // Mapear profesionales: necesitamos el professional.id (no el user.id) para asignar a citas
  const profesionales = (profesionalesResult.data || []).map((u) => ({
    id: u.professionals?.[0]?.id || u.id,
    user_id: u.id,
    nombre_completo: u.nombre_completo,
    email: u.email,
    professionals: u.professionals,
  }));
  const sucursales = sucursalesResult.data || [];

  // Calcular total_pagado para cada cita de hoy
  // Incluye pagos vinculados por cita_id Y pagos sueltos por paciente_id (desde cuenta corriente)
  const citaIdsHoy = citasHoy.map((c) => c.id);
  const pacienteIdsHoy = [...new Set(citasHoy.map((c) => c.paciente_id).filter(Boolean))];

  if (citaIdsHoy.length > 0) {
    // Pagos vinculados directamente a una cita
    const { data: pagosPorCitaData } = await supabase
      .from("pagos")
      .select("cita_id, monto")
      .in("cita_id", citaIdsHoy)
      .eq("anulado", false);

    const pagosPorCita = {};
    (pagosPorCitaData || []).forEach((p) => {
      pagosPorCita[p.cita_id] = (pagosPorCita[p.cita_id] || 0) + Number(p.monto);
    });

    // Pagos sin cita_id (cuenta corriente) agrupados por paciente
    let pagosSueltosPorPaciente = {};
    if (pacienteIdsHoy.length > 0) {
      const { data: pagosSueltosData } = await supabase
        .from("pagos")
        .select("paciente_id, monto")
        .in("paciente_id", pacienteIdsHoy)
        .is("cita_id", null)
        .eq("anulado", false);

      (pagosSueltosData || []).forEach((p) => {
        pagosSueltosPorPaciente[p.paciente_id] = (pagosSueltosPorPaciente[p.paciente_id] || 0) + Number(p.monto);
      });
    }

    citasHoy.forEach((c) => {
      const pagadoPorCita = pagosPorCita[c.id] || 0;
      const precio = c.servicios?.precio || 0;
      if (pagadoPorCita >= precio) {
        // Cita ya cubierta por pagos directos
        c.total_pagado = pagadoPorCita;
      } else {
        // Intentar cubrir el restante con saldo suelto del paciente
        const saldoSuelto = pagosSueltosPorPaciente[c.paciente_id] || 0;
        const restante = precio - pagadoPorCita;
        const aplicado = Math.min(saldoSuelto, restante);
        c.total_pagado = pagadoPorCita + aplicado;
        // Descontar lo aplicado para no reutilizar en otra cita del mismo paciente
        if (aplicado > 0 && c.paciente_id) {
          pagosSueltosPorPaciente[c.paciente_id] = saldoSuelto - aplicado;
        }
      }
    });
  }

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 min-w-0">
        <AgendaCliente
          citasIniciales={citas}
          servicios={servicios}
          profesionales={profesionales}
          sucursales={sucursales}
        />
      </div>
      <div className="w-[350px] shrink-0 hidden lg:flex flex-col gap-4">
        <SalaDeEspera citasHoy={citasHoy} />
        <ListaEspera items={listaEspera} servicios={servicios} />
      </div>
    </div>
  );
}
