// Recursos para Abogados — Argentina
// Ferias judiciales, plazos procesales, links utiles

// Ferias judiciales nacionales (PJN) — fechas fijas
// Se agregan las ferias de invierno y verano; feriados se calculan aparte
export const FERIAS_JUDICIALES = {
  verano: { inicio_dia: 1, inicio_mes: 1, fin_dia: 31, fin_mes: 1, nombre: "Feria de verano (enero)" },
  invierno: { inicio_dia: 15, inicio_mes: 7, fin_dia: 28, fin_mes: 7, nombre: "Feria de invierno (julio)" },
};

// Feriados nacionales 2025/2026 — actualizar anualmente
// Solo dias no laborables que afectan plazos judiciales
export const FERIADOS_NACIONALES = {
  2025: [
    "2025-01-01", // Ano nuevo
    "2025-03-03", // Carnaval
    "2025-03-04", // Carnaval
    "2025-03-24", // Dia de la Memoria
    "2025-04-02", // Dia del Veterano / Malvinas
    "2025-04-18", // Viernes Santo
    "2025-05-01", // Dia del Trabajador
    "2025-05-25", // Revolucion de Mayo
    "2025-06-16", // Guemes (trasladable)
    "2025-06-20", // Dia de la Bandera
    "2025-07-09", // Dia de la Independencia
    "2025-08-17", // San Martin (trasladable)
    "2025-10-12", // Dia del Respeto a la Diversidad Cultural
    "2025-11-20", // Dia de la Soberania Nacional
    "2025-12-08", // Inmaculada Concepcion
    "2025-12-25", // Navidad
  ],
  2026: [
    "2026-01-01",
    "2026-02-16", // Carnaval
    "2026-02-17", // Carnaval
    "2026-03-24",
    "2026-04-02",
    "2026-04-03", // Viernes Santo
    "2026-05-01",
    "2026-05-25",
    "2026-06-15", // Guemes
    "2026-06-20",
    "2026-07-09",
    "2026-08-17",
    "2026-10-12",
    "2026-11-20",
    "2026-12-08",
    "2026-12-25",
  ],
};

// Dias inhabiles: fines de semana + feriados + ferias judiciales
function esFeriado(fecha) {
  const anio = fecha.getFullYear();
  const feriados = FERIADOS_NACIONALES[anio] || [];
  const iso = fecha.toISOString().split("T")[0];
  return feriados.includes(iso);
}

