"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addMinutes, parse, format } from "date-fns";
import { Search, X, AlertTriangle, Repeat, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { crearCita, actualizarCita } from "@/app/(dashboard)/actions/citas";
import { buscarPacientesParaCita } from "@/app/(dashboard)/actions/pacientes";
import { obtenerPagosDeCita } from "@/app/(dashboard)/actions/facturacion";
import { obtenerAlertasMedicas } from "@/app/(dashboard)/actions/medicina";
import { PagoDialog } from "@/components/facturacion/pago-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

const estadoInicial = { error: null, fieldErrors: {}, success: null };

const estadosDisponibles = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pendiente_confirmacion", label: "Por confirmar" },
  { value: "confirmada", label: "Confirmada" },
  { value: "en_curso", label: "En curso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "no_asistio", label: "No asistio" },
];

export function CitaDialog({
  abierto,
  onCerrar,
  cita = null,
  servicios = [],
  profesionales = [],
  sucursales = [],
  fechaPreseleccionada = null,
  pacientePreseleccionado = null,
  notaPreseleccionada = "",
}) {
  const esEdicion = !!cita;
  const tenant = useAuthStore((s) => s.tenant);
  const esMedicina = tenant?.rubro === "medicina";

  const actionFn = esEdicion
    ? actualizarCita.bind(null, cita.id)
    : crearCita;

  const [state, formAction, pending] = useActionState(actionFn, estadoInicial);
  const formRef = useRef(null);
  const ultimoExitoRef = useRef(null);

  const [servicioId, setServicioId] = useState(cita?.servicio_id || "");
  const [estado, setEstado] = useState(cita?.estado || "pendiente");
  const [horaInicio, setHoraInicio] = useState(cita?.hora_inicio?.slice(0, 5) || "");
  const [horaFin, setHoraFin] = useState(cita?.hora_fin?.slice(0, 5) || "");

  // Paciente search state
  const [pacienteId, setPacienteId] = useState(cita?.paciente_id || "");
  const [pacienteBusqueda, setPacienteBusqueda] = useState("");
  const [pacienteResultados, setPacienteResultados] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const busquedaRef = useRef(null);

  // Alertas médicas (solo medicina)
  const [alertasMedicas, setAlertasMedicas] = useState({ alergias: [], medicacion: [] });

  // Estado de pagos (solo en edicion)
  const [pagosCita, setPagosCita] = useState([]);
  const [dialogPagoAbierto, setDialogPagoAbierto] = useState(false);

  // Profesional y sucursal
  const [profesionalId, setProfesionalId] = useState(cita?.professional_id || "");
  const [sucursalId, setSucursalId] = useState(cita?.sucursal_id || "");

  // Sobreturno
  const [sobreturno, setSobreturno] = useState(cita?.sobreturno || false);

  // Recurrencia (solo en creacion)
  const [recurrencia, setRecurrencia] = useState("");
  const [recurrenciaFin, setRecurrenciaFin] = useState("");

  // Auto-calcular hora_fin al cambiar servicio o hora_inicio
  useEffect(() => {
    if (!horaInicio || !servicioId) return;

    const servicioSeleccionado = servicios.find((s) => s.id === servicioId);
    if (!servicioSeleccionado) return;

    try {
      const inicio = parse(horaInicio, "HH:mm", new Date());
      const fin = addMinutes(inicio, servicioSeleccionado.duracion_minutos);
      setHoraFin(format(fin, "HH:mm"));
    } catch {
      // Hora invalida, no calcular
    }
  }, [horaInicio, servicioId, servicios]);

  // Resetear estado al abrir/cerrar
  useEffect(() => {
    if (abierto) {
      setServicioId(cita?.servicio_id || "");
      setEstado(cita?.estado || "pendiente");
      setHoraInicio(cita?.hora_inicio?.slice(0, 5) || "");
      setHoraFin(cita?.hora_fin?.slice(0, 5) || "");
      setPacienteBusqueda("");
      setPacienteResultados([]);
      setMostrarResultados(false);
      setSobreturno(cita?.sobreturno || false);
      setProfesionalId(cita?.professional_id || "");
      setSucursalId(cita?.sucursal_id || "");
      setRecurrencia("");
      setRecurrenciaFin("");

      if (pacientePreseleccionado && !cita) {
        setPacienteId(pacientePreseleccionado.id);
        setPacienteSeleccionado(pacientePreseleccionado);
      } else {
        setPacienteId(cita?.paciente_id || "");
        setPacienteSeleccionado(null);
      }
    }
  }, [abierto, cita, pacientePreseleccionado]);

  // Cargar pagos de la cita en modo edicion
  useEffect(() => {
    if (abierto && esEdicion && cita?.id) {
      obtenerPagosDeCita(cita.id).then(({ data }) => setPagosCita(data || []));
    } else {
      setPagosCita([]);
    }
  }, [abierto, esEdicion, cita?.id]);

  useEffect(() => {
    if (state.success && state.success !== ultimoExitoRef.current) {
      ultimoExitoRef.current = state.success;
      toast.success(esEdicion ? "Cita actualizada" : "Cita creada");
      onCerrar();
    }
  }, [state.success, esEdicion, onCerrar]);

  // Buscar pacientes con debounce
  useEffect(() => {
    if (pacienteBusqueda.length < 2) {
      setPacienteResultados([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const { data } = await buscarPacientesParaCita(pacienteBusqueda);
      setPacienteResultados(data || []);
      setMostrarResultados(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [pacienteBusqueda]);

  // Alertas médicas al seleccionar paciente (solo medicina)
  useEffect(() => {
    if (!pacienteId || !esMedicina) { setAlertasMedicas({ alergias: [], medicacion: [] }); return; }
    obtenerAlertasMedicas(pacienteId).then(setAlertasMedicas);
  }, [pacienteId, esMedicina]);

  function seleccionarPaciente(paciente) {
    setPacienteId(paciente.id);
    setPacienteSeleccionado(paciente);
    setPacienteBusqueda("");
    setMostrarResultados(false);

    const form = formRef.current;
    if (form) {
      const nombreInput = form.querySelector('[name="paciente_nombre"]');
      const telefonoInput = form.querySelector('[name="paciente_telefono"]');
      const emailInput = form.querySelector('[name="paciente_email"]');

      if (nombreInput) nombreInput.value = paciente.nombre_completo;
      if (telefonoInput) telefonoInput.value = paciente.telefono || "";
      if (emailInput) emailInput.value = paciente.email || "";
    }
  }

  function desvincularPaciente() {
    setPacienteId("");
    setPacienteSeleccionado(null);
  }

  const fechaDefault = cita?.fecha
    || (fechaPreseleccionada ? format(fechaPreseleccionada, "yyyy-MM-dd") : "");

  useEffect(() => {
    if (!cita && fechaPreseleccionada && !horaInicio) {
      const h = format(fechaPreseleccionada, "HH:mm");
      setHoraInicio(h);
    }
  }, [fechaPreseleccionada, cita, horaInicio]);

  const mostrarMotivo = esEdicion && (estado === "cancelada" || estado === "no_asistio");
  const esSerie = esEdicion && cita?.cita_padre_id;

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {esEdicion ? "Editar cita" : "Nueva cita"}
            {sobreturno && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <Zap className="mr-1 h-3 w-3" />
                Sobreturno
              </Badge>
            )}
            {esSerie && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                <Repeat className="mr-1 h-3 w-3" />
                Serie
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4" key={abierto ? "open" : "closed"}>
          {/* Buscar paciente existente */}
          <div className="space-y-2">
            <Label>Vincular paciente existente</Label>
            {pacienteSeleccionado ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/50">
                <span className="text-sm flex-1">
                  {pacienteSeleccionado.nombre_completo}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={desvincularPaciente}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={busquedaRef}
                  placeholder="Buscar paciente por nombre..."
                  value={pacienteBusqueda}
                  onChange={(e) => setPacienteBusqueda(e.target.value)}
                  onFocus={() => pacienteResultados.length > 0 && setMostrarResultados(true)}
                  onBlur={() => setTimeout(() => setMostrarResultados(false), 200)}
                  className="pl-9"
                />
                {mostrarResultados && pacienteResultados.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
                    {pacienteResultados.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                        onMouseDown={() => seleccionarPaciente(p)}
                      >
                        <span className="font-medium">{p.nombre_completo}</span>
                        {p.telefono && (
                          <span className="text-muted-foreground ml-2">
                            {p.telefono}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <input type="hidden" name="paciente_id" value={pacienteId} />
          </div>

          {/* Alertas médicas (solo medicina) */}
          {esMedicina && (alertasMedicas.alergias.length > 0 || alertasMedicas.medicacion.length > 0) && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 space-y-1">
              {alertasMedicas.alergias.length > 0 && (
                <p className="text-xs font-medium text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Alergias: {alertasMedicas.alergias.join(", ")}
                </p>
              )}
              {alertasMedicas.medicacion.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Med. crónica: {alertasMedicas.medicacion.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Paciente */}
          <div className="space-y-2">
            <Label htmlFor="paciente_nombre">Nombre del paciente</Label>
            <Input
              id="paciente_nombre"
              name="paciente_nombre"
              defaultValue={cita?.paciente_nombre || pacientePreseleccionado?.nombre_completo || ""}
              placeholder="Nombre completo"
              required
            />
            {state.fieldErrors?.paciente_nombre && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.paciente_nombre[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paciente_telefono">Telefono</Label>
              <Input
                id="paciente_telefono"
                name="paciente_telefono"
                defaultValue={cita?.paciente_telefono || pacientePreseleccionado?.telefono || ""}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paciente_email">Email</Label>
              <Input
                id="paciente_email"
                name="paciente_email"
                type="email"
                defaultValue={cita?.paciente_email || pacientePreseleccionado?.email || ""}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Servicio */}
          <div className="space-y-2">
            <Label>Servicio</Label>
            <Select value={servicioId} onValueChange={setServicioId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {servicios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.nombre} ({s.duracion_minutos} min)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="servicio_id" value={servicioId} />
          </div>

          {/* Profesional (solo si hay varios) */}
          {profesionales.length > 1 && (
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select value={profesionalId} onValueChange={setProfesionalId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  {profesionales.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre_completo}
                      {p.professionals?.[0]?.especialidad && (
                        <span className="text-muted-foreground ml-1">
                          — {p.professionals[0].especialidad}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="professional_id" value={profesionalId} />
            </div>
          )}

          {/* Sucursal (solo si hay sucursales) */}
          {sucursales.length > 0 && (
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <Select value={sucursalId} onValueChange={setSucursalId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="sucursal_id" value={sucursalId} />
            </div>
          )}

          {/* Fecha y hora */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={fechaDefault}
                required
              />
              {state.fieldErrors?.fecha && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.fecha[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Inicio</Label>
              <Input
                id="hora_inicio"
                name="hora_inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
              />
              {state.fieldErrors?.hora_inicio && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.hora_inicio[0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_fin">Fin</Label>
              <Input
                id="hora_fin"
                name="hora_fin"
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                required
              />
              {state.fieldErrors?.hora_fin && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.hora_fin[0]}
                </p>
              )}
            </div>
          </div>

          {/* Estado (solo edicion) */}
          {esEdicion && (
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estadosDisponibles.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="estado" value={estado} />
            </div>
          )}

          {/* Sobreturno */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <Label htmlFor="sobreturno" className="cursor-pointer text-sm">
                Sobreturno
              </Label>
              <span className="text-xs text-muted-foreground">
                (fuera de horario, sin validar solapamiento)
              </span>
            </div>
            <Switch
              id="sobreturno"
              checked={sobreturno}
              onCheckedChange={setSobreturno}
            />
            <input type="hidden" name="sobreturno" value={sobreturno.toString()} />
          </div>

          {/* Recurrencia (solo en creacion) */}
          {!esEdicion && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-blue-500" />
                <Label className="text-sm">Turno recurrente</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Frecuencia</Label>
                  <Select value={recurrencia} onValueChange={setRecurrencia}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin recurrencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin recurrencia</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quincenal">Quincenal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="recurrencia" value={recurrencia === "none" ? "" : recurrencia} />
                </div>
                {recurrencia && recurrencia !== "none" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hasta</Label>
                    <Input
                      name="recurrencia_fin"
                      type="date"
                      value={recurrenciaFin}
                      onChange={(e) => setRecurrenciaFin(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Motivo (visible al cancelar/reprogramar o como campo general en edicion) */}
          {mostrarMotivo && (
            <div className="space-y-2 rounded-md border border-destructive/30 p-3 bg-destructive/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <Label htmlFor="motivo" className="text-destructive">
                  Motivo {estado === "cancelada" ? "de cancelacion" : ""}
                  {estado === "cancelada" && <span className="text-destructive"> *</span>}
                </Label>
              </div>
              <Textarea
                id="motivo"
                name="motivo"
                defaultValue={cita?.motivo || ""}
                placeholder={estado === "cancelada" ? "Indica el motivo de la cancelacion..." : "Motivo (opcional)"}
                rows={2}
              />
              {state.fieldErrors?.motivo && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.motivo[0]}
                </p>
              )}
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              name="notas"
              defaultValue={cita?.notas || notaPreseleccionada || ""}
              placeholder="Notas adicionales"
              rows={2}
            />
          </div>

          {/* Resumen de pagos (solo en edicion) */}
          {esEdicion && cita?.servicios?.precio > 0 && (() => {
            const precio = Number(cita.servicios.precio);
            const totalPagado = pagosCita.reduce((acc, p) => acc + Number(p.monto), 0);
            const restante = precio - totalPagado;
            const formatearPrecio = (v) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(v);
            return (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pagos</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDialogPagoAbierto(true)}
                  >
                    <DollarSign className="mr-1 h-3 w-3" />
                    Registrar pago
                  </Button>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-muted-foreground">Precio: {formatearPrecio(precio)}</span>
                  <span className="text-green-600">Pagado: {formatearPrecio(totalPagado)}</span>
                  {restante > 0 && <span className="text-destructive">Restante: {formatearPrecio(restante)}</span>}
                  {restante <= 0 && <Badge variant="secondary" className="text-xs">Pagado</Badge>}
                </div>
              </div>
            );
          })()}

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Guardando..."
                : esEdicion
                ? "Actualizar"
                : "Agendar cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {esEdicion && (
        <PagoDialog
          abierto={dialogPagoAbierto}
          onCerrar={() => {
            setDialogPagoAbierto(false);
            if (cita?.id) {
              obtenerPagosDeCita(cita.id).then(({ data }) => setPagosCita(data || []));
            }
          }}
          cita={cita}
          paciente={cita?.paciente_id ? { id: cita.paciente_id } : null}
        />
      )}
    </Dialog>
  );
}
