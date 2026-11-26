import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { hasPrivilege } from "@/features/configuracion/utils/privilegiosUtils";
import { useDarkMode } from "@/shared/hooks/useDarkMode";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { prefetchRoute, prefetchRoutes } from "@/routes/routePrefetch";
const MiPerfilModal = lazy(() => import("@/shared/components/profile/MiPerfilModal").then((m) => ({ default: m.MiPerfilModal })));

function PageTransitionSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5 animate-pulse" role="status" aria-label="Cargando módulo">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-3.5 w-64 max-w-full bg-gray-200/80 dark:bg-gray-800/80 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="h-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-6 w-14 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800 p-5 space-y-3">
        <div className="h-9 w-full bg-gray-100 dark:bg-gray-800 rounded-xl" />
        <div className="h-10 w-full bg-gray-100/80 dark:bg-gray-800/70 rounded-xl" />
        <div className="h-10 w-full bg-gray-100/70 dark:bg-gray-800/60 rounded-xl" />
        <div className="h-10 w-full bg-gray-100/60 dark:bg-gray-800/50 rounded-xl" />
      </div>
    </div>
  );
}
import logoImg from "@/shared/assets/logo_optimized.webp";
import {
  Menu,
  Home,
  ShoppingCart,
  TrendingUp,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  X,
  Users,
  Shield,
  UserCircle,
  LayoutDashboard,
  ChefHat,
  Store,
  UtensilsCrossed,
  ArrowLeft,
  Layers
} from "lucide-react";
import {
  NavIconInicio,
  NavIconCompras,
  NavIconProduccion,
  NavIconVentas,
  NavIconConfig
} from "@/shared/components/icons/BottomNavIcons";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [comprasExpanded, setComprasExpanded] = useState(false);
  const [produccionExpanded, setProduccionExpanded] = useState(false);
  const [ventasExpanded, setVentasExpanded] = useState(false);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [usuariosExpanded, setUsuariosExpanded] = useState(false);
  const [openTopGroup, setOpenTopGroup] = useState(null); // "ventas" | "produccion" | null
  const topNavRef = useRef(null);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [darkMode, toggleDarkMode] = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { confirmLogout, success } = useNotifications();

  const isActive = (path) => location.pathname === path;
  const isInSection = (prefix) => location.pathname.startsWith(prefix);

  const rawRol = typeof user?.rol === "object" ? user?.rol?.nombre : user?.rol;
  const userRol = String(rawRol || "").toLowerCase().trim();
  const isAdmin = userRol === "administrador" || userRol === "admin" || user?.idRol === 1;
  const isVendedor = userRol === "vendedor" || userRol.includes("vendedor") || user?.idRol === 3;

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  // Cerrar el drawer móvil y menús agrupados automáticamente al navegar
  useEffect(() => {
    setSidebarOpen(false);
    setOpenTopGroup(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!openTopGroup) return;
    const handleOutside = (e) => {
      if (topNavRef.current && !topNavRef.current.contains(e.target)) {
        setOpenTopGroup(null);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpenTopGroup(null);
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [openTopGroup]);

  // Abrir automáticamente MiPerfilModal si se llega desde /perfil o correo (?abrirPerfil=1)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("abrirPerfil") === "1") {
      setPerfilOpen(true);
      params.delete("abrirPerfil");
      const nextSearch = params.toString();
      navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ""}`, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  // ── Permission helper ──
  // Administrador always has all permissions; for other roles, check granular Ver privilege
  const hasPerm = (permName) => {
    return hasPrivilege(user, permName, "ver");
  };

  const handleLogout = async () => {
    setSidebarOpen(false);
    const confirmed = await confirmLogout();
    if (confirmed) {
      logout();
      success("Sesión cerrada", "Has salido del sistema correctamente");
      navigate("/login", { replace: true });
    }
  };

  const closeAllSections = () => {
    setComprasExpanded(false);
    setProduccionExpanded(false);
    setVentasExpanded(false);
    setConfigExpanded(false);
    setUsuariosExpanded(false);
  };

  const openSection = (section) => {
    setComprasExpanded(section === "compras");
    setProduccionExpanded(section === "produccion");
    setVentasExpanded(section === "ventas");
    setConfigExpanded(section === "config");
    setUsuariosExpanded(section === "usuarios");

    if (section === "compras") prefetchRoutes(allComprasItems.map((i) => i.to));
    else if (section === "produccion") prefetchRoutes(allProduccionItems.map((i) => i.to));
    else if (section === "ventas") prefetchRoutes([...allVentasItems.map((i) => i.to), "/ventas/pos"]);
    else if (section === "config") prefetchRoutes(["/configuracion/roles"]);
    else if (section === "usuarios") prefetchRoutes(["/configuracion/usuarios"]);
  };

  const handleSectionClick = (section, cur) => {
    if (cur) {
      closeAllSections();
    } else {
      openSection(section);
    }
  };

  const handleMobileSectionClick = (section, cur) => {
    if (cur) {
      closeAllSections();
    } else {
      openSection(section);
    }
  };

  // Filter nav items based on permissions
  const allComprasItems = [
    { to: "/compras/categoria-insumos", label: "Categoría Insumos", perm: "Categoría Insumos" },
    { to: "/compras/insumos", label: "Insumos", perm: "Insumos" },
    { to: "/compras/proveedores", label: "Proveedores", perm: "Proveedores" },
    { to: "/compras/gestion", label: "Gestión de Compras", perm: "Gestión de Compras" }
  ];
  const comprasItems = allComprasItems.filter(i => hasPerm(i.perm));
  const showCompras = hasPerm("Compras") || comprasItems.length > 0;

  const allProduccionItems = [
    { to: "/ventas/categoria-productos", label: "Categoría Productos", perm: "Categoría Productos" },
    { to: "/ventas/productos", label: "Productos Terminados", perm: "Productos" },
    { to: "/produccion/empleados", label: "Gestión de Empleados", perm: "Empleados" },
    { to: "/produccion/gestion", label: "Gestión de Producción", perm: "Gestión de Producción" }
  ];
  const produccionItems = isVendedor
    ? allProduccionItems
    : allProduccionItems.filter(i => hasPerm(i.perm) || (i.perm === "Empleados" && hasPerm("Producción")));
  const showProduccion = isVendedor || hasPerm("Producción") || produccionItems.length > 0;
  const produccionPaths = produccionItems.map((i) => i.to);

  const allVentasItems = [
    { to: "/ventas/pos", label: "Punto de Venta (POS)", perm: "Gestión de Ventas" },
    { to: "/ventas/gestion-ventas", label: "Gestión de Ventas", perm: "Gestión de Ventas" },
    { to: "/ventas/clientes", label: "Clientes", perm: "Clientes" },
    { to: "/ventas/devoluciones", label: "Devoluciones", perm: "Devoluciones" }
  ];
  const ventasItems = isVendedor
    ? allVentasItems
    : allVentasItems.filter((i) =>
        hasPerm(i.perm) ||
        (i.to === "/ventas/pos" && (hasPerm("Punto de Venta") || hasPerm("Vendedor") || hasPerm("Ventas"))) ||
        (i.perm === "Devoluciones" && (hasPerm("Gestión de Ventas") || hasPerm("Ventas")))
      );
  const showVentas = isVendedor || hasPerm("Ventas") || ventasItems.length > 0;
  const ventasPaths = [...ventasItems.map((i) => i.to), "/ventas/pos"];

  const allConfigItems = [
    { to: "/configuracion/roles", label: "Roles", perm: "Roles" }
  ];
  const configItems = allConfigItems.filter(i => hasPerm(i.perm));
  const showConfig = hasPerm("Configuración") || configItems.length > 0;

  const allUsuariosItems = [
    { to: "/configuracion/usuarios", label: "Gestión de Usuarios", perm: "Usuarios" }
  ];
  const usuariosItems = allUsuariosItems.filter(i => hasPerm(i.perm));
  const showUsuarios = hasPerm("Usuarios") || usuariosItems.length > 0;

  const getPageTitle = (path) => {
    if (path === "/ventas/pos") return "Punto de Venta";
    if (path.startsWith("/ventas/gestion-ventas") || path.startsWith("/ventas/detalle")) return "Gestión de Ventas";
    if (path.startsWith("/ventas/devoluciones")) return "Devoluciones";
    if (path.startsWith("/ventas/clientes")) return "Clientes";
    if (path.startsWith("/produccion/gestion")) return "Gestión de Producción";
    if (path.startsWith("/produccion/empleados")) return "Gestión de Empleados";
    if (path.startsWith("/ventas/categoria-productos")) return "Categoría Productos";
    if (path.startsWith("/ventas/productos")) return "Productos Terminados";
    if (path.startsWith("/compras/categoria-insumos")) return "Categoría Insumos";
    if (path.startsWith("/compras/insumos")) return "Insumos";
    if (path.startsWith("/compras/proveedores")) return "Proveedores";
    if (path.startsWith("/compras/gestion")) return "Gestión de Compras";
    if (path.startsWith("/configuracion/roles")) return "Roles";
    if (path.startsWith("/configuracion/usuarios")) return "Usuarios";
    if (path === "/") return "Dashboard";
    return "Chazin Food";
  };

  const isPosView = location.pathname === "/ventas/pos";
  const showFullTopHeader = isVendedor || isPosView;

  // Menús agrupados para la barra superior (POS / Vendedor) — reduce ruido visual de íconos sueltos
  const topGroupedMenus = [
    {
      id: "ventas",
      label: "Ventas y Clientes",
      icon: TrendingUp,
      isActive: (p) =>
        p.startsWith("/ventas/gestion-ventas") ||
        p.startsWith("/ventas/detalle") ||
        p.startsWith("/ventas/clientes") ||
        p.startsWith("/ventas/devoluciones"),
      items: [
        { to: "/ventas/gestion-ventas", label: "Gestión de Ventas" },
        { to: "/ventas/clientes", label: "Clientes" },
        { to: "/ventas/devoluciones", label: "Devoluciones" }
      ]
    },
    {
      id: "produccion",
      label: "Producción y Menú",
      icon: ChefHat,
      isActive: (p) =>
        p.startsWith("/ventas/categoria-productos") ||
        p === "/ventas/productos" ||
        p.startsWith("/produccion"),
      items: [
        { to: "/ventas/categoria-productos", label: "Categoría Productos" },
        { to: "/ventas/productos", label: "Productos Terminados" },
        { to: "/produccion/gestion", label: "Gestión de Producción" }
      ]
    }
  ];

  return (
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {!isVendedor && (
        <>
          {/* ── Overlay backdrop (solo para drawer móvil < lg) ── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/45 backdrop-blur-md transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
         DESKTOP SIDEBAR  (lg+) — totalmente fijo y visible en PC
         ═══════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-gray-900 shadow-md border-r border-gray-200 dark:border-gray-800 h-[100dvh] transition-all duration-300 overflow-x-hidden">
        {/* Brand */}
        <div className="bg-gradient-to-br from-[#30475E] to-[#1e3347] px-5 pt-5 pb-4 shrink-0">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 hover:opacity-90 transition-opacity" title="Ir al inicio">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-white/20 shrink-0">
              <img src={logoImg} alt="Chazin Food" width="28" height="28" loading="eager" decoding="async" className="w-full h-full object-cover" style={{ objectPosition: "50% 56%" }} />
            </div>
            <span className="font-bold text-white text-sm">Chazin Food</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 ring-2 ring-white/30">
              {user?.nombre?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div>
              <p className="font-semibold text-white leading-tight">{user?.nombre ?? "Administrador"}</p>
              <p className="text-xs text-blue-200 capitalize mt-0.5">{user?.rol ?? "administrador"}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden sidebar-scroll-container" style={{ overflowX: "hidden" }}>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-1.5 mt-1">Administración</p>
          <ul className="space-y-1">
            {/* Dashboard */}
            {hasPerm("Dashboard") && (
              <li>
                <Link to="/" onMouseEnter={() => prefetchRoute("/")} onFocus={() => prefetchRoute("/")} title="Dashboard" className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isActive("/") ? "bg-red-600 text-white shadow-md" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <Home className="w-5 h-5 shrink-0" />
                  <span className="font-medium">Dashboard</span>
                </Link>
              </li>
            )}

            {/* Configuración */}
            {showConfig && (
              <li>
                <button onClick={() => handleSectionClick("config", configExpanded)} onMouseEnter={() => prefetchRoutes(configItems.map((i) => i.to))} title="Configuración" className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${isInSection("/configuracion") && !isInSection("/configuracion/usuarios") ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <div className="flex items-center gap-3"><Settings className="w-5 h-5 shrink-0" /><span className="font-medium">Configuración</span></div>
                  {configExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {configExpanded && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {configItems.map(({ to, label }) => <li key={to}><Link to={to} onMouseEnter={() => prefetchRoute(to)} onFocus={() => prefetchRoute(to)} className={`block px-4 py-2 rounded-lg text-sm transition-all ${isActive(to) ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>{label}</Link></li>)}
                  </ul>
                )}
              </li>
            )}

            {/* Usuarios */}
            {showUsuarios && (
              <li>
                <button onClick={() => handleSectionClick("usuarios", usuariosExpanded)} onMouseEnter={() => prefetchRoutes(usuariosItems.map((i) => i.to))} title="Usuarios" className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${isInSection("/configuracion/usuarios") ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <div className="flex items-center gap-3"><Users className="w-5 h-5 shrink-0" /><span className="font-medium">Usuarios</span></div>
                  {usuariosExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {usuariosExpanded && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {usuariosItems.map(({ to, label }) => <li key={to}><Link to={to} onMouseEnter={() => prefetchRoute(to)} onFocus={() => prefetchRoute(to)} className={`block px-4 py-2 rounded-lg text-sm transition-all ${isActive(to) ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>{label}</Link></li>)}
                  </ul>
                )}
              </li>
            )}

            {/* Compras */}
            {showCompras && (
              <li>
                <button onClick={() => handleSectionClick("compras", comprasExpanded)} onMouseEnter={() => prefetchRoutes(comprasItems.map((i) => i.to))} title="Compras" className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${isInSection("/compras") ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <div className="flex items-center gap-3"><ShoppingCart className="w-5 h-5 shrink-0" /><span className="font-medium">Compras</span></div>
                  {comprasExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {comprasExpanded && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {comprasItems.map(({ to, label }) => <li key={to}><Link to={to} onMouseEnter={() => prefetchRoute(to)} onFocus={() => prefetchRoute(to)} className={`block px-4 py-2 rounded-lg text-sm transition-all ${isActive(to) ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>{label}</Link></li>)}
                  </ul>
                )}
              </li>
            )}

            {/* Producción */}
            {showProduccion && (
              <li>
                <button onClick={() => handleSectionClick("produccion", produccionExpanded)} onMouseEnter={() => prefetchRoutes(produccionItems.map((i) => i.to))} title="Producción" className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${isInSection("/produccion") || produccionPaths.includes(location.pathname) ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <div className="flex items-center gap-3"><ChefHat className="w-5 h-5 shrink-0" /><span className="font-medium">Producción</span></div>
                  {produccionExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {produccionExpanded && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {produccionItems.map(({ to, label }) => <li key={to}><Link to={to} onMouseEnter={() => prefetchRoute(to)} onFocus={() => prefetchRoute(to)} className={`block px-4 py-2 rounded-lg text-sm transition-all ${isActive(to) ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>{label}</Link></li>)}
                  </ul>
                )}
              </li>
            )}

            {/* Ventas y POS (agrupado para limpieza visual) */}
            {showVentas && (
              <li>
                <button onClick={() => handleSectionClick("ventas", ventasExpanded)} onMouseEnter={() => prefetchRoutes(ventasItems.map((i) => i.to))} title="Ventas y Punto de Venta (POS)" className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${ventasPaths.includes(location.pathname) ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 shrink-0" /><span className="font-medium">Ventas y POS</span></div>
                  {ventasExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {ventasExpanded && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {ventasItems.map(({ to, label }) => <li key={to}><Link to={to} onMouseEnter={() => prefetchRoute(to)} onFocus={() => prefetchRoute(to)} className={`block px-4 py-2 rounded-lg text-sm transition-all ${isActive(to) ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>{label}</Link></li>)}
                  </ul>
                )}
              </li>
            )}
          </ul>

          {/* CUENTA */}
          <div className="my-3 h-px bg-gray-100 dark:bg-gray-800" />
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-1.5">Cuenta</p>
          <div className="space-y-1">
            <button
              onClick={() => { setPerfilOpen(true); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98] text-left cursor-pointer"
            >
              <UserCircle className="w-5 h-5 shrink-0 text-blue-500" />
              <span className="font-medium">Perfil</span>
            </button>
            <button
              onClick={() => toggleDarkMode()}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              {darkMode ? <Sun className="w-5 h-5 shrink-0 text-yellow-400" /> : <Moon className="w-5 h-5 shrink-0 text-gray-500" />}
              <span className="font-medium flex-1 text-left">Modo Oscuro</span>
              <div className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${darkMode ? "bg-red-600" : "bg-gray-200 dark:bg-gray-700"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
         MOBILE LEFT DRAWER  (< lg)  — slides in from left
         ═══════════════════════════════════════════════════════════ */}
      <aside
        aria-label="Navegación móvil"
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 h-[100dvh] w-[84vw] max-w-[320px] min-w-[260px]
          bg-white dark:bg-gray-900
          shadow-2xl flex flex-col overflow-x-hidden
          transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="bg-gradient-to-br from-[#30475E] to-[#1e3347] px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" onClick={handleNavClick} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity" title="Ir al inicio">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-white/20 shrink-0">
                <img src={logoImg} alt="Chazin Food" width="28" height="28" loading="eager" decoding="async" className="w-full h-full object-cover" style={{ objectPosition: "50% 56%" }} />
              </div>
              <span className="font-bold text-white text-sm">Chazin Food</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú lateral" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors active:scale-95">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 ring-2 ring-white/30">
              {user?.nombre?.charAt(0).toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white leading-tight truncate">{user?.nombre ?? "Administrador"}</p>
              <p className="text-xs text-blue-200 capitalize mt-0.5 truncate">{user?.rol ?? "administrador"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto overflow-x-hidden sidebar-scroll-container space-y-1" style={{ overflowX: "hidden" }}>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-1.5 mt-1">Administración</p>

          {hasPerm("Dashboard") && (
            <Link
              to="/"
              onClick={handleNavClick}
              onTouchStart={() => prefetchRoute("/")}
              className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors active:scale-[0.98] ${isActive("/") ? "bg-red-600 text-white shadow-sm" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span className="font-medium">Dashboard</span>
            </Link>
          )}

          {showConfig && (
            <div className="w-full">
              <button
                onClick={() => handleMobileSectionClick("config", configExpanded)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${isInSection("/configuracion") && !isInSection("/configuracion/usuarios") ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <div className="flex items-center gap-3"><Settings className="w-5 h-5 shrink-0" /><span className="font-medium">Configuración</span></div>
                {configExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {configExpanded && (
                <ul className="ml-8 mt-1 space-y-0.5">
                  {configItems.map(({ to, label }) => {
                    const Icon = Shield;
                    return (
                      <li key={to}>
                        <Link
                          to={to}
                          onClick={handleNavClick}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(to) ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {showUsuarios && (
            <div className="w-full">
              <button
                onClick={() => handleMobileSectionClick("usuarios", usuariosExpanded)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${isInSection("/configuracion/usuarios") ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <div className="flex items-center gap-3"><Users className="w-5 h-5 shrink-0" /><span className="font-medium">Usuarios</span></div>
                {usuariosExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {usuariosExpanded && (
                <ul className="ml-8 mt-1 space-y-0.5">
                  {usuariosItems.map(({ to, label }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={handleNavClick}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(to) ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                      >
                        <Users className="w-4 h-4 shrink-0" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {showCompras && (
            <div className="w-full">
              <button
                onClick={() => handleMobileSectionClick("compras", comprasExpanded)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${isInSection("/compras") ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <div className="flex items-center gap-3"><ShoppingCart className="w-5 h-5 shrink-0" /><span className="font-medium">Compras</span></div>
                {comprasExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {comprasExpanded && (
                <ul className="ml-8 mt-1 space-y-0.5">
                  {comprasItems.map(({ to, label }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={handleNavClick}
                        className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(to) ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {showProduccion && (
            <div className="w-full">
              <button
                onClick={() => handleMobileSectionClick("produccion", produccionExpanded)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${isInSection("/produccion") || produccionPaths.some((p) => isActive(p)) ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <div className="flex items-center gap-3"><ChefHat className="w-5 h-5 shrink-0" /><span className="font-medium">Producción</span></div>
                {produccionExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {produccionExpanded && (
                <ul className="ml-8 mt-1 space-y-0.5">
                  {produccionItems.map(({ to, label }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={handleNavClick}
                        className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(to) ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {showVentas && (
            <div className="w-full">
              <button
                onClick={() => handleMobileSectionClick("ventas", ventasExpanded)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${ventasPaths.includes(location.pathname) ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 shrink-0" /><span className="font-medium">Ventas y POS</span></div>
                {ventasExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {ventasExpanded && (
                <ul className="ml-8 mt-1 space-y-0.5">
                  {ventasItems.map(({ to, label }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={handleNavClick}
                        className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(to) ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="my-3 h-px bg-gray-100 dark:bg-gray-800" />
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-1.5">Cuenta</p>

          <div className="space-y-1">
            <button
              onClick={() => { setSidebarOpen(false); setPerfilOpen(true); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.98] text-left cursor-pointer"
            >
              <UserCircle className="w-5 h-5 shrink-0 text-blue-500" />
              <span className="font-medium">Perfil</span>
            </button>

            <button
              onClick={() => toggleDarkMode()}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              {darkMode ? <Sun className="w-5 h-5 shrink-0 text-yellow-400" /> : <Moon className="w-5 h-5 shrink-0 text-gray-500" />}
              <span className="font-medium flex-1 text-left">Modo Oscuro</span>
              <div className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${darkMode ? "bg-red-600" : "bg-gray-200 dark:bg-gray-700"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-1"}`} />
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>

          <div className="h-4 pb-safe" />
        </nav>
      </aside>
        </>
      )}

      {/* Main column: Persistent Top Header + Scrollable Main Content */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden min-w-0">
        {/* Top Navigation Header (Persistent across all modules & pages) */}
        {/* Navbar contextual de escritorio para Admin/Staff cuando no está en POS */}
        {!showFullTopHeader && (
          <header className="hidden lg:flex flex-col shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 z-30 shadow-2xs select-none">
            <div className="h-0.5 w-full bg-gradient-to-r from-[#c84545] via-amber-400/70 to-[#2e4257]" />
            <div className="px-6 h-14 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Chazin Food
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                <span className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
                  {getPageTitle(location.pathname)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En línea</span>
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {showVentas && (
                  <Link
                    to="/ventas/pos"
                    onMouseEnter={() => prefetchRoute("/ventas/pos")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/50 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Ir al POS</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => toggleDarkMode()}
                  title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  className="w-9 h-9 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPerfilOpen(true)}
                  className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all cursor-pointer"
                  title="Ver mi perfil"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#2e4257] text-white text-xs font-bold flex items-center justify-center">
                    {user?.nombre?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
                    {user?.nombre || "Usuario"}
                  </span>
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Mobile top header para Admin cuando no está en POS (solo móvil < lg) */}
        {!showFullTopHeader && (
          <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 h-14 flex items-center justify-between gap-2 shadow-xs shrink-0 select-none">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-300 active:scale-95 cursor-pointer shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity" title="Ir al inicio">
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-white ring-2 ring-gray-100 dark:ring-gray-700">
                <img src={logoImg} alt="Chazin Food" width="28" height="28" loading="eager" decoding="async" className="w-full h-full object-cover" style={{ objectPosition: "50% 56%" }} />
              </div>
              <div className="min-w-0 text-left">
                <span className="block font-bold text-sm text-gray-800 dark:text-gray-100 tracking-tight leading-tight truncate">
                  {getPageTitle(location.pathname)}
                </span>
                <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 leading-tight truncate">
                  Chazin Food
                </span>
              </div>
            </Link>
            <button
              onClick={() => toggleDarkMode()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-400 active:scale-95 cursor-pointer shrink-0"
              aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Barra superior completa: Siempre para Vendedor, y para Admin ÚNICAMENTE al crear venta (/ventas/pos) */}
        {showFullTopHeader && (
          <header className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 shadow-xs select-none">
            <div className={`flex ${!isAdmin ? "flex-col xl:flex-row xl:items-center" : "flex-row items-center"} justify-between gap-2 sm:gap-3`}>
              {/* Fila superior en móvil/tablet: Brand + Acciones (y Botón Volver para Admin POS) */}
              <div className={`flex items-center justify-between gap-2 min-w-0 ${!isAdmin ? "w-full xl:w-auto" : "w-full"}`}>
                {/* Left: Mobile menu toggle (< lg) + Logo + Dynamic Title */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
                  {!isVendedor && (
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="lg:hidden p-2 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-300 active:scale-95 cursor-pointer shrink-0"
                      aria-label="Abrir menú lateral"
                    >
                      <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )}

                  <Link to="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0 hover:opacity-90 transition-opacity" title="Ir al inicio">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shrink-0 border border-amber-300 bg-white">
                      <img src={logoImg} alt="Chazin Food" width="36" height="36" loading="eager" decoding="async" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-[#A91B2E] dark:text-red-400 uppercase block leading-tight">
                        Chazin Food
                      </span>
                      <h1 className="text-xs sm:text-sm md:text-base font-black text-gray-900 dark:text-gray-100 leading-tight truncate max-w-[140px] sm:max-w-[220px] xl:max-w-none">
                        {getPageTitle(location.pathname)}
                      </h1>
                    </div>
                  </Link>
                </div>

                {/* Admin POS Back Button */}
                {isAdmin && location.pathname === "/ventas/pos" && (
                  <Link
                    to="/ventas/gestion-ventas"
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-[#A91B2E] dark:text-red-400 border border-red-200 dark:border-red-900/60 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                    title="Volver a Gestión de Ventas"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span className="sm:hidden">Volver</span>
                    <span className="hidden sm:inline">Volver a Gestión de Ventas</span>
                  </Link>
                )}

                {/* Right (visible en móvil/tablet junto al logo para Vendedor, y movido al final en xl) */}
                {!isAdmin && (
                  <div className="flex xl:hidden items-center gap-1.5 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 text-xs font-bold text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="truncate max-w-[90px]">{user?.nombre || "Usuario"}</span>
                      <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-[#A91B2E] dark:text-red-400 px-1.5 py-0.5 rounded-md font-black capitalize">
                        {userRol || "Vendedor"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPerfilOpen(true)}
                      title="Mi Perfil"
                      aria-label="Abrir mi perfil"
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-gray-200 dark:border-gray-700"
                    >
                      <UserCircle className="w-5 h-5 text-blue-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDarkMode()}
                      title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                      aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                      className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-gray-200 dark:border-gray-700"
                    >
                      {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Cerrar Sesión"
                      aria-label="Cerrar Sesión"
                      className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-red-200 dark:border-red-900/50"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Center: Navegación agrupada para Vendedor / POS (sin saturación de íconos sueltos) */}
              {!isAdmin && (
                <nav
                  ref={topNavRef}
                  aria-label="Módulos accesibles"
                  className="w-full xl:w-auto xl:min-w-0 flex flex-wrap items-center gap-1.5 bg-gray-100/90 dark:bg-gray-800/90 p-1 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-2xs"
                >
                  <Link
                    to="/ventas/pos"
                    onMouseEnter={() => prefetchRoute("/ventas/pos")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      location.pathname === "/ventas/pos"
                        ? "bg-red-600 text-white shadow-xs font-bold"
                        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 font-semibold"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    <span>Punto de Venta</span>
                  </Link>

                  {topGroupedMenus.map((group) => {
                    const GroupIcon = group.icon;
                    const groupActive = group.isActive(location.pathname);
                    const isOpen = openTopGroup === group.id;
                    return (
                      <div key={group.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenTopGroup(isOpen ? null : group.id)}
                          onMouseEnter={() => prefetchRoutes(group.items.map((i) => i.to))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                            groupActive || isOpen
                              ? "bg-white dark:bg-gray-700 text-red-700 dark:text-red-300 shadow-xs font-bold"
                              : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-700/70 font-semibold"
                          }`}
                        >
                          <GroupIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{group.label}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isOpen && (
                          <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                            {group.items.map((sub) => (
                              <Link
                                key={sub.to}
                                to={sub.to}
                                onClick={() => setOpenTopGroup(null)}
                                className={`block px-3.5 py-2 text-xs font-semibold transition-colors ${
                                  isActive(sub.to)
                                    ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              )}

              {/* Right (Desktop xl+ para Vendedor) */}
              {!isAdmin && (
                <div className="hidden xl:flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 text-xs font-bold text-gray-700 dark:text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="truncate max-w-[120px]">{user?.nombre || "Usuario"}</span>
                    <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-[#A91B2E] dark:text-red-400 px-2 py-0.5 rounded-md font-black capitalize">
                      {userRol || "Vendedor"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPerfilOpen(true)}
                    title="Mi Perfil"
                    aria-label="Abrir mi perfil"
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-gray-200 dark:border-gray-700"
                  >
                    <UserCircle className="w-5 h-5 text-blue-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleDarkMode()}
                    title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-gray-200 dark:border-gray-700"
                  >
                    {darkMode ? (
                      <Sun className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Cerrar Sesión"
                    aria-label="Cerrar Sesión"
                    className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-red-200 dark:border-red-900/50"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Main scrollable body — Suspense local evita desmontar Sidebar/Header al cambiar de módulo */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-950">
          <Suspense fallback={<PageTransitionSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Modal de perfil staff */}
      {perfilOpen && (
        <Suspense fallback={null}>
          <MiPerfilModal isOpen={perfilOpen} onClose={() => setPerfilOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
