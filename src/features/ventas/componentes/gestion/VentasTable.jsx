import { useState } from "react";
import { Eye, TrendingUp, Calendar, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Globe, Store } from "lucide-react";
import { formatNombreCompleto } from "@/shared/utils/validationUtils";
import { FidelidadBadge } from "@/shared/components/ui/FidelidadBadge";
import FoodIcon from "@/shared/components/ui/FoodIcon";
import { resolveHybridDeliveryEstimate, formatColombiaTime } from "@/features/produccion/utils/tiempoProduccionUtils";

function formatDateSafe(dateVal, fallback = "Hoy") {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal).slice(0, 10) || fallback;
    return d.toLocaleDateString("es-CO", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" });
  } catch (e) {
    return String(dateVal).slice(0, 10) || fallback;
  }
}

function formatTimeSafe(dateVal, fallbackHorario = "12:30 PM") {
  const col = formatColombiaTime(dateVal);
  if (col) return col;
  return fallbackHorario;
}

export function VentasTable({
  ventas = [],
  onViewDetail,
  onUpdateEstado,
  canEdit = true,
  currentPage: controlledPage,
  pageSize: controlledPageSize,
  totalItems: controlledTotalItems,
  onPageChange,
  onPageSizeChange,
  serverPaginated = false
}) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(5);

  const currentPage = controlledPage !== undefined ? Number(controlledPage) || 1 : internalPage;
  const pageSize = controlledPageSize !== undefined ? Number(controlledPageSize) || 5 : internalPageSize;
  const totalRecords = serverPaginated && controlledTotalItems !== undefined ? Number(controlledTotalItems) : ventas.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedVentas = serverPaginated ? ventas : ventas.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (onPageChange) onPageChange(newPage);
      else setInternalPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    if (onPageSizeChange) onPageSizeChange(newSize);
    else {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
  };

  const getEntregaBadge = (tipo) => {
    const tipoNormalized = (tipo || "").toLowerCase();
    if (tipoNormalized.includes("domicilio") || tipoNormalized.includes("delivery")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
          <FoodIcon name="delivery" size={13} className="text-blue-600 dark:text-blue-400" />
          <span>Domicilio</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
        <FoodIcon name="table" size={13} className="text-purple-600 dark:text-purple-400" />
        <span>En Mesa</span>
      </span>
    );
  };

  const getMetodoIcon = (metodo, ventaObj = null) => {
    const metodoNormalized = (metodo || "").toLowerCase().trim();
    const isOnline =
      ventaObj &&
      (ventaObj.origen === "ONLINE" ||
        ventaObj.tipoVenta === "DOMICILIO" ||
        ventaObj.origenNombre === "Venta Online") &&
      !ventaObj.esDevolucion;

    if (
      metodoNormalized.includes("wompi") ||
      metodoNormalized.includes("pasarela") ||
      metodoNormalized.includes("pse") ||
      (isOnline && (!metodoNormalized || metodoNormalized === "efectivo"))
    ) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60">
          <FoodIcon name="card" size={13} className="text-indigo-600" />
          <span>Wompi</span>
        </span>
      );
    }
    if (metodoNormalized.includes("tarjeta")) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <FoodIcon name="card" size={13} className="text-gray-500" />
          <span>Tarjeta</span>
        </span>
      );
    }
    if (metodoNormalized.includes("transfer") || metodoNormalized.includes("nequi") || metodoNormalized.includes("davi")) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <FoodIcon name="mobile" size={13} className="text-gray-500" />
          <span>Transferencia</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <FoodIcon name="cash" size={13} className="text-emerald-600" />
        <span>Efectivo</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile / Tablet Cards (< lg) */}
      <div className="lg:hidden space-y-3">
        {paginatedVentas.map((v) => {
          const rawName = typeof v.cliente === "string" ? v.cliente : (v.clienteNombre || v.cliente?.nombre || "Cliente General");
          const clienteNombre = formatNombreCompleto(rawName) || "Cliente General";
          const codigoPedido = v.numeroVenta || v.codigoPedido || `PED-${String(v.id).padStart(3, "0")}`;
          const initial = clienteNombre.trim().charAt(0).toUpperCase() || "C";
          const descPct = Number(v.descuentoPorcentaje || 0);
          const origPrice = Number(v.subtotal || v.precioOriginal || (descPct > 0 && v.total ? Math.round(v.total / (1 - (descPct / 100))) : (v.subtotal > v.total ? v.subtotal : v.total)));
          const hasDiscount = (descPct > 0) || (origPrice > Number(v.total || 0)) || (Number(v.montoDescuento || 0) > 0);
          const hybridEst = resolveHybridDeliveryEstimate(v);

          return (
            <div key={v.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-sm text-gray-900 dark:text-gray-100">{codigoPedido}</span>
                      {v.esDevolucion && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          Reposición
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" title={clienteNombre}>{clienteNombre}</p>
                  </div>
                </div>
                {v.origen === "ONLINE" || v.tipoVenta === "DOMICILIO" || v.origenNombre === "Venta Online" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 shrink-0">
                    <Globe className="w-3 h-3" /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 shrink-0">
                    <Store className="w-3 h-3" /> POS
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl p-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {getEntregaBadge(v.tipoEntrega)}
                  {getMetodoIcon(v.metodoPago, v)}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                  {formatDateSafe(v.fecha || v.fechaVenta, "Hoy")} · {formatTimeSafe(v.fecha || v.fechaVenta, v.horario)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3 text-amber-500" />
                    {hybridEst.effectiveEstimate} ({hybridEst.isManual ? "Manual" : "Auto"})
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    {hasDiscount && <span className="text-xs line-through text-gray-400">${origPrice.toLocaleString("es-CO")}</span>}
                    <span className="text-base font-black text-gray-900 dark:text-gray-100">
                      ${Number(v.total || v.subtotal || 0).toLocaleString("es-CO")} COP
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDetail && onViewDetail(v)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#F05454] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detalle</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (lg+) — sin scroll horizontal */}
      <div className="hidden lg:block w-full overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs">
        <table className="w-full table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-2.5 py-2.5 w-[10%]">ID</th>
              <th className="px-2.5 py-2.5 w-[20%]">CLIENTE</th>
              <th className="px-2.5 py-2.5 w-[12%]">ORIGEN</th>
              <th className="px-2.5 py-2.5 w-[11%]">FECHA & HORA</th>
              <th className="px-2.5 py-2.5 w-[14%]">ENTREGA & TIEMPO</th>
              <th className="px-2.5 py-2.5 w-[9%]">MÉTODO</th>
              <th className="px-2.5 py-2.5 w-[12%]">TOTAL</th>
              <th className="px-2.5 py-2.5 w-[12%] text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {paginatedVentas.map((v) => {
              const rawName = typeof v.cliente === "string" ? v.cliente : (v.clienteNombre || v.cliente?.nombre || "Cliente General");
              const clienteNombre = formatNombreCompleto(rawName) || "Cliente General";
              const codigoPedido = v.numeroVenta || v.codigoPedido || `PED-${String(v.id).padStart(3, "0")}`;
              const initial = clienteNombre.trim().charAt(0).toUpperCase() || "C";
              const descPct = Number(v.descuentoPorcentaje || 0);
              const origPrice = Number(v.subtotal || v.precioOriginal || (descPct > 0 && v.total ? Math.round(v.total / (1 - (descPct / 100))) : (v.subtotal > v.total ? v.subtotal : v.total)));
              const hasDiscount = (descPct > 0) || (origPrice > Number(v.total || 0)) || (Number(v.montoDescuento || 0) > 0);

              return (
                <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* N° Factura / Pedido */}
                  <td className="px-2.5 py-2.5 align-middle">
                    <div className="font-bold text-gray-900 dark:text-gray-100 flex flex-col items-start gap-0.5 min-w-0">
                      <span className="truncate max-w-full text-xs xl:text-sm" title={codigoPedido}>{codigoPedido}</span>
                      {v.esDevolucion && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 truncate max-w-full">
                          Reposición
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cliente con Avatar e Insignia — truncado seguro ante nombres exageradamente largos */}
                  <td className="px-2.5 py-2.5 align-middle overflow-hidden max-w-0">
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      <div className="w-7 h-7 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                        {initial}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                        <span
                          className="font-bold text-gray-900 dark:text-gray-100 text-xs xl:text-sm truncate block min-w-0 flex-1"
                          title={clienteNombre}
                        >
                          {clienteNombre}
                        </span>
                        {(!clienteNombre.toLowerCase().includes("mostrador") && v.idCliente !== 26 && v.clienteFidelidad?.tieneCuenta && v.clienteFidelidad?.tipo && ["Regular", "Frecuente", "VIP"].includes(v.clienteFidelidad.tipo)) && (
                          <span className="shrink-0">
                            <FidelidadBadge
                              tipo={v.clienteFidelidad.tipo}
                              descuento={v.clienteFidelidad.descuentoPorcentaje}
                              size="sm"
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Origen de la Venta */}
                  <td className="px-2 py-2.5 align-middle">
                    {v.origen === "ONLINE" || v.tipoVenta === "DOMICILIO" || v.origenNombre === "Venta Online" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 shadow-2xs max-w-full truncate">
                        <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">Online</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs max-w-full truncate">
                        <Store className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">Punto Físico</span>
                      </span>
                    )}
                  </td>

                  {/* Fecha y Hora juntas */}
                  <td className="px-2 py-2.5 align-middle">
                    <div className="flex flex-col text-xs leading-snug min-w-0">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {formatDateSafe(v.fecha || v.fechaVenta, "Hoy")}
                      </span>
                      <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
                        {formatTimeSafe(v.fecha || v.fechaVenta, v.horario)}
                      </span>
                    </div>
                  </td>

                  {/* Entrega & Tiempo Estimado Integrados (Híbrido: Automático + Manual) */}
                  <td className="px-2 py-2.5 align-middle">
                    {(() => {
                      const hybridEst = resolveHybridDeliveryEstimate(v);
                      return (
                        <div className="flex flex-col items-start gap-1 min-w-0">
                          {getEntregaBadge(v.tipoEntrega)}
                          <span
                            className={`inline-flex items-center gap-1 text-[10.5px] font-semibold max-w-full truncate ${
                              hybridEst.effectiveEstimate === "Entregado"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : hybridEst.effectiveEstimate.toLowerCase().includes("listo")
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-300"
                            }`}
                            title={hybridEst.detalleCalculo}
                          >
                            <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                            <span className="truncate">{hybridEst.effectiveEstimate}</span>
                            <span className="text-[9px] text-gray-400 font-bold shrink-0">
                              {hybridEst.isManual ? "(M)" : "(A)"}
                            </span>
                          </span>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Método de Pago */}
                  <td className="px-2 py-2.5 align-middle overflow-hidden">{getMetodoIcon(v.metodoPago, v)}</td>

                  {/* Monto Total con Descuento */}
                  <td className="px-2 py-2.5 align-middle">
                    {hasDiscount ? (
                      <div className="flex flex-col items-start text-xs leading-tight min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="line-through text-[10px] text-gray-400 font-normal">
                            ${origPrice.toLocaleString("es-CO")}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded">
                            -{descPct || Math.round(((origPrice - v.total) / origPrice) * 100)}%
                          </span>
                        </div>
                        <span className="font-extrabold text-gray-900 dark:text-gray-100 text-xs xl:text-sm truncate">
                          ${Number(v.total).toLocaleString("es-CO")}
                        </span>
                      </div>
                    ) : (
                      <span className="font-extrabold text-gray-900 dark:text-gray-100 text-xs xl:text-sm truncate block">
                        ${Number(v.total || v.subtotal || 0).toLocaleString("es-CO")}
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-2 py-2.5 align-middle text-right">
                    <div className="inline-flex items-center justify-end gap-1 flex-wrap">
                      <button
                        onClick={() => onViewDetail && onViewDetail(v)}
                        title="Ver Detalle de la Venta"
                        className="px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[#F05454] hover:text-red-600 transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-xs"
                      >
                        <Eye className="w-4 h-4 text-[#F05454] shrink-0" />
                        <span className="hidden xl:inline">Detalle</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>registros</span>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, totalRecords)} de {totalRecords} registros
            </span>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={safePage === 1}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-0.5 bg-[#F05454] text-white font-bold rounded-md">
                {safePage}
              </span>
              <button
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={safePage === totalPages}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
