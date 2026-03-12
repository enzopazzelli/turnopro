"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerDatosPDF } from "@/app/(dashboard)/actions/recetas";
import { RUBROS } from "@/config/rubros";
import { toast } from "sonner";

const TIPO_TITULOS = {
  receta_medicamento: "RECETA",
  indicacion_medica: "INDICACION MEDICA",
  orden_estudio: "ORDEN DE ESTUDIO",
  derivacion: "DERIVACION",
  certificado: "CERTIFICADO",
  carta_documento: "CARTA DOCUMENTO",
  dictamen: "DICTAMEN",
  certificacion_firma: "CERTIFICACION DE FIRMA",
  informe_legal: "INFORME LEGAL",
  poder: "PODER",
  certificacion_ingresos: "CERTIFICACION DE INGRESOS",
  informe_contable: "INFORME CONTABLE",
  balance: "BALANCE",
  dictamen_contador: "DICTAMEN",
  nota_requerimiento: "NOTA DE REQUERIMIENTO",
};

export function RecetaPDFButton({ recetaId }) {
  const [generando, setGenerando] = useState(false);

  const generarPDF = async () => {
    setGenerando(true);
    try {
      const { data, error } = await obtenerDatosPDF(recetaId);
      if (error) {
        toast.error(error);
        return;
      }

      const { receta, profesional, tenant } = data;
      const nombreProfesional = profesional?.users?.nombre_completo || "Profesional";
      const titulo = TIPO_TITULOS[receta.tipo] || "DOCUMENTO";
      const rubro = tenant?.rubro;
      const terminoPaciente = RUBROS[rubro]?.terminoPaciente || "Paciente";
      const esSalud = !["abogados", "contadores"].includes(rubro);
      const labelAsunto = esSalud ? "Diagnostico" : "Asunto";
      const labelObservaciones = esSalud ? "Indicaciones generales" : "Observaciones";
      const consultorio = tenant?.configuracion?.consultorio || {};

      let cuerpoHtml = "";

      if (receta.tipo === "receta_medicamento" && receta.medicamentos?.length > 0) {
        const filas = receta.medicamentos
          .map(
            (med, i) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb">${i + 1}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>${med.nombre}</strong></td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb">${med.dosis || "-"}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb">${med.frecuencia || "-"}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb">${med.duracion || "-"}</td>
            </tr>`
          )
          .join("");
        cuerpoHtml = `
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr style="background:#f9fafb">
              <th style="text-align:left;padding:8px;border-bottom:2px solid #333;font-size:12px">#</th>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #333;font-size:12px">Medicamento</th>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #333;font-size:12px">Dosis</th>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #333;font-size:12px">Frecuencia</th>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #333;font-size:12px">Duracion</th>
            </tr></thead>
            <tbody>${filas}</tbody>
          </table>`;
      }

      if (receta.contenido) {
        cuerpoHtml += `<div style="margin:16px 0;white-space:pre-wrap;line-height:1.6">${receta.contenido}</div>`;
      }

      const firmaHtml = profesional?.firma_url
        ? `<img src="${profesional.firma_url}" alt="Firma" style="max-width:180px;max-height:80px;display:block;margin:0 auto 8px" />`
        : "";

      const html = `<!DOCTYPE html><html><head>
        <title>${titulo} - ${receta.pacientes?.nombre_completo || ""}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, Helvetica, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; color: #1f2937; font-size: 13px; line-height: 1.5; }
          .header { border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: 1px; }
          .header p { margin: 2px 0; font-size: 12px; color: #6b7280; }
          .datos { display: flex; gap: 40px; margin: 16px 0; padding: 12px; background: #f9fafb; border-radius: 6px; }
          .datos div { }
          .datos label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .datos p { margin: 2px 0 0; font-weight: 600; }
          .seccion { margin: 16px 0; }
          .seccion-titulo { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px; }
          .firma { margin-top: 60px; text-align: center; width: 220px; margin-left: auto; }
          .firma-linea { border-top: 1px solid #333; padding-top: 8px; font-size: 12px; }
          .firma-nombre { font-weight: 600; }
          .firma-detalle { font-size: 11px; color: #6b7280; }
        </style></head><body>
        <div class="header">
          ${consultorio.logo_url ? `<img src="${consultorio.logo_url}" alt="Logo" style="max-height:40px;max-width:120px;margin-bottom:8px" />` : ""}
          <h1>${titulo}</h1>
          <p><strong>${nombreProfesional}</strong></p>
          ${profesional?.especialidad ? `<p>${profesional.especialidad}</p>` : ""}
          ${profesional?.numero_matricula ? `<p>Mat. ${profesional.numero_matricula}</p>` : ""}
          <p>${consultorio.nombre || tenant?.nombre || ""}</p>
          ${consultorio.direccion ? `<p>${consultorio.direccion}</p>` : ""}
          ${consultorio.telefono ? `<p>Tel: ${consultorio.telefono}</p>` : ""}
        </div>

        <div class="datos">
          <div>
            <label>${terminoPaciente}</label>
            <p>${receta.pacientes?.nombre_completo || "-"}</p>
          </div>
          ${receta.pacientes?.dni ? `<div><label>DNI</label><p>${receta.pacientes.dni}</p></div>` : ""}
          ${receta.pacientes?.obra_social ? `<div><label>Obra Social</label><p>${receta.pacientes.obra_social}</p></div>` : ""}
          <div>
            <label>Fecha</label>
            <p>${receta.fecha}</p>
          </div>
        </div>

        ${receta.diagnostico ? `<div class="seccion"><div class="seccion-titulo">${labelAsunto}</div><p>${receta.diagnostico}</p></div>` : ""}

        ${cuerpoHtml}

        ${receta.indicaciones_generales ? `<div class="seccion"><div class="seccion-titulo">${labelObservaciones}</div><p>${receta.indicaciones_generales}</p></div>` : ""}

        <div class="firma">
          ${firmaHtml}
          <div class="firma-linea">
            <div class="firma-nombre">${nombreProfesional}</div>
            ${profesional?.numero_matricula ? `<div class="firma-detalle">Mat. ${profesional.numero_matricula}</div>` : ""}
            <div class="firma-detalle">Firma y sello</div>
          </div>
        </div>
      </body></html>`;

      const ventana = window.open("", "_blank");
      ventana.document.write(html);
      ventana.document.close();
      ventana.print();
    } catch {
      toast.error("Error al generar PDF");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={generarPDF} disabled={generando} title="Imprimir / PDF">
      {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
    </Button>
  );
}
