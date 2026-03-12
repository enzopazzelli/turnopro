"use client";

import { motion } from "framer-motion";
import { CalendarDays, Users, Clock, DollarSign, UserX } from "lucide-react";
import { useRubro } from "@/hooks/use-rubro";
import { TarjetaMetrica } from "./tarjeta-metrica";
import { SelectorPeriodo } from "./selector-periodo";
import { GraficoCitas } from "./grafico-citas";
import { GraficoEstados } from "./grafico-estados";
import { GraficoServicios } from "./grafico-servicios";
import { GraficoHorarios } from "./grafico-horarios";
import { GraficoPacientes } from "./grafico-pacientes";

const LABELS_PERIODO = {
  hoy: "Citas Hoy",
  semana: "Citas de la Semana",
  mes: "Citas del Mes",
  trimestre: "Citas del Trimestre",
};

const LABELS_INGRESOS = {
  hoy: "Ingresos Hoy",
  semana: "Ingresos de la Semana",
  mes: "Ingresos del Mes",
  trimestre: "Ingresos del Trimestre",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function DashboardCliente({ datos, periodo, onCambioPeriodo }) {
  const rubro = useRubro();
  const labelPacientes = rubro?.crm?.terminoPlural || "Pacientes";
  const {
    metricas,
    citasPorDia,
    distribucionEstados,
    serviciosDemandados,
    horariosPico,
    pacientesNuevosVsRecurrentes,
  } = datos;

  const formatearPrecio = (valor) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de vuelta. Aqui tienes un resumen de tu actividad.
          </p>
        </div>
        <SelectorPeriodo periodo={periodo} onCambio={onCambioPeriodo} />
      </motion.div>

      {/* KPI Cards - 5 columns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <motion.div variants={itemVariants}>
          <TarjetaMetrica
            titulo={LABELS_PERIODO[periodo]}
            valor={periodo === "hoy" ? metricas.citasHoy : metricas.citasPeriodo}
            descripcion={
              periodo === "hoy"
                ? `${metricas.citasHoyPendientes} pendientes`
                : `${metricas.citasHoyPendientes} pendientes hoy`
            }
            icono={CalendarDays}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TarjetaMetrica
            titulo={labelPacientes}
            valor={metricas.totalPacientes}
            descripcion="Activos"
            icono={Users}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TarjetaMetrica
            titulo="Proxima Cita"
            valor={metricas.proximaCita?.hora || "—"}
            descripcion={
              metricas.proximaCita
                ? metricas.proximaCita.nombre ||
                  metricas.proximaCita.servicio ||
                  "Sin nombre"
                : "Sin citas pendientes"
            }
            icono={Clock}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TarjetaMetrica
            titulo={LABELS_INGRESOS[periodo]}
            valor={formatearPrecio(metricas.ingresosPeriodo)}
            descripcion="Citas completadas"
            icono={DollarSign}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TarjetaMetrica
            titulo="Ausentismo"
            valor={`${metricas.tasaAusentismo}%`}
            descripcion={`${metricas.totalNoAsistio} no asistieron`}
            icono={UserX}
          />
        </motion.div>
      </div>

      {/* Graficos - fila 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div className="lg:col-span-2" variants={itemVariants}>
          <GraficoCitas datos={citasPorDia} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <GraficoEstados datos={distribucionEstados} />
        </motion.div>
      </div>

      {/* Graficos - fila 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={itemVariants}>
          <GraficoServicios datos={serviciosDemandados} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <GraficoHorarios datos={horariosPico} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <GraficoPacientes datos={pacientesNuevosVsRecurrentes} />
        </motion.div>
      </div>
    </motion.div>
  );
}
