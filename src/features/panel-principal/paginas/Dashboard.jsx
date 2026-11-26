import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  AlertCircle,
  Settings,
  ChevronRight,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  Star,
  MessageSquare,
  Heart,
  RotateCcw
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { formatTime12h } from "@/shared/utils/dateUtils";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { hasPrivilege } from "@/shared/utils/privilegiosUtils";

function StatVariation({ value, label = "vs mes anterior" }) {
  const num = Number(value || 0);
  if (num > 0) {
    return (
      <p className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
        <span>+{num}% {label}</span>
      </p>
    );
  }
  if (num < 0) {
    return (
      <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1">
        <TrendingDown className="w-3.5 h-3.5 shrink-0" />
        <span>{num}% {label}</span>
      </p>
    );
  }
  return (
    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium flex items-center gap-1">
      <Minus className="w-3.5 h-3.5 shrink-0" />
      <span>0% {label}</span>
    </p>
  );
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const obs = new MutationObserver(
      () => setIsDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

const defaultVentasData = [];
const defaultProductosPopulares = [];
const defaultAlertasStock = [];

const quickAccess = [
  {
    icon: ShoppingCart,
    label: "Compras",
    sub: "Gestión de insumos",
    to: "/compras/gestion",
    iconBg: "bg-[#30475E]"
  },
  {
    icon: TrendingUp,
    label: "Ventas",
    sub: "Gestión comercial",
    to: "/ventas/gestion-ventas",
    iconBg: "bg-red-500"
  },
  {
    icon: Users,
    label: "Usuarios",
    sub: "Administrar accesos",
    to: "/configuracion/usuarios",
    iconBg: "bg-purple-500"
  },
  {
    icon: Settings,
    label: "Configuración",
    sub: "Roles y permisos",
    to: "/configuracion/roles",
    iconBg: "bg-gray-600"
  }
];

function CustomProductoTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload || {};
    const nombre = data.nombreLimpio || data.nombre || "Producto";
    const qty = Number(data.ventas || payload[0].value || 0);
    const unitPrice = Number(data.precioUnitario || 0);
    const totalVentas = Number(data.ingresos || (qty * unitPrice) || 0);
    const pct = data.porcentaje || 0;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 p-3.5 rounded-2xl shadow-xl text-xs space-y-1 animate-in fade-in duration-150 min-w-[210px]">
        <p className="font-extrabold text-gray-900 dark:text-gray-100 text-sm leading-snug">
          {nombre}
        </p>
        <p className="font-extrabold text-[#10B981] text-sm">
          Unidades vendidas: {qty} {qty === 1 ? "unidad" : "unidades"}
        </p>
        {totalVentas > 0 && (
          <p className="font-bold text-teal-600 dark:text-teal-400 text-xs">
            Total facturado: ${totalVentas.toLocaleString("es-CO")} COP
          </p>
        )}
        {unitPrice > 0 && (
          <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">
            Precio unitario: ${unitPrice.toLocaleString("es-CO")} COP c/u
          </p>
        )}
        {pct > 0 && (
          <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold">
            Representación: {pct}% del total de platos vendidos
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function Dashboard() {
  const isDark = useDarkMode();
  const { user } = useAuth();
  const canViewDevoluciones =
    hasPrivilege(user, "Devoluciones", "ver") ||
    hasPrivilege(user, "Gestión de Ventas", "ver") ||
    hasPrivilege(user, "Ventas", "ver");
  const {
    stats,
    ventasChart,
    productosPopulares,
    alertasStock,
    ventasRecientes,
    devolucionesPendientes,
    comentariosObservaciones,
    periodo,
    setPeriodo,
    year,
    setYear
  } = useDashboardStats();
  const pendingDevoluciones = Array.isArray(devolucionesPendientes) ? devolucionesPendientes : [];

  const axisColor = isDark ? "#e0ecf8" : "#374151";
  const axisColorMuted = isDark ? "#b8cde0" : "#6b7280";
  const comprasColor = isDark ? "#818cf8" : "#4f46e5";
  const ventasColor = isDark ? "#4ade80" : "#16a34a";
  const tooltipStyle = {
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.15)",
    backgroundColor: isDark ? "#1f2937" : "#ffffff",
    color: isDark ? "#f3f4f6" : "#111827",
    padding: "10px 14px"
  };
  const tooltipLabelStyle = { color: isDark ? "#f3f4f6" : "#111827", fontWeight: 700 };
  const tooltipItemStyle = { color: isDark ? "#e5e7eb" : "#374151" };

  const finalVentasData = Array.isArray(ventasChart) && ventasChart.length > 0 ? ventasChart : defaultVentasData;
  const finalPopulares = Array.isArray(productosPopulares) && productosPopulares.length > 0 ? productosPopulares : defaultProductosPopulares;

  const totalPopularesUnidades = finalPopulares.reduce((acc, p) => acc + (Number(p.ventas || p.cantidad) || 0), 0);

  const enrichedPopulares = finalPopulares
    .map((p) => {
      const cleanName = (p.nombre || "").replace(/\s*\(.*?\)/g, "").replace(/\s*-\s*base/i, "").trim();
      const qty = Number(p.ventas || p.cantidad || 0);

      const unitPrice = Number(p.precioUnitario || 0);
      const totalIngresos = Number(p.ingresos > 0 ? p.ingresos : (qty * unitPrice));
      const backendPct = Number(p.porcentaje);
      const pct = Number.isFinite(backendPct) && backendPct > 0
        ? backendPct
        : (totalPopularesUnidades > 0 ? Number(((qty / totalPopularesUnidades) * 100).toFixed(1)) : 0);

      return {
        ...p,
        nombreLimpio: cleanName,
        nombreShort: cleanName,
        ventas: qty,
        precioUnitario: unitPrice,
        ingresos: totalIngresos,
        porcentaje: pct
      };
    })
    .sort((a, b) => {
      if (b.ventas !== a.ventas) return b.ventas - a.ventas;
      if (b.porcentaje !== a.porcentaje) return b.porcentaje - a.porcentaje;
      return (b.ingresos || 0) - (a.ingresos || 0);
    });

  // Ticks para el eje X en unidades enteras (0, 1, 2, 3...) sin decimales
  const maxVentas = Math.max(1, ...enrichedPopulares.map(p => Number(p.ventas) || 0));
  const xAxisTicks = (() => {
    if (maxVentas <= 6) {
      return Array.from({ length: maxVentas + 1 }, (_, i) => i);
    }
    const step = Math.ceil(maxVentas / 5);
    const ticks = [];
    for (let i = 0; i <= maxVentas; i += step) {
      ticks.push(i);
    }
    if (ticks[ticks.length - 1] < maxVentas) {
      ticks.push(ticks[ticks.length - 1] + step);
    }
    return ticks;
  })();
  const maxTick = xAxisTicks[xAxisTicks.length - 1] || maxVentas;

  // Filtrar estrictamente comandas en cola, preparación o ventas online pendientes de aprobación (nada de listos ni entregados)
  const platosEnCurso = (Array.isArray(ventasRecientes) ? ventasRecientes : []).filter((v) => {
    const st = String(v.estado || '').toLowerCase().trim();
    const stEnt = String(v.estadoEntrega || '').toLowerCase().trim();
    const stAprob = String(v.estadoAprobacion || '').toLowerCase().trim();

    // Excluir órdenes listas, entregadas, completadas, canceladas o rechazadas
    if (st.includes('list') || stEnt.includes('list')) return false;
    if (st.includes('complet') || st.includes('entreg') || st.includes('despach')) return false;
    if (stEnt.includes('complet') || stEnt.includes('entreg') || stEnt.includes('despach') || stEnt.includes('camino')) return false;
    if (st.includes('anul') || st.includes('cancel') || stEnt.includes('cancel') || stAprob.includes('rechaz')) return false;

    // Solo aceptar: cola, preparación, cocina, o ventas online pendientes de aprobación
    const isEnCola = st.includes('cola') || stEnt.includes('cola') || st.includes('pendiente') || stEnt.includes('pend');
    const isPreparacion = st.includes('prepar') || stEnt.includes('prepar') || st.includes('cocina') || st.includes('produc');
    const isOnlinePendienteAprobacion = (
      (v.tipoVenta === 'Online' || v.origen === 'ONLINE' || v.origenNombre === 'Venta Online') &&
      (stAprob.includes('pend') || v.pagoAprobado === false || st.includes('pend'))
    );

    return isEnCola || isPreparacion || isOnlinePendienteAprobacion;
  });

  const finalAlertas = Array.isArray(alertasStock) && alertasStock.length > 0 ? alertasStock : defaultAlertasStock;

  const periods = [
    { id: "hoy", label: "Hoy" },
    { id: "7_dias", label: "7 días" },
    { id: "este_mes", label: "Este mes" },
    { id: "este_ano", label: "Este año" },
    { id: "todos", label: "Histórico" }
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-950 min-h-full space-y-6">

      {/* ── Header con Filtro Global de Período y Año (Ítem 37) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            Panel de Control
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Indicadores financieros, stock crítico y métricas operativas en tiempo real
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-2xs w-full md:w-auto max-w-full">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar touch-scroll-x">
            {periods.map((p) => {
              const isSelected = periodo === p.id;
              return (
                <button
                  key={p.id}
                  id={`filter-periodo-${p.id}`}
                  type="button"
                  onClick={() => setPeriodo(p.id)}
                  aria-pressed={isSelected}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? "bg-red-500 text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

          {/* Selector de Año */}
          <div className="flex items-center gap-1 pl-1">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              id="select-filter-year"
              value={year}
              onChange={(e) => {
                const selectedYear = Number(e.target.value);
                setYear(selectedYear);
                setPeriodo("este_ano");
              }}
              aria-label="Filtrar por año"
              className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 py-1 px-1 rounded-lg border-0 outline-none cursor-pointer focus:ring-1 focus:ring-red-500/50"
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2, new Date().getFullYear() - 3].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Mobile Quick Access (solo móviles) ── */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acceso Rápido</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quickAccess.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-2xs border border-gray-100 dark:border-gray-800 flex flex-col gap-2.5 active:scale-95 transition-transform"
            >
              <div className={`${item.iconBg} w-9 h-9 rounded-xl flex items-center justify-center shrink-0`}>
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── KPI Cards Rediseñadas (Ítems 29, 30 y 31) ── */}
      {/* 5 Tarjetas simétricas con divisa COP explícita y distribución equilibrada (Ítem #29) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">

        {/* 1. Total de Ventas (COP) - Ítem 31 y 30 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Total de ventas (COP)
              </span>
              <span
                title={`$${Number(stats.totalVentasGlobal ?? stats.ventasTotal ?? 0).toLocaleString("es-CO")} COP`}
                className="text-base sm:text-lg xl:text-xl font-extrabold text-gray-900 dark:text-gray-100 block tracking-tight leading-snug break-words"
              >
                ${Number(stats.totalVentasGlobal ?? stats.ventasTotal ?? 0).toLocaleString("es-CO")} <span className="text-xs font-bold text-gray-400 dark:text-gray-500">COP</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              COP Divisa Oficial
            </span>
            <span className="text-gray-400 dark:text-gray-500 font-medium text-[11px]">Acumulado</span>
          </div>
        </div>

        {/* 2. Ventas del Período / Mes (COP) - Ítem 30 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Ventas del Período (COP)
              </span>
              <span
                title={`$${Number(stats.ventasTotal || 0).toLocaleString("es-CO")} COP`}
                className="text-base sm:text-lg xl:text-xl font-extrabold text-gray-900 dark:text-gray-100 block tracking-tight leading-snug break-words"
              >
                ${Number(stats.ventasTotal || 0).toLocaleString("es-CO")} <span className="text-xs font-bold text-gray-400 dark:text-gray-500">COP</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100/80 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
              <DollarSign className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between text-xs">
            <StatVariation value={stats.ventasVariacion} label={stats.labelVariacion} />
            <span className="text-gray-400 dark:text-gray-500 font-medium text-[11px]">COP</span>
          </div>
        </div>

        {/* 3. Pedidos del Período */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Pedidos del Período
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-gray-100 block tracking-tight truncate">
                {Number(stats.pedidosTotal || 0).toLocaleString("es-CO")}
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-100/80 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between text-xs">
            <StatVariation value={stats.pedidosVariacion} label={stats.labelVariacion} />
            {stats.frecuenciaVentas !== undefined && (
              <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
                <Zap className="w-3 h-3 text-blue-500 shrink-0" />
                <span>{Number(stats.frecuenciaVentas || 0).toFixed(1)} ventas/día</span>
              </span>
            )}
          </div>
        </div>

        {/* 4. Clientes y Usuarios */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Clientes y Usuarios
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-gray-100 block tracking-tight truncate">
                {Number(stats.clientesTotal || 0).toLocaleString("es-CO")}{" "}
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                  {Number(stats.clientesTotal || 0) === 1 ? "cliente" : "clientes"}
                </span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-100/80 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between text-xs gap-2">
            <span className="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md text-[11px] truncate">
              {Number(stats.usuariosTotal || 0).toLocaleString("es-CO")} usuarios
            </span>
            <span className="text-gray-400 dark:text-gray-500 font-medium text-[11px] truncate">
              {Number(stats.clientesActivos ?? stats.clientesTotal ?? 0).toLocaleString("es-CO")} activos
            </span>
          </div>
        </div>

        {/* 5. Insumos en Stock Crítico */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Stock Crítico
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-gray-100 block tracking-tight truncate">
                {stats.insumosBajoStock || 0}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-2xl ${Number(stats.insumosBajoStock || 0) > 0 ? "bg-rose-100/80 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" : "bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"} flex items-center justify-center shrink-0 shadow-2xs`}>
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between text-xs">
            <span className={`font-semibold ${Number(stats.insumosBajoStock || 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {Number(stats.insumosBajoStock || 0) > 0 ? "Insumos bajo mínimo" : "Inventario al día"}
            </span>
            <Link to="/compras/insumos" className="text-gray-400 hover:text-red-500 transition-colors text-[11px] font-medium">
              Ver
            </Link>
          </div>
        </div>

      </div>

      {/* ── Solicitudes de Devolución Pendientes por Revisión (renderizado estrictamente condicional) ── */}
      {pendingDevoluciones.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xs border p-4 sm:p-5 border-amber-200/90 dark:border-amber-800/60 min-w-0 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-amber-100/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/50">
                <RotateCcw className="w-4 h-4 stroke-[2.3]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight">
                  Solicitudes de Devolución en Espera de Revisión
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Haz clic en una solicitud para abrirla directamente en Devoluciones y confirmarla, rechazarla o revisarla
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  {pendingDevoluciones.length}{" "}
                  {pendingDevoluciones.length === 1 ? "pendiente por revisar" : "pendientes por revisar"}
                </span>
              </span>
              {canViewDevoluciones && (
                <Link
                  to="/ventas/devoluciones?estado=PENDIENTE"
                  className="text-xs text-red-600 dark:text-red-400 inline-flex items-center gap-0.5 hover:underline font-bold whitespace-nowrap"
                >
                  <span>Ver todas</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          <div
            className={`grid grid-cols-1 ${pendingDevoluciones.length > 1 ? "lg:grid-cols-2" : ""} gap-3 max-h-[290px] overflow-y-auto custom-modal-scrollbar pr-1`}
          >
            {pendingDevoluciones.map((dev, idx) => {
              const idDev = dev.idDevolucion || dev.id;
              const codigoDev = dev.codigoDevolucion || `DEV-${String(idDev || 0).padStart(4, "0")}`;
              const codigoVen = dev.codigoVenta || (dev.idVenta ? `VEN-${String(dev.idVenta).padStart(4, "0")}` : "");
              const clienteLabel = dev.clienteNombre || "Cliente General";
              const valorDev = Number(dev.valorDevuelto || 0);
              const fechaTexto = dev.fecha
                ? `${new Date(dev.fecha).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "short"
                  })} · ${formatTime12h(dev.fecha)}`
                : (dev.fechaFormatted || "");

              const cardInner = (
                <>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap shrink-0">
                        {codigoDev}
                      </span>
                      {codigoVen && (
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full border border-gray-200/80 dark:border-gray-700 whitespace-nowrap shrink-0">
                          {codigoVen}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 whitespace-nowrap shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Pendiente por revisión</span>
                      </span>
                    </div>
                    {fechaTexto && (
                      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">
                        {fechaTexto}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs min-w-0 overflow-hidden">
                        <span
                          className="font-bold text-gray-800 dark:text-gray-100 truncate min-w-0"
                          title={clienteLabel}
                        >
                          {clienteLabel}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600 shrink-0">·</span>
                        <span
                          className="text-rose-600 dark:text-rose-400 font-semibold truncate shrink-0 max-w-[55%]"
                          title={dev.motivo}
                        >
                          {dev.motivo}
                        </span>
                      </div>
                      <p
                        className="text-[11px] text-gray-500 dark:text-gray-400 truncate"
                        title={`${dev.tipoResolucion || ""}${dev.productosResumen ? ` · ${dev.productosResumen}` : ""}`}
                      >
                        <span className="font-semibold text-gray-600 dark:text-gray-300">{dev.tipoResolucion}</span>
                        {dev.productosResumen ? ` · ${dev.productosResumen}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right hidden sm:block">
                        {valorDev > 0 ? (
                          <>
                            <p className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
                              ${valorDev.toLocaleString("es-CO")}
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">COP</p>
                          </>
                        ) : (
                          <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-200/80 dark:border-sky-800/60 whitespace-nowrap">
                            Reposición
                          </span>
                        )}
                      </div>
                      {canViewDevoluciones && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 group-hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition-colors whitespace-nowrap">
                          <span>Revisar</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              if (canViewDevoluciones && idDev) {
                return (
                  <Link
                    key={idDev || idx}
                    to={`/ventas/devoluciones?ver=${idDev}`}
                    className="group p-3.5 bg-amber-50/50 dark:bg-amber-950/15 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-700 transition-all space-y-2 min-w-0 block focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    {cardInner}
                  </Link>
                );
              }

              return (
                <div
                  key={idDev || idx}
                  className="p-3.5 bg-amber-50/50 dark:bg-amber-950/15 rounded-xl border border-amber-200/80 dark:border-amber-900/50 space-y-2 min-w-0"
                >
                  {cardInner}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Charts Grid (Ítems 32 y 33) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">

        {/* 1. Compras y Ventas - Nomenclatura corregida (Ítem 33) */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base">Compras y Ventas</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Flujo monetario comparativo en COP</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              Valores en COP
            </span>
          </div>

          {finalVentasData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={finalVentasData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#f1f5f9"} />
                <XAxis dataKey="mes" tick={{ fill: axisColorMuted, fontSize: 11 }} />
                <YAxis
                  tick={{ fill: axisColorMuted, fontSize: 10 }}
                  width={72}
                  tickFormatter={(val) => {
                    if (!val || val === 0) return "$ 0";
                    if (val >= 1000000) return `$ ${(val / 1000000).toLocaleString("es-CO", { maximumFractionDigits: 1 })}M COP`;
                    return `$ ${val.toLocaleString("es-CO")}`;
                  }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value, name) => [`$${Number(value || 0).toLocaleString("es-CO")} COP`, name || "Monto"]}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                {/* Etiquetas Compras y Ventas (Ítem 33) */}
                <Area type="monotone" dataKey="ventas" name="Ventas" stroke={ventasColor} strokeWidth={2.5} fill={ventasColor} fillOpacity={0.18} />
                <Area type="monotone" dataKey="compras" name="Compras" stroke={comprasColor} strokeWidth={2.5} fill={comprasColor} fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-gray-400 dark:text-gray-600 text-sm">
              Sin datos de compras y ventas para este período
            </div>
          )}
        </div>

        {/* 2. Productos más vendidos - Ejes X e Y etiquetados con escala entera */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base">Productos más vendidos</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Top 5 platos con mayor volumen de ventas en el período</p>
            </div>
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
              Unidades Vendidas
            </span>
          </div>

          {enrichedPopulares.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={enrichedPopulares}
                margin={{ top: 10, right: 16, left: 4, bottom: 26 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "#374151" : "#f1f5f9"} />
                {/* Eje X con aumento entero exacto de unidades sin decimales */}
                <XAxis
                  type="number"
                  allowDecimals={false}
                  domain={[0, maxTick]}
                  ticks={xAxisTicks}
                  interval={0}
                  tick={{ fontSize: 10, fill: axisColorMuted }}
                  tickFormatter={(val) => Math.round(val)}
                  label={{
                    value: "Unidades vendidas (número de productos)",
                    position: "insideBottom",
                    offset: -16,
                    fill: axisColorMuted,
                    fontSize: 11,
                    fontWeight: 600
                  }}
                />
                {/* Eje Y Etiquetado claramente (Ítem 32) */}
                <YAxis
                  type="category"
                  dataKey="nombreShort"
                  width={102}
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickLine={false}
                  tickFormatter={(val) => (val && val.length > 18 ? `${val.substring(0, 16)}...` : val)}
                  label={{
                    value: "Productos",
                    angle: -90,
                    position: "insideLeft",
                    offset: -8,
                    fill: axisColorMuted,
                    fontSize: 11,
                    fontWeight: 600
                  }}
                />
                {/* Mini-tarjeta interactiva con toda la información al pasar el cursor */}
                <Tooltip
                  content={<CustomProductoTooltip />}
                  cursor={{ fill: "rgba(156, 163, 175, 0.12)" }}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 1000, pointerEvents: "none" }}
                />
                <Bar dataKey="ventas" radius={[0, 6, 6, 0]} barSize={20}>
                  {enrichedPopulares.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#16a34a" : "#22c55e"} fillOpacity={1 - index * 0.12} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 dark:text-gray-600 text-sm">
              Sin ventas registradas para este período
            </div>
          )}
        </div>

      </div>

      {/* ── Operación en Tiempo Real: Stock Bajo & Prioridad / Platos en Curso ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-stretch">

        {/* Stock Bajo */}
        <div className="xl:col-span-5 bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${finalAlertas.length > 0 ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"}`}>
                <Package className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base leading-tight">
                  Stock bajo
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Insumos activos con existencia mínima requerida
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border whitespace-nowrap ${finalAlertas.length > 0 ? "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60" : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60"}`}>
                {finalAlertas.length > 0
                  ? `${finalAlertas.length} ${finalAlertas.length === 1 ? "alerta" : "alertas"}`
                  : "Al día"}
              </span>
              <Link
                to="/compras/insumos"
                className="text-xs text-red-600 dark:text-red-400 inline-flex items-center gap-0.5 hover:underline font-bold whitespace-nowrap"
              >
                <span>Ver insumos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {finalAlertas.length > 0 ? (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-modal-scrollbar pr-1">
                {finalAlertas.map((item, index) => {
                  const stockVal = Number(item.stock ?? 0);
                  const minVal = Number(item.minimo ?? item.stockMinimo ?? 0);
                  const unidad = item.unidadMedida || "und";
                  const ratioPct = minVal > 0 ? Math.max(6, Math.min(100, Math.round((stockVal / minVal) * 100))) : 10;

                  return (
                    <div
                      key={item.idInsumo || item.id || index}
                      className="p-3 bg-red-50/70 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/40 hover:border-red-200 dark:hover:border-red-800/60 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2.5 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate" title={item.nombre}>
                              {item.nombre}
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-400 font-medium truncate">
                              Mínimo requerido: <span className="font-bold tabular-nums">{minVal} {unidad}</span>
                            </p>
                          </div>
                        </div>
                        <div className="px-2.5 py-1 bg-red-100/90 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl text-xs font-black shrink-0 whitespace-nowrap tabular-nums border border-red-200 dark:border-red-800/60 shadow-2xs">
                          Stock: {stockVal} {unidad}
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-red-200/60 dark:bg-red-950/70 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all"
                          style={{ width: `${ratioPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {finalAlertas.length <= 2 && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center bg-emerald-50/40 dark:bg-emerald-950/15 rounded-xl border border-dashed border-emerald-200/80 dark:border-emerald-900/40 gap-2">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                      Resto del inventario en niveles óptimos
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-xs">
                      Solo {finalAlertas.length === 1 ? "este insumo requiere" : `estos ${finalAlertas.length} insumos requieren`} reposición prioritaria en este momento.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Inventario al día</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Todos los insumos activos cuentan con stock suficiente
              </p>
            </div>
          )}
        </div>

        {/* Prioridad / Platos en Curso - Solo en cola, preparación y online por aprobar */}
        <div className="xl:col-span-7 bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base leading-tight">
                  Prioridad / Platos en Curso
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Órdenes activas en cola o en preparación en cocina
                </p>
              </div>
            </div>
            {/* Sin redireccionamiento según solicitud */}
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border whitespace-nowrap shrink-0 ${platosEnCurso.length > 0 ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60" : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60"}`}>
              {platosEnCurso.length} {platosEnCurso.length === 1 ? "orden" : "órdenes"}
            </span>
          </div>

          {platosEnCurso.length > 0 ? (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-modal-scrollbar pr-1 flex-1">
              {platosEnCurso.map((venta, index) => {
                const isCompletado = venta.estado === "Completada" || venta.estadoEntrega === "ENTREGADO" || venta.estadoEntrega === "LISTO";
                const isAnulado = venta.estado === "Anulada" || venta.estadoEntrega === "CANCELADO";

                const badgeStyle = isCompletado
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                  : isAnulado
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50";

                const getHoraCambioEstado = (v) => {
                  if (v.horaCambioEstado && v.horaCambioEstado !== "12:30 PM") {
                    return formatTime12h(v.horaCambioEstado);
                  }
                  if (v.horaEstado && v.horaEstado !== "12:30 PM") {
                    return formatTime12h(v.horaEstado);
                  }
                  if (Array.isArray(v.historialEstados) && v.historialEstados.length > 0) {
                    const ultimo = v.historialEstados[v.historialEstados.length - 1];
                    if (ultimo?.hora) return formatTime12h(ultimo.hora);
                    if (ultimo?.fecha) return formatTime12h(ultimo.fecha);
                  }
                  if (v.fechaCambioEstado) {
                    return formatTime12h(v.fechaCambioEstado);
                  }
                  if (v.updatedAt) {
                    return formatTime12h(v.updatedAt);
                  }
                  if (v.fechaVenta || v.fecha) {
                    return formatTime12h(v.fechaVenta || v.fecha);
                  }
                  if (v.horario) {
                    return formatTime12h(v.horario);
                  }
                  return formatTime12h(new Date());
                };

                const horaEstado = getHoraCambioEstado(venta);

                const getHoraAproxEntrega = (v) => {
                  if (v.horaEstimadaEntrega) return formatTime12h(v.horaEstimadaEntrega);
                  if (v.tiempoEstimadoEntrega) return formatTime12h(v.tiempoEstimadoEntrega);
                  const base = v.createdAt || v.fechaVenta || v.fecha;
                  const d = base ? new Date(base) : new Date();
                  if (isNaN(d.getTime())) return "20-25 min";
                  const deliveryDate = new Date(d.getTime() + 25 * 60 * 1000);
                  return formatTime12h(deliveryDate);
                };

                const horaEntregaAprox = getHoraAproxEntrega(venta);
                const codigoOrden = venta.codigoPedido || venta.numeroVenta || `#${String(venta.id).padStart(4, "0")}`;
                const clienteLabel = venta.clienteNombre || venta.cliente || "Cliente General";
                const origenLabel = venta.origenNombre || (venta.tipoEntrega === "Domicilio" ? "Venta Online" : "Punto Físico");

                return (
                  <div
                    key={venta.id || index}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50/80 dark:bg-gray-800/60 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800 min-w-0"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap shrink-0">
                          {codigoOrden}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap inline-flex items-center gap-1.5 shadow-2xs ${badgeStyle}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                          <span>{venta.estado || "Pendiente"}</span>
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900/70 px-2 py-0.5 rounded-full border border-gray-200/70 dark:border-gray-700/60 whitespace-nowrap"
                          title="Hora de actualización de estado"
                        >
                          <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
                          <span>{horaEstado}</span>
                        </span>
                        {!isCompletado && !isAnulado && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60 whitespace-nowrap"
                            title="Tiempo aproximado de entrega del pedido"
                          >
                            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>Entrega: {horaEntregaAprox}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 min-w-0 overflow-hidden">
                        <span
                          className="truncate min-w-0 font-medium text-gray-700 dark:text-gray-300"
                          title={clienteLabel}
                        >
                          {clienteLabel}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600 shrink-0">·</span>
                        <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          {origenLabel}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3 border-l border-gray-200/70 dark:border-gray-700/60 min-w-[82px]">
                      <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
                        ${Number(venta.total || 0).toLocaleString("es-CO")}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">COP</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cocina al día</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                No hay comandas en cola ni en preparación en este momento
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ── Observaciones y Comentarios Recibidos (Medición y Desempeño - 100% Datos Reales) ── */}
      {(() => {
        const reviewsList = Array.isArray(comentariosObservaciones?.resenas)
          ? comentariosObservaciones.resenas
          : [];
        const totalResenas = Number(comentariosObservaciones?.totalResenas ?? reviewsList.length);
        const promedioGlobal = Number(comentariosObservaciones?.promedioGlobal || 0);
        const orderObservations = Array.isArray(comentariosObservaciones?.observaciones)
          ? comentariosObservaciones.observaciones
          : [];

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Observaciones y Comentarios Recibidos</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Opiniones reales de clientes sobre productos e instrucciones registradas en ventas
                </p>
              </div>
              {totalResenas > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-full whitespace-nowrap">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Promedio {promedioGlobal.toFixed(1)} / 5.0</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-full whitespace-nowrap">
                  <Star className="w-3.5 h-3.5 text-gray-400" />
                  <span>Sin calificaciones aún</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 items-stretch">
              {/* Izquierda: Comentarios y Calificaciones de Clientes */}
              <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 min-w-0 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base leading-tight truncate">
                        Comentarios y Calificaciones de Clientes
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {totalResenas > 0
                          ? `Opiniones verificadas en tiempo real · Promedio ${promedioGlobal.toFixed(1)} / 5.0`
                          : "Las reseñas que publiquen los clientes en el catálogo aparecerán aquí"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
                    {totalResenas} {totalResenas === 1 ? "reseña" : "reseñas"}
                  </span>
                </div>

                {reviewsList.length > 0 ? (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto custom-modal-scrollbar pr-1 flex-1">
                    {reviewsList.map((rev, idx) => {
                      const authorName =
                        rev.nombre ||
                        (rev.usuario ? `${rev.usuario.nombre || ""} ${rev.usuario.apellidos || ""}`.trim() : "") ||
                        "Cliente registrado";
                      const score = Math.min(5, Math.max(1, Number(rev.puntuacion || 0)));
                      return (
                        <div
                          key={rev.id || rev.idResena || idx}
                          className="p-3 bg-amber-50/40 dark:bg-gray-800/60 rounded-xl border border-amber-100/80 dark:border-gray-800 space-y-1.5 min-w-0"
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                              <span
                                className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate min-w-0"
                                title={authorName}
                              >
                                {authorName}
                              </span>
                              {rev.productoNombre && (
                                <span
                                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 truncate max-w-[45%] sm:max-w-[200px] min-w-0 shrink"
                                  title={rev.productoNombre}
                                >
                                  {rev.productoNombre}
                                </span>
                              )}
                            </div>
                            <span
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-black shrink-0 whitespace-nowrap"
                              aria-label={`${score} de 5 estrellas`}
                            >
                              {Array.from({ length: score }).map((_, sIdx) => (
                                <Star key={sIdx} className="w-3 h-3 fill-amber-500 text-amber-500" />
                              ))}
                            </span>
                          </div>
                          {rev.comentario ? (
                            <p
                              className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words [overflow-wrap:anywhere] line-clamp-3"
                              title={rev.comentario}
                            >
                              &ldquo;{rev.comentario}&rdquo;
                            </p>
                          ) : (
                            <p className="text-[11px] italic text-gray-400 dark:text-gray-500">
                              Calificación registrada sin comentario escrito.
                            </p>
                          )}
                          {rev.fecha && (
                            <p className="text-[10.5px] text-gray-400 font-medium">
                              {new Date(rev.fecha).toLocaleDateString("es-CO", {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                      <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Sin reseñas registradas aún</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs">
                      Cuando los clientes califiquen y comenten sus productos comprados, sus opiniones aparecerán aquí automáticamente.
                    </p>
                  </div>
                )}
              </div>

              {/* Derecha: Observaciones Recibidas en Ventas */}
              <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-800 min-w-0 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm sm:text-base leading-tight truncate">
                        Observaciones Recibidas en Ventas
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Notas e indicaciones reales enviadas por clientes en sus compras
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800/60 whitespace-nowrap">
                      {orderObservations.length} {orderObservations.length === 1 ? "nota" : "notas"}
                    </span>
                    <Link
                      to="/ventas/gestion-ventas"
                      className="text-xs text-red-600 dark:text-red-400 inline-flex items-center gap-0.5 hover:underline font-bold whitespace-nowrap"
                    >
                      <span>Ver ventas</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {orderObservations.length > 0 ? (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto custom-modal-scrollbar pr-1 flex-1">
                    {orderObservations.map((obs, idx) => (
                      <div
                        key={obs.id || idx}
                        className="p-3 bg-gray-50/80 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1.5 min-w-0"
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            <span className="font-extrabold text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap shrink-0">
                              {obs.codigo}
                            </span>
                            <span
                              className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate min-w-0 flex-1"
                              title={obs.cliente}
                            >
                              {obs.cliente}
                            </span>
                          </div>
                          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 shrink-0 whitespace-nowrap">
                            {obs.origen}{obs.fecha ? ` · ${obs.fecha}` : ""}
                          </span>
                        </div>
                        <p
                          className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words [overflow-wrap:anywhere] line-clamp-3"
                          title={obs.nota}
                        >
                          &ldquo;{obs.nota}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Sin observaciones en este período</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs">
                      Las instrucciones especiales que escriban los clientes en sus compras aparecerán aquí.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
