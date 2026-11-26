import { useState, useEffect } from "react";
import {
  Eye,
  Trash2,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UserCheck
} from "lucide-react";
import { FoodIconBadge } from "@/shared/components/ui/FoodIcon";
import { imprimirComanda } from "../utils/comandaUtils";
import { resolveOrderTimings } from "../utils/tiempoProduccionUtils";

export function ProduccionTable({
  ordenes = [],
  onUpdateEstado,
  onDelete,
  onViewDetails,
  canEdit = true,
  canDelete = true,
  currentPage: controlledPage,
  pageSize: controlledPageSize,
  totalItems: controlledTotalItems,
  onPageChange,
  onPageSizeChange,
  serverPaginated = false
}) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(5);

  useEffect(() => {
    if (!onPageChange) setInternalPage(1);
  }, [ordenes.length, onPageChange]);

  const currentPage = controlledPage !== undefined ? Number(controlledPage) || 1 : internalPage;
  const pageSize = controlledPageSize !== undefined ? Number(controlledPageSize) || 5 : internalPageSize;
  const totalRecords = serverPaginated && controlledTotalItems !== undefined ? Number(controlledTotalItems) : ordenes.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedOrdenes = serverPaginated ? ordenes : ordenes.slice(startIndex, endIndex);

  const setCurrentPage = (updater) => {
    const nextVal = typeof updater === "function" ? updater(validCurrentPage) : updater;
    const clamped = Math.min(Math.max(1, Number(nextVal) || 1), totalPages);
    if (onPageChange) onPageChange(clamped);
    else setInternalPage(clamped);
  };

  const handlePageSizeChange = (newSize) => {
    if (onPageSizeChange) onPageSizeChange(newSize);
    else {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (validCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (validCurrentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(validCurrentPage - 1);
        pages.push(validCurrentPage);
        pages.push(validCurrentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const isOrderDomicilio = (orden) => {
    if (!orden) return false;
    const raw = `${orden.tipoEntrega || ""} ${orden.tipoVenta || ""} ${orden.mesa || ""}`.toLowerCase();
    return raw.includes("domicilio") || String(orden.origen || "").toUpperCase() === "ONLINE";
  };

  const getNextStatusConfig = (currentStatus, orden = null) => {
    switch (currentStatus) {
      case "En Cola":
        return {
          next: "En Preparación",
          label: "En Preparación",
          color: "bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800"
        };
      case "En Preparación":
        return {
          next: "Listo",
          label: "Listo",
          color: "bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800"
        };
      case "Listo":
      case "Listos":
        // Ficha SENA 3209616: Domicilio pasa por "Despachado" -> "Entregado"; Presencial pasa directo a "Entregado"
        if (isOrderDomicilio(orden)) {
          return {
            next: "Despachado",
            label: "Despachar Domicilio",
            color: "bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800"
          };
        }
        return {
          next: "Entregado",
          label: "Marcar Entregado",
          color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
        };
      case "Despachado":
        return {
          next: "Entregado",
          label: "Entregado",
          color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
        };
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
      {/* Mobile / Tablet Cards (< lg) — Vista resumida; información completa en "Ver detalle" */}
      <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {totalRecords === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No se encontraron órdenes de producción
          </div>
        ) : (
          paginatedOrdenes.map((o) => {
            const nextConfig = getNextStatusConfig(o.estado, o);
            const timings = resolveOrderTimings(o);
            const esDomicilio = isOrderDomicilio(o);
            const firstDish = Array.isArray(o.productos) && o.productos.length > 0
              ? o.productos[0].nombre
              : o.platilloNombre;
            const extraDishesCount = Array.isArray(o.productos) && o.productos.length > 1
              ? o.productos.length - 1
              : 0;

            return (
              <div key={o.id} className="p-4 space-y-3">
                {/* Top row: Orden + Estado */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="shrink-0 mt-0.5">
                      <FoodIconBadge name={firstDish || "burger"} size="sm" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                          {o.codigo || `OP-00${o.id}`}
                        </span>
                        {o.prioridad ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            Turno #{o.prioridad}
                          </span>
                        ) : null}
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[10px] font-bold">
                          x{o.cantidad || 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                          {esDomicilio ? "Domicilio" : (o.mesa || "En Mesa")}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-snug truncate">
                        {firstDish}
                        {extraDishesCount > 0 ? ` (+${extraDishesCount} más)` : ""}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                        <span className="inline-flex items-center gap-1 font-semibold text-gray-800 dark:text-gray-200 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{o.cliente || "Cliente Mostrador"}</span>
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="font-mono text-[11px] shrink-0">{timings.horaPedido}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 ${
                    o.estado === "En Preparación"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : o.estado === "Listo" || o.estado === "Listos"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : o.estado === "Despachado"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : o.estado === "Entregado"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                  }`}>
                    {o.estado}
                  </span>
                </div>

                {/* Action bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex-1 min-w-[130px]">
                    {nextConfig && canEdit ? (
                      <button
                        type="button"
                        onClick={() => onUpdateEstado && onUpdateEstado(o.id, nextConfig.next, o)}
                        className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${nextConfig.color}`}
                      >
                        {nextConfig.next === "Listo" && <ClipboardCheck className="w-3.5 h-3.5" />}
                        <span>{nextConfig.next === "Listo" ? "Verificar y Listo" : nextConfig.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : !nextConfig ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completado</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onViewDetails && onViewDetails(o)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver detalle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => imprimirComanda(o)}
                      title="Imprimir comanda"
                      className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(o.id)}
                        title="Eliminar orden"
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (lg+) — Listado simplificado de 5 columnas; detalle completo en "Ver detalle" */}
      <div className="hidden lg:block w-full overflow-hidden">
        <table className="w-full table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-4 py-3.5 w-[35%]">Orden y Cliente</th>
              <th className="px-3 py-3.5 text-center w-[15%]">Cant. / Entrega</th>
              <th className="px-3 py-3.5 text-center w-[16%]">Estado</th>
              <th className="px-3 py-3.5 text-center w-[16%]">Avanza a</th>
              <th className="px-3 py-3.5 text-center w-[18%]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {totalRecords === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron órdenes de producción
                </td>
              </tr>
            ) : (
              paginatedOrdenes.map((o) => {
                const nextConfig = getNextStatusConfig(o.estado, o);
                const timings = resolveOrderTimings(o);
                const esDomicilio = isOrderDomicilio(o);
                const clienteLabel = o.cliente || "Cliente Mostrador";
                const firstDish = Array.isArray(o.productos) && o.productos.length > 0
                  ? o.productos[0].nombre
                  : o.platilloNombre;
                const extraDishesCount = Array.isArray(o.productos) && o.productos.length > 1
                  ? o.productos.length - 1
                  : 0;

                return (
                  <tr key={o.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                    {/* 1. Orden, Cliente y resumen limpio */}
                    <td className="px-4 py-3.5 align-middle overflow-hidden max-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">
                          <FoodIconBadge name={firstDish || "burger"} size="sm" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 shrink-0">
                              {o.codigo || `OP-00${o.id}`}
                            </span>
                            {o.prioridad ? (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                  o.prioridad === 1
                                    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                Turno #{o.prioridad}
                              </span>
                            ) : null}
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={clienteLabel}>
                              {clienteLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate"
                              title={o.platilloNombre || firstDish}
                            >
                              {firstDish}
                            </span>
                            {extraDishesCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0">
                                +{extraDishesCount} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Cantidad y modalidad de entrega */}
                    <td className="px-3 py-3.5 text-center align-middle">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-extrabold text-gray-900 dark:text-gray-100 text-xs">
                          x{o.cantidad || 1} {Number(o.cantidad || 1) === 1 ? "und." : "unds."}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 truncate max-w-full">
                          {esDomicilio ? "Domicilio" : (o.mesa || "En Mesa")}
                        </span>
                      </div>
                    </td>

                    {/* 3. Estado único y hora de pedido */}
                    <td className="px-3 py-3.5 text-center align-middle">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold max-w-full truncate ${
                            o.estado === "En Preparación"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : o.estado === "Listo" || o.estado === "Listos"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                              : o.estado === "Despachado"
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : o.estado === "Entregado"
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          }`}
                          title={o.estado}
                        >
                          <span className="truncate">{o.estado}</span>
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500">
                          {timings.horaPedido}
                        </span>
                      </div>
                    </td>

                    {/* 4. Avanza a */}
                    <td className="px-3 py-3.5 text-center align-middle">
                      {nextConfig && canEdit ? (
                        <button
                          type="button"
                          onClick={() => onUpdateEstado && onUpdateEstado(o.id, nextConfig.next, o)}
                          title={nextConfig.next === "Listo" ? "Abrir Checklist de Verificación y pasar a Listo" : `Avanzar estado a: ${nextConfig.next}`}
                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer shadow-2xs max-w-full ${nextConfig.color}`}
                        >
                          <span className="truncate">{nextConfig.next === "Listo" ? "Listo" : nextConfig.label}</span>
                          <ArrowRight className="w-3 h-3 shrink-0" />
                        </button>
                      ) : !nextConfig ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 max-w-full truncate">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">Completado</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* 5. Acciones — Ver detalle destacado + Comanda + Eliminar */}
                    <td className="px-3 py-3.5 text-center align-middle">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewDetails && onViewDetails(o)}
                          title="Ver detalle completo (recetas, cocinero, tiempos, checklist y notas)"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>Ver detalle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => imprimirComanda(o)}
                          title="Imprimir comanda para cocina"
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete && onDelete(o.id)}
                            title="Eliminar orden"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador Compacto */}
      <div className="p-3 px-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/30 dark:bg-gray-800/20">
        <div className="flex items-center gap-2">
          <span>Mostrar:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium outline-none focus:ring-2 focus:ring-[#F05454]/40 cursor-pointer text-xs"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>órdenes por página</span>
        </div>

        <div className="font-medium text-gray-600 dark:text-gray-400">
          Mostrando{" "}
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {totalRecords === 0 ? 0 : startIndex + 1}
          </span>{" "}
          a{" "}
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {endIndex}
          </span>{" "}
          de{" "}
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {totalRecords}
          </span>{" "}
          órdenes
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={validCurrentPage === 1}
            title="Primera página"
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={validCurrentPage === 1}
            title="Página anterior"
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 py-0.5 text-gray-400 select-none text-xs"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  onClick={() => setCurrentPage(page)}
                  className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                    validCurrentPage === page
                      ? "bg-[#F05454] text-white shadow-2xs"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={validCurrentPage === totalPages || totalRecords === 0}
            title="Página siguiente"
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={validCurrentPage === totalPages || totalRecords === 0}
            title="Última página"
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
