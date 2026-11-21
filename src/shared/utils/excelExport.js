/**
 * Exportador seguro a Excel (.xlsx) con carga diferida (dynamic import) sobre `write-excel-file`.
 * Reemplaza `xlsx` (SheetJS 0.18.5 con vulnerabilidades High sin parche — AUD-016)
 * y respeta la regla de rendimiento de no incluir librerías de exportación en el bundle inicial.
 */

function toCell(value, isHeader = false) {
  if (isHeader) {
    return {
      value: value === null || value === undefined ? "" : String(value),
      type: String,
      fontWeight: "bold",
      backgroundColor: "#F8FAFC"
    };
  }
  if (value === null || value === undefined) {
    return { value: "", type: String };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { value, type: Number };
  }
  if (typeof value === "boolean") {
    return { value: value ? "Sí" : "No", type: String };
  }
  return { value: String(value), type: String };
}

/**
 * Exporta una tabla estructurada (headers + rows) a archivo .xlsx.
 */
export async function exportTableToExcel({
  sheetName = "Datos",
  fileName = "reporte.xlsx",
  headers = [],
  rows = [],
  colWidths = []
}) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const data = [
    headers.map((h) => toCell(h, true)),
    ...rows.map((row) => row.map((cell) => toCell(cell, false)))
  ];
  const columns = (colWidths.length > 0 ? colWidths : headers.map(() => 18)).map((w) => ({
    width: Number(w) || 18
  }));
  const safeFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;

  await writeXlsxFile(data, {
    columns,
    sheet: String(sheetName).slice(0, 31)
  }).toFile(safeFileName);
}

/**
 * Exporta una matriz libre (múltiples secciones/títulos, p. ej. reportes históricos) a .xlsx.
 */
export async function exportMatrixToExcel({
  sheetName = "Reporte",
  fileName = "reporte.xlsx",
  matrix = [],
  colWidths = []
}) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const maxCols = matrix.reduce((m, r) => Math.max(m, Array.isArray(r) ? r.length : 0), 1);
  const data = matrix.map((row) => {
    const arr = Array.isArray(row) ? row : [];
    const padded = Array.from({ length: maxCols }, (_, idx) => arr[idx] ?? "");
    return padded.map((cell) => toCell(cell, false));
  });
  const columns = Array.from({ length: maxCols }, (_, idx) => ({
    width: Number(colWidths[idx]) || 22
  }));
  const safeFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;

  await writeXlsxFile(data, {
    columns,
    sheet: String(sheetName).slice(0, 31)
  }).toFile(safeFileName);
}
