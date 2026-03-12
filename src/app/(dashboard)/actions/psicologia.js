"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  notaSesionSchema,
  evolucionSchema,
  cuestionarioSchema,
  respuestaCuestionarioSchema,
} from "@/lib/validations/rubro-psicologia";

// ============================================
// NOTAS DE SESIÓN
// ============================================

export async function obtenerNotasSesion(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("notas_sesion")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: false });

  if (error) return { data: [], error: "Error al obtener notas" };
  return { data: data || [], error: null };
}

export async function crearNotaSesion(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const temasRaw = formData.get("temas") || "";

  const rawData = {
    paciente_id: formData.get("paciente_id"),
    cita_id: formData.get("cita_id") || null,
    fecha: formData.get("fecha"),
    contenido: formData.get("contenido"),
    estado_emocional: formData.get("estado_emocional"),
    temas: temasRaw ? temasRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    objetivos: formData.get("objetivos"),
    tareas: formData.get("tareas"),
    privado: formData.get("privado") === "true",
  };

  const validado = notaSesionSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("notas_sesion")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al crear nota", success: false };

  revalidatePath("/dashboard/notas-sesion");
  return { error: null, success: true };
}

export async function actualizarNotaSesion(id, prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const temasRaw = formData.get("temas") || "";

  const rawData = {
    paciente_id: formData.get("paciente_id"),
    cita_id: formData.get("cita_id") || null,
    fecha: formData.get("fecha"),
    contenido: formData.get("contenido"),
    estado_emocional: formData.get("estado_emocional"),
    temas: temasRaw ? temasRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    objetivos: formData.get("objetivos"),
    tareas: formData.get("tareas"),
    privado: formData.get("privado") === "true",
  };

  const validado = notaSesionSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("notas_sesion")
    .update(validado.data)
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al actualizar nota", success: false };

  revalidatePath("/dashboard/notas-sesion");
  return { error: null, success: true };
}

// ============================================
// EVOLUCIONES
// ============================================

export async function obtenerEvoluciones(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("evoluciones")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: true });

  if (error) return { data: [], error: "Error al obtener evoluciones" };
  return { data: data || [], error: null };
}

export async function registrarEvolucion(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    paciente_id: formData.get("paciente_id"),
    fecha: formData.get("fecha"),
    titulo: formData.get("titulo"),
    descripcion: formData.get("descripcion"),
    puntuacion: formData.get("puntuacion"),
    area: formData.get("area"),
  };

  const validado = evolucionSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("evoluciones")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al registrar evolucion", success: false };

  revalidatePath("/dashboard/evolucion");
  return { error: null, success: true };
}

// ============================================
// CUESTIONARIOS
// ============================================

export async function obtenerCuestionarios() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  const { data, error } = await supabase
    .from("cuestionarios")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: "Error al obtener cuestionarios" };
  return { data: data || [], error: null };
}

export async function crearCuestionario(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  let preguntas = [];
  try {
    preguntas = JSON.parse(formData.get("preguntas") || "[]");
  } catch {
    return { error: "Preguntas invalidas", success: false };
  }

  const rawData = {
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion"),
    tipo: "personalizado",
    preguntas,
  };

  const validado = cuestionarioSchema.safeParse(rawData);
  if (!validado.success) {
    return { error: validado.error.errors[0].message, success: false };
  }

  const { error } = await supabase
    .from("cuestionarios")
    .insert({ ...validado.data, tenant_id: tenantId });

  if (error) return { error: "Error al crear cuestionario", success: false };

  revalidatePath("/dashboard/cuestionarios");
  return { error: null, success: true };
}

