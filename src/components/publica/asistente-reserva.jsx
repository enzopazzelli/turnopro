"use client";

import { useEffect } from "react";
import { useReservaStore } from "@/stores/reserva-store";
import { Card, CardContent } from "@/components/ui/card";
import { IndicadorPasos } from "./indicador-pasos";
import { PasoServicio } from "./paso-servicio";
import { PasoFecha } from "./paso-fecha";
import { PasoHorario } from "./paso-horario";
import { PasoDatosCliente } from "./paso-datos-cliente";
import { PasoConfirmacion } from "./paso-confirmacion";
import { motion, AnimatePresence } from "framer-motion";

export function AsistenteReserva({
  slug,
  servicios,
  disponibilidad,
  fechasBloqueadas,
  terminoPaciente,
  politicaCancelacion,
}) {
  const { paso, reiniciar } = useReservaStore();

  // Reiniciar el wizard cuando se monta
  useEffect(() => {
    reiniciar();
  }, [reiniciar]);

  const renderPaso = () => {
    switch (paso) {
      case 1:
        return <PasoServicio servicios={servicios} />;
      case 2:
        return (
          <PasoFecha
            disponibilidad={disponibilidad}
            fechasBloqueadas={fechasBloqueadas}
          />
        );
      case 3:
        return <PasoHorario slug={slug} />;
      case 4:
        return <PasoDatosCliente terminoPaciente={terminoPaciente} />;
      case 5:
        return <PasoConfirmacion slug={slug} politicaCancelacion={politicaCancelacion} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <IndicadorPasos pasoActual={paso} />

      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={paso}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderPaso()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
