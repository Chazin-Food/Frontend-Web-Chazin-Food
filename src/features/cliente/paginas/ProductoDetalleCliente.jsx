import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Sun, Moon, ChevronRight } from "lucide-react";
import logoImg from "@/shared/assets/logo_optimized.webp";
import { useDarkMode } from "@/shared/hooks/useDarkMode";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { useCart } from "@/shared/context/CartContext";
import { productosService } from "@/features/ventas/servicios/productosService";
import { fichasTecnicasService } from "@/features/fichas-tecnicas/servicios/fichasTecnicasService";
import { adicionesService } from "@/features/compras/servicios/adicionesService";
import { eventosService } from "@/features/ventas/servicios/eventosService";
import { apiClient } from "@/shared/api/apiClient";
import { ChazinLoader } from "@/shared/components/ui/ChazinLoader";
import { HelpTooltip } from "@/shared/components/ui/HelpTooltip";
import FastFoodProductModal, { isDrinkProduct, resolveDrinkImage } from "@/shared/components/ui/FastFoodProductModal";
import { ClienteFooter } from "../componentes/ClienteFooter";

/**
 * Vista independiente de detalle y personalización de producto en la tienda web (/producto/:id).
 * No se renderiza como modal y no incluye llamados a iniciar sesión.
 */
