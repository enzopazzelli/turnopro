"use client";

import { useState } from "react";
import { Calculator, ExternalLink, FileText, Calendar, Copy } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  calcularPlazoJudicial,
  PLAZOS_FRECUENTES,
  LINKS_ABOGADOS,
  FERIAS_JUDICIALES,
  FERIADOS_NACIONALES,
  MODELOS_ESCRITOS,
} from "@/config/recursos-legales";
import { toast } from "sonner";

export function RecursosLegalesPage() {
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split("T")[0]);
  const [diasHabiles, setDiasHabiles] = useState("");
  const [plazoSeleccionado, setPlazoSeleccionado] = useState("");
  const [resultado, setResultado] = useState(null);
  const [modeloAbierto, setModeloAbierto] = useState(null);

  const calcular = () => {
    const dias = Number(diasHabiles);
    if (!dias || dias <= 0) {
      toast.error("Ingresa una cantidad de dias valida");
      return;
    }
    const res = calcularPlazoJudicial(new Date(fechaDesde), dias);
    setResultado(res);
  };

  const seleccionarPlazo = (valor) => {
    setPlazoSeleccionado(valor);
    const plazo = PLAZOS_FRECUENTES.find((p) => p.nombre === valor);
    if (plazo) {
      setDiasHabiles(String(plazo.dias));
    }
  };

  const copiarModelo = (contenido) => {
    navigator.clipboard.writeText(contenido);
    toast.success("Modelo copiado al portapapeles");
  };

  const categorias = [...new Set(MODELOS_ESCRITOS.map((m) => m.categoria))];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recursos Legales</h1>

      <Tabs defaultValue="plazos">
        <TabsList>
          <TabsTrigger value="plazos">
            <Calculator className="h-4 w-4 mr-2" /> Calculadora de Plazos
          </TabsTrigger>
          <TabsTrigger value="modelos">
            <FileText className="h-4 w-4 mr-2" /> Modelos de Escritos
          </TabsTrigger>
          <TabsTrigger value="calendario">
            <Calendar className="h-4 w-4 mr-2" /> Ferias y Feriados
          </TabsTrigger>
          <TabsTrigger value="links">
            <ExternalLink className="h-4 w-4 mr-2" /> Links Utiles
          </TabsTrigger>
        </TabsList>

        {/* CALCULADORA DE PLAZOS */}
        <TabsContent value="plazos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calculadora de Plazos Judiciales</CardTitle>
              <p className="text-sm text-muted-foreground">
                Calcula vencimientos en dias habiles judiciales (excluye fines de semana, feriados y ferias). El primer dia no se computa (art. 156 CPCCN).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Plazo frecuente</Label>
                  <Select value={plazoSeleccionado} onValueChange={seleccionarPlazo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plazo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAZOS_FRECUENTES.map((p) => (
                        <SelectItem key={p.nombre} value={p.nombre}>
                          {p.nombre} ({p.dias}d)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-desde">Fecha de notificacion</Label>
                  <Input
                    id="fecha-desde"
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dias-habiles">Dias habiles</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dias-habiles"
                      type="number"
                      min={1}
                      value={diasHabiles}
                      onChange={(e) => setDiasHabiles(e.target.value)}
                      placeholder="Ej: 15"
                    />
                    <Button onClick={calcular}>Calcular</Button>
                  </div>
                </div>
              </div>

              {plazoSeleccionado && (() => {
                const plazo = PLAZOS_FRECUENTES.find((p) => p.nombre === plazoSeleccionado);
                return plazo ? (
                  <p className="text-sm text-muted-foreground">
                    {plazo.norma} {plazo.nota && `— ${plazo.nota}`}
                  </p>
                ) : null;
              })()}

              {resultado && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Vencimiento:</span>
                    <span className="text-lg font-bold text-primary">
                      {format(resultado.fechaVencimiento, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{resultado.diasHabiles} dias habiles</span>
                    <span>{resultado.diasCorridos} dias corridos</span>
                  </div>
                  {resultado.detalle.length > 0 && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">
                        {resultado.detalle.length} dia(s) inhabil(es) en el periodo
                      </summary>
                      <ul className="mt-1 ml-4 list-disc">
                        {resultado.detalle.slice(0, 20).map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                        {resultado.detalle.length > 20 && <li>...y {resultado.detalle.length - 20} mas</li>}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plazos Procesales Frecuentes (CPCCN)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PLAZOS_FRECUENTES.map((p) => (
                  <div
                    key={p.nombre}
                    className="flex items-center justify-between p-2 border rounded text-sm hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setPlazoSeleccionado(p.nombre);
                      setDiasHabiles(String(p.dias));
                    }}
                  >
                    <span>{p.nombre}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{p.dias} dias</Badge>
                      <span className="text-xs text-muted-foreground">{p.norma}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODELOS DE ESCRITOS */}
        <TabsContent value="modelos" className="space-y-4">
          {categorias.map((cat) => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-lg">{cat}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MODELOS_ESCRITOS.filter((m) => m.categoria === cat).map((modelo) => (
                    <div
                      key={modelo.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{modelo.nombre}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModeloAbierto(modelo)}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copiarModelo(modelo.contenido)}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copiar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* FERIAS Y FERIADOS */}
        <TabsContent value="calendario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ferias Judiciales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(FERIAS_JUDICIALES).map(([key, feria]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium text-sm">{feria.nombre}</span>
                  <Badge variant="secondary">
                    {feria.inicio_dia}/{feria.inicio_mes} al {feria.fin_dia}/{feria.fin_mes}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {Object.entries(FERIADOS_NACIONALES).map(([anio, feriados]) => (
            <Card key={anio}>
              <CardHeader>
                <CardTitle className="text-lg">Feriados Nacionales {anio}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {feriados.map((f) => (
                    <div key={f} className="flex items-center gap-2 p-2 border rounded text-sm">
                      <Badge variant="outline">
                        {format(new Date(f + "T12:00:00"), "dd/MM", { locale: es })}
                      </Badge>
                      <span>
                        {format(new Date(f + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* LINKS UTILES */}
        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Links Utiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {LINKS_ABOGADOS.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{link.titulo}</p>
                      <p className="text-xs text-muted-foreground">{link.descripcion}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para ver modelo completo */}
      <Dialog open={!!modeloAbierto} onOpenChange={(open) => !open && setModeloAbierto(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modeloAbierto?.nombre}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={modeloAbierto?.contenido || ""}
            readOnly
            className="min-h-[400px] font-mono text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModeloAbierto(null)}>Cerrar</Button>
            <Button onClick={() => { copiarModelo(modeloAbierto?.contenido); setModeloAbierto(null); }}>
              <Copy className="h-4 w-4 mr-2" /> Copiar y cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
