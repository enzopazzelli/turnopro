export const ROLES = {
  SUPERADMIN: "superadmin",
  PROFESIONAL: "profesional",
  SECRETARIA: "secretaria",
  PACIENTE: "paciente",
};

export const ESTADOS_CITA = {
  PENDIENTE: "pendiente",
  PENDIENTE_CONFIRMACION: "pendiente_confirmacion",
  CONFIRMADA: "confirmada",
  EN_CURSO: "en_curso",
  COMPLETADA: "completada",
  CANCELADA: "cancelada",
  NO_ASISTIO: "no_asistio",
};

export const METODOS_PAGO = {
  EFECTIVO: "efectivo",
  TRANSFERENCIA: "transferencia",
  TARJETA_DEBITO: "tarjeta_debito",
  TARJETA_CREDITO: "tarjeta_credito",
  MERCADO_PAGO: "mercado_pago",
  OBRA_SOCIAL: "obra_social",
};

export const LABELS_METODO_PAGO = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_debito: "Tarjeta debito",
  tarjeta_credito: "Tarjeta credito",
  mercado_pago: "Mercado Pago",
  obra_social: "Obra social",
};

export const LABELS_ESTADO_PAGO = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagado: "Pagado",
  reembolsado: "Reembolsado",
};

export const TIPOS_COMPROBANTE = {
  RECIBO: "recibo",
  FACTURA: "factura",
  NOTA_CREDITO: "nota_credito",
};

export const ESTADOS_RECIBO = {
  EMITIDO: "emitido",
  ANULADO: "anulado",
};

export const ESTADOS_PAGO = {
  PENDIENTE: "pendiente",
  PARCIAL: "parcial",
  PAGADO: "pagado",
  REEMBOLSADO: "reembolsado",
};

export const DIAS_SEMANA = [
  { valor: 0, nombre: "Domingo" },
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miercoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sabado" },
];

export const GENEROS = [
  { valor: "masculino", nombre: "Masculino" },
  { valor: "femenino", nombre: "Femenino" },
  { valor: "otro", nombre: "Otro" },
  { valor: "no_especifica", nombre: "Prefiero no especificar" },
];

export const TIPOS_NOTIFICACION = {
  CITA_CREADA: "cita_creada",
  CITA_CONFIRMADA: "cita_confirmada",
  CITA_CANCELADA: "cita_cancelada",
  CITA_MODIFICADA: "cita_modificada",
  CITA_REPROGRAMADA: "cita_reprogramada",
  RECORDATORIO_24H: "recordatorio_24h",
  RECORDATORIO_2H: "recordatorio_2h",
  RESERVA_NUEVA: "reserva_nueva",
  PAGO_REGISTRADO: "pago_registrado",
  LISTA_ESPERA_DISPONIBLE: "lista_espera_disponible",
  CONFIRMACION_CITA: "confirmacion_cita",
  GENERAL: "general",
};

export const CANALES_NOTIFICACION = {
  IN_APP: "in_app",
  EMAIL: "email",
  WHATSAPP: "whatsapp",
};

export const ESTADOS_NOTIFICACION = {
  PENDIENTE: "pendiente",
  ENVIADA: "enviada",
  FALLIDA: "fallida",
  LEIDA: "leida",
};

export const LABELS_TIPO_NOTIFICACION = {
  cita_creada: "Cita creada",
  cita_confirmada: "Cita confirmada",
  cita_cancelada: "Cita cancelada",
  cita_modificada: "Cita modificada",
  cita_reprogramada: "Cita reprogramada",
  recordatorio_24h: "Recordatorio 24h",
  recordatorio_2h: "Recordatorio 2h",
  reserva_nueva: "Nueva reserva",
  pago_registrado: "Pago registrado",
  lista_espera_disponible: "Turno disponible",
  confirmacion_cita: "Confirmar cita",
  general: "General",
};

export const RECURRENCIAS_CITA = {
  SEMANAL: "semanal",
  QUINCENAL: "quincenal",
  MENSUAL: "mensual",
};

export const ESTADOS_LISTA_ESPERA = {
  ESPERANDO: "esperando",
  NOTIFICADO: "notificado",
  AGENDADO: "agendado",
  CANCELADO: "cancelado",
};

