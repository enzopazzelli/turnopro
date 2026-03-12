"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { format, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectorRangoFechas } from "./selector-rango-fechas";

const TabLoader = () => <div className="rounded-lg bg-muted/40 animate-pulse h-64 mt-2" />;

const TabReporteCitas     = dynamic(() => import("./tab-reporte-citas").then((m) => m.TabReporteCitas), { loading: TabLoader });
const TabReporteIngresos  = dynamic(() => import("./tab-reporte-ingresos").then((m) => m.TabReporteIngresos), { loading: TabLoader });
const TabReportePacientes = dynamic(() => import("./tab-reporte-pacientes").then((m) => m.TabReportePacientes), { loading: TabLoader });
const TabReporteServicios = dynamic(() => import("./tab-reporte-servicios").then((m) => m.TabReporteServicios), { loading: TabLoader });
const TabReporteHorarios  = dynamic(() => import("./tab-reporte-horarios").then((m) => m.TabReporteHorarios), { loading: TabLoader });
import {
  obtenerReporteCitas,
  obtenerReporteIngresos,
  obtenerReportePacientes,
  obtenerReporteServicios,
  obtenerReporteHorarios,
} from "@/app/(dashboard)/actions/reportes";
import { obtenerEquipo, obtenerSucursales } from "@/app/(dashboard)/actions/equipo";
import { useRubro } from "@/hooks/use-rubro";

export function ReportesCliente() {
  const rubro = useRubro();
  const labelPacientes = rubro?.crm?.terminoPlural || "Pacientes";

  const [tab, setTab] = useState("citas");
  const [rango, setRango] = useState({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });
  const [cargando, setCargando] = useState(false);
  const [datosCitas, setDatosCitas] = useState(null);
  const [datosIngresos, setDatosIngresos] = useState(null);
  const [datosPacientes, setDatosPacientes] = useState(null);
  const [datosServicios, setDatosServicios] = useState(null);
  const [datosHorarios, setDatosHorarios] = useState(null);

  // Filtros
  const [profesionales, setProfesionales] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [filtroProfesional, setFiltroProfesional] = useState("todos");
  const [filtroSucursal, setFiltroSucursal] = useState("todas");

  useEffect(() => {
    Promise.all([obtenerEquipo(), obtenerSucursales()]).then(([eqRes, sucRes]) => {
      setProfesionales((eqRes.data || []).filter((u) => u.rol === "profesional"));
      setSucursales(sucRes.data || []);
    });
  }, []);

  const cargarDatos = useCallback(async () => {
    if (!rango?.from || !rango?.to) return;

    setCargando(true);
    const fechaInicio = format(rango.from, "yyyy-MM-dd");
    const fechaFin = format(rango.to, "yyyy-MM-dd");

    const filtros = {};
    if (filtroProfesional !== "todos") {
      // Buscar el professional.id (de la tabla professionals) a partir del user
      const prof = profesionales.find((p) => p.id === filtroProfesional);
      filtros.professionalId = prof?.professionals?.[0]?.id || filtroProfesional;
    }
    if (filtroSucursal !== "todas") filtros.sucursalId = filtroSucursal;

    const [resCitas, resIngresos, resPacientes, resServicios, resHorarios] = await Promise.all([
      obtenerReporteCitas(fechaInicio, fechaFin, filtros),
      obtenerReporteIngresos(fechaInicio, fechaFin, filtros),
      obtenerReportePacientes(fechaInicio, fechaFin, filtros),
      obtenerReporteServicios(fechaInicio, fechaFin, filtros),
      obtenerReporteHorarios(fechaInicio, fechaFin, filtros),
    ]);

    setDatosCitas(resCitas.data);
    setDatosIngresos(resIngresos.data);
    setDatosPacientes(resPacientes.data);
    setDatosServicios(resServicios.data);
    setDatosHorarios(resHorarios.data);
    setCargando(false);
  }, [rango, filtroProfesional, filtroSucursal, profesionales]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Analisis detallado de tu actividad profesional.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {profesionales.length > 1 && (
            <Select value={filtroProfesional} onValueChange={setFiltroProfesional}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los profesionales</SelectItem>
                {profesionales.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {sucursales.length > 1 && (
            <Select value={filtroSucursal} onValueChange={setFiltroSucursal}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sucursales</SelectItem>
                {sucursales.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <SelectorRangoFechas rango={rango} onCambio={setRango} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="citas">Citas</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="pacientes">{labelPacientes}</TabsTrigger>
          <TabsTrigger value="servicios">Servicios</TabsTrigger>
          <TabsTrigger value="horarios">Horarios pico</TabsTrigger>
        </TabsList>

        <TabsContent value="citas" className="mt-4">
          <TabReporteCitas datos={datosCitas} cargando={cargando} />
        </TabsContent>

        <TabsContent value="ingresos" className="mt-4">
          <TabReporteIngresos datos={datosIngresos} cargando={cargando} />
        </TabsContent>

        <TabsContent value="pacientes" className="mt-4">
          <TabReportePacientes datos={datosPacientes} cargando={cargando} />
        </TabsContent>

        <TabsContent value="servicios" className="mt-4">
          <TabReporteServicios datos={datosServicios} cargando={cargando} />
        </TabsContent>

        <TabsContent value="horarios" className="mt-4">
          <TabReporteHorarios datos={datosHorarios} cargando={cargando} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
