import { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  BarChart2,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  LayoutGrid,
  List,
  Search
} from "lucide-react";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { hasPrivilege } from "@/shared/utils/privilegiosUtils";
import { useGestionVentas } from "../hooks/useGestionVentas";
import { VentasStatsCards } from "../componentes/gestion/VentasStatsCards";
import { VentasTable } from "../componentes/gestion/VentasTable";
import { VentasHistorialCardsView } from "../componentes/gestion/VentasHistorialCardsView";
import { VentasHistorialTableView } from "../componentes/gestion/VentasHistorialTableView";
import { VentasBuscadorMulticriterio } from "../componentes/gestion/VentasBuscadorMulticriterio";
import { ChazinLoader } from "@/shared/components/ui/ChazinLoader";
import { formatTime12h, formatDateSafe, getColombiaDateISO, extractDateOnlyISO, COLOMBIA_TZ } from "@/shared/utils/dateUtils";
import { escapeHtml } from "@/shared/utils/htmlSanitizer";
import { exportTableToExcel } from "@/shared/utils/excelExport";
import {
  BRAND_REPORT_CSS,
  buildBrandReportHeaderHtml,
  buildBrandReportFooterHtml
} from "@/shared/utils/reportBranding";
import { ventasService } from "../servicios/ventasService";

const VentasReportesView = lazy(() => import("../componentes/gestion/VentasReportesView").then((m) => ({ default: m.VentasReportesView })));
const VentaDetalleModal = lazy(() => import("../componentes/gestion/VentaDetalleModal").then((m) => ({ default: m.VentaDetalleModal })));

