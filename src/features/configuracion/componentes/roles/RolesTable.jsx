import { useState, useEffect } from "react";
import { Shield, Users, Edit, Trash2, Eye, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function RolesTable({ roles = [], onView, onEdit, onToggleEstado, onDelete, canEdit = true, canDelete = true }) {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [roles]);

  const totalRecords = roles.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRoles = roles.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
      {/* Mobile / Tablet Cards (< md) */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {totalRecords === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No se encontraron roles registrados
          </div>
        ) : (
          paginatedRoles.map((r, index) => {
            const isActivo = r.estado === "Activo" || r.estado === 1 || r.estado === "1";
            const nombreNorm = String(r.nombre || "").trim().toLowerCase();
            const isAdministrador = nombreNorm === "administrador" || nombreNorm === "admin" || String(r.id) === "1";
            const privilegiosGranularesCount = (r.permisos || []).filter((p) => p.includes(":")).length;
            const modulosBaseCount = (r.permisos || []).filter((p) => !p.includes(":") && p !== "Vendedor").length;

            return (
              <div key={r.id || index} className="p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-gray-700">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#1e293b] dark:text-gray-100 truncate">
                        {r.nombre}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-gray-400 font-medium">ID #{r.id || startIndex + index + 1}</span>
                        {isAdministrador && (
                          <span className="text-[10.5px] font-semibold text-[#F05454]">Rol del Sistema</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                    isActivo
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}>
                    {isActivo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {r.descripcion && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                    {r.descripcion}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                    <Users className="w-3 h-3" />
                    <span>{r.usuarios || 0} usuarios</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700">
                    {modulosBaseCount} módulos
                  </span>
                  {privilegiosGranularesCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                      {privilegiosGranularesCount} privilegios
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {onView && (
                      <button
                        type="button"
                        onClick={() => onView(r)}
                        title="Ver detalle del rol"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-gray-700 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver detalle</span>
                      </button>
                    )}
                    {canEdit && !isAdministrador && (
                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        title="Editar rol"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#F05454] text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>

                  {!isAdministrador && (
                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onToggleEstado(r.id)}
                          title={isActivo ? "Desactivar rol" : "Activar rol"}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            isActivo
                              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {isActivo ? <ToggleRight className="w-4 h-4 text-amber-500" /> : <ToggleLeft className="w-4 h-4 text-emerald-500" />}
                          <span>{isActivo ? "Desactivar" : "Activar"}</span>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(r.id, r.nombre)}
                          title="Eliminar rol"
                          className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (md+) — sin scroll horizontal */}
      <div className="hidden md:block w-full overflow-hidden">
        <table className="w-full table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-[#1e293b] dark:text-gray-200 tracking-wider uppercase">
              <th className="px-4 py-3.5 w-[7%]">ID</th>
              <th className="px-4 py-3.5 w-[20%]">ROL</th>
              <th className="px-4 py-3.5 w-[25%]">DESCRIPCIÓN</th>
              <th className="px-3 py-3.5 text-center w-[11%]">USUARIOS</th>
              <th className="px-3 py-3.5 text-center w-[13%]">PERMISOS</th>
              <th className="px-3 py-3.5 w-[10%]">ESTADO</th>
              <th className="px-3 py-3.5 text-center w-[14%]">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {totalRecords === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron roles registrados
                </td>
              </tr>
            ) : (
              paginatedRoles.map((r, index) => {
                const isActivo = r.estado === "Activo" || r.estado === 1 || r.estado === "1";
                const nombreNorm = String(r.nombre || "").trim().toLowerCase();
                const isAdministrador = nombreNorm === "administrador" || nombreNorm === "admin" || String(r.id) === "1";
                  const privilegiosGranularesCount = (r.permisos || []).filter((p) => p.includes(":")).length;
                  const modulosBaseCount = (r.permisos || []).filter((p) => !p.includes(":") && p !== "Vendedor").length;

                  return (
                    <tr key={r.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                        {r.id || startIndex + index + 1}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-gray-700">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#1e293b] dark:text-gray-100 truncate" title={r.nombre}>
                              {r.nombre}
                            </p>
                            {isAdministrador && (
                              <span className="text-[11px] font-semibold text-[#F05454]">
                                Rol del Sistema
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 dark:text-gray-300 truncate align-middle" title={r.descripcion || "Sin descripción"}>
                        {r.descripcion || "Sin descripción"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                          <Users className="w-3.5 h-3.5" />
                          <span>{r.usuarios || 0}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700">
                            {modulosBaseCount} módulos
                          </span>
                          {privilegiosGranularesCount > 0 && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                              {privilegiosGranularesCount} privilegios
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          isActivo
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}>
                          {isActivo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {onView && (
                            <button
                              type="button"
                              onClick={() => onView(r)}
                              title="Ver detalle del rol"
                              className="w-7 h-7 inline-flex items-center justify-center text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 stroke-[2]" />
                            </button>
                          )}
                          {canEdit && (
                            isAdministrador ? (
                              <span className="w-7 h-7 inline-block" aria-hidden="true" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => onEdit(r)}
                                title="Editar rol"
                                className="w-7 h-7 inline-flex items-center justify-center text-[#F05454] dark:text-[#F05454] hover:text-[#d84343] transition-colors cursor-pointer"
                              >
                                <Edit className="w-4 h-4 stroke-[2]" />
                              </button>
                            )
                          )}
                          {canEdit && (
                            isAdministrador ? (
                              <span className="w-7 h-7 inline-block" aria-hidden="true" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => onToggleEstado(r.id)}
                                title={isActivo ? "Desactivar rol" : "Activar rol"}
                                className="w-7 h-7 inline-flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                              >
                                {isActivo ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            )
                          )}
                          {canDelete && (
                            isAdministrador ? (
                              <span className="w-7 h-7 inline-block" aria-hidden="true" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => onDelete(r.id, r.nombre)}
                                title="Eliminar rol"
                                className="w-7 h-7 inline-flex items-center justify-center text-red-500 dark:text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 stroke-[2]" />
                              </button>
                            )
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
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
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
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(Math.min(p, totalPages) - 1, 1))}
            disabled={safePage === 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="w-8 h-8 rounded-full bg-[#F05454] text-white flex items-center justify-center font-bold text-xs mx-1">
            {safePage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(Math.min(p, totalPages) + 1, totalPages))}
            disabled={safePage === totalPages}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage === totalPages}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