function esFinDeSemana(fecha) {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

function esFeriaJudicial(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  for (const feria of Object.values(FERIAS_JUDICIALES)) {
    if (mes === feria.inicio_mes && dia >= feria.inicio_dia && dia <= feria.fin_dia) return true;
    // Cruce de meses (no aplica actualmente pero por seguridad)
    if (feria.inicio_mes !== feria.fin_mes) {
      if (mes === feria.inicio_mes && dia >= feria.inicio_dia) return true;
      if (mes === feria.fin_mes && dia <= feria.fin_dia) return true;
    }
  }
  return false;
}

export function esDiaHabil(fecha) {
  return !esFinDeSemana(fecha) && !esFeriado(fecha) && !esFeriaJudicial(fecha);
}

// Calcula fecha de vencimiento de un plazo en dias habiles judiciales
// desde: Date, diasHabiles: number
// Devuelve: { fechaVencimiento: Date, diasCorridos: number, detalle: string[] }
export function calcularPlazoJudicial(desde, diasHabiles) {
  const inicio = new Date(desde);
  inicio.setHours(0, 0, 0, 0);
  let habilesContados = 0;
  let cursor = new Date(inicio);
  const detalle = [];

  // El primer dia no se cuenta (art. 156 CPCCN)
  cursor.setDate(cursor.getDate() + 1);

  while (habilesContados < diasHabiles) {
    if (esDiaHabil(cursor)) {
      habilesContados++;
      if (habilesContados === diasHabiles) break;
    } else {
      const motivo = esFinDeSemana(cursor) ? "fin de semana" : esFeriaJudicial(cursor) ? "feria judicial" : "feriado";
      detalle.push(`${cursor.toISOString().split("T")[0]}: ${motivo}`);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const diasCorridos = Math.round((cursor - inicio) / (24 * 60 * 60 * 1000));

  return {
    fechaVencimiento: cursor,
    diasCorridos,
    diasHabiles,
    detalle,
  };
}

// Plazos procesales frecuentes (CPCCN — Codigo Procesal Civil y Comercial de la Nacion)
export const PLAZOS_FRECUENTES = [
  { nombre: "Traslado de demanda", dias: 15, norma: "Art. 338 CPCCN" },
  { nombre: "Contestacion de demanda", dias: 15, norma: "Art. 338 CPCCN" },
  { nombre: "Contestacion excepciones", dias: 5, norma: "Art. 350 CPCCN" },
  { nombre: "Ofrecimiento de prueba", dias: 10, norma: "Art. 367 CPCCN" },
  { nombre: "Apelacion (sentencia definitiva)", dias: 5, norma: "Art. 244 CPCCN" },
  { nombre: "Apelacion (providencias simples)", dias: 3, norma: "Art. 244 CPCCN" },
  { nombre: "Expresion de agravios", dias: 10, norma: "Art. 259 CPCCN" },
  { nombre: "Recurso de revocatoria", dias: 3, norma: "Art. 238 CPCCN" },
  { nombre: "Recurso extraordinario federal", dias: 10, norma: "Art. 257 CPCCN" },
  { nombre: "Traslado de liquidacion", dias: 5, norma: "Art. 503 CPCCN" },
  { nombre: "Incidente (traslado)", dias: 5, norma: "Art. 180 CPCCN" },
  { nombre: "Citacion de terceros", dias: 10, norma: "Art. 94 CPCCN" },
  { nombre: "Alegato", dias: 6, norma: "Art. 482 CPCCN" },
  { nombre: "Notificacion personal (comparendo)", dias: 3, norma: "Art. 135 CPCCN" },
  { nombre: "Caducidad de instancia (1ra)", dias: 180, norma: "Art. 310 CPCCN", nota: "6 meses en dias corridos (no habiles)" },
  { nombre: "Caducidad de instancia (2da/3ra)", dias: 90, norma: "Art. 310 CPCCN", nota: "3 meses en dias corridos" },
];

// Links utiles para abogados
export const LINKS_ABOGADOS = [
  { titulo: "PJN - Poder Judicial de la Nacion", url: "https://www.pjn.gov.ar", descripcion: "Consulta de expedientes, acordadas, jurisprudencia" },
  { titulo: "SCBA - Suprema Corte Buenos Aires", url: "https://www.scba.gov.ar", descripcion: "Juba, MEV, notificaciones" },
  { titulo: "SAIJ - Sistema Argentino de Informacion Juridica", url: "http://www.saij.gob.ar", descripcion: "Legislacion, jurisprudencia, doctrina" },
  { titulo: "InfoLEG", url: "http://www.infoleg.gob.ar", descripcion: "Informacion legislativa y documental" },
  { titulo: "Boletin Oficial", url: "https://www.boletinoficial.gob.ar", descripcion: "Boletin Oficial de la Republica Argentina" },
  { titulo: "CPACF - Colegio Publico de Abogados (CABA)", url: "https://www.cpacf.org.ar", descripcion: "Colegio de Abogados de la Capital Federal" },
  { titulo: "COLPROBA - Colegio de Abogados (PBA)", url: "https://www.colproba.org.ar", descripcion: "Colegio de Abogados de la Provincia de Buenos Aires" },
  { titulo: "MEV - Mesa de Entradas Virtual (PBA)", url: "https://mev.scba.gov.ar", descripcion: "Presentaciones electronicas Pcia. Buenos Aires" },
  { titulo: "Lex Doctor / iurix", url: "https://www.lexdoctor.com.ar", descripcion: "Gestion de estudios juridicos" },
];

// Modelos de escritos frecuentes (templates basicos)
export const MODELOS_ESCRITOS = [
  {
    id: "demanda_civil",
    nombre: "Demanda civil ordinaria",
    categoria: "Demandas",
    contenido: `INICIA DEMANDA ORDINARIA

Senor Juez:

[NOMBRE], DNI [DNI], con domicilio real en [DOMICILIO REAL], constituyendo domicilio procesal en [DOMICILIO PROCESAL], por derecho propio / por apoderado, a V.S. respetuosamente digo:

I. OBJETO
Que vengo a promover demanda ordinaria contra [DEMANDADO], con domicilio en [DOMICILIO DEMANDADO], por [CONCEPTO], reclamando la suma de $ [MONTO], o lo que en mas o en menos resulte de la prueba a producirse, con mas sus intereses y costas del juicio.

II. HECHOS
[Relato de los hechos en forma clara y precisa]

III. DERECHO
Fundo mi derecho en lo dispuesto por los arts. [ARTICULOS] del Codigo Civil y Comercial de la Nacion, y arts. [ARTICULOS] del CPCCN.

IV. PRUEBA
Ofrezco la siguiente prueba:
a) Documental: [detallar]
b) Testimonial: [nombre, domicilio, DNI de cada testigo]
c) Pericial: [tipo de pericia]
d) Informativa: [oficios a librar]

V. PETITORIO
Por todo lo expuesto, solicito:
1. Se me tenga por presentado, por parte y por constituido el domicilio procesal.
2. Se corra traslado de la demanda al demandado.
3. Oportunamente, se dicte sentencia haciendo lugar a la demanda, con costas.

Proveer de conformidad.
SERA JUSTICIA.`,
  },
  {
    id: "contestacion",
    nombre: "Contestacion de demanda",
    categoria: "Contestaciones",
    contenido: `CONTESTA DEMANDA

Senor Juez:

[NOMBRE], DNI [DNI], por derecho propio / por apoderado, constituyendo domicilio procesal en [DOMICILIO], en autos "[CARATULA]" Expediente N° [NUMERO], a V.S. respetuosamente digo:

I. OBJETO
Que vengo en legal tiempo y forma a contestar la demanda interpuesta por [ACTOR], solicitando su total rechazo, con costas.

II. NEGATIVA
Niego todos y cada uno de los hechos expuestos en el escrito de demanda que no sean objeto de expreso reconocimiento en el presente.

III. HECHOS
[Relato de los hechos segun la version del demandado]

IV. DERECHO
Fundo mi derecho en lo dispuesto por los arts. [ARTICULOS].

V. PRUEBA
[Detalle de prueba ofrecida]

VI. PETITORIO
1. Se me tenga por presentado, por parte y por contestada la demanda.
2. Se rechace la demanda en todas sus partes, con costas.

Proveer de conformidad.
SERA JUSTICIA.`,
  },
  {
    id: "oficio",
    nombre: "Oficio judicial",
    categoria: "Oficios",
    contenido: `OFICIO

[Lugar], [Fecha]

Senor
[Destinatario]
[Domicilio]

Ref.: Autos "[CARATULA]" - Expediente N° [NUMERO]
Juzgado [JUZGADO] - Secretaria [SECRETARIA]

De mi mayor consideracion:

Me dirijo a Ud. en mi caracter de letrado/a apoderado/a de [PARTE] en los autos de referencia, a fin de solicitarle tenga a bien informar a este Juzgado:

1. [Punto 1 a informar]
2. [Punto 2 a informar]

El presente se libra por orden del Juzgado interviniente, de fecha [FECHA PROVIDENCIA].

Sin otro particular, saludo a Ud. atentamente.

[FIRMA]
[NOMBRE]
Tomo [TOMO] Folio [FOLIO] - CPACF/COLPROBA`,
  },
  {
    id: "cedula",
    nombre: "Cedula de notificacion",
    categoria: "Cedulas",
    contenido: `CEDULA DE NOTIFICACION

En la Ciudad de [CIUDAD], a los [DIA] dias del mes de [MES] de [ANO], siendo las [HORA] horas, me constituyo en [DOMICILIO] a efectos de notificar a [NOMBRE], de la [TIPO RESOLUCION] de fecha [FECHA RESOLUCION], recaida en autos "[CARATULA]", Expediente N° [NUMERO], que tramita ante el Juzgado [JUZGADO], Secretaria [SECRETARIA], cuyo texto se transcribe a continuacion:

"[TEXTO DE LA RESOLUCION]"

Queda Ud. notificado.

[FIRMA NOTIFICADOR]`,
  },
  {
    id: "recurso_apelacion",
    nombre: "Recurso de apelacion",
    categoria: "Recursos",
    contenido: `INTERPONE RECURSO DE APELACION

Senor Juez:

[NOMBRE], en los autos "[CARATULA]", Expediente N° [NUMERO], a V.S. respetuosamente digo:

Que vengo en legal tiempo y forma a interponer recurso de apelacion contra la resolucion de fecha [FECHA], notificada el [FECHA NOTIFICACION], por causar a mi parte un gravamen irreparable, reservandome el derecho de fundar los agravios ante la Alzada.

PETITORIO
Solicito:
1. Se tenga por interpuesto el recurso de apelacion.
2. Se conceda el recurso en relacion / libremente y con efecto suspensivo / devolutivo.
3. Se eleven las actuaciones a la Camara de Apelaciones.

Proveer de conformidad.
SERA JUSTICIA.`,
  },
];
