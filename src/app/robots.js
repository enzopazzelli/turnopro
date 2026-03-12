const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://turnopro.app";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/superadmin/", "/api/", "/onboarding/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
