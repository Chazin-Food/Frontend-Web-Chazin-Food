import React from "react";
import { Sparkles, Tag, Plus, Ban, Layers } from "lucide-react";
import { motion } from "motion/react";
import { stripEmojis } from "@/shared/utils/foodEmojiUtils";
import { getProductVariantSummary } from "@/shared/utils/productVariantUtils";
import { getOptimizedImageUrl } from "@/shared/utils/imageUtils";

export default function KioskProductCard({ producto, onSelect }) {
  if (!producto) return null;

  const prodStock = Number(producto.stock !== undefined ? producto.stock : 0);
  const isAgotado = Boolean(producto.agotado || prodStock <= 0 || producto.estado === "Inactivo" || producto.estado === 0);
  const variantSummary = getProductVariantSummary(producto);

  const now = new Date();
  const eventos = Array.isArray(producto.eventos) ? producto.eventos : [];
  const activeEvent = eventos.find((e) => {
    if (e.estado !== 1 && e.estado !== "Activo" && e.estado !== undefined) return false;
    if (e.fechaFin && now > new Date(`${e.fechaFin}T23:59:59`)) return false;
    if (e.fechaInicio && now < new Date(`${e.fechaInicio}T00:00:00`)) return false;
    return true;
  });

  const is2x1Promo = Boolean(
    activeEvent?.tipo === "2X1" ||
    activeEvent?.tipoEvento === "2X1" ||
    activeEvent?.nombre?.toLowerCase().includes("2x1") ||
    activeEvent?.nombreEvento?.toLowerCase().includes("2x1") ||
    producto.is2x1Promo ||
    producto.nombre?.toLowerCase().includes("2x1")
  );

  const originalPrice = Number(producto.precio || 0);
  let finalPrice = originalPrice;
  let discountPercent = 0;

  if (activeEvent) {
    if (activeEvent.nuevoPrecio && Number(activeEvent.nuevoPrecio) > 0) {
      finalPrice = Number(activeEvent.nuevoPrecio);
      if (originalPrice > finalPrice) {
        discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
      }
    } else {
      const desc = Number(
        activeEvent.descuento ??
        activeEvent.descuentoPorcentaje ??
        activeEvent.porcentajeDescuento ??
        0
      );
      if (desc > 0) {
        discountPercent = Math.round(desc);
        finalPrice = Math.round(originalPrice * (1 - desc / 100));
      }
    }
  }

  const formatPrice = (val) => `${Number(val || 0).toLocaleString("es-CO")}`;

  const handleCardClick = () => {
    onSelect({
      ...producto,
      precio: finalPrice,
      precioOriginal: originalPrice,
      precioPromo: finalPrice,
      descuentoPorcentaje: discountPercent,
      activeEvent: activeEvent || null
    });
  };

  return (
    <motion.article
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      onClick={handleCardClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 transition-all cursor-pointer select-none overflow-hidden min-h-[236px] sm:min-h-[300px] bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-500/50 shadow-xs hover:shadow-lg"
    >
      {/* Etiqueta/badge única de evento o promoción (sin pintar toda la tarjeta) */}
      {(activeEvent || is2x1Promo || discountPercent > 0) && (
        <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 z-10 inline-flex items-center gap-1 max-w-[calc(100%-2.5rem)] px-2.5 py-1 rounded-full bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/70 font-bold text-[10px] sm:text-[11px] shadow-xs backdrop-blur-xs">
          <Tag className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0 stroke-[2.2]" />
          <span className="truncate">
            {activeEvent
              ? stripEmojis(activeEvent.nombre || activeEvent.nombreEvento || "Evento")
              : is2x1Promo
              ? "Promoción 2x1"
              : `-${discountPercent}% OFF`}
          </span>
          {activeEvent && (discountPercent > 0 || is2x1Promo) && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[9.5px] font-extrabold shrink-0">
              {discountPercent > 0 ? `-${discountPercent}%` : "2X1"}
            </span>
          )}
        </div>
      )}

      {/* Big Appetizing Photo */}
      <div className="relative w-full h-28 sm:h-40 md:h-44 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-gray-800/80 overflow-hidden flex items-center justify-center border border-gray-100 dark:border-gray-700/60">
        {producto.imagen ? (
          <img
            src={getOptimizedImageUrl(producto.imagen, 400)}
            alt={stripEmojis(producto.nombre)}
            width="200"
            height="150"
            loading="lazy"
            decoding="async"
            style={{ aspectRatio: "4 / 3" }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400/60" />
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 mt-1">Chazin Food</span>
          </div>
        )}
        {isAgotado && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-2">
            <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-red-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 shadow-md">
              <Ban className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Agotado</span>
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="mt-2 sm:mt-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm sm:text-lg lg:text-xl font-black text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 group-hover:text-[#A91B2E] dark:group-hover:text-red-400 transition-colors">
            {stripEmojis(producto.nombre)}
          </h3>
          {variantSummary.hasVariants && (
            <div
              className="mt-1 sm:mt-1.5 flex items-center flex-wrap gap-1"
              title={`Variantes: ${variantSummary.names.join(", ")}`}
            >
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70 max-w-full">
                <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                <span className="truncate">
                  {variantSummary.count} {variantSummary.count === 1 ? "variante" : "var."}: {variantSummary.names.slice(0, 2).join(" · ")}
                  {variantSummary.count > 2 ? ` +${variantSummary.count - 2}` : ""}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Pricing & CTA Button area */}
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-end justify-between gap-1.5">
          <div className="flex flex-col justify-end min-w-0 flex-1">
            {discountPercent > 0 && (
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 line-through leading-none mb-0.5 truncate">
                ${formatPrice(originalPrice)}
              </span>
            )}
            <span className="text-base sm:text-xl lg:text-2xl font-black text-[#A91B2E] dark:text-red-400 leading-tight truncate">
              ${formatPrice(finalPrice)}
            </span>
          </div>

          <div
            aria-label={isAgotado ? `Producto agotado: ${stripEmojis(producto.nombre)}` : `Pedir ${stripEmojis(producto.nombre)} por ${formatPrice(finalPrice)} COP`}
            role="button"
            tabIndex={0}
            className={`shrink-0 flex items-center justify-center gap-1 sm:gap-1.5 text-white text-[11px] sm:text-xs font-black px-2 sm:px-3 py-1.5 rounded-xl shadow-xs transition-all whitespace-nowrap sm:min-w-[78px] ${
              isAgotado
                ? "bg-gray-500 dark:bg-gray-700 cursor-not-allowed opacity-90"
                : "bg-[#A91B2E] hover:bg-[#8F1626] dark:bg-red-700 dark:hover:bg-red-600 group-hover:scale-105 active:scale-95 cursor-pointer"
            }`}
          >
            {isAgotado ? (
              <>
                <Ban className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">Agotado</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                <span>Pedir</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
