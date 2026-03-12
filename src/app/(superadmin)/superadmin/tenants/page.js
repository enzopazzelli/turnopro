"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search, ExternalLink, Circle, Trash2, Link2,
  Copy, Check, ShieldAlert, AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  obtenerTenants,
  eliminarTenant,
  eliminarTenants,
  impersonarTenant,
} from "@/app/(superadmin)/actions/superadmin";
import { toast } from "sonner";

const PLAN_COLORS = {
  trial:       "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  basico:      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  profesional: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  premium:     "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const RUBRO_LABELS = {
  odontologia: "Odontología", medicina: "Medicina", abogados: "Abogados",
  veterinaria: "Veterinaria", psicologia: "Psicología", contadores: "Contadores",
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRubro, setFiltroRubro] = useState("");
  const [filtroPlan, setFiltroPlan] = useState("");

  // Selección
  const [seleccionados, setSeleccionados] = useState(new Set());

  // Modal eliminar
  const [modalEliminar, setModalEliminar] = useState(null); // { ids: [], nombres: [] }
  const [pendingEliminar, startEliminar] = useTransition();

  // Modal impersonar
  const [modalImpersona, setModalImpersona] = useState(null); // { tenantId, nombre }
  const [linkImpersona, setLinkImpersona] = useState(null);   // { link, email, nombre }
  const [copiado, setCopiado] = useState(false);
  const [pendingImpersona, startImpersona] = useTransition();

  async function cargar() {
    setCargando(true);
    const { data } = await obtenerTenants({ busqueda, rubro: filtroRubro, plan: filtroPlan });
    setTenants(data);
    setSeleccionados(new Set());
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [busqueda, filtroRubro, filtroPlan]);

  // Selección
  function toggleSeleccion(id) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    const filtrables = tenants.filter((t) => t.slug !== "_plataforma").map((t) => t.id);
    if (seleccionados.size === filtrables.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(filtrables));
    }
  }

  const filtrables = tenants.filter((t) => t.slug !== "_plataforma");
  const todosSeleccionados = filtrables.length > 0 && seleccionados.size === filtrables.length;
  const algunoSeleccionado = seleccionados.size > 0;

  // Eliminar
  function abrirEliminar(ids) {
    const nombres = tenants.filter((t) => ids.includes(t.id)).map((t) => t.nombre);
    setModalEliminar({ ids, nombres });
  }

  function confirmarEliminar() {
    startEliminar(async () => {
      const { error } = await eliminarTenants(modalEliminar.ids);
      if (error) {
        toast.error("Error al eliminar: " + error);
      } else {
        toast.success(modalEliminar.ids.length === 1
          ? "Tenant eliminado correctamente"
          : `${modalEliminar.ids.length} tenants eliminados`
        );
        setModalEliminar(null);
        cargar();
      }
    });
  }

  // Impersonar
  function abrirImpersona(tenantId, nombre) {
    setModalImpersona({ tenantId, nombre });
    setLinkImpersona(null);
    setCopiado(false);
  }

  function generarLinkImpersona() {
    startImpersona(async () => {
      const { data, error } = await impersonarTenant(modalImpersona.tenantId);
      if (error) { toast.error(error); return; }
      setLinkImpersona(data);
    });
  }

  async function copiarLink() {
    if (!linkImpersona) return;
    await navigator.clipboard.writeText(linkImpersona.link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground text-sm">{tenants.length} registros</p>
        </div>
        {algunoSeleccionado && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => abrirEliminar([...seleccionados])}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar {seleccionados.size} seleccionado{seleccionados.size !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o slug..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroRubro || "all"} onValueChange={(v) => setFiltroRubro(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Rubro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los rubros</SelectItem>
            {Object.entries(RUBRO_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroPlan || "all"} onValueChange={(v) => setFiltroPlan(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los planes</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="basico">Básico</SelectItem>
            <SelectItem value="profesional">Profesional</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
          ) : tenants.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No se encontraron tenants.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 w-8">
                      <Checkbox
                        checked={todosSeleccionados}
                        onCheckedChange={toggleTodos}
                        aria-label="Seleccionar todos"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre / Slug</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rubro</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Usuarios</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Citas</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => {
                    const esSistema = t.slug === "_plataforma";
                    const seleccionado = seleccionados.has(t.id);
                    return (
                      <tr
                        key={t.id}
                        className={`border-b last:border-0 transition-colors ${seleccionado ? "bg-muted/30" : "hover:bg-muted/20"}`}
                      >
                        <td className="px-4 py-3">
                          {!esSistema && (
                            <Checkbox
                              checked={seleccionado}
                              onCheckedChange={() => toggleSeleccion(t.id)}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{t.nombre}</p>
                          <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{esSistema ? "—" : (RUBRO_LABELS[t.rubro] || t.rubro)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[t.plan] || ""}`}>
                              {t.plan}
                            </span>
                            {t.configuracion?.plan_interes && t.configuracion.plan_interes !== t.plan && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 whitespace-nowrap">
                                Solicitó: {t.configuracion.plan_interes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{t.usuarios_count}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{t.citas_count}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {format(new Date(t.created_at), "dd/MM/yyyy", { locale: es })}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-1.5 text-xs ${t.activo ? "text-green-600" : "text-muted-foreground"}`}>
                            <Circle className={`h-2 w-2 ${t.activo ? "fill-green-500" : "fill-muted-foreground"}`} />
                            {t.activo ? "Activo" : "Inactivo"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            {!esSistema && (
                              <>
                                <Button
                                  size="icon" variant="ghost" className="h-7 w-7"
                                  title="Acceder como profesional"
                                  onClick={() => abrirImpersona(t.id, t.nombre)}
                                >
                                  <Link2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-7 w-7 hover:text-destructive"
                                  title="Eliminar tenant"
                                  onClick={() => abrirEliminar([t.id])}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Button asChild variant="ghost" size="sm" className="h-7">
                              <Link href={`/superadmin/tenants/${t.id}`}>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog confirmar eliminación */}
      <Dialog open={!!modalEliminar} onOpenChange={(open) => !open && setModalEliminar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminar {modalEliminar?.ids.length === 1 ? "tenant" : `${modalEliminar?.ids.length} tenants`}
            </DialogTitle>
            <DialogDescription>
              Esta acción es irreversible. Se eliminarán todos los datos: usuarios, citas, pacientes, facturas y archivos asociados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm font-medium mb-2">
              {modalEliminar?.ids.length === 1 ? "Tenant a eliminar:" : "Tenants a eliminar:"}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {(modalEliminar?.nombres || []).map((n, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Circle className="h-1.5 w-1.5 fill-destructive text-destructive shrink-0" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEliminar(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminar}
              disabled={pendingEliminar}
            >
              {pendingEliminar ? "Eliminando..." : "Confirmar eliminación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog impersonar */}
      <Dialog
        open={!!modalImpersona}
        onOpenChange={(open) => { if (!open) { setModalImpersona(null); setLinkImpersona(null); setCopiado(false); } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Acceder como profesional
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Vas a generar un link de acceso para el profesional principal de <strong>{modalImpersona?.nombre}</strong>.
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Hacé clic en &quot;Generar link&quot;</li>
                <li>Copiá el link generado</li>
                <li>Abrí una ventana incógnito y pegá el link</li>
                <li>Verás el dashboard con una barra amarilla de aviso</li>
              </ol>
            </div>
            {!linkImpersona ? (
              <Button className="w-full" onClick={generarLinkImpersona} disabled={pendingImpersona}>
                <Link2 className="h-4 w-4 mr-2" />
                {pendingImpersona ? "Generando..." : "Generar link de acceso"}
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Link para <strong>{linkImpersona.nombre}</strong> ({linkImpersona.email}):
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={linkImpersona.link}
                    className="text-xs font-mono"
                    onClick={(e) => e.target.select()}
                  />
                  <Button size="icon" variant="outline" onClick={copiarLink} title="Copiar link">
                    {copiado ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {copiado && <p className="text-xs text-green-600">Link copiado al portapapeles</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalImpersona(null); setLinkImpersona(null); }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
