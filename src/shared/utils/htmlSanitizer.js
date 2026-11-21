/**
 * Utilidad compartida para escapar contenido dinámico antes de construir HTML
 * en ventanas de impresión (comandas, comprobantes, reportes) y prevenir XSS (AUD-011).
 */
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, (ch) => HTML_ESCAPE_MAP[ch]);
}
