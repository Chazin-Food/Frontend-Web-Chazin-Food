import { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Minus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UtensilsCrossed
} from "lucide-react";
import { productosService } from "../../servicios/productosService";
import { adicionesService } from "@/features/compras/servicios/adicionesService";
import { ventasService } from "../../servicios/ventasService";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { FoodIconBadge } from "@/shared/components/ui/FoodIcon";

export function isPedidoEditablePreCocina(venta) {
  if (!venta) return false;
  let obsMeta = {};
  if (venta.observaciones) {
    if (typeof venta.observaciones === "object") {
      obsMeta = venta.observaciones;
    } else if (typeof venta.observaciones === "string" && venta.observaciones.trim().startsWith("{")) {
      try {
        obsMeta = JSON.parse(venta.observaciones);
      } catch (_) {
        obsMeta = {};
      }
    }
  }
  if (venta.esDevolucion || obsMeta.esDevolucion) return false;

  const estEntrega = String(venta.estadoEntrega || "").toUpperCase().trim();
  const est = String(venta.estado || "").toUpperCase().trim();
  const estCocina = String(venta.estadoCocina || obsMeta.estadoCocina || "").toUpperCase().trim();
  const estAprob = String(venta.estadoAprobacion || obsMeta.estadoAprobacion || "").toUpperCase().trim();

  if (estAprob === "RECHAZADO") return false;
  if (estEntrega === "CANCELADO" || est.includes("ANUL") || est.includes("CANCEL")) return false;

  // Solo permitido mientras NO haya pasado a producción (En Preparación / Listo / Despachado / Entregado)
  const blockedEntrega = ["PREPARANDO", "EN_PREPARACION", "LISTO", "DESPACHADO", "EN_CAMINO", "ENTREGADO", "COMPLETADA"];
  if (estEntrega && blockedEntrega.includes(estEntrega)) return false;
  if (estCocina && !["EN_COLA", "PENDIENTE"].includes(estCocina)) return false;
  if (
    est.includes("PREPAR") ||
    est.includes("LISTO") ||
    est.includes("DESPACH") ||
    est.includes("CAMINO") ||
    est.includes("ENTREG") ||
    est.includes("COMPLET")
  ) {
    return false;
  }

  return true;
}