export async function aplicarCuestionario(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  let respuestas = [];
  try {
    respuestas = JSON.parse(formData.get("respuestas") || "[]");
  } catch {
    return { error: "Respuestas invalidas", success: false };
  }

  const cuestionarioId = formData.get("cuestionario_id");
  const pacienteId = formData.get("paciente_id");

  // Obtener cuestionario para calcular scoring
  const { data: cuestionario } = await supabase
    .from("cuestionarios")
    .select("tipo")
    .eq("id", cuestionarioId)
    .single();

  const puntuacionTotal = respuestas.reduce((sum, r) => sum + (Number(r) || 0), 0);
  let interpretacion = "";

  if (cuestionario?.tipo === "phq9") {
    if (puntuacionTotal <= 4) interpretacion = "Minimo";
    else if (puntuacionTotal <= 9) interpretacion = "Leve";
    else if (puntuacionTotal <= 14) interpretacion = "Moderada";
    else if (puntuacionTotal <= 19) interpretacion = "Moderadamente severa";
    else interpretacion = "Severa";
  } else if (cuestionario?.tipo === "gad7") {
    if (puntuacionTotal <= 4) interpretacion = "Minimo";
    else if (puntuacionTotal <= 9) interpretacion = "Leve";
    else if (puntuacionTotal <= 14) interpretacion = "Moderada";
    else interpretacion = "Severa";
  } else if (cuestionario?.tipo === "bdi2") {
    if (puntuacionTotal <= 13) interpretacion = "Minimo";
    else if (puntuacionTotal <= 19) interpretacion = "Leve";
    else if (puntuacionTotal <= 28) interpretacion = "Moderada";
    else interpretacion = "Severa";
  } else if (cuestionario?.tipo === "stai_estado" || cuestionario?.tipo === "stai_rasgo") {
    if (puntuacionTotal <= 30) interpretacion = "Baja";
    else if (puntuacionTotal <= 44) interpretacion = "Moderada";
    else interpretacion = "Alta";
  } else if (cuestionario?.tipo === "moca") {
    if (puntuacionTotal >= 26) interpretacion = "Normal";
    else if (puntuacionTotal >= 18) interpretacion = "Deterioro leve";
    else if (puntuacionTotal >= 10) interpretacion = "Deterioro moderado";
    else interpretacion = "Deterioro severo";
  }

  const { error } = await supabase.from("respuestas_cuestionario").insert({
    tenant_id: tenantId,
    cuestionario_id: cuestionarioId,
    paciente_id: pacienteId,
    respuestas,
    puntuacion_total: puntuacionTotal,
    interpretacion,
  });

  if (error) return { error: "Error al aplicar cuestionario", success: false };

  revalidatePath("/dashboard/cuestionarios");
  return { error: null, success: true, puntuacion: puntuacionTotal, interpretacion };
}

export async function obtenerRespuestasCuestionario(pacienteId, cuestionarioId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  let query = supabase
    .from("respuestas_cuestionario")
    .select("*, cuestionarios(nombre, tipo)")
    .eq("tenant_id", tenantId)
    .order("fecha", { ascending: true });

  if (pacienteId) query = query.eq("paciente_id", pacienteId);
  if (cuestionarioId) query = query.eq("cuestionario_id", cuestionarioId);

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener respuestas" };
  return { data: data || [], error: null };
}