export function GestionVentas() {
  const navigate = useNavigate();
  const {
    ventas,
    devoluciones,
    filteredVentas,
    pagination,
    serverPaginated,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    activeTab,
    setActiveTab,
    historialViewMode,
    setHistorialViewMode,
    stats,
    loading,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    selectedPeriod,
    setSelectedPeriod,
    filterFecha,
    setFilterFecha,
    filterFechaInicio,
    setFilterFechaInicio,
    filterFechaFin,
    setFilterFechaFin,
    filterMetodoPago,
    setFilterMetodoPago,
    filterOrigen,
    setFilterOrigen,
    filterTipoEntrega,
    setFilterTipoEntrega,
    filterFidelidad,
    setFilterFidelidad,
    montoMin,
    setMontoMin,
    montoMax,
    setMontoMax,
    clearAllFilters,
    hasActiveFilters,
    activeFiltersCount,
    replaceVentaInState,
    refetch,
    updateEstado,
    updateTiempoEntrega
  } = useGestionVentas();

  const { user } = useAuth();
  const canEdit = hasPrivilege(user, "Gestión de Ventas", "editar");
  const canCancel = hasPrivilege(user, "Gestión de Ventas", "eliminar");

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [selectedVentaDetail, setSelectedVentaDetail] = useState(null);

  const isCompletedSale = (v) => {
    const st = String(v?.estado || "").toLowerCase();
    const stEnt = String(v?.estadoEntrega || "").toLowerCase();
    if (st.includes("anul") || st.includes("cancel") || stEnt.includes("cancel")) return false;
    if (st.includes("pend") || st.includes("prepar") || stEnt.includes("pend") || stEnt.includes("prepar")) return false;
    return st.includes("complet") || st.includes("entreg") || st.includes("list") || stEnt.includes("entreg") || stEnt.includes("list");
  };

  const normalizeOnlineWompi = (v) => {
    const isOnline =
      (v.origen === "ONLINE" || v.tipoVenta === "DOMICILIO" || v.origenNombre === "Venta Online") &&
      !v.esDevolucion;
    const rawMetodo = String(v.metodoPago || "").trim();
    return {
      ...v,
      estado: "Completada",
      metodoPago: isOnline && (!rawMetodo || rawMetodo.toLowerCase() === "efectivo") ? "Wompi" : (rawMetodo || "Efectivo")
    };
  };

  const historialTotalCount = useMemo(
    () => (serverPaginated && activeTab === "historial" ? pagination.total : ventas.filter(isCompletedSale).length),
    [serverPaginated, activeTab, pagination.total, ventas]
  );

  // Historial de transacciones: únicamente ventas completadas (solo lectura, con método Wompi en ventas online)
  const historialVentas = useMemo(
    () => filteredVentas.filter(isCompletedSale).map(normalizeOnlineWompi),
    [filteredVentas]
  );

  const activeVentaDetail = useMemo(() => {
    if (!selectedVentaDetail) return null;
    const targetId = selectedVentaDetail.id || selectedVentaDetail.idVenta;
    return ventas.find((v) => (v.id || v.idVenta) === targetId) || selectedVentaDetail;
  }, [ventas, selectedVentaDetail]);

  const periodLabelMap = {
    hoy: "Hoy",
    "7_dias": "Últimos 7 días",
    este_mes: "Este mes",
    este_ano: "Este año",
    personalizado: "Todos los registros"
  };
  const periodText = periodLabelMap[selectedPeriod] || "Últimos 7 días";

  const handleViewDetail = (v) => {
    setSelectedVentaDetail(v);
  };

  const resolveFullExportSource = async () => {
    if (!serverPaginated) {
      return activeTab === "historial" ? historialVentas : filteredVentas;
    }
    try {
      const fullRes = await ventasService.getVentas({
        periodo: selectedPeriod,
        ...(filterEstado && filterEstado !== "Todos" ? { estado: filterEstado } : (activeTab === "historial" ? { estado: "Completada" } : {})),
        ...(filterOrigen && filterOrigen !== "Todos" ? { origen: filterOrigen } : {}),
        ...(filterTipoEntrega && filterTipoEntrega !== "Todos" ? { tipoEntrega: filterTipoEntrega } : {}),
        ...(filterMetodoPago && filterMetodoPago !== "Todos" ? { metodoPago: filterMetodoPago } : {}),
        ...(searchTerm && searchTerm.trim() ? { search: searchTerm.trim() } : {})
      });
      const fullArr = Array.isArray(fullRes) ? fullRes : (Array.isArray(fullRes?.data) ? fullRes.data : []);
      return activeTab === "historial" ? fullArr.filter(isCompletedSale).map(normalizeOnlineWompi) : fullArr;
    } catch {
      return activeTab === "historial" ? historialVentas : filteredVentas;
    }
  };

  const getRefundForVenta = (ventaObj) => {
    const vid = Number(ventaObj?.idVenta ?? ventaObj?.id ?? 0);
    if (!vid || !Array.isArray(devoluciones)) return 0;
    const sum = devoluciones
      .filter((d) => {
        const est = String(d?.estado || "").toUpperCase();
        const isMoney = String(d?.tipoResolucion || "").toLowerCase().includes("dinero");
        return Number(d?.idVenta || 0) === vid && (est === "APROBADA" || est === "COMPLETADA") && isMoney;
      })
      .reduce((acc, d) => acc + Math.max(0, Number(d?.valorDevuelto || 0)), 0);
    return Math.min(Number(ventaObj?.total || 0), Math.round(sum));
  };

  // Export to Excel (.xlsx) con todos los datos filtrados actualmente (incluyendo reembolsos y monto neto)
  const handleExportExcel = async () => {
    const exportSource = await resolveFullExportSource();
    const headers = [
      "N° Factura / Venta",
      "Cliente",
      "Fecha",
      "Horario",
      "Entrega",
      "Método de Pago",
      "Subtotal (COP)",
      "Descuento",
      "Total Bruto (COP)",
      "Reembolso (COP)",
      "Total Neto (COP)",
      "Estado"
    ];

    const rows = exportSource.map((v) => {
      const isOnline =
        (v.origen === "ONLINE" || v.tipoVenta === "DOMICILIO" || v.origenNombre === "Venta Online") &&
        !v.esDevolucion;
      const rawMetodo = String(v.metodoPago || "").trim();
      const metodoLabel =
        isOnline && (!rawMetodo || rawMetodo.toLowerCase() === "efectivo")
          ? "Wompi"
          : (rawMetodo || "Efectivo");
      const bruto = Number(v.total || v.subtotal || 0);
      const reembolso = getRefundForVenta(v);
      const neto = Math.max(0, bruto - reembolso);
      return [
        v.numeroVenta || v.codigoPedido || `PED-${String(v.id).padStart(3, "0")}`,
        v.clienteNombre || v.cliente || "Cliente General",
        (v.fecha || v.fechaVenta) ? (extractDateOnlyISO(v.fecha || v.fechaVenta) || "—") : "—",
        formatTime12h(v.horario || v.fecha || v.fechaVenta, "—"),
        v.tipoEntrega || "En Mesa",
        metodoLabel,
        Number(v.subtotal || v.total || 0),
        v.descuentoPorcentaje ? `${v.descuentoPorcentaje}%` : "0%",
        bruto,
        reembolso > 0 ? -reembolso : 0,
        neto,
        v.estado || "Completada"
      ];
    });

    await exportTableToExcel({
      sheetName: "Historial de Ventas",
      fileName: `Historial_Ventas_ChazinFood_${selectedPeriod}_${getColombiaDateISO()}.xlsx`,
      headers,
      rows,
      colWidths: [22, 24, 14, 16, 14, 18, 16, 12, 18, 18, 18, 16]
    });
  };

  // Export to Printable PDF Window con logo corporativo y cuadre Bruto / Reembolsos / Neto
  const handleExportPDF = async () => {
    const exportSource = await resolveFullExportSource();
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let totalBruto = 0;
    let totalReembolsos = 0;
    const rowsHtml = exportSource
      .map((v) => {
        const isOnline =
          (v.origen === "ONLINE" || v.tipoVenta === "DOMICILIO" || v.origenNombre === "Venta Online") &&
          !v.esDevolucion;
        const rawMetodo = String(v.metodoPago || "").trim();
        const metodoLabel =
          isOnline && (!rawMetodo || rawMetodo.toLowerCase() === "efectivo")
            ? "Wompi"
            : (rawMetodo || "Efectivo");
        const bruto = Number(v.total || v.subtotal || 0);
        const reemb = getRefundForVenta(v);
        const neto = Math.max(0, bruto - reemb);
        if (!v.esDevolucion) {
          totalBruto += bruto;
          totalReembolsos += reemb;
        }
        return `
        <tr>
          <td><strong>${escapeHtml(v.numeroVenta || v.codigoPedido || `PED-${String(v.id).padStart(3, "0")}`)}</strong></td>
          <td>${escapeHtml(v.clienteNombre || v.cliente || "Cliente General")}</td>
          <td>${escapeHtml(formatDateSafe(v.fecha || v.fechaVenta, "—"))} (${escapeHtml(formatTime12h(v.horario || v.fecha || v.fechaVenta, "—"))})</td>
          <td>${escapeHtml(v.tipoEntrega || "En Mesa")}</td>
          <td>${escapeHtml(metodoLabel)}</td>
          <td class="num">$${escapeHtml(bruto.toLocaleString("es-CO"))}</td>
          <td class="num ${reemb > 0 ? "neg" : ""}">${reemb > 0 ? `-$${escapeHtml(reemb.toLocaleString("es-CO"))}` : "$0"}</td>
          <td class="num pos">$${escapeHtml(neto.toLocaleString("es-CO"))}</td>
          <td><span class="badge">${escapeHtml(v.estado || "Completada")}</span></td>
        </tr>
      `;
      })
      .join("");

    const totalNeto = Math.max(0, totalBruto - totalReembolsos);
    const activeFilterList = [
      filterFechaInicio || filterFechaFin ? `Rango: ${filterFechaInicio || "Inicio"} a ${filterFechaFin || "Hoy"}` : null,
      filterOrigen !== "Todos" ? `Canal: ${filterOrigen}` : null,
      filterMetodoPago !== "Todos" ? `Pago: ${filterMetodoPago}` : null,
      filterTipoEntrega !== "Todos" ? `Entrega: ${filterTipoEntrega}` : null,
      filterFidelidad !== "Todos" ? `Fidelidad: ${filterFidelidad}` : null,
      searchTerm.trim() ? `Búsqueda: "${searchTerm.trim()}"` : null
    ].filter(Boolean);

    const headerHtml = buildBrandReportHeaderHtml({
      title: "Historial de Transacciones y Ventas",
      subtitle: periodText,
      metaItems: [
        { label: "Registros", value: `${exportSource.length}` },
        { label: "Total Neto", value: `$${totalNeto.toLocaleString("es-CO")} COP` }
      ],
      filtersSummary: activeFilterList.length > 0 ? activeFilterList.join(" · ") : `Período: ${periodText}`
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Historial de Ventas - Chazin Food</title>
          <style>${BRAND_REPORT_CSS}</style>
        </head>
        <body>
          ${headerHtml}
          <table>
            <thead>
              <tr>
                <th>N° Venta</th>
                <th>Cliente</th>
                <th>Fecha &amp; Horario</th>
                <th>Entrega</th>
                <th>Método de Pago</th>
                <th class="num">Total Bruto</th>
                <th class="num">Reembolso</th>
                <th class="num">Total Neto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="5">TOTAL CONCILIADO (${escapeHtml(exportSource.length)} registros)</td>
                <td class="num">$${escapeHtml(totalBruto.toLocaleString("es-CO"))}</td>
                <td class="num neg">${totalReembolsos > 0 ? `-$${escapeHtml(totalReembolsos.toLocaleString("es-CO"))}` : "$0"}</td>
                <td class="num pos">$${escapeHtml(totalNeto.toLocaleString("es-CO"))}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          ${buildBrandReportFooterHtml("Sistema de Gestión Comercial y Ventas")}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.opener = null;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Props comunes para el buscador multicriterio
  const buscadorProps = {
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    selectedPeriod,
    setSelectedPeriod,
    filterFecha,
    setFilterFecha,
    filterFechaInicio,
    setFilterFechaInicio,
    filterFechaFin,
    setFilterFechaFin,
    filterMetodoPago,
    setFilterMetodoPago,
    filterOrigen,
    setFilterOrigen,
    filterTipoEntrega,
    setFilterTipoEntrega,
    filterFidelidad,
    setFilterFidelidad,
    montoMin,
    setMontoMin,
    montoMax,
    setMontoMax,
    clearAllFilters,
    hasActiveFilters,
    activeFiltersCount,
    totalRecords: ventas.length,
    filteredRecords: filteredVentas.length
  };

  return (
    <div className="p-3 sm:p-4 lg:p-5 xl:p-6 w-full max-w-full space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] dark:text-gray-100">
            Gestión de Ventas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monitoreo de ventas, historial completo y análisis comercial
          </p>
        </div>
        <button
          onClick={() => navigate("/ventas/pos")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F05454] hover:bg-[#d84040] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Crear venta</span>
        </button>
      </div>

      {/* Top 4 Stats Cards */}
      <VentasStatsCards ventas={ventas} devoluciones={devoluciones} stats={stats} selectedPeriod={selectedPeriod} />

      {/* Main Navigation Container */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-3 sm:p-4 lg:p-5 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5">
        {/* Tabs Header con Selector de Período Integrado */}
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6 sm:gap-8 -mb-px overflow-x-auto no-scrollbar touch-scroll-x">

            <button
              onClick={() => setActiveTab("pedidos_pagados")}
              className={`flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "pedidos_pagados"
                  ? "text-[#F05454] border-b-2 border-[#F05454]"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 ${
                  activeTab === "pedidos_pagados" ? "text-[#F05454]" : "text-gray-400"
                }`}
              />
              <span>Ventas</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("historial");
                if (filterEstado !== "Todos") setFilterEstado("Todos");
              }}
              className={`flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "historial"
                  ? "text-[#F05454] border-b-2 border-[#F05454]"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Clock
                className={`w-4 h-4 ${
                  activeTab === "historial" ? "text-[#F05454]" : "text-gray-400"
                }`}
              />
              <span>Historial</span>
            </button>

            <button
              onClick={() => setActiveTab("reportes")}
              className={`flex items-center gap-2 pb-3.5 text-sm font-semibold transition-colors relative cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "reportes"
                  ? "text-[#F05454] border-b-2 border-[#F05454]"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <BarChart2
                className={`w-4 h-4 ${
                  activeTab === "reportes" ? "text-[#F05454]" : "text-gray-400"
                }`}
              />
              <span>Reportes</span>
            </button>
          </div>

          {/* Selector de Período Global (Afecta las Ventas, Historial y los Reportes) */}
          <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-2xs shrink-0 w-full md:w-auto max-w-full overflow-x-auto no-scrollbar touch-scroll-x self-start md:self-auto">
            {[
              { id: "hoy", label: "Hoy" },
              { id: "7_dias", label: "7 días" },
              { id: "este_mes", label: "Este mes" },
              { id: "este_ano", label: "Este año" },
              { id: "personalizado", label: "Histórico" }
            ].map((p) => {
              const isSelected = selectedPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? "bg-[#F05454] text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/80 dark:hover:bg-gray-700/60"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: REPORTES */}
        {activeTab === "reportes" ? (
          <Suspense fallback={<ChazinLoader text="CARGANDO REPORTES Y GRÁFICAS" size="md" />}>
            <VentasReportesView ventas={ventas} devoluciones={devoluciones} selectedPeriod={selectedPeriod} />
          </Suspense>
        ) : activeTab === "historial" ? (
          /* TAB 2: HISTORIAL */
          <div className="space-y-6 pt-1">
            {/* Historial Header: Título, Vista Toggle (Cards vs Tabla) y Exportar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Historial de Transacciones
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Período actual: <span className="font-semibold">{periodText}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Switch de Vistas: Tarjetas vs Tabla */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200/60 dark:border-gray-700/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setHistorialViewMode("cards")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      historialViewMode === "cards"
                        ? "bg-white dark:bg-gray-700 text-[#F05454] shadow-xs"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    title="Vista en Tarjetas"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tarjetas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistorialViewMode("table")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      historialViewMode === "table"
                        ? "bg-white dark:bg-gray-700 text-[#F05454] shadow-xs"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    title="Vista en Tabla"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tabla</span>
                  </button>
                </div>

                {/* Menú Exportar */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setExportMenuOpen(!exportMenuOpen)}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span>Exportar</span>
                  </button>

                  {exportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-30 py-1.5 overflow-hidden">
                      <button
                        onClick={() => {
                          handleExportExcel();
                          setExportMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Exportar a Excel (.xlsx)</span>
                      </button>
                      <button
                        onClick={() => {
                          handleExportPDF();
                          setExportMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-gray-100 dark:border-gray-700/60"
                      >
                        <FileText className="w-4 h-4 text-rose-600" />
                        <span>Exportar a PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buscador Multicriterio en Historial */}
            <VentasBuscadorMulticriterio
              {...buscadorProps}
              isHistorial={true}
              totalRecords={historialTotalCount}
              filteredRecords={historialVentas.length}
            />

            {/* Visualización de Resultados en Historial (Solo ventas completadas) */}
            {loading ? (
              <ChazinLoader text="CARGANDO HISTORIAL DE VENTAS" size="md" />
            ) : historialVentas.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#F05454] flex items-center justify-center mb-1">
                  <Search className="w-7 h-7 stroke-[1.5]" />
                </div>
                <p className="text-base font-bold text-gray-800 dark:text-gray-100">
                  No se encontraron ventas completadas para los criterios seleccionados
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                  {searchTerm ? `No hay coincidencias para "${searchTerm}". ` : ""}
                  Prueba cambiando o eliminando los filtros aplicados.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#F05454] hover:bg-[#d84040] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                )}
              </div>
            ) : historialViewMode === "table" ? (
              <VentasHistorialTableView
                ventas={historialVentas}
                onViewDetail={handleViewDetail}
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={serverPaginated ? pagination.total : historialVentas.length}
                serverPaginated={serverPaginated}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            ) : (
              <VentasHistorialCardsView
                ventas={historialVentas}
                onViewDetail={handleViewDetail}
              />
            )}
          </div>
        ) : (
          /* TAB 3: PEDIDOS PAGADOS */
          <div className="space-y-6 pt-1">
            {/* Buscador Multicriterio en Pedidos Pagados */}
            <VentasBuscadorMulticriterio
              {...buscadorProps}
              totalRecords={serverPaginated ? pagination.total : ventas.length}
              filteredRecords={serverPaginated ? pagination.total : filteredVentas.length}
            />

            {/* Content View: Table or Empty State */}
            {loading ? (
              <ChazinLoader text="CARGANDO GESTIÓN DE VENTAS" size="md" />
            ) : filteredVentas.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#F05454] flex items-center justify-center mb-1">
                  <Search className="w-7 h-7 stroke-[1.5]" />
                </div>
                <p className="text-base font-bold text-gray-800 dark:text-gray-100">
                  No se encontraron ventas con los criterios aplicados
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                  {searchTerm ? `No hay resultados para "${searchTerm}". ` : ""}
                  Intenta buscar por otro dato o restablece los filtros.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#F05454] hover:bg-[#d84040] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Restablecer filtros y ver todas las ventas
                  </button>
                )}
              </div>
            ) : (
              <VentasTable
                ventas={filteredVentas}
                onViewDetail={handleViewDetail}
                onUpdateEstado={canEdit ? updateEstado : null}
                canEdit={canEdit}
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={serverPaginated ? pagination.total : filteredVentas.length}
                serverPaginated={serverPaginated}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {!!selectedVentaDetail && (
        <Suspense fallback={null}>
          <VentaDetalleModal
            isOpen={!!selectedVentaDetail}
            onClose={() => setSelectedVentaDetail(null)}
            venta={activeVentaDetail}
            onUpdateTiempoEntrega={canEdit ? updateTiempoEntrega : null}
            onVentaUpdated={(updated) => {
              replaceVentaInState(updated);
              setSelectedVentaDetail(updated);
              refetch();
            }}
            canEdit={canEdit}
          />
        </Suspense>
      )}
    </div>
  );
}
