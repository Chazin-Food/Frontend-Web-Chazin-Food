import React, { useState, useMemo } from "react";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Search,
  Sliders,
  Check,
  Flame,
  Sparkles,
  Ban,
  Truck,
  Lock,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { FoodIcon, FoodIconBadge } from "@/shared/components/ui/FoodIcon";
import { getOptimizedImageUrl } from "@/shared/utils/imageUtils";

/**
 * Clasifica cada topping/adición en una categoría gastronómica clara
 * para evitar saturación visual y reducir el scroll dentro del carrito.
 */
export function classifyToppingCategory(adicion) {
  const raw = `${adicion?.nombre || ""} ${adicion?.categoria || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    /\b(salsa|suero|guacamole|tartara|bbq|barbecue|mostaza|heinz|mayo|mayonesa|ajo|pina|rosada|miel|chipotle|showy|aderezo|vinagreta|picante liquido)\b/.test(
      raw
    )
  ) {
    return "salsas";
  }

  if (
    /\b(carne|res|tocineta|bacon|salchicha|pollo|crispy|chorizo|jamon|queso|cheddar|mozzarella|parmesano|suizo|suiza|huevo|costilla|cerdo|lomito|proteina)\b/.test(
      raw
    )
  ) {
    return "proteinas_quesos";
  }

  return "acompanamientos";
}

const TOPPING_CATEGORY_TABS = [
  { id: "todos", label: "Todos" },
  { id: "proteinas_quesos", label: "Proteínas y quesos" },
  { id: "salsas", label: "Salsas" },
  { id: "acompanamientos", label: "Acompañamientos" }
];

const formatCOP = (value) => `$${Math.round(Number(value || 0)).toLocaleString("es-CO")}`;

/**
 * Miniatura consistente con fallback vectorial limpio si la URL falla o no existe.
 */
function ToppingAvatar({ adicion, getAdicionImage, size = "md" }) {
  const [imgError, setImgError] = useState(false);
  const rawImg =
    (typeof adicion?.imagen === "string" && adicion.imagen.startsWith("http") ? adicion.imagen : "") ||
    (typeof adicion?.foto === "string" && adicion.foto.startsWith("http") ? adicion.foto : "") ||
    (typeof getAdicionImage === "function" ? getAdicionImage(adicion) : "");

  const optimized = rawImg ? getOptimizedImageUrl(rawImg, 96) : "";
  const cat = classifyToppingCategory(adicion);
  const dims = size === "sm" ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl";
  const px = size === "sm" ? 32 : 40;

  if (!optimized || imgError) {
    const tone =
      cat === "salsas"
        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/50"
        : cat === "proteinas_quesos"
          ? "bg-red-50 dark:bg-red-950/40 text-[#D9383A] dark:text-red-300 border-red-200/70 dark:border-red-800/50"
          : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200/80 dark:border-gray-700";

    return (
      <div className={`${dims} shrink-0 border flex items-center justify-center ${tone}`}>
        <FoodIcon name={adicion?.nombre || "burger"} size={size === "sm" ? 15 : 18} stroke={1.85} />
      </div>
    );
  }

  return (
    <img
      src={optimized}
      alt={adicion?.nombre || "Topping"}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      onError={() => setImgError(true)}
      className={`${dims} object-cover shrink-0 border border-slate-200/80 dark:border-gray-700 bg-slate-100 dark:bg-gray-800`}
    />
  );
}

/**
 * Componente modular del Carrito de Compras ("Tu Carrito") de Chazin Food.
 * Diseñado bajo estándares UX/UI de e-commerce gastronómico de alta conversión.
 */
export function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  foodAdiciones = [],
  complementosOrden = [],
  clientSubtotal = 0,
  discountPercent = 0,
  clientDiscountMonto = 0,
  totalCheckout = 0,
  updateQuantity,
  updateItemAdiciones,
  removeFromCart,
  clearCart,
  getProductQuantityInCart,
  onAddComplemento,
  onProceedToCheckout,
  onStockLimitError,
  getAdicionImage,
  isDrinkProduct,
  resolveDrinkImage,
  complementosRef,
  onScrollComplementos
}) {
  const [editingCartToppingsKey, setEditingCartToppingsKey] = useState(null);
  const [toppingSearch, setToppingSearch] = useState("");
  const [activeToppingCat, setActiveToppingCat] = useState("todos");
  const [confirmClearCart, setConfirmClearCart] = useState(false);
  // Snapshot reversible para deshacer "Quitar todos" sin pérdida accidental
  const [undoToppingsSnapshot, setUndoToppingsSnapshot] = useState(null);

  const totalUnits = useMemo(
    () => cart.reduce((acc, it) => acc + Number(it.cantidad || 1), 0),
    [cart]
  );

  // Cálculo informativo de ahorro directo en promociones (cuando precioOriginal > precio)
  const promoSavingsTotal = useMemo(() => {
    return cart.reduce((acc, it) => {
      const orig = Number(it.precioOriginal || 0);
      const curr = Number(it.precio || 0);
      if (orig > curr && curr > 0) {
        return acc + (orig - curr) * Number(it.cantidad || 1);
      }
      return acc;
    }, 0);
  }, [cart]);

  if (!isOpen) return null;

  const handleCloseDrawer = () => {
    setEditingCartToppingsKey(null);
    setToppingSearch("");
    setActiveToppingCat("todos");
    setConfirmClearCart(false);
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/55 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
      onClick={handleCloseDrawer}
    >
      <aside
        aria-label="Tu Carrito de Compras"
        className="bg-[#F8FAFC] dark:bg-gray-950 w-full max-w-xl lg:max-w-[580px] h-[100dvh] pb-safe shadow-2xl flex flex-col justify-between border-l border-slate-200/80 dark:border-gray-800 animate-in slide-in-from-right duration-300 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ 1. ENCABEZADO DEL CARRITO CON CONFIRMACIÓN SEGURA DE VACIADO ═══ */}
        <header className="px-5 sm:px-6 py-4 bg-white dark:bg-gray-900 border-b border-slate-200/80 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D9383A]/10 dark:bg-red-950/60 text-[#D9383A] dark:text-red-400 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 stroke-[2.25]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                  Tu Carrito
                </h2>
                {totalUnits > 0 && (
                  <span className="text-[11px] bg-slate-900 dark:bg-[#D9383A] text-white font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                    {totalUnits} {totalUnits === 1 ? "producto" : "productos"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate">
                {totalUnits > 0
                  ? "Revisa tus platos y personaliza extras al instante"
                  : "Tu orden artesanal comienza aquí"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {cart.length > 0 && (
              confirmClearCart ? (
                <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/70 px-2 py-1 rounded-xl animate-in fade-in duration-150">
                  <span className="text-[11px] font-bold text-[#B91C1C] dark:text-red-300 px-1">
                    ¿Vaciar?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      clearCart?.();
                      setConfirmClearCart(false);
                      setEditingCartToppingsKey(null);
                      setUndoToppingsSnapshot(null);
                    }}
                    className="px-2 py-1 rounded-lg bg-[#D9383A] hover:bg-[#B91C1C] text-white text-[11px] font-extrabold cursor-pointer transition"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearCart(false)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 text-[11px] font-bold cursor-pointer hover:bg-slate-100 transition"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearCart(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-[#D9383A] hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition cursor-pointer"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Vaciar</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={handleCloseDrawer}
              aria-label="Cerrar carrito de compras"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 flex items-center justify-center transition cursor-pointer"
              title="Cerrar carrito"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* ═══ 2. CUERPO PRINCIPAL DEL CARRITO ═══ */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center space-y-4">
            <div className="w-20 h-20 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-3xl shadow-xs flex items-center justify-center text-[#D9383A] dark:text-red-400">
              <ShoppingCart className="w-9 h-9 stroke-[1.75]" />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="text-base font-extrabold text-slate-900 dark:text-white">
                Tu carrito está vacío
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                Descubre nuestras hamburguesas artesanales, perros calientes especiales, salchipapas gourmet y combos.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="px-5 py-2.5 rounded-xl bg-[#D9383A] hover:bg-[#B91C1C] text-white text-xs font-extrabold shadow-sm transition cursor-pointer active:scale-95"
            >
              Explorar el menú
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Lista scrolleable de productos */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5 scrollbar-thin">
              {cart.map((item, index) => {
                const itemKey = item.cartItemId || `${item.id}-${index}`;
                const prodStock = Number(item.stock !== undefined ? item.stock : 0);
                const totalInCartForProd = getProductQuantityInCart?.(item.id || item.idProducto) ?? item.cantidad;
                const isPromoEvent = Boolean(
                  item.esPromocionEvento || (item.isEvento && Boolean(item.eventoInfo?.nombre))
                );
                const currentAdds = Array.isArray(item.adiciones) ? item.adiciones : [];
                const additionsUnit = currentAdds.reduce(
                  (sum, a) => sum + (Number(a.precio) || 0) * (Number(a.cantidad) || 1),
                  0
                );
                const totalToppingsUnits = currentAdds.reduce(
                  (sum, a) => sum + (Number(a.cantidad) || 1),
                  0
                );
                const baseItemPrice = Number(item.precio) || 0;
                const unitPriceWithAdds = baseItemPrice + additionsUnit;
                const lineTotalPrice = unitPriceWithAdds * (Number(item.cantidad) || 1);
                const isItemDrink = Boolean(isDrinkProduct?.(item));
                const isEditingThisItem =
                  editingCartToppingsKey === itemKey && !isItemDrink && foodAdiciones.length > 0;

                // Resolver imagen principal del producto
                let displayImg = item.imagen;
                if (
                  !displayImg ||
                  typeof displayImg !== "string" ||
                  (!displayImg.startsWith("http") &&
                    !displayImg.startsWith("/") &&
                    !displayImg.startsWith("data:"))
                ) {
                  if (
                    isItemDrink ||
                    String(item.nombre || "").toLowerCase().includes("gaseosa") ||
                    String(item.nombre || "").toLowerCase().includes("coca")
                  ) {
                    displayImg = resolveDrinkImage?.(item);
                  }
                }
                const optimizedItemImg =
                  displayImg &&
                  (displayImg.startsWith("http") ||
                    displayImg.startsWith("/") ||
                    displayImg.startsWith("data:"))
                    ? getOptimizedImageUrl(displayImg, 140)
                    : "";

                // Conteos por categoría de toppings para este ítem
                const categoryCounts = isEditingThisItem
                  ? foodAdiciones.reduce(
                      (acc, ad) => {
                        const c = classifyToppingCategory(ad);
                        acc[c] = (acc[c] || 0) + 1;
                        acc.todos += 1;
                        return acc;
                      },
                      { todos: 0, proteinas_quesos: 0, salsas: 0, acompanamientos: 0 }
                    )
                  : { todos: 0, proteinas_quesos: 0, salsas: 0, acompanamientos: 0 };

                // Recomendaciones contextuales (2-3 extras de alto encaje aún no agregados)
                const contextualRecommendedToppings = isEditingThisItem
                  ? (() => {
                      const selectedIds = new Set(
                        currentAdds.map((x) => Number(x.idAdicion || x.id))
                      );
                      const unselected = foodAdiciones.filter(
                        (ad) => !selectedIds.has(Number(ad.idAdicion || ad.id || ad.idInsumo))
                      );
                      // Priorizar 1 acompañamiento (papas), 1 proteína/queso (tocineta/cheddar) y 1 salsa artesanal
                      const pickFrom = (catKey, keywords) =>
                        unselected.find((ad) => {
                          const c = classifyToppingCategory(ad);
                          const n = String(ad.nombre || "").toLowerCase();
                          return c === catKey && keywords.some((kw) => n.includes(kw));
                        }) || unselected.find((ad) => classifyToppingCategory(ad) === catKey);

                      const picks = [
                        pickFrom("acompanamientos", ["papa", "francesa", "aros"]),
                        pickFrom("proteinas_quesos", ["tocineta", "cheddar", "queso", "salchicha"]),
                        pickFrom("salsas", ["guacamole", "suero", "tartara", "casa", "ajo"])
                      ].filter(Boolean);

                      const unique = [];
                      const seen = new Set();
                      for (const p of picks) {
                        const pid = Number(p.idAdicion || p.id || p.idInsumo);
                        if (!seen.has(pid)) {
                          seen.add(pid);
                          unique.push(p);
                        }
                      }
                      return unique.slice(0, 3);
                    })()
                  : [];

                // Lista filtrada por categoría + búsqueda
                const normalizedQuery = toppingSearch.trim().toLowerCase();
                const visibleToppings = isEditingThisItem
                  ? foodAdiciones.filter((ad) => {
                      const matchesCat =
                        activeToppingCat === "todos" ||
                        classifyToppingCategory(ad) === activeToppingCat;
                      const matchesQuery =
                        !normalizedQuery ||
                        String(ad.nombre || "").toLowerCase().includes(normalizedQuery);
                      return matchesCat && matchesQuery;
                    })
                  : [];

                const applyUpdatedAdiciones = (nextAdds) => {
                  const nextKey = updateItemAdiciones?.(item.cartItemId, nextAdds);
                  if (isEditingThisItem && nextKey) {
                    setEditingCartToppingsKey(nextKey);
                  }
                  return nextKey;
                };

                const handleToggleOrAddTopping = (ad) => {
                  setUndoToppingsSnapshot(null);
                  const adId = Number(ad.idAdicion || ad.id || ad.idInsumo);
                  const exists = currentAdds.some((x) => Number(x.idAdicion || x.id) === adId);
                  const nextAdds = exists
                    ? currentAdds.filter((x) => Number(x.idAdicion || x.id) !== adId)
                    : [
                        ...currentAdds,
                        {
                          idAdicion: adId,
                          nombre: ad.nombre,
                          precio: Number(ad.precio || 0),
                          cantidad: 1,
                          imagen: typeof getAdicionImage === "function" ? getAdicionImage(ad) : (ad.imagen || "")
                        }
                      ];
                  applyUpdatedAdiciones(nextAdds);
                };

                const handleStepToppingQty = (ad, delta, e) => {
                  if (e) e.stopPropagation();
                  setUndoToppingsSnapshot(null);
                  const adId = Number(ad.idAdicion || ad.id || ad.idInsumo);
                  const nextAdds = currentAdds
                    .map((x) => {
                      if (Number(x.idAdicion || x.id) !== adId) return x;
                      const nextQty = (Number(x.cantidad) || 1) + delta;
                      return nextQty > 0 ? { ...x, cantidad: nextQty } : null;
                    })
                    .filter(Boolean);
                  applyUpdatedAdiciones(nextAdds);
                };

                const handleClearAllToppingsWithUndo = () => {
                  if (currentAdds.length === 0) return;
                  const snapshotAdds = [...currentAdds];
                  const nextKey = applyUpdatedAdiciones([]);
                  setUndoToppingsSnapshot({
                    targetKey: nextKey || item.cartItemId,
                    previousAdds: snapshotAdds,
                    count: snapshotAdds.length
                  });
                };

                const handleUndoClearToppings = () => {
                  if (!undoToppingsSnapshot) return;
                  const restoredKey = updateItemAdiciones?.(
                    item.cartItemId,
                    undoToppingsSnapshot.previousAdds
                  );
                  if (isEditingThisItem && restoredKey) {
                    setEditingCartToppingsKey(restoredKey);
                  }
                  setUndoToppingsSnapshot(null);
                };

                const hasUndoForThisItem =
                  undoToppingsSnapshot &&
                  undoToppingsSnapshot.targetKey === item.cartItemId &&
                  currentAdds.length === 0;

                return (
                  <article
                    key={itemKey}
                    className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all overflow-hidden ${
                      isEditingThisItem
                        ? "border-[#D9383A]/55 dark:border-red-500/50 shadow-md ring-1 ring-[#D9383A]/15"
                        : "border-slate-200/85 dark:border-gray-800 shadow-2xs hover:border-slate-300 dark:hover:border-gray-700"
                    }`}
                  >
                    {/* ── NIVEL 1: LECTURA RÁPIDA DEL PRODUCTO, EXTRAS ACTIVOS Y SUBTOTAL ── */}
                    <div className="p-4 flex items-start gap-3.5">
                      {optimizedItemImg ? (
                        <img
                          src={optimizedItemImg}
                          alt={item.nombre}
                          width="60"
                          height="60"
                          loading="lazy"
                          decoding="async"
                          className={`w-15 h-15 rounded-xl shrink-0 border border-slate-100 dark:border-gray-800 ${
                            isItemDrink
                              ? "object-contain p-1 bg-slate-50 dark:bg-gray-800"
                              : "object-cover bg-slate-100 dark:bg-gray-800"
                          }`}
                        />
                      ) : (
                        <FoodIconBadge name={item.nombre} size="md" className="mt-0.5 shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Encabezado del ítem: Nombre completo (sin truncado agresivo) + Eliminar */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm sm:text-[15px] text-slate-900 dark:text-white leading-snug break-words">
                              {item.nombre}
                            </h3>
                            <p className="text-[11.5px] text-slate-500 dark:text-gray-400 font-medium mt-0.5 tabular-nums">
                              Base {formatCOP(baseItemPrice)}
                              {additionsUnit > 0 && (
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                  {" "}
                                  + extras {formatCOP(additionsUnit)}
                                </span>
                              )}
                              {item.cantidad > 1 && ` · ${formatCOP(unitPriceWithAdds)} c/u`}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isEditingThisItem) {
                                setEditingCartToppingsKey(null);
                                setToppingSearch("");
                              }
                              removeFromCart?.(item.cartItemId || item.id);
                            }}
                            aria-label={`Eliminar ${item.nombre} del carrito`}
                            className="w-8 h-8 -mt-1 -mr-1 rounded-xl text-slate-400 hover:text-[#D9383A] hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition cursor-pointer shrink-0"
                            title="Eliminar producto del carrito"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Extras activos como chips claros y removibles + exclusiones de receta */}
                        {(isPromoEvent ||
                          (item.observaciones && item.observaciones.toLowerCase().includes("bebida")) ||
                          currentAdds.length > 0 ||
                          (item.personalizaciones && item.personalizaciones.length > 0)) && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {isPromoEvent && (
                              <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-[#D9383A] dark:text-red-300 border border-red-200/70 dark:border-red-900/50 inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3 shrink-0" />
                                <span>{item.eventoInfo?.nombre || "Promoción activa"}</span>
                              </span>
                            )}

                            {item.observaciones && item.observaciones.toLowerCase().includes("bebida") && (
                              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200/80 dark:border-gray-700 inline-flex items-center gap-1">
                                <FoodIcon name="drink" size={12} className="text-[#D9383A] shrink-0" />
                                <span>
                                  {item.observaciones
                                    .split("•")
                                    .find((s) => s.toLowerCase().includes("bebida"))
                                    ?.trim() || item.observaciones}
                                </span>
                              </span>
                            )}

                            {currentAdds.map((a, aIdx) => {
                              const chipAdId = Number(a.idAdicion || a.id);
                              const chipTotal = (Number(a.precio) || 0) * (Number(a.cantidad) || 1);
                              return (
                                <span
                                  key={chipAdId || aIdx}
                                  className="text-[11px] bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200/90 dark:border-emerald-800/60 pl-2.5 pr-1 py-0.5 rounded-lg font-bold inline-flex items-center gap-1.5"
                                >
                                  <span>
                                    +{a.cantidad > 1 ? `${a.cantidad}x ` : ""}
                                    {a.nombre}{" "}
                                    <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                                      ({formatCOP(chipTotal)})
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextAdds = currentAdds.filter(
                                        (x) => Number(x.idAdicion || x.id) !== chipAdId
                                      );
                                      applyUpdatedAdiciones(nextAdds);
                                    }}
                                    aria-label={`Quitar extra ${a.nombre}`}
                                    className="w-5 h-5 rounded-md hover:bg-emerald-200/80 dark:hover:bg-emerald-800 flex items-center justify-center text-emerald-800 dark:text-emerald-200 cursor-pointer transition"
                                    title={`Quitar ${a.nombre}`}
                                  >
                                    <X className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                </span>
                              );
                            })}

                            {item.personalizaciones &&
                              item.personalizaciones.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="text-[11px] bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200/80 dark:border-gray-700 px-2 py-0.5 rounded-lg font-semibold inline-flex items-center gap-1"
                                >
                                  <Ban className="w-3 h-3 text-[#D9383A] shrink-0" />
                                  <span>{p}</span>
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Barra reversible cuando se acaba de pulsar "Quitar todos" */}
                        {hasUndoForThisItem && (
                          <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-2 text-xs">
                            <span className="text-amber-900 dark:text-amber-200 font-semibold">
                              Se quitaron {undoToppingsSnapshot.count}{" "}
                              {undoToppingsSnapshot.count === 1 ? "topping" : "toppings"}
                            </span>
                            <button
                              type="button"
                              onClick={handleUndoClearToppings}
                              className="inline-flex items-center gap-1 font-extrabold text-[#D9383A] dark:text-red-400 hover:underline cursor-pointer shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Deshacer</span>
                            </button>
                          </div>
                        )}

                        {/* Controles ergonómicos de cantidad + botón de toppings + subtotal de línea */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-gray-800/80">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Stepper principal ergonómico (34x34px táctil) */}
                            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200/80 dark:border-gray-700">
                              <button
                                type="button"
                                onClick={() => updateQuantity?.(item.cartItemId || item.id, -1)}
                                aria-label={`Reducir cantidad de ${item.nombre}`}
                                className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center text-slate-800 dark:text-gray-100 hover:bg-slate-200/70 dark:hover:bg-gray-600 cursor-pointer active:scale-95 transition shadow-2xs"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[2.75]" />
                              </button>
                              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white min-w-7 text-center tabular-nums">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (totalInCartForProd >= prodStock) {
                                    onStockLimitError?.(item.nombre, prodStock);
                                  } else {
                                    updateQuantity?.(item.cartItemId || item.id, 1);
                                  }
                                }}
                                aria-label={`Aumentar cantidad de ${item.nombre}`}
                                className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center text-slate-800 dark:text-gray-100 hover:bg-slate-200/70 dark:hover:bg-gray-600 cursor-pointer active:scale-95 transition shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
                              </button>
                            </div>

                            {!isItemDrink && foodAdiciones.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setToppingSearch("");
                                  setActiveToppingCat("todos");
                                  setEditingCartToppingsKey((prev) => (prev === itemKey ? null : itemKey));
                                }}
                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
                                  isEditingThisItem
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                                    : "bg-slate-100 hover:bg-slate-200/80 dark:bg-gray-800 dark:hover:bg-gray-750 text-slate-800 dark:text-gray-200 border border-slate-200/80 dark:border-gray-700"
                                }`}
                              >
                                {isEditingThisItem ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[2.75]" />
                                    <span>Listo</span>
                                  </>
                                ) : (
                                  <>
                                    <Sliders className="w-3.5 h-3.5 text-[#D9383A] dark:text-red-400" />
                                    <span>Personalizar toppings</span>
                                    {totalToppingsUnits > 0 && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-[#D9383A] text-white text-[10px] font-black leading-none">
                                        {totalToppingsUnits}
                                      </span>
                                    )}
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">
                              Subtotal
                            </span>
                            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                              {formatCOP(lineTotalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── NIVEL 2: PANEL ORGANIZADO DE TOPPINGS (RECOMENDADOS + FILTROS + BUSCADOR + GRILLA) ── */}
                    {isEditingThisItem && (
                      <div className="border-t border-slate-100 dark:border-gray-800 bg-slate-50/90 dark:bg-gray-800/40 p-4 space-y-3.5 animate-in fade-in duration-150">
                        {/* Encabezado del panel + Quitar todos reversible */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-[#D9383A] dark:text-red-400 shrink-0" />
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              Personaliza tus toppings
                            </span>
                            {totalToppingsUnits > 0 && (
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                · +{formatCOP(additionsUnit)}
                              </span>
                            )}
                          </div>

                          {currentAdds.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearAllToppingsWithUndo}
                              className="text-[11px] font-bold text-slate-500 hover:text-[#D9383A] dark:text-gray-400 dark:hover:text-red-400 cursor-pointer transition underline-offset-2 hover:underline"
                            >
                              Quitar todos ({totalToppingsUnits})
                            </button>
                          )}
                        </div>

                        {/* Upselling contextual sutil: 2-3 recomendados de alto encaje arriba del catálogo */}
                        {contextualRecommendedToppings.length > 0 && !normalizedQuery && activeToppingCat === "todos" && (
                          <div className="bg-white dark:bg-gray-900/90 rounded-xl border border-slate-200/80 dark:border-gray-700/80 p-2.5 space-y-2">
                            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#D9383A] dark:text-red-400" />
                              <span>Recomendados para acompañar este plato</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              {contextualRecommendedToppings.map((recAd) => {
                                const recId = Number(recAd.idAdicion || recAd.id || recAd.idInsumo);
                                return (
                                  <button
                                    key={recId}
                                    type="button"
                                    onClick={() => handleToggleOrAddTopping(recAd)}
                                    className="p-2 rounded-lg bg-slate-50/90 hover:bg-red-50/60 dark:bg-gray-800 dark:hover:bg-red-950/25 border border-slate-200/70 hover:border-[#D9383A]/40 dark:border-gray-700 text-left flex items-center justify-between gap-2 transition cursor-pointer group"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[11px] font-bold text-slate-800 dark:text-gray-100 leading-tight line-clamp-2">
                                        {recAd.nombre}
                                      </p>
                                      <span className="text-[10.5px] font-extrabold text-[#D9383A] dark:text-red-400 tabular-nums">
                                        +{formatCOP(recAd.precio)}
                                      </span>
                                    </div>
                                    <span className="w-6 h-6 rounded-md bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-600 group-hover:bg-[#D9383A] group-hover:text-white group-hover:border-[#D9383A] text-slate-700 dark:text-gray-200 flex items-center justify-center shrink-0 transition">
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Buscador + Pestañas rápidas por categoría */}
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={toppingSearch}
                              onChange={(e) => setToppingSearch(e.target.value)}
                              placeholder="Buscar topping o salsa..."
                              className="w-full pl-8 pr-8 py-2 rounded-xl bg-white dark:bg-gray-900 border border-slate-200/90 dark:border-gray-700 text-xs text-slate-800 dark:text-gray-100 placeholder:text-slate-400 outline-none focus:border-[#D9383A]"
                            />
                            {toppingSearch && (
                              <button
                                type="button"
                                onClick={() => setToppingSearch("")}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                            {TOPPING_CATEGORY_TABS.map((tab) => {
                              const count = categoryCounts[tab.id] || 0;
                              if (tab.id !== "todos" && count === 0) return null;
                              const isTabActive = activeToppingCat === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setActiveToppingCat(tab.id)}
                                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-extrabold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                                    isTabActive
                                      ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-2xs"
                                      : "bg-white dark:bg-gray-900 border-slate-200/85 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:border-slate-300"
                                  }`}
                                >
                                  <span>{tab.label}</span>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                      isTabActive
                                        ? "bg-white/20 dark:bg-slate-900/15"
                                        : "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400"
                                    }`}
                                  >
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Grilla legible de toppings sin textos truncados */}
                        {visibleToppings.length === 0 ? (
                          <div className="text-center py-4 px-3 rounded-xl bg-white dark:bg-gray-900/60 border border-dashed border-slate-200 dark:border-gray-700 text-xs text-slate-500 dark:text-gray-400">
                            No encontramos extras para este filtro.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {visibleToppings.map((ad) => {
                              const adId = Number(ad.idAdicion || ad.id || ad.idInsumo);
                              const selectedEntry = currentAdds.find(
                                (x) => Number(x.idAdicion || x.id) === adId
                              );
                              const isSelected = Boolean(selectedEntry);
                              const selectedQty = Number(selectedEntry?.cantidad || 1);

                              return (
                                <div
                                  key={adId}
                                  onClick={() => !isSelected && handleToggleOrAddTopping(ad)}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all select-none ${
                                    isSelected
                                      ? "bg-white dark:bg-gray-900 border-[#D9383A] ring-1 ring-[#D9383A]/20 shadow-2xs"
                                      : "bg-white dark:bg-gray-900/85 border-slate-200/85 dark:border-gray-700/80 hover:border-slate-300 dark:hover:border-gray-600 cursor-pointer"
                                  }`}
                                >
                                  <div
                                    onClick={(e) => {
                                      if (isSelected) {
                                        e.stopPropagation();
                                        handleToggleOrAddTopping(ad);
                                      }
                                    }}
                                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                                  >
                                    <ToppingAvatar
                                      adicion={ad}
                                      getAdicionImage={getAdicionImage}
                                      size="md"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-slate-900 dark:text-gray-100 leading-snug line-clamp-2 break-words">
                                        {ad.nombre}
                                      </p>
                                      <p className="text-[11px] font-extrabold text-[#D9383A] dark:text-red-400 tabular-nums mt-0.5">
                                        +{formatCOP(ad.precio)}
                                      </p>
                                    </div>
                                  </div>

                                  {isSelected ? (
                                    <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-gray-800 p-0.5 rounded-lg border border-[#D9383A]/30 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => handleStepToppingQty(ad, -1, e)}
                                        aria-label={`Reducir porción de ${ad.nombre}`}
                                        className="w-7 h-7 rounded-md bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-200 hover:bg-red-50 hover:text-[#D9383A] flex items-center justify-center transition cursor-pointer active:scale-95"
                                      >
                                        <Minus className="w-3.5 h-3.5 stroke-[2.75]" />
                                      </button>
                                      <span className="min-w-5 text-center text-xs font-black text-slate-900 dark:text-white tabular-nums">
                                        {selectedQty}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => handleStepToppingQty(ad, 1, e)}
                                        aria-label={`Aumentar porción de ${ad.nombre}`}
                                        className="w-7 h-7 rounded-md bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-200 hover:bg-red-50 hover:text-[#D9383A] flex items-center justify-center transition cursor-pointer active:scale-95"
                                      >
                                        <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleOrAddTopping(ad);
                                      }}
                                      aria-label={`Agregar ${ad.nombre}`}
                                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-[#D9383A] hover:text-white text-slate-700 dark:text-gray-200 flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95"
                                    >
                                      <Plus className="w-4 h-4 stroke-[2.5]" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500 dark:text-gray-400">
                            Los subtotales se actualizan al instante
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCartToppingsKey(null);
                              setToppingSearch("");
                              setActiveToppingCat("todos");
                            }}
                            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#D9383A] dark:hover:bg-[#B91C1C] text-white text-xs font-extrabold cursor-pointer transition"
                          >
                            Guardar y cerrar
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Upselling general de orden (bebidas / acompañamientos): sutil y oculto cuando se editan toppings */}
            {!editingCartToppingsKey && complementosOrden.length > 0 && (
              <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-slate-200/80 dark:border-gray-800 px-5 sm:px-6 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D9383A] dark:text-red-400" />
                    <span>Recomendados para acompañar</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onScrollComplementos?.("left")}
                      aria-label="Ver anterior recomendado"
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 flex items-center justify-center transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onScrollComplementos?.("right")}
                      aria-label="Ver siguiente recomendado"
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 flex items-center justify-center transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  ref={complementosRef}
                  className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth snap-x snap-mandatory"
                >
                  {complementosOrden.slice(0, 6).map((comp) => (
                    <div
                      key={comp.id}
                      className="w-56 shrink-0 bg-slate-50/90 dark:bg-gray-800/80 hover:bg-slate-100/80 dark:hover:bg-gray-800 rounded-xl p-2 flex items-center justify-between gap-2.5 snap-start border border-slate-200/80 dark:border-gray-700/80 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 border border-slate-200/70 dark:border-gray-700 flex items-center justify-center p-1 shrink-0">
                        <img
                          src={getOptimizedImageUrl(comp.imagen, 96)}
                          alt={comp.nombre}
                          width="36"
                          height="36"
                          loading="lazy"
                          decoding="async"
                          className="max-h-full max-w-full object-contain select-none"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-gray-100 leading-tight line-clamp-1">
                          {comp.nombre}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-extrabold text-[#D9383A] dark:text-red-400 tabular-nums">
                            {formatCOP(comp.precio)}
                          </span>
                          {comp.tamano && (
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 truncate">
                              · {comp.tamano}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddComplemento?.(comp)}
                        aria-label={`Agregar ${comp.nombre} al carrito`}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-900 hover:bg-[#D9383A] hover:text-white text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-gray-700 hover:border-[#D9383A] text-[11px] font-extrabold shadow-2xs active:scale-95 transition cursor-pointer shrink-0 inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 stroke-[2.75]" />
                        <span>Sumar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ 3. RESUMEN TRANSPARENTE Y CTA PRINCIPAL DE ALTA CONVERSIÓN ═══ */}
        {cart.length > 0 && (
          <footer className="px-5 sm:px-6 py-4 bg-white dark:bg-gray-900 border-t border-slate-200/85 dark:border-gray-800 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] space-y-3 shrink-0">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-gray-400">
                <span>Subtotal de productos ({totalUnits})</span>
                <span className="font-bold text-slate-900 dark:text-gray-200 tabular-nums">
                  {formatCOP(clientSubtotal)}
                </span>
              </div>

              {promoSavingsTotal > 0 && (
                <div className="flex justify-between items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Ahorro aplicado en ofertas</span>
                  <span className="font-bold tabular-nums">-{formatCOP(promoSavingsTotal)}</span>
                </div>
              )}

              {discountPercent > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/45 px-3 py-1.5 rounded-xl border border-emerald-200/90 dark:border-emerald-800/60">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Beneficio Fidelidad ({discountPercent}%)</span>
                  </span>
                  <span className="font-extrabold tabular-nums">-{formatCOP(clientDiscountMonto)}</span>
                </div>
              )}

              {/* Aviso claro y transparente sobre el costo del domicilio antes del pago */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-gray-800/70 border border-slate-200/80 dark:border-gray-700/80 text-[11px] text-slate-600 dark:text-gray-300 leading-snug">
                <Truck className="w-4 h-4 text-[#D9383A] dark:text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold text-slate-800 dark:text-gray-100">Sobre el envío:</strong>{" "}
                  El costo del domicilio se cancela aparte al recibir tu pedido (o puedes recoger en tienda sin costo).
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-100 dark:border-gray-800">
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Total del pedido
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#D9383A] dark:text-red-400 tabular-nums tracking-tight">
                  {formatCOP(totalCheckout)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-5 bg-[#D9383A] hover:bg-[#B91C1C] text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-[#D9383A]/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 opacity-90" />
                <span>Continuar al Pago</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-xl font-black tabular-nums text-xs sm:text-sm">
                <span>{formatCOP(totalCheckout)}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
