/**
 * Motor corporativo de exportación a Excel (.xlsx) para Chazin Food.
 * - Carga diferida (dynamic import) de `write-excel-file/browser` (sin peso en el bundle inicial).
 * - Encabezado corporativo con logo embebido (PNG vía canvas), NIT, dirección, fecha y filtros.
 * - Tarjetas KPI ejecutivas, zebra striping, bordes limpios, badges semánticos por estado,
 *   formatos numéricos/moneda COP (`$#,##0`), texto protegido (`@`) para documentos/teléfonos,
 *   fila de totales con fórmulas reales de Excel (`=SUM(...)`), paneles inmovilizados y multi-hoja.
 */

import logoImg from "@/shared/assets/logo_optimized.webp";

export const EXCEL_BRAND = {
  name: "CHAZIN FOOD",
  nit: "NIT: 901.458.789-2",
  address: "Cl. 21 #80-21, Belén, Medellín",
  footerNote:
    "Chazin Food · Reporte generado automáticamente · Cifras monetarias en pesos colombianos (COP)."
};

const COLORS = {
  brandDark: "#1E293B",
  brandAccent: "#C84545",
  brandSoft: "#FEF2F2",
  brandText: "#991B1B",
  white: "#FFFFFF",
  zebra: "#F8FAFC",
  subtleBg: "#F1F5F9",
  border: "#CBD5E1",
  borderLight: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  // Semánticos
  greenBg: "#DCFCE7",
  greenText: "#166534",
  greenAccent: "#16A34A",
  redBg: "#FEE2E2",
  redText: "#991B1B",
  redAccent: "#DC2626",
  amberBg: "#FEF3C7",
  amberText: "#92400E",
  amberAccent: "#D97706",
  blueBg: "#DBEAFE",
  blueText: "#1E40AF",
  blueAccent: "#2563EB",
  purpleBg: "#F3E8FF",
  purpleText: "#6B21A8",
  purpleAccent: "#7C3AED"
};

export const EXCEL_FORMATS = {
  currency: "$#,##0;-$#,##0;$0",
  integer: "#,##0",
  decimal: "#,##0.00",
  percent: "0.0%",
  text: "@"
};

let cachedLogoPngBlob = null;
let logoLoadAttempted = false;

/**
 * Convierte el logo corporativo (.webp) a PNG Blob en navegador para incrustarlo
 * de forma nativa y compatible con Microsoft Excel, LibreOffice y Google Sheets.
 */
async function getBrandLogoImageSpec() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  if (!logoLoadAttempted) {
    logoLoadAttempted = true;
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = "anonymous";
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = logoImg;
      });
      const size = 112;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);
        const ratio = Math.min((size - 12) / img.naturalWidth, (size - 12) / img.naturalHeight);
        const w = img.naturalWidth * ratio;
        const h = img.naturalHeight * ratio;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        cachedLogoPngBlob = await new Promise((resolve) =>
          canvas.toBlob((blob) => resolve(blob), "image/png")
        );
      }
    } catch {
      cachedLogoPngBlob = null;
    }
  }

  if (!cachedLogoPngBlob) return null;
  return {
    content: cachedLogoPngBlob,
    contentType: "image/png",
    width: 58,
    height: 58,
    dpi: 96,
    anchor: { row: 1, column: 1 },
    offsetX: 14,
    offsetY: 16,
    title: "Logo Chazin Food",
    description: "Logotipo oficial de Chazin Food"
  };
}

/**
 * Feature OOXML que inyecta el valor precalculado `<v>...</v>` dentro de cada celda de fórmula `<f>...</f>`.
 * Esto garantiza que Microsoft Excel en "Vista Protegida" (archivos descargados de internet)
 * muestre inmediatamente los totales calculados, conservando la fórmula dinámica viva al habilitar edición.
 */
export function createCachedFormulaValuesFeature() {
  return {
    files: {
      transform: {
        "xl/worksheets/sheet{id}.xml": {
          transform(xml, sheetOptions) {
            const cache = sheetOptions?.cachedFormulaValues;
            if (!cache || typeof cache !== "object") return xml;
            let updated = xml;
            for (const [cellRef, numVal] of Object.entries(cache)) {
              if (typeof numVal !== "number" || !Number.isFinite(numVal)) continue;
              const safeVal = Math.round(numVal * 1e6) / 1e6;
              const pattern = new RegExp(`(<c r="${cellRef}"[^>]*><f>[^<]+</f>)</c>`);
              updated = updated.replace(pattern, `$1<v>${safeVal}</v></c>`);
            }
            return updated;
          }
        }
      }
    }
  };
}

const CACHED_FORMULA_FEATURE = createCachedFormulaValuesFeature();

function extractNumericValue(raw) {
  const val = raw && typeof raw === "object" && !(raw instanceof Date) && "value" in raw ? raw.value : raw;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  return null;
}

function isNonEmptyCellValue(raw) {
  const val = raw && typeof raw === "object" && !(raw instanceof Date) && "value" in raw ? raw.value : raw;
  return val !== null && val !== undefined && String(val).trim() !== "";
}

/**
 * Estima cuántas líneas ocupará un texto con ajuste de línea (word-wrap) dentro de un ancho dado en caracteres.
 */
function estimateWrappedLines(text, maxCharsPerLine) {
  const safeMax = Math.max(8, Math.floor(maxCharsPerLine));
  const paragraphs = String(text ?? "").split(/\r?\n/);
  let totalLines = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      totalLines += 1;
      continue;
    }
    const words = trimmed.split(/\s+/);
    let currentLen = 0;
    let linesInPara = 1;

    for (const word of words) {
      if (word.length > safeMax) {
        if (currentLen > 0) {
          linesInPara += 1;
          currentLen = 0;
        }
        linesInPara += Math.ceil(word.length / safeMax) - 1;
        currentLen = word.length % safeMax || safeMax;
      } else if (currentLen === 0) {
        currentLen = word.length;
      } else if (currentLen + 1 + word.length <= safeMax) {
        currentLen += 1 + word.length;
      } else {
        linesInPara += 1;
        currentLen = word.length;
      }
    }
    totalLines += linesInPara;
  }

  return Math.max(1, totalLines);
}

