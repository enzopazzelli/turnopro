import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SidebarDesktop } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AuthProvider } from "@/components/layout/auth-provider";
import { NotificacionesProvider } from "@/components/notificaciones/provider-notificaciones";
import { BrandingApplicator } from "@/components/layout/branding-applicator";
import { AdminAccessBanner } from "@/components/layout/admin-access-banner";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile from our users table
  const { data: usuario } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!usuario) {
    redirect("/onboarding");
  }

  // Superadmin no usa el dashboard normal
  if (usuario.rol === "superadmin") {
    redirect("/superadmin");
  }

  // Fetch tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", usuario.tenant_id)
    .single();

  // Fetch professional profile (may not exist for secretaria/paciente roles)
  const { data: profesional } = await supabase
    .from("professionals")
    .select("*")
    .eq("user_id", usuario.id)
    .maybeSingle();

  const datosIniciales = {
    usuario,
    tenant,
    profesional,
  };

  return (
    <AuthProvider datosIniciales={datosIniciales}>
      <BrandingApplicator />
      <NotificacionesProvider>
        <div className="flex h-screen overflow-hidden">
          <SidebarDesktop />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Suspense>
              <AdminAccessBanner />
            </Suspense>
            <Topbar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </NotificacionesProvider>
    </AuthProvider>
  );
}
