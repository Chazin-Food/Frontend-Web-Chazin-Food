import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { loadStoredCart, saveStoredCart, clearStoredCart } from "@/shared/utils/secureStorage";
import { isEventActiveInColombia } from "@/shared/utils/dateUtils";
import { isVariantActive } from "@/shared/utils/productVariantUtils";

export const IVA_RATE = 0.19;
const CartContext = createContext(undefined);

function resolveLiveEventPrice(basePrice, evt, prodId) {
  if (!evt) return null;
  let asociacion = null;
  if (evt.productosAsociados) {
    try {
      const list = typeof evt.productosAsociados === "string"
        ? JSON.parse(evt.productosAsociados)
        : evt.productosAsociados;
      if (Array.isArray(list)) {
        asociacion = list.find((a) => String(a?.idProducto || a?.id) === String(prodId)) || null;
      }
    } catch (_) {}
  }
  const nuevoPrecio = Number(asociacion?.nuevoPrecio ?? evt.nuevoPrecio ?? 0);
  if (Number.isFinite(nuevoPrecio) && nuevoPrecio > 0) return nuevoPrecio;
  const descuento = Number(asociacion?.descuento ?? evt.descuento ?? 0);
  if (Number.isFinite(descuento) && descuento > 0 && descuento < 100) {
    return Math.max(0, Math.round(basePrice * (1 - descuento / 100)));
  }
  return null;
}

/**
 * Generates a unique, deterministic ID for an item in the cart based on:
 * - Product ID / Variant ID / Sabor
 * - Selected additions (id and quantity)
 * - Any special instructions
 */
