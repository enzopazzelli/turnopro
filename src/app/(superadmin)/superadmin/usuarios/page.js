"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, KeyRound, Link2, UserX, UserCheck, Copy, Check, ShieldAlert, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  obtenerUsuarios,
  cambiarContrasenaUsuario,
  generarLinkAcceso,
  activarDesactivarUsuario,
  eliminarUsuario,
} from "@/app/(superadmin)/actions/superadmin";
import { toast } from "sonner";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");

  // Modal contraseña
  const [modalPwd, setModalPwd] = useState(null); // { authId, nombre }
  const [nuevaPwd, setNuevaPwd] = useState("");
  const [pendingPwd, startPwd] = useTransition();

  // Modal impersonación
  const [modalImpersona, setModalImpersona] = useState(null); // { email, nombre }
  const [linkGenerado, setLinkGenerado] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [pendingLink, startLink] = useTransition();

  // Activar/desactivar
  const [pendingToggle, startToggle] = useTransition();

  // Modal eliminar usuario
  const [modalEliminar, setModalEliminar] = useState(null); // { id, authId, nombre }
  const [pendingEliminar, startEliminar] = useTransition();

  async function cargar() {
    setCargando(true);
    const { data } = await obtenerUsuarios({ busqueda, rol: filtroRol });
    setUsuarios(data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [busqueda, filtroRol]);

  function handleCambiarPwd() {
    startPwd(async () => {
      const { error } = await cambiarContrasenaUsuario(modalPwd.authId, nuevaPwd);
      if (error) toast.error(error);
      else { toast.success("Contraseña actualizada"); setModalPwd(null); setNuevaPwd(""); }
    });
  }

  function handleAbrirImpersona(email, nombre) {
    setModalImpersona({ email, nombre });
    setLinkGenerado("");
    setCopiado(false);
  }

  function handleGenerarLink() {
    if (!modalImpersona) return;
    startLink(async () => {
      const { data, error } = await generarLinkAcceso(modalImpersona.email);
      if (error) { toast.error(error); return; }
      setLinkGenerado(data.link);
    });
  }

  async function handleCopiarLink() {
    if (!linkGenerado) return;
    await navigator.clipboard.writeText(linkGenerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  function handleToggleActivo(userId, activo) {
    startToggle(async () => {
      const { error } = await activarDesactivarUsuario(userId, !activo);
      if (error) toast.error(error);
      else { toast.success(activo ? "Usuario desactivado" : "Usuario activado"); cargar(); }
    });
  }

  function confirmarEliminar() {
    startEliminar(async () => {
      const { error } = await eliminarUsuario(modalEliminar.id, modalEliminar.authId);
      if (error) toast.error(error);
      else { toast.success("Usuario eliminado"); setModalEliminar(null); cargar(); }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground text-sm">{usuarios.length} registros</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroRol || "all"} onValueChange={(v) => setFiltroRol(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="profesional">Profesional</SelectItem>
            <SelectItem value="secretaria">Secretaria</SelectItem>
            <SelectItem value="paciente">Paciente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {cargando ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Cargando...</div>
          ) : usuarios.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No se encontraron usuarios.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tenant</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.nombre_completo}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{u.tenants?.nombre}</p>
                        <p className="text-xs text-muted-foreground font-mono">{u.tenants?.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{u.rol}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {format(new Date(u.created_at), "dd/MM/yy", { locale: es })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${u.activo ? "text-green-600" : "text-muted-foreground"}`}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            title="Cambiar contraseña"
                            onClick={() => setModalPwd({ authId: u.auth_id, nombre: u.nombre_completo })}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            title="Acceder como este usuario"
                            onClick={() => handleAbrirImpersona(u.email, u.nombre_completo)}
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className={`h-7 w-7 ${u.activo ? "hover:text-destructive" : "hover:text-green-600"}`}
                            title={u.activo ? "Desactivar" : "Activar"}
                            disabled={pendingToggle}
                            onClick={() => handleToggleActivo(u.id, u.activo)}
                          >
                            {u.activo ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 hover:text-destructive"
                            title="Eliminar usuario"
                            onClick={() => setModalEliminar({ id: u.id, authId: u.auth_id, nombre: u.nombre_completo })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal cambiar contraseña */}
      <Dialog open={!!modalPwd} onOpenChange={(open) => !open && (setModalPwd(null), setNuevaPwd(""))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{modalPwd?.nombre}</p>
            <div className="space-y-1.5">
              <Label htmlFor="nueva-pwd">Nueva contraseña</Label>
              <Input
                id="nueva-pwd"
                type="password"
                value={nuevaPwd}
                onChange={(e) => setNuevaPwd(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPwd(null)}>Cancelar</Button>
            <Button onClick={handleCambiarPwd} disabled={pendingPwd || nuevaPwd.length < 8}>
              {pendingPwd ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal impersonación */}
      <Dialog
        open={!!modalImpersona}
        onOpenChange={(open) => { if (!open) { setModalImpersona(null); setLinkGenerado(""); setCopiado(false); } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Acceder como usuario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Vas a generar un link de acceso temporal para <strong>{modalImpersona?.nombre}</strong> ({modalImpersona?.email}).
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Hacé clic en &quot;Generar link&quot;</li>
                <li>Copiá el link generado</li>
                <li>Abrí una ventana incógnito y pegá el link</li>
                <li>Verás el dashboard con una barra amarilla de aviso</li>
                <li>Cerrá la ventana incógnito para salir</li>
              </ol>
            </div>
            {!linkGenerado ? (
              <Button
                className="w-full"
                onClick={handleGenerarLink}
                disabled={pendingLink}
              >
                <Link2 className="h-4 w-4 mr-2" />
                {pendingLink ? "Generando..." : "Generar link de acceso"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Link generado (válido por 1 hora):</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={linkGenerado}
                    className="text-xs font-mono"
                    onClick={(e) => e.target.select()}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopiarLink}
                    title="Copiar link"
                  >
                    {copiado ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {copiado && <p className="text-xs text-green-600">Link copiado al portapapeles</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalImpersona(null); setLinkGenerado(""); }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar eliminación de usuario */}
      <Dialog open={!!modalEliminar} onOpenChange={(open) => !open && setModalEliminar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminar usuario
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              Vas a eliminar a <strong>{modalEliminar?.nombre}</strong>. Esta acción es irreversible y elimina al usuario de la plataforma y del sistema de autenticación.
            </p>
            <p className="text-xs text-muted-foreground">
              Los datos de su tenant (citas, pacientes, etc.) no se eliminan.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEliminar(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmarEliminar} disabled={pendingEliminar}>
              {pendingEliminar ? "Eliminando..." : "Eliminar usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
