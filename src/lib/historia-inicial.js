/**
 * Genera registros iniciales de historia clinica segun el rubro del tenant
 * cuando se completa la primera cita de un paciente.
 * Es idempotente: verifica si ya existe un registro antes de crear.
 */
export async function generarHistoriaInicial(supabase, tenantId, pacienteId, citaId, rubro) {
  try {
    switch (rubro) {
      case "medicina": {
        // Verificar si ya existe historia clinica
        const { data: existente } = await supabase
          .from("historias_clinicas")
          .select("id")
          .eq("paciente_id", pacienteId)
          .eq("tenant_id", tenantId)
          .limit(1)
          .maybeSingle();

        if (!existente) {
          await supabase.from("historias_clinicas").insert({
            tenant_id: tenantId,
            paciente_id: pacienteId,
            cita_id: citaId,
            fecha: new Date().toISOString().split("T")[0],
            antecedentes: "",
            alergias: [],
            medicacion_cronica: [],
            observaciones: "Historia clinica creada automaticamente en primera consulta.",
          });
        }
        break;
      }

      case "odontologia": {
        // Verificar si ya existe historia dental
        const { data: existente } = await supabase
          .from("historias_clinicas_dentales")
          .select("id")
          .eq("paciente_id", pacienteId)
          .eq("tenant_id", tenantId)
          .limit(1)
          .maybeSingle();

        if (!existente) {
          const { data: historia } = await supabase
            .from("historias_clinicas_dentales")
            .insert({
              tenant_id: tenantId,
              paciente_id: pacienteId,
              antecedentes: "",
              alergias: "",
              notas: "Historia dental creada automaticamente en primera consulta.",
            })
            .select("id")
            .single();

          // Inicializar odontograma vacio si se creo la historia
          if (historia) {
            await supabase.from("odontogramas").insert({
              tenant_id: tenantId,
              paciente_id: pacienteId,
              historia_dental_id: historia.id,
              datos: {},
              notas: "",
            });
          }
        }
        break;
      }

      case "psicologia": {
        // Verificar si ya existe nota de sesion para este paciente
        const { data: existente } = await supabase
          .from("notas_sesion")
          .select("id")
          .eq("paciente_id", pacienteId)
          .eq("tenant_id", tenantId)
          .limit(1)
          .maybeSingle();

        if (!existente) {
          await supabase.from("notas_sesion").insert({
            tenant_id: tenantId,
            paciente_id: pacienteId,
            cita_id: citaId,
            contenido: "Primera sesion del paciente.",
            estado_emocional: "neutro",
            objetivos: "",
            tecnicas_utilizadas: "",
          });
        }
        break;
      }

      case "abogados": {
        // Verificar si ya existe expediente para este cliente
        const { data: existente } = await supabase
          .from("expedientes")
          .select("id")
          .eq("paciente_id", pacienteId)
          .eq("tenant_id", tenantId)
          .limit(1)
          .maybeSingle();

        if (!existente) {
          await supabase.from("expedientes").insert({
            tenant_id: tenantId,
            paciente_id: pacienteId,
            titulo: "Nuevo expediente",
            descripcion: "Expediente creado automaticamente en primera consulta.",
            estado: "activo",
            prioridad: "media",
          });
        }
        break;
      }

      // veterinaria y contadores tienen modelos diferentes (mascotas, vencimientos)
      // que no se vinculan directamente a la primera cita
      default:
        break;
    }
  } catch (err) {
    // Fire-and-forget: no bloquear el flujo principal
    console.error("Error al generar historia clinica inicial:", err);
  }
}
