import React from "react";
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

const defaultFormatCOP = (val) => `$${Math.round(Number(val || 0)).toLocaleString("es-CO")}`;

const renderChangeBadge = (change, idx) => {
  const kind = change.kind;
  let style = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let Icon = Plus;

  if (kind === "reemplazo") {
    style = "bg-indigo-50 text-indigo-700 border-indigo-200";
    Icon = ArrowRightLeft;
  } else if (kind === "extra_cantidad") {
    style = "bg-amber-50 text-amber-800 border-amber-200";
    Icon = TrendingUp;
  } else if (kind === "quitado") {
    style = "bg-rose-50 text-rose-700 border-rose-200";
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#EA2457]/10 text-[#EA2457]">
            <Layers className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            {title}
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#EA2457] bg-white border border-rose-200 px-2 py-0.5 rounded-full">
          {variants.length} {variants.length === 1 ? "variante activa" : "variantes activas"}
        </span>
      </div>

      {/* Tarjetas de variantes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {includeBaseOption && (() => {
          const isSelected = selectedKey === "BASE" || !selectedVariantObj;
          return (
            <button
              type="button"
              onClick={() => onSelect?.("BASE", null)}
              className={`text-left p-2.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? "border-[#EA2457] bg-white shadow-sm ring-2 ring-[#EA2457]/15"
                  : "border-slate-200 bg-white/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900 truncate">
                      {baseOptionLabel}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#EA2457] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Preparación estándar de la casa
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {basePriceInfo.hasPromo && (
                    <span className="block text-[10px] text-slate-400 line-through">
                      {formatCOP(basePriceInfo.originalPrice)}
                    </span>
                  )}
                  <span className="text-xs font-black text-slate-900">
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

          return (
            <button
              key={v.idVariante}
              type="button"
              onClick={() => onSelect?.(v.idVariante, v)}
              className={`text-left p-2.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? "border-[#EA2457] bg-white shadow-sm ring-2 ring-[#EA2457]/15"
                  : "border-slate-200 bg-white/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900">
                      {v.nombre}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#EA2457] shrink-0" />}
                    {fromEvent && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                        <Sparkles className="w-2.5 h-2.5" /> Evento
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {varSummary.changesCount > 0 ? (
                      <span className="font-medium text-slate-700">
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

                <div className="text-right shrink-0">
                  {pInfo.hasPromo && (
                    <span className="block text-[10px] text-slate-400 line-through">
                      {formatCOP(pInfo.originalPrice)}
                    </span>
                  )}
                  <span className="text-xs font-black text-[#EA2457] block">
                    {formatCOP(pInfo.finalPrice)}
                  </span>
                  {diffVsBase !== 0 ? (
                    <span className={`block text-[10px] font-bold ${diffVsBase > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                      {diffVsBase > 0 ? `+${formatCOP(diffVsBase)} vs base` : `-${formatCOP(Math.abs(diffVsBase))} vs base`}
                    </span>
                  ) : (
                    <span className="block text-[10px] font-medium text-slate-400">
                      Igual a base
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel detalle de cambios y especificaciones de la selección actual */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5 text-[#EA2457]" />
            {selectedVariantObj
              ? `Qué cambia en "${selectedVariantObj.nombre}"`
              : "Receta base seleccionada"}
          </span>
          {selectedVariantObj && isVariantFromEvent(selectedVariantObj) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3 h-3" />
              {selectedVariantObj.eventoOrigen?.nombre
                ? `Evento: ${selectedVariantObj.eventoOrigen.nombre}`
                : "Variante creada por evento"}
            </span>
          )}
        </div>

        {selectedVariantObj ? (
          selectedSummary.changes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedSummary.changes.map((c, idx) => renderChangeBadge(c, idx))}
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              {selectedVariantObj.descripcion || "Conserva los ingredientes base con presentación especial de la variante."}
            </p>
          )
        ) : (
          <p className="text-xs text-slate-500">
            Incluye los ingredientes estándar del producto sin cambios adicionales.
          </p>
        )}

        {(selectedSummary.especificaciones || selectedSummary.finalIngredients.length > 0) && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            {selectedSummary.especificaciones && (
              <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-100">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700">Especificaciones: </span>
                  <span>{selectedSummary.especificaciones}</span>
                </div>
              </div>
            )}

            {selectedSummary.finalIngredients.length > 0 && (
              <div className="text-[11px] text-slate-600">
                <span className="font-bold text-slate-700 block mb-1">
                  Insumos de esta {selectedVariantObj ? "variante" : "preparación"} ({selectedSummary.finalIngredients.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedSummary.finalIngredients.map((ing, i) => {
                    const isAdded = ing.kind === "extra_nuevo" || ing.kind === "reemplazo" || ing.kind === "extra_cantidad";
                    return (
                      <span
                        key={`${ing.idInsumo || i}-${i}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                          isAdded
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {ing.kind === "extra_nuevo" && "+ "}
                        {ing.kind === "reemplazo" && "⇄ "}
                        {ing.nombre}
                        {ing.cantidad > 0 && (
                          <span className="text-slate-400 font-normal">
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
