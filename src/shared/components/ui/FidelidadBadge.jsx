import React from "react";
import { Crown, Award, Star, Sprout, Clock } from "lucide-react";

/**
 * Paleta oficial y consistente de niveles de fidelidad en toda la aplicación:
 * - VIP: Oro / Dorado (15% descuento)
 * - Frecuente: Azul (10% descuento)
 * - Regular: Verde / Esmeralda (5% descuento)
 * - Nuevo: Gris (0% descuento)
 */
export function getFidelidadConfig(tipo = "Nuevo", descuento = null) {
  const normTipo = String(tipo || "Nuevo").toLowerCase();

  let config = {
    label: "Cliente Nuevo",
    shortLabel: "Nuevo",
    desc: 0,
    icon: Sprout,
    slug: "gray",
    bgCls: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    pillCls: "bg-gray-600 text-white shadow-2xs",
    glowCls: "",
    cardBgCls: "bg-gray-50/80 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700",
    iconTextCls: "text-gray-500 dark:text-gray-400",
    iconFillCls: "text-gray-500 dark:text-gray-400",
    tagCls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
    accentBarCls: "bg-gray-400 dark:bg-gray-600"
  };

  if (normTipo.includes("vip")) {
    config = {
      label: "Cliente VIP",
      shortLabel: "VIP",
      desc: 15,
      icon: Crown,
      slug: "gold",
      bgCls: "bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-orange-500/15 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80 shadow-xs",
      pillCls: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-2xs",
      glowCls: "ring-2 ring-amber-400/40 dark:ring-amber-500/30",
      cardBgCls: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60",
      iconTextCls: "text-amber-500 dark:text-amber-400",
      iconFillCls: "fill-amber-400 text-amber-500 dark:fill-amber-400 dark:text-amber-400",
      tagCls: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/70",
      accentBarCls: "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500"
    };
  } else if (normTipo.includes("frecuente")) {
    config = {
      label: "Cliente Frecuente",
      shortLabel: "Frecuente",
      desc: 10,
      icon: Award,
      slug: "blue",
      bgCls: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 shadow-2xs",
      pillCls: "bg-blue-600 text-white shadow-2xs",
      glowCls: "ring-1 ring-blue-400/30 dark:ring-blue-500/25",
      cardBgCls: "bg-blue-50/75 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60",
      iconTextCls: "text-blue-600 dark:text-blue-400",
      iconFillCls: "fill-blue-500 text-blue-600 dark:fill-blue-400 dark:text-blue-400",
      tagCls: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60",
      accentBarCls: "bg-blue-500"
    };
  } else if (normTipo.includes("regular")) {
    config = {
      label: "Cliente Regular",
      shortLabel: "Regular",
      desc: 5,
      icon: Star,
      slug: "green",
      bgCls: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 shadow-2xs",
      pillCls: "bg-emerald-600 text-white shadow-2xs",
      glowCls: "ring-1 ring-emerald-400/30 dark:ring-emerald-500/25",
      cardBgCls: "bg-emerald-50/75 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60",
      iconTextCls: "text-emerald-600 dark:text-emerald-400",
      iconFillCls: "fill-emerald-500 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400",
      tagCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
      accentBarCls: "bg-emerald-500"
    };
  }

  const parsedDesc = descuento !== null && descuento !== undefined && descuento !== "" ? Number(descuento) : NaN;
  const finalDesc = Number.isFinite(parsedDesc) && parsedDesc > 0 ? parsedDesc : config.desc;

  return { ...config, finalDesc };
}

export function FidelidadBadge({
  tipo = "Nuevo",
  descuento = null,
  enGracia = false,
  size = "md",
  showDiscount = true,
  className = ""
}) {
  const config = getFidelidadConfig(tipo, descuento);
  const { finalDesc } = config;
  const IconComp = config.icon;

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10.5px] font-black tracking-tight ${config.bgCls} ${config.glowCls} ${className}`}
      >
        <IconComp size={12} strokeWidth={2.25} className="shrink-0" />
        <span>{config.shortLabel}</span>
        {showDiscount && finalDesc > 0 && (
          <span className={`px-1 py-0.2 rounded text-[9px] font-black ${config.pillCls}`}>
            -{finalDesc}%
          </span>
        )}
        {enGracia && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="En periodo de gracia" />
        )}
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div
        className={`flex sm:inline-flex items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-2 rounded-2xl border w-full sm:w-auto max-w-full ${config.bgCls} ${config.glowCls} ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-2xs border border-white/50 dark:border-gray-700 shrink-0">
            <IconComp size={18} strokeWidth={2.25} className="shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black tracking-tight leading-tight truncate">{config.label}</span>
              {enGracia && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded-md flex items-center gap-0.5 shadow-2xs shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  <span>En Gracia</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
              {finalDesc > 0 ? `Beneficio activo de ${finalDesc}% OFF en tu próxima compra` : "Completa 3 compras para desbloquear 15% OFF"}
            </p>
          </div>
        </div>

        {showDiscount && finalDesc > 0 && (
          <span className={`px-2 py-1 rounded-xl text-xs font-black shrink-0 ${config.pillCls}`}>
            {finalDesc}% OFF
          </span>
        )}
      </div>
    );
  }

  // Default 'md'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${config.bgCls} ${config.glowCls} ${className}`}
    >
      <IconComp size={15} strokeWidth={2.25} className="shrink-0" />
      <span className="font-extrabold">{config.label}</span>
      {showDiscount && finalDesc > 0 && (
        <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black ${config.pillCls}`}>
          {finalDesc}% OFF
        </span>
      )}
      {enGracia && (
        <span className="px-1 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded flex items-center gap-0.5">
          Gracia
        </span>
      )}
    </span>
  );
}

export default FidelidadBadge;
