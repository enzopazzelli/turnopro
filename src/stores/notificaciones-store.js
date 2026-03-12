import { create } from "zustand";

export const useNotificacionesStore = create((set, get) => ({
  notificaciones: [],
  noLeidas: 0,
  cargando: true,
  panelAbierto: false,

  setNotificaciones: (notificaciones) => {
    const noLeidas = notificaciones.filter((n) => !n.leida).length;
    set({ notificaciones, noLeidas, cargando: false });
  },

  agregarNotificacion: (notificacion) => {
    set((state) => {
      const existe = state.notificaciones.some((n) => n.id === notificacion.id);
      if (existe) return state;
      const nuevas = [notificacion, ...state.notificaciones];
      return {
        notificaciones: nuevas,
        noLeidas: notificacion.leida ? state.noLeidas : state.noLeidas + 1,
      };
    });
  },

  marcarLeida: (id) => {
    set((state) => ({
      notificaciones: state.notificaciones.map((n) =>
        n.id === id ? { ...n, leida: true } : n
      ),
      noLeidas: Math.max(0, state.noLeidas - 1),
    }));
  },

  marcarTodasLeidas: () => {
    set((state) => ({
      notificaciones: state.notificaciones.map((n) => ({ ...n, leida: true })),
      noLeidas: 0,
    }));
  },

  togglePanel: () => set((state) => ({ panelAbierto: !state.panelAbierto })),

  cerrarPanel: () => set({ panelAbierto: false }),
}));
