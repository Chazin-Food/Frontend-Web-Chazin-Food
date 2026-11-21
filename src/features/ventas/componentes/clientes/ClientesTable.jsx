import { useState } from "react";
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ShieldAlert, Flame, Clock, AlertTriangle } from "lucide-react";
import { formatNombreCompleto, formatDireccion } from "@/shared/utils/validationUtils";
import { FidelidadBadge } from "@/shared/components/ui/FidelidadBadge";

export function ClientesTable({
  clientes = [],
  onViewDetail,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  currentPage: controlledPage,
  pageSize: controlledPageSize,
  totalItems: controlledTotalItems,
  onPageChange,
  onPageSizeChange,
  serverPaginated = false
}) {
  const [internalPageSize, setInternalPageSize] = useState(5);
  const [internalPage, setInternalPage] = useState(1);

  const currentPage = controlledPage !== undefined ? Number(controlledPage) || 1 : internalPage;
  const pageSize = controlledPageSize !== undefined ? Number(controlledPageSize) || 5 : internalPageSize;
  const totalRecords = serverPaginated && controlledTotalItems !== undefined ? Number(controlledTotalItems) : clientes.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedClientes = serverPaginated ? clientes : clientes.slice(startIndex, startIndex + pageSize);

  const setCurrentPage = (updater) => {
    const nextVal = typeof updater === "function" ? updater(safePage) : updater;
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

  const getAvatarBg = (nombre = "") => {
    const firstChar = nombre.charAt(0).toUpperCase();
    if (["A", "B", "C"].includes(firstChar)) return "bg-emerald-500 text-white";
    if (["D", "E", "F", "G"].includes(firstChar)) return "bg-blue-500 text-white";
    if (["H", "I", "J", "K"].includes(firstChar)) return "bg-purple-500 text-white";
    if (["L", "M", "N"].includes(firstChar)) return "bg-indigo-500 text-white";
    if (["O", "P", "Q", "R"].includes(firstChar)) return "bg-amber-500 text-white";
    return "bg-slate-500 text-white";
  };

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case "VIP":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300";
      case "Frecuente":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
      case "Regular":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
      case "Nuevo":
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
      {/* Mobile / Tablet Cards (< lg) */}
      <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {totalRecords === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No se encontraron clientes registrados
          </div>
        ) : (
          paginatedClientes.map((c, index) => {
            const tipoCliente = c.tipo || (c.esVip ? "VIP" : "Nuevo");
            const tieneCuenta = c.tieneCuenta !== false && !!c.idUsuario;
            const isPendiente = c.estado === "PENDIENTE" || c.estado === "Pendiente" || c.estadoUsuario === "PENDIENTE";
            const isActivo = tieneCuenta && !isPendiente && (c.estado === "Activo" || c.estado === 1);
            const rawTotal = c.totalConsumido || c.totalGastado || 0;
            const numTotal = typeof rawTotal === "string" ? Number(rawTotal.replace(/[^0-9]/g, "")) || 0 : Number(rawTotal) || 0;

            return (
              <div key={c.id || `cli-mob-${index}`} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${getAvatarBg(c.nombre)}`}>
                      {c.nombre ? c.nombre.charAt(0).toUpperCase() : "C"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                          {formatNombreCompleto(c.nombre, c.apellidos) || "Cliente General"}
                        </p>
                        {!tieneCuenta && <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Sin cuenta asociada" />}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">{c.telefono || "Sin teléfono"}{c.email ? ` · ${c.email}` : ""}</p>
                    </div>
                  </div>
                  {isPendiente ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 shrink-0">Pendiente</span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                      isActivo ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400" : "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {isActivo ? "Activo" : "Inactivo"}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl p-2.5 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FidelidadBadge tipo={tipoCliente} descuento={c.descuentoPorcentaje} enGracia={c.fidelidad?.enGracia} size="sm" />
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-orange-600 dark:text-orange-400">
                      <Flame className="w-3 h-3" />
                      {c.fidelidad?.comprasCiclo !== undefined ? c.fidelidad.comprasCiclo : ((c.compras || 0) % 3)}/3 ({c.compras || 0} comp.)
                    </span>
                  </div>
                  <span className="font-black text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    ${numTotal.toLocaleString("es-CO")} COP
                  </span>
                </div>

                {c.direccion && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    Dirección: {formatDireccion(c.direccion)}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => onViewDetail && onViewDetail(c)} title="Ver detalle" className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 cursor-pointer">
                    <Eye className="w-4 h-4" />
                  </button>
                  {canEdit && (
                    <button onClick={() => onEdit(c)} title="Editar cliente" className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 cursor-pointer">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(c.id || c.idCliente, `${c.nombre} ${c.apellidos || ""}`.trim(), c.compras || 0)}
                      title={c.compras > 0 ? "Cuenta con ventas asociadas" : "Eliminar cliente"}
                      className={`p-2 rounded-xl cursor-pointer ${c.compras > 0 ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" : "bg-red-50 dark:bg-red-900/20 text-red-500"}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (lg+) — sin scroll horizontal */}
      <div className="hidden lg:block w-full overflow-hidden">
        <table className="w-full table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-400 dark:text-gray-400 tracking-wider uppercase">
              <th className="px-3 py-3 w-[23%]">CLIENTE</th>
              <th className="px-2.5 py-3 w-[11%]">TELÉFONO</th>
              <th className="px-2.5 py-3 w-[18%]">EMAIL</th>
              <th className="px-2 py-3 text-center w-[8%]">COMPRAS</th>
              <th className="px-2.5 py-3 w-[12%]">CONSUMIDO</th>
              <th className="px-2.5 py-3 w-[12%]">TIPO</th>
              <th className="px-2 py-3 w-[8%]">ESTADO</th>
              <th className="px-2 py-3 text-center w-[8%]">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            {totalRecords === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron clientes registrados
                </td>
              </tr>
            ) : (
              paginatedClientes.map((c, index) => {
                const tipoCliente = c.tipo || (c.esVip ? "VIP" : "Nuevo");
                const tieneCuenta = c.tieneCuenta !== false && !!c.idUsuario;
                const isPendiente = c.estado === "PENDIENTE" || c.estado === "Pendiente" || c.estadoUsuario === "PENDIENTE";
                const isActivo = tieneCuenta && !isPendiente && (c.estado === "Activo" || c.estado === 1);
                const fullName = formatNombreCompleto(c.nombre, c.apellidos) || "Cliente General";
                const dirStr = formatDireccion(c.direccion);

                return (
                  <tr key={c.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${getAvatarBg(c.nombre)}`}>
                          {c.nombre ? c.nombre.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight truncate min-w-0" title={fullName}>
                              {fullName}
                            </p>
                            {!tieneCuenta && (
                              <span title="Sin cuenta de usuario asociada" className="text-amber-500 shrink-0">
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate" title={dirStr}>
                            {dirStr}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-2.5 py-3 text-gray-600 dark:text-gray-300 font-medium truncate align-middle" title={c.telefono || "Sin teléfono"}>
                      {c.telefono || "Sin teléfono"}
                    </td>

                    <td className="px-2.5 py-3 align-middle">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} className="text-blue-500 hover:underline font-medium block truncate" title={c.email}>
                          {c.email}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Sin cuenta</span>
                      )}
                    </td>

                    <td className="px-2 py-3 text-center align-middle">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{c.compras || 0}</span>
                        <span className="text-[10px] text-orange-600 dark:text-orange-400 font-extrabold flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />
                          <span>{c.fidelidad?.comprasCiclo !== undefined ? c.fidelidad.comprasCiclo : ((c.compras || 0) % 3)}/3</span>
                        </span>
                      </div>
                    </td>

                    {/* Total Consumido */}
                    <td className="px-2.5 py-3 font-extrabold text-gray-900 dark:text-gray-100 truncate align-middle">
                      {(() => {
                        const raw = c.totalConsumido || c.totalGastado || 0;
                        const num = typeof raw === "string" ? Number(raw.replace(/[^0-9]/g, "")) || 0 : Number(raw) || 0;
                        return `$${num.toLocaleString("es-CO")}`;
                      })()}
                    </td>

                    <td className="px-2.5 py-3 align-middle">
                      <div className="flex flex-col items-start gap-0.5 min-w-0">
                        <FidelidadBadge
                          tipo={tipoCliente}
                          descuento={c.descuentoPorcentaje}
                          enGracia={c.fidelidad?.enGracia}
                          size="sm"
                        />
                        {tipoCliente === "Nuevo" ? (
                          <span className="text-[10px] text-gray-400 font-medium truncate max-w-full">Sin vencimiento</span>
                        ) : c.fidelidad?.enGracia ? (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800/60 animate-pulse truncate max-w-full">
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                            Gracia: {c.fidelidad?.diasGraciaRestantes || 0}d
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 truncate max-w-full">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            {c.fidelidad?.diasRestantes !== null && c.fidelidad?.diasRestantes !== undefined
                              ? `${c.fidelidad.diasRestantes}d rest.`
                              : "30d vig."}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-2 py-3 align-middle">
                      {isPendiente ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800">
                          Pendiente
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActivo
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                            : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                        }`}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </span>
                      )}
                    </td>

                    <td className="px-2 py-3 text-center align-middle">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewDetail && onViewDetail(c)}
                          title="Ver detalle del cliente"
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => onEdit(c)}
                            title="Editar cliente"
                            className="p-1 text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => onDelete(c.id || c.idCliente, `${c.nombre} ${c.apellidos || ""}`.trim(), c.compras || 0)}
                            title={c.compras > 0 ? "No se puede eliminar: cuenta con ventas asociadas (solo inactivar)" : "Eliminar cliente"}
                            className={`p-1 transition-colors cursor-pointer ${c.compras > 0 ? "text-amber-500 hover:text-amber-600" : "text-gray-400 hover:text-red-500"}`}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Pagination Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>Mostrar:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>registros</span>
        </div>

        <div>
          Mostrando {totalRecords === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + pageSize, totalRecords)} de {totalRecords} registros
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safePage === 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={safePage === 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs mx-1">
            {safePage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={safePage === totalPages}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage === totalPages}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
