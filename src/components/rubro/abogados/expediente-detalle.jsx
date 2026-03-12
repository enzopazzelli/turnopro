"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ESTADOS_EXPEDIENTE } from "@/lib/constants";
import { DocumentoUpload } from "./documento-upload";
import { VencimientosLista } from "./vencimientos-lista";
import { EtapasProcesales } from "./etapas-procesales";

export function ExpedienteDetalle({ expediente }) {
  const colorEstado = ESTADOS_EXPEDIENTE.find((e) => e.valor === expediente.estado)?.color || "#6b7280";
  const nombreEstado = ESTADOS_EXPEDIENTE.find((e) => e.valor === expediente.estado)?.nombre || expediente.estado;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold">{expediente.caratula}</h2>
          <Badge variant="outline" style={{ borderColor: colorEstado, color: colorEstado }}>
            {nombreEstado}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Cliente: {expediente.pacientes?.nombre_completo || "-"}
          {expediente.numero_expediente && ` | Exp. ${expediente.numero_expediente}`}
        </p>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="documentos">
            Documentos ({expediente.documentos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="vencimientos">
            Vencimientos ({expediente.vencimientos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="etapas">
            Etapas ({expediente.etapas?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {expediente.juzgado && (
                  <div><span className="font-medium">Juzgado: </span>{expediente.juzgado}</div>
                )}
                {expediente.fuero && (
                  <div><span className="font-medium">Fuero: </span>{expediente.fuero}</div>
                )}
                {expediente.tipo && (
                  <div><span className="font-medium">Tipo: </span>{expediente.tipo}</div>
                )}
                {expediente.fecha_inicio && (
                  <div><span className="font-medium">Fecha inicio: </span>{expediente.fecha_inicio}</div>
                )}
              </div>
              {expediente.descripcion && (
                <div><span className="font-medium">Descripcion: </span>{expediente.descripcion}</div>
              )}
              {expediente.notas_privadas && (
                <div className="p-3 border rounded bg-yellow-50 dark:bg-yellow-950">
                  <span className="font-medium">Notas privadas: </span>{expediente.notas_privadas}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Contacto: {expediente.pacientes?.email || "-"} | {expediente.pacientes?.telefono || "-"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentoUpload
            expedienteId={expediente.id}
            pacienteId={expediente.paciente_id}
            documentos={expediente.documentos || []}
          />
        </TabsContent>

        <TabsContent value="vencimientos">
          <VencimientosLista
            vencimientos={expediente.vencimientos || []}
            expedienteId={expediente.id}
          />
        </TabsContent>

        <TabsContent value="etapas">
          <EtapasProcesales
            etapas={expediente.etapas || []}
            expedienteId={expediente.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
