import React, { useState, useEffect } from "react";
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Plus,
  Minus,
  ArrowRightLeft,
  TrendingUp,
  Info,
  ChefHat
} from "lucide-react";
import { buildVariantChangesSummary } from "../../../features/ventas/utils/variantFichaUtils";
import { isVariantFromEvent } from "../../utils/productVariantUtils";
import { getOptimizedImageUrl } from "../../utils/imageUtils";

const defaultFormatCOP = (val) => `$${Math.round(Number(val || 0)).toLocaleString("es-CO")}`;

function VariantThumbnail({ src, fallbackSrc, alt, isDrink = false, hasDedicatedPhoto = false }) {
  const cleanSrc = typeof src === "string" && src.trim() ? src.trim() : "";
  const cleanFallback = typeof fallbackSrc === "string" && fallbackSrc.trim() ? fallbackSrc.trim() : "";
  const [useFallback, setUseFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setUseFallback(false);
    setFailed(false);
  }, [cleanSrc, cleanFallback]);

  const activeUrl = !useFallback && cleanSrc ? cleanSrc : cleanFallback;
  if (!activeUrl || failed) return null;

  const optimized = getOptimizedImageUrl(activeUrl, 120);

  return (
    <div className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border ${
      hasDedicatedPhoto
        ? "border-red-200 dark:border-red-900/60 bg-white dark:bg-gray-900 shadow-2xs"
        : "border-slate-200/80 dark:border-gray-700 bg-slate-100 dark:bg-gray-800"
    }`}>
      <img
        src={optimized}
        alt={alt}
        width="48"
        height="48"
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!useFallback && cleanFallback && cleanSrc && cleanSrc !== cleanFallback) {
            setUseFallback(true);
          } else {
            setFailed(true);
          }
        }}
        className={`w-full h-full ${isDrink ? "object-contain p-0.5" : "object-cover"}`}
      />
    </div>
  );
}

const renderChangeBadge = (change, idx) => {
  const kind = change.kind;
  let style = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60";
  let Icon = Plus;

  if (kind === "reemplazo") {
    style = "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-200 border-slate-200 dark:border-gray-700";
    Icon = ArrowRightLeft;
  } else if (kind === "extra_cantidad") {
    style = "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60";
    Icon = TrendingUp;
  } else if (kind === "quitado") {
    style = "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60";
    Icon = Minus;
  }

  return (
    <span
      key={`${change.idInsumo || idx}-${kind}-${idx}`}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold leading-tight ${style}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{change.texto}</span>
    </span>
  );
};

/**
 * Inspector compartido de variantes para vista de cliente (productos estándar y eventos).
 * Muestra las variantes activas, su precio exacto, diferencia vs base, cambios de insumos
 * y especificaciones técnicas de la variante seleccionada.
 */
export default function ProductVariantInspector({
  producto,
  variants = [],
  selectedKey = "BASE",
  onSelect,
  basePrice = 0,
  getPriceInfo,
  formatCOP = defaultFormatCOP,
  isDrink = false,
  includeBaseOption = true,
  baseOptionLabel = "Original (Receta Base)",
  title = "Variantes disponibles y lo que cambia"
}) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  const baseNumeric = Number(basePrice ?? producto?.precio ?? 0);
  const resolvePrice = (variantObj) => {
    if (typeof getPriceInfo === "function") {
      return getPriceInfo(variantObj);
    }
    const raw = variantObj && Number(variantObj.precio) > 0 ? Number(variantObj.precio) : baseNumeric;
    return { finalPrice: raw, originalPrice: raw, hasPromo: false };
  };

  const selectedVariantObj =
    selectedKey === "BASE" || selectedKey === null
      ? null
      : variants.find((v) => String(v.idVariante) === String(selectedKey)) || null;

  const selectedSummary = buildVariantChangesSummary(selectedVariantObj, producto, isDrink);
  const basePriceInfo = resolvePrice(null);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-gray-800 bg-slate-50/60 dark:bg-gray-800/40 p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#D9383A]/10 dark:bg-red-950/60 text-[#D9383A] dark:text-red-400">
            <Layers className="w-4 h-4" />
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-gray-100">
            {title}
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 px-2.5 py-0.5 rounded-full">
          {variants.length + (includeBaseOption ? 1 : 0)} opciones
        </span>
      </div>

      {/* Tarjetas de variantes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {includeBaseOption && (() => {
          const isSelected = selectedKey === "BASE" || !selectedVariantObj;
          const parentImg = producto?.imagen || producto?.imagenUrl || producto?.urlImagen || "";
          return (
            <button
              type="button"
              onClick={() => onSelect?.("BASE", null)}
              className={`text-left p-3 rounded-2xl border-2 transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                isSelected
                  ? "border-[#D9383A] bg-white dark:bg-gray-900 shadow-xs ring-2 ring-[#D9383A]/15"
                  : "border-slate-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/60 hover:border-slate-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <VariantThumbnail
                    src={parentImg}
                    alt={baseOptionLabel}
                    isDrink={isDrink}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-gray-100 truncate">
                        {baseOptionLabel}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D9383A] dark:text-red-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                      Receta original de la casa
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {basePriceInfo.hasPromo && (
                    <span className="block text-[10px] text-slate-400 line-through">
                      {formatCOP(basePriceInfo.originalPrice)}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-gray-100">
                    {formatCOP(basePriceInfo.finalPrice)}
                  </span>
                </div>
              </div>
            </button>
          );
        })()}

        {variants.map((v) => {
          const isSelected = selectedVariantObj && String(selectedVariantObj.idVariante) === String(v.idVariante);
          const pInfo = resolvePrice(v);
          const varSummary = buildVariantChangesSummary(v, producto, isDrink);
          const fromEvent = isVariantFromEvent(v);
          const rawVarPrice = Number(v.precio) > 0 ? Number(v.precio) : baseNumeric;
          const diffVsBase = rawVarPrice - baseNumeric;
          const parentImg = producto?.imagen || producto?.imagenUrl || producto?.urlImagen || "";
          const dedicatedVarImg = typeof v.imagen === "string" && v.imagen.trim() ? v.imagen.trim() : "";

          return (
            <button
              key={v.idVariante}
              type="button"
              onClick={() => onSelect?.(v.idVariante, v)}
              className={`text-left p-3 rounded-2xl border-2 transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                isSelected
                  ? "border-[#D9383A] bg-white dark:bg-gray-900 shadow-xs ring-2 ring-[#D9383A]/15"
                  : "border-slate-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-900/60 hover:border-slate-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <VariantThumbnail
                    src={dedicatedVarImg || parentImg}
                    fallbackSrc={parentImg}
                    alt={v.nombre}
                    isDrink={isDrink}
                    hasDedicatedPhoto={Boolean(dedicatedVarImg)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-gray-100">
                        {v.nombre}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D9383A] dark:text-red-400 shrink-0" />}
                      {fromEvent && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          <Sparkles className="w-2.5 h-2.5" /> Especial
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                      {varSummary.changesCount > 0 ? (
                        <span className="font-medium text-slate-600 dark:text-gray-300 line-clamp-1">
                          {varSummary.changes.slice(0, 2).map((c) => c.texto).join(" · ")}
                          {varSummary.changesCount > 2 ? ` (+${varSummary.changesCount - 2})` : ""}
                        </span>
                      ) : v.descripcion ? (
                        <span className="line-clamp-1">{v.descripcion}</span>
                      ) : (
                        <span>Presentación especial</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {pInfo.hasPromo && (
                    <span className="block text-[10px] text-slate-400 line-through">
                      {formatCOP(pInfo.originalPrice)}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-black text-[#D9383A] dark:text-red-400 block">
                    {formatCOP(pInfo.finalPrice)}
                  </span>
                  {diffVsBase !== 0 ? (
                    <span className={`block text-[10px] font-bold ${diffVsBase > 0 ? "text-slate-500 dark:text-gray-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {diffVsBase > 0 ? `+${formatCOP(diffVsBase)}` : `-${formatCOP(Math.abs(diffVsBase))}`}
                    </span>
                  ) : (
                    <span className="block text-[10px] font-medium text-slate-400">
                      Mismo precio
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel detalle de cambios y especificaciones de la selección actual */}
      <div className="rounded-xl border border-slate-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-gray-200 flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5 text-[#D9383A] dark:text-red-400" />
            {selectedVariantObj
              ? `Detalle de "${selectedVariantObj.nombre}"`
              : "Receta base seleccionada"}
          </span>
          {selectedVariantObj && isVariantFromEvent(selectedVariantObj) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <Sparkles className="w-3 h-3" />
              {selectedVariantObj.eventoOrigen?.nombre
                ? `Evento: ${selectedVariantObj.eventoOrigen.nombre}`
                : "Edición especial"}
            </span>
          )}
        </div>

        {selectedVariantObj ? (
          selectedSummary.changes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedSummary.changes.map((c, idx) => renderChangeBadge(c, idx))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-gray-300">
              {selectedVariantObj.descripcion || "Conserva los ingredientes base con presentación especial de la variante."}
            </p>
          )
        ) : (
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Incluye los ingredientes artesanales originales del plato sin modificaciones adicionales.
          </p>
        )}

        {(selectedSummary.especificaciones || selectedSummary.finalIngredients.length > 0) && (
          <div className="pt-2.5 border-t border-slate-100 dark:border-gray-800 space-y-2">
            {selectedSummary.especificaciones && (
              <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-800/70 px-3 py-2 rounded-lg border border-slate-100 dark:border-gray-700/70">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 dark:text-gray-200">Especificaciones: </span>
                  <span>{selectedSummary.especificaciones}</span>
                </div>
              </div>
            )}

            {selectedSummary.finalIngredients.length > 0 && (
              <div className="text-[11px] text-slate-600 dark:text-gray-300">
                <span className="font-bold text-slate-700 dark:text-gray-200 block mb-1.5">
                  Insumos incluidos ({selectedSummary.finalIngredients.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSummary.finalIngredients.map((ing, i) => {
                    const isAdded = ing.kind === "extra_nuevo" || ing.kind === "reemplazo" || ing.kind === "extra_cantidad";
                    return (
                      <span
                        key={`${ing.idInsumo || i}-${i}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10.5px] font-semibold ${
                          isAdded
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                            : "bg-slate-50 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border-slate-200/80 dark:border-gray-700"
                        }`}
                      >
                        {ing.kind === "extra_nuevo" && "+ "}
                        {ing.kind === "reemplazo" && "⇄ "}
                        {ing.nombre}
                        {ing.cantidad > 0 && (
                          <span className="text-slate-400 dark:text-gray-500 font-normal">
                            ({Number(Number(ing.cantidad).toFixed(3))} {ing.unidadMedida})
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
