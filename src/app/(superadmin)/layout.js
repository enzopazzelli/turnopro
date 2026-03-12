import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarSuperadmin } from "@/components/superadmin/sidebar-superadmin";

export default async function SuperadminLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("users")
    .select("rol, nombre_completo")
    .eq("auth_id", user.id)
    .single();

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
