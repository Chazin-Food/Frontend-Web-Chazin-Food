import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, LogIn, ShoppingCart, User, Search, Package, Clock, X, Plus, Minus, FileText, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CheckCircle, Check, MapPin, CreditCard, Banknote, Smartphone, Phone, RefreshCw, Sun, Moon, Zap, Truck, Store, Info, Flame, Sparkles, AlertTriangle, ShieldCheck, Loader2, Star, Sliders, Coins, Beaker, Ban, ArrowRight, Globe, AlertCircle, CheckCircle2, Layers, Lock } from "lucide-react";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { useDarkMode } from "@/shared/hooks/useDarkMode";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { useCart } from "@/shared/context/CartContext";
import {
  loadSessionUser,
  getClientMeta,
  setClientMeta,
  subscribeCatalogUpdates
} from "@/shared/utils/secureStorage";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const STORE_URL_DEFAULTS = {
  cat: "",
  q: ""
};
import logoImg from "@/shared/assets/logo_optimized.webp";
import { FidelidadBadge, getNextLevelProgressInfo } from "@/shared/components/ui/FidelidadBadge";
import { StarRating } from "@/shared/components/ui/StarRating";
import { apiClient } from "@/shared/api/apiClient";
import { ventasService } from "@/features/ventas/servicios/ventasService";
import { categoriaProductosService } from "@/features/ventas/servicios/categoriaProductosService";
import { productosService } from "@/features/ventas/servicios/productosService";
import { fichasTecnicasService } from "@/features/fichas-tecnicas/servicios/fichasTecnicasService";
import { adicionesService } from "@/features/compras/servicios/adicionesService";
import { wompiService } from "@/features/ventas/servicios/wompiService";
import { eventosService } from "@/features/ventas/servicios/eventosService";
import { EventosCarousel, THEMES } from "../componentes/EventosCarousel";
import { BrandHeroBanner } from "../componentes/BrandHeroBanner";
import { FoodIcon, FoodIconBadge, EventBadge, getEventBadgeConfig, stripEmojis } from "@/shared/components/ui/FoodIcon";
import { parseEventoInsumos, formatEventoToppingsText } from "@/shared/utils/foodEmojiUtils";
import { getProductVariantSummary, isVariantActive } from "@/shared/utils/productVariantUtils";
import { getOptimizedImageUrl } from "@/shared/utils/imageUtils";
import { ClienteFooter } from "../componentes/ClienteFooter";
import { isEssentialIngredient } from "@/shared/utils/ingredientUtils";
const ClienteAuthModal = lazy(() => import("../componentes/ClienteAuthModal").then((m) => ({ default: m.ClienteAuthModal })));
import { validateNombre, validateDocumento, sanitizeDocumento, validateTelefono, sanitizeTelefono, validateDireccionMedellin, verifyDireccionMedellinRealtime } from "@/shared/utils/validationUtils";
import { MedellinAddressStatus, useMedellinAddressValidation } from "@/shared/components/ui/MedellinAddressStatus";
import { AceptacionLegalCheckbox } from "@/shared/components/ui/PoliticaDatosModal";
import {
  formatTime12h,
  formatDateSafe,
  isEventActiveInColombia,
  evaluateEventVigencia,
  parseDateOnlySafe
} from "@/shared/utils/dateUtils";
import { matchesSmartSearch } from "@/shared/utils/searchUtils";

const FastFoodProductModal = lazy(() => import("@/shared/components/ui/FastFoodProductModal"));
const ProductoResenasModal = lazy(() => import("../componentes/ProductoResenasModal").then(m => ({ default: m.ProductoResenasModal })));
const PersonalizarEventoModal = lazy(() => import("../componentes/PersonalizarEventoModal").then(m => ({ default: m.PersonalizarEventoModal })));

const defaultCategoryIcons = {
  "hamburguesas": { icon: "burger", color: "from-yellow-400 to-orange-500" },
  "salchipapas": { icon: "fries", color: "from-yellow-500 to-amber-600" },
  "perros calientes": { icon: "hotdog", color: "from-orange-400 to-red-500" },
  "perros": { icon: "hotdog", color: "from-orange-400 to-red-500" },
  "pollo": { icon: "chicken", color: "from-amber-500 to-orange-600" },
  "bebidas": { icon: "drink", color: "from-blue-400 to-blue-600" },
  "refrescos": { icon: "drink", color: "from-blue-400 to-blue-600" },
  "acompañamientos": { icon: "sides", color: "from-amber-400 to-orange-600" },
  "combos": { icon: "combo", color: "from-purple-400 to-purple-600" },
  "postres": { icon: "cake", color: "from-pink-400 to-rose-500" },
  "helados": { icon: "icecream", color: "from-indigo-400 to-purple-500" },
  "entradas": { icon: "taco", color: "from-emerald-400 to-teal-500" },
  "pizzas": { icon: "pizza", color: "from-red-500 to-amber-500" }
};

const getCategoryMeta = (nombre) => {
  const key = String(nombre || "").toLowerCase().trim();
  if (key.includes("hambur")) return { icon: "burger", color: "from-yellow-400 to-orange-500" };
  if (key.includes("perro") || key.includes("hot dog")) return { icon: "hotdog", color: "from-orange-400 to-red-500" };
  if (key.includes("salchipapa")) return { icon: "fries", color: "from-yellow-500 to-amber-600" };
  if (key.includes("papa")) return { icon: "fries", color: "from-yellow-500 to-amber-600" };
  if (key.includes("pollo") || key.includes("alitas") || key.includes("nugget")) return { icon: "chicken", color: "from-amber-500 to-orange-600" };
  if (key.includes("pizza")) return { icon: "pizza", color: "from-red-500 to-amber-500" };
  if (key.includes("combo")) return { icon: "combo", color: "from-purple-400 to-purple-600" };
  if (key.includes("bebida") || key.includes("gaseosa") || key.includes("jugo") || key.includes("refresco")) return { icon: "drink", color: "from-blue-400 to-blue-600" };
  if (key.includes("postre") || key.includes("torta") || key.includes("pastel")) return { icon: "cake", color: "from-pink-400 to-rose-500" };
  if (key.includes("helado")) return { icon: "icecream", color: "from-indigo-400 to-purple-500" };
  if (key.includes("acompa") || key.includes("side") || key.includes("guarnic")) return { icon: "sides", color: "from-amber-400 to-orange-600" };
  if (key.includes("ensalada")) return { icon: "salad", color: "from-green-400 to-green-600" };
  if (key.includes("entrada") || key.includes("snack") || key.includes("taco")) return { icon: "taco", color: "from-emerald-400 to-teal-500" };
  return defaultCategoryIcons[key] || { icon: "plate", color: "from-red-400 to-red-600" };
};

const categoriasDefault = [
  { id: 1, nombre: "Perros Calientes", icon: "hotdog", color: "from-orange-400 to-red-500" },
  { id: 2, nombre: "Combos", icon: "combo", color: "from-purple-400 to-purple-600" },
  { id: 3, nombre: "Hamburguesas", icon: "burger", color: "from-yellow-400 to-orange-500" },
  { id: 4, nombre: "Bebidas", icon: "drink", color: "from-blue-400 to-blue-600" },
  { id: 5, nombre: "Salchipapas Gourmet", icon: "fries", color: "from-yellow-500 to-amber-600" },
  { id: 6, nombre: "Acompañamientos", icon: "sides", color: "from-amber-400 to-orange-600" }
];

const productosDefault = [];

const eventosDefault = [];

const adicionesDisponibles = [];

