"use client";

import Link from "next/link";
import { LogOut, Settings, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMobile } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { PanelNotificaciones } from "@/components/notificaciones/panel-notificaciones";
import { useUser } from "@/hooks/use-user";
import { cerrarSesion } from "@/app/(auth)/actions";

export function Topbar() {
  const { usuario, tenant, iniciales, nombreCompleto } = useUser();

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b bg-card shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-2">
        <SidebarMobile />
        <h2 className="text-lg font-semibold hidden sm:block">
          {tenant?.nombre || "Mi Consultorio"}
        </h2>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {usuario?.rol === "superadmin" && (
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5 mr-1">
            <Link href="/superadmin">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </Link>
          </Button>
        )}
        <ThemeToggle />

        {/* Notifications */}
        <PanelNotificaciones />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menú de usuario">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{iniciales || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{nombreCompleto}</p>
              <p className="text-xs text-muted-foreground">
                {usuario?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracion?tab=perfil">
                <User className="mr-2 h-4 w-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracion">
                <Settings className="mr-2 h-4 w-4" />
                Configuracion
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => cerrarSesion()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
