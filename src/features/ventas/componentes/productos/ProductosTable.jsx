import { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  Utensils,
  Tag,
  Eye,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Copy,
  Layers,
  Power
} from "lucide-react";
import { FoodIcon, EventBadge } from "@/shared/components/ui/FoodIcon";
import { parseEventoInsumos, formatEventoToppingsText } from "@/shared/utils/foodEmojiUtils";
import { getProductVariantSummary, isVariantActive, isVariantFromEvent } from "@/shared/utils/productVariantUtils";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { isEventActiveInColombia } from "@/shared/utils/dateUtils";

export const getActiveProductEvents = (producto, allEventos = []) => {
  if (!producto) return [];
  const nowMs = Date.now();
  const prodId = String(producto.id || producto.idProducto || "");
  const byId = new Map();

  const registerEvent = (evt) => {
    if (!evt || typeof evt !== "object") return;
    const key = String(evt.id || evt.idEvento || evt.nombreEvento || evt.nombre || byId.size);
    if (byId.has(key)) {
      byId.set(key, { ...byId.get(key), ...evt });
    } else {
      byId.set(key, evt);
    }
  };

  if (Array.isArray(producto.eventos) && producto.eventos.length > 0) {
    producto.eventos.forEach((e) => {
      if (!isEventActiveInColombia(e, nowMs)) return;
      const full = Array.isArray(allEventos)
        ? allEventos.find((ae) => String(ae.id || ae.idEvento) === String(e.id || e.idEvento))
        : null;
      registerEvent(full ? { ...e, ...full } : e);
    });
  }

  if (Array.isArray(allEventos) && allEventos.length > 0 && prodId) {
    allEventos.forEach((e) => {
      if (!isEventActiveInColombia(e, nowMs)) return;
      let matchesProd = String(e.idProducto || e.producto?.id || e.producto?.idProducto || "") === prodId;
      if (!matchesProd && e.productosAsociados) {
        try {
          const list = typeof e.productosAsociados === "string"
            ? JSON.parse(e.productosAsociados)
            : e.productosAsociados;
          matchesProd = Array.isArray(list) && list.some((a) => String(a?.idProducto || a?.id) === prodId);
        } catch (_) {
          matchesProd = false;
        }
      }
      if (matchesProd) registerEvent(e);
    });
  }

  return Array.from(byId.values());
};

export const getActiveProductEvent = (producto, allEventos = []) => {
  const list = getActiveProductEvents(producto, allEventos);
  return list.length > 0 ? list[0] : null;
};

export const getActiveEvent = getActiveProductEvent;

export const isSpecialPreparedDrink = (p) => {
  if (!p) return false;
  const nom = String(p.nombre || "").toLowerCase();
  const desc = String(p.descripcion || "").toLowerCase();
  return (
    /batido|smoothie|malteada|jugo natural|frapp|limonada|shake|artesanal|preparad|coctel|cóctel|capuchino|café|cafe/i.test(nom) ||
    /batido|smoothie|malteada|preparad|artesanal/i.test(desc)
  );
};

export const isProductCommercialDrink = (p) => {
  if (!p) return false;
  if (isSpecialPreparedDrink(p)) return false;
  if (p.fichaTecnica && (p.fichaTecnica.detalles?.length > 0 || p.fichaTecnica.insumos?.length > 0)) {
    return false;
  }
  const cat = String(p.categoria || p.categoriaProducto?.nombre || "").toLowerCase();
  const nom = String(p.nombre || "").toLowerCase();
  return (
    p.idCategoriaProducto === 4 ||
    cat.includes("bebida") ||
    cat.includes("gaseos") ||
    cat.includes("refresco") ||
    cat.includes("cerveza") ||
    nom.includes("agua") ||
    nom.includes("gaseosa") ||
    nom.includes("coca") ||
    nom.includes("pepsi") ||
    nom.includes("postob") ||
    nom.includes("colombiana") ||
    nom.includes("sprite") ||
    nom.includes("quatro") ||
    nom.includes("cuatro") ||
    nom.includes("hit")
  );
};

export const isProductDrink = isProductCommercialDrink;