export function ProductoDetalleCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const [darkMode, toggleDarkMode] = useDarkMode();
  const { success, error } = useNotifications();
  const { addToCart, getTotalItems } = useCart();

  const [loading, setLoading] = useState(!state.producto);
  const [producto, setProducto] = useState(state.producto || null);
  const [ficha, setFicha] = useState(state.ficha || null);
  const [productosList, setProductosList] = useState(Array.isArray(state.productosList) ? state.productosList : []);
  const [fichasMap, setFichasMap] = useState(state.fichasMap || {});
  const [allAdiciones, setAllAdiciones] = useState(Array.isArray(state.allAdiciones) ? state.allAdiciones : []);
  const [allBebidas, setAllBebidas] = useState(Array.isArray(state.allBebidas) ? state.allBebidas : []);
  const [ratingsInfo, setRatingsInfo] = useState(state.ratingsInfo || null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Cargar desde API si se entró por URL directa o faltan catálogos complementarios
  useEffect(() => {
    let cancelled = false;
    const prodId = Number(id);
    if (!prodId || Number.isNaN(prodId)) {
      setLoading(false);
      return;
    }

    const needsFullLoad = !state.producto || String(state.producto.id || state.producto.idProducto) !== String(id);
    const needsCatalogs = allAdiciones.length === 0 || allBebidas.length === 0;

    if (!needsFullLoad && !needsCatalogs && ficha) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      if (needsFullLoad) setLoading(true);
      try {
        const [prodRes, fichaRes, allProdsRes, adicsRes, eventosRes, ratingRes] = await Promise.all([
          needsFullLoad ? productosService.getProductoById(prodId).catch(() => null) : Promise.resolve(state.producto),
          !ficha ? fichasTecnicasService.getFichaByProducto(prodId).catch(() => null) : Promise.resolve(ficha),
          needsCatalogs ? productosService.getProductos().catch(() => []) : Promise.resolve(productosList),
          needsCatalogs ? adicionesService.getAdiciones().catch(() => []) : Promise.resolve(allAdiciones),
          needsFullLoad ? eventosService.getEventos().catch(() => []) : Promise.resolve([]),
          !ratingsInfo ? apiClient.get(`/resenas/ratings?ids=${prodId}`).catch(() => null) : Promise.resolve(null)
        ]);

        if (cancelled) return;

        const prodsArr = Array.isArray(allProdsRes) ? allProdsRes : (allProdsRes?.data || []);
        const adicsArr = Array.isArray(adicsRes) ? adicsRes : (adicsRes?.data || []);
        const evtsArr = Array.isArray(eventosRes) ? eventosRes : (eventosRes?.data || []);

        let resolvedProd = prodRes || prodsArr.find((p) => String(p.id || p.idProducto) === String(prodId)) || null;
        if (resolvedProd && evtsArr.length > 0 && (!Array.isArray(resolvedProd.eventos) || resolvedProd.eventos.length === 0)) {
          const matchedEvents = evtsArr.filter((e) => {
            if (String(e.idProducto || e.producto?.id || e.producto?.idProducto) === String(prodId)) return true;
            if (e.productosAsociados) {
              try {
                const list = typeof e.productosAsociados === "string" ? JSON.parse(e.productosAsociados) : e.productosAsociados;
                return Array.isArray(list) && list.some((a) => String(a?.idProducto || a?.id) === String(prodId));
              } catch {
                return false;
              }
            }
            return false;
          });
          if (matchedEvents.length > 0) {
            resolvedProd = { ...resolvedProd, eventos: matchedEvents };
          }
        }

        if (resolvedProd) setProducto(resolvedProd);
        if (fichaRes) {
          setFicha(fichaRes);
          setFichasMap((prev) => ({ ...prev, [prodId]: fichaRes }));
        }
        if (prodsArr.length > 0) {
          setProductosList(prodsArr);
          if (allBebidas.length === 0) {
            const drinks = prodsArr.filter(
              (p) => isDrinkProduct(p) && (p.estado === "Activo" || p.estado === 1 || p.estado === "1") && Number(p.stock ?? 0) > 0
            );
            setAllBebidas(drinks);
          }
        }
        if (adicsArr.length > 0 && allAdiciones.length === 0) {
          const activeAdics = adicsArr.filter((a) => a.estado === "Activo" || a.estado === 1 || a.estado === "1");
          setAllAdiciones(activeAdics);
        }
        if (ratingRes && ratingRes[prodId]) {
          setRatingsInfo(ratingRes[prodId]);
        }
      } catch (err) {
        console.warn("Error cargando detalle de producto:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const totalCartItems = useMemo(() => getTotalItems(), [getTotalItems]);

  const handleConfirmAdd = ({
    producto: prod,
    cantidad,
    adiciones,
    bebidas,
    personalizaciones,
    ingredientesRemovidos,
    observacion,
    sabor,
    esVarianteBase,
    varianteNombre,
    varianteDescripcion,
    varianteEspecificaciones,
    varianteCambios,
    esVarianteDeEvento
  }) => {
    let basePrice = Number(
      prod.precioFinal !== undefined
        ? prod.precioFinal
        : prod.precioCalculado !== undefined
        ? prod.precioCalculado
        : prod.precio || 0
    );

    const isDrink = isDrinkProduct(prod);
    const resolvedIsBase = Boolean(esVarianteBase ?? prod.esVarianteBase);
    const resolvedVarName = resolvedIsBase ? null : (varianteNombre || prod.varianteNombre || null);
    const finalProdName =
      prod.nombrePersonalizado ||
      (sabor
        ? `${prod.nombre} (${sabor})`
        : prod.saborSeleccionado
        ? `${prod.nombre} (${prod.saborSeleccionado})`
        : prod.nombre);

    const itemToAdd = {
      id: prod.id || prod.idProducto,
      idProducto: prod.idProducto || prod.id,
      idVariante: resolvedIsBase
        ? (prod.idVarianteBase || prod.idVariante || null)
        : (prod.idVariante || prod.id || prod.idProducto),
      esVarianteBase: resolvedIsBase,
      varianteNombre: resolvedVarName,
      varianteDescripcion: resolvedIsBase ? null : (varianteDescripcion || prod.varianteDescripcion || null),
      varianteEspecificaciones: resolvedIsBase ? null : (varianteEspecificaciones || prod.varianteEspecificaciones || null),
      varianteCambios: !resolvedIsBase && Array.isArray(varianteCambios || prod.varianteCambios)
        ? (varianteCambios || prod.varianteCambios)
        : [],
      esVarianteDeEvento: Boolean(!resolvedIsBase && (esVarianteDeEvento || prod.esVarianteDeEvento)),
      sabor: sabor || prod.saborSeleccionado || null,
      nombre: finalProdName,
      precio: basePrice,
      cantidad: Number(cantidad) || 1,
      cantidadCocina: prod.cantidadCocina || (prod.is2x1Promo ? (Number(cantidad) || 1) * 2 : (Number(cantidad) || 1)),
      is2x1Promo: Boolean(prod.is2x1Promo),
      stock: Number(prod.stock !== undefined ? prod.stock : 0),
      imagen: prod.imagen,
      ingredientesRemovidos: Array.isArray(ingredientesRemovidos) ? ingredientesRemovidos : [],
      personalizaciones: personalizaciones || [],
      observaciones: observacion || "",
      observacion: observacion || "",
      adiciones: (isDrink ? [] : (adiciones || [])).map((a) => ({
        idAdicion: a.idAdicion || a.id,
        nombre: a.nombre,
        precio: Number(a.precio) || 0,
        cantidad: Number(a.cantidad) || 1,
        imagen: a.imagen || ""
      }))
    };

    const itemsToBatch = [itemToAdd];
    let bebidasCount = 0;
    let comboCfg = prod.configuracionCombo;
    if (typeof comboCfg === "string") {
      try {
        comboCfg = JSON.parse(comboCfg);
      } catch {
        comboCfg = null;
      }
    }
    const isComboProd = Boolean(comboCfg?.esCombo);
    const requiredDrinks = isComboProd ? (Number(comboCfg.cantidadBebidas) || 1) : 0;
    let includedQuotaRemaining = requiredDrinks;

    if (!isDrink && Array.isArray(bebidas)) {
      for (const b of bebidas) {
        const qty = Number(b.cantidad || 1);
        const covered = isComboProd ? Math.min(includedQuotaRemaining, qty) : 0;
        const extraQty = qty - covered;
        if (isComboProd) includedQuotaRemaining -= covered;

        if (!isComboProd || extraQty > 0) {
          itemsToBatch.push({
            id: b.id || b.idProducto,
            idProducto: b.idProducto || b.id,
            idVariante: b.idVariante || b.id || b.idProducto,
            nombre: isComboProd ? `${b.nombre} (Bebida Extra)` : b.nombre,
            precio: Number(b.precio),
            cantidad: isComboProd ? extraQty : qty,
            stock: Number(b.stock !== undefined ? b.stock : 0),
            imagen: resolveDrinkImage(b),
            adiciones: []
          });
          bebidasCount += isComboProd ? extraQty : qty;
        }
      }
    }

    const res = addToCart(itemsToBatch);
    if (res && res.success === false) {
      error("Stock insuficiente", res.message || "No hay suficiente stock disponible para este producto.");
      return;
    }

    const msg = bebidasCount > 0
      ? `${finalProdName} y ${bebidasCount} bebida(s) agregadas a tu carrito`
      : `${finalProdName} se agregó a tu carrito`;
    success("¡Producto agregado!", msg);
    navigate("/?openCart=1");
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
      {/* Navbar superior limpia y viva (SIN llamado a iniciar sesión) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 shadow-2xs">
        <div className="h-0.5 w-full bg-gradient-to-r from-[#c84545] via-amber-400/75 to-[#2e4257]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al menú</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 min-w-0">
              <Link to="/" className="inline-flex items-center gap-1.5 hover:text-red-600 transition-colors shrink-0">
                <img
                  src={logoImg}
                  alt="Chazin Food"
                  width="24"
                  height="24"
                  className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
                <span className="font-bold text-gray-700 dark:text-gray-200">Menú</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                {producto?.nombre || "Detalle de producto"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <HelpTooltip
              align="right"
              title="Personaliza tu plato"
              text="Selecciona el tamaño o variante, retira ingredientes si lo prefieres y agrega tus adiciones o bebidas favoritas antes de añadir al carrito."
            />

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => navigate("/?openCart=1")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden xs:inline">Carrito</span>
              {totalCartItems > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-red-700 text-[10px] font-black leading-none">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal independiente */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {loading ? (
          <div className="py-20">
            <ChazinLoader text="CARGANDO DETALLE DEL PRODUCTO" size="md" />
          </div>
        ) : !producto ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 text-center border border-gray-200 dark:border-gray-800 space-y-4 shadow-xs">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Producto no encontrado
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              El producto que buscas no está disponible o fue retirado del menú.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer"
            >
              Volver al menú principal
            </button>
          </div>
        ) : (
          <FastFoodProductModal
            asPage={true}
            isOpen={true}
            onClose={() => navigate("/")}
            producto={producto}
            ficha={ficha}
            productosList={productosList}
            fichasMap={fichasMap}
            allAdiciones={allAdiciones}
            allBebidas={allBebidas}
            ratingsInfo={ratingsInfo}
            onConfirm={handleConfirmAdd}
            mode="cliente"
            initialTab={state.initialTab || "personalizar"}
          />
        )}
      </main>

      <ClienteFooter />
    </div>
  );
}

export default ProductoDetalleCliente;
