import { useState, useMemo, useEffect } from "react";
import {
  X,
  HelpCircle,
  Search,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  ChefHat,
  TrendingUp,
  Package,
  Users,
  RotateCcw,
  Store,
  Briefcase,
  LayoutDashboard,
  ShoppingCart,
  Info
} from "lucide-react";

const HELP_MODULES = [
  {
    id: "tienda",
    title: "Tienda Online y Pedidos",
    audience: "cliente",
    icon: ShoppingBag,
    summary: "Cómo explorar el menú, armar tu carrito, pagar por Wompi y hacer seguimiento a tu pedido.",
    steps: [
      "Selecciona cualquier producto del catálogo para abrir su vista independiente de detalle, elegir variante/tamaño y personalizar toppings o adiciones.",
      "Agrega productos al carrito y verifica las cantidades; el resumen muestra el subtotal de productos y especifica que el costo del domicilio se paga por aparte al domiciliario.",
      "En el checkout ingresa tu teléfono de contacto y dirección en Medellín, acepta los Términos y Condiciones y la Política de Tratamiento de Datos (Ley 1581 de 2012) y paga de forma segura con Wompi.",
      "Mientras tu pedido aún no haya entrado a preparación en cocina, puedes agregar productos adicionales al mismo pedido desde tu historial."
    ],
    rules: [
      "Los pagos en línea con Wompi (Nequi, PSE, Bancolombia o tarjetas) se confirman automáticamente sin aprobación manual.",
      "Los nombres homónimos están permitidos al registrarse; cada cuenta se identifica de forma única por su documento y correo electrónico."
    ]
  },
  {
    id: "dashboard",
    title: "Dashboard e Indicadores",
    audience: "admin",
    icon: LayoutDashboard,
    summary: "Interpretación rápida de KPIs comerciales, balance operativo mensual y alertas de stock crítico.",
    steps: [
      "Revisa en la parte superior las ventas del período, clientes activos y el bloque consolidado de Stock Crítico.",
      "Analiza el Balance Operativo Mensual (ingresos por ventas menos compras de insumos) y el ranking de productos más vendidos.",
      "Haz clic en los accesos directos para ir directamente a reabastecer insumos críticos o consultar reportes detallados."
    ],
    rules: [
      "Las cifras monetarias se expresan en pesos colombianos (COP) y se sincronizan en tiempo real con ventas y devoluciones."
    ]
  },
  {
    id: "roles_usuarios",
    title: "Roles, Permisos y Usuarios",
    audience: "admin",
    icon: ShieldCheck,
    summary: "Control de acceso multiusuario, privilegios granulares y protección del rol Administrador.",
    steps: [
      "En Gestión de Roles puedes crear roles operativos personalizados y asignar permisos granulares (Ver, Crear, Editar, Eliminar) por módulo.",
      "El rol Administrador es un rol del sistema protegido: se lista en modo solo consulta (Ver detalle) y no puede editarse, inactivarse ni eliminarse.",
      "En Gestión de Usuarios registra colaboradores o cuentas con su rol asignado y confirma la autorización de tratamiento de datos (Ley 1581 de 2012)."
    ],
    rules: [
      "Se permiten nombres homónimos en usuarios y clientes; la validación de unicidad aplica únicamente a documento de identidad y correo."
    ]
  },
  {
    id: "insumos",
    title: "Insumos y Recetas Preparadas",
    audience: "admin",
    icon: Package,
    summary: "Gestión de insumos base, preparados con ficha técnica, toppings editables y control de stock.",
    steps: [
      "Crea insumos base definiendo categoría, unidad de medida, stock mínimo y capacidad máxima (stock máximo siempre mayor al mínimo).",
      "Para insumos elaborados (Preparados), define sus ingredientes en la ficha técnica y el rendimiento resultante.",
      "Marca insumos como Adición/Topping para habilitar su personalización en los productos del catálogo."
    ],
    rules: [
      "Los lotes se descuentan por orden de vencimiento más próximo (FEFO) y los insumos con stock crítico se resaltan automáticamente en los reportes."
    ]
  },
  {
    id: "compras",
    title: "Compras y Proveedores",
    audience: "admin",
    icon: ShoppingCart,
    summary: "Registro de facturas de compra, validación de fechas y trazabilidad de lotes de ingreso.",
    steps: [
      "Selecciona un proveedor activo, ingresa el número de factura y verifica que la fecha corresponda al día actual (hora Colombia).",
      "Agrega los insumos comprados con su cantidad, costo unitario y, cuando aplique, número de lote y fecha de vencimiento vigente.",
      "Al guardar, el inventario y la trazabilidad se actualizan automáticamente."
    ],
    rules: [
      "El sistema no permite registrar compras con fecha anterior ni posterior al día actual ni lotes ya vencidos."
    ]
  },
  {
    id: "productos",
    title: "Productos, Fichas Técnicas y Eventos",
    audience: "admin",
    icon: Store,
    summary: "Configuración del menú, variantes, fichas técnicas con cantidad exacta y promociones/eventos.",
    steps: [
      "Crea productos con imagen optimizada, categoría, variantes y precio de venta.",
      "Configura la ficha técnica indicando la cantidad exacta de cada insumo requerido por porción.",
      "En Eventos y Promociones define fechas de vigencia y descuentos; los productos en evento se distinguen con una etiqueta/badge sin saturar toda la fila."
    ],
    rules: [
      "Los toppings/adiciones asociados a un producto son editables en cualquier momento desde la ficha del producto."
    ]
  },
  {
    id: "empleados",
    title: "Empleados y Contratos",
    audience: "admin",
    icon: Briefcase,
    summary: "Administración del personal, roles operativos y reglas de fechas según modalidad de contrato.",
    steps: [
      "Registra los datos de identificación (permitiendo homónimos), cargo/rol, turno, salario mensual y estado operativo (Activo, Incapacitado o Inactivo).",
      "Selecciona el tipo de contrato: en Término Indefinido la fecha de finalización queda deshabilitada automáticamente; en Término Fijo es obligatoria y debe ser posterior a la fecha de inicio.",
      "Exporta la nómina a Excel corporativo con fórmulas automáticas de sumatoria salarial."
    ],
    rules: [
      "Todo registro de nuevo colaborador requiere confirmar la autorización de tratamiento de datos personales (Ley 1581 de 2012)."
    ]
  },
  {
    id: "produccion",
    title: "Producción y Cocina (KDS)",
    audience: "admin",
    icon: ChefHat,
    summary: "Control de comandas en cocina con listado limpio y vista completa de detalle por orden.",
    steps: [
      "El listado principal muestra los datos esenciales de cada orden para evitar saturación visual.",
      "Pulsa 'Ver detalle' en cualquier orden para consultar toppings, observaciones del cliente, tiempos y desglose completo.",
      "Actualiza el estado de la orden progresivamente: En Cola → Preparando → Listo → Entregado."
    ],
    rules: [
      "Una vez que una orden pasa a estado Preparando o superior, se bloquea la adición de nuevos productos al mismo pedido para evitar descuadres en cocina."
    ]
  },
  {
    id: "ventas_pos",
    title: "Punto de Venta (POS) y Ventas",
    audience: "admin",
    icon: TrendingUp,
    summary: "Registro rápido de ventas en local, seguimiento de pedidos online y adición pre-cocina.",
    steps: [
      "Desde Punto de Venta (POS) selecciona productos, cliente (opcional) y método de pago físico para facturar de inmediato.",
      "En Gestión de Ventas consulta el historial por período, canal, método de pago o tipo de entrega.",
      "Mientras un pedido siga en estado Pendiente / En Cola, puedes usar la opción de agregar productos adicionales a ese mismo pedido."
    ],
    rules: [
      "Las ventas online con Wompi actualizan su estado de pago automáticamente vía pasarela; no existe aprobación manual."
    ]
  },
  {
    id: "reportes_devoluciones",
    title: "Devoluciones, Reembolsos y Reportes",
    audience: "admin",
    icon: RotateCcw,
    summary: "Conciliación financiera real (Bruto − Reembolsos = Neto), filtros por fechas y exportaciones PDF/Excel.",
    steps: [
      "Registra devoluciones indicando los productos afectados y el tipo de resolución (reembolso en dinero o cambio/reposición).",
      "En Reportes de Ventas filtra por rango de fechas exacto, canal, método de pago, producto o estado de devolución.",
      "Exporta a PDF corporativo con logotipo o a Excel multi-hoja (.xlsx) con Resumen Ejecutivo, Cuadre por Producto, Devoluciones e Histórico Mensual con fórmulas automáticas."
    ],
    rules: [
      "Los totales netos de ingresos y unidades siempre descuentan automáticamente las devoluciones y reembolsos confirmados."
    ]
  }
];

