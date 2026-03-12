"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  CalendarPlus,
  FileText,
  User,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EstadoBadge } from "@/components/agenda/estado-badge";
import { PacienteDialog } from "./paciente-dialog";
import { ArchivosPaciente } from "./archivos-paciente";
import { CitaRapidaDialog } from "@/components/agenda/cita-rapida-dialog";
import { PagoDialog } from "@/components/facturacion/pago-dialog";
import { obtenerCuentaCorriente } from "@/app/(dashboard)/actions/facturacion";
import { GENEROS, LABELS_METODO_PAGO } from "@/lib/constants";
import { useRubro } from "@/hooks/use-rubro";

function obtenerIniciales(nombre) {
  return nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatearFecha(fecha) {
  if (!fecha) return "-";
  try {
    return format(new Date(fecha + "T12:00:00"), "dd/MM/yyyy");
  } catch {
    return fecha;
  }
}

function formatearFechaHistorial(fecha) {
  try {
    return format(new Date(fecha + "T12:00:00"), "dd MMM yyyy", { locale: es });
  } catch {
    return fecha;
  }
}

export function PacienteDetalle({ paciente, citas }) {
  const router = useRouter();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [dialogCitaAbierto, setDialogCitaAbierto] = useState(false);
  const [dialogPagoAbierto, setDialogPagoAbierto] = useState(false);
  const [cuentaCorriente, setCuentaCorriente] = useState(null);
  const { crm } = useRubro();

  const cargarCuentaCorriente = async () => {
    const { data } = await obtenerCuentaCorriente(paciente.id);
    setCuentaCorriente(data);
  };

  useEffect(() => {
    cargarCuentaCorriente();
  }, [paciente.id]);
  const campos = crm.campos;

  const generoLabel =
    GENEROS.find((g) => g.valor === paciente.genero)?.nombre || "-";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/pacientes")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {obtenerIniciales(paciente.nombre_completo)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {paciente.nombre_completo}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {(paciente.etiquetas || []).map((etiqueta) => (
                <Badge key={etiqueta} variant="secondary" className="text-xs">
                  {etiqueta}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setDialogCitaAbierto(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Agendar cita
          </Button>
          <Button variant="outline" onClick={() => setDialogAbierto(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="informacion">
        <TabsList>
          <TabsTrigger value="informacion">
            <User className="mr-2 h-4 w-4" />
            Informacion
          </TabsTrigger>
          <TabsTrigger value="historial">
            <Calendar className="mr-2 h-4 w-4" />
            Historial ({citas.length})
          </TabsTrigger>
          <TabsTrigger value="cuenta-corriente">
            <DollarSign className="mr-2 h-4 w-4" />
            Cuenta Corriente
          </TabsTrigger>
          <TabsTrigger value="archivos">
            <FileText className="mr-2 h-4 w-4" />
            Archivos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Informacion */}
        <TabsContent value="informacion" className="space-y-4">
          <div className={`grid gap-4 ${campos.obra_social ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoItem
                  icono={Phone}
                  label="Telefono"
                  valor={paciente.telefono}
                />
                <InfoItem
                  icono={Mail}
                  label="Email"
                  valor={paciente.email}
                />
                <InfoItem
                  icono={CreditCard}
                  label="DNI"
                  valor={paciente.dni}
                />
                {campos.fecha_nacimiento && (
                  <InfoItem
                    icono={Calendar}
                    label="Fecha de nacimiento"
                    valor={formatearFecha(paciente.fecha_nacimiento)}
                  />
                )}
                {campos.genero && (
                  <InfoItem
                    icono={User}
                    label="Genero"
                    valor={generoLabel}
                  />
                )}
                <InfoItem
                  icono={MapPin}
                  label="Direccion"
                  valor={paciente.direccion}
                />
              </CardContent>
            </Card>

            {campos.obra_social && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cobertura medica</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoItem
                    label="Obra social"
                    valor={paciente.obra_social}
                  />
                  <InfoItem
                    label="N° afiliado"
                    valor={paciente.numero_afiliado}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {paciente.notas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{paciente.notas}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="historial">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Aun no tiene citas registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  citas.map((cita) => (
                    <TableRow key={cita.id}>
                      <TableCell className="font-medium">
                        {formatearFechaHistorial(cita.fecha)}
                      </TableCell>
                      <TableCell>
                        {cita.hora_inicio?.slice(0, 5)} -{" "}
                        {cita.hora_fin?.slice(0, 5)}
                      </TableCell>
                      <TableCell>
                        {cita.servicios ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: cita.servicios.color,
                              }}
                            />
                            {cita.servicios.nombre}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <EstadoBadge estado={cita.estado} />
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {cita.notas || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab: Cuenta Corriente */}
        <TabsContent value="cuenta-corriente">
          {cuentaCorriente ? (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(cuentaCorriente.totalCargos)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total cargos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(cuentaCorriente.totalPagos)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total pagado</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className={`text-2xl font-bold ${cuentaCorriente.saldo > 0 ? "text-destructive" : "text-green-600"}`}>
                        {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(cuentaCorriente.saldo)}
                      </p>
                      <p className="text-xs text-muted-foreground">Saldo</p>
                    </div>
                    {cuentaCorriente.saldo > 0 && (
                      <Button size="sm" onClick={() => setDialogPagoAbierto(true)}>
                        <DollarSign className="mr-1 h-4 w-4" />
                        Cobrar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Movimientos */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentaCorriente.movimientos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay movimientos registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cuentaCorriente.movimientos.map((m, i) => (
                        <TableRow key={`${m.tipo}-${m.id}-${i}`}>
                          <TableCell className="text-sm">{m.fecha}</TableCell>
                          <TableCell>
                            {m.tipo === "cargo" ? (
                              <span className="flex items-center gap-1 text-destructive text-sm">
                                <ArrowUpCircle className="h-3 w-3" />
                                Cargo
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <ArrowDownCircle className="h-3 w-3" />
                                Abono
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {m.concepto}
                            {m.metodo_pago && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {LABELS_METODO_PAGO[m.metodo_pago] || m.metodo_pago}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className={`text-right text-sm ${m.tipo === "cargo" ? "text-destructive" : "text-green-600"}`}>
                            {m.tipo === "cargo" ? "+" : "-"}
                            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(m.monto)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(m.saldo)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Cargando cuenta corriente...
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Archivos */}
        <TabsContent value="archivos">
          <ArchivosPaciente pacienteId={paciente.id} />
        </TabsContent>
      </Tabs>

      <PacienteDialog
        abierto={dialogAbierto}
        onCerrar={() => setDialogAbierto(false)}
        paciente={paciente}
      />

      <CitaRapidaDialog
        abierto={dialogCitaAbierto}
        onCerrar={() => setDialogCitaAbierto(false)}
        pacientePreseleccionado={{
          id: paciente.id,
          nombre_completo: paciente.nombre_completo,
          telefono: paciente.telefono,
          email: paciente.email,
        }}
      />

      <PagoDialog
        abierto={dialogPagoAbierto}
        onCerrar={() => {
          setDialogPagoAbierto(false);
          cargarCuentaCorriente();
        }}
        paciente={{
          id: paciente.id,
          nombre_completo: paciente.nombre_completo,
        }}
      />
    </div>
  );
}

function InfoItem({ icono: Icono, label, valor }) {
  return (
    <div className="flex items-center gap-3">
      {Icono && <Icono className="h-4 w-4 text-muted-foreground shrink-0" />}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{valor || "-"}</p>
      </div>
    </div>
  );
}