/**
 * Calcula la altura óptima de cada fila de una hoja en función de los anchos reales de columna,
 * asegurando que ningún texto envuelto (wrap) o encabezado largo se corte verticalmente en Excel.
 */
function applyDynamicRowHeights(sheetRows = [], columns = []) {
  for (let r = 0; r < sheetRows.length; r++) {
    const row = sheetRows[r];
    if (!Array.isArray(row)) continue;

    let maxHeight = 0;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell || typeof cell !== "object") continue;
      if (typeof cell.height === "number" && cell.height > maxHeight) {
        maxHeight = cell.height;
      }

      if (cell.rowSpan && cell.rowSpan > 1) continue;
      if (typeof cell.value !== "string" || !cell.value.trim()) continue;
      if (!cell.wrap && !cell.value.includes("\n")) continue;

      const span = Math.max(1, Number(cell.columnSpan) || 1);
      let availWidth = 0;
      for (let k = c; k < Math.min(columns.length, c + span); k++) {
        availWidth += Number(columns[k]?.width) || 16;
      }

      const fontSize = Number(cell.fontSize) || 10;
      const isBold = cell.fontWeight === "bold";
      const indentChars = (Number(cell.indent) || 0) * 2.2;
      const fontScale = 10 / fontSize;
      const boldScale = isBold ? 0.86 : 0.94;
      const effectiveChars = Math.max(8, (availWidth - 2.5 - indentChars) * fontScale * boldScale);

      const lines = estimateWrappedLines(cell.value, effectiveChars);
      if (lines > 1) {
        const linePt = fontSize * 1.48;
        const neededHeight = Math.ceil(lines * linePt + 9);
        if (neededHeight > maxHeight) {
          maxHeight = neededHeight;
        }
      }
    }

    if (maxHeight > 0) {
      const targetCell = row.find((cell) => cell && typeof cell === "object" && !(cell.rowSpan > 1));
      if (targetCell) {
        targetCell.height = Math.max(Number(targetCell.height) || 0, maxHeight);
      }
    }
  }
}

/**
 * Estima la longitud visual de una celda (considerando formatos de moneda/porcentaje y negrita).
 */
function measureDisplayLength(rawCell, colType = "text") {
  const isObj = rawCell && typeof rawCell === "object" && !(rawCell instanceof Date) && "value" in rawCell;
  const val = isObj ? rawCell.value : rawCell;
  const isBold = isObj && rawCell.fontWeight === "bold";
  const fmt = isObj ? rawCell.format : undefined;
  const boldMult = isBold ? 1.14 : 1.04;

  if (val === null || val === undefined || val === "") return 4;

  if (typeof val === "number" && Number.isFinite(val)) {
    if (colType === "currency" || (fmt && String(fmt).includes("$"))) {
      const formatted = `${val < 0 ? "-" : ""}$${Math.abs(Math.round(val)).toLocaleString("es-CO")}`;
      return Math.ceil((formatted.length + 3) * boldMult);
    }
    if (colType === "percent" || (fmt && String(fmt).includes("%"))) {
      return 10;
    }
    return Math.ceil((Math.round(val).toLocaleString("es-CO").length + 3) * boldMult);
  }

  const str = String(val);
  const longestLine = str.split(/\r?\n/).reduce((m, line) => Math.max(m, line.length), 0);
  return Math.ceil((longestLine + 4) * boldMult);
}

/**
 * Convierte índice de columna base 0 a letra de Excel (0 -> A, 25 -> Z, 26 -> AA).
 */
