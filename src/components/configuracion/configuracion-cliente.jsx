"use client";

import { useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { TabNotificaciones } from "./tab-notificaciones";
import { TabFacturacion } from "./tab-facturacion";
import { TabPaginaPublica } from "./tab-pagina-publica";
import { TabPerfil } from "./tab-perfil";
import { TabAgenda } from "./tab-agenda";
import { TabConsultorio } from "./tab-consultorio";
import { TabPlantillas } from "./tab-plantillas";
import { TabEquipo } from "./tab-equipo";
import { TabRecursos } from "./tab-recursos";
import { TabBranding } from "./tab-branding";
import { generarBackupConfiguracion } from "@/app/(dashboard)/actions/configuracion";
import { toast } from "sonner";

export function ConfiguracionCliente({ configuracion, enlaces = [] }) {
  const [descargando, startDescarga] = useTransition();

  function handleBackup() {
    startDescarga(async () => {
      const { data, error } = await generarBackupConfiguracion();
      if (error) { toast.error(error); return; }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-config-${data.slug}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup descargado");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleBackup} disabled={descargando}>
          <Download className="h-4 w-4 mr-2" />
          {descargando ? "Generando..." : "Descargar backup"}
        </Button>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="consultorio">Consultorio</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="plantillas">Mensajes</TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="facturacion">Facturacion</TabsTrigger>
          <TabsTrigger value="pagina-publica">Pag. Publica</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="recursos">Recursos</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <TabPerfil configuracionInicial={configuracion} />
        </TabsContent>

        <TabsContent value="consultorio">
          <TabConsultorio configuracionInicial={configuracion} />
        </TabsContent>

        <TabsContent value="agenda">
          <TabAgenda configuracionInicial={configuracion} />
        </TabsContent>

        <TabsContent value="notificaciones">
          <TabNotificaciones configuracionInicial={configuracion} />
        </TabsContent>

        <TabsContent value="plantillas">
          <TabPlantillas configuracionInicial={configuracion} />
        </TabsContent>

        <TabsContent value="equipo">
          <TabEquipo />
        </TabsContent>

        <TabsContent value="facturacion">
          <TabFacturacion configuracionInicial={configuracion} />
        </TabsContent>

        <TabsContent value="pagina-publica">
          <TabPaginaPublica configuracionInicial={configuracion} />
        </TabsContent>

        <TabsContent value="branding">
          <TabBranding configuracionInicial={configuracion} />
        </TabsContent>

        <TabsContent value="recursos">
          <TabRecursos enlaces={enlaces} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