export function AgregarProductosPedidoModal({ isOpen, onClose, venta, onProductosAgregados }) {
  const notify = useNotifications();
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [adicionesCatalogo, setAdicionesCatalogo] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedItemKey, setExpandedItemKey] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedItems([]);
    setSearchTerm("");
    setExpandedItemKey(null);

    let cancelled = false;
    setLoadingCatalog(true);
    Promise.all([
      productosService.getProductos().catch(() => []),
      adicionesService.getAdiciones().catch(() => [])
    ])
      .then(([prodsRes, addsRes]) => {
        if (cancelled) return;
        const rawProds = Array.isArray(prodsRes) ? prodsRes : (Array.isArray(prodsRes?.data) ? prodsRes.data : []);
        const activeProds = rawProds.filter((p) => {
          const isAct = p.estado === "Activo" || p.estado === 1 || p.estado === "1" || p.estado === true;
          const stock = Number(p.stockDisponible ?? p.stock ?? 0);
          return isAct && !p.eliminado && stock > 0 && Number(p.precio || 0) > 0;
        });
        const rawAdds = Array.isArray(addsRes) ? addsRes : (Array.isArray(addsRes?.data) ? addsRes.data : []);
        const activeAdds = rawAdds.filter((a) => {
          const isAct = a.estado === "Activo" || a.estado === 1 || a.estado === "1" || a.estado === undefined;
          return isAct && !a.agotado && Number(a.precio || 0) > 0;
        });
        setProductosCatalogo(activeProds);
        setAdicionesCatalogo(activeAdds);
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, submitting, onClose]);

  const filteredCatalogo = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return productosCatalogo;
    return productosCatalogo.filter((p) => {
      const name = String(p.nombre || "").toLowerCase();
      const cat = String(p.categoria || p.categoriaProducto?.nombre || "").toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  }, [productosCatalogo, searchTerm]);

  const handleAddProduct = (prod) => {
    const prodId = Number(prod.idProducto || prod.id);
    const maxStock = Number(prod.stockDisponible ?? prod.stock ?? 99);
    setSelectedItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.idProducto === prodId && it.adiciones.length === 0 && !it.observaciones
      );
      if (existingIdx !== -1) {
        const curQty = prev[existingIdx].cantidad;
        if (curQty >= maxStock) {
          notify.warning("Stock máximo", `Solo hay ${maxStock} unidad(es) disponibles de ${prod.nombre}.`);
          return prev;
        }
        return prev.map((it, i) => (i === existingIdx ? { ...it, cantidad: it.cantidad + 1 } : it));
      }
      const key = `${prodId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      return [
        ...prev,
        {
          key,
          idProducto: prodId,
          nombre: prod.nombre,
          precioUnitario: Number(prod.precio || 0),
          stock: maxStock,
          imagen: prod.imagen || "",
          cantidad: 1,
          adiciones: [],
          observaciones: ""
        }
      ];
    });
  };

  const handleUpdateQty = (key, delta) => {
    setSelectedItems((prev) =>
      prev
        .map((it) => {
          if (it.key !== key) return it;
          const next = it.cantidad + delta;
          if (next > it.stock) {
            notify.warning("Stock máximo", `Solo hay ${it.stock} unidad(es) disponibles de ${it.nombre}.`);
            return it;
          }
          return { ...it, cantidad: next };
        })
        .filter((it) => it.cantidad > 0)
    );
  };

  const handleRemoveItem = (key) => {
    setSelectedItems((prev) => prev.filter((it) => it.key !== key));
  };

  const handleToggleAdicion = (itemKey, adicion) => {
    const adId = Number(adicion.idAdicion || adicion.id || adicion.idInsumo);
    setSelectedItems((prev) =>
      prev.map((it) => {
        if (it.key !== itemKey) return it;
        const exists = it.adiciones.some((a) => Number(a.idAdicion) === adId);
        return {
          ...it,
          adiciones: exists
            ? it.adiciones.filter((a) => Number(a.idAdicion) !== adId)
            : [
                ...it.adiciones,
                {
                  idAdicion: adId,
                  nombre: adicion.nombre,
                  precio: Number(adicion.precio || 0),
                  cantidad: 1
                }
              ]
        };
      })
    );
  };

  const handleChangeObs = (itemKey, value) => {
    setSelectedItems((prev) =>
      prev.map((it) => (it.key === itemKey ? { ...it, observaciones: value.slice(0, 140) } : it))
    );
  };

  const addedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, it) => {
      const addsSum = (it.adiciones || []).reduce(
        (aSum, a) => aSum + Number(a.precio || 0) * Number(a.cantidad || 1),
        0
      );
      return sum + (Number(it.precioUnitario || 0) + addsSum) * Number(it.cantidad || 1);
    }, 0);
  }, [selectedItems]);

  const currentTotal = Number(venta?.total || 0);
  const descuentoPct = Number(venta?.descuentoPorcentaje || 0);
  const addedDescuento = descuentoPct > 0 ? Math.round(addedSubtotal * (descuentoPct / 100)) : 0;
  const addedNetTotal = Math.max(0, addedSubtotal - addedDescuento);
  const estimatedNewTotal = currentTotal + addedNetTotal;
  const isAlreadyPaid =
    String(venta?.estadoPago || "").toLowerCase() === "pagado" ||
    String(venta?.origen || "").toUpperCase() === "ONLINE";

  const handleConfirm = async () => {
    if (selectedItems.length === 0) {
      notify.warning("Sin productos", "Agrega al menos un producto para continuar.");
      return;
    }
    const ventaId = venta?.idVenta || venta?.id;
    if (!ventaId) return;

    setSubmitting(true);
    try {
      const payload = {
        productos: selectedItems.map((it) => ({
          idProducto: it.idProducto,
          esVarianteBase: true,
          nombre: it.nombre,
          cantidad: it.cantidad,
          observaciones: it.observaciones || "",
          adiciones: (it.adiciones || []).map((a) => ({
            idAdicion: a.idAdicion,
            nombre: a.nombre,
            cantidad: a.cantidad || 1
          }))
        }))
      };
      const res = await ventasService.agregarProductosVenta(ventaId, payload);
      const updatedVenta = res?.venta || res;
      notify.success(
        "Productos agregados al pedido",
        `Se añadieron ${selectedItems.reduce((s, i) => s + i.cantidad, 0)} unidad(es) al pedido ${venta.numeroVenta || venta.codigoPedido || `#${ventaId}`}.`
      );
      onProductosAgregados?.(updatedVenta);
      onClose();
    } catch (err) {
      notify.error(
        "No se pudieron agregar productos",
        err?.message || "El pedido pudo haber pasado a producción o no hay stock suficiente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !venta) return null;

  const codigo =
    venta.numeroVenta ||
    venta.codigoPedido ||
    `VEN-${String(venta.idVenta || venta.id || "").padStart(4, "0")}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[92dvh] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 bg-gray-50/70 dark:bg-gray-800/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-gray-100 truncate">
                Agregar productos al pedido {codigo}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Disponible mientras el pedido no haya iniciado preparación en cocina
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
          {/* Columna izquierda: Catálogo disponible */}
          <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto para añadir (ej. Hamburguesa, Gaseosa, Papas)..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            {loadingCatalog ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <span>Cargando catálogo disponible...</span>
              </div>
            ) : filteredCatalogo.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                <UtensilsCrossed className="w-7 h-7 mx-auto mb-2 text-gray-300" />
                No hay productos activos disponibles con ese criterio.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredCatalogo.map((prod) => {
                  const stock = Number(prod.stockDisponible ?? prod.stock ?? 0);
                  return (
                    <button
                      key={prod.idProducto || prod.id}
                      type="button"
                      onClick={() => handleAddProduct(prod)}
                      className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/30 dark:hover:bg-red-950/20 text-left transition cursor-pointer group"
                    >
                      {prod.imagen ? (
                        <img
                          src={prod.imagen}
                          alt={prod.nombre}
                          width="44"
                          height="44"
                          loading="lazy"
                          decoding="async"
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-gray-700"
                        />
                      ) : (
                        <FoodIconBadge name={prod.nombre} size="sm" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                          {prod.nombre}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-xs font-extrabold text-red-600 dark:text-red-400">
                            ${Number(prod.precio || 0).toLocaleString("es-CO")}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400">
                            Stock: {stock}
                          </span>
                        </div>
                      </div>
                      <span className="w-7 h-7 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center shrink-0 transition">
                        <Plus className="w-4 h-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna derecha: Productos seleccionados para añadir */}
          <div className="lg:col-span-5 flex flex-col gap-3 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl p-3.5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Productos por agregar ({selectedItems.reduce((s, i) => s + i.cantidad, 0)})
              </h4>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="text-[11px] font-bold text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center text-center text-xs text-gray-400 px-4">
                <Plus className="w-7 h-7 mb-1.5 opacity-40" />
                <p>Selecciona uno o más productos de la lista izquierda para añadirlos a este pedido.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {selectedItems.map((it) => {
                  const addsSum = (it.adiciones || []).reduce((s, a) => s + Number(a.precio || 0), 0);
                  const lineTotal = (it.precioUnitario + addsSum) * it.cantidad;
                  const isExpanded = expandedItemKey === it.key;

                  return (
                    <div
                      key={it.key}
                      className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                            {it.nombre}
                          </p>
                          <p className="text-[11px] font-extrabold text-red-600 dark:text-red-400">
                            ${lineTotal.toLocaleString("es-CO")} COP
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(it.key, -1)}
                            className="w-6 h-6 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold min-w-[20px] text-center">{it.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(it.key, 1)}
                            className="w-6 h-6 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.key)}
                            className="p-1 text-gray-400 hover:text-red-500 cursor-pointer ml-1"
                            title="Quitar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {it.adiciones.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {it.adiciones.map((a) => (
                            <span
                              key={a.idAdicion}
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                            >
                              + {a.nombre} (${a.precio.toLocaleString("es-CO")})
                            </span>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedItemKey(isExpanded ? null : it.key)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isExpanded ? "Ocultar toppings y nota" : "Editar toppings / nota de cocina"}</span>
                      </button>

                      {isExpanded && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                          {adicionesCatalogo.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {adicionesCatalogo.slice(0, 12).map((ad) => {
                                const adId = Number(ad.idAdicion || ad.id || ad.idInsumo);
                                const active = it.adiciones.some((x) => Number(x.idAdicion) === adId);
                                return (
                                  <button
                                    key={adId}
                                    type="button"
                                    onClick={() => handleToggleAdicion(it.key, ad)}
                                    className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                                      active
                                        ? "bg-purple-600 text-white border-purple-600"
                                        : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-400"
                                    }`}
                                  >
                                    {active ? "✓ " : "+ "}
                                    {ad.nombre} (+${Number(ad.precio || 0).toLocaleString("es-CO")})
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <input
                            type="text"
                            value={it.observaciones}
                            onChange={(e) => handleChangeObs(it.key, e.target.value)}
                            placeholder="Nota para cocina (ej. Sin cebolla, salsas aparte)..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-red-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resumen financiero */}
            <div className="mt-auto pt-3 border-t border-gray-200/80 dark:border-gray-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Total actual del pedido</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  ${currentTotal.toLocaleString("es-CO")} COP
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                <span>Adición actual {descuentoPct > 0 ? `(-${descuentoPct}% dto.)` : ""}</span>
                <span>+${addedNetTotal.toLocaleString("es-CO")} COP</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 dark:text-gray-100 pt-1.5 border-t border-gray-200 dark:border-gray-700">
                <span>Nuevo total estimado</span>
                <span className="text-red-600 dark:text-red-400">
                  ${estimatedNewTotal.toLocaleString("es-CO")} COP
                </span>
              </div>

              {isAlreadyPaid && addedNetTotal > 0 && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    El valor adicional (<strong>${addedNetTotal.toLocaleString("es-CO")} COP</strong>) quedará registrado como saldo adicional por cancelar.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting || selectedItems.length === 0}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{submitting ? "Agregando..." : "Agregar al pedido"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AgregarProductosPedidoModal;
