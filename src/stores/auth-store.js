import { create } from "zustand";

export const useAuthStore = create((set) => ({
  usuario: null,
  tenant: null,
  profesional: null,
  cargando: true,

  setDatosAuth: ({ usuario, tenant, profesional }) =>
    set({ usuario, tenant, profesional, cargando: false }),

  limpiar: () =>
    set({ usuario: null, tenant: null, profesional: null, cargando: false }),
}));
