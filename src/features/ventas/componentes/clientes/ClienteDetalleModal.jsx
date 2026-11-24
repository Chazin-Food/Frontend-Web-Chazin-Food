import { X, Mail, Phone, MapPin, TrendingUp, Clock, Calendar, AlertCircle } from "lucide-react";
import { formatNombreCompleto, formatDireccion } from "@/shared/utils/validationUtils";
import { FidelidadBadge, getFidelidadConfig } from "@/shared/components/ui/FidelidadBadge";

export function ClienteDetalleModal({ isOpen, onClose, cliente }) {
  if (!isOpen || !cliente) return null;

  const tipoCliente = cliente.tipo || (cliente.esVip ? "VIP" : "Nuevo");
  const tieneCuenta = cliente.tieneCuenta !== false && !!cliente.idUsuario;
  const fidelidadTheme = getFidelidadConfig(tipoCliente, cliente.descuentoPorcentaje);
  const TierIcon = fidelidadTheme.icon;
  
  // Color scheme helpers for Avatar
  const getAvatarBg = (nombre = "") => {
    const firstChar = nombre.charAt(0).toUpperCase();
    if (["A", "B", "C"].includes(firstChar)) return "bg-emerald-500 text-white";
    if (["D", "E", "F", "G"].includes(firstChar)) return "bg-blue-500 text-white";
    if (["H", "I", "J", "K"].includes(firstChar)) return "bg-purple-500 text-white";
    if (["L", "M", "N"].includes(firstChar)) return "bg-indigo-500 text-white";
    if (["O", "P", "Q", "R"].includes(firstChar)) return "bg-amber-500 text-white";
    return "bg-slate-500 text-white";
  };

  // Real transactions from database (or empty if client has 0 orders)
  const transacciones = Array.isArray(cliente.transacciones) ? cliente.transacciones : [];

  const totalComprasCount = Number(cliente.compras ?? transacciones.length) || 0;
  const rawConsumido = cliente.totalConsumidoRaw ?? cliente.totalConsumido ?? cliente.totalGastado ?? 0;
  const totalConsumidoNum = typeof rawConsumido === "string" ? Number(rawConsumido.replace(/[^0-9]/g, "")) || 0 : Math.round(Number(rawConsumido) || 0);
  const totalConsumidoStr = `$${totalConsumidoNum.toLocaleString("es-CO")}`;
  const ticketPromedioNum =
    cliente.ticketPromedioRaw !== undefined && cliente.ticketPromedioRaw !== null
      ? Math.round(Number(cliente.ticketPromedioRaw) || 0)
      : (totalComprasCount > 0 ? Math.round(totalConsumidoNum / totalComprasCount) : 0);
  const ticketPromedioStr = `$${ticketPromedioNum.toLocaleString("es-CO")}`;

  // Frecuencia real basada en el lapso real entre la primera compra y hoy (sin dividir por un 3 fijo)
  const fallbackFrecuencia = (() => {
    if (totalComprasCount <= 0) {
      return { comprasMes: "0.0", tipo: "Sin compras" };
    }
    const nowMs = Date.now();
    let earliestMs = nowMs;
    for (const t of transacciones) {
      let dt = null;
      if (t?.fechaISO) {
        dt = new Date(t.fechaISO);
      } else if (typeof t?.fecha === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(t.fecha.trim())) {
        const [dd, mm, yyyy] = t.fecha.trim().split("/").map(Number);
        dt = new Date(yyyy, mm - 1, dd);
      }
      if (dt && !Number.isNaN(dt.getTime()) && dt.getTime() < earliestMs) {
        earliestMs = dt.getTime();
      }
    }
    const spanDays = Math.max(1, (nowMs - earliestMs) / (1000 * 60 * 60 * 24));
    const spanMonths = Math.max(1, spanDays / 30);
    const rate = parseFloat((totalComprasCount / spanMonths).toFixed(1));
    let tipo = "Esporádico";
    if (totalComprasCount === 1) tipo = spanDays <= 30 ? "Primera compra" : "Esporádico";
    else if (rate >= 4) tipo = "Semanal";
    else if (rate >= 2) tipo = "Quincenal";
    else if (rate >= 1) tipo = "Mensual";
    return { comprasMes: rate.toFixed(1), tipo };
  })();

  const comprasMes =
    cliente.comprasMes !== undefined && cliente.comprasMes !== null && cliente.comprasMes !== ""
      ? Number(cliente.comprasMes).toFixed(1)
      : fallbackFrecuencia.comprasMes;
  const frecuenciaTipo = cliente.frecuenciaTipo || fallbackFrecuencia.tipo;
  const ultimaCompraFecha = cliente.ultimaCompra || (transacciones.length > 0 ? transacciones[0].fecha : "Sin compras");
  const descuentoTag = fidelidadTheme.finalDesc > 0 ? `${fidelidadTheme.finalDesc}% de descuento` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full shadow-2xl relative border border-gray-100 dark:border-gray-800 max-h-[92dvh] overflow-y-auto overflow-x-hidden no-scrollbar">
        {/* Acento visual superior dinámico por nivel de fidelidad */}
        <div className={`h-1.5 w-full ${fidelidadTheme.accentBarCls}`} />

        <div className="p-6 space-y-6">
        {/* Banner: Client without user account */}
        {!tieneCuenta && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <p className="font-bold">Cliente sin cuenta de usuario asociada</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                Este cliente no tiene una cuenta de usuario ni credenciales de acceso. Permanece inactivo y no puede iniciar sesión ni realizar pedidos.
              </p>
            </div>
          </div>
        )}

        {/* Header: Avatar, Name, Dynamic Fidelity Badge & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-full font-bold text-lg flex items-center justify-center shrink-0 shadow-sm ${getAvatarBg(cliente.nombre)}`}>
              {cliente.nombre ? cliente.nombre.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight truncate">
                {formatNombreCompleto(cliente.nombre, cliente.apellidos) || "Cliente General"}
              </h2>
              <p className="text-xs text-gray-400 font-medium">Cliente #{cliente.id || cliente.idCliente || 1}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <FidelidadBadge
              tipo={tipoCliente}
              descuento={fidelidadTheme.finalDesc}
              enGracia={cliente.fidelidad?.enGracia}
              size="sm"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 1. INFORMACIÓN DE CONTACTO */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold tracking-wider text-gray-700 dark:text-gray-300 uppercase">
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50/70 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-400">Teléfono</p>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                  {cliente.telefono || "Sin registrar"}
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50/70 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-400">Email</p>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                  {cliente.email || "Sin registrar"}
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50/70 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-400">Dirección</p>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                  {formatDireccion(cliente.direccion)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ESTADÍSTICAS DE COMPRA */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold tracking-wider text-gray-700 dark:text-gray-300 uppercase">
            Estadísticas de Compra
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-center flex flex-col items-center justify-center">
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Total Compras</p>
              <p className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 mt-1 leading-tight">{totalComprasCount}</p>
              <span className="text-[10px] font-semibold text-blue-500/80 dark:text-blue-400/80 mt-0.5">
                {totalComprasCount === 1 ? "pedido" : "pedidos"}
              </span>
            </div>
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center flex flex-col items-center justify-center">
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Total Consumido</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 leading-tight whitespace-nowrap">{totalConsumidoStr}</p>
              <span className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">COP</span>
            </div>
            <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/40 text-center flex flex-col items-center justify-center">
              <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Ticket Promedio</p>
              <p className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 mt-1 leading-tight whitespace-nowrap">{ticketPromedioStr}</p>
              <span className="text-[10px] font-semibold text-purple-600/80 dark:text-purple-400/80 mt-0.5">COP / compra</span>
            </div>
          </div>
        </div>

        {/* 3. FRECUENCIA DE CONSUMO */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold tracking-wider text-gray-700 dark:text-gray-300 uppercase">
            Frecuencia de Consumo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-center flex flex-col items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-500 mb-1" />
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Compras / mes</p>
              <p className="text-base font-bold text-amber-800 dark:text-amber-200 mt-0.5">{comprasMes}</p>
            </div>
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-center flex flex-col items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-500 mb-1" />
              <p className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">Tipo</p>
              <p className="text-base font-bold text-indigo-800 dark:text-indigo-200 mt-0.5">{frecuenciaTipo}</p>
            </div>
            <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900/40 text-center flex flex-col items-center justify-center">
              <Calendar className="w-4 h-4 text-sky-500 mb-1" />
              <p className="text-[10px] font-semibold text-sky-700 dark:text-sky-400">Última compra</p>
              <p className="text-xs font-bold text-sky-800 dark:text-sky-200 mt-0.5">{ultimaCompraFecha}</p>
            </div>
          </div>
        </div>


        {/* 5. BENEFICIOS ACTIVOS (color dinámico por nivel de fidelidad) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold tracking-wider text-gray-700 dark:text-gray-300 uppercase">
              Beneficios Activos
            </h3>
            {descuentoTag && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${fidelidadTheme.tagCls}`}>
                {descuentoTag}
              </span>
            )}
          </div>
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${fidelidadTheme.cardBgCls}`}>
            <div className={`w-9 h-9 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-2xs ${fidelidadTheme.iconTextCls}`}>
              <TierIcon className={`w-5 h-5 ${fidelidadTheme.iconFillCls}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {fidelidadTheme.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {transacciones.length > 0 ? `Última compra: ${ultimaCompraFecha}` : "Sin compras registradas aún"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer: Cerrar Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        </div>
      </div>
    </div>
  );
}