export async function inicializarCuestionariosPredefinidos() {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const TODOS_LOS_TIPOS = ["phq9", "gad7", "bdi2", "stai_estado", "stai_rasgo", "moca"];

  const { data: existentes } = await supabase
    .from("cuestionarios")
    .select("tipo")
    .eq("tenant_id", tenantId)
    .in("tipo", TODOS_LOS_TIPOS);

  const tiposExistentes = (existentes || []).map((c) => c.tipo);
  const toInsert = [];

  if (!tiposExistentes.includes("phq9")) {
    toInsert.push({
      tenant_id: tenantId,
      nombre: "PHQ-9 (Depresion)",
      descripcion: "Cuestionario de salud del paciente - 9 items para evaluar depresion. Escala 0-27.",
      tipo: "phq9",
      preguntas: [
        { texto: "Poco interes o placer en hacer cosas", tipo: "escala", min: 0, max: 3 },
        { texto: "Sentirse desanimado/a, deprimido/a o sin esperanza", tipo: "escala", min: 0, max: 3 },
        { texto: "Dificultad para dormir, mantenerse dormido/a o dormir demasiado", tipo: "escala", min: 0, max: 3 },
        { texto: "Sentirse cansado/a o con poca energia", tipo: "escala", min: 0, max: 3 },
        { texto: "Poco apetito o comer en exceso", tipo: "escala", min: 0, max: 3 },
        { texto: "Sentirse mal consigo mismo/a", tipo: "escala", min: 0, max: 3 },
        { texto: "Dificultad para concentrarse", tipo: "escala", min: 0, max: 3 },
        { texto: "Moverse o hablar lentamente, o estar inquieto/a", tipo: "escala", min: 0, max: 3 },
        { texto: "Pensamientos de hacerse dano o de que estaria mejor muerto/a", tipo: "escala", min: 0, max: 3 },
      ],
    });
  }

  if (!tiposExistentes.includes("gad7")) {
    toInsert.push({
      tenant_id: tenantId,
      nombre: "GAD-7 (Ansiedad)",
      descripcion: "Escala de 7 items para evaluar trastorno de ansiedad generalizada. Escala 0-21.",
      tipo: "gad7",
      preguntas: [
        { texto: "Sentirse nervioso/a, ansioso/a o con los nervios de punta", tipo: "escala", min: 0, max: 3 },
        { texto: "No ser capaz de parar o controlar la preocupacion", tipo: "escala", min: 0, max: 3 },
        { texto: "Preocuparse demasiado por diferentes cosas", tipo: "escala", min: 0, max: 3 },
        { texto: "Dificultad para relajarse", tipo: "escala", min: 0, max: 3 },
        { texto: "Estar tan inquieto/a que es dificil quedarse quieto/a", tipo: "escala", min: 0, max: 3 },
        { texto: "Molestarse o irritarse facilmente", tipo: "escala", min: 0, max: 3 },
        { texto: "Sentir miedo como si algo terrible pudiera pasar", tipo: "escala", min: 0, max: 3 },
      ],
    });
  }

  if (!tiposExistentes.includes("bdi2")) {
    toInsert.push({
      tenant_id: tenantId,
      nombre: "BDI-II (Beck Depresion)",
      descripcion: "Inventario de Depresion de Beck - 21 items. Escala 0-63. Evalua gravedad de sintomas depresivos.",
      tipo: "bdi2",
      preguntas: [
        { texto: "Tristeza: 0=No me siento triste, 1=Me siento triste gran parte del tiempo, 2=Estoy triste todo el tiempo, 3=Estoy tan triste que no puedo soportarlo", tipo: "escala", min: 0, max: 3 },
        { texto: "Pesimismo: 0=No estoy desalentado/a sobre mi futuro, 1=Me siento mas desalentado/a que antes, 2=No espero que las cosas mejoren, 3=Siento que mi futuro es desesperanzador", tipo: "escala", min: 0, max: 3 },
        { texto: "Fracaso: 0=No me siento fracasado/a, 1=He fracasado mas de lo que deberia, 2=Cuando miro atras veo muchos fracasos, 3=Me siento un fracaso total como persona", tipo: "escala", min: 0, max: 3 },
        { texto: "Perdida de placer: 0=Disfruto de las cosas como antes, 1=No disfruto tanto como antes, 2=Obtengo muy poco placer de las cosas, 3=No obtengo ningun placer de las cosas", tipo: "escala", min: 0, max: 3 },
        { texto: "Sentimientos de culpa: 0=No me siento especialmente culpable, 1=Me siento culpable por muchas cosas, 2=Me siento bastante culpable la mayor parte del tiempo, 3=Me siento culpable todo el tiempo", tipo: "escala", min: 0, max: 3 },
        { texto: "Sentimientos de castigo: 0=No siento que este siendo castigado/a, 1=Siento que puedo ser castigado/a, 2=Espero ser castigado/a, 3=Siento que estoy siendo castigado/a", tipo: "escala", min: 0, max: 3 },
        { texto: "Disconformidad con uno mismo: 0=Siento lo mismo que antes sobre mi, 1=He perdido confianza en mi, 2=Estoy decepcionado/a de mi mismo/a, 3=No me gusto a mi mismo/a", tipo: "escala", min: 0, max: 3 },
        { texto: "Autocritica: 0=No me critico ni me culpo mas que antes, 1=Soy mas critico/a conmigo que antes, 2=Me critico por todas mis fallas, 3=Me culpo por todo lo malo que sucede", tipo: "escala", min: 0, max: 3 },
        { texto: "Pensamientos suicidas: 0=No pienso en suicidarme, 1=Pienso en suicidarme pero no lo haria, 2=Desearia suicidarme, 3=Me suicidaria si tuviera la oportunidad", tipo: "escala", min: 0, max: 3 },
        { texto: "Llanto: 0=No lloro mas que antes, 1=Lloro mas que antes, 2=Lloro por cualquier cosa, 3=Tengo ganas de llorar pero no puedo", tipo: "escala", min: 0, max: 3 },
        { texto: "Agitacion: 0=No estoy mas inquieto/a que antes, 1=Me siento mas inquieto/a que antes, 2=Estoy tan inquieto/a que me cuesta quedarme quieto/a, 3=Estoy tan inquieto/a que tengo que moverme constantemente", tipo: "escala", min: 0, max: 3 },
        { texto: "Perdida de interes: 0=No he perdido interes en otras personas o actividades, 1=Estoy menos interesado/a que antes, 2=He perdido la mayor parte del interes, 3=Es dificil interesarme por algo", tipo: "escala", min: 0, max: 3 },
        { texto: "Indecision: 0=Tomo decisiones como siempre, 1=Me resulta mas dificil tomar decisiones, 2=Tengo mucha mas dificultad que antes, 3=Tengo problemas para tomar cualquier decision", tipo: "escala", min: 0, max: 3 },
        { texto: "Desvalorizacion: 0=No me siento sin valor, 1=No me considero tan valioso/a como antes, 2=Me siento menos valioso/a comparado con otros, 3=Me siento completamente sin valor", tipo: "escala", min: 0, max: 3 },
        { texto: "Perdida de energia: 0=Tengo tanta energia como siempre, 1=Tengo menos energia que antes, 2=No tengo suficiente energia para hacer mucho, 3=No tengo energia para hacer nada", tipo: "escala", min: 0, max: 3 },
        { texto: "Cambios en el sueno: 0=No he notado cambios, 1=Duermo algo mas/menos que antes, 2=Duermo mucho mas/menos que antes, 3=Duermo la mayor parte del dia o me despierto 1-2 horas antes y no puedo volver a dormirme", tipo: "escala", min: 0, max: 3 },
        { texto: "Irritabilidad: 0=No estoy mas irritable que antes, 1=Estoy mas irritable que antes, 2=Estoy mucho mas irritable que antes, 3=Estoy irritable todo el tiempo", tipo: "escala", min: 0, max: 3 },
        { texto: "Cambios en el apetito: 0=No he notado cambios, 1=Mi apetito es algo menor/mayor que antes, 2=Mi apetito es mucho menor/mayor que antes, 3=No tengo apetito en absoluto o tengo ansia de comer todo el tiempo", tipo: "escala", min: 0, max: 3 },
        { texto: "Dificultad de concentracion: 0=Puedo concentrarme como siempre, 1=No puedo concentrarme tan bien como antes, 2=Me cuesta mantener la mente en algo, 3=No puedo concentrarme en nada", tipo: "escala", min: 0, max: 3 },
        { texto: "Cansancio o fatiga: 0=No estoy mas cansado/a que antes, 1=Me canso mas facilmente que antes, 2=Estoy demasiado cansado/a para hacer muchas cosas, 3=Estoy demasiado cansado/a para hacer cualquier cosa", tipo: "escala", min: 0, max: 3 },
        { texto: "Perdida de interes en el sexo: 0=No he notado cambios recientes, 1=Estoy menos interesado/a que antes, 2=Estoy mucho menos interesado/a ahora, 3=He perdido completamente el interes", tipo: "escala", min: 0, max: 3 },
      ],
    });
  }

  if (!tiposExistentes.includes("stai_estado")) {
    toInsert.push({
      tenant_id: tenantId,
      nombre: "STAI - Ansiedad Estado",
      descripcion: "Inventario de Ansiedad Estado-Rasgo (Estado). 20 items. Escala 20-80. Evalua ansiedad en el momento actual.",
      tipo: "stai_estado",
      preguntas: [
        { texto: "Me siento calmado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento seguro/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Estoy tenso/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Estoy contrariado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento comodo/a (a gusto)", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento alterado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Estoy preocupado/a por posibles desgracias futuras", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento descansado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento angustiado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento confortable", tipo: "escala", min: 1, max: 4 },
        { texto: "Tengo confianza en mi mismo/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento nervioso/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Estoy desasosegado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento muy atado/a (oprimido/a)", tipo: "escala", min: 1, max: 4 },
        { texto: "Estoy relajado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento satisfecho/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Estoy preocupado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento aturdido/a y sobreexcitado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento alegre", tipo: "escala", min: 1, max: 4 },
        { texto: "En este momento me siento bien", tipo: "escala", min: 1, max: 4 },
      ],
    });
  }

  if (!tiposExistentes.includes("stai_rasgo")) {
    toInsert.push({
      tenant_id: tenantId,
      nombre: "STAI - Ansiedad Rasgo",
      descripcion: "Inventario de Ansiedad Estado-Rasgo (Rasgo). 20 items. Escala 20-80. Evalua tendencia general a la ansiedad.",
      tipo: "stai_rasgo",
      preguntas: [
        { texto: "Me siento bien", tipo: "escala", min: 1, max: 4 },
        { texto: "Me canso rapidamente", tipo: "escala", min: 1, max: 4 },
        { texto: "Siento ganas de llorar", tipo: "escala", min: 1, max: 4 },
        { texto: "Me gustaria ser tan feliz como otros", tipo: "escala", min: 1, max: 4 },
        { texto: "Pierdo oportunidades por no decidirme pronto", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento descansado/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Soy una persona tranquila, serena y sosegada", tipo: "escala", min: 1, max: 4 },
        { texto: "Veo que las dificultades se amontonan y no puedo con ellas", tipo: "escala", min: 1, max: 4 },
        { texto: "Me preocupo demasiado por cosas sin importancia", tipo: "escala", min: 1, max: 4 },
        { texto: "Soy feliz", tipo: "escala", min: 1, max: 4 },
        { texto: "Suelo tomar las cosas demasiado seriamente", tipo: "escala", min: 1, max: 4 },
        { texto: "Me falta confianza en mi mismo/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento seguro/a", tipo: "escala", min: 1, max: 4 },
        { texto: "No suelo afrontar las crisis o dificultades", tipo: "escala", min: 1, max: 4 },
        { texto: "Me siento triste (melancolico/a)", tipo: "escala", min: 1, max: 4 },
        { texto: "Estoy satisfecho/a", tipo: "escala", min: 1, max: 4 },
        { texto: "Me rondan y molestan pensamientos sin importancia", tipo: "escala", min: 1, max: 4 },
        { texto: "Me afectan tanto los desenganos que no puedo olvidarlos", tipo: "escala", min: 1, max: 4 },
        { texto: "Soy una persona estable", tipo: "escala", min: 1, max: 4 },
        { texto: "Cuando pienso sobre asuntos del momento me pongo tenso/a", tipo: "escala", min: 1, max: 4 },
      ],
    });
  }

  if (!tiposExistentes.includes("moca")) {
    toInsert.push({
      tenant_id: tenantId,
      nombre: "MoCA (Evaluacion Cognitiva Montreal)",
      descripcion: "Montreal Cognitive Assessment - 30 puntos. Evalua atencion, concentracion, funciones ejecutivas, memoria, lenguaje, habilidades visoconstructivas, calculo y orientacion. Punto de corte: 26.",
      tipo: "moca",
      preguntas: [
        { texto: "Visoconstructivo/Ejecutivo - Alternancia (Trail Making adaptado): conectar 1-A-2-B-3-C-4-D-5-E correctamente", tipo: "escala", min: 0, max: 1 },
        { texto: "Visoconstructivo - Copia del cubo: dibujo tridimensional correcto", tipo: "escala", min: 0, max: 1 },
        { texto: "Visoconstructivo - Dibujo del reloj (contorno)", tipo: "escala", min: 0, max: 1 },
        { texto: "Visoconstructivo - Dibujo del reloj (numeros)", tipo: "escala", min: 0, max: 1 },
        { texto: "Visoconstructivo - Dibujo del reloj (agujas a las 11:10)", tipo: "escala", min: 0, max: 1 },
        { texto: "Denominacion - Identificar leon", tipo: "escala", min: 0, max: 1 },
        { texto: "Denominacion - Identificar rinoceronte", tipo: "escala", min: 0, max: 1 },
        { texto: "Denominacion - Identificar camello/dromedario", tipo: "escala", min: 0, max: 1 },
        { texto: "Memoria - Registro de 5 palabras (1er intento) — sin puntaje, solo registro", tipo: "escala", min: 0, max: 0 },
        { texto: "Atencion - Repetir serie de 5 digitos en orden directo", tipo: "escala", min: 0, max: 1 },
        { texto: "Atencion - Repetir serie de 3 digitos en orden inverso", tipo: "escala", min: 0, max: 1 },
        { texto: "Atencion - Vigilancia: golpear al oir la letra A (serie de letras)", tipo: "escala", min: 0, max: 1 },
        { texto: "Atencion - Resta serial de 7 desde 100 (4-5 restas correctas = 3, 2-3 = 2, 1 = 1, 0 = 0)", tipo: "escala", min: 0, max: 3 },
        { texto: "Lenguaje - Repetir frase 1: 'El gato se esconde bajo el sofa cuando los perros entran en la sala'", tipo: "escala", min: 0, max: 1 },
        { texto: "Lenguaje - Repetir frase 2: 'Espero que el le haya entregado el mensaje una vez que ella se lo haya pedido'", tipo: "escala", min: 0, max: 1 },
        { texto: "Lenguaje - Fluidez verbal: 11 o mas palabras con F en 1 minuto", tipo: "escala", min: 0, max: 1 },
        { texto: "Abstraccion - Semejanza tren-bicicleta (medios de transporte)", tipo: "escala", min: 0, max: 1 },
        { texto: "Abstraccion - Semejanza reloj-regla (instrumentos de medida)", tipo: "escala", min: 0, max: 1 },
        { texto: "Recuerdo diferido - Palabra 1 (rostro)", tipo: "escala", min: 0, max: 1 },
        { texto: "Recuerdo diferido - Palabra 2 (seda/terciopelo)", tipo: "escala", min: 0, max: 1 },
        { texto: "Recuerdo diferido - Palabra 3 (iglesia/templo)", tipo: "escala", min: 0, max: 1 },
        { texto: "Recuerdo diferido - Palabra 4 (margarita/clavel)", tipo: "escala", min: 0, max: 1 },
        { texto: "Recuerdo diferido - Palabra 5 (rojo)", tipo: "escala", min: 0, max: 1 },
        { texto: "Orientacion - Fecha del dia", tipo: "escala", min: 0, max: 1 },
        { texto: "Orientacion - Mes", tipo: "escala", min: 0, max: 1 },
        { texto: "Orientacion - Ano", tipo: "escala", min: 0, max: 1 },
        { texto: "Orientacion - Dia de la semana", tipo: "escala", min: 0, max: 1 },
        { texto: "Orientacion - Lugar", tipo: "escala", min: 0, max: 1 },
        { texto: "Orientacion - Ciudad", tipo: "escala", min: 0, max: 1 },
      ],
    });
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("cuestionarios").insert(toInsert);
    if (error) return { error: "Error al inicializar cuestionarios" };
  }

  revalidatePath("/dashboard/cuestionarios");
  return { error: null, cantidad: toInsert.length };
}


// ============================================
// CONSENTIMIENTOS INFORMADOS
// ============================================

export async function obtenerConsentimientos(pacienteId) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { data: [], error: "Sin acceso" };

  let query = supabase
    .from("consentimientos_informados")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (pacienteId) query = query.eq("paciente_id", pacienteId);

  const { data, error } = await query;
  if (error) return { data: [], error: "Error al obtener consentimientos" };
  return { data: data || [], error: null };
}

