// Permisos por rol
// profesional: acceso completo
// secretaria: solo agenda, pacientes (ver/crear/editar), facturacion (cobrar), lista de espera

const PERMISOS = {
  profesional: {
    dashboard: true,
    agenda: true,
    pacientes: true,
    pacientes_eliminar: true,
    servicios: true,
    horarios: true,
    lista_espera: true,
    facturacion: true,
    reportes: true,
    configuracion: true,
    modulos_rubro: true,
  },
  secretaria: {
    dashboard: true,
    agenda: true,
    pacientes: true,
    pacientes_eliminar: false,
    servicios: false,
    horarios: false,
    lista_espera: true,
    facturacion: true,
    reportes: false,
    configuracion: false,
    modulos_rubro: false,
  },
};

export function tienePermiso(rol, permiso) {
  return PERMISOS[rol]?.[permiso] ?? false;
}

// Mapeo de rutas del sidebar a permisos
const RUTA_A_PERMISO = {
  "/dashboard": "dashboard",
  "/dashboard/agenda": "agenda",
  "/dashboard/pacientes": "pacientes",
  "/dashboard/servicios": "servicios",
  "/dashboard/horarios": "horarios",
  "/dashboard/lista-espera": "lista_espera",
  "/dashboard/facturacion": "facturacion",
  "/dashboard/reportes": "reportes",
  "/dashboard/configuracion": "configuracion",
};

export function tienePermisoRuta(rol, ruta) {
  const permiso = RUTA_A_PERMISO[ruta];
  if (!permiso) return true; // rutas no mapeadas son accesibles
  return tienePermiso(rol, permiso);
}

export { PERMISOS };
