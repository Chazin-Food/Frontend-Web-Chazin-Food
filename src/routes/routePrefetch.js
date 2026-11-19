// Mapa centralizado de importadores dinámicos por ruta para Code Splitting y Prefetch al hover/touch
export const routeImporters = {
  "/": () => import("@/features/panel-principal/paginas/Dashboard"),
  "/compras/categoria-insumos": () => import("@/features/compras/paginas/CategoriaInsumos"),
  "/compras/insumos": () => import("@/features/compras/paginas/Insumos"),
  "/compras/proveedores": () => import("@/features/compras/paginas/Proveedores"),
  "/compras/gestion": () => import("@/features/compras/paginas/GestionCompras"),
  "/ventas/categoria-productos": () => import("@/features/ventas/paginas/CategoriaProductos"),
  "/ventas/productos": () => import("@/features/ventas/paginas/Productos"),
  "/ventas/fichas-tecnicas": () => import("@/features/fichas-tecnicas/paginas/FichasTecnicas"),
  "/fichas-tecnicas": () => import("@/features/fichas-tecnicas/paginas/FichasTecnicas"),
  "/produccion/empleados": () => import("@/features/produccion/paginas/Empleados"),
  "/produccion/gestion": () => import("@/features/produccion/paginas/GestionProduccion"),
  "/ventas/clientes": () => import("@/features/ventas/paginas/Clientes"),
  "/ventas/gestion-ventas": () => import("@/features/ventas/paginas/GestionVentas"),
  "/ventas/devoluciones": () => import("@/features/ventas/paginas/Devoluciones"),
  "/ventas/pos": () => import("@/features/pos/paginas/PosVendedor"),
  "/configuracion/roles": () => import("@/features/configuracion/paginas/Roles"),
  "/configuracion/usuarios": () => import("@/features/configuracion/paginas/Usuarios"),
  "/perfil": () => import("@/features/cliente/paginas/ClientePerfil"),
  "/tienda": () => import("@/features/cliente/paginas/ClienteLanding"),
  "/cliente": () => import("@/features/cliente/paginas/ClienteLanding"),
};

const prefetchedRoutes = new Set();

function normalizeRoutePath(path) {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Precarga silenciosamente el chunk JS de una ruta (solo una vez por sesión).
 * Ideal para onMouseEnter / onFocus / onTouchStart en enlaces de navegación.
 */
export function prefetchRoute(path) {
  const key = normalizeRoutePath(path);
  if (prefetchedRoutes.has(key)) return;
  const loader = routeImporters[key];
  if (!loader) return;
  prefetchedRoutes.add(key);
  loader().catch(() => {
    prefetchedRoutes.delete(key);
  });
}

/**
 * Precarga un lote de rutas (por ejemplo al expandir una sección del menú lateral).
 */
export function prefetchRoutes(paths = []) {
  if (typeof navigator !== "undefined" && navigator.connection?.saveData) return;
  for (const p of paths) {
    prefetchRoute(p);
  }
}
