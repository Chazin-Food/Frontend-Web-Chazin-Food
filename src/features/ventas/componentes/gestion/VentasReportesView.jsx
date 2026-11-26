import { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  History,
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  Search,
  ChevronDown,
  X,
  RotateCw,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle2,
  Receipt
} from "lucide-react";
import logoImg from "@/shared/assets/logo_optimized.webp";
import { getColombiaDateISO, formatDateSafe } from "@/shared/utils/dateUtils";
import { exportWorkbookToExcel, EXCEL_FORMATS } from "@/shared/utils/excelExport";
import { escapeHtml } from "@/shared/utils/htmlSanitizer";
import {
  BRAND_REPORT_CSS,
  buildBrandReportHeaderHtml,
  buildBrandReportFooterHtml
} from "@/shared/utils/reportBranding";
import {
  computeSalesReportMetrics,
  extractAvailableReportProducts
} from "../../utils/ventasReportMetrics";
import { HelpTooltip } from "@/shared/components/ui/HelpTooltip";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const CustomChartTooltip = ({ active, payload, label, mode = "money" }) => {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload || {};
  const titleLabel =
    row.nombreLimpio ||
    row.nombre ||
    row.mesCompleto ||
    row.fechaCompleta ||
    row.dia ||
    label;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 min-w-[205px] max-w-[280px]">
      <p className="font-extrabold text-gray-900 dark:text-gray-100 text-sm leading-snug border-b border-gray-100 dark:border-gray-700 pb-1">
        {titleLabel}
      </p>

      {mode === "money" && (
        <>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500 dark:text-gray-400">Ventas brutas:</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              ${Number(row.ventasBrutas ?? row.ventas ?? 0).toLocaleString("es-CO")}
            </span>
          </div>
          {Number(row.reembolsos || 0) > 0 && (
            <div className="flex justify-between gap-3 text-rose-600 dark:text-rose-400">
              <span>Devoluciones / Reemb.:</span>
              <span className="font-bold">-${Number(row.reembolsos).toLocaleString("es-CO")}</span>
            </div>
          )}
          <div className="flex justify-between gap-3 text-emerald-600 dark:text-emerald-400 pt-1 border-t border-gray-100 dark:border-gray-700">
            <span className="font-bold">Ingreso neto real:</span>
            <span className="font-extrabold">${Number(row.ventas || 0).toLocaleString("es-CO")}</span>
          </div>
          {row.cantidadVentas !== undefined && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {row.cantidadVentas} {row.cantidadVentas === 1 ? "venta" : "ventas"}
              {row.unidadesNetas !== undefined ? ` · ${row.unidadesNetas} und. netas` : ""}
              {Number(row.unidadesDevueltas || 0) > 0 ? ` (${row.unidadesDevueltas} dev.)` : ""}
            </p>
          )}
        </>
      )}

      {mode === "volume" && (
        <>
          <div className="flex justify-between gap-3 text-blue-600 dark:text-blue-400">
            <span className="font-semibold">Ventas procesadas:</span>
            <span className="font-extrabold">{Number(row.cantidadVentas || 0)}</span>
          </div>
          <div className="flex justify-between gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="font-semibold">Unidades netas:</span>
            <span className="font-bold">{Number(row.unidadesNetas || 0)} und.</span>
          </div>
          {Number(row.unidadesDevueltas || 0) > 0 && (
            <div className="flex justify-between gap-3 text-rose-600 dark:text-rose-400">
              <span>Unidades devueltas:</span>
              <span className="font-bold">-{Number(row.unidadesDevueltas)} und.</span>
            </div>
          )}
        </>
      )}

      {mode === "product" && (
        <>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500 dark:text-gray-400">Vendidas (bruto):</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{Number(row.cantidadBruta || 0)} und.</span>
          </div>
          {Number(row.cantidadDevuelta || 0) > 0 && (
            <div className="flex justify-between gap-3 text-rose-600 dark:text-rose-400">
              <span>Devueltas:</span>
              <span className="font-bold">-{Number(row.cantidadDevuelta)} und.</span>
            </div>
          )}
          <div className="flex justify-between gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="font-bold">Unidades netas:</span>
            <span className="font-extrabold">{Number(row.cantidadNeta || 0)} und.</span>
          </div>
          <div className="pt-1 border-t border-gray-100 dark:border-gray-700 space-y-0.5">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500 dark:text-gray-400">Venta bruta:</span>
              <span className="font-semibold">${Number(row.ingresosBrutos || 0).toLocaleString("es-CO")}</span>
            </div>
            {Number(row.montoReembolsado || 0) > 0 && (
              <div className="flex justify-between gap-3 text-rose-600 dark:text-rose-400">
                <span>Reembolsado:</span>
                <span className="font-bold">-${Number(row.montoReembolsado).toLocaleString("es-CO")}</span>
              </div>
            )}
            <div className="flex justify-between gap-3 text-teal-600 dark:text-teal-400 font-bold">
              <span>Ingreso neto:</span>
              <span>${Number(row.ingresosNetos || 0).toLocaleString("es-CO")}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const PERIOD_LABELS = {
  hoy: "Hoy",
  "7_dias": "Últimos 7 días",
  este_mes: "Este mes",
  este_ano: "Este año",
  personalizado: "Histórico completo"
};

export function VentasReportesView({
  ventas = [],
  devoluciones = [],
  selectedPeriod = "personalizado"
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [vistaTemporal, setVistaTemporal] = useState("historico"); // "historico" | "semanal" | "fechas"
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filtros específicos del reporte de ventas
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [origen, setOrigen] = useState("Todos");
  const [metodoPago, setMetodoPago] = useState("Todos");
  const [tipoEntrega, setTipoEntrega] = useState("Todos");
  const [fidelidad, setFidelidad] = useState("Todos");
  const [producto, setProducto] = useState("Todos");
  const [estadoDevolucion, setEstadoDevolucion] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");

  useEffect(() => {
    if (selectedPeriod === "7_dias" || selectedPeriod === "hoy") {
      setVistaTemporal("semanal");
    } else if (selectedPeriod === "este_mes" || (fechaInicio && fechaFin)) {
      setVistaTemporal("fechas");
    } else {
      setVistaTemporal("historico");
    }
  }, [selectedPeriod, fechaInicio, fechaFin]);

  const productosDisponibles = useMemo(
    () => extractAvailableReportProducts(ventas),
    [ventas]
  );

  const reportFilters = useMemo(
    () => ({
      fechaInicio,
      fechaFin,
      origen,
      metodoPago,
      tipoEntrega,
      fidelidad,
      producto,
      estadoDevolucion,
      busqueda,
      montoMin,
      montoMax
    }),
    [
      fechaInicio,
      fechaFin,
      origen,
      metodoPago,
      tipoEntrega,
      fidelidad,
      producto,
      estadoDevolucion,
      busqueda,
      montoMin,
      montoMax
    ]
  );

  const reportData = useMemo(
    () =>
      computeSalesReportMetrics({
        ventas,
        devoluciones,
        filters: reportFilters
      }),
    [ventas, devoluciones, reportFilters]
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (fechaInicio || fechaFin) {
      chips.push({
        key: "fechas",
        label: `Fechas: ${fechaInicio || "Inicio"} → ${fechaFin || "Hoy"}`,
        clear: () => {
          setFechaInicio("");
          setFechaFin("");
        }
      });
    }
    if (origen !== "Todos") {
      chips.push({
        key: "origen",
        label: `Canal: ${origen === "ONLINE" ? "Venta Online" : "Punto Físico"}`,
        clear: () => setOrigen("Todos")
      });
    }
    if (metodoPago !== "Todos") {
      chips.push({
        key: "metodo",
        label: `Pago: ${metodoPago}`,
        clear: () => setMetodoPago("Todos")
      });
    }
    if (tipoEntrega !== "Todos") {
      chips.push({
        key: "entrega",
        label: `Entrega: ${tipoEntrega}`,
        clear: () => setTipoEntrega("Todos")
      });
    }
    if (producto !== "Todos") {
      chips.push({
        key: "producto",
        label: `Producto: ${producto}`,
        clear: () => setProducto("Todos")
      });
    }
    if (fidelidad !== "Todos") {
      chips.push({
        key: "fidelidad",
        label: `Fidelidad: ${fidelidad}`,
        clear: () => setFidelidad("Todos")
      });
    }
    if (estadoDevolucion !== "Todos") {
      chips.push({
        key: "devolucion",
        label:
          estadoDevolucion === "con_devolucion"
            ? "Solo con devolución/reembolso"
            : "Solo sin devoluciones",
        clear: () => setEstadoDevolucion("Todos")
      });
    }
    if (montoMin !== "" || montoMax !== "") {
      chips.push({
        key: "monto",
        label: `Monto: $${Number(montoMin || 0).toLocaleString("es-CO")} - ${montoMax !== "" ? `$${Number(montoMax).toLocaleString("es-CO")}` : "∞"}`,
        clear: () => {
          setMontoMin("");
          setMontoMax("");
        }
      });
    }
    if (busqueda.trim()) {
      chips.push({
        key: "busqueda",
        label: `Búsqueda: "${busqueda.trim()}"`,
        clear: () => setBusqueda("")
      });
    }
    return chips;
  }, [
    fechaInicio,
    fechaFin,
    origen,
    metodoPago,
    tipoEntrega,
    producto,
    fidelidad,
    estadoDevolucion,
    montoMin,
    montoMax,
    busqueda
  ]);

  const clearReportFilters = () => {
    setFechaInicio("");
    setFechaFin("");
    setOrigen("Todos");
    setMetodoPago("Todos");
    setTipoEntrega("Todos");
    setFidelidad("Todos");
    setProducto("Todos");
    setEstadoDevolucion("Todos");
    setBusqueda("");
    setMontoMin("");
    setMontoMax("");
  };

  const filtersSummaryText = useMemo(() => {
    const base = PERIOD_LABELS[selectedPeriod] || "Histórico completo";
    if (activeFilterChips.length === 0) return `Período: ${base} (sin filtros adicionales)`;
    return `Período: ${base} | ${activeFilterChips.map((c) => c.label).join(" · ")}`;
  }, [selectedPeriod, activeFilterChips]);

  const chartConfig = useMemo(() => {
    if (vistaTemporal === "historico") {
      return {
        data: reportData.historicoMensual,
        xKey: "mes",
        barTitle: "Ingresos netos vs. devoluciones por mes (COP)",
        lineTitle: "Volumen de ventas y unidades netas por mes"
      };
    }
    if (vistaTemporal === "fechas") {
      return {
        data: reportData.historicoFechas,
        xKey: "fecha",
        barTitle: "Ingresos netos vs. devoluciones por fecha (COP)",
        lineTitle: "Volumen de ventas y unidades netas por fecha"
      };
    }
    return {
      data: reportData.ingresosDiarios,
      xKey: "dia",
      barTitle: "Ingresos netos vs. devoluciones por día de la semana (COP)",
      lineTitle: "Volumen de ventas y unidades netas por día"
    };
  }, [vistaTemporal, reportData]);

  const { kpis } = reportData;

  const handleExportExcel = async () => {
    const periodSubtitle = PERIOD_LABELS[selectedPeriod] || "Histórico completo";
    const resumenDestacados = reportData.resumen.slice(6).map((r) => [
      r.label,
      r.value,
      "Indicador destacado del período",
      "Informativo"
    ]);

    await exportWorkbookToExcel({
      fileName: `Reporte_Ventas_Neto_ChazinFood_${getColombiaDateISO()}.xlsx`,
      sheets: [
        {
          kind: "sections",
          sheetName: "Resumen Ejecutivo",
          title: "Reporte Comercial de Ventas, Devoluciones y Reembolsos",
          subtitle: periodSubtitle,
          filtersText: filtersSummaryText,
          colWidths: [38, 24, 34, 18],
          kpis: [
            { label: "Ventas Brutas", value: kpis.ingresosBrutos, format: "currency", tone: "slate" },
            {
              label: "Reembolsos Aplicados",
              value: kpis.totalReembolsos > 0 ? -kpis.totalReembolsos : 0,
              format: "currency",
              tone: kpis.totalReembolsos > 0 ? "rose" : "slate"
            },
            { label: "Ingresos Netos Reales", value: kpis.ingresosNetos, format: "currency", tone: "emerald" },
            { label: "Unidades Netas", value: kpis.unidadesNetas, format: "integer", tone: "blue" }
          ],
          sections: [
            {
              title: "Conciliación Financiera y Operativa (Bruto − Devoluciones = Neto Real)",
              headers: ["Indicador Financiero / Operativo", "Valor / Cifra", "Detalle y Referencia", "Estado"],
              columnTypes: ["text", "text", "text", "status"],
              rows: [
                [
                  "Ventas brutas del período",
                  { value: kpis.ingresosBrutos, format: EXCEL_FORMATS.currency, fontWeight: "bold", align: "right" },
                  `${kpis.unidadesBrutas} und. brutas · ${kpis.totalVentasCount} ventas procesadas`,
                  "Completado"
                ],
                [
                  "Devoluciones y reembolsos aplicados",
                  {
                    value: kpis.totalReembolsos > 0 ? -kpis.totalReembolsos : 0,
                    format: EXCEL_FORMATS.currency,
                    fontWeight: "bold",
                    textColor: kpis.totalReembolsos > 0 ? "#991B1B" : "#475569",
                    backgroundColor: kpis.totalReembolsos > 0 ? "#FEF2F2" : undefined,
                    align: "right"
                  },
                  `${kpis.devolucionesAprobadasCount} devoluciones · ${kpis.unidadesDevueltas} und. devueltas`,
                  kpis.totalReembolsos > 0 ? "Anulada" : "Óptimo"
                ],
                [
                  "Reembolsos ya desembolsados",
                  { value: kpis.reembolsosRealizados > 0 ? -kpis.reembolsosRealizados : 0, format: EXCEL_FORMATS.currency, align: "right" },
                  "Reintegros confirmados al cliente",
                  "Realizado"
                ],
                [
                  "Reembolsos pendientes por desembolsar",
                  { value: kpis.reembolsosPendientes > 0 ? -kpis.reembolsosPendientes : 0, format: EXCEL_FORMATS.currency, align: "right" },
                  `${kpis.devolucionesPendientesCount} solicitud(es) pendiente(s) de cierre`,
                  kpis.reembolsosPendientes > 0 ? "Pendiente" : "Óptimo"
                ],
                [
                  { value: "INGRESOS NETOS REALES (BRUTO − REEMBOLSOS)", fontWeight: "bold", textColor: "#166534", backgroundColor: "#F0FDF4" },
                  {
                    value: kpis.ingresosNetos,
                    format: EXCEL_FORMATS.currency,
                    fontWeight: "bold",
                    textColor: "#166534",
                    backgroundColor: "#DCFCE7",
                    align: "right"
                  },
                  {
                    value: `${kpis.unidadesNetas} und. netas vendidas efectivamente`,
                    fontWeight: "bold",
                    textColor: "#166534",
                    backgroundColor: "#F0FDF4"
                  },
                  "Activo"
                ],
                [
                  "Ticket promedio neto por venta",
                  { value: kpis.ticketPromedioNeto, format: EXCEL_FORMATS.currency, fontWeight: "bold", align: "right" },
                  `Ticket promedio bruto: $${kpis.ticketPromedioBruto.toLocaleString("es-CO")} COP`,
                  "Óptimo"
                ],
                [
                  "Tasa de devolución (unidades / dinero)",
                  `${kpis.tasaDevolucionUnidades}% und.  |  ${kpis.tasaReembolsoDinero}% COP`,
                  `${kpis.unidadesDevueltasReembolso} und. reembolsadas · ${kpis.unidadesCambiadas} und. en cambio`,
                  kpis.tasaDevolucionUnidades > 10 ? "Bajo" : "Óptimo"
                ],
                ...resumenDestacados
              ]
            },
            {
              title: "Distribución de Ventas por Método de Pago",
              headers: ["Método de Pago", "N° Ventas", "% Participación", "Clasificación"],
              columnTypes: ["text", "integer", "percent", "status"],
              emptyText: "Sin registros de métodos de pago en el período seleccionado",
              rows: reportData.metodosPago.map((m) => [
                m.name,
                m.count,
                Number(m.value || 0) / 100,
                m.name.toLowerCase().includes("wompi") ? "Wompi" : "Activo"
              ]),
              totals: {
                0: "TOTAL MÉTODOS DE PAGO",
                1: "sum",
                2: "sum"
              }
            }
          ]
        },
        {
          kind: "table",
          sheetName: "Cuadre por Producto",
          title: "Cuadre por Producto — Vendidas vs. Devueltas vs. Netas",
          subtitle: periodSubtitle,
          filtersText: filtersSummaryText,
          sectionTitle: "Desglose de unidades e ingresos conciliados por producto",
          kpis: [
            { label: "Productos Analizados", value: reportData.productosDetalle.length, format: "integer", tone: "slate" },
            { label: "Unidades Vendidas", value: kpis.unidadesBrutas, format: "integer", tone: "blue" },
            { label: "Unidades Devueltas", value: kpis.unidadesDevueltas, format: "integer", tone: kpis.unidadesDevueltas > 0 ? "rose" : "slate" },
            { label: "Unidades Netas", value: kpis.unidadesNetas, format: "integer", tone: "emerald" },
            { label: "Venta Neta Total", value: kpis.ingresosNetos, format: "currency", tone: "emerald" }
          ],
          headers: [
            "Producto",
            "Und. Vendidas",
            "Und. Devueltas",
            "Und. Netas",
            "Venta Bruta (COP)",
            "Reembolsos (COP)",
            "Venta Neta (COP)",
            "% Participación"
          ],
          columnTypes: ["text", "integer", "integer", "integer", "currency", "currency", "currency", "percent"],
          colWidths: [34, 15, 16, 15, 20, 20, 20, 16],
          rows: reportData.productosDetalle.map((p) => [
            p.nombreLimpio,
            p.cantidadBruta,
            p.cantidadDevuelta > 0
              ? { value: p.cantidadDevuelta, textColor: "#991B1B", backgroundColor: "#FEE2E2", fontWeight: "bold", align: "right" }
              : 0,
            { value: p.cantidadNeta, fontWeight: "bold", align: "right" },
            p.ingresosBrutos,
            p.montoReembolsado > 0 ? -p.montoReembolsado : 0,
            { value: p.ingresosNetos, fontWeight: "bold", textColor: "#166534", align: "right" },
            Number(p.porcentaje || 0) / 100
          ]),
          totals: {
            0: "TOTAL GENERAL",
            1: "sum",
            2: "sum",
            3: "sum",
            4: "sum",
            5: "sum",
            6: "sum",
            7: "sum"
          }
        },
        {
          kind: "table",
          sheetName: "Devoluciones",
          title: "Detalle de Devoluciones y Reembolsos Aplicados",
          subtitle: periodSubtitle,
          filtersText: filtersSummaryText,
          sectionTitle: "Registro auditado de devoluciones confirmadas que impactan el cuadre",
          kpis: [
            { label: "Devoluciones Aplicadas", value: kpis.devolucionesAprobadasCount, format: "integer", tone: "slate" },
            { label: "Unidades Devueltas", value: kpis.unidadesDevueltas, format: "integer", tone: "amber" },
            { label: "Total Reembolsado", value: kpis.totalReembolsos > 0 ? -kpis.totalReembolsos : 0, format: "currency", tone: "rose" },
            { label: "Reembolsos Pendientes", value: kpis.reembolsosPendientes > 0 ? -kpis.reembolsosPendientes : 0, format: "currency", tone: kpis.reembolsosPendientes > 0 ? "amber" : "emerald" }
          ],
          headers: [
            "Código Dev.",
            "Venta Asociada",
            "Fecha",
            "Cliente",
            "Productos Devueltos",
            "Resolución",
            "Estado Reembolso",
            "Monto Reembolsado (COP)"
          ],
          columnTypes: ["textId", "textId", "date", "text", "text", "status", "status", "currency"],
          colWidths: [16, 18, 15, 24, 34, 20, 18, 22],
          rows: reportData.devolucionesAplicadas.map((d) => [
            d.codigoDevolucion,
            d.codigoVenta,
            formatDateSafe(d.fecha, "—"),
            d.clienteNombre,
            d.productosResumen || "—",
            d.tipoResolucion,
            d.estadoReembolso,
            d.valorDevuelto > 0 ? -d.valorDevuelto : 0
          ]),
          totals: {
            0: "TOTAL REEMBOLSOS",
            1: "count",
            7: "sum"
          }
        },
        {
          kind: "table",
          sheetName: "Histórico Mensual",
          title: "Evolución Mensual — Ventas Brutas, Reembolsos e Ingreso Neto",
          subtitle: periodSubtitle,
          filtersText: filtersSummaryText,
          sectionTitle: "Consolidado mensual del año operativo",
          kpis: [
            { label: "Ventas Brutas", value: kpis.ingresosBrutos, format: "currency", tone: "slate" },
            { label: "Reembolsos", value: kpis.totalReembolsos > 0 ? -kpis.totalReembolsos : 0, format: "currency", tone: "rose" },
            { label: "Ingresos Netos", value: kpis.ingresosNetos, format: "currency", tone: "emerald" },
            { label: "Total Transacciones", value: kpis.totalVentasCount, format: "integer", tone: "blue" }
          ],
          headers: [
            "Mes",
            "Ventas Brutas (COP)",
            "Reembolsos (COP)",
            "Ingresos Netos (COP)",
            "N° Ventas",
            "Und. Vendidas",
            "Und. Devueltas",
            "Und. Netas"
          ],
          columnTypes: ["text", "currency", "currency", "currency", "integer", "integer", "integer", "integer"],
          colWidths: [18, 22, 20, 22, 14, 15, 16, 15],
          rows: reportData.historicoMensual.map((m) => [
            m.mesCompleto,
            m.ventasBrutas,
            m.reembolsos > 0 ? -m.reembolsos : 0,
            { value: m.ventas, fontWeight: "bold", textColor: "#166534", align: "right" },
            m.cantidadVentas,
            m.unidadesBrutas ?? 0,
            m.unidadesDevueltas ?? 0,
            m.unidadesNetas ?? 0
          ]),
          totals: {
            0: "TOTAL CONSOLIDADO",
            1: "sum",
            2: "sum",
            3: "sum",
            4: "sum",
            5: "sum",
            6: "sum",
            7: "sum"
          }
        }
      ]
    });
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const headerHtml = buildBrandReportHeaderHtml({
      title: "Reporte Comercial de Ventas, Devoluciones y Reembolsos",
      subtitle: PERIOD_LABELS[selectedPeriod] || "Histórico completo",
      metaItems: [
        { label: "Ventas analizadas", value: `${kpis.totalVentasCount}` },
        { label: "Devoluciones aplicadas", value: `${kpis.devolucionesAprobadasCount}` }
      ],
      filtersSummary: filtersSummaryText
    });

    const kpiHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Ventas Brutas</div>
          <div class="kpi-value">$${escapeHtml(kpis.ingresosBrutos.toLocaleString("es-CO"))}</div>
          <div class="kpi-sub">${escapeHtml(kpis.unidadesBrutas)} und. vendidas · ${escapeHtml(kpis.totalVentasCount)} ventas</div>
        </div>
        <div class="kpi-card refund">
          <div class="kpi-label">Devoluciones y Reembolsos</div>
          <div class="kpi-value">-$${escapeHtml(kpis.totalReembolsos.toLocaleString("es-CO"))}</div>
          <div class="kpi-sub">${escapeHtml(kpis.unidadesDevueltas)} und. devueltas · ${escapeHtml(kpis.devolucionesAprobadasCount)} dev.</div>
        </div>
        <div class="kpi-card net">
          <div class="kpi-label">Ingresos Netos Reales</div>
          <div class="kpi-value">$${escapeHtml(kpis.ingresosNetos.toLocaleString("es-CO"))}</div>
          <div class="kpi-sub">${escapeHtml(kpis.unidadesNetas)} und. netas · Ticket neto $${escapeHtml(kpis.ticketPromedioNeto.toLocaleString("es-CO"))}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tasa de Devolución</div>
          <div class="kpi-value">${escapeHtml(kpis.tasaDevolucionUnidades)}%</div>
          <div class="kpi-sub">Impacto financiero: ${escapeHtml(kpis.tasaReembolsoDinero)}%</div>
        </div>
      </div>
    `;

    const prodRowsHtml = reportData.productosDetalle.length > 0
      ? reportData.productosDetalle
          .map(
            (p) => `
          <tr>
            <td><strong>${escapeHtml(p.nombreLimpio)}</strong></td>
            <td class="num">${escapeHtml(p.cantidadBruta)}</td>
            <td class="num ${p.cantidadDevuelta > 0 ? "neg" : ""}">${p.cantidadDevuelta > 0 ? `-${escapeHtml(p.cantidadDevuelta)}` : "0"}</td>
            <td class="num pos">${escapeHtml(p.cantidadNeta)}</td>
            <td class="num">$${escapeHtml(p.ingresosBrutos.toLocaleString("es-CO"))}</td>
            <td class="num ${p.montoReembolsado > 0 ? "neg" : ""}">${p.montoReembolsado > 0 ? `-$${escapeHtml(p.montoReembolsado.toLocaleString("es-CO"))}` : "$0"}</td>
            <td class="num pos">$${escapeHtml(p.ingresosNetos.toLocaleString("es-CO"))}</td>
            <td class="num">${escapeHtml(p.porcentaje)}%</td>
          </tr>
        `
          )
          .join("")
      : `<tr><td colspan="8" class="center">Sin productos registrados para los filtros seleccionados.</td></tr>`;

    const devRowsHtml = reportData.devolucionesAplicadas.length > 0
      ? reportData.devolucionesAplicadas
          .map(
            (d) => `
          <tr>
            <td><strong>${escapeHtml(d.codigoDevolucion)}</strong></td>
            <td>${escapeHtml(d.codigoVenta)}</td>
            <td>${escapeHtml(formatDateSafe(d.fecha, "—"))}</td>
            <td>${escapeHtml(d.clienteNombre)}</td>
            <td>${escapeHtml(d.productosResumen || "—")}</td>
            <td>${escapeHtml(d.tipoResolucion)}</td>
            <td><span class="badge ${d.estadoReembolso === "REALIZADO" ? "" : "badge-amber"}">${escapeHtml(d.estadoReembolso)}</span></td>
            <td class="num neg">${d.valorDevuelto > 0 ? `-$${escapeHtml(d.valorDevuelto.toLocaleString("es-CO"))}` : "$0"}</td>
          </tr>
        `
          )
          .join("")
      : `<tr><td colspan="8" class="center">No se registran devoluciones ni reembolsos aprobados/completados en este período.</td></tr>`;

    const activeMonths = reportData.historicoMensual.filter((m) => m.cantidadVentas > 0 || m.reembolsos > 0);
    const monthRowsHtml = activeMonths.length > 0
      ? activeMonths
          .map(
            (m) => `
          <tr>
            <td><strong>${escapeHtml(m.mesCompleto)}</strong></td>
            <td class="num">${escapeHtml(m.cantidadVentas)}</td>
            <td class="num">${escapeHtml(m.unidadesNetas)}</td>
            <td class="num">$${escapeHtml(m.ventasBrutas.toLocaleString("es-CO"))}</td>
            <td class="num ${m.reembolsos > 0 ? "neg" : ""}">${m.reembolsos > 0 ? `-$${escapeHtml(m.reembolsos.toLocaleString("es-CO"))}` : "$0"}</td>
            <td class="num pos">$${escapeHtml(m.ventas.toLocaleString("es-CO"))}</td>
          </tr>
        `
          )
          .join("")
      : `<tr><td colspan="6" class="center">Sin movimientos mensuales en el rango seleccionado.</td></tr>`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Reporte de Ventas Neto - Chazin Food</title>
          <style>${BRAND_REPORT_CSS}</style>
        </head>
        <body>
          ${headerHtml}
          ${kpiHtml}

          <h2 class="section-title">1. Cuadre de Unidades e Ingresos por Producto</h2>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="num">Vendidas</th>
                <th class="num">Devueltas</th>
                <th class="num">Netas</th>
                <th class="num">Venta Bruta</th>
                <th class="num">Reembolsos</th>
                <th class="num">Venta Neta</th>
                <th class="num">% Part.</th>
              </tr>
            </thead>
            <tbody>
              ${prodRowsHtml}
              <tr class="total-row">
                <td>TOTAL CONCILIADO</td>
                <td class="num">${escapeHtml(kpis.unidadesBrutas)}</td>
                <td class="num neg">${kpis.unidadesDevueltas > 0 ? `-${escapeHtml(kpis.unidadesDevueltas)}` : "0"}</td>
                <td class="num pos">${escapeHtml(kpis.unidadesNetas)}</td>
                <td class="num">$${escapeHtml(kpis.ingresosBrutos.toLocaleString("es-CO"))}</td>
                <td class="num neg">${kpis.totalReembolsos > 0 ? `-$${escapeHtml(kpis.totalReembolsos.toLocaleString("es-CO"))}` : "$0"}</td>
                <td class="num pos">$${escapeHtml(kpis.ingresosNetos.toLocaleString("es-CO"))}</td>
                <td class="num">100%</td>
              </tr>
            </tbody>
          </table>

          <h2 class="section-title">2. Detalle de Devoluciones y Reembolsos Aplicados</h2>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Productos Devueltos</th>
                <th>Resolución</th>
                <th>Reembolso</th>
                <th class="num">Monto Descontado</th>
              </tr>
            </thead>
            <tbody>
              ${devRowsHtml}
            </tbody>
          </table>

          <h2 class="section-title">3. Consolidado Mensual (Bruto vs. Reembolsos vs. Neto)</h2>
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th class="num">N° Ventas</th>
                <th class="num">Und. Netas</th>
                <th class="num">Ventas Brutas</th>
                <th class="num">Reembolsos</th>
                <th class="num">Ingreso Neto</th>
              </tr>
            </thead>
            <tbody>
              ${monthRowsHtml}
            </tbody>
          </table>

          ${buildBrandReportFooterHtml("Reporte Financiero de Ventas y Devoluciones")}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.opener = null;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const productColors = ["#10B981", "#22C55E", "#34D399", "#6EE7B7", "#A7F3D0", "#D1FAE5"];
  const paymentColors = ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6"];

  return (
    <div className="space-y-6">
      {/* Encabezado corporativo con Logo de Chazin Food y controles de exportación */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src={logoImg}
              alt="Logo Chazin Food"
              width="40"
              height="40"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                Reportes Comerciales &amp; Conciliación Neta
              </h2>
              <HelpTooltip
                title="Conciliación Bruto vs. Neto"
                content="Los totales netos descuentan automáticamente las unidades devueltas y reembolsos aprobados o completados. Puedes combinar los filtros inferiores antes de exportar a Excel o PDF."
              />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {(PERIOD_LABELS[selectedPeriod] || "Histórico completo").toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Cruce real de unidades vendidas, devoluciones, reembolsos e ingresos netos de Chazin Food
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Selector de Vista Temporal */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setVistaTemporal("historico")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                vistaTemporal === "historico"
                  ? "bg-white dark:bg-gray-700 text-[#D9383A] shadow-xs"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Mensual</span>
            </button>
            <button
              type="button"
              onClick={() => setVistaTemporal("semanal")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                vistaTemporal === "semanal"
                  ? "bg-white dark:bg-gray-700 text-[#D9383A] shadow-xs"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Semanal</span>
            </button>
            <button
              type="button"
              onClick={() => setVistaTemporal("fechas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                vistaTemporal === "fechas"
                  ? "bg-white dark:bg-gray-700 text-[#D9383A] shadow-xs"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>Por Fecha</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-[#D9383A] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>PDF con Logo</span>
          </button>
        </div>
      </div>

      {/* PANEL DE FILTROS ESPECÍFICOS DE REPORTES */}
      <div className="bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/70 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 cursor-pointer"
          >
            <Filter className="w-4 h-4 text-[#D9383A]" />
            <span>Filtros Específicos del Reporte</span>
            {activeFilterChips.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#D9383A] text-white text-[10px] font-extrabold">
                {activeFilterChips.length}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium">
              Analizando <strong className="text-gray-900 dark:text-gray-100">{kpis.totalVentasCount}</strong> ventas y{" "}
              <strong className="text-rose-600 dark:text-rose-400">{kpis.devolucionesAprobadasCount}</strong> devoluciones aplicadas
            </span>
            {activeFilterChips.length > 0 && (
              <button
                type="button"
                onClick={clearReportFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#D9383A] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div className="p-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Búsqueda específica */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Buscar por cliente, cédula, factura o producto
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Ej: VEN-0024, María, Hamburguesa Clásica..."
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A]"
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Fecha Desde */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Fecha inicio (Desde)
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  max={fechaFin || undefined}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A]"
                />
              </div>

              {/* Fecha Hasta */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Fecha fin (Hasta)
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio || undefined}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A]"
                />
              </div>

              {/* Producto específico */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Producto específico
                </label>
                <select
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A] cursor-pointer"
                >
                  <option value="Todos">Todos los productos ({productosDisponibles.length})</option>
                  {productosDisponibles.map((pName) => (
                    <option key={pName} value={pName}>
                      {pName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Canal / Origen */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Canal de Venta
                </label>
                <select
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A] cursor-pointer"
                >
                  <option value="Todos">Todos los canales</option>
                  <option value="ONLINE">Venta Online (Web)</option>
                  <option value="PUNTO_FISICO">Punto Físico (POS)</option>
                </select>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Método de Pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A] cursor-pointer"
                >
                  <option value="Todos">Todos los métodos</option>
                  <option value="Wompi">Wompi (En Línea)</option>
                  <option value="Efectivo">Efectivo (Punto Físico)</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>

              {/* Tipo de Entrega */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Modalidad de Entrega
                </label>
                <select
                  value={tipoEntrega}
                  onChange={(e) => setTipoEntrega(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A] cursor-pointer"
                >
                  <option value="Todos">Todas las modalidades</option>
                  <option value="Domicilio">Domicilio</option>
                  <option value="En Mesa">En Mesa</option>
                </select>
              </div>

              {/* Filtro de Devoluciones / Reembolsos */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Impacto de Devoluciones
                </label>
                <select
                  value={estadoDevolucion}
                  onChange={(e) => setEstadoDevolucion(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A] cursor-pointer"
                >
                  <option value="Todos">Todas las ventas</option>
                  <option value="con_devolucion">Solo ventas con devolución</option>
                  <option value="sin_devolucion">Solo ventas sin devolución</option>
                </select>
              </div>

              {/* Fidelidad Cliente */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Nivel de Fidelidad
                </label>
                <select
                  value={fidelidad}
                  onChange={(e) => setFidelidad(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A] cursor-pointer"
                >
                  <option value="Todos">Todos los niveles</option>
                  <option value="VIP">VIP (15%)</option>
                  <option value="Frecuente">Frecuente (10%)</option>
                  <option value="Regular">Regular (5%)</option>
                  <option value="Nuevo">Nuevo</option>
                </select>
              </div>

              {/* Rango de monto */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Rango de valor de venta (COP)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Mínimo ej: 15000"
                    value={montoMin}
                    onChange={(e) => setMontoMin(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A]"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Máximo ej: 120000"
                    value={montoMax}
                    onChange={(e) => setMontoMax(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-[#D9383A]"
                  />
                </div>
              </div>
            </div>

            {activeFilterChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-700 dark:text-gray-200"
                  >
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      onClick={chip.clear}
                      className="text-gray-400 hover:text-[#D9383A] cursor-pointer"
                      aria-label={`Quitar filtro ${chip.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4 TARJETAS DE CONCILIACIÓN FINANCIERA Y DE UNIDADES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* 1. Ventas Brutas */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Ventas Brutas
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
            ${kpis.ingresosBrutos.toLocaleString("es-CO")}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {kpis.unidadesBrutas} und. vendidas · {kpis.totalVentasCount}{" "}
            {kpis.totalVentasCount === 1 ? "venta" : "ventas"}
          </p>
        </div>

        {/* 2. Devoluciones y Reembolsos */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-4 border border-rose-200/80 dark:border-rose-900/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Devoluciones &amp; Reembolsos
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">
            {kpis.totalReembolsos > 0 ? `-$${kpis.totalReembolsos.toLocaleString("es-CO")}` : "$0"}
          </p>
          <p className="text-xs text-rose-700/80 dark:text-rose-300/80 font-medium">
            {kpis.unidadesDevueltas} und. devueltas · {kpis.devolucionesAprobadasCount}{" "}
            {kpis.devolucionesAprobadasCount === 1 ? "devolución" : "devoluciones"}
          </p>
        </div>

        {/* 3. Ingresos Netos Reales */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200/90 dark:border-emerald-900/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Ingresos Netos Reales
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            ${kpis.ingresosNetos.toLocaleString("es-CO")}
          </p>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 font-medium">
            {kpis.unidadesNetas} und. netas · Ticket neto ${kpis.ticketPromedioNeto.toLocaleString("es-CO")}
          </p>
        </div>

        {/* 4. Impacto y Tasa de Devolución */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tasa de Devolución
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
            {kpis.tasaDevolucionUnidades}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Financiero: {kpis.tasaReembolsoDinero}%
            {kpis.devolucionesPendientesCount > 0 && (
              <span className="ml-1 text-amber-600 dark:text-amber-400 font-bold">
                · {kpis.devolucionesPendientesCount} en revisión
              </span>
            )}
          </p>
        </div>
      </div>

      {/* CHART 1: Ingresos Netos vs. Devoluciones/Reembolsos */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              {chartConfig.barTitle}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Comparativo real entre ingresos netos retenidos y montos reembolsados por devoluciones
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
            COP ($) Neto
          </span>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={chartConfig.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
            <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <Tooltip
              content={<CustomChartTooltip mode="money" />}
              cursor={{ fill: "rgba(156, 163, 175, 0.15)" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="ventas" name="Ingresos Netos" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="reembolsos" name="Reembolsos" fill="#F43F5E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CHART 2: Volumen de Ventas y Unidades Netas */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              {chartConfig.lineTitle}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Seguimiento de transacciones y unidades netas descontando devoluciones confirmadas
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800/60">
            Transacciones &amp; Unidades
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartConfig.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
            <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
            <Tooltip
              content={<CustomChartTooltip mode="volume" />}
              cursor={{ stroke: "rgba(59, 130, 246, 0.4)", strokeWidth: 1.5 }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Line
              type="monotone"
              dataKey="cantidadVentas"
              name="Ventas"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#3B82F6" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="unidadesNetas"
              name="Unidades Netas"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#10B981" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* GRID: Top Productos (Netas) & Métodos de pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              Top Productos por Unidades Netas
            </p>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-200/60 dark:bg-gray-800 px-2 py-0.5 rounded-md">
              Descontando devoluciones
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              layout="vertical"
              data={reportData.productosMasVendidos}
              margin={{ top: 5, right: 12, left: 0, bottom: 22 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                label={{
                  value: "Unidades netas vendidas",
                  position: "insideBottom",
                  offset: -12,
                  fill: "#9CA3AF",
                  fontSize: 11,
                  fontWeight: 600
                }}
              />
              <YAxis
                dataKey="nombreLimpio"
                type="category"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                width={120}
                tickLine={false}
                tickFormatter={(val) => (val && val.length > 18 ? `${val.substring(0, 16)}...` : val)}
              />
              <Tooltip
                content={<CustomChartTooltip mode="product" />}
                cursor={{ fill: "rgba(156, 163, 175, 0.15)" }}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
              />
              <Bar dataKey="cantidadNeta" name="Unidades netas" radius={[0, 4, 4, 0]} barSize={18}>
                {reportData.productosMasVendidos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={productColors[index % productColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de pago */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              Distribución por Método de Pago
            </p>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-200/60 dark:bg-gray-800 px-2 py-0.5 rounded-md">
              Distribución 100%
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="w-full sm:w-[55%] max-w-[240px] mx-auto h-[190px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.metodosPago}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {reportData.metodosPago.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={paymentColors[index % paymentColors.length]}
                        style={{
                          filter: activeIndex === index ? "drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" : "none",
                          transition: "all 0.2s ease",
                          cursor: "pointer"
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider truncate max-w-[110px]">
                  {activeIndex !== null ? reportData.metodosPago[activeIndex].name : "Total Ventas"}
                </span>
                <span className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
                  {activeIndex !== null ? `${reportData.metodosPago[activeIndex].value}%` : `${reportData.totalMetodosCount}`}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {activeIndex !== null ? `${reportData.metodosPago[activeIndex].count} vnt.` : "ventas"}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 w-full sm:w-auto">
              {reportData.metodosPago.map((entry, index) => (
                <div
                  key={entry.name}
                  className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${
                    activeIndex === index ? "font-bold text-gray-800 dark:text-gray-100 scale-105" : "text-gray-600 dark:text-gray-400"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <span
                    className="w-3 h-3 rounded-full inline-block shrink-0"
                    style={{
                      backgroundColor: paymentColors[index % paymentColors.length],
                      transform: activeIndex === index ? "scale(1.2)" : "scale(1)",
                      transition: "all 0.2s ease"
                    }}
                  />
                  <span className="text-xs sm:text-sm">
                    {entry.name} <span className="font-bold">({entry.value}%)</span>
                    <span className="text-[11px] text-gray-400 block sm:inline sm:ml-1">
                      · {entry.count} {entry.count === 1 ? "venta" : "ventas"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DETALLADA DE CUADRE POR PRODUCTO: VENDIDAS - DEVUELTAS = NETAS */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xs">
        <div className="bg-gray-50 dark:bg-gray-800/70 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 dark:border-gray-800">
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              Cuadre de Unidades e Ingresos por Producto
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Descuento exacto de unidades devueltas y reembolsos por producto (Bruto − Devoluciones = Neto)
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {reportData.productosDetalle.length} productos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-800/40 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-2.5">Producto</th>
                <th className="px-3 py-2.5 text-right">Vendidas</th>
                <th className="px-3 py-2.5 text-right">Devueltas</th>
                <th className="px-3 py-2.5 text-right">Netas</th>
                <th className="px-3 py-2.5 text-right">Venta Bruta</th>
                <th className="px-3 py-2.5 text-right">Reembolsos</th>
                <th className="px-3 py-2.5 text-right">Venta Neta</th>
                <th className="px-4 py-2.5 text-right">% Part.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {reportData.productosDetalle.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No hay productos vendidos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                reportData.productosDetalle.map((p) => (
                  <tr key={p.nombreLimpio} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-gray-100">
                      {p.nombreLimpio}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                      {p.cantidadBruta}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-bold tabular-nums ${p.cantidadDevuelta > 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-400"}`}>
                      {p.cantidadDevuelta > 0 ? `-${p.cantidadDevuelta}` : "0"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {p.cantidadNeta}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                      ${p.ingresosBrutos.toLocaleString("es-CO")}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-bold tabular-nums ${p.montoReembolsado > 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-400"}`}>
                      {p.montoReembolsado > 0 ? `-$${p.montoReembolsado.toLocaleString("es-CO")}` : "$0"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      ${p.ingresosNetos.toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                      {p.porcentaje}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {reportData.productosDetalle.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100/90 dark:bg-gray-800/80 border-t-2 border-gray-200 dark:border-gray-700 font-extrabold text-gray-900 dark:text-gray-100">
                  <td className="px-4 py-3">TOTAL CONCILIADO</td>
                  <td className="px-3 py-3 text-right tabular-nums">{kpis.unidadesBrutas}</td>
                  <td className="px-3 py-3 text-right text-rose-600 dark:text-rose-400 tabular-nums">
                    {kpis.unidadesDevueltas > 0 ? `-${kpis.unidadesDevueltas}` : "0"}
                  </td>
                  <td className="px-3 py-3 text-right text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {kpis.unidadesNetas}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    ${kpis.ingresosBrutos.toLocaleString("es-CO")}
                  </td>
                  <td className="px-3 py-3 text-right text-rose-600 dark:text-rose-400 tabular-nums">
                    {kpis.totalReembolsos > 0 ? `-$${kpis.totalReembolsos.toLocaleString("es-CO")}` : "$0"}
                  </td>
                  <td className="px-3 py-3 text-right text-emerald-700 dark:text-emerald-400 tabular-nums">
                    ${kpis.ingresosNetos.toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">100%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* DETALLE DE DEVOLUCIONES Y REEMBOLSOS APLICADOS */}
      <div className="border border-rose-200/70 dark:border-rose-900/50 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xs">
        <div className="bg-rose-50/60 dark:bg-rose-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 dark:border-rose-900/50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                Devoluciones y Reembolsos Descontados del Reporte
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Solo se descuentan devoluciones en estado Aprobada o Completada
                {kpis.reembolsosRealizados > 0 || kpis.reembolsosPendientes > 0
                  ? ` · Realizados: $${kpis.reembolsosRealizados.toLocaleString("es-CO")} · Por desembolsar: $${kpis.reembolsosPendientes.toLocaleString("es-CO")}`
                  : ""}
              </p>
            </div>
          </div>
          {kpis.devolucionesPendientesCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{kpis.devolucionesPendientesCount} en revisión (no descontadas aún)</span>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-800/40 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-2.5">Devolución</th>
                <th className="px-3 py-2.5">Venta</th>
                <th className="px-3 py-2.5">Fecha</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Productos Devueltos</th>
                <th className="px-3 py-2.5">Resolución / Medio</th>
                <th className="px-3 py-2.5 text-center">Reembolso</th>
                <th className="px-4 py-2.5 text-right">Monto Descontado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {reportData.devolucionesAplicadas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                    No hay devoluciones ni reembolsos aprobados/completados para las ventas filtradas.
                  </td>
                </tr>
              ) : (
                reportData.devolucionesAplicadas.map((d) => (
                  <tr key={d.idDevolucion} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/15 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {d.codigoDevolucion}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {d.codigoVenta}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDateSafe(d.fecha, "—")}
                    </td>
                    <td className="px-3 py-2.5 text-gray-800 dark:text-gray-200">
                      {d.clienteNombre}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                      {d.productosResumen || `${d.unidadesDevueltas} und.`}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{d.tipoResolucion}</div>
                      <div className="text-[10.5px] text-gray-400">{d.metodoReembolso}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.estadoReembolso === "REALIZADO"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : d.estadoReembolso === "NO_APLICA"
                            ? "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {d.estadoReembolso === "NO_APLICA" ? "Reposición" : d.estadoReembolso}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                      {d.valorDevuelto > 0 ? `-$${d.valorDevuelto.toLocaleString("es-CO")}` : "$0"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESUMEN EJECUTIVO DEL PERÍODO */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-2xs">
        <div className="bg-gray-100/80 dark:bg-gray-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
            Resumen ejecutivo y cuadre contable del período
          </p>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            Chazin Food Analytics
          </span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
          {reportData.resumen.map((item) => (
            <div
              key={item.label}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 px-4 py-3 text-xs sm:text-sm"
            >
              <span className="text-gray-600 dark:text-gray-400 font-medium">{item.label}</span>
              <span
                className={`font-bold ${
                  item.tone === "positive"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : item.tone === "negative"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
