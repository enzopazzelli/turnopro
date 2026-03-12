import { useAuthStore } from "@/stores/auth-store";
import { getRubroConfig } from "@/config/rubros";

const CONFIG_DEFAULT = {
  terminoPaciente: "Paciente",
  crm: {
    terminoPlural: "Pacientes",
    campos: {
      obra_social: true,
      numero_afiliado: true,
      genero: true,
      fecha_nacimiento: true,
    },
    etiquetas: ["nuevo", "regular", "vip", "particular"],
    columnaExtra: "Obra social",
  },
};

export function useRubro() {
  const tenant = useAuthStore((s) => s.tenant);
  const rubroId = tenant?.rubro || null;
  const config = getRubroConfig(rubroId);

  if (!config) return { ...CONFIG_DEFAULT, rubroId: null };

  return { ...config, rubroId };
}
