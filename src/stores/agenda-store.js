import { create } from "zustand";

export const useAgendaStore = create((set) => ({
  vistaActual: "week",
  fechaActual: new Date(),

  dialogCitaAbierto: false,
  citaSeleccionada: null,
  fechaPreseleccionada: null,

  setVista: (vista) => set({ vistaActual: vista }),
  setFecha: (fecha) => set({ fechaActual: fecha }),

  abrirDialogNuevaCita: (fecha = null) =>
    set({
      dialogCitaAbierto: true,
      citaSeleccionada: null,
      fechaPreseleccionada: fecha,
    }),

  abrirDialogEditarCita: (cita) =>
    set({
      dialogCitaAbierto: true,
      citaSeleccionada: cita,
      fechaPreseleccionada: null,
    }),

  cerrarDialog: () =>
    set({
      dialogCitaAbierto: false,
      citaSeleccionada: null,
      fechaPreseleccionada: null,
    }),
}));