export function ProductosTable({
  productos = [],
  eventos = [],
  onEdit,
  onDelete,
  onToggleEstado,
  onView,
  onDuplicate,
  onCreateEvento,
  canEdit = true,
  canDelete = true,
  currentPage: controlledPage,
  pageSize: controlledPageSize,
  totalItems: controlledTotalItems,
  onPageChange,
  onPageSizeChange,
  serverPaginated = false
}) {
  const { warning: notifyWarning } = useNotifications();
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(5);

  // Reset page to 1 when dataset changes (only in uncontrolled mode)
  useEffect(() => {
    if (!onPageChange) setInternalPage(1);
  }, [productos.length, onPageChange]);

  const currentPage = controlledPage !== undefined ? Number(controlledPage) || 1 : internalPage;
  const pageSize = controlledPageSize !== undefined ? Number(controlledPageSize) || 5 : internalPageSize;
  const totalRecords = serverPaginated && controlledTotalItems !== undefined ? Number(controlledTotalItems) : productos.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // Ensure current page is within valid range
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedProductos = serverPaginated ? productos : productos.slice(startIndex, endIndex);

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

  // Helper for generating visible page numbers
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
      {/* Mobile / Tablet Cards (< lg) */}
      <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {totalRecords === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            <Utensils className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No se encontraron productos en el menú</p>
            <p className="text-xs text-gray-400 mt-1">Prueba ajustando los filtros de búsqueda o categoría</p>
          </div>
        ) : (
          paginatedProductos.map((p) => {
            const activeEvt = getActiveEvent(p, eventos);
            const variantSummary = getProductVariantSummary(p, { includeInactive: true });
            const stockVal = Number(p.stockDisponible !== undefined ? p.stockDisponible : (p.stock !== undefined ? p.stock : 0));
            const isActivo = p.estado === "Activo" || p.estado === 1 || p.estado === "1";
            const hasSalesLock = Boolean(p.tieneVentas || Number(p.ventas || 0) > 0);
            const basePrice = Number(p.precio || 0);
            const displayPrice = activeEvt?.nuevoPrecio && Number(activeEvt.nuevoPrecio) > 0
              ? Number(activeEvt.nuevoPrecio)
              : activeEvt?.descuento && Number(activeEvt.descuento) > 0
              ? Math.round(basePrice * (1 - Number(activeEvt.descuento) / 100))
              : basePrice;

            return (
              <div key={p.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} width="44" height="44" loading="lazy" decoding="async" className="w-11 h-11 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/30 text-[#F05454] flex items-center justify-center shrink-0">
                        <Utensils className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight break-words">{p.nombre}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-gray-400">{p.codigo || `PRD-${p.id}`}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          <Tag className="w-2.5 h-2.5" />
                          {p.categoria || "Sin categoría"}
                        </span>
                      </div>
                      {(variantSummary.hasVariants || activeEvt) && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {variantSummary.hasVariants && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70">
                              <Layers className="w-2.5 h-2.5" />
                              {variantSummary.count} {variantSummary.count === 1 ? "variante" : "variantes"}
                            </span>
                          )}
                          {activeEvt && <EventBadge event={activeEvt} product={p} variant="pill" className="text-[10px] py-0.5" />}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                    isActivo ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  }`}>
                    {isActivo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-gray-50/70 dark:bg-gray-800/40 rounded-xl p-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Precio</span>
                    <div className="flex items-baseline gap-1.5">
                      {displayPrice !== basePrice && (
                        <span className="text-xs text-gray-400 line-through">${basePrice.toLocaleString("es-CO")}</span>
                      )}
                      <span className="text-sm font-black text-gray-900 dark:text-gray-100">${displayPrice.toLocaleString("es-CO")}</span>
                    </div>
                  </div>
                  <div>
                    {stockVal > 0 ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        stockVal <= 5 ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300" : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stockVal <= 5 ? "bg-amber-500" : "bg-emerald-500"}`} />
                        {stockVal} und
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                        Agotado (0)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onCreateEvento && onCreateEvento(p, activeEvt || null)}
                      title={activeEvt ? "Editar Evento Activo" : "Crear Evento / Promoción"}
                      className={`p-2 rounded-xl transition-colors cursor-pointer relative ${
                        activeEvt ? "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300" : "bg-orange-50 dark:bg-orange-900/20 text-orange-500"
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => onView && onView(p)} title="Ver detalle" className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 cursor-pointer">
                    <Eye className="w-4 h-4" />
                  </button>
                  {canEdit && (
                    <button type="button" onClick={() => onDuplicate && onDuplicate(p)} title="Duplicar producto" className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 cursor-pointer">
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  {onToggleEstado && canEdit && (
                    <button
                      type="button"
                      onClick={() => onToggleEstado(p)}
                      title={isActivo ? "Inactivar producto" : "Activar producto"}
                      className={`p-2 rounded-xl cursor-pointer ${isActivo ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit && onEdit(p)}
                      title="Editar producto"
                      className={`p-2 rounded-xl cursor-pointer relative ${hasSalesLock ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" : "bg-green-50 dark:bg-green-900/20 text-green-600"}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button type="button" onClick={() => onDelete && onDelete(p.id || p.idProducto, p.nombre)} title="Eliminar producto" className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer">
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
            <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="px-4 py-3.5 w-[35%]">Producto / Código</th>
              <th className="px-3 py-3.5 w-[15%]">Categoría</th>
              <th className="px-3 py-3.5 w-[12%]">Precio Venta</th>
              <th className="px-3 py-3.5 w-[12%]">Stock</th>
              <th className="px-3 py-3.5 w-[10%]">Estado</th>
              <th className="px-3 py-3.5 w-[16%] text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {totalRecords === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  <Utensils className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">
                    No se encontraron productos en el menú
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Prueba ajustando los filtros de búsqueda o categoría
                  </p>
                </td>
              </tr>
            ) : (
              paginatedProductos.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-2.5 align-middle">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.imagen ? (
                        <img
                          src={p.imagen}
                          alt={p.nombre}
                          width="40"
                          height="40"
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 text-[#F05454] flex items-center justify-center shrink-0">
                          <Utensils className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        {(() => {
                          const activeEvt = getActiveEvent(p, eventos);
                          const variantSummary = getProductVariantSummary(p, { includeInactive: true });
                          const basePrice = Number(p.precio || 0);
                          const toppings = activeEvt ? parseEventoInsumos(activeEvt) : [];
                          const isToppingEvt = Boolean(
                            activeEvt && (
                              toppings.length > 0 ||
                              activeEvt.tipoEvento === "Añadir Insumos" ||
                              String(activeEvt.tipoEvento).toLowerCase().includes("insumo") ||
                              String(activeEvt.tipoEvento).toLowerCase().includes("topping")
                            )
                          );

                          return (
                            <>
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <span
                                  className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-full"
                                  title={p.nombre}
                                >
                                  {p.nombre}
                                </span>
                                {variantSummary.hasVariants && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70"
                                    title={`Producto con variantes: ${variantSummary.names.join(", ")}`}
                                  >
                                    <Layers className="w-3 h-3 shrink-0" />
                                    <span>
                                      {variantSummary.count} {variantSummary.count === 1 ? "variante" : "variantes"}
                                    </span>
                                  </span>
                                )}
                                {activeEvt && (
                                  <EventBadge event={activeEvt} product={p} variant="pill" className="text-[10px] py-0.5" />
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono mt-0.5">
                                <span>{p.codigo || `PRD-${p.id}`}</span>
                              </div>

                              {variantSummary.hasVariants && (
                                <div className="flex items-center gap-1 flex-wrap mt-1">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mr-0.5">
                                    <Layers className="w-2.5 h-2.5 shrink-0" />
                                    <span>Variantes:</span>
                                  </span>
                                  {variantSummary.variants.slice(0, 3).map((v, vIdx) => {
                                    const vPrice = Number(v.precio || 0);
                                    const hasCustomPrice = vPrice > 0 && vPrice !== basePrice;
                                    const varActive = isVariantActive(v);
                                    const varFromEvt = isVariantFromEvent(v);
                                    return (
                                      <span
                                        key={v.idVariante || v.id || `${v.nombre}-${vIdx}`}
                                        title={`${v.nombre}${hasCustomPrice ? ` ($${vPrice.toLocaleString("es-CO")})` : ""}${varFromEvt ? " • Creada por evento" : ""}${!varActive ? " • Inactiva en clientes" : ""}`}
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold border max-w-[185px] truncate ${
                                          !varActive
                                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 opacity-75"
                                            : "bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-200/80 dark:border-indigo-800/60"
                                        }`}
                                      >
                                        {varFromEvt && <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                                        <span className={`truncate ${!varActive ? "line-through" : ""}`}>{v.nombre}</span>
                                        {!varActive && (
                                          <span className="text-[8.5px] font-black uppercase text-rose-500 shrink-0">Off</span>
                                        )}
                                        {hasCustomPrice && (
                                          <span className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
                                            ${vPrice.toLocaleString("es-CO")}
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                  {variantSummary.count > 3 && (
                                    <span
                                      title={variantSummary.names.slice(3).join(", ")}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                    >
                                      +{variantSummary.count - 3} más
                                    </span>
                                  )}
                                </div>
                              )}

                              {activeEvt && (
                                <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[11px]">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                    <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                    <span>Evento:</span>
                                  </span>
                                  {activeEvt.tipoEvento === "Descuento" && activeEvt.descuento && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      (-{Number(activeEvt.descuento)}% OFF)
                                    </span>
                                  )}
                                  {activeEvt.tipoEvento === "Promoción Precio" && activeEvt.nuevoPrecio && (
                                    <span className="text-orange-600 dark:text-orange-400 font-bold">
                                      (Promo: ${Number(activeEvt.nuevoPrecio).toLocaleString("es-CO")})
                                    </span>
                                  )}
                                  {isToppingEvt && (
                                    <span
                                      className="text-purple-600 dark:text-purple-400 font-bold"
                                      title={toppings.length > 0 ? formatEventoToppingsText(toppings) : "Topping extra gratis"}
                                    >
                                      {toppings.length > 0 ? `(+ ${formatEventoToppingsText(toppings)})` : "(Topping extra)"}
                                    </span>
                                  )}
                                  {!(activeEvt.tipoEvento === "Descuento" && activeEvt.descuento) &&
                                    !(activeEvt.tipoEvento === "Promoción Precio" && activeEvt.nuevoPrecio) &&
                                    !isToppingEvt && (
                                      <span className="text-orange-700 dark:text-orange-300 font-semibold">
                                        {activeEvt.nombreEvento || activeEvt.nombre || activeEvt.tipoEvento || "Promoción activa"}
                                      </span>
                                    )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      <Tag className="w-3 h-3" />
                      {p.categoria || "Sin categoría"}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 font-bold text-gray-900 dark:text-gray-100">
                    {(() => {
                      const activeEvt = getActiveEvent(p, eventos);
                      if (!activeEvt) {
                        return <span>${Number(p.precio || 0).toLocaleString("es-CO")}</span>;
                      }
                      if (activeEvt.nuevoPrecio && Number(activeEvt.nuevoPrecio) > 0) {
                        return (
                          <div>
                            <span className="text-xs text-gray-400 line-through block font-normal">
                              ${Number(p.precio || 0).toLocaleString("es-CO")}
                            </span>
                            <span className="font-extrabold text-orange-600 dark:text-orange-400 text-sm flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              ${Number(activeEvt.nuevoPrecio).toLocaleString("es-CO")}
                            </span>
                          </div>
                        );
                      }
                      if (activeEvt.descuento && Number(activeEvt.descuento) > 0) {
                        const finalP = Number(p.precio || 0) * (1 - Number(activeEvt.descuento) / 100);
                        return (
                          <div>
                            <span className="text-xs text-gray-400 line-through block font-normal">
                              ${Number(p.precio || 0).toLocaleString("es-CO")}
                            </span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                              ${Math.round(finalP).toLocaleString("es-CO")}
                            </span>
                          </div>
                        );
                      }
                      return <span>${Number(p.precio || 0).toLocaleString("es-CO")}</span>;
                    })()}
                    {(() => {
                      const variantSummary = getProductVariantSummary(p);
                      if (!variantSummary.hasDifferentPrices) return null;
                      return (
                        <span
                          className="block text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 whitespace-nowrap"
                          title="Rango de precio entre las variantes del producto"
                        >
                          Var: ${variantSummary.minPrice.toLocaleString("es-CO")}
                          {variantSummary.minPrice !== variantSummary.maxPrice
                            ? ` – $${variantSummary.maxPrice.toLocaleString("es-CO")}`
                            : ""}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-2.5">
                    {Number(p.stockDisponible !== undefined ? p.stockDisponible : (p.stock !== undefined ? p.stock : 0)) > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          Number(p.stockDisponible || p.stock) <= 5
                            ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                        }`}
                        title={p.hasFicha ? "Stock disponible calculado a partir de insumos en bodega" : "Stock disponible en catálogo"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${Number(p.stockDisponible || p.stock) <= 5 ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
                        <span>{p.stockDisponible !== undefined ? p.stockDisponible : p.stock} unidades</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50"
                        title="Insumos insuficientes para preparar este producto"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>Agotado (0)</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2.5">
                    {(() => {
                      const isActivo = p.estado === "Activo" || p.estado === 1 || p.estado === "1";
                      return (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isActivo
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {isActivo ? "Activo" : "Inactivo"}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Evento: Editar si está activo y vigente, o Crear si no tiene */}
                      {canEdit && (() => {
                        const activeEvt = getActiveProductEvent(p, eventos);
                        if (activeEvt) {
                          return (
                            <button
                              type="button"
                              onClick={() => onCreateEvento && onCreateEvento(p, activeEvt)}
                              title={`Editar Evento Activo: ${activeEvt.nombreEvento || activeEvt.nombre || "Evento"}`}
                              className="p-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/60 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-300/80 dark:border-orange-800 transition-all shadow-2xs active:scale-95 cursor-pointer relative group"
                            >
                              <Zap className="w-4 h-4 fill-orange-500 dark:fill-orange-400 text-orange-600 drop-shadow-xs" />
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" title="Evento Activo y Vigente" />
                            </button>
                          );
                        }
                        return (
                          <button
                            type="button"
                            onClick={() => onCreateEvento && onCreateEvento(p, null)}
                            title="Crear Evento / Promoción"
                            className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-500 dark:text-orange-400 transition-colors cursor-pointer"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        );
                      })()}
                      {/* Ver detalle */}
                      <button
                        type="button"
                        onClick={() => onView && onView(p)}
                        title="Ver detalle del producto"
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Duplicar producto (Ítem 125) */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onDuplicate && onDuplicate(p)}
                          title="Duplicar producto (crear nuevo plato a partir de este)"
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}

                      {/* Inactivar / Activar producto */}
                      {onToggleEstado && canEdit && (() => {
                        const isActivo = p.estado === "Activo" || p.estado === 1 || p.estado === "1";
                        return (
                          <button
                            type="button"
                            onClick={() => onToggleEstado(p)}
                            title={isActivo ? "Inactivar producto" : "Activar producto"}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActivo
                                ? "text-emerald-600 dark:text-emerald-400 hover:text-amber-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                : "text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        );
                      })()}

                      {/* Solo editar producto (datos comerciales) */}
                      {canEdit && (() => {
                        const hasSalesLock = Boolean(p.tieneVentas || Number(p.ventas || 0) > 0);
                        return (
                          <button
                            type="button"
                            onClick={() => onEdit && onEdit(p)}
                            title={
                              hasSalesLock
                                ? "Producto con ventas asociadas: Identidad protegida 🔒 • Editar datos del producto"
                                : "Editar producto"
                            }
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
                              hasSalesLock
                                ? "hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                                : "hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                            }`}
                          >
                            <Edit className="w-4 h-4" />
                            {hasSalesLock && (
                              <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 absolute -top-0.5 -right-0.5 bg-white dark:bg-gray-900 rounded-full" />
                            )}
                          </button>
                        );
                      })()}
                      {/* Eliminar */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete && onDelete(p.id || p.idProducto, p.nombre)}
                          title="Eliminar producto"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/30 dark:bg-gray-800/20">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span>Mostrar:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium outline-none focus:ring-2 focus:ring-[#F05454]/40 cursor-pointer text-xs"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>productos por página</span>
        </div>

        {/* Counter Info */}
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
          productos
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={validCurrentPage === 1}
            title="Primera página"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={validCurrentPage === 1}
            title="Página anterior"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Numeric page buttons */}
          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-gray-400 select-none text-xs"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition cursor-pointer ${
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

          {/* Next page */}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={validCurrentPage === totalPages || totalRecords === 0}
            title="Página siguiente"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={validCurrentPage === totalPages || totalRecords === 0}
            title="Última página"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
