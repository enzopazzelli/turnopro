// CIE-10 — Codigos diagnosticos frecuentes (OMS)
// Seleccion de codigos mas usados en atencion primaria y especialidades

export const CIE10 = [
  // Enfermedades infecciosas (A00-B99)
  { codigo: "A09", descripcion: "Diarrea y gastroenteritis de presunto origen infeccioso" },
  { codigo: "A49.9", descripcion: "Infeccion bacteriana no especificada" },
  { codigo: "B34.9", descripcion: "Infeccion viral no especificada" },
  { codigo: "B37.0", descripcion: "Candidiasis bucal" },
  { codigo: "B37.3", descripcion: "Candidiasis de la vulva y de la vagina" },

  // Neoplasias (C00-D48)
  { codigo: "D50.9", descripcion: "Anemia por deficiencia de hierro sin especificacion" },

  // Sangre (D50-D89)
  { codigo: "D64.9", descripcion: "Anemia no especificada" },

  // Endocrino (E00-E90)
  { codigo: "E03.9", descripcion: "Hipotiroidismo no especificado" },
  { codigo: "E04.9", descripcion: "Bocio no toxico no especificado" },
  { codigo: "E05.9", descripcion: "Tirotoxicosis no especificada" },
  { codigo: "E10", descripcion: "Diabetes mellitus tipo 1" },
  { codigo: "E11", descripcion: "Diabetes mellitus tipo 2" },
  { codigo: "E11.9", descripcion: "Diabetes mellitus tipo 2 sin complicaciones" },
  { codigo: "E66.9", descripcion: "Obesidad no especificada" },
  { codigo: "E78.0", descripcion: "Hipercolesterolemia pura" },
  { codigo: "E78.5", descripcion: "Hiperlipidemia no especificada" },
  { codigo: "E87.6", descripcion: "Hipopotasemia" },

  // Trastornos mentales (F00-F99)
  { codigo: "F10.1", descripcion: "Trastornos mentales por uso de alcohol - uso nocivo" },
  { codigo: "F20.9", descripcion: "Esquizofrenia no especificada" },
  { codigo: "F31", descripcion: "Trastorno afectivo bipolar" },
  { codigo: "F31.9", descripcion: "Trastorno afectivo bipolar no especificado" },
  { codigo: "F32.0", descripcion: "Episodio depresivo leve" },
  { codigo: "F32.1", descripcion: "Episodio depresivo moderado" },
  { codigo: "F32.2", descripcion: "Episodio depresivo grave sin sintomas psicoticos" },
  { codigo: "F32.9", descripcion: "Episodio depresivo no especificado" },
  { codigo: "F33.0", descripcion: "Trastorno depresivo recurrente, episodio actual leve" },
  { codigo: "F33.1", descripcion: "Trastorno depresivo recurrente, episodio actual moderado" },
  { codigo: "F33.9", descripcion: "Trastorno depresivo recurrente sin especificacion" },
  { codigo: "F40.0", descripcion: "Agorafobia" },
  { codigo: "F40.1", descripcion: "Fobias sociales" },
  { codigo: "F40.2", descripcion: "Fobias especificas" },
  { codigo: "F41.0", descripcion: "Trastorno de panico" },
  { codigo: "F41.1", descripcion: "Trastorno de ansiedad generalizada" },
  { codigo: "F41.2", descripcion: "Trastorno mixto ansioso depresivo" },
  { codigo: "F41.9", descripcion: "Trastorno de ansiedad no especificado" },
  { codigo: "F42", descripcion: "Trastorno obsesivo-compulsivo" },
  { codigo: "F43.0", descripcion: "Reaccion a estres agudo" },
  { codigo: "F43.1", descripcion: "Trastorno de estres postraumatico" },
  { codigo: "F43.2", descripcion: "Trastornos de adaptacion" },
  { codigo: "F44.9", descripcion: "Trastorno disociativo no especificado" },
  { codigo: "F45.0", descripcion: "Trastorno de somatizacion" },
  { codigo: "F50.0", descripcion: "Anorexia nerviosa" },
  { codigo: "F50.2", descripcion: "Bulimia nerviosa" },
  { codigo: "F51.0", descripcion: "Insomnio no organico" },
  { codigo: "F60.3", descripcion: "Trastorno de la personalidad emocionalmente inestable" },
  { codigo: "F84.0", descripcion: "Autismo infantil" },
  { codigo: "F84.5", descripcion: "Sindrome de Asperger" },
  { codigo: "F90.0", descripcion: "Trastorno de la actividad y la atencion (TDAH)" },
  { codigo: "F91.9", descripcion: "Trastorno de conducta no especificado" },
  { codigo: "F98.0", descripcion: "Enuresis no organica" },

  // Sistema nervioso (G00-G99)
  { codigo: "G40.9", descripcion: "Epilepsia no especificada" },
  { codigo: "G43.9", descripcion: "Migrana no especificada" },
  { codigo: "G44.2", descripcion: "Cefalea tensional" },
  { codigo: "G47.0", descripcion: "Insomnio" },
  { codigo: "G47.3", descripcion: "Apnea del sueno" },
  { codigo: "G56.0", descripcion: "Sindrome del tunel carpiano" },

  // Ojo (H00-H59)
  { codigo: "H00.0", descripcion: "Orzuelo y otras inflamaciones profundas del parpado" },
  { codigo: "H10.9", descripcion: "Conjuntivitis no especificada" },
  { codigo: "H25.9", descripcion: "Catarata senil no especificada" },
  { codigo: "H26.9", descripcion: "Catarata no especificada" },
  { codigo: "H35.3", descripcion: "Degeneracion macular" },
  { codigo: "H40.1", descripcion: "Glaucoma primario de angulo abierto" },
  { codigo: "H40.9", descripcion: "Glaucoma no especificado" },
  { codigo: "H52.1", descripcion: "Miopia" },
  { codigo: "H52.0", descripcion: "Hipermetropia" },
  { codigo: "H52.2", descripcion: "Astigmatismo" },
  { codigo: "H52.4", descripcion: "Presbicia" },
  { codigo: "H04.1", descripcion: "Ojo seco" },

  // Oido (H60-H95)
  { codigo: "H65.9", descripcion: "Otitis media no supurativa no especificada" },
  { codigo: "H66.9", descripcion: "Otitis media supurativa no especificada" },

  // Circulatorio (I00-I99)
  { codigo: "I10", descripcion: "Hipertension esencial (primaria)" },
  { codigo: "I20.9", descripcion: "Angina de pecho no especificada" },
  { codigo: "I21.9", descripcion: "Infarto agudo de miocardio sin especificacion" },
  { codigo: "I25.9", descripcion: "Cardiopatia isquemica cronica no especificada" },
  { codigo: "I48", descripcion: "Fibrilacion y aleteo auricular" },
  { codigo: "I50.9", descripcion: "Insuficiencia cardiaca no especificada" },
  { codigo: "I63.9", descripcion: "Infarto cerebral no especificado" },
  { codigo: "I83.9", descripcion: "Venas varicosas de miembros inferiores" },

  // Respiratorio (J00-J99)
  { codigo: "J00", descripcion: "Rinofaringitis aguda (resfriado comun)" },
  { codigo: "J02.9", descripcion: "Faringitis aguda no especificada" },
  { codigo: "J03.9", descripcion: "Amigdalitis aguda no especificada" },
  { codigo: "J06.9", descripcion: "Infeccion aguda de las vias respiratorias superiores" },
  { codigo: "J18.9", descripcion: "Neumonia no especificada" },
  { codigo: "J20.9", descripcion: "Bronquitis aguda no especificada" },
  { codigo: "J30.1", descripcion: "Rinitis alergica debida a polen" },
  { codigo: "J30.4", descripcion: "Rinitis alergica no especificada" },
  { codigo: "J31.0", descripcion: "Rinitis cronica" },
  { codigo: "J32.9", descripcion: "Sinusitis cronica no especificada" },
  { codigo: "J45.9", descripcion: "Asma no especificada" },

  // Digestivo (K00-K93)
  { codigo: "K02.9", descripcion: "Caries dental no especificada" },
  { codigo: "K04.0", descripcion: "Pulpitis" },
  { codigo: "K04.7", descripcion: "Absceso periapical sin fistula" },
  { codigo: "K05.0", descripcion: "Gingivitis aguda" },
  { codigo: "K05.1", descripcion: "Gingivitis cronica" },
  { codigo: "K05.3", descripcion: "Periodontitis cronica" },
  { codigo: "K08.1", descripcion: "Perdida de dientes debida a accidente, extraccion o enfermedad periodontal" },
  { codigo: "K12.0", descripcion: "Estomatitis aftosa recurrente" },
  { codigo: "K21.0", descripcion: "Enfermedad por reflujo gastroesofagico con esofagitis" },
  { codigo: "K25.9", descripcion: "Ulcera gastrica sin hemorragia ni perforacion" },
  { codigo: "K29.7", descripcion: "Gastritis no especificada" },
  { codigo: "K30", descripcion: "Dispepsia funcional" },
  { codigo: "K35.9", descripcion: "Apendicitis aguda no especificada" },
  { codigo: "K40.9", descripcion: "Hernia inguinal unilateral sin obstruccion ni gangrena" },
  { codigo: "K58.9", descripcion: "Sindrome de intestino irritable sin diarrea" },
  { codigo: "K59.0", descripcion: "Constipacion" },
  { codigo: "K76.0", descripcion: "Higado graso no clasificado" },
  { codigo: "K80.2", descripcion: "Calculo de vesicula biliar sin colecistitis" },

  // Piel (L00-L99)
  { codigo: "L20.9", descripcion: "Dermatitis atopica no especificada" },
  { codigo: "L23.9", descripcion: "Dermatitis alergica de contacto" },
  { codigo: "L30.9", descripcion: "Dermatitis no especificada" },
  { codigo: "L40.9", descripcion: "Psoriasis no especificada" },
  { codigo: "L50.9", descripcion: "Urticaria no especificada" },
  { codigo: "L70.0", descripcion: "Acne vulgar" },
  { codigo: "L72.0", descripcion: "Quiste epidermoide" },
  { codigo: "B35.1", descripcion: "Tina de las unas (onicomicosis)" },

  // Musculoesqueletico (M00-M99)
  { codigo: "M15.9", descripcion: "Poliartrosis no especificada" },
  { codigo: "M17.9", descripcion: "Gonartrosis no especificada" },
  { codigo: "M19.9", descripcion: "Artrosis no especificada" },
  { codigo: "M25.5", descripcion: "Dolor articular" },
  { codigo: "M54.2", descripcion: "Cervicalgia" },
  { codigo: "M54.4", descripcion: "Lumbago con ciatica" },
  { codigo: "M54.5", descripcion: "Lumbago no especificado" },
  { codigo: "M62.8", descripcion: "Otros trastornos musculares especificados" },
  { codigo: "M65.9", descripcion: "Sinovitis y tenosinovitis no especificada" },
  { codigo: "M75.1", descripcion: "Sindrome del manguito rotador" },
  { codigo: "M79.1", descripcion: "Mialgia" },
  { codigo: "M79.3", descripcion: "Paniculitis no especificada" },

  // Genitourinario (N00-N99)
  { codigo: "N20.0", descripcion: "Calculo del rinon" },
  { codigo: "N30.0", descripcion: "Cistitis aguda" },
  { codigo: "N39.0", descripcion: "Infeccion de vias urinarias sitio no especificado" },
  { codigo: "N76.0", descripcion: "Vaginitis aguda" },
  { codigo: "N92.0", descripcion: "Menstruacion excesiva y frecuente con ciclo regular" },
  { codigo: "N94.6", descripcion: "Dismenorrea no especificada" },
  { codigo: "N95.1", descripcion: "Estados menopausicos y climaterico femenino" },

  // Embarazo (O00-O99)
  { codigo: "O80", descripcion: "Parto unico espontaneo" },
  { codigo: "Z34", descripcion: "Supervision de embarazo normal" },

  // Traumatismos (S00-T98)
  { codigo: "S00.9", descripcion: "Traumatismo superficial de la cabeza" },
  { codigo: "S60.9", descripcion: "Traumatismo superficial de la muneca y la mano" },
  { codigo: "S93.4", descripcion: "Esguince y torcedura de tobillo" },
  { codigo: "T78.4", descripcion: "Alergia no especificada" },

  // Factores que influyen (Z00-Z99)
  { codigo: "Z00.0", descripcion: "Examen medico general" },
  { codigo: "Z01.0", descripcion: "Examen de ojos y de la vision" },
  { codigo: "Z01.2", descripcion: "Examen dental" },
  { codigo: "Z71.9", descripcion: "Consulta no especificada" },
  { codigo: "Z76.0", descripcion: "Emision de receta repetida" },
  { codigo: "Z96.6", descripcion: "Presencia de implante ortopedico articular" },
];

let _cache = null;

export function buscarCIE10(query) {
  if (!query || query.length < 2) return [];

  if (!_cache) {
    _cache = CIE10.map((item) => ({
      ...item,
      busqueda: `${item.codigo} ${item.descripcion}`.toLowerCase(),
    }));
  }

  const terminos = query.toLowerCase().split(/\s+/);
  return _cache
    .filter((item) => terminos.every((t) => item.busqueda.includes(t)))
    .slice(0, 15);
}