function detectModuleFromPath(pathname = "") {
  const p = String(pathname || "").toLowerCase();
  if (p.startsWith("/tienda") || p.startsWith("/producto") || p.startsWith("/mi-perfil")) return "tienda";
  if (p.startsWith("/configuracion/roles") || p.startsWith("/configuracion/usuarios")) return "roles_usuarios";
  if (p.startsWith("/compras/insumos") || p.startsWith("/compras/categoria-insumos")) return "insumos";
  if (p.startsWith("/compras/gestion") || p.startsWith("/compras/proveedores")) return "compras";
  if (p.startsWith("/ventas/productos") || p.startsWith("/ventas/categoria-productos")) return "productos";
  if (p.startsWith("/produccion/empleados")) return "empleados";
  if (p.startsWith("/produccion/gestion") || p.startsWith("/cocinero")) return "produccion";
  if (p.startsWith("/ventas/devoluciones")) return "reportes_devoluciones";
  if (p.startsWith("/ventas/pos") || p.startsWith("/ventas/gestion-ventas")) return "ventas_pos";
  if (p === "/") return "dashboard";
  return "tienda";
}

export function AyudaEnLineaModal({
  isOpen,
  onClose,
  currentPath = "/",
  initialModule = null,
  audience = "all" // "all" | "cliente" | "admin"
}) {
  const availableModules = useMemo(() => {
    if (audience === "cliente") {
      return HELP_MODULES.filter((m) => m.audience === "cliente" || m.id === "reportes_devoluciones");
    }
    return HELP_MODULES;
  }, [audience]);

  const resolvedDefault = useMemo(() => {
    const target = initialModule || detectModuleFromPath(currentPath);
    return availableModules.some((m) => m.id === target)
      ? target
      : availableModules[0]?.id || "tienda";
  }, [initialModule, currentPath, availableModules]);

  const [selectedId, setSelectedId] = useState(resolvedDefault);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedId(resolvedDefault);
      setSearch("");
    }
  }, [isOpen, resolvedDefault]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableModules;
    return availableModules.filter((m) => {
      const text = `${m.title} ${m.summary} ${m.steps.join(" ")} ${m.rules.join(" ")}`.toLowerCase();
      return text.includes(q);
    });
  }, [availableModules, search]);

  const activeModule = useMemo(() => {
    return (
      filteredModules.find((m) => m.id === selectedId) ||
      filteredModules[0] ||
      availableModules[0]
    );
  }, [filteredModules, selectedId, availableModules]);

  if (!isOpen) return null;

  const ActiveIcon = activeModule?.icon || BookOpen;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ayuda-en-linea-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[88dvh] shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#1E293B] via-[#2B3B50] to-[#30475E] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 id="ayuda-en-linea-title" className="text-base sm:text-lg font-extrabold leading-tight truncate">
                Centro de Ayuda en Línea — Chazin Food
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                Guía interactiva contextual por módulo, reglas de negocio y preguntas frecuentes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar centro de ayuda"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tema de ayuda (ej: Wompi, devoluciones, Excel, contratos, stock, homónimos)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C84545]/40"
            />
          </div>
        </div>

        {/* Body: Sidebar de módulos + Detalle */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Lista de módulos */}
          <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 overflow-x-auto md:overflow-y-auto bg-gray-50/50 dark:bg-gray-900/60 p-2.5 flex md:flex-col gap-1">
            {filteredModules.length === 0 ? (
              <p className="text-xs text-gray-400 p-3">Sin resultados para &ldquo;{search}&rdquo;.</p>
            ) : (
              filteredModules.map((mod) => {
                const Icon = mod.icon;
                const active = activeModule?.id === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedId(mod.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all shrink-0 md:shrink cursor-pointer ${
                      active
                        ? "bg-red-50 dark:bg-red-950/40 text-[#B91C1C] dark:text-red-300 border border-red-200/80 dark:border-red-900/50 shadow-2xs"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{mod.title}</span>
                  </button>
                );
              })
            )}
          </aside>

          {/* Contenido del módulo activo */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {activeModule && (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#C84545] dark:text-red-400 border border-red-100 dark:border-red-900/40 flex items-center justify-center shrink-0">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 mb-1">
                      Guía del Módulo
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-gray-100">
                      {activeModule.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {activeModule.summary}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#C84545]" />
                    <span>Paso a paso</span>
                  </h4>
                  <ol className="space-y-2">
                    {activeModule.steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#1E293B] dark:bg-red-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {activeModule.rules?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Reglas clave y validaciones</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-emerald-900/90 dark:text-emerald-200/90">
                      {activeModule.rules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Soporte técnico Chazin Food · Cl. 21 #80-21, Belén, Medellín
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-800 dark:bg-red-600 dark:hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export default AyudaEnLineaModal;
