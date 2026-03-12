"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarItems } from "./sidebar-items";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useRubro } from "@/hooks/use-rubro";
import { getRubroModulos, getRubroConfig } from "@/config/rubros";
import { useAuthStore } from "@/stores/auth-store";
import { tienePermisoRuta, tienePermiso } from "@/lib/permisos";
import { tenantTiene } from "@/lib/features";

function SidebarContent({ colapsado, onToggle }) {
  const pathname = usePathname();
  const { crm } = useRubro();
  const tenant = useAuthStore((s) => s.tenant);
  const usuario = useAuthStore((s) => s.usuario);
  const rol = usuario?.rol || "profesional";
  const rubro = tenant?.rubro;
  const rubroConfig = rubro ? getRubroConfig(rubro) : null;
  const modulos = rubro ? getRubroModulos(rubro) : [];
  const mostrarModulosRubro = tienePermiso(rol, "modulos_rubro") && tenantTiene(tenant, "modulos_rubro");

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 shrink-0">
        <CalendarDays className="h-6 w-6 text-primary shrink-0" />
        {!colapsado && (
          <span className="font-bold text-lg">{APP_NAME}</span>
        )}
      </div>

      <Separator />

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {sidebarItems
          .filter((item) => tienePermisoRuta(rol, item.href) && (!item.feature || tenantTiene(tenant, item.feature)))
          .map((item) => {
          const activo = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icono = item.icono;
          const titulo =
            item.href === "/dashboard/pacientes"
              ? crm.terminoPlural
              : item.titulo;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activo
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={colapsado ? titulo : undefined}
            >
              <Icono className="h-5 w-5 shrink-0" />
              {!colapsado && <span>{titulo}</span>}
            </Link>
          );
        })}

        {/* Módulos del rubro */}
        {mostrarModulosRubro && modulos.length > 0 && (
          <>
            <Separator className="my-3" />
            {!colapsado && rubroConfig && (
              <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {rubroConfig.nombre}
              </p>
            )}
            {modulos.map((modulo) => {
              const activo = pathname === modulo.ruta || pathname.startsWith(modulo.ruta + "/");
              const Icono = modulo.icono;

              return (
                <Link
                  key={modulo.id}
                  href={modulo.ruta}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    activo
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={colapsado ? modulo.nombre : undefined}
                >
                  <Icono className="h-5 w-5 shrink-0" />
                  {!colapsado && <span>{modulo.nombre}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Toggle Button */}
      {onToggle && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={onToggle}
            >
              {colapsado ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>Colapsar</span>
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function SidebarDesktop() {
  const [colapsado, setColapsado] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-card transition-all duration-300 shrink-0",
        colapsado ? "w-16" : "w-64"
      )}
    >
      <SidebarContent
        colapsado={colapsado}
        onToggle={() => setColapsado(!colapsado)}
      />
    </aside>
  );
}

export function SidebarMobile() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
        <SidebarContent colapsado={false} />
      </SheetContent>
    </Sheet>
  );
}