export const HORARIOS_PREFERIDOS = [
  { valor: "manana", nombre: "Manana" },
  { valor: "tarde", nombre: "Tarde" },
  { valor: "cualquiera", nombre: "Cualquier horario" },
];

// Odontología
export const ESTADOS_DIENTE = {
  PRESENTE: "presente",
  AUSENTE: "ausente",
  IMPLANTE: "implante",
  CORONA: "corona",
  PROTESIS: "protesis",
};

export const ESTADOS_CARA_DIENTE = {
  SANO: "sano",
  CARIES: "caries",
  OBTURADO: "obturado",
  FRACTURA: "fractura",
  SELLANTE: "sellante",
};

export const COLORES_CARA_DIENTE = {
  sano: "#e5e7eb",
  caries: "#ef4444",
  obturado: "#3b82f6",
  fractura: "#f59e0b",
  sellante: "#8b5cf6",
};

export const COLORES_ESTADO_DIENTE = {
  presente: "#6b7280",
  ausente: "#d1d5db",
  implante: "#06b6d4",
  corona: "#f59e0b",
  protesis: "#ec4899",
};

// Veterinaria
export const ESPECIES_MASCOTA = [
  { valor: "perro", nombre: "Perro" },
  { valor: "gato", nombre: "Gato" },
  { valor: "ave", nombre: "Ave" },
  { valor: "reptil", nombre: "Reptil" },
  { valor: "roedor", nombre: "Roedor" },
  { valor: "otro", nombre: "Otro" },
];

// Abogados
export const ESTADOS_EXPEDIENTE = [
  { valor: "activo", nombre: "Activo", color: "#22c55e" },
  { valor: "en_tramite", nombre: "En tramite", color: "#3b82f6" },
  { valor: "con_sentencia", nombre: "Con sentencia", color: "#8b5cf6" },
  { valor: "archivado", nombre: "Archivado", color: "#6b7280" },
  { valor: "apelado", nombre: "Apelado", color: "#f59e0b" },
];

// Compartido (abogados + contadores)
export const PRIORIDADES = [
  { valor: "baja", nombre: "Baja", color: "#22c55e" },
  { valor: "media", nombre: "Media", color: "#f59e0b" },
  { valor: "alta", nombre: "Alta", color: "#f97316" },
  { valor: "urgente", nombre: "Urgente", color: "#ef4444" },
];

// Contadores
export const OBLIGACIONES_FISCALES = [
  { valor: "iva", nombre: "IVA" },
  { valor: "ganancias", nombre: "Ganancias" },
  { valor: "iibb", nombre: "Ingresos Brutos" },
  { valor: "monotributo", nombre: "Monotributo" },
  { valor: "bienes_personales", nombre: "Bienes Personales" },
  { valor: "otro", nombre: "Otro" },
];

export const RECURRENCIAS = [
  { valor: "mensual", nombre: "Mensual" },
  { valor: "bimestral", nombre: "Bimestral" },
  { valor: "trimestral", nombre: "Trimestral" },
  { valor: "semestral", nombre: "Semestral" },
  { valor: "anual", nombre: "Anual" },
];

// Psicología
export const ESTADOS_EMOCIONAL = [
  { valor: "ansioso", nombre: "Ansioso" },
  { valor: "triste", nombre: "Triste" },
  { valor: "neutro", nombre: "Neutro" },
  { valor: "esperanzado", nombre: "Esperanzado" },
  { valor: "enojado", nombre: "Enojado" },
  { valor: "tranquilo", nombre: "Tranquilo" },
  { valor: "confundido", nombre: "Confundido" },
];

export const AREAS_EVOLUCION = [
  { valor: "ansiedad", nombre: "Ansiedad" },
  { valor: "depresion", nombre: "Depresion" },
  { valor: "autoestima", nombre: "Autoestima" },
  { valor: "relaciones", nombre: "Relaciones" },
  { valor: "trabajo", nombre: "Trabajo" },
  { valor: "otro", nombre: "Otro" },
];

export const APP_NAME = "TurnoPro";
export const APP_DESCRIPTION = "Plataforma de gestion de citas para profesionales";
