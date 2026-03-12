// Calendario de vacunacion veterinaria — Argentina (SENASA)
// Esquemas estandar por especie y edad

export const ESQUEMA_PERROS = [
  // Cachorros
  { edad_semanas: 6, nombre: "Parvovirus + Moquillo (1ra dosis)", tipo: "quintuple", obligatoria: true },
  { edad_semanas: 8, nombre: "Quintuple (2da dosis)", tipo: "quintuple", obligatoria: true, nota: "Parvovirus, Moquillo, Hepatitis, Parainfluenza, Leptospirosis" },
  { edad_semanas: 12, nombre: "Quintuple (3ra dosis)", tipo: "quintuple", obligatoria: true },
  { edad_semanas: 12, nombre: "Antirrabica (1ra dosis)", tipo: "antirrabica", obligatoria: true, nota: "Obligatoria por ley en Argentina" },
  { edad_semanas: 16, nombre: "Quintuple (4ta dosis - refuerzo)", tipo: "quintuple", obligatoria: true },

  // Opcionales cachorros
  { edad_semanas: 12, nombre: "Tos de las perreras (Bordetella + Parainfluenza)", tipo: "tos_perreras", obligatoria: false, nota: "Recomendada si va a guarderias o peluquerias" },
  { edad_semanas: 16, nombre: "Giardia", tipo: "giardia", obligatoria: false },

  // Adultos (refuerzos anuales)
  { refuerzo_anual: true, nombre: "Antirrabica (refuerzo anual)", tipo: "antirrabica", obligatoria: true, nota: "Obligatoria por ley" },
  { refuerzo_anual: true, nombre: "Quintuple/Sextuple (refuerzo anual)", tipo: "quintuple", obligatoria: true },
  { refuerzo_anual: true, nombre: "Tos de las perreras (refuerzo anual)", tipo: "tos_perreras", obligatoria: false },
];

export const ESQUEMA_GATOS = [
  // Cachorros
  { edad_semanas: 8, nombre: "Triple felina (1ra dosis)", tipo: "triple_felina", obligatoria: true, nota: "Panleucopenia, Rinotraqueitis, Calicivirus" },
  { edad_semanas: 12, nombre: "Triple felina (2da dosis)", tipo: "triple_felina", obligatoria: true },
  { edad_semanas: 12, nombre: "Antirrabica (1ra dosis)", tipo: "antirrabica", obligatoria: true },
  { edad_semanas: 16, nombre: "Triple felina (3ra dosis - refuerzo)", tipo: "triple_felina", obligatoria: true },

  // Opcionales
  { edad_semanas: 8, nombre: "Leucemia felina (FeLV) - 1ra dosis", tipo: "felv", obligatoria: false, nota: "Recomendada en gatos con acceso al exterior. Requiere test previo negativo" },
  { edad_semanas: 12, nombre: "Leucemia felina (FeLV) - 2da dosis", tipo: "felv", obligatoria: false },

  // Adultos
  { refuerzo_anual: true, nombre: "Antirrabica (refuerzo anual)", tipo: "antirrabica", obligatoria: true },
  { refuerzo_anual: true, nombre: "Triple felina (refuerzo anual)", tipo: "triple_felina", obligatoria: true },
  { refuerzo_anual: true, nombre: "Leucemia felina (refuerzo anual)", tipo: "felv", obligatoria: false },
];

// Antiparasitarios por peso y especie
export const ANTIPARASITARIOS = {
  internos: [
    { nombre: "Pamoato de pirantel + Praziquantel", especies: ["perro", "gato"], frecuencia: "cada 3-6 meses", nota: "Desparasitar cada 3 meses si tiene acceso a exterior" },
    { nombre: "Fenbendazol", especies: ["perro", "gato"], frecuencia: "segun indicacion", nota: "Util para Giardia (3-5 dias consecutivos)" },
    { nombre: "Milbemicina + Praziquantel (Milbemax)", especies: ["perro", "gato"], frecuencia: "mensual o cada 3 meses", nota: "Amplio espectro" },
  ],
  externos: [
    { nombre: "Fipronil (Frontline)", especies: ["perro", "gato"], frecuencia: "mensual", tipo: "pipeta" },
    { nombre: "Afoxolaner (NexGard)", especies: ["perro"], frecuencia: "mensual", tipo: "comprimido masticable", nota: "No usar en gatos" },
    { nombre: "Sarolaner (Simparica)", especies: ["perro"], frecuencia: "mensual", tipo: "comprimido masticable" },
    { nombre: "Fluralaner (Bravecto)", especies: ["perro", "gato"], frecuencia: "cada 3 meses", tipo: "comprimido o pipeta" },
    { nombre: "Selamectina (Revolution)", especies: ["perro", "gato"], frecuencia: "mensual", tipo: "pipeta", nota: "Tambien actua contra algunos parasitos internos" },
    { nombre: "Imidacloprid + Permetrina (Advantix)", especies: ["perro"], frecuencia: "mensual", tipo: "pipeta", nota: "TOXICO para gatos. No usar" },
  ],
};

export const ESQUEMAS_POR_ESPECIE = {
  perro: ESQUEMA_PERROS,
  gato: ESQUEMA_GATOS,
};

// Calcula vacunas pendientes segun fecha de nacimiento y vacunas aplicadas
export function calcularVacunasPendientes(especie, fechaNacimiento, vacunasAplicadas = []) {
  const esquema = ESQUEMAS_POR_ESPECIE[especie];
  if (!esquema) return [];

  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edadSemanas = Math.floor((hoy - nacimiento) / (7 * 24 * 60 * 60 * 1000));
  const tiposAplicados = vacunasAplicadas.map((v) => v.tipo || v.nombre);

  const pendientes = [];

  for (const vacuna of esquema) {
    if (vacuna.refuerzo_anual) {
      // Los refuerzos anuales siempre se muestran como recomendados
      const ultimaAplicacion = vacunasAplicadas
        .filter((v) => v.tipo === vacuna.tipo || v.nombre?.includes(vacuna.nombre))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

      if (!ultimaAplicacion) {
        if (edadSemanas >= 52) pendientes.push({ ...vacuna, estado: "pendiente" });
      } else {
        const mesesDesdeUltima = Math.floor((hoy - new Date(ultimaAplicacion.fecha)) / (30 * 24 * 60 * 60 * 1000));
        if (mesesDesdeUltima >= 11) {
          pendientes.push({ ...vacuna, estado: "proximo_refuerzo", ultimaFecha: ultimaAplicacion.fecha });
        }
      }
    } else if (vacuna.edad_semanas) {
      // Vacunas por edad
      if (edadSemanas >= vacuna.edad_semanas && !tiposAplicados.includes(vacuna.tipo)) {
        pendientes.push({ ...vacuna, estado: edadSemanas > vacuna.edad_semanas + 4 ? "atrasada" : "pendiente" });
      }
    }
  }

  return pendientes;
}
