/**
 * Exporta un array de objetos a un archivo CSV con BOM UTF-8 para compatibilidad con Excel.
 * @param {Object[]} datos - Array de objetos a exportar
 * @param {string[]} columnas - Claves de los objetos a incluir como columnas
 * @param {string[]} encabezados - Nombres de los encabezados en el CSV
 * @param {string} nombreArchivo - Nombre del archivo (sin extension)
 */
export function exportarCSV(datos, columnas, encabezados, nombreArchivo) {
  if (!datos || datos.length === 0) return;

  const BOM = "\uFEFF";
  const separador = ",";

  const escapar = (valor) => {
    const str = String(valor ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lineas = [
    encabezados.map(escapar).join(separador),
    ...datos.map((fila) =>
      columnas.map((col) => escapar(fila[col])).join(separador)
    ),
  ];

  const contenido = BOM + lineas.join("\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${nombreArchivo}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
