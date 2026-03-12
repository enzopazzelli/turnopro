"use client";

import { useMemo } from "react";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Clock, Syringe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESPECIES_MASCOTA } from "@/lib/constants";
import { calcularVacunasPendientes, ANTIPARASITARIOS } from "@/config/calendario-vacunacion";
import { CartillaVacunacion } from "./cartilla-vacunacion";
import { HistorialMascota } from "./historial-mascota";
import { DesparasitacionesLista } from "./desparasitaciones-lista";

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const fecha = new Date(fechaNacimiento);
  const anios = differenceInYears(new Date(), fecha);
  if (anios >= 1) return `${anios} año${anios > 1 ? "s" : ""}`;
  const meses = differenceInMonths(new Date(), fecha);
  return `${meses} mes${meses !== 1 ? "es" : ""}`;
}

export function MascotaDetalle({ mascota }) {
  const especie = ESPECIES_MASCOTA.find((e) => e.valor === mascota.especie)?.nombre || mascota.especie;
  const edad = calcularEdad(mascota.fecha_nacimiento);

  const vacunasPendientes = useMemo(() => {
    if (!mascota.especie || !mascota.fecha_nacimiento) return [];
    const aplicadas = (mascota.vacunas || []).map((v) => ({
      tipo: v.tipo || v.vacuna,
      nombre: v.vacuna,
      fecha: v.fecha_aplicacion,
    }));
    return calcularVacunasPendientes(mascota.especie, mascota.fecha_nacimiento, aplicadas);
  }, [mascota.especie, mascota.fecha_nacimiento, mascota.vacunas]);

  const antiparasitarios = useMemo(() => {
    if (!mascota.especie) return { internos: [], externos: [] };
    return {
      internos: ANTIPARASITARIOS.internos.filter((a) => a.especies.includes(mascota.especie)),
      externos: ANTIPARASITARIOS.externos.filter((a) => a.especies.includes(mascota.especie)),
    };
  }, [mascota.especie]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {mascota.foto_url ? (
          <img
            src={mascota.foto_url}
            alt={mascota.nombre}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl">
            {mascota.especie === "perro" ? "🐕" : mascota.especie === "gato" ? "🐈" : "🐾"}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold">{mascota.nombre}</h2>
          <p className="text-muted-foreground">
            {especie}
            {mascota.raza && ` - ${mascota.raza}`}
            {edad && ` | ${edad}`}
          </p>
          <p className="text-sm text-muted-foreground">
            Tutor: {mascota.pacientes?.nombre_completo || "-"} | {mascota.pacientes?.telefono || "-"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="vacunacion">
            Vacunacion ({mascota.vacunas?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="recomendaciones">
            Recomendaciones {vacunasPendientes.length > 0 && <Badge variant="destructive" className="ml-1 text-[10px] px-1">{vacunasPendientes.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="historial">
            Historial ({mascota.consultas?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="desparasitaciones">
            Desparasitaciones ({mascota.desparasitaciones?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6 grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Especie: </span>{especie}</div>
              <div><span className="font-medium">Raza: </span>{mascota.raza || "-"}</div>
              <div><span className="font-medium">Sexo: </span>{mascota.sexo === "macho" ? "Macho" : mascota.sexo === "hembra" ? "Hembra" : "-"}</div>
              <div><span className="font-medium">Peso: </span>{mascota.peso_kg ? `${mascota.peso_kg} kg` : "-"}</div>
              <div><span className="font-medium">Color: </span>{mascota.color || "-"}</div>
              <div><span className="font-medium">Microchip: </span>{mascota.microchip || "-"}</div>
              {mascota.fecha_nacimiento && (
                <div>
                  <span className="font-medium">Nacimiento: </span>
                  {format(new Date(mascota.fecha_nacimiento), "dd/MM/yyyy", { locale: es })}
                </div>
              )}
              {mascota.notas && (
                <div className="col-span-2">
                  <span className="font-medium">Notas: </span>{mascota.notas}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacunacion">
          <CartillaVacunacion
            vacunas={mascota.vacunas || []}
            mascotaId={mascota.id}
          />
        </TabsContent>

        <TabsContent value="recomendaciones">
          <div className="space-y-4">
            {/* Vacunas pendientes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Syringe className="h-5 w-5" /> Vacunas Recomendadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!mascota.fecha_nacimiento ? (
                  <p className="text-sm text-muted-foreground">
                    Registra la fecha de nacimiento para ver las vacunas recomendadas segun el calendario.
                  </p>
                ) : vacunasPendientes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay vacunas pendientes. El esquema de vacunacion esta al dia.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {vacunasPendientes.map((v, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 border rounded-lg ${
                          v.estado === "atrasada" ? "border-destructive bg-destructive/5" :
                          v.estado === "proximo_refuerzo" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950" :
                          ""
                        }`}
                      >
                        {v.estado === "atrasada" ? (
                          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{v.nombre}</p>
                          {v.nota && <p className="text-xs text-muted-foreground">{v.nota}</p>}
                          {v.ultimaFecha && (
                            <p className="text-xs text-muted-foreground">
                              Ultima aplicacion: {format(new Date(v.ultimaFecha), "dd/MM/yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                        <Badge variant={v.estado === "atrasada" ? "destructive" : v.estado === "proximo_refuerzo" ? "outline" : "secondary"} className={v.estado === "proximo_refuerzo" ? "border-yellow-500 text-yellow-600" : ""}>
                          {v.estado === "atrasada" ? "Atrasada" : v.estado === "proximo_refuerzo" ? "Refuerzo" : "Pendiente"}
                        </Badge>
                        {v.obligatoria && <Badge variant="default" className="text-[10px]">Obligatoria</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Antiparasitarios recomendados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Antiparasitarios Recomendados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {antiparasitarios.internos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Internos</h4>
                    <div className="space-y-1">
                      {antiparasitarios.internos.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                          <div>
                            <span className="font-medium">{a.nombre}</span>
                            {a.nota && <span className="text-xs text-muted-foreground ml-2">— {a.nota}</span>}
                          </div>
                          <Badge variant="outline">{a.frecuencia}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {antiparasitarios.externos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Externos</h4>
                    <div className="space-y-1">
                      {antiparasitarios.externos.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                          <div>
                            <span className="font-medium">{a.nombre}</span>
                            {a.tipo && <Badge variant="secondary" className="ml-2 text-[10px]">{a.tipo}</Badge>}
                            {a.nota && <span className="text-xs text-muted-foreground ml-2">— {a.nota}</span>}
                          </div>
                          <Badge variant="outline">{a.frecuencia}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historial">
          <HistorialMascota
            consultas={mascota.consultas || []}
            mascotaId={mascota.id}
          />
        </TabsContent>

        <TabsContent value="desparasitaciones">
          <DesparasitacionesLista
            desparasitaciones={mascota.desparasitaciones || []}
            mascotaId={mascota.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
