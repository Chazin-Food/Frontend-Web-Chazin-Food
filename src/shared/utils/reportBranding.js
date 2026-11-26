import logoImg from "@/shared/assets/logo_optimized.webp";
import { escapeHtml } from "@/shared/utils/htmlSanitizer";
import { formatTime12h, COLOMBIA_TZ } from "@/shared/utils/dateUtils";

/**
 * Resuelve la URL absoluta del logo de Chazin Food para ventanas emergentes de impresión/PDF
 * (evita rutas relativas rotas cuando se usa window.open("", "_blank") desde subrutas).
 */
export function resolveBrandLogoUrl() {
  if (typeof window === "undefined") return logoImg;
  try {
    return new URL(logoImg, window.location.origin).href;
  } catch {
    return logoImg;
  }
}

/**
 * Estilos corporativos compartidos para reportes imprimibles / PDF con branding Chazin Food.
 */
export const BRAND_REPORT_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
    margin: 0;
    padding: 24px 28px;
    color: #1e293b;
    background: #ffffff;
    font-size: 12px;
    line-height: 1.45;
  }
  .brand-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 14px;
    margin-bottom: 18px;
    border-bottom: 2.5px solid #D9383A;
  }
  .brand-identity {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .brand-logo-wrap {
    width: 62px;
    height: 62px;
    border-radius: 14px;
    border: 1.5px solid #fecaca;
    background: #fff5f5;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .brand-logo-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
  .brand-title-group h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
  }
  .brand-title-group h1 .accent {
    color: #D9383A;
  }
  .brand-subtitle {
    margin: 2px 0 0 0;
    font-size: 12px;
    color: #475569;
    font-weight: 600;
  }
  .brand-company-meta {
    margin-top: 3px;
    font-size: 10px;
    color: #64748b;
  }
  .brand-report-meta {
    text-align: right;
    font-size: 10.5px;
    color: #475569;
    line-height: 1.55;
    flex-shrink: 0;
  }
  .brand-report-meta strong {
    color: #0f172a;
  }
  .brand-filters-bar {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px 12px;
    margin-bottom: 16px;
    font-size: 11px;
    color: #334155;
  }
  .brand-filters-bar strong {
    color: #0f172a;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }
  .kpi-card {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
    background: #ffffff;
  }
  .kpi-card.net {
    background: #ecfdf5;
    border-color: #a7f3d0;
  }
  .kpi-card.refund {
    background: #fff1f2;
    border-color: #fecdd3;
  }
  .kpi-label {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    margin-bottom: 3px;
  }
  .kpi-value {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
  }
  .kpi-card.net .kpi-value { color: #047857; }
  .kpi-card.refund .kpi-value { color: #be123c; }
  .kpi-sub {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
  }
  .section-title {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    margin: 18px 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    font-size: 11px;
  }
  th, td {
    border: 1px solid #e2e8f0;
    padding: 6px 9px;
    text-align: left;
  }
  th {
    background-color: #f1f5f9;
    color: #334155;
    font-weight: 700;
    font-size: 10.5px;
  }
  tr:nth-child(even) td {
    background-color: #fafafa;
  }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .center { text-align: center; }
  .neg { color: #be123c; font-weight: 700; }
  .pos { color: #047857; font-weight: 700; }
  .total-row td {
    background-color: #f1f5f9 !important;
    font-weight: 800;
    border-top: 2px solid #94a3b8;
  }
  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 999px;
    font-size: 9.5px;
    font-weight: 700;
    background: #d1fae5;
    color: #065f46;
  }
  .badge-rose { background: #ffe4e6; color: #9f1239; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .brand-footer {
    margin-top: 24px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    font-size: 10px;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  @media print {
    body { padding: 12px 14px; }
    .no-print { display: none !important; }
    .brand-header, .kpi-card, .total-row td, th {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tr { page-break-inside: avoid; }
  }
`;

/**
 * Construye el encabezado corporativo HTML con logo oficial de Chazin Food.
 */
export function buildBrandReportHeaderHtml({
  title = "Reporte Comercial",
  subtitle = "",
  metaItems = [],
  filtersSummary = ""
} = {}) {
  const logoUrl = resolveBrandLogoUrl();
  const now = new Date();
  const fechaEmision = now.toLocaleDateString("es-CO", { timeZone: COLOMBIA_TZ });
  const horaEmision = formatTime12h(now);

  const metaHtml = [
    `<div><strong>Emitido:</strong> ${escapeHtml(fechaEmision)} · ${escapeHtml(horaEmision)}</div>`,
    ...metaItems.map(
      (item) => `<div><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</div>`
    )
  ].join("");

  return `
    <div class="brand-header">
      <div class="brand-identity">
        <div class="brand-logo-wrap">
          <img src="${escapeHtml(logoUrl)}" alt="Logo Chazin Food" />
        </div>
        <div class="brand-title-group">
          <h1>Chazin <span class="accent">Food</span></h1>
          <p class="brand-subtitle">${escapeHtml(title)}${subtitle ? ` — ${escapeHtml(subtitle)}` : ""}</p>
          <div class="brand-company-meta">NIT: 901.458.789-2 · Cl. 21 #80-21, Belén, Medellín · Tel: +57 319 202 8562</div>
        </div>
      </div>
      <div class="brand-report-meta">
        ${metaHtml}
      </div>
    </div>
    ${
      filtersSummary
        ? `<div class="brand-filters-bar"><strong>Filtros aplicados:</strong> ${escapeHtml(filtersSummary)}</div>`
        : ""
    }
  `;
}

/**
 * Pie de página corporativo estándar para reportes PDF/impresión.
 */
export function buildBrandReportFooterHtml(moduleLabel = "Sistema de Gestión Comercial Chazin Food") {
  return `
    <div class="brand-footer">
      <span>Chazin Food · ${escapeHtml(moduleLabel)}</span>
      <span>Documento generado automáticamente · Medellín, Colombia</span>
    </div>
  `;
}

/**
 * Encabezado compacto con logo para tickets térmicos (80mm): comprobantes POS y comandas de cocina.
 */
export function buildBrandTicketLogoHtml(widthPx = 46) {
  const logoUrl = resolveBrandLogoUrl();
  return `
    <div style="text-align: center; margin-bottom: 4px;">
      <img
        src="${escapeHtml(logoUrl)}"
        alt="Chazin Food"
        style="width: ${Number(widthPx) || 46}px; height: ${Number(widthPx) || 46}px; object-fit: contain; display: inline-block; border-radius: 8px;"
      />
    </div>
  `;
}
