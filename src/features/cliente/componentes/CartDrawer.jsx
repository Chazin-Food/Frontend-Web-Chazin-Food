import React, { useState, useMemo, useRef } from "react";
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
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { FoodIcon, FoodIconBadge } from "@/shared/components/ui/FoodIcon";
import QuantityStepperInput, { AdicionAvatar } from "@/shared/components/ui/QuantityStepperInput";
import { getOptimizedImageUrl } from "@/shared/utils/imageUtils";
import {
  resolveAdicionUnitMeta,
  resolveAdicionMaxPortions,
  getAdicionQuantityInCart,
  resolveValidAdicionImage
} from "@/shared/utils/adicionUtils";

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
 * Carrito de Compras Amplio Split-Panel ("Tu Carrito") de Chazin Food.
 * En escritorio despliega una arquitectura espaciosa de 2 columnas (hasta 1180px):
 *  - Izquierda (66%): Lienzo amplio y respirable para platos y personalización de toppings en 3 columnas.
 *  - Derecha (34%): Columna dedicada a acompañamientos sugeridos, resumen transparente, domicilio y pago.
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
  const [undoToppingsSnapshot, setUndoToppingsSnapshot] = useState(null);
  const itemRefs = useRef({});

  const totalUnits = useMemo(
    () => cart.reduce((acc, it) => acc + Number(it.cantidad || 1), 0),
    [cart]
  );

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
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
      onClick={handleCloseDrawer}
    >
      <aside
        aria-label="Tu Carrito de Compras"
        className={`bg-[#F8FAFC] dark:bg-gray-950 w-full ${
          cart.length > 0
            ? "sm:max-w-2xl lg:max-w-[1020px] xl:max-w-[1160px] 2xl:max-w-[1240px]"
            : "max-w-lg"
        } h-[100dvh] pb-safe shadow-2xl flex flex-col border-l border-slate-200/80 dark:border-gray-800 animate-in slide-in-from-right duration-300 cursor-default transition-[max-width]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ 1. ENCABEZADO AMPLIO Y RESPIRABLE ═══ */}
        <header className="px-5 sm:px-7 lg:px-8 py-4 bg-white dark:bg-gray-900 border-b border-slate-200/80 dark:border-gray-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#D9383A]/10 dark:bg-red-950/60 text-[#D9383A] dark:text-red-400 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 stroke-[2.25]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Tu Carrito de Compras
                </h2>
                {totalUnits > 0 && (
                  <span className="text-xs bg-slate-900 dark:bg-[#D9383A] text-white font-extrabold px-3 py-0.5 rounded-full shrink-0">
                    {totalUnits} {totalUnits === 1 ? "producto" : "productos"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 hidden sm:block mt-0.5">
                {totalUnits > 0
                  ? "Ajusta cantidades, personaliza toppings por categoría y revisa tu resumen con total claridad"
                  : "Tu orden artesanal comienza aquí"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Seguir comprando</span>
              </button>
            )}

            {cart.length > 0 && (
              confirmClearCart ? (
                <div className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/70 px-2.5 py-1.5 rounded-xl animate-in fade-in duration-150">
                  <span className="text-xs font-bold text-[#B91C1C] dark:text-red-300 px-1">
                    ¿Vaciar todo?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      clearCart?.();
                      setConfirmClearCart(false);
                      setEditingCartToppingsKey(null);
                      setUndoToppingsSnapshot(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#D9383A] hover:bg-[#B91C1C] text-white text-xs font-extrabold cursor-pointer transition"
                  >
                    Sí, vaciar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearCart(false)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 text-xs font-bold cursor-pointer hover:bg-slate-100 transition"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearCart(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-[#D9383A] hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition cursor-pointer"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Vaciar</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={handleCloseDrawer}
              aria-label="Cerrar carrito de compras"
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 flex items-center justify-center transition cursor-pointer"
              title="Cerrar carrito"
            >
              <X className="w-5 h-5 stroke-[2.25]" />
            </button>
          </div>
        </header>

        {/* ═══ 2. CONTENIDO SPLIT-PANEL (2 COLUMNAS EN LG+) ═══ */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center space-y-4">
            <div className="w-20 h-20 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-3xl shadow-xs flex items-center justify-center text-[#D9383A] dark:text-red-400">
              <ShoppingCart className="w-9 h-9 stroke-[1.75]" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                Tu carrito está vacío
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
                Descubre nuestras hamburguesas artesanales, perros calientes especiales, salchipapas gourmet y combos.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="px-6 py-3 rounded-xl bg-[#D9383A] hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-extrabold shadow-sm transition cursor-pointer active:scale-95"
            >
              Explorar el menú
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12">
            {/* ══════════════════════════════════════════════════════════════════
                COLUMNA IZQUIERDA (LG: 8 COLS): LIENZO AMPLIO DE PLATOS Y TOPPINGS
               ══════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 lg:col-span-7 xl:col-span-8 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4 scrollbar-thin">
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
                    ? getOptimizedImageUrl(displayImg, 160)
                    : "";

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

                const contextualRecommendedToppings = isEditingThisItem
                  ? (() => {
                      const selectedIds = new Set(
                        currentAdds.map((x) => Number(x.idAdicion || x.id))
                      );
                      const unselected = foodAdiciones.filter(
                        (ad) => !selectedIds.has(Number(ad.idAdicion || ad.id || ad.idInsumo))
                      );
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

                const getToppingStockInfo = (ad) => {
                  const adId = Number(ad?.idAdicion || ad?.id || ad?.idInsumo);
                  const noCtrl =
                    ad?.controlarStock === false ||
                    String(ad?.descripcion || "").includes("[SIN_CONTROL_STOCK]");
                  if (noCtrl) return { maxPerDish: 99, availableBeforeThisLine: 99, noCtrl: true };
                  const totalPortions = resolveAdicionMaxPortions(ad);
                  const usedInOtherLines = getAdicionQuantityInCart(cart, adId, item.cartItemId);
                  const availableBeforeThisLine = Math.max(0, totalPortions - usedInOtherLines);
                  const maxPerDish = Math.floor(
                    availableBeforeThisLine / Math.max(1, Number(item.cantidad || 1))
                  );
                  return { maxPerDish, availableBeforeThisLine, noCtrl: false };
                };

                const handleToggleOrAddTopping = (ad) => {
                  setUndoToppingsSnapshot(null);
                  const adId = Number(ad.idAdicion || ad.id || ad.idInsumo);
                  const exists = currentAdds.some((x) => Number(x.idAdicion || x.id) === adId);
                  if (!exists) {
                    const { maxPerDish, noCtrl } = getToppingStockInfo(ad);
                    if (!noCtrl && maxPerDish <= 0) {
                      onStockLimitError?.(ad.nombre, 0);
                      return;
                    }
                  }
                  const nextAdds = exists
                    ? currentAdds.filter((x) => Number(x.idAdicion || x.id) !== adId)
                    : [
                        ...currentAdds,
                        {
                          idAdicion: adId,
                          nombre: ad.nombre,
                          precio: Number(ad.precio || 0),
                          cantidad: 1,
                          unidadMedida: ad.unidadMedida,
                          porcionMinimaCantidad: ad.porcionMinimaCantidad,
                          porcionMinimaUnidad: ad.porcionMinimaUnidad,
                          imagen: resolveValidAdicionImage(ad)
                        }
                      ];
                  applyUpdatedAdiciones(nextAdds);
                };

                const handleSetToppingExactQty = (ad, exactQty) => {
                  setUndoToppingsSnapshot(null);
                  const adId = Number(ad.idAdicion || ad.id || ad.idInsumo);
                  const cleanQty = Math.floor(Number(exactQty) || 0);
                  if (cleanQty <= 0) {
                    const nextAdds = currentAdds.filter((x) => Number(x.idAdicion || x.id) !== adId);
                    applyUpdatedAdiciones(nextAdds);
                    return;
                  }
                  const { maxPerDish, noCtrl } = getToppingStockInfo(ad);
                  const clamped = noCtrl ? Math.min(99, cleanQty) : Math.min(Math.max(1, maxPerDish), cleanQty);
                  const nextAdds = currentAdds.map((x) =>
                    Number(x.idAdicion || x.id) === adId ? { ...x, cantidad: clamped } : x
                  );
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
                    ref={(el) => {
                      if (el) itemRefs.current[itemKey] = el;
                    }}
                    className={`bg-white dark:bg-gray-900 rounded-3xl border transition-all overflow-hidden ${
                      isEditingThisItem
                        ? "border-[#D9383A]/55 dark:border-red-500/50 shadow-lg ring-1 ring-[#D9383A]/15"
                        : "border-slate-200/85 dark:border-gray-800 shadow-2xs hover:border-slate-300 dark:hover:border-gray-700"
                    }`}
                  >
                    {/* ── ZONA PRINCIPAL DE LA TARJETA: AMPLITUD VISUAL Y JERARQUÍA CLARA ── */}
                    <div className="p-4 sm:p-5 lg:p-6 flex items-start gap-4">
                      {optimizedItemImg ? (
                        <img
                          src={optimizedItemImg}
                          alt={item.nombre}
                          width="72"
                          height="72"
                          loading="lazy"
                          decoding="async"
                          className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl shrink-0 border border-slate-100 dark:border-gray-800 ${
                            isItemDrink
                              ? "object-contain p-1.5 bg-slate-50 dark:bg-gray-800"
                              : "object-cover bg-slate-100 dark:bg-gray-800"
                          }`}
                        />
                      ) : (
                        <FoodIconBadge name={item.nombre} size="lg" className="mt-0.5 shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-snug break-words">
                              {item.nombre}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium mt-0.5 tabular-nums">
                              Precio base {formatCOP(baseItemPrice)}
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
                            className="w-9 h-9 -mt-1 -mr-1 rounded-xl text-slate-400 hover:text-[#D9383A] hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition cursor-pointer shrink-0"
                            title="Eliminar producto del carrito"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Chips espaciosos de extras activos y exclusiones */}
                        {(isPromoEvent ||
                          (item.observaciones && item.observaciones.toLowerCase().includes("bebida")) ||
                          currentAdds.length > 0 ||
                          (item.personalizaciones && item.personalizaciones.length > 0)) && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {isPromoEvent && (
                              <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#D9383A] dark:text-red-300 border border-red-200/70 dark:border-red-900/50 inline-flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.eventoInfo?.nombre || "Promoción activa"}</span>
                              </span>
                            )}

                            {item.observaciones && item.observaciones.toLowerCase().includes("bebida") && (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200/80 dark:border-gray-700 inline-flex items-center gap-1.5">
                                <FoodIcon name="drink" size={13} className="text-[#D9383A] shrink-0" />
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
                              const catalogAd =
                                foodAdiciones.find(
                                  (fa) => Number(fa.idAdicion || fa.id || fa.idInsumo) === chipAdId
                                ) || a;
                              const chipUnitMeta = resolveAdicionUnitMeta(catalogAd, a.cantidad || 1);
                              return (
                                <span
                                  key={chipAdId || aIdx}
                                  className="text-xs bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200/90 dark:border-emerald-800/60 pl-3 pr-1.5 py-1 rounded-xl font-bold inline-flex items-center gap-1.5"
                                >
                                  <span>
                                    +{chipUnitMeta.formattedQty} · {a.nombre}{" "}
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
                                  className="text-xs bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200/80 dark:border-gray-700 px-2.5 py-1 rounded-xl font-semibold inline-flex items-center gap-1.5"
                                >
                                  <Ban className="w-3 h-3 text-[#D9383A] shrink-0" />
                                  <span>{p}</span>
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Barra reversible al quitar todos */}
                        {hasUndoForThisItem && (
                          <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-2 text-xs">
                            <span className="text-amber-900 dark:text-amber-200 font-semibold">
                              Se quitaron {undoToppingsSnapshot.count}{" "}
                              {undoToppingsSnapshot.count === 1 ? "topping" : "toppings"} de este plato
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

                        {/* Fila inferior del plato: Stepper táctil editable + Stock vivo + Botón Toppings + Subtotal de línea */}
                        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-gray-800/80">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {(() => {
                              const otherLinesQty = Math.max(0, totalInCartForProd - Number(item.cantidad || 1));
                              const maxLineStock = prodStock > 0 ? Math.max(1, Math.floor(prodStock) - otherLinesQty) : 99;
                              const liveRemainingProd = Math.max(0, Math.floor(prodStock) - totalInCartForProd);
                              return (
                                <>
                                  <QuantityStepperInput
                                    value={item.cantidad}
                                    min={1}
                                    max={maxLineStock}
                                    allowZeroRemove={true}
                                    size="md"
                                    ariaLabel={`cantidad de ${item.nombre}`}
                                    onChange={(nextVal) => {
                                      const delta = nextVal - Number(item.cantidad || 1);
                                      if (delta !== 0) updateQuantity?.(item.cartItemId || item.id, delta);
                                    }}
                                    onRemove={() => removeFromCart?.(item.cartItemId || item.id)}
                                    onMaxReached={() => onStockLimitError?.(item.nombre, prodStock)}
                                  />
                                  {prodStock > 0 && (
                                    <span
                                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums ${
                                        liveRemainingProd === 0
                                          ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                                          : liveRemainingProd <= 5
                                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                            : "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400"
                                      }`}
                                    >
                                      {liveRemainingProd} disp.
                                    </span>
                                  )}
                                </>
                              );
                            })()}

                            {!isItemDrink && foodAdiciones.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setToppingSearch("");
                                  setActiveToppingCat("todos");
                                  setEditingCartToppingsKey((prev) => {
                                    const next = prev === itemKey ? null : itemKey;
                                    if (next) {
                                      setTimeout(() => {
                                        itemRefs.current[itemKey]?.scrollIntoView({
                                          behavior: "smooth",
                                          block: "nearest"
                                        });
                                      }, 60);
                                    }
                                    return next;
                                  });
                                }}
                                className={`inline-flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[13px] font-extrabold transition-all cursor-pointer active:scale-95 ${
                                  isEditingThisItem
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                                    : "bg-slate-100 hover:bg-slate-200/80 dark:bg-gray-800 dark:hover:bg-gray-750 text-slate-800 dark:text-gray-200 border border-slate-200/80 dark:border-gray-700"
                                }`}
                              >
                                {isEditingThisItem ? (
                                  <>
                                    <Check className="w-4 h-4 stroke-[2.75]" />
                                    <span>Cerrar toppings</span>
                                  </>
                                ) : (
                                  <>
                                    <Sliders className="w-4 h-4 text-[#D9383A] dark:text-red-400" />
                                    <span>Personalizar toppings</span>
                                    {totalToppingsUnits > 0 && (
                                      <span className="px-2 py-0.5 rounded-full bg-[#D9383A] text-white text-[10.5px] font-black leading-none">
                                        {totalToppingsUnits}
                                      </span>
                                    )}
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="block text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">
                              Subtotal ítem
                            </span>
                            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                              {formatCOP(lineTotalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── ESTUDIO AMPLIO DE TOPPINGS (HASTA 3 COLUMNAS EN ESCRITORIO) ── */}
                    {isEditingThisItem && (
                      <div className="border-t border-slate-100 dark:border-gray-800 bg-slate-50/90 dark:bg-gray-800/35 p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-[#D9383A] dark:text-red-400 shrink-0" />
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              Personaliza tus toppings y salsas
                            </span>
                            {totalToppingsUnits > 0 && (
                              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                · +{formatCOP(additionsUnit)}
                              </span>
                            )}
                          </div>

                          {currentAdds.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearAllToppingsWithUndo}
                              className="text-xs font-bold text-slate-500 hover:text-[#D9383A] dark:text-gray-400 dark:hover:text-red-400 cursor-pointer transition underline-offset-2 hover:underline"
                            >
                              Quitar todos ({totalToppingsUnits})
                            </button>
                          )}
                        </div>

                        {/* Upselling contextual espacioso de 3 columnas */}
                        {contextualRecommendedToppings.length > 0 && !normalizedQuery && activeToppingCat === "todos" && (
                          <div className="bg-white dark:bg-gray-900/90 rounded-2xl border border-slate-200/80 dark:border-gray-700/80 p-3.5 space-y-2.5">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#D9383A] dark:text-red-400" />
                              <span>Recomendados para acompañar este plato</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {contextualRecommendedToppings.map((recAd) => {
                                const recId = Number(recAd.idAdicion || recAd.id || recAd.idInsumo);
                                const recUnit = resolveAdicionUnitMeta(recAd, 1);
                                const { maxPerDish, availableBeforeThisLine, noCtrl } = getToppingStockInfo(recAd);
                                if (!noCtrl && maxPerDish <= 0) return null;
                                return (
                                  <button
                                    key={recId}
                                    type="button"
                                    onClick={() => handleToggleOrAddTopping(recAd)}
                                    className="p-2.5 rounded-xl bg-slate-50/90 hover:bg-red-50/60 dark:bg-gray-800 dark:hover:bg-red-950/25 border border-slate-200/80 hover:border-[#D9383A]/40 dark:border-gray-700 text-left flex items-center justify-between gap-2.5 transition cursor-pointer group"
                                  >
                                    <AdicionAvatar adicion={recAd} size="sm" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-slate-800 dark:text-gray-100 leading-snug line-clamp-2">
                                        {recAd.nombre}
                                      </p>
                                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                        <span className="text-[11px] font-extrabold text-[#D9383A] dark:text-red-400 tabular-nums">
                                          +{formatCOP(recAd.precio)}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-400">
                                          · {recUnit.badge}
                                        </span>
                                        {!noCtrl && (
                                          <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-500 tabular-nums">
                                            · {availableBeforeThisLine} disp.
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="w-7 h-7 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-600 group-hover:bg-[#D9383A] group-hover:text-white group-hover:border-[#D9383A] text-slate-700 dark:text-gray-200 flex items-center justify-center shrink-0 transition">
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Barra horizontal unificada: Buscador + Pestañas de Categoría en una sola línea en escritorio */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2.5">
                          <div className="relative md:w-64 shrink-0">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={toppingSearch}
                              onChange={(e) => setToppingSearch(e.target.value)}
                              placeholder="Buscar topping o salsa..."
                              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-gray-900 border border-slate-200/90 dark:border-gray-700 text-xs text-slate-800 dark:text-gray-100 placeholder:text-slate-400 outline-none focus:border-[#D9383A]"
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

                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
                            {TOPPING_CATEGORY_TABS.map((tab) => {
                              const count = categoryCounts[tab.id] || 0;
                              if (tab.id !== "todos" && count === 0) return null;
                              const isTabActive = activeToppingCat === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => setActiveToppingCat(tab.id)}
                                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer inline-flex items-center gap-1.5 ${
                                    isTabActive
                                      ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-2xs"
                                      : "bg-white dark:bg-gray-900 border-slate-200/85 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:border-slate-300"
                                  }`}
                                >
                                  <span>{tab.label}</span>
                                  <span
                                    className={`text-[10.5px] px-1.5 py-0.2 rounded-full ${
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

                        {/* Grilla amplia de hasta 3 columnas en escritorio */}
                        {visibleToppings.length === 0 ? (
                          <div className="text-center py-6 px-4 rounded-2xl bg-white dark:bg-gray-900/60 border border-dashed border-slate-200 dark:border-gray-700 text-xs text-slate-500 dark:text-gray-400">
                            No encontramos extras para este filtro.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            {visibleToppings.map((ad) => {
                              const adId = Number(ad.idAdicion || ad.id || ad.idInsumo);
                              const selectedEntry = currentAdds.find(
                                (x) => Number(x.idAdicion || x.id) === adId
                              );
                              const isSelected = Boolean(selectedEntry);
                              const selectedQty = Number(selectedEntry?.cantidad || 1);
                              const unitMeta = resolveAdicionUnitMeta(ad, selectedQty);
                              const { maxPerDish, availableBeforeThisLine, noCtrl } = getToppingStockInfo(ad);
                              const consumedHere = isSelected
                                ? selectedQty * Math.max(1, Number(item.cantidad || 1))
                                : 0;
                              const liveRemaining = Math.max(0, availableBeforeThisLine - consumedHere);
                              const isSoldOut = !noCtrl && maxPerDish <= 0 && !isSelected;

                              return (
                                <div
                                  key={adId}
                                  onClick={() => !isSelected && !isSoldOut && handleToggleOrAddTopping(ad)}
                                  className={`p-3 rounded-2xl border flex flex-col justify-between gap-2.5 transition-all select-none ${
                                    isSelected
                                      ? "bg-white dark:bg-gray-900 border-[#D9383A] ring-1 ring-[#D9383A]/20 shadow-xs"
                                      : isSoldOut
                                        ? "bg-white/60 dark:bg-gray-900/50 border-slate-200/70 dark:border-gray-800 opacity-65"
                                        : "bg-white dark:bg-gray-900/90 border-slate-200/85 dark:border-gray-700/80 hover:border-slate-300 dark:hover:border-gray-600 cursor-pointer"
                                  }`}
                                >
                                  <div
                                    onClick={(e) => {
                                      if (isSelected) {
                                        e.stopPropagation();
                                        handleToggleOrAddTopping(ad);
                                      }
                                    }}
                                    className={`flex items-start gap-3 min-w-0 ${isSelected || !isSoldOut ? "cursor-pointer" : ""}`}
                                  >
                                    <AdicionAvatar adicion={ad} size="md" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-gray-100 leading-snug line-clamp-2 break-words">
                                        {ad.nombre}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200/80 dark:border-gray-700 text-[10.5px] font-bold">
                                          {unitMeta.badge}
                                        </span>
                                        {isSelected && selectedQty > 1 && (
                                          <span className="text-[10.5px] font-extrabold text-emerald-700 dark:text-emerald-400">
                                            ({unitMeta.formattedQty})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                      <span className="text-xs font-extrabold text-[#D9383A] dark:text-red-400 tabular-nums whitespace-nowrap">
                                        +{formatCOP(ad.precio)}
                                      </span>
                                      <span
                                        className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full tabular-nums whitespace-nowrap ${
                                          isSoldOut
                                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                                            : noCtrl
                                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                              : liveRemaining === 0
                                                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                                                : liveRemaining <= 5
                                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                                  : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300"
                                        }`}
                                      >
                                        {isSoldOut
                                          ? "Agotado"
                                          : noCtrl
                                            ? "Disponible"
                                            : `${liveRemaining} disp.`}
                                      </span>
                                    </div>

                                    {isSelected ? (
                                      <QuantityStepperInput
                                        value={selectedQty}
                                        min={1}
                                        max={Math.max(1, maxPerDish)}
                                        allowZeroRemove={true}
                                        ariaLabel={`porción de ${ad.nombre}`}
                                        onChange={(val) => handleSetToppingExactQty(ad, val)}
                                        onRemove={() => handleToggleOrAddTopping(ad)}
                                        onMaxReached={(limit) =>
                                          onStockLimitError?.(ad.nombre, limit)
                                        }
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={isSoldOut}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleOrAddTopping(ad);
                                        }}
                                        aria-label={`Agregar ${ad.nombre}`}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition shrink-0 active:scale-95 ${
                                          isSoldOut
                                            ? "bg-slate-100 dark:bg-gray-800 text-slate-400 cursor-not-allowed"
                                            : "bg-slate-100 dark:bg-gray-800 hover:bg-[#D9383A] hover:text-white text-slate-800 dark:text-gray-200 cursor-pointer"
                                        }`}
                                      >
                                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>{isSoldOut ? "Agotado" : "Agregar"}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500 dark:text-gray-400">
                            Los subtotales y descuentos se actualizan automáticamente
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCartToppingsKey(null);
                              setToppingSearch("");
                              setActiveToppingCat("todos");
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#D9383A] dark:hover:bg-[#B91C1C] text-white text-xs font-extrabold cursor-pointer transition"
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

            {/* ══════════════════════════════════════════════════════════════════
                COLUMNA DERECHA (LG: 4 COLS): COMPLEMENTOS + RESUMEN + PAGO
               ══════════════════════════════════════════════════════════════════ */}
            <div className="shrink-0 lg:col-span-5 xl:col-span-4 bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-slate-200/85 dark:border-gray-800 flex flex-col justify-between lg:overflow-y-auto scrollbar-thin">
              {/* 1. Upselling de Bebidas / Acompañamientos: en móvil se oculta mientras se editan toppings; en escritorio vive holgado arriba */}
              {complementosOrden.length > 0 && (
                <div
                  className={`${
                    editingCartToppingsKey ? "hidden lg:block" : "block"
                  } px-5 sm:px-6 pt-4 pb-3 lg:py-6 border-b border-slate-100 dark:border-gray-800`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-gray-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#D9383A] dark:text-red-400" />
                      <span>Recomendados para acompañar</span>
                    </span>

                    {/* Flechas solo en móvil/tablet donde es carrusel horizontal */}
                    <div className="flex lg:hidden items-center gap-1">
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

                  {/* Carrusel horizontal en móvil / Lista vertical amplia de 3 opciones en escritorio */}
                  <div
                    ref={complementosRef}
                    className="flex lg:flex-col items-stretch gap-2.5 overflow-x-auto lg:overflow-visible no-scrollbar py-0.5 scroll-smooth snap-x snap-mandatory"
                  >
                    {complementosOrden.slice(0, 3).map((comp) => (
                      <div
                        key={comp.id}
                        className="w-60 lg:w-full shrink-0 bg-slate-50/90 dark:bg-gray-800/70 hover:bg-slate-100/80 dark:hover:bg-gray-800 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 snap-start border border-slate-200/80 dark:border-gray-700/80 transition-colors"
                      >
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-gray-900 border border-slate-200/70 dark:border-gray-700 flex items-center justify-center p-1 shrink-0">
                          <img
                            src={getOptimizedImageUrl(comp.imagen, 96)}
                            alt={comp.nombre}
                            width="40"
                            height="40"
                            loading="lazy"
                            decoding="async"
                            className="max-h-full max-w-full object-contain select-none"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-gray-100 leading-snug line-clamp-1">
                            {comp.nombre}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-extrabold text-[#D9383A] dark:text-red-400 tabular-nums">
                              {formatCOP(comp.precio)}
                            </span>
                            {comp.tamano && (
                              <span className="text-[11px] text-slate-400 dark:text-gray-500 truncate">
                                · {comp.tamano}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onAddComplemento?.(comp)}
                          aria-label={`Agregar ${comp.nombre} al carrito`}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-gray-900 hover:bg-[#D9383A] hover:text-white text-slate-800 dark:text-gray-200 border border-slate-200 dark:border-gray-700 hover:border-[#D9383A] text-xs font-extrabold shadow-2xs active:scale-95 transition cursor-pointer shrink-0 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.75]" />
                          <span>Agregar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Resumen del Pedido + Domicilio Transparente + CTA Principal */}
              <div className="px-5 sm:px-6 py-4 lg:py-6 space-y-4 mt-auto bg-white dark:bg-gray-900">
                <div className="space-y-2.5">
                  <h3 className="hidden lg:block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    Resumen de tu pedido
                  </h3>

                  <div className="flex justify-between items-center text-xs sm:text-sm text-slate-600 dark:text-gray-400">
                    <span>Subtotal de productos ({totalUnits})</span>
                    <span className="font-bold text-slate-900 dark:text-gray-200 tabular-nums">
                      {formatCOP(clientSubtotal)}
                    </span>
                  </div>

                  {promoSavingsTotal > 0 && (
                    <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      <span>Ahorro aplicado en ofertas</span>
                      <span className="font-bold tabular-nums">-{formatCOP(promoSavingsTotal)}</span>
                    </div>
                  )}

                  {discountPercent > 0 && (
                    <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/45 px-3.5 py-2 rounded-xl border border-emerald-200/90 dark:border-emerald-800/60">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Beneficio Fidelidad ({discountPercent}%)</span>
                      </span>
                      <span className="font-extrabold tabular-nums">-{formatCOP(clientDiscountMonto)}</span>
                    </div>
                  )}

                  {/* Aviso de envío (en móvil se compacta cuando se editan toppings para dar espacio) */}
                  <div
                    className={`${
                      editingCartToppingsKey ? "hidden lg:flex" : "flex"
                    } items-start gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-gray-800/70 border border-slate-200/80 dark:border-gray-700/80 text-xs text-slate-600 dark:text-gray-300 leading-relaxed`}
                  >
                    <Truck className="w-4 h-4 text-[#D9383A] dark:text-red-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-bold text-slate-800 dark:text-gray-100">Sobre el envío:</strong>{" "}
                      El costo del domicilio se cancela aparte al recibir tu pedido (o puedes recoger en tienda sin costo).
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-slate-200/80 dark:border-gray-800">
                    <div>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        Total del pedido
                      </span>
                      <span className="lg:hidden block text-[11px] text-slate-400 dark:text-gray-500">
                        Domicilio aparte al recibir
                      </span>
                    </div>
                    <span className="text-2xl sm:text-[26px] font-black text-[#D9383A] dark:text-red-400 tabular-nums tracking-tight">
                      {formatCOP(totalCheckout)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  className="w-full py-4 px-5 bg-[#D9383A] hover:bg-[#B91C1C] text-white font-extrabold rounded-2xl text-sm sm:text-base shadow-lg shadow-[#D9383A]/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 opacity-90" />
                    <span>Continuar al Pago</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-black/15 px-3.5 py-1 rounded-xl font-black tabular-nums text-sm">
                    <span>{formatCOP(totalCheckout)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
