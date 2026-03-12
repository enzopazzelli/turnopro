// Calendario Fiscal AFIP/ARCA — Vencimientos generales por obligacion y terminacion de CUIT
// Estos son los dias de vencimiento habituales (sujetos a modificacion por feriados o RG)
// El profesional puede cargar estos vencimientos automaticamente para cada mes

// Dias de vencimiento segun terminacion de CUIT (ultimo digito)
export const VENCIMIENTOS_AFIP = {
  iva: {
    nombre: "IVA - Declaracion Jurada Mensual",
    obligacion: "iva",
    recurrencia: "mensual",
    descripcion: "Presentacion y pago de DDJJ de IVA",
    // Dia del mes segun terminacion de CUIT
    dias: {
      "0-1": 18,
      "2-3": 19,
      "4-5": 20,
      "6-7": 21,
      "8-9": 22,
    },
  },
  ganancias_mensual: {
    nombre: "Ganancias - Anticipo Mensual",
    obligacion: "ganancias",
    recurrencia: "mensual",
    descripcion: "Anticipo mensual de Impuesto a las Ganancias",
    dias: {
      "0-1": 13,
      "2-3": 13,
      "4-5": 14,
      "6-7": 14,
      "8-9": 15,
    },
  },
  ganancias_ddjj: {
    nombre: "Ganancias - DDJJ Anual",
    obligacion: "ganancias",
    recurrencia: "anual",
    descripcion: "Declaracion Jurada Anual de Ganancias (junio del ano siguiente)",
    mes: 6, // Junio
    dias: {
      "0-1": 12,
      "2-3": 13,
      "4-5": 14,
      "6-7": 15,
      "8-9": 16,
    },
  },
  bienes_personales: {
    nombre: "Bienes Personales - DDJJ Anual",
    obligacion: "bienes_personales",
    recurrencia: "anual",
    descripcion: "Declaracion Jurada Anual de Bienes Personales (junio del ano siguiente)",
    mes: 6,
    dias: {
      "0-1": 12,
      "2-3": 13,
      "4-5": 14,
      "6-7": 15,
      "8-9": 16,
    },
  },
  monotributo: {
    nombre: "Monotributo - Pago Mensual",
    obligacion: "monotributo",
    recurrencia: "mensual",
    descripcion: "Pago mensual de componente impositivo y obra social",
    dias: {
      "0-1": 20,
      "2-3": 20,
      "4-5": 20,
      "6-7": 20,
      "8-9": 20,
    },
  },
  monotributo_recategorizacion: {
    nombre: "Monotributo - Recategorizacion",
    obligacion: "monotributo",
    recurrencia: "semestral",
    descripcion: "Recategorizacion semestral del Monotributo (enero y julio)",
    meses: [1, 7],
    dia: 20,
  },
  iibb_mensual: {
    nombre: "Ingresos Brutos - DDJJ Mensual (CABA/PBA)",
    obligacion: "iibb",
    recurrencia: "mensual",
    descripcion: "Presentacion y pago de DDJJ de Ingresos Brutos (varia por jurisdiccion)",
    dias: {
      "0-1": 15,
      "2-3": 16,
      "4-5": 17,
      "6-7": 18,
      "8-9": 19,
    },
  },
  suss_empleador: {
    nombre: "Cargas Sociales (F.931)",
    obligacion: "otro",
    recurrencia: "mensual",
    descripcion: "Presentacion y pago de aportes y contribuciones patronales",
    dias: {
      "0-1": 9,
      "2-3": 10,
      "4-5": 11,
      "6-7": 12,
      "8-9": 13,
    },
  },
};

