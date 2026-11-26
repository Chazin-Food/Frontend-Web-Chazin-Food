import { TrendingUp, Users, ShoppingBag, Layers } from "lucide-react";
import { getColombiaDateISO, getColombiaDateParts } from "@/shared/utils/dateUtils";

export function VentasStatsCards({ ventas = [], devoluciones = [], stats = null, selectedPeriod = "personalizado" }) {
  const validVentasFallback = ventas.filter((v) => {
    if (!v || v.esDevolucion) return false;
    const entrega = String(v.estadoEntrega || v.estado || "").toUpperCase().trim();
    if (entrega === "CANCELADO" || entrega === "RECHAZADO" || entrega === "ANULADA") return false;
    const aprob = String(v.estadoAprobacion || "").toUpperCase().trim();
    if (aprob === "PENDIENTE" || aprob === "RECHAZADO") return false;
    return true;
  });

  const validVentaIdSet = new Set(validVentasFallback.map((v) => Number(v.idVenta || v.id || 0)).filter(Boolean));
  const fallbackBruto = Math.round(validVentasFallback.reduce((acc, v) => acc + Number(v.total || 0), 0));
  const fallbackReembolsos = Math.min(
    fallbackBruto,
    Math.round(
      (Array.isArray(devoluciones) ? devoluciones : [])
        .filter((d) => {
          const est = String(d?.estado || "").toUpperCase();
          const isMoney = String(d?.tipoResolucion || "").toLowerCase().includes("dinero");
          return (est === "APROBADA" || est === "COMPLETADA") && isMoney && validVentaIdSet.has(Number(d.idVenta || 0));
        })
        .reduce((acc, d) => acc + Math.max(0, Number(d.valorDevuelto || 0)), 0)
    )
  );
  const fallbackNeto = Math.max(0, fallbackBruto - fallbackReembolsos);

  const totalVentasBrutas = stats && stats.totalVentasBrutas !== undefined
    ? Number(stats.totalVentasBrutas || 0)
    : (stats ? Number(stats.totalVentas || 0) : fallbackBruto);
  const totalReembolsos = stats && stats.totalReembolsos !== undefined
    ? Number(stats.totalReembolsos || 0)
    : fallbackReembolsos;
  const totalVentasSum = stats
    ? Number(stats.totalVentasNetas ?? stats.totalVentas ?? 0)
    : fallbackNeto;
  const totalVentasStr = stats && stats.totalVentasNetasFormatted
    ? stats.totalVentasNetasFormatted
    : `$${totalVentasSum.toLocaleString("es-CO")}`;

  const pedidosCount = stats ? Number(stats.pedidosCount || 0) : validVentasFallback.length;

  const ticketPromedioVal = stats ? Number(stats.ticketPromedio || 0) : (pedidosCount > 0 ? Math.round(totalVentasSum / pedidosCount) : 0);
  const ticketPromedioStr = stats ? stats.ticketPromedioFormatted : `$${ticketPromedioVal.toLocaleString("es-CO")}`;

  const descOtorgadosSum = stats ? Number(stats.totalDescuentos || 0) : Math.round(validVentasFallback.reduce((acc, v) => acc + Number(v.montoDescuento || v.descuentoMonto || v.descuentoAplicado || 0), 0));
  const descOtorgadosStr = stats ? stats.totalDescuentosFormatted : `$${descOtorgadosSum.toLocaleString("es-CO")}`;

  const fallbackUniqueClients = new Set(
    validVentasFallback.map((v, idx) => {
      const cliName = String(v.clienteNombre || v.cliente || "").toLowerCase().trim();
      const isAnon = !v.idCliente || cliName === "cliente mostrador" || cliName === "cliente general" || cliName === "mostrador";
      return isAnon ? `mostrador:${v.idVenta || v.id || idx}` : `cli:${v.idCliente}`;
    })
  ).size;
  const uniqueClientsCount = (stats && stats.uniqueClientsCount !== undefined && stats.uniqueClientsCount !== null)
    ? Number(stats.uniqueClientsCount)
    : fallbackUniqueClients;

  const rawFrecuencia = (stats && stats.frecuenciaCompra !== undefined && stats.frecuenciaCompra !== null)
    ? Number(stats.frecuenciaCompra)
    : (pedidosCount > 0 ? pedidosCount / Math.max(1, uniqueClientsCount) : 0);
  const frecuenciaVal = Number.isFinite(rawFrecuencia) ? rawFrecuencia.toFixed(1) : "0.0";

  const uniqueDays = (stats && Number(stats.uniqueDays) > 0)
    ? Number(stats.uniqueDays)
    : (new Set(validVentasFallback.map(v => getColombiaDateISO(v.fechaRegistro || v.fechaVenta || v.fecha || v.createdAt || Date.now()))).size || 1);

  const fallbackSpanDays = (() => {
    if (selectedPeriod === "hoy") return 1;
    if (selectedPeriod === "7_dias") return 7;
    if (selectedPeriod === "este_mes") {
      const parts = getColombiaDateParts(new Date());
      return Math.max(1, parts?.day || 1);
    }
    return Math.max(1, uniqueDays);
  })();

  const hasServerDailyFreq =
    stats &&
    stats.frecuenciaDiaria !== undefined &&
    stats.frecuenciaDiaria !== null &&
    stats.frecuenciaDiaria !== "" &&
    Number.isFinite(Number(stats.frecuenciaDiaria));
  const frecuenciaDiariaVal = hasServerDailyFreq
    ? Number(stats.frecuenciaDiaria).toFixed(1)
    : (pedidosCount > 0 ? (pedidosCount / fallbackSpanDays).toFixed(1) : "0.0");

  const rawTasaDescuento = (stats && stats.tasaDescuento !== undefined && stats.tasaDescuento !== null)
    ? Number(stats.tasaDescuento)
    : ((totalVentasSum + descOtorgadosSum) > 0
      ? (descOtorgadosSum / (totalVentasSum + descOtorgadosSum)) * 100
      : 0);
  const tasaDescuentoVal = Number.isFinite(rawTasaDescuento) ? rawTasaDescuento.toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
      {/* 1. Ventas Netas (COP) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow min-w-0">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1 truncate">
              {totalReembolsos > 0 ? "Ventas Netas (COP)" : "Total Ventas (COP)"}
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
          {totalReembolsos > 0 ? (
            <span className="text-rose-600 dark:text-rose-400 font-semibold text-[10px] sm:text-[11px] truncate" title={`Ventas brutas: $${totalVentasBrutas.toLocaleString("es-CO")} · Reembolsos: -$${totalReembolsos.toLocaleString("es-CO")}`}>
              Reemb: -${totalReembolsos.toLocaleString("es-CO")}
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 font-medium text-[10px] sm:text-[11px] truncate">{selectedPeriod === "personalizado" || selectedPeriod === "todos" ? "Histórico" : selectedPeriod === "este_mes" ? "Este mes" : selectedPeriod === "7_dias" ? "7 días" : selectedPeriod === "este_ano" ? "Este año" : "Hoy"}</span>
          )}
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
          <span className="text-gray-500 dark:text-gray-400 font-medium text-[10px] sm:text-[11px] truncate">
            {uniqueClientsCount > 0 ? `${uniqueClientsCount} ${uniqueClientsCount === 1 ? "cliente" : "clientes"}` : "Clientes"}
          </span>
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
