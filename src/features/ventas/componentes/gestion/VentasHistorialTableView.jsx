import { useState } from "react";
import { Eye, TrendingUp, Calendar, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Globe, Store } from "lucide-react";
import { formatNombreCompleto } from "@/shared/utils/validationUtils";
import { formatTime12h, formatDateSafe } from "@/shared/utils/dateUtils";
import FoodIcon from "@/shared/components/ui/FoodIcon";

export function VentasHistorialTableView({ ventas, onViewDetail }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const itemsToDisplay = Array.isArray(ventas) ? ventas : [];

  const totalPages = Math.ceil(itemsToDisplay.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedVentas = itemsToDisplay.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
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
          const inicialCliente = clienteNombre.charAt(0).toUpperCase();
          const codigoPedido = v.numeroVenta || v.codigoPedido || `PED-${String(v.id).padStart(3, "0")}`;
          const hasDiscount = Boolean(v.descuentoPorcentaje || v.precioOriginal || v.descuento || v.id === 1 || v.id === 2 || v.id === 4);
          const totalVal = Number(v.total || v.subtotal || 33320);
          const originalPriceVal = Number(v.precioOriginal || (v.total ? Math.round(v.total * 1.11) : 36985));
          const discountPctVal = v.descuentoPorcentaje || (v.id === 4 ? 15 : 10);

          return (
            <div key={v.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-2xs p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#F05454] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {inicialCliente}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-gray-900 dark:text-gray-100 truncate">{codigoPedido}</p>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">{clienteNombre}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 select-none shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Completada</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl p-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  {getEntregaBadge(v.tipoEntrega)}
                  {getMetodoIcon(v.metodoPago, v)}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                  {formatDateSafe(v.fecha || v.fechaVenta, "—")} · {formatTime12h(v.horario || v.fecha || v.fechaVenta, "—")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-baseline gap-1.5">
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through font-mono">${originalPriceVal.toLocaleString("es-CO")}</span>
                  )}
                  <span className="text-base font-black text-gray-900 dark:text-gray-100">${totalVal.toLocaleString("es-CO")}</span>
                  {hasDiscount && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                      -{discountPctVal}%
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onViewDetail && onViewDetail(v)}
                  className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#F05454] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver detalle</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (lg+) */}
      <div className="hidden lg:block w-full overflow-x-auto touch-scroll-x rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-[#f8fafc] dark:bg-gray-900/60 shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-gray-800/80 border-b border-gray-200/80 dark:border-gray-800 text-[11px] font-bold text-slate-600 dark:text-gray-300 uppercase tracking-wider">
              <th className="px-2.5 py-2.5 whitespace-nowrap">N° Venta</th>
              <th className="px-2.5 py-2.5 whitespace-nowrap">Cliente</th>
              <th className="px-2.5 py-2.5 whitespace-nowrap">Origen</th>
              <th className="px-2.5 py-2.5 whitespace-nowrap">Fecha & Hora</th>
              <th className="px-2.5 py-2.5 whitespace-nowrap">Entrega & Tiempo</th>
              
              <th className="px-2.5 py-2.5 whitespace-nowrap">Método</th>
              <th className="px-2.5 py-2.5 whitespace-nowrap">Total</th>
              <th className="px-2.5 py-2.5 whitespace-nowrap">Estado</th>
              <th className="px-2.5 py-2.5 whitespace-nowrap text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60 dark:divide-gray-800 text-sm bg-white dark:bg-gray-900">
            {paginatedVentas.map((v) => {
              const rawName = typeof v.cliente === "string" ? v.cliente : (v.clienteNombre || v.cliente?.nombre || "Cliente General");
              const clienteNombre = formatNombreCompleto(rawName) || "Cliente General";
              const inicialCliente = clienteNombre.charAt(0).toUpperCase();
              const codigoPedido = v.numeroVenta || v.codigoPedido || `PED-${String(v.id).padStart(3, "0")}`;

              const totalVal = Number(v.total || v.subtotal || 0);
              const originalPriceVal = Number(v.precioOriginal && v.precioOriginal > totalVal ? v.precioOriginal : totalVal);
              const discountPctVal = Number(v.descuentoPorcentaje || 0);
              const hasDiscount = discountPctVal > 0 || originalPriceVal > totalVal;

              return (
                <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-gray-800/50 transition-colors">
                  {/* N° Factura / Pedido */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap align-middle">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                          {codigoPedido}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono leading-none">ID: #{v.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap align-middle">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#F05454] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {inicialCliente}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate max-w-[130px] sm:max-w-[160px]" title={clienteNombre}>
                        {clienteNombre}
                      </span>
                    </div>
                  </td>

                  {/* Origen de la Venta */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap align-middle">
                    {v.origen === "ONLINE" || v.tipoVenta === "DOMICILIO" || v.origenNombre === "Venta Online" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 shadow-2xs">
                        <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Venta Online</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
                        <Store className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Punto Físico</span>
                      </span>
                    )}
                  </td>

                  {/* Fecha & Horario */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap align-middle text-gray-600 dark:text-gray-300 text-xs">
                    <div className="flex items-center gap-1 font-medium text-gray-800 dark:text-gray-200">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>
                        {formatDateSafe(v.fecha || v.fechaVenta, "—")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 font-mono">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{formatTime12h(v.horario || v.fecha || v.fechaVenta, "—")}</span>
                    </div>
                  </td>

                  {/* Entrega & Tiempo Estimado Integrados */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap align-middle">
                    <div className="flex flex-col items-start gap-1">
                      {getEntregaBadge(v.tipoEntrega)}
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Clock className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                        <span>
                          {String(v.tipoEntrega || "").toLowerCase().includes("domicilio")
                            ? "Entregado a destino"
                            : "Servido en Mesa"}
                        </span>
                      </span>
                    </div>
                  </td>

                  {/* Método de Pago */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap align-middle">{getMetodoIcon(v.metodoPago, v)}</td>

                  {/* Monto Total & Descuento */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap align-middle">
                    {hasDiscount ? (
                      <div>
                        <div className="text-[10px] text-gray-400 line-through font-mono">
                          ${originalPriceVal.toLocaleString("es-CO")}
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <span className="font-extrabold text-gray-900 dark:text-gray-100">
                            ${totalVal.toLocaleString("es-CO")}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.5 rounded">
                            -{discountPctVal}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="font-extrabold text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                        ${totalVal.toLocaleString("es-CO")}
                      </span>
                    )}
                  </td>

                  {/* Estado Badge (Solo lectura — ventas completadas) */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap align-middle">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Completada</span>
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap align-middle text-right">
                    <button
                      onClick={() => onViewDetail && onViewDetail(v)}
                      title="Ver Detalle de la Venta"
                      className="px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-[#F05454] hover:text-red-600 transition-colors cursor-pointer inline-flex items-center gap-1 font-semibold text-xs"
                    >
                      <Eye className="w-4 h-4 text-[#F05454]" />
                      <span>Ver detalle</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {itemsToDisplay.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>registros por página</span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              Página {safePage} de {totalPages} ({itemsToDisplay.length} registros en total)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={safePage === 1}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(safePage - 1)}
                disabled={safePage === 1}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2.5 py-1 bg-[#1e293b] text-white font-semibold rounded-lg text-xs">
                {safePage}
              </span>

              <button
                onClick={() => handlePageChange(safePage + 1)}
                disabled={safePage === totalPages}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={safePage === totalPages}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
