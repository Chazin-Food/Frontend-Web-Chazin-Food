import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Sun, Moon, ChevronRight, Sparkles, ArrowUpRight } from "lucide-react";
import logoImg from "@/shared/assets/logo_optimized.webp";
import { useDarkMode } from "@/shared/hooks/useDarkMode";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { useCart } from "@/shared/context/CartContext";
import { productosService } from "@/features/ventas/servicios/productosService";
import { fichasTecnicasService } from "@/features/fichas-tecnicas/servicios/fichasTecnicasService";
import { adicionesService } from "@/features/compras/servicios/adicionesService";
import { eventosService } from "@/features/ventas/servicios/eventosService";
import { apiClient } from "@/shared/api/apiClient";
import { getOptimizedImageUrl } from "@/shared/utils/imageUtils";
import { isEventActiveInColombia } from "@/shared/utils/dateUtils";
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

  // Cargar o actualizar datos cada vez que cambie el :id (incluyendo clics en "También te puede encantar")
  useEffect(() => {
    let cancelled = false;
    const prodId = Number(id);
    if (!prodId || Number.isNaN(prodId)) {
      setLoading(false);
      return;
    }

    const passedProdMatchesId =
      state.producto && String(state.producto.id || state.producto.idProducto) === String(prodId);
    const cachedListProd = productosList.find(
      (p) => String(p.id || p.idProducto) === String(prodId)
    );
    const initialCandidate = passedProdMatchesId ? state.producto : (cachedListProd || null);
    const cachedFichaForTarget = fichasMap[prodId] || (passedProdMatchesId ? state.ficha : null) || null;

    if (initialCandidate) {
      setProducto(initialCandidate);
      setFicha(cachedFichaForTarget);
      setRatingsInfo(passedProdMatchesId && state.ratingsInfo ? state.ratingsInfo : null);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const needsProdFromApi = !initialCandidate;
    const needsFichaFromApi = !cachedFichaForTarget;
    const needsCatalogs = allAdiciones.length === 0 || allBebidas.length === 0 || productosList.length === 0;
    const needsEventsCheck = !initialCandidate || !Array.isArray(initialCandidate.eventos);

    const loadData = async () => {
      try {
        const [prodRes, fichaRes, allProdsRes, adicsRes, eventosRes, ratingRes] = await Promise.all([
          needsProdFromApi ? productosService.getProductoById(prodId).catch(() => null) : Promise.resolve(initialCandidate),
          needsFichaFromApi ? fichasTecnicasService.getFichaByProducto(prodId).catch(() => null) : Promise.resolve(cachedFichaForTarget),
          needsCatalogs ? productosService.getProductos().catch(() => []) : Promise.resolve(productosList),
          needsCatalogs ? adicionesService.getAdiciones().catch(() => []) : Promise.resolve(allAdiciones),
          needsEventsCheck ? eventosService.getEventos().catch(() => []) : Promise.resolve([]),
          apiClient.get(`/resenas/ratings?ids=${prodId}`).catch(() => null)
        ]);

        if (cancelled) return;

        const prodsArr = Array.isArray(allProdsRes) ? allProdsRes : (allProdsRes?.data || []);
        const adicsArr = Array.isArray(adicsRes) ? adicsRes : (adicsRes?.data || []);
        const evtsArr = Array.isArray(eventosRes) ? eventosRes : (eventosRes?.data || []);

        let resolvedProd = prodRes || prodsArr.find((p) => String(p.id || p.idProducto) === String(prodId)) || initialCandidate;
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
        } else {
          setFicha(null);
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
        setRatingsInfo(ratingRes && ratingRes[prodId] ? ratingRes[prodId] : null);
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

  const categoryLabel = useMemo(() => {
    if (!producto) return "Menú";
    if (typeof producto.categoria === "string" && producto.categoria.trim()) return producto.categoria;
    if (producto.categoriaNombre) return producto.categoriaNombre;
    if (producto.categoria?.nombre) return producto.categoria.nombre;
    return "Especialidad";
  }, [producto]);

  // Recomendaciones cruzadas inteligentes (misma categoría primero, luego favoritos con stock)
  const recommendedProducts = useMemo(() => {
    if (!producto || !Array.isArray(productosList) || productosList.length === 0) return [];
    const currentId = String(producto.id || producto.idProducto);
    const currentCat = String(producto.idCategoriaProducto || categoryLabel || "").toLowerCase();

    const activePool = productosList.filter((p) => {
      const pid = String(p.id || p.idProducto);
      if (!pid || pid === currentId) return false;
      const isAct = p.estado === "Activo" || p.estado === 1 || p.estado === "1";
      const hasStock = Number(p.stock ?? p.stockActual ?? 1) > 0 && !p.agotado;
      return isAct && hasStock;
    });

    const sameCat = [];
    const otherCat = [];
    for (const item of activePool) {
      const itemCat = String(item.idCategoriaProducto || item.categoriaNombre || item.categoria?.nombre || item.categoria || "").toLowerCase();
      if (currentCat && itemCat && itemCat === currentCat) {
        sameCat.push(item);
      } else {
        otherCat.push(item);
      }
    }

    return [...sameCat, ...otherCat].slice(0, 5);
  }, [producto, productosList, categoryLabel]);

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
    <div className="min-h-[100dvh] bg-[#F8FAFC] dark:bg-gray-950 flex flex-col transition-colors">
      {/* Navbar superior panorámica y compacta (SIN llamado a iniciar sesión) */}
      <header className="sticky top-0 z-40 bg-white/92 dark:bg-gray-900/92 backdrop-blur-xl border-b border-slate-200/75 dark:border-gray-800/90">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-800 dark:text-gray-100 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/70 dark:border-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Menú</span>
            </button>

            <nav aria-label="Ruta de navegación" className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 min-w-0">
              <Link to="/" className="inline-flex items-center gap-2 hover:text-[#D9383A] transition-colors shrink-0">
                <img
                  src={logoImg}
                  alt="Chazin Food"
                  width="26"
                  height="26"
                  decoding="async"
                  className="w-6.5 h-6.5 rounded-full object-cover border border-slate-200 dark:border-gray-700"
                />
                <span className="font-extrabold text-slate-800 dark:text-gray-200 tracking-tight">Chazin Food</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-gray-600 shrink-0" />
              <span className="font-medium text-slate-500 dark:text-gray-400 truncate max-w-[140px]">
                {categoryLabel}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-gray-600 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-gray-100 truncate max-w-[240px]">
                {producto?.nombre || "Detalle de producto"}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <HelpTooltip
              align="right"
              title="Personaliza tu pedido"
              text="Elige tu variante preferida, retira ingredientes opcionales, suma adiciones o bebidas y agrégalo al carrito en un clic. El costo de domicilio se cancela aparte al recibir."
            />

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
              className="w-9 h-9 rounded-xl text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => navigate("/?openCart=1")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#D9383A] dark:hover:bg-[#B91C1C] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden xs:inline">Carrito</span>
              {totalCartItems > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#D9383A] dark:bg-white text-white dark:text-[#B91C1C] text-[10.5px] font-black leading-none min-w-[18px] text-center">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal panorámico (max-w-[1800px]) aprovechando todo el ancho lateral para minimizar scroll */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5 space-y-8">
        {loading ? (
          <div className="py-24">
            <ChazinLoader text="PREPARANDO EXPERIENCIA GASTRONÓMICA" size="md" />
          </div>
        ) : !producto ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-gray-800 space-y-4 shadow-xs max-w-xl mx-auto">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-gray-100">
              Producto no encontrado
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              El producto que buscas no está disponible en este momento o fue retirado del menú.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-2.5 rounded-xl bg-[#D9383A] hover:bg-[#B91C1C] text-white text-sm font-bold cursor-pointer transition"
            >
              Explorar menú principal
            </button>
          </div>
        ) : (
          <>
            <FastFoodProductModal
              key={producto.id || producto.idProducto}
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

            {/* Sección Cross-Sell: Sugerencias del Chef */}
            {recommendedProducts.length > 0 && (
              <section aria-labelledby="recomendados-heading" className="pt-6 border-t border-slate-200/80 dark:border-gray-800 space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#D9383A] dark:text-red-400 block mb-1">
                      Sugerencias de la Casa
                    </span>
                    <h2 id="recomendados-heading" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      También te puede encantar
                    </h2>
                  </div>
                  <Link
                    to="/"
                    className="text-xs sm:text-sm font-bold text-slate-600 dark:text-gray-300 hover:text-[#D9383A] dark:hover:text-red-400 inline-flex items-center gap-1 transition-colors shrink-0"
                  >
                    <span>Ver todo el menú</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {recommendedProducts.map((rec) => {
                    const recId = rec.id || rec.idProducto;
                    const recIsDrink = isDrinkProduct(rec);
                    const rawImg = recIsDrink
                      ? resolveDrinkImage(rec)
                      : (rec.imagen || rec.imagenUrl || rec.urlImagen || "");
                    const optImg = rawImg ? getOptimizedImageUrl(rawImg, 420) : "";
                    const baseP = Number(rec.precio || 0);
                    const activeEvt = Array.isArray(rec.eventos)
                      ? rec.eventos.find((ev) => isEventActiveInColombia(ev))
                      : null;
                    let finalP = baseP;
                    if (activeEvt) {
                      if (Number(activeEvt.nuevoPrecio) > 0) finalP = Number(activeEvt.nuevoPrecio);
                      else if (Number(activeEvt.descuento) > 0) finalP = Math.round(baseP * (1 - Number(activeEvt.descuento) / 100));
                    } else if (rec.precioPromo !== undefined && Number(rec.precioPromo) < baseP) {
                      finalP = Number(rec.precioPromo);
                    }
                    const hasRecPromo = finalP < baseP;

                    return (
                      <button
                        key={recId}
                        type="button"
                        onClick={() =>
                          navigate(`/producto/${recId}`, {
                            state: {
                              producto: rec,
                              productosList,
                              fichasMap,
                              allAdiciones,
                              allBebidas
                            }
                          })
                        }
                        className="group text-left bg-white dark:bg-gray-900 rounded-2xl border border-slate-200/80 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                      >
                        <div className="relative aspect-[16/11] w-full bg-slate-100 dark:bg-gray-800/80 overflow-hidden flex items-center justify-center">
                          {optImg ? (
                            <img
                              src={optImg}
                              alt={rec.nombre}
                              width="320"
                              height="220"
                              loading="lazy"
                              decoding="async"
                              className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                                recIsDrink ? "object-contain p-3" : "object-cover"
                              }`}
                            />
                          ) : null}
                          {hasRecPromo && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#D9383A] text-white text-[10px] font-black uppercase tracking-wide shadow-sm inline-flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Oferta</span>
                            </span>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-gray-100 line-clamp-1 group-hover:text-[#D9383A] dark:group-hover:text-red-400 transition-colors">
                              {rec.nombre}
                            </h3>
                            {rec.descripcion && (
                              <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                                {rec.descripcion}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-slate-900 dark:text-white">
                                ${finalP.toLocaleString("es-CO")}
                              </span>
                              {hasRecPromo && (
                                <span className="text-[11px] text-slate-400 line-through font-semibold">
                                  ${baseP.toLocaleString("es-CO")}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-[#D9383A] dark:text-red-400 group-hover:translate-x-0.5 transition-transform">
                              Personalizar →
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <ClienteFooter />
    </div>
  );
}

export default ProductoDetalleCliente;
