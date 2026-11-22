import { TrendingUp, Users, ShoppingBag, Layers } from "lucide-react";
import { getColombiaDateISO } from "@/shared/utils/dateUtils";

export function VentasStatsCards({ ventas = [], stats = null, selectedPeriod = "personalizado" }) {
  const totalVentasSum = stats ? stats.totalVentas : ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalVentasStr = stats ? stats.totalVentasFormatted : `$${totalVentasSum.toLocaleString("es-CO")}`;

  const pedidosCount = stats ? stats.pedidosCount : ventas.length;

  const ticketPromedioVal = stats ? stats.ticketPromedio : (pedidosCount > 0 ? Math.round(totalVentasSum / pedidosCount) : 0);
  const ticketPromedioStr = stats ? stats.ticketPromedioFormatted : `$${ticketPromedioVal.toLocaleString("es-CO")}`;

  const descOtorgadosSum = stats ? stats.totalDescuentos : ventas.reduce((acc, v) => acc + Number(v.montoDescuento || v.descuentoMonto || v.descuentoAplicado || 0), 0);
  const descOtorgadosStr = stats ? stats.totalDescuentosFormatted : `$${descOtorgadosSum.toLocaleString("es-CO")}`;

  const frecuenciaVal = stats ? stats.frecuenciaCompra : (pedidosCount > 0 ? (pedidosCount / (new Set(ventas.map(v => v.idCliente || v.clienteNombre || v.cliente).filter(Boolean)).size || 1)).toFixed(1) : "0.0");

  const uniqueDays = stats ? (stats.uniqueDays || 1) : (new Set(ventas.map(v => getColombiaDateISO(v.fechaRegistro || v.fechaVenta || v.createdAt || Date.now()))).size || 1);
  const frecuenciaDiariaVal = stats ? stats.frecuenciaDiaria : (pedidosCount > 0 ? (pedidosCount / uniqueDays).toFixed(1) : "0.0");

  const tasaDescuentoVal = stats ? stats.tasaDescuento : ((totalVentasSum + descOtorgadosSum) > 0
    ? ((descOtorgadosSum / (totalVentasSum + descOtorgadosSum)) * 100).toFixed(1)
    : "0.0");

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
      {/* 1. Total Ventas (COP) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-w-0">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1 truncate">
              Total Ventas (COP)
            </span>
            <span className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 block tracking-tight truncate">
              {totalVentasStr}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-2.5 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between gap-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium text-[10px] sm:text-[11px] truncate">{selectedPeriod === "personalizado" || selectedPeriod === "todos" ? "Histórico" : selectedPeriod === "este_mes" ? "Este mes" : selectedPeriod === "7_dias" ? "7 días" : selectedPeriod === "este_ano" ? "Este año" : "Hoy"}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[9.5px] sm:text-[10px] shrink-0">
            COP
          </span>
        </div>
      </div>

      {/* 2. Ticket Promedio (COP) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-w-0">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1 truncate">
              Ticket Promedio
            </span>
            <span className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 block tracking-tight truncate">
              {ticketPromedioStr}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-purple-100/70 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-2.5 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between gap-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium text-[10px] sm:text-[11px] truncate">Medio por venta</span>
          <span className="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[9.5px] sm:text-[10px] shrink-0">Promedio</span>
        </div>
      </div>

      {/* 3. Frecuencia de Compra */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-w-0">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1 truncate">
              Frecuencia
            </span>
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                {frecuenciaVal}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400">v/cli</span>
            </div>
          </div>
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-100/70 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-2.5 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between gap-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium text-[10px] sm:text-[11px] truncate">Clientes</span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] sm:text-[11px] font-bold shrink-0">
            {frecuenciaDiariaVal}/día
          </span>
        </div>
      </div>

      {/* 4. Tasa de Descuento */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-w-0">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1 truncate">
              Tasa Descuento
            </span>
            <span className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 block tracking-tight">
              {tasaDescuentoVal}%
            </span>
          </div>
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-2.5 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between gap-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium text-[10px] sm:text-[11px] truncate">{descOtorgadosStr}</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 sm:px-2 py-0.5 rounded-md text-[9.5px] sm:text-[10px] shrink-0">
            Promos
          </span>
        </div>
      </div>
    </div>
  );
}