// Categorias de Monotributo vigentes (2024/2025 — actualizar segun RG)
export const CATEGORIAS_MONOTRIBUTO = [
  { categoria: "A", ingresos_brutos: 2108288.01, alquiler_anual: 1500000, impuesto: 3000, jubilacion: 8000, obra_social: 10000 },
  { categoria: "B", ingresos_brutos: 3133941.63, alquiler_anual: 1500000, impuesto: 5700, jubilacion: 8800, obra_social: 10000 },
  { categoria: "C", ingresos_brutos: 4387518.23, alquiler_anual: 1500000, impuesto: 9800, jubilacion: 9680, obra_social: 10000 },
  { categoria: "D", ingresos_brutos: 5449094.55, alquiler_anual: 1875000, impuesto: 16000, jubilacion: 10648, obra_social: 11000 },
  { categoria: "E", ingresos_brutos: 6416528.72, alquiler_anual: 1875000, impuesto: 30000, jubilacion: 11713, obra_social: 12700 },
  { categoria: "F", ingresos_brutos: 8020661.14, alquiler_anual: 2343750, impuesto: 42200, jubilacion: 12884, obra_social: 14600 },
  { categoria: "G", ingresos_brutos: 9624793.35, alquiler_anual: 2343750, impuesto: 76800, jubilacion: 14173, obra_social: 16500 },
  { categoria: "H", ingresos_brutos: 11916410.45, alquiler_anual: 2812500, impuesto: 220000, jubilacion: 15590, obra_social: 20900 },
  { categoria: "I", ingresos_brutos: 13337213.84, alquiler_anual: null, impuesto: 252000, jubilacion: 17149, obra_social: 23700 },
  { categoria: "J", ingresos_brutos: 15285088.04, alquiler_anual: null, impuesto: 300000, jubilacion: 18864, obra_social: 26700 },
  { categoria: "K", ingresos_brutos: 16957968.71, alquiler_anual: null, impuesto: 350000, jubilacion: 20751, obra_social: 30500 },
];

// Links utiles precargados
export const LINKS_CONTADORES = [
  { titulo: "AFIP/ARCA", url: "https://www.afip.gob.ar", descripcion: "Administracion Federal de Ingresos Publicos" },
  { titulo: "ARBA", url: "https://www.arba.gov.ar", descripcion: "Agencia de Recaudacion de Buenos Aires" },
  { titulo: "AGIP", url: "https://www.agip.gob.ar", descripcion: "Administracion Gubernamental de Ingresos Publicos (CABA)" },
  { titulo: "Rentas Cordoba", url: "https://www.rentascordoba.gob.ar", descripcion: "Direccion General de Rentas de Cordoba" },
  { titulo: "API Santa Fe", url: "https://www.santafe.gov.ar/api", descripcion: "Administracion Provincial de Impuestos de Santa Fe" },
  { titulo: "Rentas Mendoza", url: "https://www.atm.mendoza.gov.ar", descripcion: "Administracion Tributaria Mendoza" },
  { titulo: "Monotributo", url: "https://monotributo.afip.gob.ar", descripcion: "Portal de Monotributo" },
  { titulo: "Mis Aplicaciones Web", url: "https://auth.afip.gob.ar/contribuyente", descripcion: "Acceso con CUIT a servicios AFIP" },
];

// Genera vencimientos para un mes y ano dados, segun terminacion de CUIT
export function generarVencimientosMes(mes, anio, terminacionCuit) {
  const resultado = [];
  const terminacion = String(terminacionCuit).slice(-1);

  for (const [key, venc] of Object.entries(VENCIMIENTOS_AFIP)) {
    // Vencimientos anuales: solo en el mes correspondiente
    if (venc.mes && venc.mes !== mes) continue;
    // Vencimientos semestrales
    if (venc.meses && !venc.meses.includes(mes)) continue;

    let dia;
    if (venc.dia) {
      dia = venc.dia;
    } else if (venc.dias) {
      // Buscar el rango que contiene la terminacion
      for (const [rango, d] of Object.entries(venc.dias)) {
        const [min, max] = rango.split("-").map(Number);
        if (Number(terminacion) >= min && Number(terminacion) <= max) {
          dia = d;
          break;
        }
      }
    }

    if (!dia) continue;

    // Ajustar si el dia excede los dias del mes
    const ultimoDia = new Date(anio, mes, 0).getDate();
    if (dia > ultimoDia) dia = ultimoDia;

    const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    resultado.push({
      titulo: venc.nombre,
      obligacion: venc.obligacion,
      fecha_vencimiento: fecha,
      descripcion: venc.descripcion,
      recurrente: venc.recurrencia !== "anual",
      recurrencia: venc.recurrencia,
      prioridad: "media",
    });
  }

  return resultado;
}
