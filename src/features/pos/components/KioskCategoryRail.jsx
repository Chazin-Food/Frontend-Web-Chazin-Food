import React from "react";
import { Utensils, Tag } from "lucide-react";
import { FoodIcon } from "@/shared/components/ui/FoodIcon";
import { stripEmojis } from "@/shared/utils/foodEmojiUtils";

export default function KioskCategoryRail({
  categorias = [],
  categoriaActiva = null,
  onSelectCategoria,
  eventCount = 0
}) {
  return (
    <aside
      aria-label="Categorías del menú"
      className="w-full md:w-36 lg:w-44 shrink-0 flex flex-row md:flex-col gap-2 md:gap-2.5 py-1 pb-1.5 md:pb-1 md:pr-1.5 overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:sticky md:top-3 md:max-h-[calc(100dvh-11rem)] no-scrollbar touch-scroll-x select-none"
    >
      {/* Botón: Todos */}
      <button
        type="button"
        onClick={() => onSelectCategoria(null)}
        aria-pressed={categoriaActiva === null}
        className={`shrink-0 md:w-full min-h-[48px] md:min-h-[82px] px-3.5 py-2 md:p-3 rounded-2xl flex flex-row md:flex-col items-center justify-center gap-2 md:gap-0 text-center transition-all cursor-pointer border-2 active:scale-96 ${
          categoriaActiva === null
            ? "bg-[#A91B2E] text-white border-[#8F1626] shadow-lg shadow-red-900/25 ring-2 md:ring-3 ring-red-400/40"
            : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-500/50 hover:bg-red-50/40 dark:hover:bg-gray-800/80 shadow-xs"
        }`}
      >
        <div className={`p-1 md:p-1.5 rounded-xl md:mb-1 ${categoriaActiva === null ? "bg-white/20 text-white" : "text-[#A91B2E]"}`}>
          <Utensils className="w-4 h-4 md:w-7 md:h-7" />
        </div>
        <span className="text-xs sm:text-sm md:text-base font-black leading-tight whitespace-nowrap md:whitespace-normal md:break-words">
          Todos
        </span>
      </button>

      {/* Botón: Eventos / Promociones si existen (100% SVG Vectorial, Cero Emojis) */}
      {eventCount > 0 && (
        <button
          type="button"
          onClick={() => onSelectCategoria("eventos")}
          aria-pressed={categoriaActiva === "eventos"}
          className={`shrink-0 md:w-full min-h-[48px] md:min-h-[82px] px-3.5 py-2 md:p-3 rounded-2xl flex flex-row md:flex-col items-center justify-center gap-2 md:gap-0 text-center transition-all cursor-pointer border-2 active:scale-96 ${
            categoriaActiva === "eventos"
              ? "bg-linear-to-b from-amber-500 to-red-600 text-white border-amber-400 shadow-lg shadow-amber-600/30 ring-2 md:ring-3 ring-amber-300"
              : "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 shadow-xs"
          }`}
        >
          <div className={`p-1 rounded-xl md:mb-1 ${categoriaActiva === "eventos" ? "text-white" : "text-amber-500"}`}>
            <Tag className="w-4 h-4 md:w-7 md:h-7 stroke-[2]" />
          </div>
          <span className="text-xs sm:text-sm md:text-base font-black leading-tight whitespace-nowrap md:whitespace-normal md:break-words">
            Promociones
          </span>
          <span className={`md:mt-0.5 text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${categoriaActiva === "eventos" ? "bg-white text-red-700" : "bg-amber-800 text-white"}`}>
            {eventCount}
            <span className="hidden md:inline"> activas</span>
          </span>
        </button>
      )}

      {/* Lista de categorías */}
      {categorias.map((cat) => {
        const catId = cat.id || cat.idCategoriaProducto;
        const isActive = categoriaActiva === catId;
        const catName = stripEmojis(cat.nombre || "Categoría");

        return (
          <button
            key={catId}
            type="button"
            onClick={() => onSelectCategoria(catId)}
            aria-pressed={isActive}
            className={`shrink-0 md:w-full min-h-[48px] md:min-h-[82px] px-3.5 py-2 md:p-3 rounded-2xl flex flex-row md:flex-col items-center justify-center gap-2 md:gap-0 text-center transition-all cursor-pointer border-2 active:scale-96 ${
              isActive
                ? "bg-[#A91B2E] text-white border-[#8F1626] shadow-lg shadow-red-900/25 ring-2 md:ring-3 ring-red-400/40"
                : "bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-500/50 hover:bg-red-50/40 dark:hover:bg-gray-800/80 shadow-xs"
            }`}
          >
            <div className={`p-0.5 md:p-1 rounded-xl md:mb-1 shrink-0 ${isActive ? "text-white" : "text-[#A91B2E]"}`}>
              <FoodIcon name={catName} size={22} className="md:w-7 md:h-7" />
            </div>
            <span className="text-xs sm:text-sm lg:text-base font-black leading-tight whitespace-nowrap md:whitespace-normal md:break-words">
              {catName}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
