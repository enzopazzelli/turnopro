import * as XLSX from "xlsx";

/**
 * Exporta un array de objetos a un archivo XLSX.
 * @param {Object[]} datos - Array de objetos a exportar
 * @param {string[]} columnas - Claves de los objetos a incluir como columnas
 * @param {string[]} encabezados - Nombres de los encabezados
 * @param {string} nombreArchivo - Nombre del archivo (sin extension)
 */
export function exportarXLSX(datos, columnas, encabezados, nombreArchivo) {
  if (!datos || datos.length === 0) return;

  // Construir array de arrays: encabezados + filas
  const filas = datos.map((fila) =>
    columnas.map((col) => fila[col] ?? "")
  );
  const aoa = [encabezados, ...filas];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-size columnas
  const anchos = encabezados.map((enc, i) => {
    const maxContenido = filas.reduce((max, fila) => {
      const largo = String(fila[i] ?? "").length;
      return largo > max ? largo : max;
    }, enc.length);
    return { wch: Math.min(maxContenido + 2, 50) };
  });
  ws["!cols"] = anchos;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}