export const getAdicionImage = (ad) => {
  if (!ad) return "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80";
  if (typeof ad.imagen === "string" && ad.imagen.startsWith("http")) {
    return ad.imagen;
  }
  const name = String(ad.nombre || "").toLowerCase();
  if (name.includes("tocineta") || name.includes("bacon")) {
    return "https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("queso") || name.includes("cheddar")) {
    return "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("papa") || name.includes("francesa")) {
    return "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("cebolla")) {
    return "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("jalapeño") || name.includes("jalapeno") || name.includes("picante")) {
    return "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80";
  }
  if (name.includes("salsa")) {
    return "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=500&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80";
};

const fichasTecnicasDefault = {};

export const OFFICIAL_DRINK_IMAGES = {
  coca_cola: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790135864/hynoiytmhuddsnatwcxz.png",
  coca_cola_light: "/images/drinks/coca_cola_light_400ml.png",
  manzana: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790135903/lhmojjdrn1bzp3dsz47f.png",
  pepsi: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790135953/upv7fsv9osr2f7ap6cbn.png",
  colombiana: "https://res.cloudinary.com/dckwtknmq/image/upload/v1789001495/qy8wy9igmgb0wppnjavw.png",
  sprite: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790136141/cpxa3npdfd0lyxjizicy.png",
  quatro: "/images/drinks/quatro_400ml.png",
  agua: "https://res.cloudinary.com/dckwtknmq/image/upload/v1789342838/pj5qlfpmxeddkkmjauyw.png",
  uva: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790137310/fxidthj8xu1nuvp0khfo.png",
  naranja: "/images/drinks/images__Gaseosa_naranja_-removebg-preview.png"
};

export const resolveDrinkImage = (item) => {
  if (!item) return OFFICIAL_DRINK_IMAGES.coca_cola;
  if (typeof item.imagen === "string" && (item.imagen.startsWith("http") || item.imagen.startsWith("/images/"))) {
    return item.imagen;
  }
  const name = String(item.nombre || item || "").toLowerCase();
  if (name.includes("coca") && (name.includes("sin az") || name.includes("light") || name.includes("zero"))) {
    return OFFICIAL_DRINK_IMAGES.coca_cola_light;
  }
  if (name.includes("coca")) return OFFICIAL_DRINK_IMAGES.coca_cola;
  if (name.includes("manzana")) return OFFICIAL_DRINK_IMAGES.manzana;
  if (name.includes("pepsi")) return OFFICIAL_DRINK_IMAGES.pepsi;
  if (name.includes("colombiana")) return OFFICIAL_DRINK_IMAGES.colombiana;
  if (name.includes("sprite")) return OFFICIAL_DRINK_IMAGES.sprite;
  if (name.includes("quatro") || name.includes("cuatro")) return OFFICIAL_DRINK_IMAGES.quatro;
  if (name.includes("agua") || name.includes("cristal")) return OFFICIAL_DRINK_IMAGES.agua;
  if (name.includes("uva")) return OFFICIAL_DRINK_IMAGES.uva;
  if (name.includes("naranja")) return OFFICIAL_DRINK_IMAGES.naranja;
  return OFFICIAL_DRINK_IMAGES.coca_cola;
};

export const isDrinkProduct = (item) => {
  if (!item) return false;
  const catId = Number(item.idCategoriaProducto !== undefined ? item.idCategoriaProducto : item.categoria);
  const catName = String(item.categoriaNombre || item.categoria?.nombre || (typeof item.categoria === "string" ? item.categoria : "") || "").toLowerCase();
  const name = String(item.nombre || "").toLowerCase();
  const tipo = String(item.tipo || "").toLowerCase();

  // EXCLUSIÓN ESTRICTA: Platos fuertes, combos, hamburguesas, perros y papas NUNCA son bebidas simples
  if (
    catId === 1 || // Hamburguesas
    catId === 2 || // Perros Calientes
    catId === 3 || // Salchipapas Gourmet
    catId === 5 || // Combos
    catName.includes("hamburguesa") ||
    catName.includes("combo") ||
    catName.includes("perro") ||
    catName.includes("salchipapa") ||
    catName.includes("acompañamiento") ||
    name.includes("hamburguesa") ||
    name.includes("burger") ||
    name.includes("combo") ||
    name.includes("perro") ||
    name.includes("salchipapa") ||
    name.includes("papas con") ||
    tipo === "combo" ||
    tipo === "plato fuerte"
  ) {
    return false;
  }

  return (
    catId === 4 ||
    tipo === "bebida" ||
    catName.includes("bebida") ||
    catName.includes("gaseosa") ||
    catName.includes("refresco") ||
    name.includes("gaseosa") ||
    name.includes("coca-cola") ||
    name.includes("coca cola") ||
    name.includes("postobón") ||
    name.includes("postobon") ||
    name.includes("pepsi") ||
    name.includes("colombiana") ||
    name.includes("sprite") ||
    name.includes("cuatro") ||
    name.includes("agua cristal") ||
    name.includes("cristal sin gas") ||
    name.includes("h2oh") ||
    name.includes("mr tea") ||
    name.includes("jugo") ||
    name.includes("hit")
  );
};

// Los complementos de la orden se cargan 100% en vivo desde la base de datos MySQL (activeProductos)
export const COMPLEMENTOS_ORDEN = [];

export const getIngredientesPersonalizables = (producto, ficha) => {
  if (!producto || isDrinkProduct(producto)) return [];

  const CANDIDATOS_BASE = [
    { id: "salsa_queso", nombre: "Salsa de queso", icono: "salsa_queso", aliases: ["salsa de queso", "queso fundido", "salsa", "salsas", "sauce"] },
    { id: "jalapenos", nombre: "Jalapeños", icono: "jalapenos", aliases: ["jalapeño", "jalapeno", "jalapeños", "jalapenos", "picante", "chile"] },
    { id: "tomate", nombre: "Tomate", icono: "tomate", aliases: ["tomate", "tomato"] },
    { id: "cebolla", nombre: "Cebolla", icono: "cebolla", aliases: ["cebolla", "onion"] },
    { id: "guacamole", nombre: "Guacamole", icono: "guacamole", aliases: ["guacamole", "aguacate", "avocado"] },
    { id: "suero_costeno", nombre: "Suero Costeño", icono: "suero_costeno", aliases: ["suero", "suero costeño", "suero costeno", "suerito"] },
    { id: "lechuga", nombre: "Lechuga", icono: "lettuce", aliases: ["lechuga", "lettuce"] },
    { id: "queso", nombre: "Queso", icono: "cheese", aliases: ["queso", "cheddar", "mozzarella", "cheese"] },
    { id: "tocineta", nombre: "Tocineta", icono: "bacon", aliases: ["tocineta", "tocino", "bacon"] },
    { id: "ripio", nombre: "Ripio de papa", icono: "fries", aliases: ["ripio", "papas ripio", "chips"] }
  ];

  let allIngStrings = [];
  if (ficha?.detalles && Array.isArray(ficha.detalles)) {
    allIngStrings.push(...ficha.detalles.map(d => String(d.insumo?.nombre || d.nombreInsumo || "").toLowerCase()));
  }
  if (ficha?.ingredientes && Array.isArray(ficha.ingredientes)) {
    allIngStrings.push(...ficha.ingredientes.map(s => String(s).toLowerCase()));
  }
  if (producto?.descripcion) {
    allIngStrings.push(String(producto.descripcion).toLowerCase());
  }
  const combinedText = allIngStrings.join(" ");

  // Filtrado estricto: solo ingredientes que realmente forman parte de este producto
  return CANDIDATOS_BASE.filter(c => c.aliases.some(alias => combinedText.includes(alias)));
};

function FichaTecnicaProductoCliente({ ficha, producto }) {
  const [open, setOpen] = useState(false);
  if (!ficha && !producto) return null;

  // Extract ingredients list from API format or default object
  let listaIngredientes = [];
  if (ficha?.detalles && Array.isArray(ficha.detalles) && ficha.detalles.length > 0) {
    listaIngredientes = ficha.detalles.map(d => {
      const nombre = d.insumo?.nombre || d.nombreInsumo || `Insumo #${d.idInsumo}`;
      const cant = d.cantidad ? ` (${d.cantidad} ${d.unidadMedida || d.insumo?.unidadMedida || 'und'})` : '';
      return `${nombre}${cant}`;
    });
  } else if (ficha?.ingredientes && Array.isArray(ficha.ingredientes)) {
    listaIngredientes = ficha.ingredientes;
  } else if (producto?.descripcion) {
    listaIngredientes = producto.descripcion.split(',').map(s => s.trim()).filter(Boolean);
  }

  const tiempoPrep = ficha?.tiempoPreparacion || 15;
  const rendimientoText = ficha?.rendimiento || ficha?.tamano || "1 porción";

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden mt-3 bg-gray-50/50 dark:bg-gray-800/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-red-500" />
          Ingredientes y Preparación
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-red-50/80 dark:bg-red-950/30 rounded-xl p-2.5 text-center border border-red-100 dark:border-red-900/40">
              <p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Tiempo Estimado
              </p>
              <p className="text-sm font-black text-gray-900 dark:text-gray-100 mt-0.5">{tiempoPrep} minutos</p>
            </div>
            <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-xl p-2.5 text-center border border-amber-100 dark:border-amber-900/40">
              <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Rendimiento</p>
              <p className="text-sm font-black text-gray-900 dark:text-gray-100 mt-0.5">{rendimientoText}</p>
            </div>
          </div>

          {/* Ingredientes / Insumos */}
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-red-500" />
              Insumos e Ingredientes ({listaIngredientes.length}):
            </p>
            {listaIngredientes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {listaIngredientes.map((ing, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium bg-red-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-red-100 dark:border-gray-700 px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1.5"
                  >
                    <FoodIcon name="salad" size={13} className="text-emerald-500 shrink-0" />
                    <span>{ing}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Ingredientes frescos preparados al momento.</p>
            )}
          </div>

          {/* Procedimiento o especificaciones si existen */}
          {ficha?.procedimiento && ficha.procedimiento !== "n/A" && (
            <div className="pt-1">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Preparación:</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2">{ficha.procedimiento}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ClienteLanding() {
  const { user, logout, isAuthenticated, refreshUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  const isStaffUser = useMemo(() => {
    if (!isAuthenticated || !user) return false;
    const rawRol = typeof user?.rol === "object" ? user?.rol?.nombre : user?.rol;
    const userRol = String(rawRol || "").toLowerCase().trim();
    if (userRol === "cliente" || Number(user?.idRol) === 4) return false;
    return Boolean(userRol || (user?.idRol !== undefined && user?.idRol !== null));
  }, [isAuthenticated, user]);
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, syncCartWithCatalog, getTotalItems, getSubtotal, getProductQuantityInCart } = useCart();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const { success, error, warning, info, confirmAction, confirmLogout } = useNotifications();

  const { filters: storeFilters, setFilter: setStoreFilter } = useUrlFilters(STORE_URL_DEFAULTS);
  const selectedCategoria = storeFilters.cat ? (Number.isNaN(Number(storeFilters.cat)) ? storeFilters.cat : Number(storeFilters.cat)) : null;
  const setSelectedCategoria = useCallback((val) => setStoreFilter("cat", val ?? "", { resetPage: false }), [setStoreFilter]);
  const searchTerm = storeFilters.q;
  const setSearchTerm = useCallback((val) => setStoreFilter("q", val ?? "", { resetPage: false }), [setStoreFilter]);
  const categoryCarouselRef = useRef(null);

  const scrollCategories = (direction) => {
    if (categoryCarouselRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      categoryCarouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
  const [showCart, setShowCart] = useState(false);
  const [showEmptyCartLoginModal, setShowEmptyCartLoginModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const cartLengthRef = useRef(cart.length);
  cartLengthRef.current = cart.length;

  useEffect(() => {
    if (showCheckout && cart.length === 0) {
      setShowCheckout(false);
    }
  }, [showCheckout, cart.length]);

  const [checkoutNombre, setCheckoutNombre] = useState("");
  const [checkoutTipoDoc, setCheckoutTipoDoc] = useState("C.C.");
  const [checkoutDocumento, setCheckoutDocumento] = useState("");
  const [checkoutTelefono, setCheckoutTelefono] = useState("");
  const [checkoutDireccion, setCheckoutDireccion] = useState("");
  const [checkoutMetodoPago] = useState("wompi");
  const [checkoutEspecificaciones, setCheckoutEspecificaciones] = useState("");
  const [checkoutTipoEntrega, setCheckoutTipoEntrega] = useState("domicilio");
  const [checkoutEmpaqueParaLlevar, setCheckoutEmpaqueParaLlevar] = useState(false);
  const [checkoutAceptaTerminos, setCheckoutAceptaTerminos] = useState(false);
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [checkoutDocCheck, setCheckoutDocCheck] = useState({ status: "idle", message: "" });
  const checkoutUserEditedDocRef = useRef(false);
  const [isProcessingWompi, setIsProcessingWompi] = useState(false);

  const checkoutAddressValidation = useMedellinAddressValidation(
    showCheckout ? checkoutDireccion : "",
    { required: showCheckout }
  );

  const ownUserDocClean = useMemo(() => {
    const raw = user?.numeroDocumento || user?.documento || "";
    const trimmed = String(raw || "").trim();
    return trimmed.length >= 6 ? trimmed : "";
  }, [user?.numeroDocumento, user?.documento]);
  const isCheckoutDocLocked = Boolean(isAuthenticated && ownUserDocClean);

  // Sincroniza automáticamente tipo de documento, cédula, nombre y dirección de la cuenta al abrir o refrescar perfil
  useEffect(() => {
    if (!showCheckout || !isAuthenticated || !user) return;
    if (ownUserDocClean) {
      setCheckoutTipoDoc(user?.tipoDocumento || "C.C.");
      setCheckoutDocumento(ownUserDocClean);
    }
    setCheckoutNombre((prev) => {
      if (prev && prev.trim()) return prev;
      return user?.nombre ? `${user.nombre} ${user.apellidos || ""}`.trim() : "";
    });
    setCheckoutTelefono((prev) => {
      if (prev && prev.trim()) return prev;
      return sanitizeTelefono(user?.telefono || "");
    });
    setCheckoutDireccion((prev) => {
      if (prev && prev.trim()) return prev;
      const rawDir = user?.direccion || "";
      let cleanDir = rawDir;
      if (typeof rawDir === "string" && rawDir.trim().startsWith("{")) {
        try {
          const p = JSON.parse(rawDir);
          cleanDir = p.direccion || rawDir;
        } catch (_) {}
      }
      return cleanDir;
    });
  }, [showCheckout, isAuthenticated, user, ownUserDocClean]);

  // Validación en vivo contra el backend para detectar si el documento ingresado pertenece a otro usuario registrado
  useEffect(() => {
    if (!showCheckout) {
      setCheckoutDocCheck({ status: "idle", message: "" });
      return;
    }

    const cleanDoc = sanitizeDocumento(checkoutDocumento, checkoutTipoDoc);
    const valRes = validateDocumento(cleanDoc, checkoutTipoDoc);
    if (!cleanDoc || !valRes.isValid) {
      setCheckoutDocCheck({ status: "idle", message: "" });
      return;
    }

    if (ownUserDocClean && cleanDoc === ownUserDocClean) {
      setCheckoutDocCheck({ status: "own", message: "Documento verificado de tu cuenta" });
      setCheckoutErrors((prev) => {
        if (!prev.documento) return prev;
        const next = { ...prev };
        delete next.documento;
        return next;
      });
      return;
    }

    let cancelled = false;
    setCheckoutDocCheck({ status: "checking", message: "Verificando documento..." });

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get("/usuarios/verificar-documento", {
          params: { numeroDocumento: cleanDoc },
          noCache: true
        });
        if (cancelled) return;
        if (res?.conflict) {
          const msg = res.message || `El número de documento "${cleanDoc}" ya pertenece a otro usuario registrado.`;
          setCheckoutDocCheck({ status: "conflict", message: msg });
          setCheckoutErrors((prev) => ({ ...prev, documento: msg }));
        } else if (res?.isOwnDocument) {
          setCheckoutDocCheck({ status: "own", message: "Documento verificado de tu cuenta" });
          setCheckoutErrors((prev) => {
            if (!prev.documento) return prev;
            const next = { ...prev };
            delete next.documento;
            return next;
          });
        } else {
          setCheckoutDocCheck({ status: "available", message: "Documento válido" });
          setCheckoutErrors((prev) => {
            if (!prev.documento) return prev;
            const next = { ...prev };
            delete next.documento;
            return next;
          });
        }
      } catch (_) {
        if (!cancelled) {
          setCheckoutDocCheck({ status: "idle", message: "" });
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showCheckout, checkoutDocumento, checkoutTipoDoc, ownUserDocClean]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState("personalizar");
  const [showResenasModal, setShowResenasModal] = useState(false);

  // Real-time ticker for live countdowns (descuenta segundo a segundo de forma fluida)
  const [liveTick, setLiveTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) setLiveTick(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const [productoParaResenas, setProductoParaResenas] = useState(null);
  const [ratingsMap, setRatingsMap] = useState({});

  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  const [categoriasList, setCategoriasList] = useState([]);
  const [productosList, setProductosList] = useState([]);
  const [fichasMap, setFichasMap] = useState(fichasTecnicasDefault);
  const [eventosList, setEventosList] = useState(eventosDefault);
  const [currentCarouselTheme, setCurrentCarouselTheme] = useState(null);
  const [showPersonalizarEventoModal, setShowPersonalizarEventoModal] = useState(false);
  const [eventoParaPersonalizar, setEventoParaPersonalizar] = useState(null);
  const [productoParaEvento, setProductoParaEvento] = useState(null);

  const refreshRatingsMap = useCallback(() => {
    const pIdSet = new Set(productosList.map((p) => p?.id || p?.idProducto).filter(Boolean));
    if (Array.isArray(eventosList)) {
      eventosList.forEach((e) => {
        if (e?.idProducto) pIdSet.add(e.idProducto);
        if (e?.productosAsociados) {
          try {
            const parsed = typeof e.productosAsociados === "string"
              ? JSON.parse(e.productosAsociados)
              : e.productosAsociados;
            if (Array.isArray(parsed)) {
              parsed.forEach((a) => {
                const aId = a?.idProducto || a?.id;
                if (aId) pIdSet.add(aId);
              });
            }
          } catch {
            // ignorar JSON inválido
          }
        }
      });
    }
    const pIds = Array.from(pIdSet).filter(Boolean).join(",");
    if (!pIds) return;
    apiClient.get(`/resenas/ratings?ids=${pIds}`)
      .then((res) => { if (res) setRatingsMap(res); })
      .catch(() => {});
  }, [productosList, eventosList]);

  const hasActiveEvents = useMemo(() => {
    if (!Array.isArray(eventosList) || eventosList.length === 0) return false;
    return eventosList.some((e) => isEventActiveInColombia(e, liveTick));
  }, [eventosList, liveTick]);

  // Manejador de flecha Atrás / Adelante del navegador (popstate) para cerrar modales sin salir de la página
  useEffect(() => {
    const handlePopState = () => {
      if (showCheckout) {
        setShowCheckout(false);
      } else if (showCart) {
        setShowCart(false);
      } else if (showProductModal) {
        setShowProductModal(false);
      } else if (showPersonalizarEventoModal) {
        setShowPersonalizarEventoModal(false);
      } else if (showResenasModal) {
        setShowResenasModal(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showCheckout, showCart, showProductModal, showPersonalizarEventoModal, showResenasModal]);
  const [adicionesList, setAdicionesList] = useState(adicionesDisponibles);

  const [dismissedGoogleBanner, setDismissedGoogleBanner] = useState(() => {
    return sessionStorage.getItem("chazin_google_banner_dismissed") === "true";
  });

  const isGoogleUser = Boolean(
    user?.esUsuarioGoogle ||
    (user?.foto && user?.foto.includes("googleusercontent.com")) ||
    (user?.avatar && user?.avatar.includes("googleusercontent.com"))
  );

  const googlePendingFields = useMemo(() => {
    if (!isAuthenticated || !isGoogleUser) return [];
    const fields = [];
    const rawDoc = user?.numeroDocumento || user?.documento || "";
    if (!rawDoc || String(rawDoc).trim().length < 6) {
      fields.push("cédula");
    }
    const rawTel = user?.telefono || "";
    if (!rawTel || String(rawTel).trim().length < 7) {
      fields.push("teléfono");
    }
    let rawDir = user?.direccion || "";
    if (typeof rawDir === "string" && rawDir.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(rawDir);
        rawDir = parsed.direccion || "";
      } catch (e) {}
    }
    if (!rawDir || String(rawDir).trim().length < 5) {
      fields.push("dirección");
    }
    return fields;
  }, [isAuthenticated, isGoogleUser, user?.numeroDocumento, user?.documento, user?.telefono, user?.direccion]);

  const rawUserDoc = user?.numeroDocumento || user?.documento || "";
  const tieneDocRegistrado = Boolean(rawUserDoc && String(rawUserDoc).trim().length >= 6);

  // Ref y desplazamiento suave para carrusel 'Complementa tu orden' en Carrito
  const complementosRef = useRef(null);
  const scrollComplementos = (direction) => {
    if (complementosRef.current) {
      const scrollAmount = direction === "left" ? -170 : 170;
      complementosRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleAddComplemento = (item) => {
    const itemStock = Number(item.stock !== undefined ? item.stock : 0);
    if (item.agotado || itemStock <= 0 || item.estado === "Inactivo" || item.estado === 0) {
      warning("Producto agotado por el momento", `Lo sentimos, "${item.nombre}" está agotado en este momento y no está disponible.`);
      return;
    }
    const res = addToCart({
      id: item.id || item.idProducto,
      idProducto: item.idProducto || item.id,
      idVariante: item.esVarianteBase ? (item.idVariante || null) : (item.idVariante || item.id || item.idProducto),
      esVarianteBase: Boolean(item.esVarianteBase ?? true),
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: 1,
      stock: itemStock,
      imagen: item.imagen,
      adiciones: [],
      personalizaciones: []
    });
    if (res && res.success === false) {
      error("Stock insuficiente", res.message || "No hay más unidades disponibles.");
    } else {
      success("¡Antojo agregado!", `${item.nombre} se sumó a tu orden.`);
    }
  };

  // Detectar retorno desde Wompi (si se completó pago vía checkout web directo)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wompiTxId = params.get("id");
    if (wompiTxId) {
      window.history.replaceState({}, document.title, window.location.pathname);

      (async () => {
        try {
          const verificacion = await wompiService.verificarTransaccion(wompiTxId);
          if (verificacion && verificacion.aprobado) {
            success("¡Pago Aprobado con Wompi!", `Tu pedido ${verificacion.numeroVenta || ''} fue aprobado y enviado a cocina.`);
            clearCart();
            navigate("/perfil?tab=pedidos", { state: { tab: "pedidos" } });
          } else if (verificacion && verificacion.estado === 'PENDING') {
            success("Pago en Proceso", "Tu banco está verificando el pago. Puedes seguir su estado en Mi Perfil.");
            clearCart();
            navigate("/perfil?tab=pedidos", { state: { tab: "pedidos" } });
          } else {
            error("Pago No Completado", `La transacción fue ${verificacion?.estado || 'rechazada'}. Puedes intentar de nuevo.`);
          }
        } catch (err) {
          console.error("Error verificando transacción de retorno de Wompi:", err);
        }
      })();
    }
  }, []);

  // Fetch catalog categories & products dynamically from API + sincronización en vivo con carrito
  const lastCatalogFetchRef = useRef(0);
  const fetchCatalog = useCallback(async (forceRefresh = false) => {
    try {
      lastCatalogFetchRef.current = Date.now();
      const [catsRes, prodsRes, fichasRes, adicRes, evtsRes] = await Promise.allSettled([
        categoriaProductosService.getCategorias(),
        productosService.getProductos(forceRefresh ? { refresh: "true" } : null),
        fichasTecnicasService.getFichas(),
        adicionesService.getAdiciones(),
        eventosService.getEventos()
      ]);

      const activeEvts = evtsRes.status === "fulfilled" && Array.isArray(evtsRes.value)
        ? evtsRes.value
        : [];
      if (evtsRes.status === "fulfilled" && Array.isArray(evtsRes.value)) {
        setEventosList(evtsRes.value);
      }

      if (catsRes.status === "fulfilled" && Array.isArray(catsRes.value) && catsRes.value.length > 0) {
        const apiCats = catsRes.value
          .filter(c => (c.estado === 'Activo' || c.estado === 1 || c.estado === undefined))
          .filter(c => !['ssss', 'fghjk', 'dfg', 'test', '1', '3', '4', '5', '6', '7'].includes(c.nombre?.trim()?.toLowerCase?.()) && !c.nombre?.startsWith('__SISTEMA'))
          .map(c => {
            const meta = getCategoryMeta(c.nombre);
            return {
              id: c.id || c.idCategoriaProducto,
              idCategoriaProducto: c.idCategoriaProducto || c.id,
              nombre: c.nombre,
              icon: c.icon || meta.icon,
              color: meta.color
            };
          });
        setCategoriasList(apiCats.length > 0 ? apiCats : categoriasDefault);
      } else {
        setCategoriasList(categoriasDefault);
      }

      let apiAdicsList = [];
      if (adicRes.status === "fulfilled" && Array.isArray(adicRes.value) && adicRes.value.length > 0) {
        apiAdicsList = adicRes.value.map(a => ({
          idAdicion: a.idAdicion || a.id,
          nombre: a.nombre,
          precio: parseFloat(a.precio || 0),
          stock: Number(a.stock !== undefined ? a.stock : (a.stockActual !== undefined ? a.stockActual : 0)),
          stockActual: Number(a.stockActual !== undefined ? a.stockActual : (a.stock !== undefined ? a.stock : 0)),
          tipo: a.tipo || "Adición",
          estado: a.estado !== undefined ? a.estado : 1,
          imagen: (a.imagen && typeof a.imagen === "string" && a.imagen.startsWith("http")) ? a.imagen : getAdicionImage(a)
        }));
        setAdicionesList(apiAdicsList);
      }

      if (prodsRes.status === "fulfilled" && Array.isArray(prodsRes.value) && prodsRes.value.length > 0) {
        const assocEvtsByProd = new Map();
        activeEvts.forEach((ev) => {
          if (!ev || !isEventActiveInColombia(ev)) return;
          let asociados = [];
          if (Array.isArray(ev.productosAsociados)) {
            asociados = ev.productosAsociados;
          } else if (typeof ev.productosAsociados === "string" && ev.productosAsociados.trim()) {
            try {
              const parsed = JSON.parse(ev.productosAsociados);
              if (Array.isArray(parsed)) asociados = parsed;
            } catch (_) {}
          }
          asociados.forEach((asoc) => {
            const pid = String(asoc?.idProducto ?? asoc?.id ?? "");
            if (!pid) return;
            if (!assocEvtsByProd.has(pid)) assocEvtsByProd.set(pid, []);
            assocEvtsByProd.get(pid).push({ ev, asoc });
          });
        });

        const apiProds = prodsRes.value
          .filter(p => p.id !== 0 && p.idProducto !== 0 && !p.nombre?.startsWith('__SISTEMA'))
          .map(p => {
            const isInactive = p.estado === 'Inactivo' || p.estado === 0;
            const rawStock = Number(p.stock !== undefined ? p.stock : (p.stockActual !== undefined ? p.stockActual : 0));
            const finalStock = isInactive ? 0 : rawStock;
            const prodIdNum = p.idProducto || p.id;
            const basePriceNum = Number(p.precio) || 0;

            const directEvts = Array.isArray(p.eventos) ? p.eventos : [];
            const seenEvtIds = new Set(directEvts.map((e) => String(e?.idEvento ?? e?.id ?? "")).filter(Boolean));
            const mergedEventos = [...directEvts];
            const extraEntries = assocEvtsByProd.get(String(prodIdNum)) || [];
            extraEntries.forEach(({ ev, asoc }) => {
              const evId = String(ev?.idEvento ?? ev?.id ?? "");
              if (evId && seenEvtIds.has(evId)) return;
              if (evId) seenEvtIds.add(evId);
              const matchDesc = asoc?.descuento !== undefined && asoc?.descuento !== null
                ? Number(asoc.descuento)
                : Number(ev.descuento || 0);
              const matchPrecio = Number(asoc?.precioPromocional || asoc?.nuevoPrecio || 0) ||
                (matchDesc > 0 && matchDesc < 100 && basePriceNum > 0
                  ? Math.round(basePriceNum * (1 - matchDesc / 100))
                  : (String(ev.idProducto) === String(prodIdNum) ? ev.nuevoPrecio : null));
              mergedEventos.push({
                ...ev,
                descuento: matchDesc,
                nuevoPrecio: matchPrecio
              });
            });

            return {
              id: p.id || p.idProducto,
              idProducto: prodIdNum,
              nombre: p.nombre,
              precio: basePriceNum,
              stock: finalStock,
              agotado: Boolean(p.agotado || isInactive || finalStock <= 0),
              estado: p.estado,
              categoria: p.categoria || (p.categoriaProducto ? p.categoriaProducto.nombre : ''),
              idCategoriaProducto: p.idCategoriaProducto,
              descripcion: p.descripcion,
              imagen: p.imagen,
              variantes: Array.isArray(p.variantes) ? p.variantes.filter((v) => isVariantActive(v)) : [],
              idVarianteBase: p.idVarianteBase || null,
              idVariantePrincipal: p.idVariantePrincipal || null,
              fichaTecnica: p.fichaTecnica || null,
              esCombo: Boolean(p.esCombo),
              configuracionCombo: p.configuracionCombo || null,
              itemsCombo: Array.isArray(p.itemsCombo) ? p.itemsCombo : [],
              adiciones: Array.isArray(p.adiciones) ? p.adiciones : [],
              adicionesDisponibles: Array.isArray(p.adicionesDisponibles) ? p.adicionesDisponibles : [],
              eventos: mergedEventos
            };
          });
        setProductosList(apiProds);

        // Sincronizar carrito guardado en localStorage contra el catálogo vivo (precios, nombres, stock, variantes, eventos y adiciones)
        syncCartWithCatalog(apiProds, activeEvts, apiAdicsList);

        // Fetch ratings
        const pIdSet = new Set(apiProds.map(p => p.id || p.idProducto));
        if (evtsRes.status === "fulfilled" && Array.isArray(evtsRes.value)) {
          evtsRes.value.forEach(e => {
            if (e.idProducto) pIdSet.add(e.idProducto);
            if (e.productosAsociados) {
              try {
                const parsed = typeof e.productosAsociados === "string" ? JSON.parse(e.productosAsociados) : e.productosAsociados;
                if (Array.isArray(parsed)) {
                  parsed.forEach(a => {
                    const aId = a.idProducto || a.id;
                    if (aId) pIdSet.add(aId);
                  });
                }
              } catch (err) {}
            }
          });
        }
        const pIds = Array.from(pIdSet).filter(Boolean).join(',');
        if (pIds) {
          apiClient.get(`/resenas/ratings?ids=${pIds}`)
            .then(res => { if (res) setRatingsMap(res); })
            .catch(() => {});
        }
      } else {
        setProductosList(productosDefault);
      }

      if (fichasRes.status === "fulfilled" && Array.isArray(fichasRes.value)) {
        const fMap = { ...fichasTecnicasDefault };
        fichasRes.value.forEach(f => {
          if (f.idProducto) {
            fMap[f.idProducto] = f;
          }
        });
        setFichasMap(fMap);
      }
    } catch (e) {
      console.warn("Error cargando catálogo dinámico en ClienteLanding:", e);
      setCategoriasList(categoriasDefault);
      setProductosList(productosDefault);
    }
  }, [syncCartWithCatalog]);

  useEffect(() => {
    fetchCatalog(false);
    const unsubCatalog = subscribeCatalogUpdates(() => {
      fetchCatalog(true);
    });
    const handleFocusRefresh = () => {
      if (Date.now() - lastCatalogFetchRef.current > 15000) {
        fetchCatalog(true);
      }
    };
    window.addEventListener("focus", handleFocusRefresh);
    return () => {
      unsubCatalog();
      window.removeEventListener("focus", handleFocusRefresh);
    };
  }, [fetchCatalog]);

  // Fetch client orders from backend + local history synchronization
  const fetchMyOrders = async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingPedidos(true);
      const userId = user?.idUsuario || user?.id || user?._id;
      const metaOrderKey = String(userId || 'guest');
      const legacyOrderKey = `mis_pedidos_${metaOrderKey}`;
      let localHistory = getClientMeta("orders", metaOrderKey, null);
      if (!Array.isArray(localHistory)) {
        try {
          const legacyRaw = localStorage.getItem(legacyOrderKey);
          localHistory = legacyRaw ? JSON.parse(legacyRaw) : [];
          if (legacyRaw) {
            setClientMeta("orders", metaOrderKey, Array.isArray(localHistory) ? localHistory.slice(0, 50) : []);
            localStorage.removeItem(legacyOrderKey);
          }
        } catch (e) {
          localHistory = [];
        }
      }

      let backendOrders = [];
      let backendLoaded = false;
      const isUnpaidWompiIntention = (v) => {
        if (!v) return false;
        let obs = {};
        if (v.observaciones) {
          if (typeof v.observaciones === "object") obs = v.observaciones;
          else if (typeof v.observaciones === "string" && v.observaciones.trim().startsWith("{")) {
            try { obs = JSON.parse(v.observaciones); } catch (_) {}
          }
        }
        if (obs.wompiAbandonada === true) return true;
        if (obs.esDevolucion === true || v.esDevolucion === true) return false;
        const aprob = String(v.estadoAprobacion || obs.estadoAprobacion || "").toUpperCase().trim();
        if (aprob === "APROBADO") return false;
        if (obs.wompiTransactionId) return false;
        const isWompiOrOnline =
          Boolean(obs.wompiReference) ||
          Boolean(obs.esIntencionWompi) ||
          Boolean(obs.montoEnCentavos) ||
          String(obs.metodoPago || v.metodoPago || "").toLowerCase().includes("wompi") ||
          String(v.origen || obs.origen || "").toUpperCase() === "ONLINE" ||
          String(v.tipoVenta || "").toUpperCase() === "DOMICILIO";
        return isWompiOrOnline;
      };
      try {
        const data = await ventasService.getVentas();
        if (data && Array.isArray(data)) {
          backendLoaded = true;
          backendOrders = data.filter(v =>
            !isUnpaidWompiIntention(v) && (
              (userId && Number(v.idUsuario) === Number(userId)) ||
              (user?.idCliente && Number(v.idCliente) === Number(user.idCliente)) ||
              v.clienteNombre === `${user?.nombre || ''} ${user?.apellidos || ''}`.trim()
            )
          );
        }
      } catch (err) {
        console.log("No se pudieron cargar pedidos del backend:", err);
      }

      // Map backend orders by id and code
      const backendMap = new Map();
      backendOrders.forEach(o => {
        const id = o.idVenta || o.id;
        const code = o.numeroVenta || o.codigoPedido;
        if (id) backendMap.set(String(id), o);
        if (code) backendMap.set(String(code), o);
      });

      const mergedPedidos = [];
      const processedBackendIds = new Set();

      // Check all orders the client previously placed
      for (const localOrd of localHistory) {
        const matched = backendMap.get(String(localOrd.id)) || backendMap.get(String(localOrd.numeroVenta));
        if (matched) {
          processedBackendIds.add(String(matched.idVenta || matched.id));
          let currentEstado = matched.estado || matched.estadoEntrega || 'Por Aprobar';
          if (matched.estadoAprobacion === 'RECHAZADO' || matched.estadoEntrega === 'CANCELADO') {
            currentEstado = 'Anulada';
          } else if (matched.estadoAprobacion === 'PENDIENTE') {
            currentEstado = 'Por Aprobar';
          } else if (matched.estadoEntrega === 'PREPARANDO') {
            currentEstado = 'En Preparación';
          } else if (matched.estadoEntrega === 'LISTO') {
            currentEstado = 'Listo';
          } else if (matched.estadoEntrega === 'ENTREGADO') {
            currentEstado = 'Completada';
          }

          localOrd.estado = currentEstado;
          mergedPedidos.push({
            id: matched.idVenta || matched.id || localOrd.id,
            numeroVenta: matched.numeroVenta || localOrd.numeroVenta,
            fecha: matched.fechaVenta ? new Date(matched.fechaVenta).toLocaleString('es-CO') : localOrd.fecha,
            items: localOrd.items || [],
            total: matched.total || localOrd.total,
            estado: currentEstado
          });
        } else if (!backendLoaded) {
          // Solo usar respaldo local si falló la conexión con el backend;
          // si el backend respondió, no resucitar intenciones Wompi abandonadas ya filtradas
          mergedPedidos.push({
            ...localOrd,
            estado: localOrd.estado || 'Anulada'
          });
        }
      }

      // Add any orders from backend that were not in localHistory
      for (const o of backendOrders) {
        const idStr = String(o.idVenta || o.id);
        if (!processedBackendIds.has(idStr)) {
          let currentEstado = o.estado || o.estadoEntrega || 'Por Aprobar';
          if (o.estadoAprobacion === 'RECHAZADO' || o.estadoEntrega === 'CANCELADO') {
            currentEstado = 'Anulada';
          } else if (o.estadoAprobacion === 'PENDIENTE') {
            currentEstado = 'Por Aprobar';
          } else if (o.estadoEntrega === 'PREPARANDO') {
            currentEstado = 'En Preparación';
          } else if (o.estadoEntrega === 'LISTO') {
            currentEstado = 'Listo';
          } else if (o.estadoEntrega === 'ENTREGADO') {
            currentEstado = 'Completada';
          }

          let itemsList = [{ nombre: 'Pedido de comida', cantidad: 1, precio: o.total }];
          if (o.detalles && o.detalles.length > 0) {
            itemsList = o.detalles.map(d => ({
              nombre: d.observaciones || `Producto #${d.idVariante}`,
              cantidad: d.cantidad,
              precio: d.precioUnitario
            }));
          }

          const newEntry = {
            id: o.idVenta || o.id,
            numeroVenta: o.numeroVenta || `VEN-${String(o.idVenta || o.id).padStart(4, '0')}`,
            fecha: o.fechaVenta ? new Date(o.fechaVenta).toLocaleString('es-CO') : 'Hoy',
            items: itemsList,
            total: o.total,
            estado: currentEstado
          };

          mergedPedidos.push(newEntry);
        }
      }

      setClientMeta("orders", metaOrderKey, mergedPedidos.slice(0, 50));
      setPedidos(mergedPedidos);
    } catch (err) {
      console.log("Error cargando pedidos:", err);
    } finally {
      setLoadingPedidos(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [isAuthenticated, user]);

  const handleCancelarPedido = async (pedidoId) => {
    const isConfirmed = await confirmAction(
      "¿Cancelar este pedido?",
      "Esta acción cambiará el estado del pedido a Cancelado. ¿Deseas continuar?"
    );
    if (!isConfirmed) return;

    try {
      await ventasService.cancelarVenta(pedidoId);
      success("Pedido cancelado", "Tu pedido fue cancelado exitosamente.");
      await Promise.all([fetchMyOrders(), refreshUser ? refreshUser().catch(() => {}) : Promise.resolve()]);
    } catch (err) {
      console.warn("Error cancelando pedido:", err);
      try {
        await ventasService.updateEstadoVenta(pedidoId, "CANCELADO");
        success("Pedido cancelado", "Tu pedido fue cancelado exitosamente.");
        await Promise.all([fetchMyOrders(), refreshUser ? refreshUser().catch(() => {}) : Promise.resolve()]);
      } catch (err2) {
        error("Error al cancelar pedido", err2.message || "No se pudo cancelar el pedido.");
      }
    }
  };

  const activeCategorias = categoriasList.length > 0 ? categoriasList : categoriasDefault;
  const activeProductos = productosList.length > 0 ? productosList : productosDefault;
  const activeAdiciones = adicionesList.length > 0 ? adicionesList : adicionesDisponibles;

  // Filtrado estricto para que las adiciones sean toppings de comida reales, activos y sin duplicados
  const foodAdiciones = activeAdiciones.filter(ad =>
    !isDrinkProduct(ad) &&
    ad.idAdicion !== 1 &&
    ad.idAdicion !== 2 &&
    (ad.estado === undefined || ad.estado === 1 || ad.estado === true || ad.estado === "1")
  );

  const bebidasDisponibles = activeProductos.filter(p => isDrinkProduct(p));

  // ═══ Complementos INTELIGENTES: recomienda según lo que ya hay en el carrito ═══
  // Categorías consideradas "plato principal / plato fuerte" (NO se sugieren como complemento/antojo)
  const CATEGORIAS_PLATO_PRINCIPAL = [
    "hamburguesas",
    "perros calientes",
    "combos",
    "salchipapas",
    "salchipapas gourmet",
    "platos fuertes",
    "plato fuerte"
  ];

  const complementosOrden = useMemo(() => {
    // IDs de productos ya en el carrito para no duplicar sugerencias
    const cartProductIds = new Set(cart.map(item => item.idProducto || item.id));

    // Detectar qué tipo de productos ya tiene el carrito
    const cartHasDrink = cart.some(item => isDrinkProduct(item));
    const cartHasSide = cart.some(item => {
      const n = (item.nombre || "").toLowerCase();
      // Las salchipapas son un plato fuerte, no un acompañamiento
      if (n.includes("salchipapa")) return false;
      return n.includes("papas") || n.includes("porción") || n.includes("porcion") || n.includes("casco") || n.includes("espiral");
    });

    // Helper: determinar si un producto es "plato principal / plato fuerte"
    const isPlatoPrincipal = (p) => {
      const catName = String(p.categoriaNombre || p.categoria || "").toLowerCase().trim();
      const prodName = (p.nombre || "").toLowerCase();
      return CATEGORIAS_PLATO_PRINCIPAL.some(cp =>
        catName.includes(cp) ||
        prodName.includes("hamburguesa") ||
        prodName.includes("perro caliente") ||
        prodName.includes("perro suizo") ||
        prodName.includes("salchipapa") ||
        prodName.includes("combo")
      );
    };

    // Helper: generar badge inteligente para complementos
    const getBadge = (p) => {
      const n = (p.nombre || "").toLowerCase();
      if (n.includes("coca-cola") || n.includes("coca cola")) return "Más Vendido";
      if (n.includes("colombiana")) return "La Nuestra";
      if (n.includes("manzana")) return "Tradicional";
      if (n.includes("pepsi")) return "Pepsi";
      if (n.includes("sprite")) return "Lima-Limón";
      if (n.includes("cuatro") || n.includes("quatro")) return "Toronja";
      if (n.includes("cristal") || n.includes("agua")) return "100% Pura";
      if (n.includes("malteada") || n.includes("milkshake")) return "Cremoso";
      if (n.includes("jugo") || n.includes("hit")) return "Natural";
      if (n.includes("papas")) return "Favorito";
      if (n.includes("nugget")) return "Crunchy";
      if (n.includes("postre") || n.includes("brownie") || n.includes("torta") || n.includes("helado")) return "Dulce";
      if (n.includes("arepa") || n.includes("empanada") || n.includes("dedito")) return "Entrada";
      if (isDrinkProduct(p)) return "Refrescante";
      return "Complemento";
    };

    // Helper: generar descripción corta inteligente
    const getDescripcion = (p) => {
      if (p.descripcion && p.descripcion.length <= 40) return p.descripcion;
      const n = (p.nombre || "").toLowerCase();
      if (isDrinkProduct(p)) return "Bebida personal bien fría";
      if (n.includes("papas")) return "Crocantes y doradas";
      if (n.includes("nugget")) return "Crujientes y jugosos";
      if (n.includes("postre") || n.includes("brownie") || n.includes("helado")) return "Para el antojo dulce";
      if (n.includes("arepa") || n.includes("empanada")) return "Entrada rápida";
      return p.descripcion || "Complemento ideal";
    };

    // Helper: generar tamaño/label secundario
    const getTamano = (p) => {
      const n = (p.nombre || "").toLowerCase();
      if (isDrinkProduct(p)) return "400 ml";
      if (n.includes("150g")) return "150g";
      if (n.includes("porción") || n.includes("porcion")) return "1 porción";
      return "";
    };

    // Helper: convertir producto a objeto de complemento (siempre usa el producto padre / base)
    const toComplemento = (p) => {
      const pId = p.idProducto || p.id;
      let compImg = p.imagen;
      if (!compImg || typeof compImg !== "string" || (!compImg.startsWith("http") && !compImg.startsWith("/") && !compImg.startsWith("data:"))) {
        const n = String(p.nombre || "").toLowerCase();
        if (n.includes("naranja")) compImg = "/images/drinks/images__Gaseosa_naranja_-removebg-preview.png";
        else if (n.includes("uva")) compImg = "/images/drinks/uva_postobon-removebg-preview.png";
        else if (n.includes("manzana")) compImg = "/images/drinks/manzana_400ml-removebg-preview.png";
        else if (n.includes("colombiana")) compImg = "https://res.cloudinary.com/dckwtknmq/image/upload/v1789001495/qy8wy9igmgb0wppnjavw.png";
        else if (n.includes("coca")) compImg = "/images/drinks/coca_cola-removebg-preview.png";
        else if (n.includes("pepsi")) compImg = "/images/drinks/pepsi_400ml-removebg-preview.png";
        else if (n.includes("sprite")) compImg = "/images/drinks/sprite-removebg-preview.png";
        else if (n.includes("coca") && (n.includes("light") || n.includes("sin az") || n.includes("zero"))) compImg = "/images/drinks/coca_cola_light_400ml.png";
        else if (n.includes("quatro") || n.includes("cuatro") || n.includes("toronja")) compImg = "/images/drinks/quatro_400ml.png";
      }
      return {
        id: p.id || p.idProducto,
        idProducto: pId,
        idVariante: p.idVarianteBase || null,
        esVarianteBase: true,
        nombre: p.nombre,
        descripcion: getDescripcion(p),
        tamano: getTamano(p),
        precio: Number(p.precio),
        badge: getBadge(p),
        imagen: compImg || p.imagen,
        stock: Number(p.stock !== undefined ? p.stock : 0)
      };
    };

    // ── Separar productos candidatos (todo lo que NO sea plato principal) ──
    const candidatos = activeProductos.filter(p => {
      const pId = p.idProducto || p.id;
      // Excluir productos ya en el carrito
      if (cartProductIds.has(pId)) return false;
      // Excluir platos principales
      if (isPlatoPrincipal(p)) return false;
      return true;
    });

    // Separar en: bebidas, entradas/sides, otros
    const bebidas = candidatos.filter(p => isDrinkProduct(p));
    const entradas = candidatos.filter(p => {
      if (isDrinkProduct(p)) return false;
      const n = (p.nombre || "").toLowerCase();
      if (n.includes("salchipapa")) return false;
      return n.includes("papas") || n.includes("porción") || n.includes("porcion") ||
             n.includes("nugget") || n.includes("arepa") || n.includes("empanada") || n.includes("dedito") ||
             n.includes("casco") || n.includes("espiral");
    });
    const otros = candidatos.filter(p => !isDrinkProduct(p) && !entradas.includes(p));

    // ── Orden inteligente según contexto del carrito ──
    const ordenados = [];

    if (!cartHasDrink) {
      // Si NO tiene bebida: bebidas primero (sugerir que agregue una)
      // Priorizar Coca-Cola como primera opción
      const cocaCola = bebidas.find(b => (b.nombre || "").toLowerCase().includes("coca-cola"));
      if (cocaCola) ordenados.push(toComplemento(cocaCola));
      bebidas.filter(b => b !== cocaCola).forEach(b => ordenados.push(toComplemento(b)));
      entradas.forEach(e => ordenados.push(toComplemento(e)));
      otros.forEach(o => ordenados.push(toComplemento(o)));
    } else if (!cartHasSide) {
      // Si tiene bebida pero NO tiene acompañamiento: entradas primero
      entradas.forEach(e => ordenados.push(toComplemento(e)));
      otros.forEach(o => ordenados.push(toComplemento(o)));
      bebidas.forEach(b => ordenados.push(toComplemento(b)));
    } else {
      // Ya tiene bebida y acompañamiento: mostrar lo que quede (otros, bebidas extra, entradas extra)
      otros.forEach(o => ordenados.push(toComplemento(o)));
      entradas.forEach(e => ordenados.push(toComplemento(e)));
      bebidas.forEach(b => ordenados.push(toComplemento(b)));
    }

    return ordenados;
  }, [activeProductos, cart]);

  // Helper ultra-preciso de Evento Activo (Burger Fest / Drops / Promos con Vigencia en Tiempo Real Colombia)
  const getActiveEvent = (producto) => {
    if (!producto) return null;
    const eventos = Array.isArray(producto.eventos) ? producto.eventos : [];
    if (eventos.length === 0) return null;

    const validEvents = eventos.filter((e) => isEventActiveInColombia(e, liveTick));
    if (validEvents.length === 0) return null;

    const regularPrice = Number(producto.precio || 0);
    const computeEvtPrice = (e) => {
      if (e.nuevoPrecio && Number(e.nuevoPrecio) > 0) return Number(e.nuevoPrecio);
      if (e.descuento && Number(e.descuento) > 0) return Math.round(regularPrice * (1 - Number(e.descuento) / 100));
      return regularPrice;
    };
    const evt = [...validEvents].sort((a, b) => computeEvtPrice(a) - computeEvtPrice(b))[0];
    const eventPrice = computeEvtPrice(evt);

    const savings = Math.max(0, regularPrice - eventPrice);
    const discountPercent = regularPrice > 0 && savings > 0
      ? Math.round((savings / regularPrice) * 100)
      : (evt.descuento ? Math.round(Number(evt.descuento)) : 0);

    const vig = evaluateEventVigencia(evt, liveTick);
    const formattedDate = vig?.formattedDate || "";

    return {
      ...evt,
      nombre: stripEmojis(evt.nombreEvento || evt.nombre || "Edición Especial"),
      regularPrice,
      eventPrice,
      savings,
      discountPercent,
      formattedDate,
      tipo: evt.tipoEvento || "EDICION_LIMITADA",
      vigencia: evt.fechaFin
        ? {
            diasRestantes: vig?.diasRestantes ?? null,
            horasRestantes: vig?.horasRestantes ?? null,
            urgente: Boolean(vig?.urgente),
            label: vig?.label || (formattedDate ? `Hasta ${formattedDate}` : "Edición Especial")
          }
        : {
            diasRestantes: null,
            horasRestantes: null,
            urgente: false,
            label: "Vigencia Permanente"
          }
    };
  };

  const eventProductsCount = useMemo(() => {
    return activeProductos.filter(p => Boolean(getActiveEvent(p))).length;
  }, [activeProductos]);

  const productosFiltrados = useMemo(() => {
    const hasSearch = Boolean(searchTerm && searchTerm.trim());

    const list = activeProductos.filter((p) => {
      const precioNum = Number(p.precio || 0);
      const hasDesc = Boolean(p.descripcion && String(p.descripcion).trim());
      const descText = hasDesc ? p.descripcion : "sin_descripcion sin descripcion";
      const hasCat = Boolean((p.categoria || p.categoriaNombre) && String(p.categoria || p.categoriaNombre).trim());
      const catText = hasCat ? `${p.categoria || ""} ${p.categoriaNombre || ""}` : "sin_categoria sin categoria";

      const matchSearch = matchesSmartSearch(
        [
          p.nombre,
          p.descripcion,
          descText,
          p.categoria,
          p.categoriaNombre,
          catText,
          p.precio,
          String(p.precio ?? ""),
          precioNum > 0 ? `$${precioNum.toLocaleString("es-CO")}` : "",
          precioNum > 0 ? `$ ${precioNum.toLocaleString("es-CO")}` : "",
          p.id,
          p.idProducto,
          `#${p.id || p.idProducto}`
        ],
        searchTerm
      );
      if (!matchSearch) return false;

      // Si el usuario escribe en el buscador, la búsqueda prevalece en todo el menú
      if (hasSearch) return true;

      if (!selectedCategoria) return true;

      if (selectedCategoria === "eventos") {
        return Boolean(getActiveEvent(p));
      }

      const selectedCatObj = activeCategorias.find(c => (c.id === selectedCategoria) || (c.idCategoriaProducto === selectedCategoria));
      const catName = (selectedCatObj?.nombre || "").toLowerCase().trim();
      const prodCatName = (p.categoriaNombre || p.categoria || "").toLowerCase().trim();

      const pCatId = Number(p.idCategoriaProducto || p.categoriaId || (typeof p.categoria === "number" ? p.categoria : 0));
      const targetCatId = Number(selectedCategoria);
      const matchCatId = selectedCategoria !== null && pCatId > 0 && pCatId === targetCatId;
      const matchCatName = Boolean(
        catName &&
        prodCatName &&
        (prodCatName === catName ||
          prodCatName.includes(catName) ||
          catName.includes(prodCatName))
      );

      return matchCatId || matchCatName;
    });

    // Ordenar de primero los productos que forman parte de eventos activos
    return [...list].sort((a, b) => {
      const aHasEvent = Boolean(getActiveEvent(a) || (a.eventos && a.eventos.length > 0));
      const bHasEvent = Boolean(getActiveEvent(b) || (b.eventos && b.eventos.length > 0));
      if (aHasEvent && !bHasEvent) return -1;
      if (!aHasEvent && bHasEvent) return 1;
      return 0;
    });
  }, [activeProductos, searchTerm, selectedCategoria, activeCategorias]);

  const [maxVisibleProducts, setMaxVisibleProducts] = useState(8);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    setMaxVisibleProducts(8);
  }, [searchTerm, selectedCategoria]);

  useEffect(() => {
    if (maxVisibleProducts >= productosFiltrados.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          setMaxVisibleProducts((prev) => Math.min(prev + 12, productosFiltrados.length));
        }
      },
      { rootMargin: "250px" }
    );
    const target = loadMoreRef.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [maxVisibleProducts, productosFiltrados.length]);

  const handleSelectEventoFromCarousel = (evento, targetProd) => {
    if (evento?.esProductoAleatorio || String(evento?.idEvento).startsWith("showcase-prod-")) {
      const prodToOpen = evento.producto || targetProd || activeProductos.find(p => String(p.id || p.idProducto) === String(evento?.idProducto));
      if (prodToOpen) {
        handleProductClick(prodToOpen);
        return;
      }
    }
    setEventoParaPersonalizar(evento);
    setProductoParaEvento(targetProd || null);
    setShowPersonalizarEventoModal(true);
  };

  const handleProductClick = async (producto, targetTab = "personalizar") => {
    const prodStock = Number(producto?.stock !== undefined ? producto.stock : (producto?.stockActual !== undefined ? producto.stockActual : 0));
    const isAgotado = Boolean(producto?.agotado || prodStock <= 0 || producto?.estado === "Inactivo" || producto?.estado === 0);

    if (isAgotado && targetTab !== "resenas") {
      warning(
        "Producto agotado por el momento",
        `Lo sentimos, "${producto.nombre}" se encuentra agotado en este momento y no está disponible para pedir.`
      );
      return;
    }

    // Si el producto tiene un evento activo, abrir personalización individual de eventos
    const activeEvt = getActiveEvent(producto);
    if (activeEvt) {
      setEventoParaPersonalizar(activeEvt);
      setProductoParaEvento(producto);
      setShowPersonalizarEventoModal(true);
      return;
    }

    const prodId = producto.id || producto.idProducto;
    let ficha = fichasMap[prodId] || fichasTecnicasDefault[prodId];
    if (!ficha) {
      try {
        const fetchedFicha = await fichasTecnicasService.getFichaByProducto(prodId);
        if (fetchedFicha) {
          ficha = fetchedFicha;
          setFichasMap(prev => ({ ...prev, [prodId]: fetchedFicha }));
        }
      } catch (e) {
        console.warn("Ficha no encontrada para producto", prodId);
      }
    }

    setProductoSeleccionado({
      producto,
      cantidad: 1,
      adicionesSeleccionadas: [],
      bebidasSeleccionadas: [],
      ingredientesRemovidos: [],
      ficha: ficha || fichasTecnicasDefault[prodId] || null
    });
    setShowProductModal(true);
  };

  const handleToggleRemoverIngrediente = (nombreIngrediente) => {
    if (!productoSeleccionado) return;
    if (isEssentialIngredient(nombreIngrediente, productoSeleccionado.producto)) return;
    const currentRemovidos = productoSeleccionado.ingredientesRemovidos || [];
    const isRemoved = currentRemovidos.includes(nombreIngrediente);
    const updated = isRemoved
      ? currentRemovidos.filter(n => n !== nombreIngrediente)
      : [...currentRemovidos, nombreIngrediente];

    setProductoSeleccionado({
      ...productoSeleccionado,
      ingredientesRemovidos: updated
    });
  };

  const handleBebidaToggle = (bebida) => {
    if (!productoSeleccionado) return;
    const bebId = bebida.id || bebida.idProducto;
    const currentBebidas = productoSeleccionado.bebidasSeleccionadas || [];
    const exists = currentBebidas.find(b => (b.id || b.idProducto) === bebId);

    if (exists) {
      setProductoSeleccionado({
        ...productoSeleccionado,
        bebidasSeleccionadas: currentBebidas.filter(b => (b.id || b.idProducto) !== bebId)
      });
    } else {
      setProductoSeleccionado({
        ...productoSeleccionado,
        bebidasSeleccionadas: [
          ...currentBebidas,
          {
            id: bebId,
            idProducto: bebId,
            nombre: bebida.nombre,
            precio: Number(bebida.precio || 0),
            cantidad: 1,
            imagen: bebida.imagen || "drink",
            stock: Number(bebida.stock !== undefined ? bebida.stock : (bebida.stockActual !== undefined ? bebida.stockActual : 0))
          }
        ]
      });
    }
  };

  const handleBebidaQuantityChange = (bebId, delta, e) => {
    if (e) e.stopPropagation();
    if (!productoSeleccionado) return;
    const currentBebidas = productoSeleccionado.bebidasSeleccionadas || [];
    const existing = currentBebidas.find(b => (b.id || b.idProducto) === bebId);
    if (!existing) return;

    if (existing.cantidad + delta <= 0) {
      setProductoSeleccionado({
        ...productoSeleccionado,
        bebidasSeleccionadas: currentBebidas.filter(b => (b.id || b.idProducto) !== bebId)
      });
    } else {
      const stockTot = Number(existing.stock !== undefined ? existing.stock : 0);
      const inCart = getProductQuantityInCart(bebId);
      const maxAvailable = Math.max(0, stockTot - inCart);
      if (delta > 0 && existing.cantidad >= maxAvailable) {
        error("Stock insuficiente", `Solo hay ${stockTot} unidades disponibles de ${existing.nombre}.`);
        return;
      }

      setProductoSeleccionado({
        ...productoSeleccionado,
        bebidasSeleccionadas: currentBebidas.map(b => {
          if ((b.id || b.idProducto) === bebId) {
            return { ...b, cantidad: b.cantidad + delta };
          }
          return b;
        })
      });
    }
  };

  const handleAdicionToggle = (adicion) => {
    if (!productoSeleccionado) return;
    const exists = productoSeleccionado.adicionesSeleccionadas.find((a) => a.idAdicion === adicion.idAdicion);
    if (exists) {
      setProductoSeleccionado({
        ...productoSeleccionado,
        adicionesSeleccionadas: productoSeleccionado.adicionesSeleccionadas.filter((a) => a.idAdicion !== adicion.idAdicion)
      });
    } else {
      setProductoSeleccionado({
        ...productoSeleccionado,
        adicionesSeleccionadas: [
          ...productoSeleccionado.adicionesSeleccionadas,
          { idAdicion: adicion.idAdicion, nombre: adicion.nombre, precio: adicion.precio, cantidad: 1 }
        ]
      });
    }
  };

  const handleAdicionQuantityChange = (idAdicion, delta, e) => {
    if (e) e.stopPropagation();
    if (!productoSeleccionado) return;
    const existing = productoSeleccionado.adicionesSeleccionadas.find((a) => a.idAdicion === idAdicion);
    if (!existing) return;

    if (existing.cantidad + delta <= 0) {
      setProductoSeleccionado({
        ...productoSeleccionado,
        adicionesSeleccionadas: productoSeleccionado.adicionesSeleccionadas.filter((a) => a.idAdicion !== idAdicion)
      });
    } else {
      setProductoSeleccionado({
        ...productoSeleccionado,
        adicionesSeleccionadas: productoSeleccionado.adicionesSeleccionadas.map((a) => {
          if (a.idAdicion === idAdicion) {
            return { ...a, cantidad: a.cantidad + delta };
          }
          return a;
        })
      });
    }
  };

  const handleAddToCart = () => {
    if (!productoSeleccionado) return;
    const prod = productoSeleccionado.producto;
    let basePrice = Number(prod.precio || 0);
    const evtPrecio = prod.eventos?.find(e => e.tipoEvento === "Promoción Precio");
    const evtDesc = prod.eventos?.find(e => e.tipoEvento === "Descuento");
    if (evtPrecio) {
      basePrice = Number(evtPrecio.nuevoPrecio);
    } else if (evtDesc) {
      basePrice = basePrice * (1 - Number(evtDesc.descuento) / 100);
    }

    const removidos = productoSeleccionado.ingredientesRemovidos || [];
    const personalizacionesList = removidos.map(r => `Sin ${r.toLowerCase()}`);
    const personalizacionesStr = personalizacionesList.join(", ");

    const itemToAdd = {
      id: prod.id || prod.idProducto,
      idProducto: prod.idProducto || prod.id,
      nombre: prod.nombre,
      precio: basePrice,
      cantidad: productoSeleccionado.cantidad || 1,
      stock: Number(prod.stock !== undefined ? prod.stock : (prod.stockActual !== undefined ? prod.stockActual : 0)),
      imagen: prod.imagen,
      ingredientesRemovidos: removidos,
      personalizaciones: personalizacionesList,
      observaciones: personalizacionesStr,
      observacion: personalizacionesStr,
      adiciones: (productoSeleccionado.adicionesSeleccionadas || []).map((a) => ({
        idAdicion: a.idAdicion,
        nombre: a.nombre,
        precio: Number(a.precio) || 0,
        cantidad: Number(a.cantidad) || 1,
        imagen: a.imagen || "sauce"
      }))
    };

    const itemsToBatch = [itemToAdd];
    const bebidasToAdd = productoSeleccionado.bebidasSeleccionadas || [];
    let bebidasCount = 0;
    for (const b of bebidasToAdd) {
      itemsToBatch.push({
        id: b.id || b.idProducto,
        idProducto: b.idProducto || b.id,
        idVariante: b.idVariante || b.id || b.idProducto,
        nombre: b.nombre,
        precio: Number(b.precio),
        cantidad: Number(b.cantidad) || 1,
        stock: Number(b.stock !== undefined ? b.stock : 0),
        imagen: resolveDrinkImage(b),
        adiciones: []
      });
      bebidasCount += (Number(b.cantidad) || 1);
    }

    const res = addToCart(itemsToBatch);
    if (res && res.success === false) {
      error("Stock insuficiente", res.message || "No hay suficiente stock disponible para este producto.");
      return;
    }

    setShowProductModal(false);
    setProductoSeleccionado(null);
    const msg = bebidasCount > 0
      ? `${prod.nombre} y ${bebidasCount} bebida(s) agregadas a tu carrito`
      : `${prod.nombre} se agregó a tu carrito`;
    success("¡Producto agregado!", msg);
  };

  const handleClientModalConfirm = ({
    producto,
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
    // Ítem #16: Evitar doble descuento si el modal ya calculó el precio final
    let basePrice = Number(producto.precioFinal !== undefined ? producto.precioFinal : (producto.precioCalculado !== undefined ? producto.precioCalculado : producto.precio || 0));
    if (producto.precioFinal === undefined && producto.precioCalculado === undefined) {
      const evtPrecio = producto.eventos?.find(e => e.tipoEvento === "Promoción Precio" || e.tipo === "Promoción Precio");
      const evtDesc = producto.eventos?.find(e => e.tipoEvento === "Descuento" || e.tipo === "Descuento");
      if (evtPrecio && Number(evtPrecio.nuevoPrecio) > 0) {
        basePrice = Number(evtPrecio.nuevoPrecio);
      } else if (evtDesc && Number(evtDesc.descuento) > 0) {
        const pOriginal = Number(producto.precioOriginal || producto.precio || 0);
        basePrice = pOriginal * (1 - Number(evtDesc.descuento) / 100);
      }
    }

    const isDrink = isDrinkProduct(producto);
    const resolvedIsBase = Boolean(esVarianteBase ?? producto.esVarianteBase);
    const resolvedVarName = resolvedIsBase ? null : (varianteNombre || producto.varianteNombre || null);
    const finalProdName = producto.nombrePersonalizado || (sabor ? `${producto.nombre} (${sabor})` : (producto.saborSeleccionado ? `${producto.nombre} (${producto.saborSeleccionado})` : producto.nombre));

    const itemToAdd = {
      id: producto.id || producto.idProducto,
      idProducto: producto.idProducto || producto.id,
      idVariante: resolvedIsBase ? (producto.idVarianteBase || producto.idVariante || null) : (producto.idVariante || producto.id || producto.idProducto),
      esVarianteBase: resolvedIsBase,
      varianteNombre: resolvedVarName,
      varianteDescripcion: resolvedIsBase ? null : (varianteDescripcion || producto.varianteDescripcion || null),
      varianteEspecificaciones: resolvedIsBase ? null : (varianteEspecificaciones || producto.varianteEspecificaciones || null),
      varianteCambios: (!resolvedIsBase && Array.isArray(varianteCambios || producto.varianteCambios)) ? (varianteCambios || producto.varianteCambios) : [],
      esVarianteDeEvento: Boolean(!resolvedIsBase && (esVarianteDeEvento || producto.esVarianteDeEvento)),
      sabor: sabor || producto.saborSeleccionado || null,
      nombre: finalProdName,
      precio: basePrice,
      cantidad: Number(cantidad) || 1,
      cantidadCocina: producto.cantidadCocina || (producto.is2x1Promo ? (Number(cantidad) || 1) * 2 : (Number(cantidad) || 1)),
      is2x1Promo: Boolean(producto.is2x1Promo),
      stock: Number(producto.stock !== undefined ? producto.stock : 0),
      imagen: producto.imagen,
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
    let comboCfg = producto.configuracionCombo;
    if (typeof comboCfg === "string") {
      try { comboCfg = JSON.parse(comboCfg); } catch (e) { comboCfg = null; }
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

        // Solo cobrar en carrito si es producto estándar o bebidas extra por encima del combo
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
          bebidasCount += (isComboProd ? extraQty : qty);
        }
      }
    }

    const res = addToCart(itemsToBatch);
    if (res && res.success === false) {
      error("Stock insuficiente", res.message || "No hay suficiente stock disponible para este producto.");
      return;
    }

    setShowProductModal(false);
    setProductoSeleccionado(null);
    const msg = bebidasCount > 0
      ? `${finalProdName} y ${bebidasCount} bebida(s) agregadas a tu carrito`
      : `${finalProdName} se agregó a tu carrito`;
    success("¡Producto agregado!", msg);
  };

  const handleAbrirCheckout = () => {
    if (cart.length === 0) return;
    if (!isAuthenticated) {
      setShowEmptyCartLoginModal(true);
      return;
    }
    checkoutUserEditedDocRef.current = false;
    let fallbackStored = null;
    try {
      fallbackStored = loadSessionUser();
    } catch (_) {}
    const sourceUser = user || fallbackStored;
    setCheckoutNombre(sourceUser?.nombre ? `${sourceUser.nombre} ${sourceUser.apellidos || ''}`.trim() : "");
    const rawDocUser = sourceUser?.numeroDocumento || sourceUser?.documento || "";
    const cleanDocUser = (rawDocUser && String(rawDocUser).trim().length >= 6) ? String(rawDocUser).trim() : "";
    setCheckoutTipoDoc(sourceUser?.tipoDocumento || "C.C.");
    setCheckoutDocumento(cleanDocUser);
    const rawDir = sourceUser?.direccion || "";
    let cleanDir = rawDir;
    if (typeof rawDir === 'string' && rawDir.trim().startsWith('{')) {
      try { const p = JSON.parse(rawDir); cleanDir = p.direccion || rawDir; } catch (e) { /* keep raw */ }
    }
    setCheckoutDireccion(cleanDir);
    setCheckoutEspecificaciones("");
    setCheckoutEmpaqueParaLlevar(false);
    setCheckoutErrors({});
    setCheckoutTipoEntrega("domicilio");
    window.history.pushState({ modal: "checkout" }, "");
    setShowCheckout(true);
    if (!cleanDocUser && typeof refreshUser === "function") {
      refreshUser().catch(() => {});
    }
  };

  const handleAuthModalSuccess = (authenticatedUser) => {
    setShowEmptyCartLoginModal(false);
    checkoutUserEditedDocRef.current = false;
    let fallbackStored = null;
    try {
      fallbackStored = loadSessionUser();
    } catch (_) {}
    const target = authenticatedUser || user || fallbackStored;
    if (cart.length > 0) {
      const fullName = target?.nombre ? `${target.nombre} ${target.apellidos || ''}`.trim() : "";
      setCheckoutNombre(fullName);
      const rawDocAuth = target?.numeroDocumento || target?.documento || "";
      const cleanDocAuth = (rawDocAuth && String(rawDocAuth).trim().length >= 6) ? String(rawDocAuth).trim() : "";
      setCheckoutTipoDoc(target?.tipoDocumento || "C.C.");
      setCheckoutDocumento(cleanDocAuth);
      const rawDir = target?.direccion || "";
      let cleanDir = rawDir;
      if (typeof rawDir === 'string' && rawDir.trim().startsWith('{')) {
        try { const p = JSON.parse(rawDir); cleanDir = p.direccion || rawDir; } catch (e) { /* keep raw */ }
      }
      setCheckoutDireccion(cleanDir);
      setCheckoutEspecificaciones("");
      setCheckoutEmpaqueParaLlevar(false);
      setCheckoutErrors({});
      setCheckoutTipoEntrega("domicilio");
      window.history.pushState({ modal: "checkout" }, "");
      setShowCheckout(true);
      if (!cleanDocAuth && typeof refreshUser === "function") {
        refreshUser().catch(() => {});
      }
    }
  };

  const clientSubtotal = getSubtotal();
  const fidelidadCliente = user?.fidelidad || {};
  const pedidosCount = pedidos.filter((p) => {
    const st = String(p.estado || "").toUpperCase();
    const ap = String(p.estadoAprobacion || "").toUpperCase();
    const pago = String(p.estadoPago || "").toUpperCase();
    if (st.includes("ANULAD") || st.includes("CANCEL") || st.includes("RECHAZ")) return false;
    if (ap === "PENDIENTE" || ap === "RECHAZADO") return false;
    if (st.includes("POR APROBAR") || pago === "PENDIENTE") return false;
    return true;
  }).length;
  const tipoFidelidad =
    fidelidadCliente.tipo ||
    (pedidosCount >= 9
      ? "VIP"
      : pedidosCount >= 6
      ? "Frecuente"
      : pedidosCount >= 3
      ? "Regular"
      : user?.tipo || "Nuevo");
  const defaultTierDiscount =
    tipoFidelidad === "VIP" ? 15 : tipoFidelidad === "Frecuente" ? 10 : tipoFidelidad === "Regular" ? 5 : 0;
  const discountPercent =
    fidelidadCliente.descuentoPorcentaje !== undefined
      ? Math.min(15, Math.max(0, Number(fidelidadCliente.descuentoPorcentaje || 0)))
      : defaultTierDiscount;
  const comprasCiclo =
    fidelidadCliente.comprasCiclo !== undefined
      ? Number(fidelidadCliente.comprasCiclo)
      : (pedidosCount % 3);
  const comprasFaltantes =
    fidelidadCliente.comprasFaltantes !== undefined
      ? Number(fidelidadCliente.comprasFaltantes)
      : (3 - (comprasCiclo % 3));
  const siguienteNivel = getNextLevelProgressInfo(tipoFidelidad).targetLabel;

  // Dynamic real-time calculation of remaining days and seconds in hero banner
  const rawHeroVence = fidelidadCliente.fechaVencimientoNivel || fidelidadCliente.vence;
  const heroVenceObj = rawHeroVence ? parseDateOnlySafe(rawHeroVence) : null;

  const heroLiveStatus = useMemo(() => {
    if (tipoFidelidad === "Nuevo") {
      return {
        esNuevo: true,
        enGracia: false,
        expirado: false,
        countdownStr: null,
        diasRestantes: null,
      };
    }

    if (!heroVenceObj || isNaN(heroVenceObj.getTime())) {
      return {
        esNuevo: false,
        enGracia: false,
        expirado: false,
        countdownStr: "30 días restantes",
        diasRestantes: 30,
      };
    }

    const diffMs = heroVenceObj.getTime() - liveTick;

    if (diffMs > 0) {
      const totalSec = Math.floor(diffMs / 1000);
      const d = Math.floor(totalSec / 86400);
      const h = Math.floor((totalSec % 86400) / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const str = `${d > 0 ? `${d}d ` : ""}${h}h ${m}m ${String(s).padStart(2, "0")}s restantes`;
      return {
        esNuevo: false,
        enGracia: false,
        expirado: false,
        countdownStr: str,
        diasRestantes: Math.max(1, Math.ceil(diffMs / 86400000)),
      };
    }

    // Vencido -> Evaluar Periodo de Gracia
    const msExpirado = Math.abs(diffMs);
    const limiteGraciaDias = tipoFidelidad === "VIP" ? 15 : tipoFidelidad === "Frecuente" ? 10 : 0;
    const limiteGraciaMs = limiteGraciaDias * 86400000;

    if (limiteGraciaDias > 0 && msExpirado < limiteGraciaMs) {
      const msRestanteGracia = limiteGraciaMs - msExpirado;
      const totalSecG = Math.floor(msRestanteGracia / 1000);
      const dG = Math.floor(totalSecG / 86400);
      const hG = Math.floor((totalSecG % 86400) / 3600);
      const mG = Math.floor((totalSecG % 3600) / 60);
      const sG = totalSecG % 60;
      return {
        esNuevo: false,
        enGracia: true,
        expirado: false,
        countdownStr: `Periodo de Gracia: ${dG > 0 ? `${dG}d ` : ""}${hG}h ${mG}m ${String(sG).padStart(2, "0")}s`,
        diasGracia: Math.max(1, Math.ceil(msRestanteGracia / 86400000)),
      };
    }

    return {
      esNuevo: false,
      enGracia: false,
      expirado: true,
      countdownStr: "Membresía por renovar",
      diasRestantes: 0,
    };
  }, [tipoFidelidad, heroVenceObj, liveTick]);

  const clientDiscountMonto = discountPercent > 0 ? Math.round(clientSubtotal * (discountPercent / 100)) : 0;
  const totalCheckout = Math.max(0, clientSubtotal - clientDiscountMonto);
  const handleConfirmarPedido = async () => {
    if (user && (user.estado === 'INACTIVO' || user.estado === 0 || user.estado === '0' || user.clienteEstado === 'Inactivo' || user.estadoCuenta === 'INACTIVO')) {
      error(
        "Cuenta Inactiva",
        "Tu cuenta se encuentra inactiva y no tienes permitido realizar pedidos. Por favor comunícate con la administración de Chazin Food para reactivarla."
      );
      return;
    }
    // Ítem #20: Validación estricta de nombres para personas
    const valNom = validateNombre(checkoutNombre, "nombre del destinatario");
    if (!valNom.isValid) {
      setCheckoutErrors((prev) => ({ ...prev, nombre: valNom.error }));
      error("Nombre inválido", valNom.error);
      return;
    }
    // Validación obligatoria de Cédula/Documento para facturación electrónica y compras
    const valDoc = validateDocumento(checkoutDocumento, checkoutTipoDoc);
    if (!valDoc.isValid) {
      setCheckoutErrors((prev) => ({ ...prev, documento: valDoc.error }));
      const msg = !checkoutDocumento?.trim()
        ? "Tu cuenta aún no tiene un número de documento registrado. Por favor ingresa tu cédula (6 a 10 dígitos) para emitir tu factura y procesar tu pedido."
        : `El número de documento no es válido: ${valDoc.error}`;
      error("Cédula o documento requerido", msg);
      setTimeout(() => {
        const docInput = document.getElementById("checkout-documento-input");
        if (docInput) {
          docInput.focus();
          docInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }
    // Verificación en vivo de documento duplicado perteneciente a otro usuario registrado
    const cleanSubmittedDoc = sanitizeDocumento(checkoutDocumento, checkoutTipoDoc);
    if (checkoutDocCheck.status === "conflict") {
      const conflictMsg =
        checkoutDocCheck.message ||
        `El número de documento "${cleanSubmittedDoc}" ya pertenece a otro usuario registrado.`;
      setCheckoutErrors((prev) => ({ ...prev, documento: conflictMsg }));
      error("Documento ya registrado", conflictMsg);
      const docInput = document.getElementById("checkout-documento-input");
      if (docInput) {
        docInput.focus();
        docInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!ownUserDocClean || cleanSubmittedDoc !== ownUserDocClean) {
      try {
        const liveCheck = await apiClient.get("/usuarios/verificar-documento", {
          params: { numeroDocumento: cleanSubmittedDoc },
          noCache: true
        });
        if (liveCheck?.conflict) {
          const conflictMsg =
            liveCheck.message ||
            `El número de documento "${cleanSubmittedDoc}" ya pertenece a otro usuario registrado.`;
          setCheckoutDocCheck({ status: "conflict", message: conflictMsg });
          setCheckoutErrors((prev) => ({ ...prev, documento: conflictMsg }));
          error("Documento ya registrado", conflictMsg);
          const docInput = document.getElementById("checkout-documento-input");
          if (docInput) {
            docInput.focus();
            docInput.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
      } catch (_) {
        // Si falla la consulta preventiva, el backend validará en /wompi/crear-intencion
      }
    }

    const valTel = validateTelefono(checkoutTelefono);
    const cleanSubmittedTel = sanitizeTelefono(checkoutTelefono);
    if (!valTel.isValid) {
      setCheckoutErrors((prev) => ({ ...prev, telefono: valTel.error }));
      error("Teléfono requerido", valTel.error);
      setTimeout(() => {
        const telInput = document.getElementById("checkout-telefono-input");
        if (telInput) {
          telInput.focus();
          telInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    const syncDir = validateDireccionMedellin(checkoutDireccion, { required: true });
    if (!syncDir.isValid) {
      setCheckoutErrors((prev) => ({ ...prev, direccion: syncDir.error }));
      error("Dirección inválida", syncDir.error);
      return;
    }

    const rtDir = await verifyDireccionMedellinRealtime(checkoutDireccion);
    if (!rtDir.isValid) {
      setCheckoutErrors((prev) => ({ ...prev, direccion: rtDir.error }));
      error("Dirección no verificada", rtDir.error);
      return;
    }

    if (!checkoutAceptaTerminos) {
      const legalMsg = "Debes aceptar los Términos y Condiciones y la Política de Tratamiento de Datos (Ley 1581 de 2012) para continuar con el pago.";
      setCheckoutErrors((prev) => ({ ...prev, terminos: legalMsg }));
      error("Aceptación legal requerida", legalMsg);
      setTimeout(() => {
        const legalEl = document.getElementById("checkout-aceptacion-legal");
        if (legalEl) {
          legalEl.scrollIntoView({ behavior: "smooth", block: "center" });
          legalEl.focus();
        }
      }, 100);
      return;
    }

    if (user && typeof updateProfile === "function") {
      const profileUpdates = {};
      if (!ownUserDocClean && cleanSubmittedDoc) {
        profileUpdates.tipoDocumento = checkoutTipoDoc;
        profileUpdates.numeroDocumento = cleanSubmittedDoc;
      }
      if (!sanitizeTelefono(user?.telefono || "") && cleanSubmittedTel) {
        profileUpdates.telefono = cleanSubmittedTel;
      }
      if (Object.keys(profileUpdates).length > 0) {
        updateProfile(profileUpdates).catch(err => console.warn("Sincronización en segundo plano de datos del cliente falló:", err));
      }
    }

    const tiempoEstimadoCalculado = "35-45 min";
    const combinedSpecs = [
      checkoutEmpaqueParaLlevar ? "EMPAQUE ESPECIAL PARA LLEVAR SOLICITADO" : "",
      checkoutEspecificaciones.trim()
    ].filter(Boolean).join(" | ");

    if (cart.length === 0 || !(totalCheckout > 0)) {
      setShowCheckout(false);
      return;
    }

    // ── FLUJO EXCLUSIVO WOMPI EN WEB (PAGOS EN LÍNEA: PSE, NEQUI, TARJETAS, BANCOLOMBIA) ──
    setIsProcessingWompi(true);
    let intencion = null;
    let redirectedToCheckoutWeb = false;
    let hasTransactionId = false;
    try {
      const ventaPayload = {
        idCliente: user?.idCliente || null,
        idUsuario: user?.idUsuario || user?.id || user?._id,
        subtotal: clientSubtotal,
        descuentoAplicado: clientDiscountMonto,
        total: totalCheckout,
        tipoVenta: "DOMICILIO",
        tipoEntrega: "Domicilio",
        metodoPago: "Wompi",
        origen: "ONLINE",
        origenNombre: "Venta Online (Web)",
        tiempoEstimadoEntrega: tiempoEstimadoCalculado,
        direccion: checkoutDireccion,
        telefono: cleanSubmittedTel,
        clienteTelefono: cleanSubmittedTel,
        clienteDocumento: checkoutDocumento,
        documento: checkoutDocumento,
        tipoDocumento: checkoutTipoDoc,
        estadoEntrega: "PENDIENTE",
        observaciones: JSON.stringify({
          tipoEntrega: "Domicilio",
          metodoPago: "Wompi",
          origen: "ONLINE",
          domicilioPagadoAparte: true,
          tiempoEstimadoEntrega: tiempoEstimadoCalculado,
          horaEstado: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true }),
          direccion: checkoutDireccion,
          telefono: cleanSubmittedTel,
          clienteTelefono: cleanSubmittedTel,
          clienteDocumento: checkoutDocumento,
          tipoDocumento: checkoutTipoDoc,
          especificaciones: combinedSpecs || "",
          clienteNombre: checkoutNombre || (user?.nombre ? `${user.nombre} ${user.apellidos || ''}` : "Cliente"),
          productos: cart.map(item => {
            const itemAdds = (item.adiciones || []).reduce((s, a) => s + ((Number(a.precio) || 0) * Number(a.cantidad || 1)), 0);
            const lineTotal = ((Number(item.precio) || 0) + itemAdds) * (item.cantidad || 1);
            return {
              id: item.id,
              idProducto: item.idProducto || item.id,
              idVariante: item.esVarianteBase ? null : (item.idVariante || item.id),
              esVarianteBase: Boolean(item.esVarianteBase),
              varianteNombre: item.esVarianteBase ? null : (item.varianteNombre || null),
              varianteDescripcion: item.esVarianteBase ? null : (item.varianteDescripcion || null),
              varianteEspecificaciones: item.esVarianteBase ? null : (item.varianteEspecificaciones || null),
              varianteCambios: (!item.esVarianteBase && Array.isArray(item.varianteCambios)) ? item.varianteCambios : [],
              esVarianteDeEvento: Boolean(!item.esVarianteBase && item.esVarianteDeEvento),
              nombre: item.nombre,
              cantidad: item.cantidad,
              cantidadCocina: item.cantidadCocina || undefined,
              is2x1Promo: Boolean(item.is2x1Promo),
              precioUnitario: Number(item.precio) || 0,
              total: lineTotal,
              observaciones: item.observacion || item.observaciones || item.especificaciones || "",
              ingredientesRemovidos: Array.isArray(item.ingredientesRemovidos) ? item.ingredientesRemovidos : [],
              personalizaciones: item.personalizaciones || {},
              adiciones: (item.adiciones || []).map(a => ({
                idAdicion: a.idAdicion || a.id,
                nombre: a.nombre,
                precio: Number(a.precio) || 0,
                cantidad: Number(a.cantidad || 1)
              }))
            };
          })
        }),
        detalles: cart.map(item => {
          const itemAdds = (item.adiciones || []).reduce((s, a) => s + ((Number(a.precio) || 0) * Number(a.cantidad || 1)), 0);
          const lineTotal = ((Number(item.precio) || 0) + itemAdds) * (item.cantidad || 1);
          const customNote = (item.observacion || item.observaciones || "").trim();
          return {
            idProducto: item.idProducto || item.id,
            idVariante: item.esVarianteBase ? null : (item.idVariante || item.id || 1),
            esVarianteBase: Boolean(item.esVarianteBase),
            varianteNombre: item.esVarianteBase ? null : (item.varianteNombre || null),
            varianteDescripcion: item.esVarianteBase ? null : (item.varianteDescripcion || null),
            varianteEspecificaciones: item.esVarianteBase ? null : (item.varianteEspecificaciones || null),
            varianteCambios: (!item.esVarianteBase && Array.isArray(item.varianteCambios)) ? item.varianteCambios : [],
            esVarianteDeEvento: Boolean(!item.esVarianteBase && item.esVarianteDeEvento),
            nombre: item.nombre,
            cantidad: item.cantidad,
            precioUnitario: Number(item.precio) || 0,
            subtotal: lineTotal,
            idAdiciones: (item.adiciones || []).map(a => a.idAdicion || a.id),
            adiciones: item.adiciones || [],
            ingredientesRemovidos: Array.isArray(item.ingredientesRemovidos) ? item.ingredientesRemovidos : [],
            personalizaciones: item.personalizaciones || {},
            observacion: customNote,
            observaciones: customNote || (item.nombre + (item.adiciones && item.adiciones.length > 0 ? ` (+${item.adiciones.map(a => a.nombre).join(', ')})` : ''))
          };
        })
      };

      // 1. Crear intención y obtener firma SHA-256 en el backend
      intencion = await wompiService.crearIntencion(ventaPayload);

      // Ocultar modal propio para que el modal oficial de Wompi sea 100% visible sin conflicto de z-index
      setShowCheckout(false);

      // 2. Abrir el Widget oficial de Wompi (con fallback a Checkout Web si el widget es bloqueado)
      let transaction = null;
      try {
        transaction = await wompiService.abrirWidget({
          referencia: intencion.referencia,
          montoEnCentavos: intencion.montoEnCentavos,
          moneda: intencion.moneda,
          firma: intencion.firma,
          publicKey: intencion.publicKey,
          customerData: {
            email: user?.email || "",
            nombre: checkoutNombre || `${user?.nombre || ''} ${user?.apellidos || ''}`.trim() || "Cliente",
            telefono: cleanSubmittedTel || user?.telefono || "",
            documento: checkoutDocumento || ""
          }
        });
      } catch (widgetErr) {
        console.warn("Widget embebido no disponible o bloqueado por navegador, activando Checkout Web:", widgetErr);
        const directUrl = wompiService.generarUrlDirecta({
          referencia: intencion.referencia,
          montoEnCentavos: intencion.montoEnCentavos,
          moneda: intencion.moneda,
          firma: intencion.firma,
          publicKey: intencion.publicKey,
          redirectUrl: `${window.location.origin}/perfil?tab=pedidos`
        });

        let win = null;
        try {
          win = window.open(directUrl, "_blank", "noopener,noreferrer");
        } catch (e) {
          win = null;
        }

        if (win && !win.closed) {
          redirectedToCheckoutWeb = true;
          success("Pasarela Wompi Abierta", "Se abrió la pasarela oficial de Wompi en una nueva pestaña para completar tu pago de forma segura.");
          clearCart();
          setShowCart(false);
          setShowCheckout(false);
          return;
        }

        // Fallback garantizado: si el navegador bloqueó ventanas emergentes (Adblock / Chrome Popup Blocker)
        // Redirigir de forma directa y transparente en la pestaña actual
        redirectedToCheckoutWeb = true;
        clearCart();
        setShowCart(false);
        setShowCheckout(false);
        window.location.href = directUrl;
        return;
      }

      // 3. Evaluar resultado retornado por Wompi
      if (transaction && transaction.id) {
        hasTransactionId = true;
        const verificacion = await wompiService.verificarTransaccion(transaction.id);

        if (verificacion.aprobado) {
          const orderId = verificacion.ventaId || intencion.ventaId || Date.now();
          const orderCode = verificacion.numeroVenta || intencion.numeroVenta || `VEN-${String(orderId).padStart(4, '0')}`;

          try {
            const userId = user?.idUsuario || user?.id || user?._id;
            const metaOrderKey = String(userId || 'guest');
            const prevHistory = getClientMeta("orders", metaOrderKey, []);
            const localHistory = Array.isArray(prevHistory) ? [...prevHistory] : [];
            localHistory.unshift({
              id: orderId,
              numeroVenta: orderCode,
              fecha: new Date().toLocaleString('es-CO'),
              items: cart.map(it => ({
                nombre: it.nombre + (it.adiciones && it.adiciones.length > 0 ? ` (+${it.adiciones.map(a => a.nombre).join(', ')})` : ''),
                cantidad: it.cantidad,
                precio: it.precio
              })),
              total: totalCheckout,
              estado: 'En Preparación'
            });
            setClientMeta("orders", metaOrderKey, localHistory.slice(0, 50));
          } catch (storageErr) {
            console.warn("No se pudo guardar pedido en historial local:", storageErr);
          }

          success("¡Pago Aprobado con Wompi!", `Tu pedido ${orderCode} fue aprobado y enviado a cocina. Puedes ver su estado en Mi Perfil.`);
          clearCart();
          setShowCart(false);
          if (refreshUser) await refreshUser();
          navigate("/perfil?tab=pedidos", { state: { tab: "pedidos" } });
        } else if (verificacion.estado === 'PENDING') {
          success("Pago en Proceso", "Tu pago está siendo verificado por tu banco. Puedes seguir su estado en Mi Perfil.");
          clearCart();
          setShowCart(false);
          if (refreshUser) await refreshUser();
          navigate("/perfil?tab=pedidos", { state: { tab: "pedidos" } });
        } else {
          if (intencion?.ventaId) {
            ventasService.cancelarVenta(intencion.ventaId).catch(() => {});
          }
          if (refreshUser) refreshUser().catch(() => {});
          setShowCheckout(cartLengthRef.current > 0);
          error("Pago Rechazado", `La transacción fue ${verificacion.estado || 'rechazada'}. Puedes intentar con otro medio de pago.`);
        }
      } else if (transaction && transaction.status === 'REDIRECTED') {
        return;
      } else if (!transaction || transaction.status === 'CLOSED_WITHOUT_RESULT') {
        // Cancelar de inmediato la intención Wompi no pagada para liberar stock y evitar órdenes fantasma
        if (intencion?.ventaId) {
          await ventasService.cancelarVenta(intencion.ventaId).catch(() => {});
        }
        if (refreshUser) await refreshUser().catch(() => {});
        fetchMyOrders().catch(() => {});
        setShowCheckout(cartLengthRef.current > 0);
        error("Pago cancelado", "Cerraste la pasarela antes de completar el pago.");
      }
    } catch (wompiErr) {
      if (intencion?.ventaId && !redirectedToCheckoutWeb && !hasTransactionId) {
        await ventasService.cancelarVenta(intencion.ventaId).catch(() => {});
        if (refreshUser) await refreshUser().catch(() => {});
      }
      setShowCheckout(cartLengthRef.current > 0);
      console.error("Error en flujo de Wompi:", wompiErr);
      const detail = wompiErr?.message || "No se pudo conectar con Wompi o el servidor";
      error("Error en Wompi", detail);
    } finally {
      setIsProcessingWompi(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (confirmed) {
      logout();
      clearCart();
      setShowCart(false);
      setShowProductModal(false);
      success("Sesión cerrada", "Has salido del sistema correctamente");
      navigate("/");
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "En Preparación":
      case "PREPARANDO":
      case "En preparación":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800";
      case "Listo":
      case "LISTO":
      case "Completada":
      case "ENTREGADO":
      case "Entregado":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "Anulada":
      case "CANCELADO":
      case "Rechazado":
      case "RECHAZADO":
        return "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800";
      case "Por Aprobar":
      case "PENDIENTE":
      case "Pendiente":
      default:
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 dark:border-b dark:border-gray-800 shadow-md sticky top-0 z-40">
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 py-3 sm:py-4">
            <div
              className="flex items-center gap-2.5 sm:gap-4 min-w-0 cursor-pointer select-none group"
              onClick={() => {
                if (isStaffUser) {
                  navigate("/menu");
                } else {
                  navigate("/");
                }
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              title="Ir al menú - Chazin Food"
            >
              <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white shadow-sm border border-gray-100 group-hover:scale-105 transition-transform">
                <img
                  src={logoImg}
                  alt="Chazin Food"
                  width="48"
                  height="48"
                  fetchpriority="high"
                  loading="eager"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "50% 56%", aspectRatio: "1 / 1" }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h1 className="text-base sm:text-2xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-[#f05454] transition-colors truncate">Chazin Food</h1>
                  {isAuthenticated && !isStaffUser && (
                    <div className="hidden xs:inline-flex sm:inline-flex">
                      <FidelidadBadge
                        tipo={tipoFidelidad}
                        descuento={discountPercent}
                        enGracia={fidelidadCliente.enGracia}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
                <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {isAuthenticated ? `¡Bienvenido, ${user?.nombre}!` : "Bienvenido a Chazin Food"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <button
                onClick={toggleDarkMode}
                aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
                className="p-2 sm:p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                title="Cambiar Modo"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAuthenticated && isStaffUser && (
                <button
                  onClick={() => navigate("/")}
                  aria-label="Ir al panel administrativo"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors text-xs sm:text-sm font-semibold cursor-pointer"
                  title="Volver al Panel"
                >
                  <Store className="w-4 h-4 text-[#f05454]" />
                  <span className="hidden sm:inline">Panel</span>
                </button>
              )}

              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/perfil")}
                  aria-label="Ir a mi perfil"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-xs sm:text-sm font-medium cursor-pointer relative"
                  title={!isStaffUser && isGoogleUser && googlePendingFields.length > 0 ? "Datos pendientes en tu perfil" : "Mi Perfil"}
                >
                  <User className="w-5 h-5 text-[#f05454]" />
                  <span className="hidden sm:inline">Mi Perfil</span>
                  {!isStaffUser && isGoogleUser && googlePendingFields.length > 0 && (
                    <>
                      <span className="sm:hidden absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                      <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                        Datos pendientes
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  aria-label="Iniciar sesión"
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span className="sm:hidden">Ingresar</span>
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </button>
              )}

              <button
                onClick={() => setShowCart(true)}
                aria-label="Abrir carrito de compras"
                className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl transition-colors shadow-md font-bold text-xs sm:text-sm cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-red-600 font-extrabold text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shadow-md">
                    {getTotalItems()}
                  </span>
                )}
                <span className="hidden sm:inline">Carrito</span>
              </button>

              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  className="p-2 sm:p-2.5 text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Banner de aviso amigable para completar datos de Google Auth (Sin toasts) */}
      {isAuthenticated && !isStaffUser && isGoogleUser && googlePendingFields.length > 0 && !dismissedGoogleBanner && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-[#f05454] text-white shadow-md relative z-30 transition-all">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <span className="p-1.5 rounded-lg bg-white/20 shrink-0">
                <Globe className="w-4 h-4 text-white" />
              </span>
              <p className="font-medium leading-tight">
                <span className="font-bold">¡Bienvenido con Google, {user?.nombre}!</span>
                {" "}Para habilitar tus pedidos y entregas, completa tu{" "}
                <span className="underline font-bold bg-white/10 px-1.5 py-0.5 rounded">
                  {googlePendingFields.join(", ")}
                </span>
                {" "}en tu perfil.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate("/perfil?tab=editar")}
                className="px-3.5 py-1.5 bg-white text-gray-900 font-bold rounded-xl text-xs hover:bg-amber-50 transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>Completar datos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setDismissedGoogleBanner(true);
                  sessionStorage.setItem("chazin_google_banner_dismissed", "true");
                }}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Punto de referencia semántico principal para Accesibilidad */}
      <main id="main-content">
        {/* Carrusel con Eventos Activos en Vista de Cliente (Hero Superior de Promociones con altura fija para 0 CLS) */}
        {hasActiveEvents ? (
          <div className="w-full">
            <EventosCarousel
              eventos={eventosList}
              productos={activeProductos}
              ratingsMap={ratingsMap}
              onSelectEvento={handleSelectEventoFromCarousel}
              onThemeChange={setCurrentCarouselTheme}
            />
          </div>
        ) : (
          <BrandHeroBanner
            onExplorarMenu={() => {
              const el = document.getElementById("menu-categorias") || document.getElementById("search-menu-input");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            onSelectCategoria={(catId) => setSelectedCategoria(catId)}
            categorias={activeCategorias}
          />
        )}

        {/* Hero Section con integración cromática dinámica (Solo cuando hay eventos activos en el carrusel) */}
        {hasActiveEvents && (
          <div className="relative overflow-hidden text-white py-10 md:py-14 shadow-inner">
            {/* Capas temáticas integradas con los colores del carrusel de eventos */}
            {Object.entries(THEMES).map(([tKey, tVal]) => {
              const isThemeActive = (currentCarouselTheme?.themeKey || "fire") === tKey;
              return (
                <div
                  key={tKey}
                  className={`absolute inset-0 bg-gradient-to-r ${tVal.heroGradient} transition-opacity duration-700 ease-in-out ${
                    isThemeActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              );
            })}

            {/* Halo de luz superior difusa ambiental conectado con el carrusel */}
            <div
              className="absolute -top-10 inset-x-0 h-20 blur-xl pointer-events-none transition-opacity duration-700"
              style={{
                backgroundColor: currentCarouselTheme?.theme?.glow || "rgba(239, 68, 68, 0.4)",
                opacity: 0.35
              }}
            />

            {/* Contenido del Hero */}
            <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 text-center space-y-2">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-xs">¡El sabor auténtico de Chazin Food!</h2>
              <p
                className={`text-sm sm:text-lg font-medium transition-colors duration-500 ${
                  currentCarouselTheme?.theme?.heroSubtext || "text-red-100"
                }`}
              >
                Haz tu pedido online y recíbelo fresco en tu puerta
              </p>
            </div>
          </div>
        )}

      {/* Search Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-3 border border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="search-menu-input"
              type="text"
              aria-label="Buscar producto por nombre"
              placeholder="Buscar por nombre de producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-0 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-gray-800 transition-all text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* Banner de Fidelidad del Cliente */}
      {isAuthenticated && !isStaffUser && (
        <div className="w-full px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-red-950/20 border border-amber-200 dark:border-amber-900/40 rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 sm:gap-4 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 w-full lg:w-auto">
              <div className="w-full sm:w-auto sm:shrink-0">
                <FidelidadBadge tipo={tipoFidelidad} size="lg" />
              </div>
              <div className="min-w-0 w-full sm:flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-900 dark:text-orange-300">
                    Membresía {tipoFidelidad}
                  </span>
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 bg-[#f05454] text-white text-[10px] font-black rounded-lg">
                      {discountPercent}% OFF activo
                    </span>
                  )}
                  {heroLiveStatus.enGracia && (
                    <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3" />
                      <span>{heroLiveStatus.countdownStr}</span>
                    </span>
                  )}
                  {heroLiveStatus.esNuevo && (
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-lg">
                      Membresía Permanente
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>
                    Racha: <strong>{comprasCiclo} de 3</strong>
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-[#f05454] font-bold flex items-center gap-1">
                    {comprasFaltantes === 0 
                      ? <><span>¡Meta alcanzada!</span> <Sparkles className="w-3.5 h-3.5 text-amber-500 inline" /></> 
                      : tipoFidelidad === "VIP"
                        ? `${comprasFaltantes === 1 ? 'Falta 1 compra' : `Faltan ${comprasFaltantes} compras`} para renovar`
                        : `${comprasFaltantes === 1 ? 'Falta 1 compra' : `Faltan ${comprasFaltantes} compras`} para subir a ${siguienteNivel}`}
                  </span>
                  {!heroLiveStatus.esNuevo && heroLiveStatus.countdownStr && !heroLiveStatus.enGracia && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1 font-mono font-bold bg-white/70 dark:bg-gray-800/70 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                        <Clock className="w-3 h-3 text-[#f05454]" />
                        <span>Vigencia: {heroLiveStatus.countdownStr}</span>
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/perfil")}
              className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ver Beneficios y Racha</span>
            </button>
          </div>
        </div>
      )}

      {/* Categorías Carousel */}
      <div id="menu-categorias" className="w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Categorías</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Explora nuestro menú</p>
        </div>

        {/* Carousel Wrapper with Left & Right Buttons (desktop/tablet) */}
        <div className="relative flex items-center gap-2 sm:gap-3 w-full">
          {/* Left Button */}
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            aria-label="Anterior categoría"
            className="hidden sm:flex shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all active:scale-95 items-center justify-center cursor-pointer z-10"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Horizontal Carousel Container */}
          <div
            ref={categoryCarouselRef}
            className="flex-1 flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar touch-scroll-x py-2 px-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategoria(null)}
              aria-label="Todos: mostrar todas las categorías y productos"
              style={{ scrollSnapAlign: "start" }}
              className={`shrink-0 w-28 sm:w-32 p-3.5 rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer ${
                selectedCategoria === null
                  ? "bg-red-700 text-white shadow-lg shadow-red-700/25 scale-105 font-bold"
                  : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-xs"
              }`}
            >
              <FoodIconBadge
                name="todos"
                category="todos"
                size="lg"
                isSelected={selectedCategoria === null}
              />
              <p className={`text-xs font-semibold truncate w-full ${selectedCategoria === null ? "text-white font-bold" : "text-gray-800 dark:text-gray-200"}`}>Todos</p>
            </button>

            {/* Quick Filter Pill: Edición Especial / Eventos */}
            {eventProductsCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategoria("eventos")}
                aria-label={`${eventProductsCount} DROP - Edición Evento`}
                style={{ scrollSnapAlign: "start" }}
                className={`shrink-0 w-32 sm:w-36 p-3.5 rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer relative overflow-hidden ${
                  selectedCategoria === "eventos"
                    ? "bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/40 scale-105 font-bold"
                    : "bg-white dark:bg-gray-900 dark:text-gray-200 border-2 border-orange-400/70 dark:border-orange-500/60 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 shadow-xs"
                }`}
              >
                <div aria-hidden="true" className="absolute top-1 right-1 bg-gradient-to-r from-orange-600 to-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-xs">
                  {eventProductsCount} DROP
                </div>
                <div className={`flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl shadow-xs transition-all ${
                  selectedCategoria === "eventos"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/40"
                }`}>
                  <Flame size={26} strokeWidth={2} />
                </div>
                <p className={`text-xs font-black truncate w-full ${selectedCategoria === "eventos" ? "text-white" : "text-orange-700 dark:text-orange-300"}`}>
                  Edición Evento
                </p>
              </button>
            )}

            {activeCategorias.map((cat) => {
              const isSelected = selectedCategoria === cat.id || selectedCategoria === cat.idCategoriaProducto;
              return (
                <button
                  key={cat.id || cat.idCategoriaProducto || cat.nombre}
                  type="button"
                  onClick={() => setSelectedCategoria(cat.id || cat.idCategoriaProducto)}
                  aria-label={`Filtrar menú por categoría ${cat.nombre}`}
                  style={{ scrollSnapAlign: "start" }}
                  className={`shrink-0 min-w-[116px] sm:min-w-[138px] px-2.5 sm:px-3 py-3 rounded-2xl transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-red-700 text-white shadow-lg shadow-red-700/25 scale-105 font-bold"
                      : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-xs"
                  }`}
                >
                  {cat.icon && (cat.icon.includes("/") || cat.icon.includes(".")) ? (
                    <div className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden bg-white/30 dark:bg-gray-800/60 shadow-xs border border-gray-100 dark:border-gray-700">
                      <img
                        src={getOptimizedImageUrl(cat.icon, 120)}
                        alt=""
                        aria-hidden="true"
                        width="56"
                        height="56"
                        loading="lazy"
                        decoding="async"
                        style={{ aspectRatio: "1 / 1" }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <FoodIconBadge
                      name={cat.nombre}
                      category={cat.nombre}
                      size="lg"
                      isSelected={isSelected}
                    />
                  )}
                  <p className={`text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 break-words text-center w-full ${isSelected ? "text-white font-bold" : "text-gray-800 dark:text-gray-200"}`} title={cat.nombre}>
                    {cat.nombre}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Button */}
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            aria-label="Siguiente categoría"
            className="hidden sm:flex shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all active:scale-95 items-center justify-center cursor-pointer z-10"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Productos */}
      <div className="w-full px-3 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              {selectedCategoria === "eventos" ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-5 h-5 text-amber-500 inline shrink-0" />
                    Edición Especial & Eventos Gastronómicos
                  </span>
                  <span className="text-xs font-black bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full uppercase tracking-wider border border-red-200 dark:border-red-900/50">
                    Tiempo Limitado
                  </span>
                </>
              ) : selectedCategoria ? (
                activeCategorias.find((c) => (c.id === selectedCategoria || c.idCategoriaProducto === selectedCategoria))?.nombre
              ) : (
                "Menú Principal"
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {selectedCategoria === "eventos"
                ? "Platillos conmemorativos de edición limitada, recetas exclusivas y ahorros directos del festival"
                : "Preparados al instante con los ingredientes más frescos"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosFiltrados.slice(0, maxVisibleProducts).map((producto) => {
            const hasRealImage = producto.imagen && (producto.imagen.includes('/') || producto.imagen.includes('.'));
            const activeEvent = getActiveEvent(producto);
            const hasEvent = Boolean(activeEvent);
            const eventToDisplay = activeEvent;
            const prodStock = Number(producto.stock !== undefined ? producto.stock : 0);
            const isAgotado = Boolean(producto.agotado || prodStock <= 0 || producto.estado === "Inactivo" || producto.estado === 0);

            return (
              <div
                key={producto.id || producto.idProducto}
                onClick={() => {
                  setModalInitialTab("personalizar");
                  handleProductClick(producto, "personalizar");
                }}
                className={`bg-white dark:bg-gray-900 cv-auto rounded-3xl shadow-md hover:shadow-2xl transition-all overflow-hidden flex flex-col justify-between cursor-pointer group hover:-translate-y-2 duration-300 relative ${
                  isAgotado
                    ? "border-2 border-gray-300 dark:border-gray-700 opacity-85"
                    : hasEvent
                    ? "border-2 border-orange-500/90 dark:border-orange-500 shadow-lg shadow-orange-500/15 dark:shadow-orange-950/40 ring-2 ring-orange-400/30"
                    : "border border-gray-200/90 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                {/* ═══ FAST FOOD EVENT BANNER (BURGER FEST / EDICIÓN LIMITADA) ═══ */}
                {hasEvent && eventToDisplay && (
                  <div className="bg-gradient-to-r from-[#D9383A] via-[#E03E3E] to-amber-600 text-white font-black text-[10.5px] uppercase tracking-wider py-1.5 px-3 flex items-center justify-between shadow-md relative z-20 border-b border-orange-500/30">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                      <span className="truncate max-w-[170px] sm:max-w-[210px] text-white tracking-wide">
                        {eventToDisplay.nombreEvento || eventToDisplay.nombre || "Edición Especial"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[9.5px] font-bold text-white shrink-0 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/25">
                      <Clock className="w-3 h-3 text-amber-200" />
                      <span className={eventToDisplay.vigencia?.urgente ? "animate-pulse font-black text-white" : "text-amber-100"}>
                        {eventToDisplay.vigencia?.label ? eventToDisplay.vigencia.label : (eventToDisplay.formattedDate ? `Hasta ${eventToDisplay.formattedDate}` : "Limitado")}
                      </span>
                    </div>
                  </div>
                )}
                {/* ═══ ESCENARIO GOURMET AMBIENTAL DUAL-LAYER (ENCUADRE 100% PERFECTO & SOMBRA 3D) ═══ */}
                <div className="relative h-48 sm:h-52 w-full bg-gray-950 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-gray-800/80">
                  {/* Capa 1: Glow ambiental difuminado con los colores vivos de la comida */}
                  {hasRealImage ? (
                    <>
                      <img
                        src={getOptimizedImageUrl(producto.imagen, 120)}
                        alt=""
                        width="384"
                        height="208"
                        style={{ aspectRatio: "384 / 208" }}
                        className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-35 dark:opacity-40 filter saturate-150 pointer-events-none"
                        loading="lazy"
                        aria-hidden="true"
                      />
                      {/* Vignette oscura sutil para contraste pro */}
                      <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/70 pointer-events-none" />
                      {/* Capa 2: Producto protagonista flotante con iluminación cenital */}
                      <img
                        src={getOptimizedImageUrl(producto.imagen, 500)}
                        alt={producto.nombre}
                        width="384"
                        height="208"
                        style={{ aspectRatio: "384 / 208" }}
                        className="relative z-10 w-full h-full max-h-[92%] max-w-[92%] object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.55)] group-hover:scale-108 group-hover:-rotate-1 transition-all duration-300 ease-out"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80";
                        }}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-28 h-28 rounded-3xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 group-hover:scale-110 transition-all duration-300 drop-shadow-md">
                      <FoodIcon
                        name={producto.nombre}
                        category={producto.categoria?.nombre || producto.categoria}
                        size={56}
                        stroke={1.75}
                        className="text-amber-500 dark:text-amber-400"
                      />
                    </div>
                  )}

                {/* ═══ BADGE STREAMLINE DE ALTO IMPACTO (BURGER FEST / 2X1 / FLASH / DESCUENTO) ═══ */}
                {activeEvent && !isAgotado && (
                  <EventBadge event={activeEvent} product={producto} variant="card" />
                )}

                {/* Badge de Producto Agotado o Últimas Unidades */}
                {isAgotado ? (
                  <div className="absolute inset-0 z-20 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-3">
                    <span className="px-4 py-2 rounded-2xl bg-red-600/95 text-white font-black text-xs uppercase tracking-wider shadow-lg border border-white/25 flex items-center gap-1.5">
                      <Ban className="w-4 h-4 stroke-[2.5]" />
                      <span>Agotado por el momento</span>
                    </span>
                  </div>
                ) : prodStock > 0 && prodStock <= 5 ? (
                  <span className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-full bg-amber-500/95 text-white font-black text-[10px] shadow-md border border-white/20">
                    ¡Solo quedan {prodStock}!
                  </span>
                ) : null}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-[#f05454] transition-colors line-clamp-1">
                      {producto.nombre}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {producto.descripcion || "Platillo gourmet preparado con ingredientes frescos de primera calidad."}
                    </p>

                    {(() => {
                      const variantSummary = getProductVariantSummary(producto);
                      if (!variantSummary.hasVariants) return null;
                      const basePrice = Number(producto.precio || 0);
                      return (
                        <div
                          className="mt-2 flex items-center flex-wrap gap-1"
                          title={`Variantes disponibles: ${variantSummary.names.join(", ")}`}
                        >
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                            <Layers className="w-2.5 h-2.5 shrink-0" />
                            <span>
                              {variantSummary.count} {variantSummary.count === 1 ? "variante" : "variantes"}:
                            </span>
                          </span>
                          {variantSummary.variants.slice(0, 2).map((v, vIdx) => {
                            const vp = Number(v.precio || 0);
                            const customPrice = vp > 0 && vp !== basePrice;
                            return (
                              <span
                                key={v.idVariante || v.id || `${v.nombre}-${vIdx}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50/50 dark:bg-gray-800 text-indigo-800 dark:text-indigo-200 border border-indigo-200/60 dark:border-gray-700 max-w-[130px] truncate"
                              >
                                <span className="truncate">{v.nombre}</span>
                                {customPrice && (
                                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
                                    ${vp.toLocaleString("es-CO")}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                          {variantSummary.count > 2 && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              +{variantSummary.count - 2}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Rating Stars Summary */}
                    <div className="mt-2.5 flex items-center justify-between">
                      {(() => {
                        const pId = producto.id || producto.idProducto;
                        const rInfo = ratingsMap[pId];
                        if (rInfo && rInfo.total > 0) {
                          return (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalInitialTab("resenas");
                                handleProductClick(producto);
                              }}
                              className="flex items-center gap-1.5 hover:opacity-80 transition cursor-pointer group/rate"
                              title="Ver opiniones y calificaciones de comensales"
                            >
                              <StarRating value={rInfo.promedio} readonly size="xs" />
                              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{rInfo.promedio.toFixed(1)}</span>
                              <span className="text-[10.5px] text-gray-600 dark:text-gray-400">({rInfo.total})</span>
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold opacity-0 group-hover/rate:opacity-100 transition-opacity">
                                • Calificar
                              </span>
                            </div>
                          );
                        }
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalInitialTab("resenas");
                              handleProductClick(producto);
                            }}
                            aria-label={`Sin reseñas • Calificar ${producto.nombre}`}
                            className="text-[11px] text-gray-600 dark:text-gray-300 hover:text-amber-500 flex items-center gap-1 transition cursor-pointer font-medium"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span className="text-gray-600 dark:text-gray-300">Sin reseñas • Calificar</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col">
                    {activeEvent ? (
                      <>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <EventBadge event={activeEvent} product={producto} variant="pill" />
                          {parseEventoInsumos(activeEvent).length > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800/60 max-w-full truncate"
                              title={`Incluye gratis: ${formatEventoToppingsText(activeEvent)}`}
                            >
                              + Gratis: {formatEventoToppingsText(activeEvent)}
                            </span>
                          )}
                        </div>
                        {(activeEvent.tipoEvento === "Promoción Precio" || activeEvent.tipoEvento === "Descuento" || activeEvent.nuevoPrecio) ? (
                          <>
                            <span className="text-xs text-gray-500 dark:text-gray-400 line-through">${Number(producto.precio || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                            <span className="text-2xl font-black text-[#f05454] dark:text-red-400 flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              ${(() => {
                                if (activeEvent.nuevoPrecio) return Number(activeEvent.nuevoPrecio).toLocaleString("es-CO", { maximumFractionDigits: 0 });
                                if (activeEvent.descuento) return Math.round(Number(producto.precio || 0) * (1 - Number(activeEvent.descuento)/100)).toLocaleString("es-CO", { maximumFractionDigits: 0 });
                                return Number(producto.precio || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });
                              })()}
                            </span>
                          </>
                        ) : (
                          <p className="text-2xl font-black text-[#f05454] dark:text-red-400">${Number(producto.precio || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-2xl font-black text-red-700 dark:text-red-400">${Number(producto.precio || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(producto, "personalizar");
                    }}
                    aria-label={isAgotado ? `${producto.nombre} agotado por el momento` : `Agregar ${producto.nombre} al pedido`}
                    className={`w-full py-3 text-white rounded-2xl transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.98] ${
                      isAgotado
                        ? "bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 shadow-none"
                        : hasEvent
                        ? "bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 hover:from-orange-700 hover:via-amber-700 hover:to-red-700 shadow-orange-500/30"
                        : "bg-red-700 hover:bg-red-800 shadow-red-700/20"
                    }`}
                  >
                    {isAgotado ? (
                      <>
                        <Ban className="w-4 h-4" />
                        <span>Agotado por el momento</span>
                      </>
                    ) : hasEvent ? (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>Agregar</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Agregar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>

        {maxVisibleProducts < productosFiltrados.length && (
          <div ref={loadMoreRef} className="flex justify-center mt-8">
            <button
              type="button"
              onClick={() => setMaxVisibleProducts(productosFiltrados.length)}
              className="px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-sm transition shadow-sm cursor-pointer"
            >
              Ver más productos ({productosFiltrados.length - maxVisibleProducts} restantes)
            </button>
          </div>
        )}
      </div>

      {/* ═══ MASTER FAST FOOD PRODUCT CUSTOMIZATION MODAL (EL MEJOR MODAL DEL MERCADO) ═══ */}
      {showProductModal && productoSeleccionado && (
        <Suspense fallback={null}>
          <FastFoodProductModal
            isOpen={true}
            onClose={() => {
              setShowProductModal(false);
              setProductoSeleccionado(null);
            }}
            producto={productoSeleccionado?.producto}
            ficha={
              productoSeleccionado?.ficha ||
              (productoSeleccionado?.producto &&
                (fichasMap[productoSeleccionado.producto.id] ||
                  fichasMap[productoSeleccionado.producto.idProducto] ||
                  fichasTecnicasDefault[productoSeleccionado.producto.id]))
            }
            productosList={activeProductos}
            fichasMap={fichasMap}
            allAdiciones={foodAdiciones.length > 0 ? foodAdiciones : activeAdiciones}
            allBebidas={bebidasDisponibles}
            ratingsInfo={
              productoSeleccionado?.producto
                ? ratingsMap[productoSeleccionado.producto.id || productoSeleccionado.producto.idProducto]
                : null
            }
            onOpenResenas={() => {
              if (productoSeleccionado?.producto) {
                setProductoParaResenas(productoSeleccionado.producto);
                setShowResenasModal(true);
              }
            }}
            onReviewChanged={refreshRatingsMap}
            onConfirm={handleClientModalConfirm}
            mode="cliente"
            initialTab={modalInitialTab}
          />
        </Suspense>
      )}

      {/* MODAL CARRITO */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs cursor-pointer"
          onClick={() => setShowCart(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full max-w-md h-[100dvh] p-4 sm:p-6 pb-safe shadow-2xl flex flex-col justify-between border-l border-gray-100 dark:border-gray-800 animate-in slide-in-from-right duration-300 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Tu Carrito de Compras</h3>
                {cart.length > 0 && (
                  <span className="text-[11px] bg-red-100 dark:bg-red-950/60 text-[#f05454] dark:text-red-400 font-black px-2 py-0.5 rounded-full">
                    {cart.reduce((acc, it) => acc + (it.cantidad || 1), 0)} {cart.reduce((acc, it) => acc + (it.cantidad || 1), 0) === 1 ? "ítem" : "ítems"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowCart(false)}
                aria-label="Cerrar carrito de compras"
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
                title="Cerrar carrito"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Center Body: Scrolleable Products List + Fixed Complementa tu Orden */}
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center text-red-500">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Tu carrito está vacío</p>
                <p className="text-xs text-gray-400">Agrega deliciosos productos de nuestro menú</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 py-3 gap-3">
                {/* 1. Listado scrolleable SOLO para los productos */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {cart.map((item, index) => {
                    const itemKey = item.cartItemId || `${item.id}-${index}`;
                    const prodStock = Number(item.stock !== undefined ? item.stock : 0);
                    const totalInCartForProd = getProductQuantityInCart(item.id || item.idProducto);
                    const isPromoEvent = Boolean(item.esPromocionEvento || (item.isEvento && Boolean(item.eventoInfo?.nombre)));
                    const additionsUnit = (item.adiciones || []).reduce((sum, a) => sum + ((Number(a.precio) || 0) * (Number(a.cantidad) || 1)), 0);
                    const unitPriceWithAdds = (Number(item.precio) || 0) + additionsUnit;
                    const lineTotalPrice = unitPriceWithAdds * (Number(item.cantidad) || 1);

                    return (
                      <div key={itemKey} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3 shadow-2xs hover:border-gray-200 dark:hover:border-gray-700 transition">
                        {(() => {
                          let displayImg = item.imagen;
                          if (!displayImg || typeof displayImg !== "string" || (!displayImg.startsWith("http") && !displayImg.startsWith("/") && !displayImg.startsWith("data:"))) {
                            if (isDrinkProduct(item) || String(item.nombre || "").toLowerCase().includes("gaseosa") || String(item.nombre || "").toLowerCase().includes("coca")) {
                              displayImg = resolveDrinkImage(item);
                            }
                          }
                          return displayImg && (displayImg.startsWith("http") || displayImg.startsWith("/") || displayImg.startsWith("data:")) ? (
                            <img
                              src={displayImg}
                              alt={item.nombre}
                              width="48"
                              height="48"
                              style={{ aspectRatio: "1 / 1" }}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-2xs border border-gray-100 dark:border-gray-700 mt-0.5"
                            />
                          ) : (
                            <FoodIconBadge name={item.nombre} size="md" className="mt-0.5" />
                          );
                        })()}

                        {/* Contenido Central: Título, Adiciones, Stepper */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate" title={item.nombre}>
                            {item.nombre}
                          </h4>
                          
                          {/* Resumen de Bebida o Acompañante de Combo */}
                          {item.observaciones && item.observaciones.toLowerCase().includes("bebida") && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block mt-0.5">
                              🥤 {item.observaciones.split("•").find(s => s.toLowerCase().includes("bebida"))?.trim() || item.observaciones}
                            </span>
                          )}
                          
                          {/* Badge de Promoción de Evento */}
                          {isPromoEvent && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 inline-flex items-center gap-1 mt-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                              {item.eventoInfo?.nombre ? `Promoción: ${item.eventoInfo.nombre}` : "Promoción de evento"}
                            </span>
                          )}

                          {item.adiciones && item.adiciones.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.adiciones.map((a, aIdx) => (
                                <span key={aIdx} className="text-[10px] bg-rose-50 dark:bg-rose-950/40 text-[#F05454] dark:text-rose-300 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                  <img src={getAdicionImage(a)} alt="" aria-hidden="true" width="13" height="13" className="w-3.5 h-3.5 rounded-full object-cover inline-block" />
                                  +{a.cantidad > 1 ? `${a.cantidad}x ` : ""}{a.nombre} (+${((Number(a.precio) || 0) * (Number(a.cantidad) || 1)).toLocaleString("es-CO")})
                                </span>
                              ))}
                            </div>
                          )}
                          {item.personalizaciones && item.personalizaciones.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.personalizaciones.map((p, pIdx) => (
                                <span key={pIdx} className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                  <Ban className="w-3 h-3 text-red-500 shrink-0" />
                                  <span>{p}</span>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Controles de cantidad (Stepper) */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cartItemId || item.id, -1)}
                              aria-label={`Reducir cantidad de ${item.nombre}`}
                              className="w-6 h-6 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer active:scale-95 transition"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold min-w-4 text-center font-mono">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (totalInCartForProd >= prodStock) {
                                  error("Límite de stock", `Solo hay ${prodStock} unidades disponibles de ${item.nombre}.`);
                                } else {
                                  updateQuantity(item.cartItemId || item.id, 1);
                                }
                              }}
                              aria-label={`Aumentar cantidad de ${item.nombre}`}
                              className="w-6 h-6 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer active:scale-95 transition"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Columna Derecha: Precios Apilados & Organizados para Sumar Fácilmente */}
                        <div className="flex flex-col items-end justify-between shrink-0 text-right min-w-[85px] self-stretch">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.cartItemId || item.id)}
                            aria-label={`Eliminar ${item.nombre} del carrito`}
                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md cursor-pointer transition -mr-1"
                            title="Eliminar este producto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex flex-col items-end mt-auto space-y-0.5">
                            {/* Precio Unitario explícito */}
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                              Unit: <span className="font-mono tabular-nums font-semibold text-gray-700 dark:text-gray-300">${unitPriceWithAdds.toLocaleString("es-CO")}</span>
                            </div>

                            {/* Desglose si cantidad > 1 */}
                            {item.cantidad > 1 && (
                              <div className="text-[9.5px] text-gray-400 font-mono tabular-nums">
                                {item.cantidad} × ${unitPriceWithAdds.toLocaleString("es-CO")}
                              </div>
                            )}

                            {/* Subtotal del producto alineado a la derecha */}
                            <div className="text-sm font-black text-red-600 dark:text-red-400 font-mono tabular-nums tracking-tight">
                              ${lineTotalPrice.toLocaleString("es-CO")}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Sección Fija (Sin scroll vertical): Complementa tu orden */}
                <div className="shrink-0 bg-gradient-to-br from-[#3b0c10] via-[#2d080c] to-[#1c0406] rounded-3xl p-3 sm:p-3.5 text-white shadow-lg border border-red-950/80 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[9.5px] uppercase font-black tracking-wider text-amber-400 block">
                        ¿Tienes un antojo?
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-white leading-tight">
                        Complementa tu orden
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scrollComplementos("left")}
                        aria-label="Ver complemento anterior"
                        className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition active:scale-90 border border-white/10 cursor-pointer"
                        title="Anterior complemento"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollComplementos("right")}
                        aria-label="Ver siguiente complemento"
                        className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition active:scale-90 border border-white/10 cursor-pointer"
                        title="Siguiente complemento"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Carrusel horizontal */}
                  <div
                    ref={complementosRef}
                    className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x snap-mandatory"
                  >
                    {complementosOrden.map((comp) => (
                      <div
                        key={comp.id}
                        className="w-28 sm:w-32 shrink-0 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm flex flex-col justify-between text-gray-900 dark:text-gray-100 snap-start border border-gray-100 dark:border-gray-700/60 group hover:shadow-md transition-all"
                      >
                        <div className="relative w-full h-16 sm:h-18 rounded-xl bg-gray-50 dark:bg-gray-900/80 overflow-hidden flex items-center justify-center mb-1">
                          <img
                            src={comp.imagen}
                            alt={comp.nombre}
                            width="112"
                            height="64"
                            loading="lazy"
                            style={{ aspectRatio: "16 / 10" }}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
                          />
                          {comp.badge && (
                            <span className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[8px] font-black px-1 rounded-md">
                              {comp.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 mb-1">
                          <p className="font-black text-[11px] text-gray-800 dark:text-gray-100 line-clamp-1 leading-snug">
                            {comp.nombre}
                          </p>
                          <p className="text-[9.5px] text-gray-500 dark:text-gray-400 truncate">
                            {comp.tamano || comp.descripcion}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-750">
                          <span className="text-[11px] font-black text-gray-900 dark:text-gray-100">
                            ${Number(comp.precio).toLocaleString("es-CO")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddComplemento(comp)}
                            className="w-6 h-6 rounded-full bg-[#f05454] hover:bg-[#d94444] text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform cursor-pointer"
                            title={`Agregar ${comp.nombre} al pedido`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2 shrink-0">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-gray-100 tabular-nums text-sm">${clientSubtotal.toLocaleString("es-CO")}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Descuento Fidelidad ({discountPercent}%):
                    </span>
                    <span className="font-mono font-bold tabular-nums">-${clientDiscountMonto.toLocaleString("es-CO")}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-base font-extrabold text-gray-900 dark:text-gray-100 pt-1.5 border-t border-gray-100 dark:border-gray-800">
                  <span>Total Pedido:</span>
                  <span className="text-red-600 dark:text-red-400 text-xl font-black font-mono tabular-nums">${totalCheckout.toLocaleString("es-CO")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={clearCart}
                    className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    Vaciar Carrito
                  </button>
                  <button
                    onClick={handleAbrirCheckout}
                    className="py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl text-xs shadow-md active:scale-[0.98] transition cursor-pointer"
                  >
                    Proceder al Pago
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CHECKOUT — Diseño Exacto Aprobado */}
      {showCheckout && cart.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[94dvh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

            {/* ═══ HEADER ROJO GRADIENT CON BORDES REDONDEADOS ═══ */}
            <div className="bg-gradient-to-r from-[#D9383A] to-[#E03E3E] px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between rounded-t-2xl sm:rounded-t-3xl shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Finalizar Pedido</h3>
                <p className="text-xs text-white/90 font-medium mt-0.5">Completa los datos de entrega y pago</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                aria-label="Cerrar checkout"
                className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ═══ CUERPO SCROLLEABLE — Flujo Lógico Reordenado (Ítem #11, #20, #26, #28, #122) ═══ */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5 sm:space-y-6 custom-modal-scrollbar">

              {/* ── 1. Especificaciones del Pedido & Empaque Térmico (Ítem #11) ── */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#7F1D1D] dark:text-red-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#B91C1C]" />
                  <span>1. Especificaciones de Cocina &amp; Empaque</span>
                  <span className="font-normal text-gray-400 text-[11px] lowercase">(opcional)</span>
                </h4>

                {/* Checkbox Empaque térmico para llevar */}
                <label className="flex items-start gap-3 p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl cursor-pointer hover:bg-amber-100/50 transition select-none">
                  <input
                    type="checkbox"
                    checked={checkoutEmpaqueParaLlevar}
                    onChange={(e) => setCheckoutEmpaqueParaLlevar(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-red-600 focus:ring-red-500 accent-[#f05454] cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Empaque especial térmico para llevar / regalo
                    </span>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400 block mt-0.5 leading-snug">
                      Envase sellado hermético que conserva la temperatura y frescura ideal durante el trayecto.
                    </span>
                  </div>
                </label>

                <textarea
                  rows={2}
                  value={checkoutEspecificaciones}
                  onChange={(e) => setCheckoutEspecificaciones(e.target.value)}
                  placeholder="Ej: Sin cebolla, salsas aparte, dejar en portería, timbre 201..."
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#E03E3E] transition resize-none"
                />
              </div>

              {/* ── 2. Modalidad y Datos de Entrega ── */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-black text-[#7F1D1D] dark:text-red-300 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#B91C1C]" />
                  <span>2. Modalidad &amp; Datos de Entrega</span>
                </h4>

                <div className="bg-[#FFF5F5] dark:bg-red-950/20 border border-[#E03E3E]/30 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/40 text-[#E03E3E] flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 block">
                          Entrega a Domicilio
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Llevamos tu pedido directamente hasta tu puerta
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-2xs shrink-0">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>35 - 45 min</span>
                    </span>
                  </div>
                  <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2 flex items-start gap-2 text-[11.5px] text-amber-900 dark:text-amber-200">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      <strong>Importante sobre el envío:</strong> El valor del <strong>domicilio se paga por aparte</strong> directamente al domiciliario al momento de recibir tu pedido.
                    </span>
                  </div>
                </div>

                {/* Cédula y Documento para Facturación y Seguridad */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Tipo Doc. <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={checkoutTipoDoc}
                      disabled={isCheckoutDocLocked}
                      onChange={(e) => {
                        if (isCheckoutDocLocked) return;
                        checkoutUserEditedDocRef.current = true;
                        const newT = e.target.value;
                        setCheckoutTipoDoc(newT);
                        setCheckoutDocumento((prev) => sanitizeDocumento(prev, newT));
                      }}
                      className={`w-full px-3 py-3 border rounded-2xl text-xs font-bold outline-none transition ${
                        isCheckoutDocLocked
                          ? "bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#E03E3E] cursor-pointer"
                      }`}
                    >
                      <option value="C.C.">C.C.</option>
                      <option value="C.E.">C.E.</option>
                      <option value="T.I.">T.I.</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="PPT">PPT</option>
                      <option value="NIT">NIT</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center justify-between gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex-wrap">
                      <span>
                        N.° de Cédula / Documento <span className="text-red-500">*</span>
                        {!isCheckoutDocLocked && (
                          <span className="ml-1 text-[11px] text-gray-400 font-normal">(6 a 10 dígitos)</span>
                        )}
                      </span>
                      {isCheckoutDocLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          Dato verificado (Inmutable)
                        </span>
                      )}
                      {!isCheckoutDocLocked && checkoutDocCheck.status === "checking" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Verificando...
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        id="checkout-documento-input"
                        type="text"
                        inputMode="numeric"
                        value={checkoutDocumento}
                        readOnly={isCheckoutDocLocked}
                        disabled={isCheckoutDocLocked}
                        onChange={(e) => {
                          if (isCheckoutDocLocked) return;
                          checkoutUserEditedDocRef.current = true;
                          const val = sanitizeDocumento(e.target.value, checkoutTipoDoc);
                          setCheckoutDocumento(val);
                          const valRes = validateDocumento(val, checkoutTipoDoc);
                          if (!valRes.isValid) {
                            setCheckoutErrors((prev) => ({ ...prev, documento: valRes.error }));
                          } else {
                            setCheckoutErrors((prev) => {
                              const n = { ...prev };
                              delete n.documento;
                              return n;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-2xl text-sm font-medium outline-none transition ${
                          isCheckoutDocLocked
                            ? "pr-10 bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                            : checkoutErrors.documento || checkoutDocCheck.status === "conflict"
                            ? "bg-red-50/40 dark:bg-red-950/20 border-red-500 text-gray-900 dark:text-gray-100 focus:border-red-600 focus:ring-1 focus:ring-red-500"
                            : checkoutDocCheck.status === "available"
                            ? "bg-white dark:bg-gray-800 border-emerald-500 text-gray-900 dark:text-gray-100 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-[#E03E3E]"
                        }`}
                        placeholder="Ej: 1020304050"
                      />
                      {isCheckoutDocLocked && (
                        <Lock
                          className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    {isCheckoutDocLocked ? (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mt-1">
                        Por seguridad y validación fiscal, se usa el documento registrado en tu cuenta.
                      </p>
                    ) : (
                      <>
                        {(checkoutErrors.documento || checkoutDocCheck.status === "conflict") && (
                          <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1.5 flex items-start gap-1 animate-in fade-in">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{checkoutErrors.documento || checkoutDocCheck.message}</span>
                          </p>
                        )}
                        {!checkoutErrors.documento && checkoutDocCheck.status === "available" && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Documento disponible — se vinculará a tu cuenta al confirmar.</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Nombre del destinatario <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={checkoutNombre}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCheckoutNombre(val);
                        const valRes = validateNombre(val, "nombre del destinatario");
                        if (!valRes.isValid) {
                          setCheckoutErrors((prev) => ({ ...prev, nombre: valRes.error }));
                        } else {
                          setCheckoutErrors((prev) => {
                            const n = { ...prev };
                            delete n.nombre;
                            return n;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-2xl text-sm font-medium text-gray-900 dark:text-gray-100 outline-none transition ${
                        checkoutErrors.nombre
                          ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500"
                          : "border-gray-200 dark:border-gray-700 focus:border-[#E03E3E]"
                      }`}
                      placeholder="María García"
                    />
                    {checkoutErrors.nombre && (
                      <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{checkoutErrors.nombre}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-telefono-input"
                      className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      Teléfono de contacto <span className="text-red-500">*</span>
                      <span className="ml-1 text-[11px] text-gray-400 font-normal">(10 dígitos)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="checkout-telefono-input"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={checkoutTelefono}
                        onChange={(e) => {
                          const val = sanitizeTelefono(e.target.value);
                          setCheckoutTelefono(val);
                          const valRes = validateTelefono(val);
                          if (!valRes.isValid) {
                            setCheckoutErrors((prev) => ({ ...prev, telefono: valRes.error }));
                          } else {
                            setCheckoutErrors((prev) => {
                              const n = { ...prev };
                              delete n.telefono;
                              return n;
                            });
                          }
                        }}
                        className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border rounded-2xl text-sm font-medium text-gray-900 dark:text-gray-100 outline-none transition ${
                          checkoutErrors.telefono
                            ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500"
                            : checkoutTelefono.length === 10
                            ? "border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                            : "border-gray-200 dark:border-gray-700 focus:border-[#E03E3E]"
                        }`}
                        placeholder="Ej: 3001234567"
                      />
                    </div>
                    {checkoutErrors.telefono ? (
                      <p className="text-[11px] text-red-500 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{checkoutErrors.telefono}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        Para coordinar la entrega con el domiciliario.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Dirección de entrega (Medellín) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={checkoutDireccion}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCheckoutDireccion(val);
                      const valDir = validateDireccionMedellin(val, { required: true });
                      if (!valDir.isValid) {
                        setCheckoutErrors((prev) => ({ ...prev, direccion: valDir.error }));
                      } else {
                        setCheckoutErrors((prev) => {
                          const n = { ...prev };
                          delete n.direccion;
                          return n;
                        });
                      }
                    }}
                    className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-2xl text-sm font-medium text-gray-900 dark:text-gray-100 outline-none transition ${
                      checkoutErrors.direccion || (checkoutDireccion.trim() && checkoutAddressValidation.status === "invalid")
                        ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500"
                        : checkoutAddressValidation.status === "verified"
                        ? "border-emerald-500 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                        : "border-gray-200 dark:border-gray-700 focus:border-[#E03E3E]"
                    }`}
                    placeholder="Ej: Calle 45 # 12-30, Apto 201, El Poblado"
                  />
                  <MedellinAddressStatus
                    status={checkoutAddressValidation.status}
                    error={checkoutErrors.direccion || (checkoutDireccion.trim() ? checkoutAddressValidation.error : "")}
                    verifiedInfo={checkoutAddressValidation.verifiedInfo}
                    showError={Boolean(checkoutErrors.direccion || (checkoutDireccion.trim() && checkoutAddressValidation.error))}
                  />
                </div>
              </div>

              {/* ── 3. Resumen de Compra & Método de Pago Wompi (Ítem #122) ── */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#7F1D1D] dark:text-red-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#B91C1C]" />
                    <span>3. Resumen &amp; Pago Seguro</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Pago 100% Seguro
                  </span>
                </h4>

                <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-gray-700/60 shadow-2xs">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-semibold">
                      <ShoppingCart className="w-4 h-4 text-[#E03E3E]" /> Subtotal ({getTotalItems()} prod.)
                    </span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">${clientSubtotal.toLocaleString('es-CO')}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Descuento Fidelidad ({discountPercent}%):
                      </span>
                      <span>-${clientDiscountMonto.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                    <span>IVA (0%)</span>
                    <span>$0</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/35 px-2.5 py-1.5 rounded-lg border border-amber-200/80 dark:border-amber-800/50">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Costo de domicilio</span>
                    </span>
                    <span className="font-extrabold">Se paga por aparte</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700/80 pt-2 flex justify-between items-center">
                    <span className="text-base font-black text-gray-900 dark:text-gray-100">Total a Pagar (Productos)</span>
                    <span className="text-xl font-black text-[#D9383A]">${totalCheckout.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {/* Tarjeta Destacada de Pasarela Oficial Wompi */}
                <div className="bg-gradient-to-br from-amber-50/70 via-red-50/40 to-orange-50/50 dark:from-red-950/30 dark:to-orange-950/20 border-2 border-[#E03E3E]/30 dark:border-red-800/50 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#B91C1C] to-[#E03E3E] text-white flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-red-200 dark:ring-red-900">
                        W
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-gray-900 dark:text-gray-100">Pasarela Oficial Wompi</p>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">(Bancolombia)</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Canal exclusivo y seguro para compras web</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                      <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-current" />
                      <span>Pago Inmediato</span>
                    </span>
                  </div>

                  {/* Opciones disponibles dentro de Wompi */}
                  <div>
                    <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Medios de pago disponibles en la pasarela:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-1.5">
                      <div className="bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-900/50 rounded-xl p-2 text-center text-[10px] font-bold text-pink-700 dark:text-pink-300 flex flex-col items-center justify-center gap-1 shadow-2xs">
                        <FoodIcon name="mobile" size={14} className="text-pink-600 dark:text-pink-400" />
                        <span>Nequi</span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900/50 rounded-xl p-2 text-center text-[10px] font-bold text-blue-700 dark:text-blue-300 flex flex-col items-center justify-center gap-1 shadow-2xs">
                        <FoodIcon name="bank" size={14} className="text-blue-600 dark:text-blue-400" />
                        <span>PSE (Bancos)</span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-2 text-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex flex-col items-center justify-center gap-1 shadow-2xs">
                        <FoodIcon name="card" size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Tarjetas C/D</span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-900/50 rounded-xl p-2 text-center text-[10px] font-bold text-amber-700 dark:text-amber-300 flex flex-col items-center justify-center gap-1 shadow-2xs">
                        <FoodIcon name="bank" size={14} className="text-amber-600 dark:text-amber-400" />
                        <span>Bancolombia</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                    Al confirmar, se abrirá el formulario seguro de Wompi. Si tu navegador tiene un bloqueador de ventanas o anuncios activo, serás transferido automáticamente a la pasarela web oficial para completar tu pago de forma segura.
                  </p>
                </div>

                {/* Nota informativa: Pagos en físico */}
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300 shadow-2xs">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    <strong>Aviso:</strong> En la plataforma web las órdenes se procesan únicamente mediante la pasarela segura en línea Wompi. Medios manuales (efectivo, datáfono presencial o transferencias manuales) aplican de forma exclusiva en el punto de venta físico.
                  </span>
                </div>

                {/* Aceptación obligatoria de Términos y Condiciones + Política de Datos (Ley 1581 de 2012) */}
                <AceptacionLegalCheckbox
                  id="checkout-aceptacion-legal"
                  checked={checkoutAceptaTerminos}
                  onChange={(val) => {
                    setCheckoutAceptaTerminos(val);
                    if (val) {
                      setCheckoutErrors((prev) => {
                        const n = { ...prev };
                        delete n.terminos;
                        return n;
                      });
                    }
                  }}
                  error={checkoutErrors.terminos}
                  context="checkout"
                />
              </div>
            </div>

            {/* ═══ FOOTER FIJO CON PRECIO Y BOTÓN CONFIRMAR ═══ */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 space-y-2.5 rounded-b-3xl">
              <div className="space-y-1.5">
                {clientDiscountMonto > 0 && (
                  <>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${clientSubtotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-xl">
                      <span>Descuento Fidelidad ({discountPercent}% OFF):</span>
                      <span>-${clientDiscountMonto.toLocaleString('es-CO')}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">Total a pagar:</span>
                  <span className="text-2xl font-black text-[#D9383A]">${totalCheckout.toLocaleString('es-CO')}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium text-center">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Precio sin IVA aplicado · El domicilio se paga por aparte</span>
              </div>
              <button
                type="button"
                disabled={isProcessingWompi || checkoutDocCheck.status === "conflict" || checkoutDocCheck.status === "checking"}
                onClick={handleConfirmarPedido}
                className="w-full py-4 font-extrabold rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#E03E3E] to-[#B91C1C] hover:from-[#C92A2A] hover:to-[#991B1B] text-white active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingWompi ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Conectando con Wompi...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    <span>Pagar con Wompi en Línea (${totalCheckout.toLocaleString('es-CO')} COP)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL INICIAR SESIÓN / REGISTRO PARA PAGAR (EN LÍNEA SIN REDIRIGIR) */}
      {showEmptyCartLoginModal && (
        <Suspense fallback={null}>
          <ClienteAuthModal
            isOpen={showEmptyCartLoginModal}
            onClose={() => setShowEmptyCartLoginModal(false)}
            onSuccess={handleAuthModalSuccess}
            totalItems={getTotalItems()}
            cartTotal={clientSubtotal}
            initialView="choice"
          />
        </Suspense>
      )}

      {/* Modal de Personalización Individual de Eventos */}
      {showPersonalizarEventoModal && (
        <Suspense fallback={null}>
          <PersonalizarEventoModal
            isOpen={true}
            onClose={() => setShowPersonalizarEventoModal(false)}
            evento={eventoParaPersonalizar}
            producto={productoParaEvento}
            productosList={activeProductos}
            adicionesList={foodAdiciones.length > 0 ? foodAdiciones : activeAdiciones}
            allBebidas={bebidasDisponibles}
            fichasMap={fichasMap}
            ratingsMap={ratingsMap}
            onOpenResenas={(prod) => {
              setProductoParaResenas(prod);
              setShowResenasModal(true);
            }}
            onReviewChanged={refreshRatingsMap}
            onAddToCart={(item, selectedDrinks = []) => {
              const itemsToBatch = [item];
              if (Array.isArray(selectedDrinks) && selectedDrinks.length > 0) {
                for (const b of selectedDrinks) {
                  itemsToBatch.push({
                    id: b.id || b.idProducto,
                    idProducto: b.idProducto || b.id,
                    idVariante: b.idVariante || b.id || b.idProducto,
                    nombre: b.nombre,
                    precio: Number(b.precio || 0),
                    cantidad: Number(b.cantidad || 1),
                    stock: Number(b.stock !== undefined ? b.stock : 0),
                    imagen: resolveDrinkImage(b),
                    esBebida: true,
                    categoria: "Bebidas",
                    adiciones: []
                  });
                }
              }
              const res = addToCart(itemsToBatch);
              if (res && res.success === false) {
                error("Stock insuficiente", res.message || "No hay suficiente stock disponible para este producto.");
                return;
              }
              const drinksNotice = selectedDrinks.length > 0 ? ` y ${selectedDrinks.length} bebida(s)` : "";
              success("¡Agregado al carrito!", `${item.nombre}${drinksNotice} se agregó correctamente.`);
            }}
            getProductQuantityInCart={getProductQuantityInCart}
          />
        </Suspense>
      )}
      </main>

      {/* ═══ 6. BARRA FLOTANTE RESUMEN DEL PEDIDO (PREVIEW) ═══ */}
      {cart.length > 0 && !showCart && !showCheckout && (
        <aside
          aria-label="Resumen de tu Pedido"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
        >
          <div className="bg-slate-900/95 dark:bg-gray-900/95 backdrop-blur-md text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl border border-red-500/30 flex items-center justify-between gap-3">
            <div
              className="flex items-center gap-3 cursor-pointer select-none min-w-0 group"
              onClick={() => setShowCart(true)}
              title="Abrir detalle del carrito"
            >
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-white text-red-600 text-[11px] font-black flex items-center justify-center shadow-xs">
                  {getTotalItems()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                    Resumen de tu Pedido
                  </span>
                  <span className="text-[10px] text-slate-400">• {getTotalItems()} {getTotalItems() === 1 ? "ítem" : "ítems"}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-black text-white truncate">
                    Total: <span className="text-red-400 font-extrabold">${clientSubtotal.toLocaleString("es-CO")}</span>
                  </p>
                  {/* Vista previa de miniaturas en barra flotante (Ítem #6) */}
                  <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden ml-1">
                    {cart.slice(0, 3).map((it, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-2xs"
                        title={`${it.cantidad}x ${it.nombre}`}
                      >
                        {it.imagen ? (
                          <img src={it.imagen} alt={it.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-amber-400 bg-red-950">
                            {it.nombre?.[0] || 'P'}
                          </div>
                        )}
                      </div>
                    ))}
                    {cart.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-bold pl-2">+{cart.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCart(true)}
                className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition cursor-pointer"
              >
                Ver Detalle
              </button>
              <button
                type="button"
                onClick={handleAbrirCheckout}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>Pagar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Pie de Página / Sección de Créditos del Equipo */}
      <ClienteFooter />

      {/* Modal Reseñas de Producto (renders over PersonalizarEventoModal) */}
      {showResenasModal && (
        <Suspense fallback={null}>
          <ProductoResenasModal
            isOpen={true}
            onClose={() => {
              setShowResenasModal(false);
              refreshRatingsMap();
            }}
            onReviewChanged={refreshRatingsMap}
            producto={productoParaResenas}
          />
        </Suspense>
      )}
    </div>
  );
}