export function generateCartItemId(item) {
  const prodId = item.id || item.idProducto;
  const varKey = item.esVarianteBase
    ? '_var[BASE]'
    : (item.idVariante && (String(item.idVariante) !== String(prodId) || item.varianteNombre || item.esVarianteDeEvento) ? `_var[${item.idVariante}]` : '');
  const saborKey = item.sabor ? `_sabor[${String(item.sabor).toLowerCase().trim()}]` : '';
  const evtKey = item.eventoInfo?.idEvento || (item.isEvento ? 'evt' : '');
  const adicionesKey = (item.adiciones || [])
    .map((a) => `${a.idAdicion || a.id}:${a.cantidad || 1}`)
    .sort()
    .join(",");
  const removedKey = Array.isArray(item.ingredientesRemovidos) && item.ingredientesRemovidos.length > 0
    ? `__sin[${[...item.ingredientesRemovidos].sort().join(",").toLowerCase()}]`
    : '';
  const obsKey = (item.observaciones || item.instrucciones || item.observacion || "").trim().toLowerCase();
  return `${prodId}${varKey}${saborKey}__evt[${evtKey}]__ads[${adicionesKey}]${removedKey}__obs[${obsKey}]`;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const parsed = loadStoredCart();
      if (Array.isArray(parsed)) {
        return parsed.map((it) => ({
          ...it,
          cartItemId: it.cartItemId || generateCartItemId(it)
        }));
      }
      return [];
    } catch (e) {
      console.warn("Error rehidratando carrito de compras:", e);
      return [];
    }
  });

  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Persist cart on changes (codificado y organizado bajo `cf_cart`)
  useEffect(() => {
    saveStoredCart(cart);
  }, [cart]);

  /**
   * Returns the total units of a given product currently in the cart
   */
  const getProductQuantityInCart = (productId) => {
    return (cartRef.current || cart)
      .filter((it) => String(it.id || it.idProducto) === String(productId))
      .reduce((sum, it) => sum + Number(it.cantidad || 0), 0);
  };

  /**
   * Checks if an addition of `qty` units is allowed according to product stock
   * Returns { allowed: boolean, maxAvailable: number, currentInCart: number }
   */
  const checkStockAvailability = (item, qtyToAdd = 1) => {
    const prodId = item.id || item.idProducto;
    const stock = Number(item.stock !== undefined ? item.stock : (item.stockActual !== undefined ? item.stockActual : 0));
    const inCart = getProductQuantityInCart(prodId);
    const maxAvailable = Math.max(0, stock - inCart);
    return {
      allowed: inCart + qtyToAdd <= stock,
      stock,
      currentInCart: inCart,
      maxAvailable
    };
  };

  /**
   * Adds one item or an array of items to the cart atomically without race conditions or state overwriting.
   */
  const addToCart = (itemOrItems) => {
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    if (items.length === 0) return { success: true, addedCount: 0 };

    let currentCart = [...(cartRef.current || cart)];
    let lastError = null;
    let addedCount = 0;

    for (const item of items) {
      if (!item) continue;
      const cartItemId = item.cartItemId || generateCartItemId(item);
      const prodId = item.id || item.idProducto;
      const stock = Number(item.stock !== undefined ? item.stock : (item.stockActual !== undefined ? item.stockActual : 0));
      const qtyToAdd = Number(item.cantidad || 1);

      // Calculate current total for this product in cart excluding the exact same line item if we are re-adding
      const otherLinesQty = currentCart
        .filter((it) => String(it.id || it.idProducto) === String(prodId) && it.cartItemId !== cartItemId)
        .reduce((sum, it) => sum + Number(it.cantidad || 0), 0);

      const existingIndex = currentCart.findIndex((it) => it.cartItemId === cartItemId);
      const currentLineQty = existingIndex >= 0 ? Number(currentCart[existingIndex].cantidad || 0) : 0;
      const newLineQty = currentLineQty + qtyToAdd;

      if (otherLinesQty + newLineQty > stock) {
        const allowedForThisLine = Math.max(0, stock - otherLinesQty - currentLineQty);
        lastError = {
          success: false,
          message: `Solo hay ${stock} unidades disponibles en stock de ${item.nombre}. Ya tienes ${otherLinesQty + currentLineQty} en tu carrito.`,
          allowedForThisLine
        };
        continue;
      }

      if (existingIndex >= 0) {
        currentCart[existingIndex] = {
          ...currentCart[existingIndex],
          ...item,
          cantidad: newLineQty,
          stock: stock
        };
      } else {
        currentCart.push({
          ...item,
          cartItemId,
          cantidad: qtyToAdd,
          stock: stock
        });
      }
      addedCount++;
    }

    if (addedCount > 0) {
      cartRef.current = currentCart;
      setCart(currentCart);
    }

    if (lastError && addedCount === 0) {
      return lastError;
    }

    return { success: true, addedCount };
  };

  const removeFromCart = (cartItemIdOrId) => {
    setCart((prev) => {
      const next = prev.filter(
        (item) => item.cartItemId !== cartItemIdOrId && String(item.id || item.idProducto) !== String(cartItemIdOrId)
      );
      cartRef.current = next;
      return next;
    });
  };

  const updateQuantity = (cartItemIdOrId, delta) => {
    setCart((prev) => {
      const target = prev.find(
        (it) => it.cartItemId === cartItemIdOrId || String(it.id || it.idProducto) === String(cartItemIdOrId)
      );
      if (!target) return prev;

      const prodId = target.id || target.idProducto;
      const stock = Number(target.stock !== undefined ? target.stock : (target.stockActual !== undefined ? target.stockActual : 0));
      
      if (delta > 0) {
        const otherLinesQty = prev
          .filter((it) => String(it.id || it.idProducto) === String(prodId) && it.cartItemId !== target.cartItemId)
          .reduce((sum, it) => sum + Number(it.cantidad || 0), 0);

        if (otherLinesQty + target.cantidad + delta > stock) {
          // Exceeds stock limit
          return prev;
        }
      }

      const next = prev
        .map((item) => {
          if (item.cartItemId === target.cartItemId) {
            const newQuantity = item.cantidad + delta;
            return newQuantity > 0 ? { ...item, cantidad: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.cantidad > 0);

      cartRef.current = next;
      return next;
    });
  };

  const clearCart = () => {
    cartRef.current = [];
    setCart([]);
    clearStoredCart();
  };

  /**
   * Reconcilia los ítems persistidos en localStorage contra el catálogo vivo del backend
   * para que cambios en nombre, precio, imagen, stock, variantes, eventos o adiciones
   * se reflejen de inmediato en el carrito y ventas.
   */
  const syncCartWithCatalog = useCallback((productosCatalogo = [], eventosActivos = [], adicionesCatalogo = []) => {
    if (!Array.isArray(productosCatalogo) || productosCatalogo.length === 0) {
      return { changed: false, removedCount: 0, updatedCount: 0 };
    }

    const current = cartRef.current || [];
    if (current.length === 0) {
      return { changed: false, removedCount: 0, updatedCount: 0 };
    }

    const prodMap = new Map();
    productosCatalogo.forEach((p) => {
      const pid = p?.id ?? p?.idProducto;
      if (pid !== undefined && pid !== null) prodMap.set(String(pid), p);
    });

    const adicMap = new Map();
    (Array.isArray(adicionesCatalogo) ? adicionesCatalogo : []).forEach((a) => {
      const aid = a?.idAdicion ?? a?.id;
      if (aid !== undefined && aid !== null) adicMap.set(String(aid), a);
    });

    const nowMs = Date.now();
    const activeGlobalEvents = (Array.isArray(eventosActivos) ? eventosActivos : []).filter((e) =>
      isEventActiveInColombia(e, nowMs)
    );

    const usedQtyByProd = new Map();
    const nextCart = [];
    let removedCount = 0;
    let updatedCount = 0;

    for (const item of current) {
      const prodId = String(item.id || item.idProducto || "");
      const liveProd = prodMap.get(prodId);

      // Si el producto fue eliminado, desactivado o quedó sin stock, retirar del carrito
      if (!liveProd) {
        removedCount++;
        continue;
      }
      const isInactive = liveProd.estado === "Inactivo" || liveProd.estado === 0 || liveProd.estado === false;
      const liveStock = isInactive
        ? 0
        : Number(liveProd.stock !== undefined ? liveProd.stock : (liveProd.stockActual !== undefined ? liveProd.stockActual : 0));

      if (isInactive || liveStock <= 0) {
        removedCount++;
        continue;
      }

      // Validar variante si el ítem corresponde a una variante específica no base
      let matchedVariant = null;
      const liveVariantes = Array.isArray(liveProd.variantes) ? liveProd.variantes : [];
      const matchedLiveVarById = (!item.esVarianteBase && item.idVariante)
        ? liveVariantes.find((v) => String(v.idVariante || v.id) === String(item.idVariante))
        : null;
      const hasCustomVariant = Boolean(
        !item.esVarianteBase &&
        item.idVariante &&
        (
          matchedLiveVarById ||
          (
            String(item.idVariante) !== String(liveProd.id || liveProd.idProducto) &&
            String(item.idVariante) !== String(liveProd.idVarianteBase || "")
          )
        )
      );

      if (hasCustomVariant) {
        matchedVariant = matchedLiveVarById && isVariantActive(matchedLiveVarById)
          ? matchedLiveVarById
          : null;
        if (!matchedVariant) {
          removedCount++;
          continue;
        }
      }

      // Calcular precio base vivo (variante o producto)
      const liveBasePrice = matchedVariant
        ? Number(matchedVariant.precio !== undefined ? matchedVariant.precio : liveProd.precio) || 0
        : Number(liveProd.precio) || 0;

      // Resolver evento activo aplicable (si aplica)
      const prodEvents = [
        ...(Array.isArray(liveProd.eventos) ? liveProd.eventos : []),
        ...activeGlobalEvents.filter((e) => {
          if (String(e.idProducto) === prodId) return true;
          if (!e.productosAsociados) return false;
          try {
            const list = typeof e.productosAsociados === "string" ? JSON.parse(e.productosAsociados) : e.productosAsociados;
            return Array.isArray(list) && list.some((a) => String(a?.idProducto || a?.id) === prodId);
          } catch (_) {
            return false;
          }
        })
      ].filter((e) => isEventActiveInColombia(e, nowMs));

      const itemEvtId = item.eventoInfo?.idEvento || item.eventoInfo?.id;
      const matchedEvent = itemEvtId
        ? prodEvents.find((e) => String(e.idEvento || e.id) === String(itemEvtId)) || null
        : (prodEvents.find((e) => resolveLiveEventPrice(liveBasePrice, e, prodId) !== null) || null);

      const wasAddedFromEventModal = Boolean(
        item.esPromocionEvento ||
        (item.isEvento && Boolean(item.eventoInfo?.nombre))
      );

      let livePrice = liveBasePrice;
      let nextEventoInfo = wasAddedFromEventModal ? (item.eventoInfo || null) : null;
      let nextIsEvento = wasAddedFromEventModal;
      let nextPrecioOriginal = item.precioOriginal;

      if (matchedEvent) {
        const eventPromoPrice = resolveLiveEventPrice(liveBasePrice, matchedEvent, prodId);
        if (eventPromoPrice !== null) {
          livePrice = eventPromoPrice;
          nextPrecioOriginal = liveBasePrice;
          // Solo mantener bandera de evento si el producto fue agregado explícitamente desde un evento
          if (wasAddedFromEventModal) {
            nextIsEvento = true;
            nextEventoInfo = {
              ...(item.eventoInfo || {}),
              idEvento: matchedEvent.idEvento || matchedEvent.id,
              nombre: item.eventoInfo?.nombre || matchedEvent.titulo || matchedEvent.nombre,
              titulo: matchedEvent.titulo || matchedEvent.nombre || item.eventoInfo?.titulo,
              tipoEvento: matchedEvent.tipoEvento || item.eventoInfo?.tipoEvento,
              descuento: matchedEvent.descuento ?? item.eventoInfo?.descuento
            };
          }
        }
      } else if (item.isEvento || item.eventoInfo) {
        // El evento expiró o fue desactivado: volver al precio vigente del producto
        livePrice = liveBasePrice;
        nextEventoInfo = null;
        nextIsEvento = false;
        nextPrecioOriginal = undefined;
      }

      // Sincronizar adiciones vivas (nombre y precio actual)
      let nextAdiciones = item.adiciones || [];
      if (Array.isArray(item.adiciones) && item.adiciones.length > 0 && adicMap.size > 0) {
        nextAdiciones = item.adiciones
          .map((ad) => {
            const aid = String(ad.idAdicion || ad.id || "");
            const liveAd = adicMap.get(aid);
            if (!liveAd) return null;
            if (liveAd.estado === 0 || liveAd.estado === "Inactivo" || liveAd.estado === false) return null;
            return {
              ...ad,
              nombre: liveAd.nombre || ad.nombre,
              precio: Number(liveAd.precio !== undefined ? liveAd.precio : ad.precio) || 0
            };
          })
          .filter(Boolean);
      }

      // Respetar stock disponible acumulado entre líneas del mismo producto
      const alreadyUsed = usedQtyByProd.get(prodId) || 0;
      const availableForLine = Math.max(0, liveStock - alreadyUsed);
      if (availableForLine <= 0) {
        removedCount++;
        continue;
      }
      const nextCantidad = Math.min(Number(item.cantidad || 1), availableForLine);
      usedQtyByProd.set(prodId, alreadyUsed + nextCantidad);

      const nextNombre = liveProd.nombre || item.nombre;
      const nextImagen = (!item.esVarianteBase && matchedVariant?.imagen && String(matchedVariant.imagen).trim())
        ? String(matchedVariant.imagen).trim()
        : (liveProd.imagen || item.imagen);
      const nextDescripcion = liveProd.descripcion !== undefined ? liveProd.descripcion : item.descripcion;
      const nextVarianteNombre = matchedVariant ? (matchedVariant.nombre || item.varianteNombre) : item.varianteNombre;

      const updatedItem = {
        ...item,
        nombre: nextNombre,
        precio: livePrice,
        precioOriginal: nextPrecioOriginal,
        imagen: nextImagen,
        descripcion: nextDescripcion,
        stock: liveStock,
        stockActual: liveStock,
        cantidad: nextCantidad,
        varianteNombre: nextVarianteNombre,
        adiciones: nextAdiciones,
        isEvento: nextIsEvento,
        esPromocionEvento: nextIsEvento ? Boolean(item.esPromocionEvento || wasAddedFromEventModal) : false,
        eventoInfo: nextEventoInfo
      };

      const itemChanged =
        updatedItem.nombre !== item.nombre ||
        Number(updatedItem.precio) !== Number(item.precio) ||
        updatedItem.imagen !== item.imagen ||
        Number(updatedItem.stock) !== Number(item.stock) ||
        Number(updatedItem.cantidad) !== Number(item.cantidad) ||
        updatedItem.varianteNombre !== item.varianteNombre ||
        Boolean(updatedItem.isEvento) !== Boolean(item.isEvento) ||
        Boolean(updatedItem.eventoInfo) !== Boolean(item.eventoInfo) ||
        JSON.stringify(updatedItem.adiciones || []) !== JSON.stringify(item.adiciones || []);

      if (itemChanged) updatedCount++;
      nextCart.push(updatedItem);
    }

    const changed = removedCount > 0 || updatedCount > 0 || nextCart.length !== current.length;
    if (changed) {
      cartRef.current = nextCart;
      setCart(nextCart);
    }
    return { changed, removedCount, updatedCount };
  }, []);

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + Number(item.cantidad || 0), 0);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const adicionesTotal = (item.adiciones || []).reduce(
        (sum, adicion) => sum + (Number(adicion.precio) || 0) * (Number(adicion.cantidad) || 1),
        0
      );
      return total + ((Number(item.precio) || 0) + adicionesTotal) * (Number(item.cantidad) || 1);
    }, 0);
  };

  const getIVA = () => Math.round(getSubtotal() * IVA_RATE);
  const getTotal = () => getSubtotal() + getIVA();

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addMultipleToCart: addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncCartWithCatalog,
        getTotalItems,
        getSubtotal,
        getIVA,
        getTotal,
        getProductQuantityInCart,
        checkStockAvailability,
        generateCartItemId
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
