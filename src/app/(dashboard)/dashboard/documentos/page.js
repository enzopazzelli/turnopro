import { verificarRubro, RubroNoDisponible } from "@/components/rubro/guard-rubro";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, ExternalLink } from "lucide-react";

export const metadata = { title: "Documentos | TurnoPro" };

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default async function Page() {
  const { autorizado, tenantId } = await verificarRubro("abogados");
  if (!autorizado) return <RubroNoDisponible />;

  const supabase = await createClient();
  const { data: documentos } = await supabase
    .from("documentos_legales")
    .select("*, expedientes(caratula)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Documentos</h1>

      {!documentos?.length ? (
        <p className="text-center text-muted-foreground py-8">
          No hay documentos. Subi documentos desde un expediente.
        </p>
      ) : (
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.expedientes?.caratula && <>Exp: {doc.expedientes.caratula} | </>}
                  {formatBytes(doc.tamano_bytes)} |{" "}
                  {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
              {doc.archivo_url && (
                <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {doc.expediente_id && (
                <Link
                  href={`/dashboard/expedientes/${doc.expediente_id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Ver expediente
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
