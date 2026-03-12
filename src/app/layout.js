import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { HashErrorHandler } from "@/components/auth/hash-error-handler";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "TurnoPro — Gestión de citas para profesionales",
    template: "%s | TurnoPro",
  },
  description:
    "Plataforma SaaS de gestión de turnos para dentistas, médicos, psicólogos, abogados, veterinarios y contadores. Agenda online, historia clínica, facturación y más.",
  keywords: ["gestión de turnos", "agenda online", "reservas online", "citas médicas", "consultorio", "SaaS Argentina"],
  authors: [{ name: "TurnoPro" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "TurnoPro",
    title: "TurnoPro — Gestión de citas para profesionales",
    description:
      "Agenda online, historia clínica, facturación y módulos especializados para tu consultorio.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TurnoPro — Gestión de citas para profesionales",
    description: "Agenda online, historia clínica, facturación y módulos especializados para tu consultorio.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <HashErrorHandler />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
