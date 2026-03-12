// Vademecum argentino — medicamentos de uso frecuente
// Fuente: listado basado en medicamentos habituales del mercado argentino (ANMAT)
// Formato: { nombre (droga), presentaciones comunes }

export const VADEMECUM = [
  // --- Analgesicos / Antiinflamatorios / Antifebriles ---
  { droga: "Ibuprofeno", presentaciones: ["200mg", "400mg", "600mg", "800mg"], comercial: ["Ibupirac", "Actron", "Ibuevanol"] },
  { droga: "Paracetamol", presentaciones: ["500mg", "1g", "gotas 100mg/ml"], comercial: ["Tafirol", "Termofren", "Causalon"] },
  { droga: "Diclofenac", presentaciones: ["50mg", "75mg", "100mg", "gel 1%"], comercial: ["Voltaren", "Dioxaflex", "Diclofenac Duo"] },
  { droga: "Aspirina (AAS)", presentaciones: ["100mg", "325mg", "500mg"], comercial: ["Aspirina", "Bayaspirina", "Cardioaspirina"] },
  { droga: "Naproxeno", presentaciones: ["250mg", "500mg", "550mg"], comercial: ["Alidase", "Naprux"] },
  { droga: "Ketorolac", presentaciones: ["10mg", "20mg", "amp 30mg/ml"], comercial: ["Dolten", "Ketoprofeno"] },
  { droga: "Meloxicam", presentaciones: ["7.5mg", "15mg"], comercial: ["Mobic", "Meloxicam"] },
  { droga: "Tramadol", presentaciones: ["50mg", "100mg", "gotas 100mg/ml"], comercial: ["Tramadol", "Calmador"] },
  { droga: "Dexametasona", presentaciones: ["0.5mg", "4mg", "amp 4mg/ml", "amp 8mg/ml"], comercial: ["Decadron"] },
  { droga: "Prednisona", presentaciones: ["5mg", "20mg", "50mg"], comercial: ["Meticorten", "Deltisona"] },
  { droga: "Meprednisona", presentaciones: ["4mg", "8mg", "40mg"], comercial: ["Deltisona B"] },
  { droga: "Betametasona", presentaciones: ["0.5mg", "amp 4mg/ml"], comercial: ["Celestone"] },

  // --- Antibioticos ---
  { droga: "Amoxicilina", presentaciones: ["500mg", "875mg", "susp 250mg/5ml"], comercial: ["Amoxidal", "Optamox"] },
  { droga: "Amoxicilina + Ac. Clavulanico", presentaciones: ["500/125mg", "875/125mg", "susp"], comercial: ["Optamox Duo", "Amoxidal Duo"] },
  { droga: "Azitromicina", presentaciones: ["500mg", "susp 200mg/5ml"], comercial: ["Azitromicina", "Azitronal"] },
  { droga: "Cefalexina", presentaciones: ["500mg", "1g", "susp 250mg/5ml"], comercial: ["Cefalexina", "Keflex"] },
  { droga: "Ciprofloxacina", presentaciones: ["500mg", "750mg"], comercial: ["Cipro", "Ciprofloxacina"] },
  { droga: "Claritromicina", presentaciones: ["250mg", "500mg"], comercial: ["Klaricid"] },
  { droga: "Metronidazol", presentaciones: ["250mg", "500mg", "ovulos 500mg"], comercial: ["Flagyl"] },
  { droga: "Trimetoprima-Sulfametoxazol", presentaciones: ["160/800mg", "80/400mg", "susp"], comercial: ["Bactrim", "Bactrim Forte"] },
  { droga: "Clindamicina", presentaciones: ["300mg", "600mg"], comercial: ["Dalacin"] },
  { droga: "Norfloxacina", presentaciones: ["400mg"], comercial: ["Norfloxacina", "Uroctal"] },
  { droga: "Cefiximia", presentaciones: ["400mg"], comercial: ["Fixam"] },
  { droga: "Levofloxacina", presentaciones: ["500mg", "750mg"], comercial: ["Tavanic"] },

  // --- Antimicoticos ---
  { droga: "Fluconazol", presentaciones: ["150mg", "200mg"], comercial: ["Diflucan", "Fluconazol"] },
  { droga: "Itraconazol", presentaciones: ["100mg"], comercial: ["Sporanox", "Itranax"] },
  { droga: "Nistatina", presentaciones: ["susp 100000 UI/ml", "ovulos"], comercial: ["Nistatina"] },

  // --- Antihistaminicos / Antialergicos ---
  { droga: "Loratadina", presentaciones: ["10mg", "jarabe 5mg/5ml"], comercial: ["Clarityne", "Loratadina"] },
  { droga: "Cetirizina", presentaciones: ["10mg", "gotas 10mg/ml"], comercial: ["Cetirizina", "Zyrtec"] },
  { droga: "Desloratadina", presentaciones: ["5mg"], comercial: ["Aerius"] },
  { droga: "Difenhidramina", presentaciones: ["25mg", "50mg", "jarabe"], comercial: ["Benadryl"] },

  // --- Gastrointestinal ---
  { droga: "Omeprazol", presentaciones: ["20mg", "40mg"], comercial: ["Omeprazol", "Ulcozol"] },
  { droga: "Esomeprazol", presentaciones: ["20mg", "40mg"], comercial: ["Nexium"] },
  { droga: "Pantoprazol", presentaciones: ["20mg", "40mg"], comercial: ["Pantoprazol", "Zurcal"] },
  { droga: "Ranitidina", presentaciones: ["150mg", "300mg"], comercial: ["Taural"] },
  { droga: "Metoclopramida", presentaciones: ["10mg", "gotas 4mg/ml"], comercial: ["Reliveran"] },
  { droga: "Domperidona", presentaciones: ["10mg", "susp 1mg/ml"], comercial: ["Motilium"] },
  { droga: "Loperamida", presentaciones: ["2mg"], comercial: ["Imodium"] },
  { droga: "Bismuto subsalicilato", presentaciones: ["262mg", "susp"], comercial: ["Gastrobismol"] },
  { droga: "Dimeticona + Simeticona", presentaciones: ["gotas", "comp masticables"], comercial: ["Aero-OM"] },

  // --- Cardiovascular / Antihipertensivos ---
  { droga: "Enalapril", presentaciones: ["5mg", "10mg", "20mg"], comercial: ["Lotrial", "Enalapril"] },
  { droga: "Losartan", presentaciones: ["25mg", "50mg", "100mg"], comercial: ["Losartan", "Cozaar"] },
  { droga: "Amlodipina", presentaciones: ["5mg", "10mg"], comercial: ["Norvasc", "Amlodipina"] },
  { droga: "Atenolol", presentaciones: ["25mg", "50mg", "100mg"], comercial: ["Atenolol"] },
  { droga: "Carvedilol", presentaciones: ["6.25mg", "12.5mg", "25mg"], comercial: ["Carvedilol"] },
  { droga: "Valsartan", presentaciones: ["80mg", "160mg", "320mg"], comercial: ["Diovan"] },
  { droga: "Hidroclorotiazida", presentaciones: ["25mg", "50mg"], comercial: ["Hidroclorotiazida"] },
  { droga: "Furosemida", presentaciones: ["20mg", "40mg", "amp 20mg/2ml"], comercial: ["Lasix"] },
  { droga: "Espironolactona", presentaciones: ["25mg", "100mg"], comercial: ["Aldactone"] },

  // --- Colesterol / Lipidos ---
  { droga: "Atorvastatina", presentaciones: ["10mg", "20mg", "40mg", "80mg"], comercial: ["Lipitor", "Atorvastatina"] },
  { droga: "Rosuvastatina", presentaciones: ["5mg", "10mg", "20mg", "40mg"], comercial: ["Crestor", "Rosuvastatina"] },
  { droga: "Simvastatina", presentaciones: ["10mg", "20mg", "40mg"], comercial: ["Zocor"] },
  { droga: "Fenofibrato", presentaciones: ["160mg", "200mg"], comercial: ["Lipidil"] },
  { droga: "Ezetimibe", presentaciones: ["10mg"], comercial: ["Zetia", "Ezetrol"] },

  // --- Diabetes ---
  { droga: "Metformina", presentaciones: ["500mg", "850mg", "1000mg"], comercial: ["Glucophage", "Metformina"] },
  { droga: "Glimepirida", presentaciones: ["1mg", "2mg", "4mg"], comercial: ["Amaryl"] },
  { droga: "Glibenclamida", presentaciones: ["2.5mg", "5mg"], comercial: ["Glibenclamida", "Euglucon"] },
  { droga: "Sitagliptina", presentaciones: ["25mg", "50mg", "100mg"], comercial: ["Januvia"] },
  { droga: "Dapagliflozina", presentaciones: ["5mg", "10mg"], comercial: ["Forxiga"] },
  { droga: "Insulina Glargina", presentaciones: ["lapicera 100 UI/ml"], comercial: ["Lantus"] },
  { droga: "Insulina NPH", presentaciones: ["frasco 100 UI/ml"], comercial: ["Insulina NPH"] },

  // --- Tiroides ---
  { droga: "Levotiroxina", presentaciones: ["25mcg", "50mcg", "75mcg", "100mcg", "125mcg", "150mcg", "200mcg"], comercial: ["T4 Montpellier", "Levotiroxina"] },
  { droga: "Metimazol", presentaciones: ["5mg", "10mg"], comercial: ["Thyrozol"] },

  // --- SNC / Psiquiatria ---
  { droga: "Alprazolam", presentaciones: ["0.25mg", "0.5mg", "1mg", "2mg"], comercial: ["Alplax", "Alprazolam"] },
  { droga: "Clonazepam", presentaciones: ["0.5mg", "2mg", "gotas 2.5mg/ml"], comercial: ["Rivotril", "Clonagin"] },
  { droga: "Diazepam", presentaciones: ["5mg", "10mg"], comercial: ["Valium"] },
  { droga: "Zolpidem", presentaciones: ["5mg", "10mg"], comercial: ["Somit", "Zolpidem"] },
  { droga: "Sertralina", presentaciones: ["25mg", "50mg", "100mg"], comercial: ["Zoloft", "Sertralina"] },
  { droga: "Escitalopram", presentaciones: ["5mg", "10mg", "15mg", "20mg"], comercial: ["Lexapro", "Escitalopram"] },
  { droga: "Fluoxetina", presentaciones: ["20mg", "40mg"], comercial: ["Foxetin", "Fluoxetina"] },
  { droga: "Paroxetina", presentaciones: ["10mg", "20mg", "30mg"], comercial: ["Aropax"] },
  { droga: "Venlafaxina", presentaciones: ["37.5mg", "75mg", "150mg"], comercial: ["Efexor"] },
  { droga: "Duloxetina", presentaciones: ["30mg", "60mg"], comercial: ["Cymbalta", "Duxetin"] },
  { droga: "Quetiapina", presentaciones: ["25mg", "100mg", "200mg", "300mg"], comercial: ["Seroquel", "Quetiapina"] },
  { droga: "Risperidona", presentaciones: ["0.5mg", "1mg", "2mg", "3mg"], comercial: ["Risperdal"] },
  { droga: "Olanzapina", presentaciones: ["2.5mg", "5mg", "10mg"], comercial: ["Zyprexa"] },
  { droga: "Lamotrigina", presentaciones: ["25mg", "50mg", "100mg", "200mg"], comercial: ["Lamictal", "Lamotrigina"] },
  { droga: "Acido Valproico", presentaciones: ["250mg", "500mg", "jarabe"], comercial: ["Valcote", "Logical"] },
  { droga: "Carbamazepina", presentaciones: ["200mg", "400mg"], comercial: ["Tegretol"] },
  { droga: "Pregabalina", presentaciones: ["25mg", "50mg", "75mg", "150mg", "300mg"], comercial: ["Lyrica", "Pregabalina"] },
  { droga: "Gabapentina", presentaciones: ["300mg", "400mg", "600mg"], comercial: ["Neurontin"] },
  { droga: "Litio carbonato", presentaciones: ["300mg"], comercial: ["Ceglution"] },
  { droga: "Bupropion", presentaciones: ["150mg", "300mg"], comercial: ["Wellbutrin", "Bupropion"] },
  { droga: "Mirtazapina", presentaciones: ["15mg", "30mg"], comercial: ["Remeron"] },
  { droga: "Trazodona", presentaciones: ["50mg", "100mg", "150mg"], comercial: ["Taxagon"] },
  { droga: "Melatonina", presentaciones: ["3mg", "5mg"], comercial: ["Melatonina"] },

  // --- Respiratorio ---
  { droga: "Salbutamol", presentaciones: ["inhalador 100mcg/dosis", "nebulizar 5mg/ml", "jarabe"], comercial: ["Ventolin", "Salbutamol"] },
  { droga: "Budesonide", presentaciones: ["inhalador 200mcg", "nebulizar 0.5mg/ml"], comercial: ["Pulmicort", "Neumotex"] },
  { droga: "Fluticasona", presentaciones: ["inhalador 125mcg", "250mcg", "spray nasal"], comercial: ["Flixotide", "Avamys"] },
  { droga: "Montelukast", presentaciones: ["4mg", "5mg", "10mg"], comercial: ["Singulair", "Montelukast"] },
  { droga: "Acetilcisteina", presentaciones: ["200mg", "600mg", "sobres"], comercial: ["Mucolitic", "Fluimucil"] },
  { droga: "Ambroxol", presentaciones: ["30mg", "jarabe 15mg/5ml"], comercial: ["Mucosolvan"] },
  { droga: "Pseudoefedrina", presentaciones: ["60mg", "120mg"], comercial: ["Sudafed"] },
  { droga: "Codeina + Paracetamol", presentaciones: ["30/500mg"], comercial: ["Dolofrix"] },

  // --- Dermatologia ---
  { droga: "Mupirocina", presentaciones: ["crema 2%", "pomada 2%"], comercial: ["Bactroban"] },
  { droga: "Acido Fusidico", presentaciones: ["crema 2%"], comercial: ["Fucidine"] },
  { droga: "Clotrimazol", presentaciones: ["crema 1%", "ovulos 100mg"], comercial: ["Clotrimazol", "Canesten"] },
  { droga: "Ketoconazol", presentaciones: ["crema 2%", "shampoo 2%"], comercial: ["Nizoral"] },
  { droga: "Permetrina", presentaciones: ["crema 5%", "locion 1%"], comercial: ["Permetrina"] },
  { droga: "Tretinoina", presentaciones: ["crema 0.025%", "0.05%"], comercial: ["Retin-A"] },
  { droga: "Hidrocortisona", presentaciones: ["crema 1%"], comercial: ["Hidrocortisona"] },

  // --- Oftalmologia ---
  { droga: "Tobramicina", presentaciones: ["colirio 0.3%"], comercial: ["Tobrex"] },
  { droga: "Ciprofloxacina oftalmica", presentaciones: ["colirio 0.3%"], comercial: ["Ciloxan"] },
  { droga: "Lagrimas artificiales", presentaciones: ["colirio", "gel"], comercial: ["Systane", "Refresh"] },
  { droga: "Timolol", presentaciones: ["colirio 0.5%"], comercial: ["Timolol"] },
  { droga: "Dorzolamida + Timolol", presentaciones: ["colirio"], comercial: ["Cosopt"] },
  { droga: "Prednisolona oftalmica", presentaciones: ["colirio 1%"], comercial: ["Pred Forte"] },

  // --- Odontologia ---
  { droga: "Amoxicilina 1g", presentaciones: ["1g"], comercial: ["Amoxidal 1g"] },
  { droga: "Acido Mefenamico", presentaciones: ["500mg"], comercial: ["Ponstil"] },
  { droga: "Nimesulida", presentaciones: ["100mg"], comercial: ["Aulin", "Nimesulida"] },
  { droga: "Lidocaina", presentaciones: ["amp 2%", "gel 2%", "spray 10%"], comercial: ["Lidocaina"] },
  { droga: "Clorhexidina", presentaciones: ["enjuague 0.12%", "gel 1%"], comercial: ["Plac Out", "Perioxidin"] },

  // --- Veterinaria (uso frecuente) ---
  { droga: "Enrofloxacina", presentaciones: ["50mg", "150mg", "iny"], comercial: ["Baytril"] },
  { droga: "Cefalexina veterinaria", presentaciones: ["250mg", "500mg"], comercial: ["Rilexine"] },
  { droga: "Meloxicam veterinario", presentaciones: ["1mg", "2mg", "susp oral"], comercial: ["Metacam"] },
  { droga: "Prednisolona veterinaria", presentaciones: ["5mg", "20mg"], comercial: ["Prednisolona"] },
  { droga: "Metronidazol veterinario", presentaciones: ["250mg", "500mg", "susp"], comercial: ["Flagyl vet"] },
  { droga: "Omeprazol veterinario", presentaciones: ["10mg", "20mg"], comercial: ["Omeprazol vet"] },
  { droga: "Ivermectina", presentaciones: ["gotas", "comp", "iny"], comercial: ["Ivomec"] },
  { droga: "Fipronil", presentaciones: ["pipeta spot-on"], comercial: ["Frontline"] },
  { droga: "Afoxolaner", presentaciones: ["comp masticable"], comercial: ["NexGard"] },
  { droga: "Sarolaner + Moxidectina + Pirantel", presentaciones: ["comp masticable"], comercial: ["Simparica Trio"] },
  { droga: "Milbemicina + Praziquantel", presentaciones: ["comp"], comercial: ["Milbemax"] },
  { droga: "Dipirona veterinaria", presentaciones: ["gotas", "iny"], comercial: ["Dipirona"] },
];

// Genera lista plana para busqueda rapida
// Cada item: { texto: "Ibuprofeno 400mg (Ibupirac)", droga, presentacion, comerciales }
let _cache = null;

export function buscarMedicamentos(query) {
  if (!query || query.length < 2) return [];

  if (!_cache) {
    _cache = [];
    for (const med of VADEMECUM) {
      // Una entrada por cada presentacion
      for (const pres of med.presentaciones) {
        _cache.push({
          texto: `${med.droga} ${pres}`,
          droga: med.droga,
          presentacion: pres,
          comerciales: med.comercial,
          busqueda: `${med.droga} ${pres} ${med.comercial.join(" ")}`.toLowerCase(),
        });
      }
      // Una entrada generica sin presentacion
      _cache.push({
        texto: med.droga,
        droga: med.droga,
        presentacion: "",
        comerciales: med.comercial,
        busqueda: `${med.droga} ${med.comercial.join(" ")}`.toLowerCase(),
      });
    }
  }

  const terminos = query.toLowerCase().split(/\s+/);
  return _cache
    .filter((item) => terminos.every((t) => item.busqueda.includes(t)))
    .slice(0, 15);
}
