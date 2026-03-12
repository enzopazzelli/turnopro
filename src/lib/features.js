// ============================================================
// features.js — Feature flags por plan y helpers de verificación
// ============================================================

export const FEATURES_LISTA = [
  "pagina_publica",
  "recurrencia",
  "lista_espera",
  "sobreturno",
  "consulta_activa",
  "recetas",
  "firma_digital",
  "notificaciones_email",
  "notificaciones_whatsapp",
  "reportes_avanzados",
  "facturacion",
  "modulos_rubro",
  "archivos_pacientes",
  "exportar_csv",
  "multi_profesional",
  "sucursales",
  "historial_clinico",
];

export const FEATURES_LABELS = {
  pagina_publica:          "Página pública y reservas online",
  recurrencia:             "Citas recurrentes",
  lista_espera:            "Lista de espera",
  sobreturno:              "Sobreturnos / turnos extra",
  consulta_activa:         "Consulta activa (cronómetro)",
  recetas:                 "Recetas y documentos profesionales",
  firma_digital:           "Firma digital",
  notificaciones_email:    "Notificaciones por email",
  notificaciones_whatsapp: "Notificaciones por WhatsApp",
  reportes_avanzados:      "Reportes y analytics avanzados",
  facturacion:             "Facturación e historial de pagos",
  modulos_rubro:           "Módulos especializados por rubro",
  archivos_pacientes:      "Archivos adjuntos de pacientes",
  exportar_csv:            "Exportar / importar datos CSV",
  multi_profesional:       "Múltiples profesionales",
  sucursales:              "Múltiples sucursales",
  historial_clinico:       "Historia clínica completa",
};

export const LIMITES_LABELS = {
  max_profesionales: "Máx. profesionales",
  max_citas_mes:     "Máx. citas por mes",
  max_pacientes:     "Máx. pacientes",
};

// Features por plan — fallback estático (usado cuando no se carga desde DB)
export const PLAN_FEATURES_DEFAULT = {
  trial: {
    label:       "Trial",
    descripcion: "14 días gratis con funcionalidades básicas",
    precio:      0,
    features: {
      pagina_publica:          true,
      recurrencia:             false,
      lista_espera:            false,
      sobreturno:              false,
      consulta_activa:         false,
      recetas:                 false,
      firma_digital:           false,
      notificaciones_email:    false,
      notificaciones_whatsapp: false,
      reportes_avanzados:      false,
      facturacion:             false,
      modulos_rubro:           false,
      archivos_pacientes:      false,
      exportar_csv:            false,
      multi_profesional:       false,
      sucursales:              false,
      historial_clinico:       false,
    },
    limites: { max_profesionales: 1, max_citas_mes: 50, max_pacientes: 30 },
  },
  basico: {
    label:       "Básico",
    descripcion: "Para profesionales independientes",
    precio:      5000,
    features: {
      pagina_publica:          true,
      recurrencia:             true,
      lista_espera:            true,
      sobreturno:              false,
      consulta_activa:         true,
      recetas:                 false,
      firma_digital:           false,
      notificaciones_email:    true,
      notificaciones_whatsapp: false,
      reportes_avanzados:      false,
      facturacion:             true,
      modulos_rubro:           false,
      archivos_pacientes:      false,
      exportar_csv:            false,
      multi_profesional:       false,
      sucursales:              false,
      historial_clinico:       true,
    },
    limites: { max_profesionales: 1, max_citas_mes: null, max_pacientes: null },
  },
  profesional: {
    label:       "Profesional",
    descripcion: "Para consultorios con equipo",
    precio:      12000,
    features: {
      pagina_publica:          true,
      recurrencia:             true,
      lista_espera:            true,
      sobreturno:              true,
      consulta_activa:         true,
      recetas:                 true,
      firma_digital:           true,
      notificaciones_email:    true,
      notificaciones_whatsapp: true,
      reportes_avanzados:      true,
      facturacion:             true,
      modulos_rubro:           true,
      archivos_pacientes:      true,
      exportar_csv:            true,
      multi_profesional:       true,
      sucursales:              false,
      historial_clinico:       true,
    },
    limites: { max_profesionales: 5, max_citas_mes: null, max_pacientes: null },
  },
  premium: {
    label:       "Premium",
    descripcion: "Sin límites, todas las funcionalidades",
    precio:      25000,
    features: {
      pagina_publica:          true,
      recurrencia:             true,
      lista_espera:            true,
      sobreturno:              true,
      consulta_activa:         true,
      recetas:                 true,
      firma_digital:           true,
      notificaciones_email:    true,
      notificaciones_whatsapp: true,
      reportes_avanzados:      true,
      facturacion:             true,
      modulos_rubro:           true,
      archivos_pacientes:      true,
      exportar_csv:            true,
      multi_profesional:       true,
      sucursales:              true,
      historial_clinico:       true,
    },
    limites: { max_profesionales: null, max_citas_mes: null, max_pacientes: null },
  },
};

/**
 * Combina las features del plan con los overrides del tenant.
 * @param {object} tenant - { plan, features_override }
 * @param {object|null} planData - datos del plan desde DB (optional)
 */
export function getTenantFeatures(tenant, planData = null) {
  const planSlug = tenant?.plan || "trial";
  const planBase = planData || PLAN_FEATURES_DEFAULT[planSlug] || PLAN_FEATURES_DEFAULT.trial;
  const baseFeatures = planBase.features || {};
  const baseLimites  = planBase.limites  || {};

  const override         = tenant?.features_override || {};
  const overrideFeatures = override.features || {};
  const overrideLimites  = override.limites  || {};

  return {
    features: { ...baseFeatures, ...overrideFeatures },
    limites:  { ...baseLimites,  ...overrideLimites  },
  };
}

/** Verifica si un tenant tiene acceso a una feature. */
export function tenantTiene(tenant, feature, planData = null) {
  const { features } = getTenantFeatures(tenant, planData);
  return features[feature] === true;
}

/** Obtiene el límite numérico de un tenant (null = sin límite). */
export function tenantLimite(tenant, limite, planData = null) {
  const { limites } = getTenantFeatures(tenant, planData);
  const val = limites[limite];
  return val === undefined ? null : val;
}