export function columnIndexToLetter(index) {
  let col = "";
  let n = Number(index) + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

function sanitizeSheetName(name, fallback = "Reporte") {
  const clean = String(name || fallback)
    .replace(/[\\/?*[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (clean || fallback).slice(0, 31);
}

function getNowColombiaFormatted() {
  try {
    return new Date().toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return new Date().toLocaleString("es-CO");
  }
}

function getStatusColors(rawVal) {
  const s = String(rawVal || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!s || s === "-" || s === "—" || s === "n/a") return null;

  if (
    s === "activo" ||
    s === "completada" ||
    s === "completado" ||
    s === "entregado" ||
    s === "realizado" ||
    s === "aprobado" ||
    s === "pagado" ||
    s === "si" ||
    s === "controlado" ||
    s === "disponible" ||
    s === "optimo"
  ) {
    return { bg: COLORS.greenBg, text: COLORS.greenText };
  }

  if (
    s === "inactivo" ||
    s === "anulada" ||
    s === "anulado" ||
    s === "cancelado" ||
    s === "cancelada" ||
    s === "rechazado" ||
    s === "agotado" ||
    s === "no valido" ||
    s === "vencido" ||
    s === "critico" ||
    s === "stock critico" ||
    s === "no"
  ) {
    return { bg: COLORS.redBg, text: COLORS.redText };
  }

  if (
    s.includes("pendiente") ||
    s.includes("preparacion") ||
    s.includes("cola") ||
    s.includes("incapacitado") ||
    s.includes("bajo") ||
    s.includes("validacion") ||
    s.includes("sin control") ||
    s.includes("aprobar")
  ) {
    return { bg: COLORS.amberBg, text: COLORS.amberText };
  }

  if (
    s.includes("listo") ||
    s.includes("despachado") ||
    s.includes("camino") ||
    s.includes("wompi") ||
    s.includes("domicilio") ||
    s.includes("preparado") ||
    s.includes("indefinido")
  ) {
    return { bg: COLORS.blueBg, text: COLORS.blueText };
  }

  if (s.includes("administrador") || s.includes("reposicion") || s.includes("adicion")) {
    return { bg: COLORS.purpleBg, text: COLORS.purpleText };
  }

  return null;
}

function inferColumnType(headerLabel = "") {
  const h = String(headerLabel || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    h.includes("cop") ||
    h.includes("precio") ||
    h.includes("costo") ||
    h.includes("subtotal") ||
    h.includes("total") ||
    h.includes("reembolso") ||
    h.includes("venta bruta") ||
    h.includes("venta neta") ||
    h.includes("ingreso") ||
    h.includes("salario") ||
    h.includes("monto") ||
    h.includes("valor")
  ) {
    return "currency";
  }
  if (h.includes("%") || h.includes("porcentaje") || h.includes("descuento")) {
    return "percent";
  }
  if (
    h === "estado" ||
    h.startsWith("estado ") ||
    h.includes("es adicion") ||
    h.includes("control stock") ||
    h.includes("alerta")
  ) {
    return "status";
  }
  if (
    h.includes("documento") ||
    h.includes("cedula") ||
    h.includes("nit") ||
    h.includes("telefono") ||
    h.includes("celular") ||
    h.includes("factura") ||
    h.includes("codigo") ||
    h === "id"
  ) {
    return "textId";
  }
  if (h.includes("fecha") || h.includes("horario") || h.includes("hora")) {
    return "date";
  }
  if (
    h.includes("stock") ||
    h.includes("unidades") ||
    h.includes("und.") ||
    h.includes("cantidad") ||
    h.includes("n° ") ||
    h.includes("n.°")
  ) {
    return "integer";
  }
  return "text";
}

function makeSpacerRow(colCount, height = 8) {
  return Array.from({ length: colCount }, (_, idx) => (idx === 0 ? { value: "", height } : null));
}

function makeMergedBannerRow(text, colCount, style = {}, startCol = 0) {
  const row = Array.from({ length: colCount }, () => null);
  const span = Math.max(1, colCount - startCol);
  row[startCol] = {
    value: text,
    type: String,
    columnSpan: span,
    ...style
  };
  return row;
}

/**
 * Construye el encabezado corporativo de 3 filas con espacio para el logotipo en A1:A3.
 */
function buildCorporateHeaderRows({
  title,
  subtitle = "",
  filtersText = "",
  generatedAt = getNowColombiaFormatted(),
  colCount = 6,
  hasLogo = false
}) {
  const safeCols = Math.max(2, colCount);
  const textStartCol = hasLogo ? 1 : 0;
  const textSpan = safeCols - textStartCol;

  const row1 = Array.from({ length: safeCols }, () => null);
  const row2 = Array.from({ length: safeCols }, () => null);
  const row3 = Array.from({ length: safeCols }, () => null);

  if (hasLogo) {
    row1[0] = {
      value: "",
      type: String,
      rowSpan: 3,
      backgroundColor: COLORS.white,
      borderColor: COLORS.brandDark,
      borderStyle: "thin",
      bottomBorderColor: COLORS.brandAccent,
      bottomBorderStyle: "medium",
      align: "center",
      alignVertical: "center"
    };
  }

  row1[textStartCol] = {
    value: `${EXCEL_BRAND.name}  |  ${String(title || "REPORTE CORPORATIVO").toUpperCase()}`,
    type: String,
    columnSpan: textSpan,
    height: 30,
    fontSize: 12.5,
    fontWeight: "bold",
    textColor: COLORS.white,
    backgroundColor: COLORS.brandDark,
    align: "left",
    alignVertical: "center",
    indent: 1,
    wrap: true
  };

  row2[textStartCol] = {
    value: `${EXCEL_BRAND.nit}  ·  ${EXCEL_BRAND.address}${subtitle ? `  ·  ${subtitle}` : ""}`,
    type: String,
    columnSpan: textSpan,
    height: 22,
    fontSize: 9.5,
    textColor: "#E2E8F0",
    backgroundColor: COLORS.brandDark,
    align: "left",
    alignVertical: "center",
    indent: 1,
    wrap: true
  };

  const metaLine = filtersText
    ? `Generado: ${generatedAt}   |   Filtros: ${filtersText}`
    : `Generado: ${generatedAt}   |   Sistema de Gestión Chazin Food`;

  row3[textStartCol] = {
    value: metaLine,
    type: String,
    columnSpan: textSpan,
    height: 23,
    fontSize: 9,
    fontStyle: "italic",
    textColor: COLORS.textSecondary,
    backgroundColor: COLORS.zebra,
    bottomBorderColor: COLORS.brandAccent,
    bottomBorderStyle: "medium",
    align: "left",
    alignVertical: "center",
    indent: 1,
    wrap: true
  };

  return [row1, row2, row3];
}

/**
 * Construye una franja horizontal de tarjetas KPI ejecutivas distribuidas a lo largo de las columnas.
 */
function buildKpiRows(kpis = [], colCount = 6) {
  if (!Array.isArray(kpis) || kpis.length === 0) return [];
  const visible = kpis.slice(0, Math.min(kpis.length, colCount));
  const labelRow = Array.from({ length: colCount }, () => null);
  const valueRow = Array.from({ length: colCount }, () => null);

  const baseSpan = Math.floor(colCount / visible.length);
  let remainder = colCount % visible.length;
  let cursor = 0;

  const toneMap = {
    emerald: { accent: COLORS.greenAccent, bg: "#F0FDF4", text: COLORS.greenText },
    green: { accent: COLORS.greenAccent, bg: "#F0FDF4", text: COLORS.greenText },
    rose: { accent: COLORS.redAccent, bg: "#FEF2F2", text: COLORS.redText },
    red: { accent: COLORS.redAccent, bg: "#FEF2F2", text: COLORS.redText },
    amber: { accent: COLORS.amberAccent, bg: "#FFFBEB", text: COLORS.amberText },
    blue: { accent: COLORS.blueAccent, bg: "#EFF6FF", text: COLORS.blueText },
    purple: { accent: COLORS.purpleAccent, bg: "#FAF5FF", text: COLORS.purpleText },
    slate: { accent: COLORS.brandDark, bg: COLORS.zebra, text: COLORS.textPrimary }
  };

  for (const kpi of visible) {
    const span = baseSpan + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    const palette = toneMap[kpi.tone] || toneMap.slate;

    labelRow[cursor] = {
      value: String(kpi.label || "").toUpperCase(),
      type: String,
      columnSpan: span,
      height: 22,
      fontSize: 8.5,
      fontWeight: "bold",
      textColor: COLORS.textMuted,
      backgroundColor: palette.bg,
      topBorderColor: palette.accent,
      topBorderStyle: "medium",
      leftBorderColor: COLORS.borderLight,
      leftBorderStyle: "thin",
      rightBorderColor: COLORS.borderLight,
      rightBorderStyle: "thin",
      align: "center",
      alignVertical: "center",
      wrap: true
    };

    const isNum = typeof kpi.value === "number" && Number.isFinite(kpi.value);
    const valFormat =
      kpi.format === "currency"
        ? EXCEL_FORMATS.currency
        : kpi.format === "integer"
        ? EXCEL_FORMATS.integer
        : kpi.format === "percent"
        ? EXCEL_FORMATS.percent
        : kpi.format || undefined;

    valueRow[cursor] = {
      value: isNum ? kpi.value : String(kpi.value ?? "—"),
      type: isNum ? Number : String,
      ...(isNum && valFormat ? { format: valFormat } : {}),
      columnSpan: span,
      height: 26,
      fontSize: 12,
      fontWeight: "bold",
      textColor: palette.text,
      backgroundColor: palette.bg,
      bottomBorderColor: COLORS.border,
      bottomBorderStyle: "thin",
      leftBorderColor: COLORS.borderLight,
      leftBorderStyle: "thin",
      rightBorderColor: COLORS.borderLight,
      rightBorderStyle: "thin",
      align: "center",
      alignVertical: "center"
    };

    cursor += span;
  }

  return [labelRow, valueRow];
}

function buildDataCell(rawValue, colType, rowIdx, customStyle = {}) {
  const isAlt = rowIdx % 2 === 1;
  const baseBg = isAlt ? COLORS.zebra : COLORS.white;

  // Permitir celda ya enriquecida `{ value, ... }`
  if (rawValue && typeof rawValue === "object" && !(rawValue instanceof Date) && "value" in rawValue) {
    const innerVal = rawValue.value;
    const isNum = typeof innerVal === "number" && Number.isFinite(innerVal);
    const inferredType = rawValue.type || (isNum ? Number : String);
    const defaultFmt =
      inferredType === Number
        ? colType === "currency"
          ? EXCEL_FORMATS.currency
          : colType === "decimal"
          ? EXCEL_FORMATS.decimal
          : colType === "percent"
          ? EXCEL_FORMATS.percent
          : EXCEL_FORMATS.integer
        : colType === "textId"
        ? EXCEL_FORMATS.text
        : undefined;
    const resolvedFormat =
      rawValue.format !== undefined
        ? rawValue.format
        : defaultFmt;
    const safeFormat =
      inferredType === String && resolvedFormat && resolvedFormat !== "@"
        ? undefined
        : resolvedFormat;

    const effectiveAlign = rawValue.align || (isNum ? "right" : "left");
    return {
      alignVertical: "center",
      borderColor: COLORS.borderLight,
      borderStyle: "thin",
      backgroundColor: baseBg,
      textColor: COLORS.textPrimary,
      fontSize: 10,
      align: effectiveAlign,
      ...(inferredType === String && effectiveAlign === "left" ? { indent: 1, wrap: true } : {}),
      ...rawValue,
      ...customStyle,
      type: inferredType,
      ...(safeFormat ? { format: safeFormat } : { format: undefined })
    };
  }

  const base = {
    alignVertical: "center",
    borderColor: COLORS.borderLight,
    borderStyle: "thin",
    backgroundColor: baseBg,
    textColor: COLORS.textPrimary,
    fontSize: 10,
    ...customStyle
  };

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return { ...base, value: "—", type: String, align: colType === "text" ? "left" : "center", textColor: COLORS.textMuted };
  }

  if (colType === "currency") {
    const num = typeof rawValue === "number" ? rawValue : Number(String(rawValue).replace(/[^\d.-]/g, ""));
    if (Number.isFinite(num)) {
      return {
        ...base,
        value: num,
        type: Number,
        format: EXCEL_FORMATS.currency,
        align: "right",
        ...(num < 0 ? { textColor: COLORS.redText, fontWeight: "bold" } : {})
      };
    }
  }

  if (colType === "integer" || colType === "decimal") {
    const num = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (typeof rawValue === "number" && Number.isFinite(num)) {
      return {
        ...base,
        value: num,
        type: Number,
        format: colType === "decimal" ? EXCEL_FORMATS.decimal : EXCEL_FORMATS.integer,
        align: "right"
      };
    }
  }

  if (colType === "percent") {
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      const normalized = rawValue > 1 ? rawValue / 100 : rawValue;
      return {
        ...base,
        value: normalized,
        type: Number,
        format: EXCEL_FORMATS.percent,
        align: "right"
      };
    }
    return { ...base, value: String(rawValue), type: String, align: "center", fontWeight: "bold" };
  }

  if (colType === "status") {
    const label = typeof rawValue === "boolean" ? (rawValue ? "Sí" : "No") : String(rawValue);
    const tone = getStatusColors(label);
    return {
      ...base,
      value: label,
      type: String,
      align: "center",
      fontWeight: "bold",
      ...(tone ? { backgroundColor: tone.bg, textColor: tone.text } : {})
    };
  }

  if (colType === "textId") {
    return {
      ...base,
      value: String(rawValue),
      type: String,
      format: EXCEL_FORMATS.text,
      align: "center"
    };
  }

  if (colType === "date") {
    return { ...base, value: String(rawValue), type: String, align: "center" };
  }

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return { ...base, value: rawValue, type: Number, format: EXCEL_FORMATS.integer, align: "right" };
  }

  if (typeof rawValue === "boolean") {
    const label = rawValue ? "Sí" : "No";
    const tone = getStatusColors(label);
    return {
      ...base,
      value: label,
      type: String,
      align: "center",
      fontWeight: "bold",
      ...(tone ? { backgroundColor: tone.bg, textColor: tone.text } : {})
    };
  }

  return {
    ...base,
    value: String(rawValue),
    type: String,
    align: "left",
    indent: 1,
    wrap: true
  };
}

function computeAutoWidths(headers = [], rows = [], colWidths = [], columnTypes = [], minCol0Width = 0) {
  const colCount = headers.length;
  return Array.from({ length: colCount }, (_, idx) => {
    const explicit = Number(colWidths[idx]);
    const headerLen = Math.ceil((String(headers[idx] || "").length + 4) * 1.12);
    let measured = headerLen;
    for (let r = 0; r < Math.min(rows.length, 300); r++) {
      const len = measureDisplayLength(rows[r]?.[idx], columnTypes[idx]);
      if (len > measured) measured = len;
    }
    const clampedMeasured = Math.min(48, Math.max(12, measured));
    const baseWidth = explicit > 0 ? Math.max(explicit, Math.min(clampedMeasured, explicit + 14)) : clampedMeasured;
    const finalWidth = idx === 0 && minCol0Width > 0 ? Math.max(baseWidth, minCol0Width) : baseWidth;
    return { width: Math.round(finalWidth) };
  });
}

function ensureBannerMinimumWidth(columns = [], hasLogo = false, title = "") {
  const startCol = hasLogo ? 1 : 0;
  if (columns.length <= startCol) return columns;
  const fullTitle = `${EXCEL_BRAND.name}  |  ${String(title || "").toUpperCase()}`;
  const needed = Math.min(118, Math.ceil(fullTitle.length * 1.24 + 5));
  const currentSpanWidth = columns.slice(startCol).reduce((sum, c) => sum + (Number(c.width) || 16), 0);
  if (currentSpanWidth >= needed) return columns;

  const deficit = needed - currentSpanWidth;
  const spanCount = columns.length - startCol;
  const extraPerCol = Math.ceil(deficit / spanCount);
  return columns.map((c, idx) =>
    idx >= startCol ? { width: Math.min(50, (Number(c.width) || 16) + extraPerCol) } : c
  );
}

/**
 * Construye el objeto completo de una hoja estilizada de tabla corporativa,
 * listo para ser usado por `exportTableToExcel` o `exportWorkbookToExcel`.
 */
export function buildStyledTableSheet({
  sheetName = "Datos",
  title = "",
  subtitle = "",
  filtersText = "",
  kpis = [],
  sectionTitle = "",
  headers = [],
  rows = [],
  colWidths = [],
  columnTypes = [],
  totals = null, // { [colIndex]: 'sum' | 'avg' | 'count' | { label } | { value, format } }
  orientation = "landscape",
  logoImage = null,
  freezeHeader = true
}) {
  const colCount = Math.max(headers.length, 2);
  const resolvedTypes = headers.map((h, idx) => columnTypes[idx] || inferColumnType(h));
  const sheetRows = [];
  const hasLogo = Boolean(logoImage);

  // 1. Encabezado corporativo (3 filas)
  const headerBanner = buildCorporateHeaderRows({
    title: title || sheetName,
    subtitle,
    filtersText,
    colCount,
    hasLogo
  });
  sheetRows.push(...headerBanner);
  sheetRows.push(makeSpacerRow(colCount, 8));

  // 2. Franja de KPIs ejecutivos (opcional)
  if (Array.isArray(kpis) && kpis.length > 0) {
    sheetRows.push(...buildKpiRows(kpis, colCount));
    sheetRows.push(makeSpacerRow(colCount, 10));
  }

  // 3. Título de sección (opcional)
  if (sectionTitle) {
    sheetRows.push(
      makeMergedBannerRow(String(sectionTitle).toUpperCase(), colCount, {
        height: 22,
        fontSize: 10,
        fontWeight: "bold",
        textColor: COLORS.brandText,
        backgroundColor: COLORS.brandSoft,
        leftBorderColor: COLORS.brandAccent,
        leftBorderStyle: "thick",
        bottomBorderColor: "#FECACA",
        bottomBorderStyle: "thin",
        align: "left",
        alignVertical: "center",
        indent: 1
      })
    );
  }

  // 4. Fila de encabezados de columna
  const tableHeaderRowNumber = sheetRows.length + 1; // 1-based Excel row
  sheetRows.push(
    headers.map((h, idx) => ({
      value: String(h ?? ""),
      type: String,
      height: 28,
      fontSize: 10,
      fontWeight: "bold",
      textColor: COLORS.white,
      backgroundColor: COLORS.brandDark,
      bottomBorderColor: COLORS.brandAccent,
      bottomBorderStyle: "medium",
      leftBorderColor: "#334155",
      leftBorderStyle: "thin",
      rightBorderColor: "#334155",
      rightBorderStyle: "thin",
      align:
        resolvedTypes[idx] === "currency" ||
        resolvedTypes[idx] === "integer" ||
        resolvedTypes[idx] === "decimal" ||
        resolvedTypes[idx] === "percent"
          ? "right"
          : resolvedTypes[idx] === "text"
          ? "left"
          : "center",
      alignVertical: "center",
      wrap: true
    }))
  );

  // 5. Filas de datos
  const dataStartExcelRow = sheetRows.length + 1; // 1-based
  if (rows.length === 0) {
    sheetRows.push(
      makeMergedBannerRow("Sin registros para los filtros seleccionados", colCount, {
        height: 24,
        fontSize: 10,
        fontStyle: "italic",
        textColor: COLORS.textMuted,
        backgroundColor: COLORS.white,
        borderColor: COLORS.borderLight,
        borderStyle: "thin",
        align: "center",
        alignVertical: "center"
      })
    );
  } else {
    rows.forEach((row, rIdx) => {
      const styledRow = headers.map((_, cIdx) => {
        const cell = buildDataCell(row?.[cIdx], resolvedTypes[cIdx], rIdx);
        if (cIdx === 0) cell.height = 21;
        return cell;
      });
      sheetRows.push(styledRow);
    });
  }
  const dataEndExcelRow = sheetRows.length; // 1-based

  // 6. Fila de Totales con fórmulas reales de Excel (SUM / AVERAGE / COUNTA) + caché para Vista Protegida
  const cachedFormulaValues = {};
  if (totals && rows.length > 0) {
    const totalsExcelRow = sheetRows.length + 1;
    const totalsRow = headers.map((_, cIdx) => {
      const spec = totals[cIdx];
      const baseTotalStyle = {
        height: 26,
        fontSize: 10.5,
        fontWeight: "bold",
        textColor: COLORS.textPrimary,
        backgroundColor: COLORS.subtleBg,
        topBorderColor: COLORS.brandDark,
        topBorderStyle: "medium",
        bottomBorderColor: COLORS.brandDark,
        bottomBorderStyle: "double",
        leftBorderColor: COLORS.borderLight,
        leftBorderStyle: "thin",
        rightBorderColor: COLORS.borderLight,
        rightBorderStyle: "thin",
        alignVertical: "center"
      };

      if (!spec) {
        return { ...baseTotalStyle, value: "", type: String };
      }

      const colLetter = columnIndexToLetter(cIdx);
      const cellRef = `${colLetter}${totalsExcelRow}`;
      const colType = resolvedTypes[cIdx];
      const numFormat =
        colType === "currency"
          ? EXCEL_FORMATS.currency
          : colType === "decimal"
          ? EXCEL_FORMATS.decimal
          : colType === "percent"
          ? EXCEL_FORMATS.percent
          : EXCEL_FORMATS.integer;

      if (spec === "sum") {
        const computedSum = rows.reduce((acc, r) => acc + (extractNumericValue(r?.[cIdx]) ?? 0), 0);
        cachedFormulaValues[cellRef] = computedSum;
        return {
          ...baseTotalStyle,
          value: `SUM(${colLetter}${dataStartExcelRow}:${colLetter}${dataEndExcelRow})`,
          type: "Formula",
          format: numFormat,
          align: "right"
        };
      }
      if (spec === "avg") {
        const nums = rows.map((r) => extractNumericValue(r?.[cIdx])).filter((n) => n !== null);
        cachedFormulaValues[cellRef] = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        return {
          ...baseTotalStyle,
          value: `AVERAGE(${colLetter}${dataStartExcelRow}:${colLetter}${dataEndExcelRow})`,
          type: "Formula",
          format: numFormat,
          align: "right"
        };
      }
      if (spec === "count") {
        cachedFormulaValues[cellRef] = rows.filter((r) => isNonEmptyCellValue(r?.[cIdx])).length;
        return {
          ...baseTotalStyle,
          value: `COUNTA(${colLetter}${dataStartExcelRow}:${colLetter}${dataEndExcelRow})`,
          type: "Formula",
          format: EXCEL_FORMATS.integer,
          align: "center"
        };
      }
      if (typeof spec === "string") {
        return { ...baseTotalStyle, value: spec, type: String, align: cIdx === 0 ? "left" : "center", ...(cIdx === 0 ? { indent: 1 } : {}) };
      }
      if (typeof spec === "object") {
        const isFormula = typeof spec.formula === "string";
        const isNumber = typeof spec.value === "number" && Number.isFinite(spec.value);
        if (isFormula && typeof spec.cachedValue === "number" && Number.isFinite(spec.cachedValue)) {
          cachedFormulaValues[cellRef] = spec.cachedValue;
        }
        return {
          ...baseTotalStyle,
          value: isFormula ? spec.formula.replace(/^=/, "") : (spec.label ?? spec.value ?? ""),
          type: isFormula ? "Formula" : isNumber ? Number : String,
          ...(spec.format ? { format: spec.format } : isFormula || isNumber ? { format: numFormat } : {}),
          align: spec.align || (isFormula || isNumber ? "right" : cIdx === 0 ? "left" : "center"),
          ...(spec.textColor ? { textColor: spec.textColor } : {})
        };
      }
      return { ...baseTotalStyle, value: "", type: String };
    });
    sheetRows.push(totalsRow);
  }

  // 7. Pie de página corporativo
  sheetRows.push(makeSpacerRow(colCount, 8));
  sheetRows.push(
    makeMergedBannerRow(EXCEL_BRAND.footerNote, colCount, {
      height: 20,
      fontSize: 8.5,
      fontStyle: "italic",
      textColor: COLORS.textMuted,
      align: "left",
      alignVertical: "center",
      indent: 1,
      wrap: true
    })
  );

  const rawColumns = computeAutoWidths(headers, rows, colWidths, resolvedTypes, hasLogo ? 15 : 0);
  const columns = ensureBannerMinimumWidth(rawColumns, hasLogo, title || sheetName);
  applyDynamicRowHeights(sheetRows, columns);

  return {
    data: sheetRows,
    sheet: sanitizeSheetName(sheetName),
    columns,
    ...(orientation ? { orientation } : {}),
    ...(freezeHeader ? { stickyRowsCount: tableHeaderRowNumber } : {}),
    ...(logoImage ? { images: [logoImage] } : {}),
    ...(Object.keys(cachedFormulaValues).length > 0 ? { cachedFormulaValues } : {})
  };
}

/**
 * Construye una hoja compuesta de múltiples secciones/tablas (ideal para Resumen Ejecutivo).
 */
export function buildStyledSectionsSheet({
  sheetName = "Resumen",
  title = "",
  subtitle = "",
  filtersText = "",
  kpis = [],
  sections = [], // [{ title, headers, rows, columnTypes?, totals? }]
  colWidths = [],
  orientation = "landscape",
  logoImage = null
}) {
  const maxSectionCols = sections.reduce((m, s) => Math.max(m, (s.headers || []).length), 2);
  const colCount = Math.max(maxSectionCols, colWidths.length || 2, 4);
  const sheetRows = [];
  const hasLogo = Boolean(logoImage);
  const cachedFormulaValues = {};
  const measuredColMax = Array.from({ length: colCount }, (_, idx) => Math.max(Number(colWidths[idx]) || 18, idx === 0 && hasLogo ? 16 : 14));

  sheetRows.push(
    ...buildCorporateHeaderRows({
      title: title || sheetName,
      subtitle,
      filtersText,
      colCount,
      hasLogo
    })
  );
  sheetRows.push(makeSpacerRow(colCount, 10));

  if (Array.isArray(kpis) && kpis.length > 0) {
    sheetRows.push(...buildKpiRows(kpis, colCount));
    sheetRows.push(makeSpacerRow(colCount, 12));
  }

  for (const sec of sections) {
    const secHeaders = Array.isArray(sec.headers) ? sec.headers : [];
    const secRows = Array.isArray(sec.rows) ? sec.rows : [];
    const secTypes = secHeaders.map((h, idx) => sec.columnTypes?.[idx] || inferColumnType(h));
    const secCols = Math.max(secHeaders.length, 1);

    // Medir anchos reales por columna para evitar recortes horizontales
    secHeaders.forEach((h, idx) => {
      if (idx < colCount && !(idx === secHeaders.length - 1 && secCols < colCount)) {
        const len = Math.ceil((String(h || "").length + 4) * 1.12);
        if (len > measuredColMax[idx]) measuredColMax[idx] = Math.min(48, len);
      }
    });
    secRows.forEach((r) => {
      for (let cIdx = 0; cIdx < Math.min(secCols, colCount); cIdx++) {
        if (cIdx === secCols - 1 && secCols < colCount) continue;
        const len = measureDisplayLength(r?.[cIdx], secTypes[cIdx]);
        if (len > measuredColMax[cIdx]) measuredColMax[cIdx] = Math.min(48, len);
      }
    });

    if (sec.title) {
      sheetRows.push(
        makeMergedBannerRow(String(sec.title).toUpperCase(), colCount, {
          height: 23,
          fontSize: 10,
          fontWeight: "bold",
          textColor: COLORS.brandText,
          backgroundColor: COLORS.brandSoft,
          leftBorderColor: COLORS.brandAccent,
          leftBorderStyle: "thick",
          bottomBorderColor: "#FECACA",
          bottomBorderStyle: "thin",
          align: "left",
          alignVertical: "center",
          indent: 1
        })
      );
    }

    const lastColSpan = secCols < colCount ? colCount - secCols + 1 : 1;

    if (secHeaders.length > 0) {
      const headerRow = Array.from({ length: colCount }, (_, idx) => {
        if (idx >= secHeaders.length) return null;
        return {
          value: String(secHeaders[idx] ?? ""),
          type: String,
          ...(idx === secHeaders.length - 1 && lastColSpan > 1 ? { columnSpan: lastColSpan } : {}),
          height: 25,
          fontSize: 9.5,
          fontWeight: "bold",
          textColor: COLORS.white,
          backgroundColor: COLORS.brandDark,
          bottomBorderColor: COLORS.brandAccent,
          bottomBorderStyle: "medium",
          leftBorderColor: "#334155",
          leftBorderStyle: "thin",
          rightBorderColor: "#334155",
          rightBorderStyle: "thin",
          align:
            secTypes[idx] === "currency" || secTypes[idx] === "integer" || secTypes[idx] === "percent"
              ? "right"
              : secTypes[idx] === "text"
              ? "left"
              : "center",
          alignVertical: "center",
          wrap: true
        };
      });
      sheetRows.push(headerRow);
    }

    const startRow = sheetRows.length + 1;
    if (secRows.length === 0) {
      sheetRows.push(
        makeMergedBannerRow(sec.emptyText || "Sin datos disponibles", colCount, {
          height: 22,
          fontSize: 9.5,
          fontStyle: "italic",
          textColor: COLORS.textMuted,
          borderColor: COLORS.borderLight,
          borderStyle: "thin",
          align: "center",
          alignVertical: "center"
        })
      );
    } else {
      secRows.forEach((r, rIdx) => {
        const padded = Array.from({ length: colCount }, (_, cIdx) => {
          if (cIdx >= secCols) return null;
          const cell = buildDataCell(r?.[cIdx], secTypes[cIdx], rIdx);
          if (cIdx === 0) cell.height = 22;
          if (cIdx === secCols - 1 && lastColSpan > 1) cell.columnSpan = lastColSpan;
          return cell;
        });
        sheetRows.push(padded);
      });
    }
    const endRow = sheetRows.length;

    if (sec.totals && secRows.length > 0) {
      const totExcelRow = sheetRows.length + 1;
      const totRow = Array.from({ length: colCount }, (_, cIdx) => {
        if (cIdx >= secCols) return null;
        const spec = sec.totals[cIdx];
        const spanProp = cIdx === secCols - 1 && lastColSpan > 1 ? { columnSpan: lastColSpan } : {};
        const baseStyle = {
          ...spanProp,
          height: 26,
          fontSize: 10,
          fontWeight: "bold",
          textColor: COLORS.textPrimary,
          backgroundColor: COLORS.subtleBg,
          topBorderColor: COLORS.brandDark,
          topBorderStyle: "medium",
          bottomBorderColor: COLORS.brandDark,
          bottomBorderStyle: "double",
          leftBorderColor: COLORS.borderLight,
          leftBorderStyle: "thin",
          rightBorderColor: COLORS.borderLight,
          rightBorderStyle: "thin",
          alignVertical: "center"
        };
        if (!spec) return { ...baseStyle, value: "", type: String };
        const letter = columnIndexToLetter(cIdx);
        const cellRef = `${letter}${totExcelRow}`;
        const fmt =
          secTypes[cIdx] === "currency"
            ? EXCEL_FORMATS.currency
            : secTypes[cIdx] === "percent"
            ? EXCEL_FORMATS.percent
            : EXCEL_FORMATS.integer;
        if (spec === "sum") {
          const computedSum = secRows.reduce((acc, r) => acc + (extractNumericValue(r?.[cIdx]) ?? 0), 0);
          cachedFormulaValues[cellRef] = computedSum;
          return {
            ...baseStyle,
            value: `SUM(${letter}${startRow}:${letter}${endRow})`,
            type: "Formula",
            format: fmt,
            align: "right"
          };
        }
        if (spec === "count") {
          cachedFormulaValues[cellRef] = secRows.filter((r) => isNonEmptyCellValue(r?.[cIdx])).length;
          return {
            ...baseStyle,
            value: `COUNTA(${letter}${startRow}:${letter}${endRow})`,
            type: "Formula",
            format: EXCEL_FORMATS.integer,
            align: "center"
          };
        }
        return {
          ...baseStyle,
          value: String(spec),
          type: String,
          align: cIdx === 0 ? "left" : "center",
          ...(cIdx === 0 ? { indent: 1 } : {})
        };
      });
      sheetRows.push(totRow);
    }

    sheetRows.push(makeSpacerRow(colCount, 12));
  }

  sheetRows.push(
    makeMergedBannerRow(EXCEL_BRAND.footerNote, colCount, {
      height: 20,
      fontSize: 8.5,
      fontStyle: "italic",
      textColor: COLORS.textMuted,
      align: "left",
      alignVertical: "center",
      indent: 1,
      wrap: true
    })
  );

  const rawColumns = measuredColMax.map((w, idx) => ({
    width: Math.round(Math.max(w, Number(colWidths[idx]) || 16, idx === 0 && hasLogo ? 16 : 14))
  }));
  const columns = ensureBannerMinimumWidth(rawColumns, hasLogo, title || sheetName);
  applyDynamicRowHeights(sheetRows, columns);

  return {
    data: sheetRows,
    sheet: sanitizeSheetName(sheetName),
    columns,
    ...(orientation ? { orientation } : {}),
    stickyRowsCount: 3,
    ...(logoImage ? { images: [logoImage] } : {}),
    ...(Object.keys(cachedFormulaValues).length > 0 ? { cachedFormulaValues } : {})
  };
}

/**
 * Exporta una tabla corporativa estilizada a archivo `.xlsx` con encabezado, logo, KPIs y totales.
 */
export async function exportTableToExcel({
  sheetName = "Datos",
  fileName = "reporte.xlsx",
  title = "",
  subtitle = "",
  filtersText = "",
  kpis = [],
  sectionTitle = "",
  headers = [],
  rows = [],
  colWidths = [],
  columnTypes = [],
  totals = null,
  orientation = "landscape",
  includeLogo = true
}) {
  const [{ default: writeXlsxFile }, logoImage] = await Promise.all([
    import("write-excel-file/browser"),
    includeLogo ? getBrandLogoImageSpec() : Promise.resolve(null)
  ]);

  const sheetObj = buildStyledTableSheet({
    sheetName,
    title: title || `Reporte de ${sheetName}`,
    subtitle,
    filtersText,
    kpis,
    sectionTitle,
    headers,
    rows,
    colWidths,
    columnTypes,
    totals,
    orientation,
    logoImage
  });

  const safeFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  const { data, ...sheetOptions } = sheetObj;

  await writeXlsxFile(data, sheetOptions, {
    fontFamily: "Calibri",
    fontSize: 10.5,
    features: [CACHED_FORMULA_FEATURE]
  }).toFile(safeFileName);
}

/**
 * Exporta un libro Excel corporativo MULTI-HOJA (.xlsx).
 * Cada entrada en `sheets` puede ser `{ kind: "table", ... }` o `{ kind: "sections", ... }`.
 */
export async function exportWorkbookToExcel({
  fileName = "reporte.xlsx",
  sheets = [],
  includeLogo = true
}) {
  if (!Array.isArray(sheets) || sheets.length === 0) return;

  const [{ default: writeXlsxFile }, logoImage] = await Promise.all([
    import("write-excel-file/browser"),
    includeLogo ? getBrandLogoImageSpec() : Promise.resolve(null)
  ]);

  const builtSheets = sheets.map((cfg) => {
    const withLogo = { ...cfg, logoImage };
    return cfg.kind === "sections"
      ? buildStyledSectionsSheet(withLogo)
      : buildStyledTableSheet(withLogo);
  });

  const safeFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;

  await writeXlsxFile(builtSheets, {
    fontFamily: "Calibri",
    fontSize: 10.5,
    features: [CACHED_FORMULA_FEATURE]
  }).toFile(safeFileName);
}

/**
 * Exporta una matriz libre estilizada (retrocompatible con llamadas existentes).
 */
export async function exportMatrixToExcel({
  sheetName = "Reporte",
  fileName = "reporte.xlsx",
  matrix = [],
  colWidths = [],
  orientation = "landscape"
}) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const maxCols = matrix.reduce((m, r) => Math.max(m, Array.isArray(r) ? r.length : 0), 1);

  const data = matrix.map((row, rIdx) => {
    const arr = Array.isArray(row) ? row : [];
    const nonEmpty = arr.filter((c) => c !== null && c !== undefined && String(c).trim() !== "");
    if (nonEmpty.length === 0) return makeSpacerRow(maxCols, 10);

    // Fila título principal (primera fila)
    if (rIdx === 0 && nonEmpty.length === 1) {
      return makeMergedBannerRow(String(nonEmpty[0]), maxCols, {
        height: 28,
        fontSize: 13,
        fontWeight: "bold",
        textColor: COLORS.white,
        backgroundColor: COLORS.brandDark,
        bottomBorderColor: COLORS.brandAccent,
        bottomBorderStyle: "medium",
        align: "left",
        alignVertical: "center",
        indent: 1
      });
    }

    // Subtítulos de sección (1 sola celda en MAYÚSCULAS)
    if (nonEmpty.length === 1 && String(nonEmpty[0]) === String(nonEmpty[0]).toUpperCase() && String(nonEmpty[0]).length > 4) {
      return makeMergedBannerRow(String(nonEmpty[0]), maxCols, {
        height: 22,
        fontSize: 10,
        fontWeight: "bold",
        textColor: COLORS.brandText,
        backgroundColor: COLORS.brandSoft,
        leftBorderColor: COLORS.brandAccent,
        leftBorderStyle: "thick",
        align: "left",
        alignVertical: "center",
        indent: 1
      });
    }

    const padded = Array.from({ length: maxCols }, (_, idx) => arr[idx] ?? "");
    const isTotalRow = String(arr[0] || "").toUpperCase().startsWith("TOTAL");
    return padded.map((cell, cIdx) => {
      if (isTotalRow) {
        const isNum = typeof cell === "number" && Number.isFinite(cell);
        return {
          value: isNum ? cell : String(cell ?? ""),
          type: isNum ? Number : String,
          ...(isNum ? { format: Math.abs(cell) >= 500 ? EXCEL_FORMATS.currency : EXCEL_FORMATS.integer } : {}),
          height: 24,
          fontWeight: "bold",
          backgroundColor: COLORS.subtleBg,
          textColor: COLORS.textPrimary,
          topBorderColor: COLORS.brandDark,
          topBorderStyle: "medium",
          bottomBorderColor: COLORS.brandDark,
          bottomBorderStyle: "double",
          align: isNum ? "right" : "left",
          alignVertical: "center"
        };
      }
      return buildDataCell(cell, typeof cell === "number" && Math.abs(cell) >= 500 ? "currency" : "text", rIdx, {
        height: 20
      });
    });
  });

  const columns = Array.from({ length: maxCols }, (_, idx) => ({
    width: Number(colWidths[idx]) || 22
  }));
  const safeFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;

  await writeXlsxFile(
    data,
    {
      columns,
      sheet: sanitizeSheetName(sheetName),
      ...(orientation ? { orientation } : {})
    },
    {
      fontFamily: "Calibri",
      fontSize: 10.5
    }
  ).toFile(safeFileName);
}
