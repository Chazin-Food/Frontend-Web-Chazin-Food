import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  Gift,
  Flame,
  Star,
  CheckCircle2,
  Percent,
  ChefHat
} from "lucide-react";
import {
  FoodIcon,
  getEventBadgeConfig,
  StreamlineFlame,
  StreamlinePartyPopper,
  StreamlineCrown,
  IconCoupleHeart,
  IconLightningBolt,
  IconMeatSteak,
  IconExplosion,
  IconServingCloche,
  IconBaconStrip
} from "@/shared/components/ui/FoodIcon";
import { stripEmojis, formatTipoEvento, parseEventoInsumos, formatEventoToppingsText } from "@/shared/utils/foodEmojiUtils";
import { getOptimizedImageUrl } from "@/shared/utils/imageUtils";
import { calculateCountdown, isEventActiveInColombia } from "@/shared/utils/dateUtils";

// Paleta institucional unificada Chazin Food: Deep Navy-Slate (#0F172A) + Chazin Crimson (#D9383A) + Emerald Ahorro
const UNIFIED_EVENT_THEME = {
  bg: "from-[#0F172A] via-[#151F32] to-[#0B1120]",
  glow: "rgba(15, 23, 42, 0.16)",
  border: "border-slate-700/60",
  badgeBg: "bg-[#D9383A] text-white shadow-sm",
  accent: "text-amber-300",
  btnGrad: "from-[#D9383A] to-[#B91C1C] hover:from-[#C92F31] hover:to-[#991B1B] text-white shadow-lg shadow-[#D9383A]/25",
  pillBg: "bg-white/10 border-white/15 text-slate-200",
  heroGradient: "from-[#0F172A] via-[#1E293B] to-[#0F172A]",
  heroSubtext: "text-slate-300"
};

export const THEMES = {
  fire: {
    ...UNIFIED_EVENT_THEME,
    tag: "2X1 IMPERDIBLE",
    tagText: "2X1 IMPERDIBLE",
    TagIcon: StreamlineFlame,
    TitleIcon: null
  },
  violet: {
    ...UNIFIED_EVENT_THEME,
    tag: "PROMO FIN DE SEMANA",
    tagText: "PROMO FIN DE SEMANA",
    TagIcon: StreamlinePartyPopper,
    TitleIcon: null
  },
  ocean: {
    ...UNIFIED_EVENT_THEME,
    tag: "COMBO FESTIVO EN PAREJA",
    tagText: "COMBO FESTIVO EN PAREJA",
    TagIcon: IconCoupleHeart,
    TitleIcon: null
  },
  gold: {
    ...UNIFIED_EVENT_THEME,
    tag: "EDICIÓN LIMITADA CHEF",
    tagText: "EDICIÓN LIMITADA CHEF",
    TagIcon: StreamlineCrown,
    TitleIcon: StreamlineFlame
  },
  sunset: {
    ...UNIFIED_EVENT_THEME,
    tag: "OFERTA RELÁMPAGO CRISPY",
    tagText: "OFERTA RELÁMPAGO CRISPY",
    TagIcon: IconLightningBolt,
    TitleIcon: IconLightningBolt
  },
  ruby: {
    ...UNIFIED_EVENT_THEME,
    tag: "MASTER PARRILLA & BACON",
    tagText: "MASTER PARRILLA & BACON",
    TagIcon: IconMeatSteak,
    TitleIcon: IconExplosion
  },
  emerald: {
    ...UNIFIED_EVENT_THEME,
    tag: "FESTIVAL DE TOPPINGS",
    tagText: "FESTIVAL DE TOPPINGS",
    TagIcon: IconBaconStrip,
    TitleIcon: IconBaconStrip
  },
  teal: {
    ...UNIFIED_EVENT_THEME,
    tag: "COMBO ESPECIAL CHAZIN",
    tagText: "COMBO ESPECIAL CHAZIN",
    TagIcon: StreamlineFlame,
    TitleIcon: null
  }
};

