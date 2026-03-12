import { useAuthStore } from "@/stores/auth-store";

export function useUser() {
  const { usuario, tenant, profesional, cargando } = useAuthStore();

  const rol = usuario?.rol || null;
  const esProfesional = rol === "profesional";
  const esSecretaria = rol === "secretaria";
  const nombreCompleto = usuario?.nombre_completo || "";

  const iniciales = nombreCompleto
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

  return {
    usuario,
    tenant,
    profesional,
    cargando,
    rol,
    esProfesional,
    esSecretaria,
    nombreCompleto,
    iniciales,
  };
}
