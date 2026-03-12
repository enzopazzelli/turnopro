import { createAdminClient } from "@/lib/supabase/admin";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://turnopro.app";

export default async function sitemap() {
  // Páginas estáticas
  const paginas = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/planes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/registro`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Páginas públicas de profesionales (tenants activos)
  try {
    const supabase = createAdminClient();
    const { data: tenants } = await supabase
      .from("tenants")
      .select("slug, updated_at")
      .eq("activo", true)
      .neq("slug", "_plataforma")
      .order("updated_at", { ascending: false })
      .limit(500);

    const paginasProfesionales = (tenants || []).map((t) => ({
      url: `${BASE_URL}/${t.slug}`,
      lastModified: new Date(t.updated_at),
      changeFrequency: "weekly",
      priority: 0.9,
    }));

    return [...paginas, ...paginasProfesionales];
  } catch {
    return paginas;
  }
}
