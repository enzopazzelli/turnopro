"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, ClipboardList, ArrowLeft, ShieldCheck, CreditCard, LogOut, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { cerrarSesion } from "@/app/(auth)/actions";

const items = [
  { titulo: "Métricas",  href: "/superadmin",          icono: LayoutDashboard },
  { titulo: "Tenants",   href: "/superadmin/tenants",   icono: Building2 },
  { titulo: "Usuarios",  href: "/superadmin/usuarios",  icono: Users },
  { titulo: "Planes",    href: "/superadmin/planes",    icono: CreditCard },
  { titulo: "Demos",     href: "/superadmin/demos",     icono: Inbox },
  { titulo: "Audit Log", href: "/superadmin/audit",     icono: ClipboardList },
];

export function SidebarSuperadmin() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full border-r bg-muted/30">
      {/* Header */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">TurnoPro Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {items.map((item) => {
          const activo =
            item.href === "/superadmin"
              ? pathname === "/superadmin"
              : pathname.startsWith(item.href);
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                activo
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icono className="h-4 w-4 shrink-0" />
              {item.titulo}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-0.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <button
          onClick={() => cerrarSesion()}
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