/**
 * Asigna de forma inteligente un tema y etiqueta culinaria a cada evento
 * para garantizar máxima armonía visual y CERO colores repetidos en el carrusel.
 */
export const getEventThemeAndTag = (event, index) => {
  const name = String(event?.nombreEvento || event?.nombre || "").toLowerCase();
  const type = String(event?.tipoEvento || "").toLowerCase();
  const id = Number(event?.idEvento || 0);

  // Mapeo preciso por identidad de cada evento con iconos vectoriales SVG limpios (sin emojis unicode)
  if (name.includes("2x1") || type.includes("2x1")) {
    return {
      theme: "fire",
      tag: "2X1 IMPERDIBLE",
      tagText: "2X1 IMPERDIBLE",
      TagIcon: StreamlineFlame,
      TitleIcon: null
    };
  }
  if (name.includes("fin de semana")) {
    return {
      theme: "violet",
      tag: "PROMO FIN DE SEMANA",
      tagText: "PROMO FIN DE SEMANA",
      TagIcon: StreamlinePartyPopper,
      TitleIcon: null
    };
  }
  if (name.includes("pareja") || type.includes("combo")) {
    return {
      theme: "ocean",
      tag: "COMBO FESTIVO EN PAREJA",
      tagText: "COMBO FESTIVO EN PAREJA",
      TagIcon: IconCoupleHeart,
      TitleIcon: null
    };
  }
  if (id === 5 || name.includes("burger fest")) {
    return {
      theme: "gold",
      tag: "EDICIÓN LIMITADA CHEF",
      tagText: "EDICIÓN LIMITADA CHEF",
      TagIcon: StreamlineCrown,
      TitleIcon: StreamlineFlame
    };
  }
  if (name.includes("pollo crispy") || name.includes("relampago") || name.includes("relámpago")) {
    return {
      theme: "sunset",
      tag: "OFERTA RELÁMPAGO CRISPY",
      tagText: "OFERTA RELÁMPAGO CRISPY",
      TagIcon: IconLightningBolt,
      TitleIcon: IconLightningBolt
    };
  }
  if (name.includes("doble carne") || (name.includes("tocineta") && name.includes("20%"))) {
    return {
      theme: "ruby",
      tag: "MASTER PARRILLA & BACON",
      tagText: "MASTER PARRILLA & BACON",
      TagIcon: IconMeatSteak,
      TitleIcon: IconExplosion
    };
  }
  if (name.includes("toppings") || name.includes("perro suizo")) {
    return {
      theme: "emerald",
      tag: "FESTIVAL DE TOPPINGS",
      tagText: "FESTIVAL DE TOPPINGS",
      TagIcon: IconBaconStrip,
      TitleIcon: IconBaconStrip
    };
  }
  if (id === 9 || name.includes("edicion limitada") || name.includes("edición limitada") || type.includes("especial")) {
    return {
      theme: "teal",
      tag: "CREACIÓN DE AUTOR EXCLUSIVA",
      tagText: "CREACIÓN DE AUTOR EXCLUSIVA",
      TagIcon: IconServingCloche,
      TitleIcon: IconServingCloche
    };
  }

  // Secuencia de rotación única para cualquier evento adicional sin repetir
  const themeOrder = ["fire", "violet", "ocean", "gold", "sunset", "ruby", "emerald", "teal"];
  const selectedTheme = themeOrder[index % themeOrder.length];
  const tObj = THEMES[selectedTheme];
  return {
    theme: selectedTheme,
    tag: tObj?.tagText || "EXPERIENCIA CHAZIN",
    tagText: tObj?.tagText || "EXPERIENCIA CHAZIN",
    TagIcon: tObj?.TagIcon || StreamlinePartyPopper,
    TitleIcon: tObj?.TitleIcon || null
  };
};

