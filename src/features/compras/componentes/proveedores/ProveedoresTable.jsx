import { useState, useEffect } from "react";
import { Edit, Eye, Building, Mail, Phone, MapPin, Power, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function ProveedoresTable({ proveedores = [], onEdit, onDelete, onToggleEstado, onView, canEdit = true, canDelete = true }) {
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination when proveedores length changes (#65)
  useEffect(() => {
    setCurrentPage(1);
  }, [proveedores.length]);

  const totalRecords = proveedores.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = proveedores.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
      {/* Mobile / Tablet Cards (< lg) */}
      <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {totalRecords === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No se encontraron proveedores
          </div>
        ) : (
          paginated.map((p) => {
            const esJuridica = p.tipoPersona === "Jurídica" || p.idTipoDocumento === 3 || p.tipoDocumento === "NIT";
            const docLabel = esJuridica ? "NIT" : "CC";
            const isActivo = p.estado === "Activo" || p.estado === 1;

            return (
              <div key={p.id || p.idProveedor} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{p.nombre}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                        {docLabel}: {p.nit || p.numeroDocumento || "N/A"}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                    isActivo
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                  }`}>
                    {isActivo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    {p.tipoProveedor || p.tipoProveedorNombre || "Mayorista"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {esJuridica ? "Jurídica" : "Natural"}
                  </span>
                  {(p.contacto || p.nombreContacto) && (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      · Contacto: {p.contacto || p.nombreContacto}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl p-2.5">
                  {(p.email || p.correo) && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{p.email || p.correo}</span>
                    </div>
                  )}
                  {p.telefono && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{p.telefono}</span>
                    </div>
                  )}
                  {p.direccion && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{p.direccion}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  {onView && (
                    <button onClick={() => onView(p)} title="Visualizar proveedor" className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onToggleEstado && canEdit && (
                    <button
                      onClick={() => onToggleEstado(p)}
                      title={isActivo ? "Inactivar proveedor" : "Activar proveedor"}
                      className={`p-2 rounded-xl cursor-pointer ${
                        isActivo ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={() => onEdit(p)} title="Editar proveedor" className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 cursor-pointer">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && canDelete && (
                    <button
                      onClick={() => onDelete(p.id || p.idProveedor, p.nombre, p)}
                      title={p.tieneCompras || (p.comprasCount && p.comprasCount > 0) ? `Tiene ${p.comprasCount} compra(s)` : "Mover a papelera"}
                      className={`p-2 rounded-xl cursor-pointer ${
                        p.tieneCompras || (p.comprasCount && p.comprasCount > 0)
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400"
                          : "bg-red-50 dark:bg-red-900/20 text-red-500"
                      }`}
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
      <div className="hidden lg:block w-full overflow-hidden focus:outline-none">
        <table className="w-full table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-3 py-3.5 w-[23%]">Proveedor / Documento</th>
              <th className="px-2.5 py-3.5 w-[11%]">Tipo</th>
              <th className="px-2.5 py-3.5 w-[13%]">Contacto</th>
              <th className="px-2.5 py-3.5 w-[18%]">Correo / Teléfono</th>
              <th className="px-2.5 py-3.5 w-[15%]">Dirección</th>
              <th className="px-2 py-3.5 text-center w-[9%]">Estado</th>
              <th className="px-2 py-3.5 text-center w-[11%]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs sm:text-sm">
            {totalRecords === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron proveedores
                </td>
              </tr>
            ) : (
              paginated.map((p) => {
                const esJuridica = p.tipoPersona === "Jurídica" || p.idTipoDocumento === 3 || p.tipoDocumento === "NIT";
                const docLabel = esJuridica ? "NIT" : "CC";
                const isActivo = p.estado === "Activo" || p.estado === 1;

                return (
                  <tr key={p.id || p.idProveedor} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={p.nombre}>{p.nombre}</div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">
                            <span className="font-semibold text-gray-500 dark:text-gray-400">{docLabel}:</span>{" "}
                            {p.nit || p.numeroDocumento || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-3.5 align-middle">
                      <div className="flex flex-col gap-0.5 items-start min-w-0">
                        <span className="inline-flex items-center px-2 py-0.2 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 max-w-full truncate">
                          {p.tipoProveedor || p.tipoProveedorNombre || "Mayorista"}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {esJuridica ? "Jurídica" : "Natural"}
                        </span>
                      </div>
                    </td>
                    <td className="px-2.5 py-3.5 font-medium text-gray-800 dark:text-gray-200 align-middle">
                      <span className="block truncate" title={p.contacto || p.nombreContacto || "N/A"}>
                        {p.contacto || p.nombreContacto || "N/A"}
                      </span>
                    </td>
                    <td className="px-2.5 py-3.5 align-middle">
                      <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5 min-w-0">
                        {(p.email || p.correo) && (
                          <div className="flex items-center gap-1 min-w-0">
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate" title={p.email || p.correo}>{p.email || p.correo}</span>
                          </div>
                        )}
                        {p.telefono && (
                          <div className="flex items-center gap-1 min-w-0">
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{p.telefono}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2.5 py-3.5 text-gray-600 dark:text-gray-300 text-xs align-middle">
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate" title={p.direccion || "N/A"}>{p.direccion || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-3.5 sm:px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isActivo
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {isActivo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3.5 sm:px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Visualizar proveedor */}
                        {onView && (
                          <button
                            onClick={() => onView(p)}
                            title="Visualizar proveedor"
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {/* Inactivar / Activar (#68) */}
                        {onToggleEstado && canEdit && (
                          <button
                            onClick={() => onToggleEstado(p)}
                            title={isActivo ? "Inactivar proveedor" : "Activar proveedor"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActivo
                                ? "text-emerald-600 dark:text-emerald-400 hover:text-amber-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                : "text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => onEdit(p)}
                            title="Editar proveedor"
                            className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && canDelete && (
                          <button
                            onClick={() => onDelete(p.id || p.idProveedor, p.nombre, p)}
                            title={p.tieneCompras || (p.comprasCount && p.comprasCount > 0) ? `No se puede eliminar: tiene ${p.comprasCount} compra(s) asociada(s)` : "Mover a papelera"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              p.tieneCompras || (p.comprasCount && p.comprasCount > 0)
                                ? "text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50/50"
                                : "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600"
                            }`}
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
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
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
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="w-8 h-8 rounded-full bg-[#F05454] text-white flex items-center justify-center font-bold text-xs mx-1">
            {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
