"use client";

import { useState, useEffect, useActionState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, UserPlus, Mail, X, Crown, MapPin, Plus, Trash2 } from "lucide-react";
import { obtenerEquipo, obtenerInvitaciones, crearInvitacion, cancelarInvitacion, obtenerSucursales, crearSucursal, eliminarSucursal } from "@/app/(dashboard)/actions/equipo";
import { useAuthStore } from "@/stores/auth-store";
import { tenantTiene } from "@/lib/features";
import { toast } from "sonner";

const ROLES = {
  profesional: { label: "Profesional", color: "default" },
  secretaria: { label: "Secretaria", color: "secondary" },
};

export function TabEquipo() {
  const { tenant } = useAuthStore();
  const planPermiteEquipo = tenantTiene(tenant, "multi_profesional");
  const planPermiteSucursales = tenantTiene(tenant, "sucursales");

  const [equipo, setEquipo] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [invitarDialogAbierto, setInvitarDialogAbierto] = useState(false);
  const [sucursalDialogAbierto, setSucursalDialogAbierto] = useState(false);

  const formRef = useRef(null);
  const sucursalFormRef = useRef(null);

  const [invState, invAction, invPending] = useActionState(crearInvitacion, { error: null, success: false });
  const [sucState, sucAction, sucPending] = useActionState(crearSucursal, { error: null, success: false });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (invState.success) {
      toast.success("Invitacion enviada");
      setInvitarDialogAbierto(false);
      formRef.current?.reset();
      cargarDatos();
    } else if (invState.error) {
      toast.error(invState.error);
    }
  }, [invState]);

  useEffect(() => {
    if (sucState.success) {
      toast.success("Sucursal creada");
      setSucursalDialogAbierto(false);
      sucursalFormRef.current?.reset();
      cargarDatos();
    } else if (sucState.error) {
      toast.error(sucState.error);
    }
  }, [sucState]);

  async function cargarDatos() {
    const [equipoRes, invRes, sucRes] = await Promise.all([
      obtenerEquipo(),
      obtenerInvitaciones(),
      obtenerSucursales(),
    ]);
    setEquipo(equipoRes.data || []);
    setInvitaciones(invRes.data || []);
    setSucursales(sucRes.data || []);
  }

  async function handleCancelarInvitacion(id) {
    const res = await cancelarInvitacion(id);
    if (res.error) toast.error(res.error);
    else cargarDatos();
  }

  async function handleEliminarSucursal(id) {
    const res = await eliminarSucursal(id);
    if (res.error) toast.error(res.error);
    else { toast.success("Sucursal eliminada"); cargarDatos(); }
  }

  return (
    <div className="space-y-6">
      {/* Equipo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Equipo
              </CardTitle>
              <CardDescription>
                Profesionales y personal de tu consultorio.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setInvitarDialogAbierto(true)}
              disabled={!planPermiteEquipo}
            >
              <UserPlus className="h-4 w-4 mr-2" /> Invitar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!planPermiteEquipo && (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              Tu plan no incluye múltiples profesionales. Contactá al administrador para actualizar tu suscripción.
            </p>
          )}

          {equipo.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={u.avatar_url} />
                <AvatarFallback>
                  {u.nombre_completo?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm flex items-center gap-2">
                  {u.nombre_completo}
                  {u.rol === "profesional" && equipo.filter((e) => e.rol === "profesional").indexOf(u) === 0 && (
                    <Crown className="h-3 w-3 text-yellow-500" />
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <Badge variant={ROLES[u.rol]?.color || "outline"}>
                {ROLES[u.rol]?.label || u.rol}
              </Badge>
              {u.professionals?.[0]?.especialidad && (
                <span className="text-xs text-muted-foreground hidden md:block">
                  {u.professionals[0].especialidad}
                </span>
              )}
            </div>
          ))}

          {/* Invitaciones pendientes */}
          {invitaciones.filter((i) => i.estado === "pendiente").length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Invitaciones pendientes</p>
              {invitaciones.filter((i) => i.estado === "pendiente").map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-2 border border-dashed rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{inv.nombre || inv.email}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </div>
                  <Badge variant="outline">{ROLES[inv.rol]?.label || inv.rol}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleCancelarInvitacion(inv.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sucursales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Sucursales
              </CardTitle>
              <CardDescription>
                Sedes o consultorios donde atiendes.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setSucursalDialogAbierto(true)}
              disabled={!planPermiteSucursales}
            >
              <Plus className="h-4 w-4 mr-2" /> Nueva sucursal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!planPermiteSucursales && (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              Tu plan no incluye múltiples sucursales. Contactá al administrador para actualizar tu suscripción.
            </p>
          )}

          {sucursales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay sucursales registradas
            </p>
          ) : (
            sucursales.map((suc) => (
              <div key={suc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm flex items-center gap-2">
                    {suc.nombre}
                    {suc.es_principal && <Badge variant="default" className="text-[10px]">Principal</Badge>}
                    {!suc.activa && <Badge variant="secondary" className="text-[10px]">Inactiva</Badge>}
                  </p>
                  {suc.direccion && <p className="text-xs text-muted-foreground">{suc.direccion}</p>}
                  {suc.telefono && <p className="text-xs text-muted-foreground">Tel: {suc.telefono}</p>}
                </div>
                {!suc.es_principal && (
                  <Button variant="ghost" size="icon" onClick={() => handleEliminarSucursal(suc.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Dialog invitar */}
      <Dialog open={invitarDialogAbierto} onOpenChange={setInvitarDialogAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar miembro al equipo</DialogTitle>
          </DialogHeader>
          <form ref={formRef} action={invAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-nombre">Nombre</Label>
              <Input id="inv-nombre" name="nombre" placeholder="Nombre completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-email">Email *</Label>
              <Input id="inv-email" name="email" type="email" required placeholder="email@ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-rol">Rol *</Label>
              <Select name="rol" defaultValue="profesional">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profesional">Profesional</SelectItem>
                  <SelectItem value="secretaria">Secretaria / Recepcionista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Se creara una invitacion pendiente. El usuario debera registrarse con este email para unirse al equipo.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInvitarDialogAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={invPending}>
                {invPending ? "Enviando..." : "Invitar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog sucursal */}
      <Dialog open={sucursalDialogAbierto} onOpenChange={setSucursalDialogAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva sucursal</DialogTitle>
          </DialogHeader>
          <form ref={sucursalFormRef} action={sucAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suc-nombre">Nombre *</Label>
              <Input id="suc-nombre" name="nombre" required placeholder="Ej: Sede Centro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suc-direccion">Direccion</Label>
              <Input id="suc-direccion" name="direccion" placeholder="Av. Corrientes 1234" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="suc-telefono">Telefono</Label>
                <Input id="suc-telefono" name="telefono" placeholder="(011) 4567-8901" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suc-email">Email</Label>
                <Input id="suc-email" name="email" type="email" placeholder="sede@ejemplo.com" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSucursalDialogAbierto(false)}>Cancelar</Button>
              <Button type="submit" disabled={sucPending}>
                {sucPending ? "Creando..." : "Crear sucursal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