export async function crearConsentimiento(prevState, formData) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso", success: false };

  const rawData = {
    paciente_id: formData.get("paciente_id") || null,
    paciente_nombre: formData.get("paciente_nombre") || null,
    contenido: formData.get("contenido"),
    firmado: formData.get("firmado") === "true",
    fecha_firma: formData.get("firmado") === "true" ? new Date().toISOString().split("T")[0] : null,
  };

  if (!rawData.contenido) return { error: "El contenido es obligatorio", success: false };

  const { error } = await supabase
    .from("consentimientos_informados")
    .insert({ ...rawData, tenant_id: tenantId });

  if (error) return { error: "Error al guardar consentimiento", success: false };

  revalidatePath("/dashboard/consentimientos");
  return { error: null, success: true };
}

export async function marcarConsentimientoFirmado(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("consentimientos_informados")
    .update({ firmado: true, fecha_firma: new Date().toISOString().split("T")[0] })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al marcar como firmado" };
  revalidatePath("/dashboard/consentimientos");
  return { error: null };
}

export async function eliminarConsentimiento(id) {
  const supabase = await createClient();
  const tenantId = (await supabase.rpc("get_tenant_id_for_user")).data;
  if (!tenantId) return { error: "Sin acceso" };

  const { error } = await supabase
    .from("consentimientos_informados")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) return { error: "Error al eliminar" };
  revalidatePath("/dashboard/consentimientos");
  return { error: null };
}