export function EventosCarousel({ eventos = [], productos = [], ratingsMap = {}, onSelectEvento, onThemeChange }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTick, setCurrentTick] = useState(() => Date.now());

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const slideDuration = 6000; // 6 segundos por diapositiva

  // Referencias y estado para arrastre horizontal con mouse (drag-to-scroll)
  const pillsRef = useRef(null);
  const [isPillsDragging, setIsPillsDragging] = useState(false);
  const pillsDragStartX = useRef(0);
  const pillsScrollLeft = useRef(0);
  const pillsHasDragged = useRef(false);

  const handlePillsMouseDown = (e) => {
    if (!pillsRef.current) return;
    setIsPillsDragging(true);
    pillsHasDragged.current = false;
    pillsDragStartX.current = e.pageX - pillsRef.current.offsetLeft;
    pillsScrollLeft.current = pillsRef.current.scrollLeft;
  };

  const handlePillsMouseMove = (e) => {
    if (!isPillsDragging || !pillsRef.current) return;
    e.preventDefault();
    const x = e.pageX - pillsRef.current.offsetLeft;
    const walk = (x - pillsDragStartX.current) * 1.5;
    if (Math.abs(walk) > 4) {
      pillsHasDragged.current = true;
    }
    pillsRef.current.scrollLeft = pillsScrollLeft.current - walk;
  };

  const handlePillsMouseUp = () => {
    setIsPillsDragging(false);
  };

  const handlePillsMouseLeave = () => {
    setIsPillsDragging(false);
  };

  // Desplazar suavemente hacia la píldora activa cuando cambie el slide (solo en interacción, nunca en montado inicial para no afectar scroll del documento ni LCP)
  useEffect(() => {
    if (!pillsRef.current || isPillsDragging || currentIndex === 0) return;
    const activeBtn = pillsRef.current.children[currentIndex];
    if (activeBtn) {
      const container = pillsRef.current;
      const left = activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [currentIndex, isPillsDragging]);

  // Fusionar eventos activos de base de datos con showcases culinarios
  const combinedEventos = useMemo(() => {
    const rawActive = eventos.filter((e) => isEventActiveInColombia(e, currentTick));

    const getEventRating = (e, prod) => {
      // 1. Verificar calificación del producto principal del evento en ratingsMap
      const prodId = e.idProducto || (prod ? (prod.id || prod.idProducto) : null);
      if (prodId && ratingsMap && ratingsMap[prodId]) {
        const rInfo = ratingsMap[prodId];
        if (rInfo && rInfo.total > 0 && rInfo.promedio > 0) {
          return {
            rating: Number(rInfo.promedio),
            totalResenas: Number(rInfo.total)
          };
        }
      }

      // 2. Si es un combo con productos asociados, calcular promedio real de sus productos
      if (e.productosAsociados && ratingsMap) {
        try {
          const parsed = typeof e.productosAsociados === "string" ? JSON.parse(e.productosAsociados) : e.productosAsociados;
          if (Array.isArray(parsed) && parsed.length > 0) {
            let sumPromedios = 0;
            let countRated = 0;
            let sumTotal = 0;
            parsed.forEach((asoc) => {
              const asocId = asoc.idProducto || asoc.id;
              if (asocId && ratingsMap[asocId] && ratingsMap[asocId].total > 0) {
                sumPromedios += Number(ratingsMap[asocId].promedio || 0);
                countRated += 1;
                sumTotal += Number(ratingsMap[asocId].total || 0);
              }
            });
            if (countRated > 0 && sumTotal > 0) {
              return {
                rating: Math.round((sumPromedios / countRated) * 10) / 10,
                totalResenas: sumTotal
              };
            }
          }
        } catch (err) {
          // ignore parsing error
        }
      }

      // 3. Si el evento trae rating explícito verificado con totalResenas
      if (e.totalResenas && Number(e.totalResenas) > 0 && e.rating) {
        return {
          rating: Number(e.rating),
          totalResenas: Number(e.totalResenas)
        };
      }

      // 4. Sin reseñas registradas
      return {
        rating: null,
        totalResenas: 0
      };
    };

    const enrichedDb = rawActive.map((e, idx) => {
      const meta = getEventThemeAndTag(e, idx);
      const theme = e.theme || meta.theme;
      const themeConfig = THEMES[theme] || THEMES.fire;
      const customTag = meta.tagText;
      const TagIcon = meta.TagIcon || themeConfig.TagIcon;
      const TitleIcon = meta.TitleIcon || themeConfig.TitleIcon;
      const prod = productos.find(
        (p) => String(p.id || p.idProducto) === String(e.idProducto)
      );
      const originalPrice = prod ? Number(prod.precio || 0) : 25000;
      let finalPrice = e.nuevoPrecio ? Number(e.nuevoPrecio) : null;
      if (!finalPrice && e.descuento && originalPrice) {
        finalPrice = Math.round(originalPrice * (1 - Number(e.descuento) / 100));
      }
      const ratingInfo = getEventRating(e, prod);

      return {
        ...e,
        theme,
        customTag,
        TagIcon,
        TitleIcon,
        precioOriginal: originalPrice,
        nuevoPrecio: finalPrice || originalPrice,
        perks: e.perks || [
          "Ingredientes 100% Frescos",
          "Personalización Completa",
          "Preparación al Momento",
          "Garantía de Calidad Chazin"
        ],
        tiempoPrep: e.tiempoPrep || "10-15 min",
        rating: ratingInfo.rating,
        totalResenas: ratingInfo.totalResenas,
        calorias: e.calorias || "~650 kcal"
      };
    });

    // Si no hay eventos activos registrados en la base de datos, no generamos simulaciones
    if (enrichedDb.length === 0) {
      return [];
    }

    return enrichedDb;
  }, [eventos, productos, ratingsMap]);

  const totalSlides = combinedEventos.length;

  // Autoplay continuo mediante temporizador limpio
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const timer = setInterval(() => {
      if (!document.hidden) {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
      }
    }, slideDuration);

    return () => clearInterval(timer);
  }, [totalSlides, isPaused, slideDuration]);

  // Reloj de cuenta regresiva en vivo (descuenta segundo a segundo con precisión absoluta sin demoras)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) {
        setCurrentTick(Date.now());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Navegación fluida por teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx) => {
    setCurrentIndex(idx);
  };

  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  const currentEvt = combinedEventos && combinedEventos.length > 0 ? (combinedEventos[currentIndex] || combinedEventos[0]) : null;
  const activeTheme = currentEvt ? (THEMES[currentEvt.theme] || THEMES.fire) : THEMES.fire;

  useEffect(() => {
    if (onThemeChange) {
      if (!combinedEventos || combinedEventos.length === 0) {
        onThemeChange(null);
      } else if (currentEvt) {
        onThemeChange({
          themeKey: currentEvt.theme || "fire",
          theme: activeTheme,
          hasEvents: true
        });
      }
    }
  }, [currentIndex, currentEvt, activeTheme, combinedEventos, onThemeChange]);

  if (!combinedEventos || combinedEventos.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Eventos y Ofertas Exclusivas Chazin Food"
      className="w-full px-3 sm:px-6 lg:px-8 py-5 select-none"
    >
      {/* Estilos CSS locales de animación fluida para el carrusel */}
      <style>{`
        @keyframes floatFoodPlate {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes timerPulse {
          0% { opacity: 0.9; }
          100% { opacity: 1; }
        }
        .animate-float-plate {
          transform: translateY(0);
          transition: transform 0.4s ease;
        }
        .animate-float-plate:hover {
          transform: translateY(-6px);
        }
        .animate-sweep {
          display: none;
        }
      `}</style>

      {/* HEADER SUPERIOR CON RELOJ DIGITAL Y ESTADO EN VIVO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 min-h-[52px]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-[#D9383A] text-white flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 text-[#D9383A] dark:text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-gray-900"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Experiencias & Ofertas Exclusivas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-red-50 dark:bg-red-950/60 text-[#D9383A] dark:text-red-300 border border-red-200/80 dark:border-red-900/50">
                En Vivo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 font-medium">
              Desliza para descubrir nuestras promociones especiales y platos recomendados de la casa.
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE HISTORIAS SEGMENTADAS (ESTILO APPLE / INSTAGRAM) */}
      <div className="w-full flex items-center gap-1.5 mb-3.5">
        {combinedEventos.map((evt, idx) => {
          const isCurrent = idx === currentIndex;
          const isPast = idx < currentIndex;
          return (
            <button
              key={evt.idEvento || idx}
              type="button"
              onClick={() => goToSlide(idx)}
              aria-label={`Ver oferta ${idx + 1}`}
              className="flex-1 h-1.5 sm:h-2 rounded-full overflow-hidden bg-slate-200/90 dark:bg-gray-800 transition-all cursor-pointer relative group"
            >
              <div
                className={`h-full transition-all ${
                  isCurrent
                    ? "bg-[#D9383A] w-full"
                    : isPast
                    ? "bg-slate-400 dark:bg-gray-600 w-full"
                    : "w-0"
                }`}
                style={{
                  transitionDuration: isCurrent ? `${slideDuration}ms` : "200ms",
                  transitionTimingFunction: "linear"
                }}
              />
              <span className="absolute inset-0 group-hover:bg-white/20 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* CONTENEDOR PRINCIPAL: DESLIZAMIENTO HORIZONTAL SUAVE (SLIDER TRACK 100% ESTABLE) */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative"
      >
        {/* Ventana de visualización con esquinas redondeadas y overflow hidden */}
        <div className="relative overflow-hidden rounded-3xl sm:rounded-4xl border border-slate-800/80 shadow-xl bg-[#0F172A]">
          {/* TRACK DESLIZANTE CON TRANSICIÓN HORIZONTAL ESTABLE (SIN will-change-transform ni backdrop-filter anidados para evitar límite de textura D3D11 >8192px en Windows) */}
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {combinedEventos.map((evt, idx) => {
              const theme = THEMES[evt.theme] || THEMES.fire;
              const prod = productos.find(
                (p) => String(p.id || p.idProducto) === String(evt.idProducto)
              );
              const origPrice = evt.precioOriginal || (prod ? Number(prod.precio) : 25000);
              const curPrice = evt.nuevoPrecio || (prod ? Number(prod.precio) : 20000);
              const saveAmount = Math.max(0, origPrice - curPrice);
              const savePct = origPrice > 0 ? Math.round((saveAmount / origPrice) * 100) : (evt.descuento || 20);

              const isRealUrl = (url) => typeof url === "string" && (url.startsWith("http") || url.startsWith("/"));
              const cardImage =
                (isRealUrl(evt?.imagen) ? evt.imagen : null) ||
                (isRealUrl(prod?.imagen) ? prod.imagen : null) ||
                (evt.icono === "fries"
                  ? "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80"
                  : evt.icono === "hotdog"
                  ? "https://res.cloudinary.com/dckwtknmq/image/upload/f_auto,q_auto,w_800,c_limit/v1788993441/c9pne5jrmjv5po93xhhl.jpg"
                  : "/hero-burger.webp");

              return (
                <div
                  key={evt.idEvento || idx}
                  className={`w-full shrink-0 relative bg-gradient-to-br ${theme.bg} text-white min-h-[380px] sm:min-h-[400px] flex flex-col justify-between overflow-hidden`}
                >
                  {/* Destello suave que barre la tarjeta */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                  {/* Top Bar de la diapositiva */}
                  <div className="relative z-10 px-4 sm:px-10 lg:px-16 pt-4 sm:pt-6 flex items-center justify-between gap-2.5 min-h-[56px]">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink min-w-0 py-0.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 ${theme.badgeBg}`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{formatTipoEvento(evt.tipoEvento) || "Evento Activo"}</span>
                      </span>

                      {/* Píldora de Calificación Real o Sin Reseñas */}
                      {evt.rating && Number(evt.rating) > 0 && evt.totalResenas > 0 ? (
                        <span
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800/90 text-white border border-slate-700/80 shrink-0 min-w-[88px]"
                          title={`Calificación: ${Number(evt.rating).toFixed(1)} / 5 (${evt.totalResenas} ${evt.totalResenas === 1 ? "reseña" : "reseñas"})`}
                        >
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{Number(evt.rating).toFixed(1)}</span>
                          <span className="text-[10px] text-amber-200/85 font-normal">({evt.totalResenas})</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/80 text-slate-200 border border-slate-700/70 shrink-0 min-w-[88px]"
                          title="Este producto aún no tiene reseñas de usuarios"
                        >
                          <Star className="w-3 h-3 text-slate-400" />
                          <span>Sin reseñas</span>
                        </span>
                      )}

                      {/* Tiempo de Preparación Detallado */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-100 border border-slate-700/70 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Preparación artesanal: {evt.tiempoPrep || "12 - 15 min"}</span>
                      </span>

                      {/* Temporizador Reloj Integrado Directamente dentro de la Tarjeta */}
                      {evt.fechaFin ? (() => {
                        const evtTimeLeft = calculateCountdown(evt.fechaFin, currentTick);
                        return (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-sm shrink-0 ${
                            evtTimeLeft.expirado
                              ? "bg-rose-950/90 text-rose-300 border-rose-500/40"
                              : "bg-slate-950/85 text-amber-300 border-amber-400/35"
                          }`}>
                            <Clock className={`w-3.5 h-3.5 ${evtTimeLeft.expirado ? "text-rose-400" : "text-amber-400 animate-pulse"}`} />
                            <span className="text-[10.5px] font-bold text-slate-200">
                              {evtTimeLeft.expirado ? "Estado:" : "Disponible:"}
                            </span>
                            <span className={`font-mono font-black ${evtTimeLeft.expirado ? "text-rose-300" : "text-amber-300"}`}>
                              {evtTimeLeft.expirado
                                ? "¡Finalizado!"
                                : `${String(evtTimeLeft.dias).padStart(2, "0")}d : ${String(evtTimeLeft.horas).padStart(2, "0")}h : ${String(evtTimeLeft.minutos).padStart(2, "0")}m : ${String(evtTimeLeft.segundos).padStart(2, "0")}s`}
                            </span>
                          </div>
                        );
                      })() : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-sm shrink-0 bg-emerald-950/85 text-emerald-200 border-emerald-400/40">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Vigencia Permanente</span>
                        </div>
                      )}
                    </div>

                    {savePct > 0 && (
                      <div className="shrink-0 flex items-center gap-1.5 bg-[#D9383A] text-white px-3 py-1 rounded-full text-xs font-black shadow-md">
                        <Percent className="w-3.5 h-3.5" />
                        <span>-{savePct}% OFF</span>
                      </div>
                    )}
                  </div>

                  {/* Contenido Central: Información gastronómica + Plato fotográfico */}
                  <div className="relative z-10 px-4 sm:px-10 lg:px-16 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Información y detalles */}
                    <div className="lg:col-span-7 space-y-3.5 text-left">
                      <div>
                        <div className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest ${theme.accent} mb-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 shadow-xs`}>
                          {evt.TagIcon && (
                            <evt.TagIcon size={14} className="shrink-0" />
                          )}
                          <span>{evt.customTag || theme.tagText || theme.tag}</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight flex items-center gap-2.5 flex-wrap">
                          {evt.TitleIcon && (
                            <evt.TitleIcon size={28} className="shrink-0 text-amber-400" />
                          )}
                          <span>{stripEmojis(evt.nombreEvento || evt.nombre)}</span>
                        </h3>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200/95 leading-relaxed font-normal max-w-xl line-clamp-2 sm:line-clamp-3">
                        {evt.descripcion && !/^(test|prueba|asdf)$/i.test(evt.descripcion.trim())
                          ? evt.descripcion
                          : "Disfruta de este plato seleccionado preparado con los ingredientes más frescos de la casa."}
                      </p>

                      {parseEventoInsumos(evt).length > 0 && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400/35 max-w-full">
                          <Gift className="w-4 h-4 text-emerald-300 shrink-0" />
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-100 truncate">
                            Incluye Topping Extra Gratis: {formatEventoToppingsText(evt)}
                          </span>
                        </div>
                      )}

                      {/* Comparativa de precio + Acción directa siempre visible */}
                      <div className="pt-2 flex items-center gap-3.5 flex-wrap">
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          {origPrice > curPrice && (
                            <div className="text-sm sm:text-base font-bold text-slate-400 line-through">
                              ${Number(origPrice).toLocaleString("es-CO")} COP
                            </div>
                          )}
                          <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white flex items-center gap-1 tracking-tight">
                            <span className="text-emerald-400">$</span>
                            <span>{Number(curPrice).toLocaleString("es-CO")}</span>
                            <span className="text-xs font-bold text-emerald-300 ml-1">COP</span>
                          </div>
                          {saveAmount > 0 && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                              Ahorras ${Number(saveAmount).toLocaleString("es-CO")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onSelectEvento && onSelectEvento(evt, prod || evt.producto)}
                          className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2.5 bg-gradient-to-r ${theme.btnGrad} transition-all duration-200 shadow-xl hover:scale-[1.02] active:scale-95 cursor-pointer`}
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                          <span>{evt.esProductoAleatorio ? "Pedir Ahora" : "Ver y Pedir Oferta"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Plato gastronómico flotante clickeable */}
                    <div className="lg:col-span-5 flex justify-center items-center relative">
                      <div
                        onClick={() => onSelectEvento && onSelectEvento(evt, prod || evt.producto)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelectEvento && onSelectEvento(evt, prod || evt.producto);
                          }
                        }}
                        title={`Abrir ${stripEmojis(evt.nombreEvento || evt.nombre || "promoción")}`}
                        className="relative w-52 h-52 sm:w-64 sm:h-64 lg:w-72 lg:h-72 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                      >
                        {/* Glow radial libre de filtros GPU */}
                        <div
                          className="absolute -inset-4 rounded-full pointer-events-none"
                          style={{
                            background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`
                          }}
                        />

                        <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden border-2 border-white/15 bg-slate-950/90 shadow-2xl p-2 flex items-center justify-center">
                          <img
                            src={getOptimizedImageUrl(cardImage, 360)}
                            alt={evt.nombreEvento || "Plato Chazin Food"}
                            width="288"
                            height="288"
                            style={{ aspectRatio: "1 / 1" }}
                            className="w-full h-full object-cover rounded-2xl"
                            loading={idx === 0 ? "eager" : "lazy"}
                            fetchpriority={idx === 0 ? "high" : "low"}
                            decoding="async"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/hero-burger.webp";
                            }}
                          />

                          <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/15 flex items-center justify-between text-xs">
                            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                              <ChefHat className="w-3.5 h-3.5" /> Receta Chazin
                            </span>
                            <span className="text-[10px] text-slate-300">{evt.calorias || "~700 kcal"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer de indicadores del carrusel */}
                  <div className="relative z-10 px-4 sm:px-10 lg:px-16 pb-4 pt-2 flex items-center justify-between gap-4 border-t border-white/10 bg-slate-950/65">
                    <button
                      type="button"
                      onClick={() => onSelectEvento && onSelectEvento(evt, prod || evt.producto)}
                      className="text-xs font-bold text-amber-300 hover:text-white transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Personalizar y agregar al carrito</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Indicadores de diapositivas */}
                    <div className="flex items-center justify-center gap-1">
                      {combinedEventos.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => goToSlide(dotIdx)}
                          className="p-2 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                          aria-label={`Diapositiva ${dotIdx + 1}`}
                        >
                          <span
                            className={`h-2 rounded-full transition-all duration-300 block ${
                              currentIndex === dotIdx
                                ? "w-7 bg-white shadow-sm"
                                : "w-2 bg-white/35 hover:bg-white/70"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-white/60">
                      <span>{currentIndex + 1}</span>
                      <span>/</span>
                      <span>{totalSlides}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTÓN NAVEGACIÓN IZQUIERDO */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Slide anterior"
            className="hidden sm:flex absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-white items-center justify-center transition-all duration-200 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer group"
          >
            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
          </button>

          {/* BOTÓN NAVEGACIÓN DERECHO */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Siguiente slide"
            className="hidden sm:flex absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-white items-center justify-center transition-all duration-200 shadow-2xl hover:scale-110 active:scale-95 cursor-pointer group"
          >
            <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* DOCK INFERIOR: SELECTOR DE PÍLDORAS CON ACCESO DIRECTO Y ARRASTRE SUAVE */}
      <div
        ref={pillsRef}
        onMouseDown={handlePillsMouseDown}
        onMouseMove={handlePillsMouseMove}
        onMouseUp={handlePillsMouseUp}
        onMouseLeave={handlePillsMouseLeave}
        className={`mt-4 flex items-center gap-3 overflow-x-auto no-scrollbar touch-scroll-x py-2.5 px-4 sm:px-6 select-none ${
          isPillsDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ scrollBehavior: isPillsDragging ? "auto" : "smooth" }}
      >
        {combinedEventos.map((evt, idx) => {
          const isSelected = idx === currentIndex;
          const badgeConfig = getEventBadgeConfig(evt);
          const BadgeIcon = badgeConfig?.Icon;
          const cleanName = badgeConfig?.fullLabel || stripEmojis(evt.nombreEvento || evt.nombre || "");

          return (
            <button
              key={evt.idEvento || idx}
              type="button"
              onClick={() => {
                if (pillsHasDragged.current) return;
                if (isSelected) {
                  const matchedProd = productos.find(
                    (p) => String(p.id || p.idProducto) === String(evt.idProducto)
                  );
                  onSelectEvento?.(evt, matchedProd || evt.producto);
                } else {
                  goToSlide(idx);
                }
              }}
              className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                isSelected
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md"
                  : "bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-300 border-slate-200/85 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-700 shadow-2xs"
              }`}
            >
              {BadgeIcon ? (
                <BadgeIcon size={16} stroke={2} className={isSelected ? "text-amber-400 dark:text-[#D9383A]" : "text-slate-500 dark:text-gray-400"} />
              ) : (
                <FoodIcon name={evt.icono || "burger"} size={16} />
              )}
              <span className="truncate max-w-[150px] sm:max-w-[200px] whitespace-nowrap">{cleanName}</span>
              {Number(evt.descuento) > 0 && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                    isSelected
                      ? "bg-[#D9383A] text-white font-black"
                      : "bg-red-50 dark:bg-red-950/60 text-[#D9383A] dark:text-red-300 border border-red-200/80 dark:border-red-900/50 font-extrabold"
                  }`}
                >
                  -{evt.descuento}%
                </span>
              )}
            </button>
          );
        })}
        {/* Espaciador al final para garantizar que la última píldora nunca quede pegada ni recortada */}
        <div className="w-4 shrink-0 pointer-events-none" />
      </div>
    </section>
  );
}
