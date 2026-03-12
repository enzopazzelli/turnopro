import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarSuperadmin } from "@/components/superadmin/sidebar-superadmin";

export default async function SuperadminLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // RPC SECURITY DEFINER bypasea RLS sin depender del admin client
  const { data: rows } = await supabase.rpc("obtener_perfil_usuario", {
    p_auth_id: user.id,
  });
  const usuario = rows?.[0] ?? null;

  if (!usuario || usuario.rol !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarSuperadmin />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
