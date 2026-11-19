import { useState } from "react";
import { matchesSmartSearch } from "@/shared/utils/searchUtils";
import {
  X,
  Bell,
  Trash2,
  Filter,
  PlusCircle,
  Edit,
  Clock,
  RotateCcw,
  CheckCircle2,
  ShoppingCart,
  User,
  Search
} from "lucide-react";

export function TrazabilidadModal({
  isOpen,
  onClose,
  eventos = [],
  onClearAll,
  onOpenPapelera
}) {
  const [searchTrazabilidad, setSearchTrazabilidad] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [visibleCount, setVisibleCount] = useState(40);

  if (!isOpen) return null;

  const isEventEliminado = (e) =>
    e.tipo === "Eliminado" ||
    e.tipo === "Eliminado permanente" ||
    (e.tipoRaw && e.tipoRaw.toLowerCase().includes("elimin")) ||
    (e.descripcion && (e.descripcion.toLowerCase().includes("papelera") || e.descripcion.toLowerCase().includes("elimin"))) ||
    (e.motivo && e.motivo.toLowerCase().includes("papelera"));

  const isEventEditado = (e) =>
    !isEventEliminado(e) &&
    (e.tipo === "Editado" ||
      (e.tipoRaw && (e.tipoRaw.toLowerCase().includes("edit") || e.tipoRaw.toLowerCase().includes("actualiz"))) ||
      (e.descripcion && e.descripcion.toLowerCase().includes("actualizaron")) ||
      (e.motivo && e.motivo.toLowerCase().includes("actualización")));

  const isEventCreado = (e) =>
    !isEventEliminado(e) &&
    !isEventEditado(e) &&
    (e.tipo === "Creado" ||
      (e.tipoRaw && (e.tipoRaw.toLowerCase().includes("crea") || e.tipoRaw.toLowerCase() === "nuevo")) ||
      (e.descripcion && (e.descripcion.toLowerCase().includes("creó") || e.descripcion.toLowerCase().includes("registro inicial"))));

  const isEventRestaurado = (e) =>
    !isEventEliminado(e) &&
    (e.tipo === "Restaurado" || (e.tipoRaw && e.tipoRaw.toLowerCase().includes("restaur")));

  const isEventCancelacion = (e) =>
    !isEventEliminado(e) &&
    !isEventEditado(e) &&
    !isEventCreado(e) &&
    !isEventRestaurado(e) &&
    (e.esCancelacion === true ||
      e.tipo === "Cancelación de Compra" ||
      e.tipo === "Anulación de Compra" ||
      e.tipo === "cancelacion_compra" ||
      (e.descripcion && (
        e.descripcion.toLowerCase().includes("cancelaci") ||
        e.descripcion.toLowerCase().includes("anulaci") ||
        e.descripcion.toLowerCase().includes("reversa")
      )) ||
      (e.motivo && (
        e.motivo.toLowerCase().includes("cancelaci") ||
        e.motivo.toLowerCase().includes("anulaci") ||
        e.motivo.toLowerCase().includes("reversa")
      )));

  const isEventReabastecimiento = (e) =>
    !isEventEliminado(e) &&
    !isEventEditado(e) &&
    !isEventCreado(e) &&
    !isEventRestaurado(e) &&
    !isEventCancelacion(e) &&
    (e.tipo === "Reabastecimiento" ||
      e.tipo === "compra" ||
      e.tipo === "Reabastecimiento por Compra" ||
      (e.tipoMovimiento === "Entrada" &&
        (String(e.tipoRaw).toLowerCase().includes("compra") ||
         String(e.descripcion).toLowerCase().includes("compra") ||
         String(e.motivo).toLowerCase().includes("compra") ||
         String(e.tipo).toLowerCase().includes("reabastec"))));

  const reabastecimientosCount = eventos.filter(isEventReabastecimiento).length;
  const cancelacionesCount = eventos.filter(isEventCancelacion).length;
  const creadosCount = eventos.filter(isEventCreado).length;
  const editadosCount = eventos.filter(isEventEditado).length;
  const eliminadosCount = eventos.filter(isEventEliminado).length;
  const restauradosCount = eventos.filter(isEventRestaurado).length;

  const filteredEventos = eventos.filter((e) => {
    const hasSearch = Boolean(searchTrazabilidad && searchTrazabilidad.trim());

    // Type filter (anulado si el usuario busca específicamente para no limitar resultados)
    let matchType = true;
    if (filterType === "Reabastecimientos") matchType = isEventReabastecimiento(e);
    else if (filterType === "Cancelaciones") matchType = isEventCancelacion(e);
    else if (filterType === "Creados") matchType = isEventCreado(e);
    else if (filterType === "Editados") matchType = isEventEditado(e);
    else if (filterType === "Eliminados") matchType = isEventEliminado(e);
    else if (filterType === "Restaurados") matchType = isEventRestaurado(e);

    if (!hasSearch && !matchType) return false;

    if (!hasSearch) return true;

    const actionKeywords = [
      isEventEliminado(e) ? "eliminado eliminada eliminacion papelera borrado borrada" : "",
      isEventEditado(e) ? "editado editada edicion modificacion modificado actualizado" : "",
      isEventCreado(e) ? "creado creada creacion nuevo nueva registrado registrada" : "",
      isEventRestaurado(e) ? "restaurado restaurada restauracion recuperado" : "",
      isEventReabastecimiento(e) ? "reabastecimiento compra entrada ingreso" : "",
      isEventCancelacion(e) ? "cancelacion cancelada cancelado anulacion anulado reversado" : ""
    ].join(" ");

    return matchesSmartSearch(
      [
        e.nombre,
        e.descripcion,
        e.tipo,
        e.tipoRaw,
        e.motivo,
        e.usuarioNombre,
        e.fecha,
        e.id,
        actionKeywords
      ],
      searchTrazabilidad
    );
  });

  const visibleEventos = filteredEventos.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredEventos.length - visibleEventos.length);

  const handleSelectFilter = (next) => {
    setFilterType(next);
    setVisibleCount(40);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-[28px] shadow-2xl w-full max-w-[900px] max-h-[92dvh] sm:max-h-[85dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-50 dark:bg-red-900/30 text-[#F05454] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-[#1e293b] dark:text-gray-100 leading-tight truncate">
                Trazabilidad de Insumos
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {eventos.length} eventos registrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenPapelera}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-500" />
              <span>Papelera</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Cerrar trazabilidad"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar + Single-line Horizontal Scroll Filters on Mobile */}
        <div className="px-4 py-2.5 sm:px-6 sm:pt-3.5 sm:pb-3 border-b border-gray-100 dark:border-gray-800 space-y-2 shrink-0">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTrazabilidad}
              onChange={(e) => {
                setSearchTrazabilidad(e.target.value);
                setVisibleCount(40);
              }}
              placeholder="Buscar por insumo, acción o responsable..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-red-500/50 outline-none transition-colors"
            />
          </div>

          {/* Filter Pills: una sola fila deslizable en móvil para no invadir el modal; wrap limpio en escritorio */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto sm:flex-wrap no-scrollbar touch-scroll-x pb-0.5 text-xs">
            <div className="hidden sm:flex items-center gap-1.5 text-gray-400 mr-1 shrink-0 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-wider">Filtros:</span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectFilter("Todos")}
              className={`px-2.5 sm:px-3 py-1 rounded-full font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                filterType === "Todos"
                  ? "bg-[#F05454] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              Todos ({eventos.length})
            </button>

            <button
              type="button"
              onClick={() => handleSelectFilter("Reabastecimientos")}
              className={`px-2.5 sm:px-3 py-1 rounded-full font-medium transition-colors shrink-0 whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filterType === "Reabastecimientos"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Reabastecimientos ({reabastecimientosCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectFilter("Cancelaciones")}
              className={`px-2.5 sm:px-3 py-1 rounded-full font-medium transition-colors shrink-0 whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filterType === "Cancelaciones"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100"
              }`}
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Cancelaciones ({cancelacionesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectFilter("Creados")}
              className={`px-2.5 sm:px-3 py-1 rounded-full font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                filterType === "Creados"
                  ? "bg-[#F05454] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              Creados ({creadosCount})
            </button>

            <button
              type="button"
              onClick={() => handleSelectFilter("Editados")}
              className={`px-2.5 sm:px-3 py-1 rounded-full font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                filterType === "Editados"
                  ? "bg-[#F05454] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              Editados ({editadosCount})
            </button>

            <button
              type="button"
              onClick={() => handleSelectFilter("Eliminados")}
              className={`px-2.5 sm:px-3 py-1 rounded-full font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                filterType === "Eliminados"
                  ? "bg-[#F05454] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              Eliminados ({eliminadosCount})
            </button>

            <button
              type="button"
              onClick={() => handleSelectFilter("Restaurados")}
              className={`px-2.5 sm:px-3 py-1 rounded-full font-medium transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                filterType === "Restaurados"
                  ? "bg-[#F05454] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              Restaurados ({restauradosCount})
            </button>
          </div>
        </div>

        {/* Events Cards List / Empty State */}
        <div className="p-3.5 sm:p-5 overflow-y-auto overflow-x-hidden flex-1 space-y-2.5 sm:space-y-3">
          {filteredEventos.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-slate-400 dark:text-gray-500 mb-3">
                <CheckCircle2 className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="font-bold text-[#1e293b] dark:text-gray-100 text-base mb-1">
                Sin eventos registrados
              </h3>
              <p className="text-xs text-gray-400">
                Los reabastecimientos por compras y cambios a los insumos aparecerán aquí
              </p>
            </div>
          ) : (
            <>
              {visibleEventos.map((ev) => {
                const isEliminado = isEventEliminado(ev);
                const isEditado = isEventEditado(ev);
                const isCreado = isEventCreado(ev);
                const isRestaurado = isEventRestaurado(ev);
                const isCancelacion = isEventCancelacion(ev);
                const isReabastecimiento = isEventReabastecimiento(ev);

                const badgeBg = isEliminado
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/80"
                  : isEditado
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80"
                  : isCreado
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/80"
                  : isRestaurado
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/80"
                  : isCancelacion
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200/80"
                  : isReabastecimiento
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/80"
                  : "bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200/80";

                const badgeLabel = isEliminado
                  ? "Insumo Eliminado"
                  : isEditado
                  ? "Insumo Editado"
                  : isCreado
                  ? "Insumo Creado"
                  : isRestaurado
                  ? "Insumo Restaurado"
                  : isCancelacion
                  ? (ev.tipo && (ev.tipo.includes("Cancel") || ev.tipo.includes("Anul")) ? ev.tipo : "Cancelación de Compra")
                  : isReabastecimiento
                  ? "Reabastecimiento por Compra"
                  : ev.tipo;

                const iconCircle = isEliminado ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                ) : isEditado ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                    <Edit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                ) : isCreado ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                ) : isRestaurado ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                ) : isCancelacion ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                ) : isReabastecimiento ? (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 text-slate-600 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                  </div>
                );

                const hasCantidad = ev.cantidad !== null && ev.cantidad !== undefined && !isNaN(parseFloat(ev.cantidad)) && (isReabastecimiento || isCancelacion || isCreado);

                return (
                  <div
                    key={ev.id}
                    className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-3 sm:p-4 flex items-start gap-2.5 sm:gap-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    {iconCircle}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${badgeBg}`}>
                            • {badgeLabel}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm break-words">
                            {ev.nombre}
                          </span>
                          {hasCantidad && (
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] border whitespace-nowrap ${
                                isCancelacion
                                  ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200/80 dark:border-red-800/60"
                                  : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60"
                              }`}
                            >
                              {isCancelacion ? `-${Math.abs(parseFloat(ev.cantidad))}` : `+${Math.abs(parseFloat(ev.cantidad))}`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{ev.fecha}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed break-words">
                        {ev.descripcion}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-700/40 text-[11px] text-gray-500 dark:text-gray-400">
                        <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-500 dark:text-gray-300 shrink-0">
                          <User className="w-2.5 h-2.5" />
                        </div>
                        <span className="truncate">
                          Responsable: <strong className="font-semibold text-gray-800 dark:text-gray-200">{ev.usuarioNombre || "Sistema"}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {remainingCount > 0 && (
                <div className="pt-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 40)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                  >
                    Cargar más eventos ({remainingCount} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] sm:text-xs text-gray-400">
            Mostrando {visibleEventos.length} de {filteredEventos.length} eventos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 sm:px-6 sm:py-2 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
