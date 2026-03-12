import { create } from "zustand";

export const useReservaStore = create((set) => ({
  paso: 1,
  servicioSeleccionado: null,
  fechaSeleccionada: null,
  horarioSeleccionado: null,
  datosCliente: null,

  setPaso: (paso) => set({ paso }),

  setServicio: (servicio) =>
    set({
      servicioSeleccionado: servicio,
      paso: 2,
      fechaSeleccionada: null,
      horarioSeleccionado: null,
      datosCliente: null,
    }),

  setFecha: (fecha) =>
    set({
      fechaSeleccionada: fecha,
      paso: 3,
      horarioSeleccionado: null,
    }),

  setHorario: (horario) =>
    set({
      horarioSeleccionado: horario,
      paso: 4,
    }),

  setDatosCliente: (datos) =>
    set({
      datosCliente: datos,
      paso: 5,
    }),

  reiniciar: () =>
    set({
      paso: 1,
      servicioSeleccionado: null,
      fechaSeleccionada: null,
      horarioSeleccionado: null,
      datosCliente: null,
    }),
}));
