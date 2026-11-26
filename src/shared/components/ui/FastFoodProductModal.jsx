import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  Star,
  Clock,
  Utensils,
  ShieldCheck,
  Flame,
  ChefHat,
  Sliders,
  Sparkles,
  Layers,
  FileText,
  Info,
  Check,
  MessageSquare,
  ThumbsUp,
  Award,
  Send,
  User as UserIcon,
  UtensilsCrossed,
  Lock,
  AlertCircle,
  Globe,
  Pencil,
  Trash2
} from "lucide-react";
import { getProductEmoji, getAdditionEmoji, stripEmojis, isDummyOrBaseVariant, parseEventoInsumos, formatEventoToppingsText } from "@/shared/utils/foodEmojiUtils";
import { isVariantActive, isVariantFromEvent } from "@/shared/utils/productVariantUtils";
import { classifyVariantCategory, classifyVariantIngredientStatus, summarizeVariantExtras, buildVariantChangesSummary } from "@/features/ventas/utils/variantFichaUtils";
import ProductVariantInspector from "@/shared/components/ui/ProductVariantInspector";
import { getOptimizedImageUrl } from "@/shared/utils/imageUtils";
import { FoodIcon, FoodIconBadge, EventoToppingsCard } from "@/shared/components/ui/FoodIcon";
import { apiClient } from "@/shared/api/apiClient";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { fichasTecnicasService } from "@/features/fichas-tecnicas/servicios/fichasTecnicasService";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { isEventActiveInColombia, evaluateEventVigencia } from "@/shared/utils/dateUtils";
import postobonUvaImg from "@/shared/assets/drinks/postobon_uva.jpg";
import postobonNaranjaImg from "@/shared/assets/drinks/postobon_naranja.jpg";

const FALLBACK_ADICION_IMAGES = {
  tocineta: "https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=500&auto=format&fit=crop&q=80",
  queso: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=500&auto=format&fit=crop&q=80",
  papa: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80",
  cebolla: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80",
  jalapeno: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80",
  salsa: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=500&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80"
};

export const getAdicionDisplayImage = (ad) => {
  if (!ad) return FALLBACK_ADICION_IMAGES.default;
  if (typeof ad.imagen === "string" && ad.imagen.startsWith("http")) return ad.imagen;
  if (typeof ad.foto === "string" && ad.foto.startsWith("http")) return ad.foto;

  const name = String(ad.nombre || "").toLowerCase();
  if (name.includes("tocineta") || name.includes("bacon")) return FALLBACK_ADICION_IMAGES.tocineta;
  if (name.includes("queso") || name.includes("cheddar")) return FALLBACK_ADICION_IMAGES.queso;
  if (name.includes("papa") || name.includes("francesa")) return FALLBACK_ADICION_IMAGES.papa;
  if (name.includes("cebolla")) return FALLBACK_ADICION_IMAGES.cebolla;
  if (name.includes("jalapeño") || name.includes("jalapeno") || name.includes("picante")) return FALLBACK_ADICION_IMAGES.jalapeno;
  if (name.includes("salsa")) return FALLBACK_ADICION_IMAGES.salsa;

  return FALLBACK_ADICION_IMAGES.default;
};

export const OFFICIAL_DRINK_IMAGES = {
  coca_cola: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790135864/hynoiytmhuddsnatwcxz.png",
  coca_cola_light: "/images/drinks/coca_cola_light_400ml.png",
  manzana: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790135903/lhmojjdrn1bzp3dsz47f.png",
  pepsi: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790135953/upv7fsv9osr2f7ap6cbn.png",
  colombiana: "https://res.cloudinary.com/dckwtknmq/image/upload/v1789001495/qy8wy9igmgb0wppnjavw.png",
  sprite: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790136141/cpxa3npdfd0lyxjizicy.png",
  quatro: "/images/drinks/quatro_400ml.png",
  agua: "https://res.cloudinary.com/dckwtknmq/image/upload/v1789342838/pj5qlfpmxeddkkmjauyw.png",
  uva: "https://res.cloudinary.com/dckwtknmq/image/upload/v1790137310/fxidthj8xu1nuvp0khfo.png",
  naranja: "/images/drinks/images__Gaseosa_naranja_-removebg-preview.png"
};

export const resolveDrinkImage = (item) => {
  if (!item) return OFFICIAL_DRINK_IMAGES.coca_cola;
  if (typeof item.imagen === "string" && (item.imagen.startsWith("http") || item.imagen.startsWith("/images/"))) {
    return item.imagen;
  }
  const name = String(item.nombre || item || "").toLowerCase();
  if (name.includes("coca") && (name.includes("sin az") || name.includes("light") || name.includes("zero"))) {
    return OFFICIAL_DRINK_IMAGES.coca_cola_light;
  }
  if (name.includes("coca")) return OFFICIAL_DRINK_IMAGES.coca_cola;
  if (name.includes("manzana")) return OFFICIAL_DRINK_IMAGES.manzana;
  if (name.includes("pepsi")) return OFFICIAL_DRINK_IMAGES.pepsi;
  if (name.includes("colombiana")) return OFFICIAL_DRINK_IMAGES.colombiana;
  if (name.includes("sprite")) return OFFICIAL_DRINK_IMAGES.sprite;
  if (name.includes("quatro") || name.includes("cuatro")) return OFFICIAL_DRINK_IMAGES.quatro;
  if (name.includes("agua") || name.includes("cristal")) return OFFICIAL_DRINK_IMAGES.agua;
  if (name.includes("uva")) return OFFICIAL_DRINK_IMAGES.uva;
  if (name.includes("naranja")) return OFFICIAL_DRINK_IMAGES.naranja;
  return OFFICIAL_DRINK_IMAGES.coca_cola;
};

export const isDrinkProduct = (item) => {
  if (!item) return false;
  const catId = Number(item.idCategoriaProducto !== undefined ? item.idCategoriaProducto : item.categoria);
  const catName = String(item.categoriaNombre || item.categoria?.nombre || (typeof item.categoria === "string" ? item.categoria : "") || "").toLowerCase();
  const name = String(item.nombre || "").toLowerCase();
  const tipo = String(item.tipo || "").toLowerCase();

  // EXCLUSIÓN ESTRICTA: Platos fuertes, combos, hamburguesas, perros y papas NUNCA son bebidas simples
  if (
    catId === 1 || // Hamburguesas
    catId === 2 || // Perros Calientes
    catId === 3 || // Salchipapas Gourmet
    catId === 5 || // Combos
    catName.includes("hamburguesa") ||
    catName.includes("combo") ||
    catName.includes("perro") ||
    catName.includes("salchipapa") ||
    catName.includes("acompañamiento") ||
    name.includes("hamburguesa") ||
    name.includes("burger") ||
    name.includes("combo") ||
    name.includes("perro") ||
    name.includes("salchipapa") ||
    name.includes("papas con") ||
    tipo === "combo" ||
    tipo === "plato fuerte"
  ) {
    return false;
  }

  return (
    catId === 4 ||
    tipo === "bebida" ||
    catName.includes("bebida") ||
    catName.includes("gaseosa") ||
    catName.includes("refresco") ||
    name.includes("gaseosa") ||
    name.includes("coca-cola") ||
    name.includes("coca cola") ||
    name.includes("postobón") ||
    name.includes("postobon") ||
    name.includes("pepsi") ||
    name.includes("colombiana") ||
    name.includes("sprite") ||
    name.includes("cuatro") ||
    name.includes("agua cristal") ||
    name.includes("cristal sin gas") ||
    name.includes("h2oh") ||
    name.includes("mr tea")
  );
};

export const getDrinkBrandMeta = (name = "") => {
  const n = String(name).toLowerCase();
  if ((n.includes("coca") || n.includes("cola")) && (n.includes("light") || n.includes("sin az") || n.includes("zero") || n.includes("cero"))) {
    return { color: "#1F2937", badge: "0% Azúcar", badgeColor: "bg-black text-white border border-gray-700", marca: "The Coca-Cola Company" };
  }
  if (n.includes("coca") || n.includes("cola")) {
    return { color: "#E61C24", badge: "Sabor Original", badgeColor: "bg-red-600 text-white", marca: "The Coca-Cola Company" };
  }
  if (n.includes("pepsi") && (n.includes("light") || n.includes("black") || n.includes("zero") || n.includes("cero"))) {
    return { color: "#0F172A", badge: "0% Azúcar", badgeColor: "bg-gray-900 text-cyan-400 border border-cyan-500/40", marca: "PepsiCo" };
  }
  if (n.includes("pepsi")) {
    return { color: "#004B93", badge: "Pepsi Regular", badgeColor: "bg-blue-700 text-white", marca: "PepsiCo" };
  }
  if (n.includes("uva")) {
    return { color: "#7B1FA2", badge: "Uva Dulce", badgeColor: "bg-purple-600 text-white", marca: "Postobón" };
  }
  if (n.includes("naranja")) {
    return { color: "#FF6D00", badge: "Cítrica", badgeColor: "bg-orange-500 text-white", marca: "Postobón" };
  }
  if (n.includes("manzana")) {
    return { color: "#E11D48", badge: "Rosada", badgeColor: "bg-rose-500 text-white", marca: "Postobón" };
  }
  if (n.includes("colombiana")) {
    return { color: "#EA580C", badge: "La Nuestra", badgeColor: "bg-amber-600 text-white", marca: "Postobón" };
  }
  if (n.includes("sprite")) {
    return { color: "#059669", badge: "Lima-Limón", badgeColor: "bg-emerald-600 text-white", marca: "The Coca-Cola Company" };
  }
  if (n.includes("cuatro") || n.includes("quatro") || n.includes("toronja")) {
    return { color: "#D97706", badge: "Toronja", badgeColor: "bg-amber-600 text-white", marca: "The Coca-Cola Company" };
  }
  if (n.includes("cristal") || n.includes("agua")) {
    return { color: "#0284C7", badge: "100% Pura", badgeColor: "bg-sky-600 text-white", marca: "Postobón" };
  }
  return { color: "#f05454", badge: "Refrescante", badgeColor: "bg-red-500 text-white", marca: "Bebida Chazin" };
};

export const isWaterProduct = (item) => {
  if (!item) return false;
  const name = String(item.nombre || "").toLowerCase();
  const desc = String(item.descripcion || "").toLowerCase();
  return (
    name.includes("agua") ||
    name.includes("cristal") ||
    desc.includes("agua pura") ||
    desc.includes("agua cristal")
  );
};

export const hasDrinkSizes = (item) => {
  if (!item) return false;
  if (isWaterProduct(item)) return false;
  return isDrinkProduct(item);
};

export const STANDARD_DRINK_SIZES = [
  {
    id: "400ml",
    sizeKey: "400",
    label: "400 ml",
    title: "Botella 400 ml",
    tag: "Personal",
    porciones: "1 porción (400ml)",
    subtext: "Personal • 400 ml bien fría",
    defaultPostobonPrice: 4000,
    defaultPremiumPrice: 4500
  },
  {
    id: "1.5L",
    sizeKey: "1.5",
    label: "1.5 Litros",
    title: "Botella 1.5 Litros",
    tag: "Familiar",
    porciones: "4 a 5 vasos (1.5L)",
    subtext: "Familiar • 1.5 L para compartir",
    defaultPostobonPrice: 8500,
    defaultPremiumPrice: 9500
  },
  {
    id: "2.5L",
    sizeKey: "2.5",
    label: "2.5 Litros",
    title: "Mega Botella 2.5 Litros",
    tag: "Mega Familiar",
    porciones: "7 a 8 vasos (2.5L)",
    subtext: "Mega familiar • 2.5 L máximo ahorro",
    defaultPostobonPrice: 12000,
    defaultPremiumPrice: 13500
  }
];

export const getDrinkBottleImage = (sizeId, prod, activeFlavorOrVariant = null, isDiet = false) => {
  const variantName = activeFlavorOrVariant
    ? (typeof activeFlavorOrVariant === "string"
        ? activeFlavorOrVariant.toLowerCase()
        : String(activeFlavorOrVariant.nombre || activeFlavorOrVariant.title || activeFlavorOrVariant.id || "").toLowerCase())
    : "";

  const prodName = String(prod?.nombre || "").toLowerCase();

  const isExplicitlyRegular =
    variantName.includes("con az") ||
    variantName.includes("con azúcar") ||
    variantName.includes("con azucar") ||
    variantName.includes("original") ||
    variantName.includes("regular");

  let dietActive = false;
  if (!isExplicitlyRegular) {
    if (isDiet) {
      dietActive = true;
    } else if (variantName.includes("light") || variantName.includes("sin az") || variantName.includes("zero") || variantName.includes("black")) {
      dietActive = true;
    } else if (prodName.includes("light") || prodName.includes("sin az") || prodName.includes("zero") || prodName.includes("cero")) {
      dietActive = true;
    }
  }

  const hasExplicitFlavor =
    variantName.includes("uva") ||
    variantName.includes("naranja") ||
    variantName.includes("colombiana") ||
    variantName.includes("manzana") ||
    variantName.includes("sprite") ||
    variantName.includes("cuatro") ||
    variantName.includes("quatro") ||
    variantName.includes("pepsi");

  const hasUva = variantName.includes("uva") || (prodName.includes("uva") && !hasExplicitFlavor);
  const hasNaranja = variantName.includes("naranja") || (prodName.includes("naranja") && !hasExplicitFlavor);
  const hasColombiana = variantName.includes("colombiana") || (prodName.includes("colombiana") && !hasExplicitFlavor);
  const hasManzana = variantName.includes("manzana") || (prodName.includes("manzana") && !hasExplicitFlavor);
  const hasCoca = (variantName.includes("coca") || prodName.includes("coca")) && !hasUva && !hasNaranja && !hasColombiana && !hasManzana && !variantName.includes("pepsi") && !variantName.includes("sprite") && !variantName.includes("cuatro") && !variantName.includes("quatro");
  const hasPepsi = (variantName.includes("pepsi") || prodName.includes("pepsi")) && !hasUva && !hasNaranja && !hasColombiana && !hasManzana && !variantName.includes("coca") && !variantName.includes("sprite") && !variantName.includes("cuatro");
  const hasSprite = variantName.includes("sprite") || (prodName.includes("sprite") && !hasExplicitFlavor);
  const hasQuatro = variantName.includes("cuatro") || variantName.includes("quatro") || ((prodName.includes("cuatro") || prodName.includes("quatro")) && !hasExplicitFlavor);

  if (sizeId === "400ml") {
    if (hasUva) return "/images/drinks/uva_postobon-removebg-preview.png";
    if (hasNaranja) return "/images/drinks/images__Gaseosa_naranja_-removebg-preview.png";
    if (hasColombiana) return "https://res.cloudinary.com/dckwtknmq/image/upload/v1789001495/qy8wy9igmgb0wppnjavw.png";
    if (hasManzana) return "/images/drinks/manzana_400ml-removebg-preview.png";
    if (hasCoca) {
      if (dietActive) return "/images/drinks/coca_cola_light_400ml.png";
      return OFFICIAL_DRINK_IMAGES.coca_cola;
    }
    if (hasPepsi) {
      if (dietActive) return "/images/drinks/pepsi_light-removebg-preview.png";
      return "/images/drinks/pepsi_400ml-removebg-preview.png";
    }
    if (hasSprite) return "/images/drinks/sprite-removebg-preview.png";
    if (hasQuatro) return "/images/drinks/quatro_400ml.png";
    return (typeof activeFlavorOrVariant === "object" && activeFlavorOrVariant?.imagen) || prod?.imagen || "/images/drinks/uva_postobon-removebg-preview.png";
  }

  if (sizeId === "1.5L") {
    if (hasUva) return "/images/drinks/bebida-uva-1500ml_00-600x600-removebg-preview.png";
    if (hasNaranja) return "/images/drinks/naranga_1.5-removebg-preview.png";
    if (hasColombiana) return "/images/drinks/colombiana_1.5_L-removebg-preview.png";
    if (hasManzana) return "/images/drinks/manzana_1.5_L-removebg-preview.png";
    if (hasCoca) {
      if (dietActive) return "/images/drinks/coca_cola_zero_1.5L.jpg";
      return "/images/drinks/coca_cola_1.5-LITROS-removebg-preview.png";
    }
    if (hasPepsi) return "/images/drinks/pepsi_1.5-removebg-preview.png";
    if (hasSprite) return "/images/drinks/komx_mx_sprite_15.webp";
    if (hasQuatro) return "/images/drinks/gaseosa-quatro-15-lt-removebg-preview.png";
    return "/images/drinks/manzana_1.5_L-removebg-preview.png";
  }

  if (sizeId === "2.5L") {
    if (hasUva) return "/images/drinks/Uva_mega-removebg-preview.png";
    if (hasNaranja) return "/images/drinks/postob_n_naranja_2.5l_1_-removebg-preview.png";
    if (hasColombiana) return "/images/drinks/colombiana_pet_2.5l-removebg-preview.png";
    if (hasManzana) return "/images/drinks/Manzana-Super-Gigante-25-Litros-223182_a-removebg-preview.png";
    if (hasCoca) {
      if (dietActive) return "/images/drinks/coca_cola_zero_2.5L.jpg";
      return "/images/drinks/mega_coca_cola-removebg-preview.png";
    }
    if (hasPepsi) return "/images/drinks/mega_pepsi-removebg-preview.png";
    if (hasSprite) return "/images/drinks/spr-limalimo-nor-pet-2.5l-removebg-preview.png";
    if (hasQuatro) return "/images/drinks/quatro_mega-removebg-preview.png";
    return "/images/drinks/Manzana-Super-Gigante-25-Litros-223182_a-removebg-preview.png";
  }

  return prod?.imagen || "/images/drinks/manzana_400ml-removebg-preview.png";
};

export const SODA_FLAVORS = [
  { id: "coca-cola", nombre: "Coca-Cola Original", color: "#E61C24" },
  { id: "coca-cola-light", nombre: "Coca-Cola Light", color: "#C0C0C0" },
  { id: "manzana-postobon", nombre: "Manzana Postobón", color: "#E11D48" },
  { id: "uva-postobon", nombre: "Uva Postobón", color: "#7B1FA2" },
  { id: "naranja-postobon", nombre: "Naranja Postobón", color: "#FF6D00" },
  { id: "colombiana-postobon", nombre: "Colombiana Postobón", color: "#EA580C" },
  { id: "pepsi", nombre: "Pepsi", color: "#004B93" },
  { id: "pepsi-light", nombre: "Pepsi Light", color: "#0F172A" },
  { id: "sprite", nombre: "Sprite", color: "#059669" },
  { id: "cuatro", nombre: "Quatro Toronja", color: "#D97706" },
  { id: "agua-cristal", nombre: "Agua Cristal", color: "#0284C7" }
];

export const detectDefaultFlavor = (prod) => {
  if (!prod) return SODA_FLAVORS[0];
  const name = String(prod.nombre || "").toLowerCase();
  if (name.includes("uva")) return SODA_FLAVORS.find((f) => f.id === "uva-postobon") || SODA_FLAVORS[3];
  if (name.includes("naranja")) return SODA_FLAVORS.find((f) => f.id === "naranja-postobon") || SODA_FLAVORS[4];
  if (name.includes("manzana")) return SODA_FLAVORS.find((f) => f.id === "manzana-postobon") || SODA_FLAVORS[2];
  if (name.includes("colombiana")) return SODA_FLAVORS.find((f) => f.id === "colombiana-postobon") || SODA_FLAVORS[5];
  if (name.includes("pepsi") && (name.includes("light") || name.includes("black") || name.includes("zero"))) {
    return SODA_FLAVORS.find((f) => f.id === "pepsi-light") || SODA_FLAVORS[7];
  }
  if (name.includes("pepsi")) return SODA_FLAVORS.find((f) => f.id === "pepsi") || SODA_FLAVORS[6];
  if (name.includes("sprite")) return SODA_FLAVORS.find((f) => f.id === "sprite") || SODA_FLAVORS[8];
  if (name.includes("cuatro")) return SODA_FLAVORS.find((f) => f.id === "cuatro") || SODA_FLAVORS[9];
  if (name.includes("agua") || name.includes("cristal")) return SODA_FLAVORS.find((f) => f.id === "agua-cristal") || SODA_FLAVORS[10];
  if (name.includes("light") || name.includes("zero") || name.includes("sin azucar")) {
    return SODA_FLAVORS.find((f) => f.id === "coca-cola-light") || SODA_FLAVORS[1];
  }
  return SODA_FLAVORS[0];
};

export const isPostobonDrinkProduct = (item) => {
  if (!item) return false;
  const name = String(item.nombre || "").toLowerCase();
  const desc = String(item.descripcion || "").toLowerCase();
  return (
    name.includes("postob") ||
    name.includes("colombiana") ||
    name.includes("manzana") ||
    name.includes("uva") ||
    name.includes("naranja") ||
    desc.includes("postob")
  );
};

export const detectDefaultDrinkSize = (prod) => {
  const name = String(prod?.nombre || "").toLowerCase();
  if (name.includes("2.5") || name.includes("2,5") || name.includes("mega")) return "2.5L";
  if (name.includes("1.5") || name.includes("1,5") || name.includes("familiar")) return "1.5L";
  return "400ml";
};

import { isEssentialIngredient } from "@/shared/utils/ingredientUtils";
export { isEssentialIngredient };

export const resolveInsumoPersonalizable = (detalleOrInsumo, producto = null) => {
  const rawName = String(
    detalleOrInsumo?.insumo?.nombre ||
    detalleOrInsumo?.nombreInsumo ||
    detalleOrInsumo?.nombre ||
    detalleOrInsumo ||
    ""
  ).trim();

  if (!rawName) return null;
  const n = rawName.toLowerCase();

  // Excluir bebidas o líquidos envasados si vienen en el combo de la ficha
  if (
    n.includes("gaseosa") ||
    n.includes("bebida") ||
    n.includes("refresco") ||
    n.includes("postob") ||
    n.includes("coca") ||
    n.includes("pepsi") ||
    n.includes("sprite") ||
    n.includes("quatro") ||
    n.includes("agua cristal") ||
    n.includes("jugo")
  ) {
    return null;
  }

  // Mapeo semántico de icono vectorial FoodIcon (vegetales e ingredientes frescos primero)
  let icono = "kitchen";
  if (n.includes("lechuga") || n.includes("lettuce")) icono = "lettuce";
  else if (n.includes("suero") || n.includes("suero costeño") || n.includes("suero costeno")) icono = "suero_costeno";
  else if (n.includes("tomate") || n.includes("tomato")) icono = "tomato";
  else if (n.includes("cebolla") || n.includes("onion")) icono = "onion";
  else if (n.includes("salsa de queso") || n.includes("salsa queso") || (n.includes("salsa") && (n.includes("queso") || n.includes("cheddar")))) icono = "salsa_queso";
  else if (n.includes("queso") || n.includes("cheddar") || n.includes("mozzarella") || n.includes("costeño") || n.includes("costeno")) icono = "cheese";
  else if (n.includes("tocineta") || n.includes("bacon") || n.includes("tocino")) icono = "bacon";
  else if (n.includes("aguacate") || n.includes("guacamole") || n.includes("avocado")) icono = "avocado";
  else if (n.includes("jalapeño") || n.includes("jalapeno") || n.includes("chile") || n.includes("picante") || n.includes("pepper")) icono = "pepper";
  else if (n.includes("champiñon") || n.includes("champinon") || n.includes("hongo") || n.includes("mushroom")) icono = "mushroom";
  else if (n.includes("carne") || n.includes("hamburguesa") || n.includes("de res") || /\bres\b/.test(n) || n.includes("patty") || n.includes("beef")) icono = "meat";
  else if (n.includes("pollo") || n.includes("pechuga") || n.includes("alitas") || n.includes("chicken")) icono = "chicken";
  else if (n.includes("salchicha") || n.includes("chorizo") || n.includes("butifarra") || n.includes("sausage")) icono = "sausage";
  else if (n.includes("papa") || n.includes("ripio") || n.includes("francesa") || n.includes("fries")) icono = "fries";
  else if (n.includes("pan") || n.includes("brioche") || n.includes("bread")) icono = "bread";
  else if (n.includes("salsa") || n.includes("mayonesa") || n.includes("tartara") || n.includes("tártara") || n.includes("bbq") || n.includes("mostaza") || n.includes("ketchup")) icono = "sauce";
  else if (n.includes("huevo") || n.includes("codorniz") || n.includes("egg")) icono = "egg";
  else if (n.includes("maiz") || n.includes("maíz") || n.includes("choclo")) icono = "salad";
  else if (n.includes("pepinillo")) icono = "salad";
  else if (n.includes("zanahoria") || n.includes("carrot")) icono = "carrot";

  // ID único normalizado
  const cleanId = rawName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const isEssential = isEssentialIngredient(rawName, producto);

  return {
    id: cleanId,
    nombre: rawName,
    icono,
    esencial: isEssential
  };
};

export const extractPersonalizables = (producto, ficha, selectedVariant = null) => {
  if (!producto || isDrinkProduct(producto)) return [];
  const catName = String(producto.categoria || producto.categoriaNombre || "").toLowerCase();
  if (catName.includes("bebida") || catName.includes("gaseosa") || String(producto.nombre || "").toLowerCase().includes("gaseosa")) {
    return [];
  }

  const varFichaDetalles =
    Array.isArray(selectedVariant?.fichaTecnica?.detalles) && selectedVariant.fichaTecnica.detalles.length > 0
      ? selectedVariant.fichaTecnica.detalles
      : null;
  let detalles = varFichaDetalles
    ? [...varFichaDetalles]
    : (ficha?.detalles ? [...ficha.detalles] : (ficha?.insumos ? [...ficha.insumos] : []));
  const varDeltas = varFichaDetalles ? [] : (selectedVariant?.insumosModificados || []);

  if (varDeltas && varDeltas.length > 0) {
    for (const delta of varDeltas) {
      const accion = String(delta.tipoAccion || "AGREGAR").toUpperCase();
      if (accion === "AGREGAR") {
        detalles.push({
          idInsumo: delta.idInsumo,
          nombre: delta.insumo?.nombre || `Insumo #${delta.idInsumo}`,
          insumo: delta.insumo || { idInsumo: delta.idInsumo, nombre: delta.insumo?.nombre }
        });
      } else if (accion === "REEMPLAZAR") {
        if (delta.idInsumoReemplazado) {
          detalles = detalles.filter(d => Number(d.idInsumo || d.insumo?.idInsumo) !== Number(delta.idInsumoReemplazado));
        }
        detalles.push({
          idInsumo: delta.idInsumo,
          nombre: delta.insumo?.nombre || `Insumo #${delta.idInsumo}`,
          insumo: delta.insumo || { idInsumo: delta.idInsumo, nombre: delta.insumo?.nombre }
        });
      } else if (accion === "QUITAR") {
        detalles = detalles.filter(d => Number(d.idInsumo || d.insumo?.idInsumo) !== Number(delta.idInsumo));
      }
    }
  }

  const items = [];
  const seenNames = new Set();

  // 1. EXTRAER DIRECTAMENTE DE LA FICHA TÉCNICA (DETALLES CON INSUMOS REALES)
  const baseDetallesRef = ficha?.detalles || ficha?.insumos || [];
  const variantDeltasAll = selectedVariant?.insumosModificados || [];

  if (detalles && Array.isArray(detalles) && detalles.length > 0) {
    for (const d of detalles) {
      const item = resolveInsumoPersonalizable(d, producto);
      if (item && !seenNames.has(item.nombre.toLowerCase())) {
        seenNames.add(item.nombre.toLowerCase());
        const variantStatus = (selectedVariant && !selectedVariant.esOriginal)
          ? classifyVariantIngredientStatus(d, baseDetallesRef, variantDeltasAll, false)
          : null;
        items.push({
          ...item,
          variantStatus: variantStatus?.isExtra ? variantStatus : null
        });
      }
    }
  }

  // 2. EXTRAER DE FICHA.INGREDIENTES (SI EXISTE ARRAY DE INGREDIENTES)
  if (items.length === 0 && ficha?.ingredientes && Array.isArray(ficha.ingredientes) && ficha.ingredientes.length > 0) {
    for (const s of ficha.ingredientes) {
      const item = resolveInsumoPersonalizable(s, producto);
      if (item && !seenNames.has(item.nombre.toLowerCase())) {
        seenNames.add(item.nombre.toLowerCase());
        items.push(item);
      }
    }
  }

  // Retornar exclusivamente los insumos reales de la Ficha Técnica en base de datos
  return items;
};

const QUICK_KITCHEN_TAGS = [
  "Salsas aparte",
  "Bien cocido/a",
  "Término medio",
  "Sin sal adicional",
  "Poco picante",
  "Servir caliente"
];

const QUICK_DRINK_TAGS = [
  "Con hielo",
  "Sin hielo",
  "Con pitillo / pajilla",
  "Vaso adicional",
  "Sin azúcar"
];

function formatFechaRelativa(dateStr) {
  if (!dateStr) return "Reciente";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  } catch {
    return "Reciente";
  }
}

export const resolveNutritionalSpecs = (producto, ficha) => {
  const prodName = String(producto?.nombre || ficha?.producto?.nombre || "").toLowerCase();
  const catName = String(producto?.categoriaNombre || producto?.categoria?.nombre || (typeof producto?.categoria === 'string' ? producto.categoria : '') || "").toLowerCase();
  const infoNut = String(ficha?.informacionNutricional || "");
  const rendText = String(ficha?.rendimiento || "");

  // 1. Resolver Rendimiento
  let rendimiento = ficha?.rendimiento;
  if (!rendimiento || rendimiento === "1 porción") {
    if (prodName.includes("agua") || prodName.includes("gaseosa") || prodName.includes("coca") || prodName.includes("pepsi") || prodName.includes("postob") || catName.includes("bebida")) {
      rendimiento = prodName.includes("600ml") ? "1 porción (600ml)" : "1 porción (400ml)";
    } else if (prodName.includes("combo")) {
      rendimiento = "2 personas (1.6 kg combo)";
    } else if (prodName.includes("salchipapa")) {
      rendimiento = "1 porción generosa (560g)";
    } else if (prodName.includes("doble")) {
      rendimiento = "1 porción grande (540g)";
    } else if (prodName.includes("trufada") || prodName.includes("fest")) {
      rendimiento = "1 hamburguesa gourmet (430g)";
    } else if (prodName.includes("espiral")) {
      rendimiento = "1 porción espiral (200g)";
    } else if (prodName.includes("casco") || prodName.includes("corral")) {
      rendimiento = prodName.includes("grande") ? "1 porción grande (240g)" : "1 porción mediana (160g)";
    } else if (prodName.includes("francesa")) {
      rendimiento = "1 porción (150g)";
    } else {
      rendimiento = rendimiento || "1 porción";
    }
  }

  // 2. Resolver Peso
  let peso = ficha?.peso;
  if (!peso || peso === "350g") {
    const rendMatch = rendText.match(/\((\d+(?:\.\d+)?\s*(?:g|kg|ml|oz|l))/i);
    if (rendMatch) {
      peso = rendMatch[1].trim();
    } else if (prodName.includes("agua")) {
      peso = prodName.includes("600ml") ? "600ml" : "500ml";
    } else if (prodName.includes("gaseosa") || prodName.includes("coca") || prodName.includes("pepsi") || prodName.includes("postob") || prodName.includes("sprite") || prodName.includes("quatro") || catName.includes("bebida")) {
      peso = "400ml";
    } else if (prodName.includes("chili")) {
      peso = prodName.includes("bebida") ? "720g (combo)" : "320g";
    } else if (prodName.includes("tocineta") && prodName.includes("papa")) {
      peso = prodName.includes("bebida") ? "700g (combo)" : "300g";
    } else if (prodName.includes("doble")) {
      peso = "540g";
    } else if (prodName.includes("trufada") || prodName.includes("fest")) {
      peso = "430g";
    } else if (prodName.includes("pollo")) {
      peso = "380g";
    } else if (prodName.includes("salchipapa")) {
      peso = "560g";
    } else if (prodName.includes("perro suizo")) {
      peso = "340g";
    } else if (prodName.includes("perro")) {
      peso = "290g";
    } else if (prodName.includes("combo")) {
      peso = "1.6 kg";
    } else if (prodName.includes("espiral")) {
      peso = "200g";
    } else if (prodName.includes("casco") || prodName.includes("corral")) {
      peso = prodName.includes("grande") ? "240g" : "160g";
    } else if (prodName.includes("francesa")) {
      peso = "150g";
    } else if (ficha?.peso) {
      peso = ficha.peso;
    } else {
      peso = "350g";
    }
  }

  // 3. Resolver Calorías
  let calorias = ficha?.calorias;
  if (!calorias || calorias === "~650 kcal" || calorias === "650 kcal") {
    const calMatch = infoNut.match(/(?:calorías|calorias|cal)\s*[:~]?\s*([~]?\s*\d+\s*(?:kcal|cal)?)/i);
    if (calMatch) {
      let val = calMatch[1].trim();
      if (!val.toLowerCase().includes("kcal")) val += " kcal";
      calorias = val;
    } else if (prodName.includes("agua") || prodName.includes("sin azúcar") || prodName.includes("light") || prodName.includes("zero")) {
      calorias = "0 kcal";
    } else if (prodName.includes("gaseosa") || prodName.includes("coca") || prodName.includes("pepsi") || prodName.includes("postob") || prodName.includes("sprite") || prodName.includes("quatro") || catName.includes("bebida")) {
      calorias = "165 kcal";
    } else if (prodName.includes("doble")) {
      calorias = "~980 kcal";
    } else if (prodName.includes("trufada") || prodName.includes("fest")) {
      calorias = "~790 kcal";
    } else if (prodName.includes("combo")) {
      calorias = "~1800 kcal";
    } else if (prodName.includes("salchipapa")) {
      calorias = "~890 kcal";
    } else if (prodName.includes("pollo")) {
      calorias = "~720 kcal";
    } else if (prodName.includes("perro suizo")) {
      calorias = "~680 kcal";
    } else if (prodName.includes("perro")) {
      calorias = "~540 kcal";
    } else if (prodName.includes("chili")) {
      calorias = prodName.includes("bebida") ? "820 kcal" : "680 kcal";
    } else if (prodName.includes("tocineta") && prodName.includes("papa")) {
      calorias = prodName.includes("bebida") ? "830 kcal" : "690 kcal";
    } else if (prodName.includes("corral") || prodName.includes("casco")) {
      calorias = prodName.includes("grande") ? "430 kcal" : "300 kcal";
    } else if (prodName.includes("francesa")) {
      calorias = "380 kcal";
    } else if (ficha?.calorias) {
      calorias = ficha.calorias;
    } else {
      calorias = "~650 kcal";
    }
  }

  // 4. Resolver Tiempo de preparación
  let tiempoPrep = ficha?.tiempoPreparacion;
  if (!tiempoPrep) {
    if (prodName.includes("agua") || prodName.includes("gaseosa") || catName.includes("bebida")) {
      tiempoPrep = 1;
    } else if (prodName.includes("francesa") || prodName.includes("corral") || prodName.includes("casco")) {
      tiempoPrep = 6;
    } else if (prodName.includes("perro")) {
      tiempoPrep = 8;
    } else if (prodName.includes("combo")) {
      tiempoPrep = 14;
    } else {
      tiempoPrep = 10;
    }
  }

  return { peso, calorias, rendimiento, tiempoPrep };
};

export function FastFoodProductModal({
  isOpen,
  onClose,
  producto,
  ficha = null,
  productosList = [],
  fichasMap = null,
  allAdiciones = [],
  allBebidas = [],
  ratingsInfo = null,
  onOpenResenas = null,
  onReviewChanged = null,
  onConfirm,
  mode = "pos", // "pos" | "cliente"
  initialTab = "personalizar",
  asPage = false
}) {
  const { warning } = useNotifications();
  const { user, isAuthenticated } = useAuth?.() || {};
  const isDrink = isDrinkProduct(producto);
  const drinkHasSizes = hasDrinkSizes(producto);

  // Modo Solo Lectura de Reseñas: En Punto de Venta Rápida (POS) y para roles Administrador (1) o Vendedor (2)
  const userRole = Number(user?.idRol || user?.rolId || user?.rol || 0);
  const isStaffRole = userRole === 1 || userRole === 2 || userRole === 3;
  const isPosMode = mode === "pos";
  const isReadOnlyReviews = isPosMode || isStaffRole;

  const [liveFicha, setLiveFicha] = useState(ficha);

  useEffect(() => {
    setLiveFicha(ficha);
  }, [ficha]);

  useEffect(() => {
    if (isOpen && producto && !isDrink) {
      const prodId = producto.id || producto.idProducto;
      if (prodId && (!liveFicha || !liveFicha.detalles || liveFicha.detalles.length === 0)) {
        fichasTecnicasService
          .getFichaByProducto(prodId)
          .then((f) => {
            if (f && (f.detalles || f.idFicha || f.idFichaTecnica || f.id || f.procedimiento)) setLiveFicha(f);
          })
          .catch((err) => {
            console.warn("Ficha técnica fetch error in modal:", err);
          });
      }
    }
  }, [isOpen, producto, isDrink, liveFicha]);

  const specs = useMemo(() => resolveNutritionalSpecs(producto, liveFicha), [producto, liveFicha]);
  const [activeTab, setActiveTab] = useState(() => {
    if (isDrink) return "presentacion";
    return initialTab || "personalizar";
  });
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [selectedAdditions, setSelectedAdditions] = useState([]); // [{ idAdicion, nombre, precio, cantidad, imagen }]
  const [selectedDrinks, setSelectedDrinks] = useState([]); // [{ id, nombre, precio, cantidad, imagen }]
  const realVariants = useMemo(() => {
    if (Array.isArray(producto?.variantes) && producto.variantes.length > 0) {
      const visible = producto.variantes.filter(
        (v) => v && (isDummyOrBaseVariant(v.nombre, producto?.nombre) || isVariantActive(v))
      );
      if (visible.length > 0) {
        return visible.map((v) => ({
          idVariante: v.idVariante || v.id,
          idProducto: v.idProducto || producto?.id || producto?.idProducto,
          nombre: v.nombre,
          descripcion: v.descripcion || null,
          especificaciones: v.fichaTecnica?.especificaciones || v.especificaciones || null,
          precio: Number(v.precio || producto.precio || 0),
          imagen: v.imagen || null,
          estado: v.estado ?? 1,
          creadaPorEvento: isVariantFromEvent(v),
          idEvento: v.idEvento || v.eventoOrigen?.idEvento || null,
          eventoOrigen: v.eventoOrigen || null,
          fichaTecnica: v.fichaTecnica || null,
          insumosModificados: Array.isArray(v.insumosModificados) ? v.insumosModificados : []
        }));
      }
    }
    return [
      {
        idVariante: producto?.idVarianteBase || producto?.id || producto?.idProducto || 1,
        idProducto: producto?.id || producto?.idProducto || 1,
        nombre: producto?.nombre || "Estándar",
        descripcion: null,
        precio: Number(producto?.precio || 0),
        imagen: producto?.imagen || null,
        esVarianteBase: true,
        insumosModificados: []
      }
    ];
  }, [producto]);

  // Opción base garantizada para productos de comida (siempre opción #1 / por defecto = producto padre)
  const defaultBaseFoodVariant = useMemo(() => {
    if (isDrink || !producto) return null;
    const vars = Array.isArray(producto?.variantes) ? producto.variantes : [];
    const baseVar = vars.find((v) => isDummyOrBaseVariant(v.nombre, producto?.nombre));
    return {
      idVariante: baseVar?.idVariante || baseVar?.id || producto?.idVarianteBase || "BASE",
      idProducto: producto?.id || producto?.idProducto,
      nombre: "Preparación Clásica / Estándar",
      descripcion: baseVar?.descripcion || "Receta tradicional con los ingredientes originales",
      especificaciones: liveFicha?.especificaciones || producto?.fichaTecnica?.especificaciones || "",
      precio: Number(producto?.precio || baseVar?.precio || 0),
      imagen: producto?.imagen || baseVar?.imagen || null,
      esOriginal: true,
      esVarianteBase: true,
      insumosModificados: []
    };
  }, [isDrink, producto, liveFicha]);

  // Variantes de fórmula/preparación para platos de comida (hamburguesas, perros calientes, etc.)
  const foodVariants = useMemo(() => {
    if (isDrink) return [];
    const vars = Array.isArray(producto?.variantes) ? producto.variantes : [];
    const nonDummy = vars.filter((v) => !isDummyOrBaseVariant(v.nombre, producto?.nombre) && isVariantActive(v));
    if (nonDummy.length === 0) return [];

    const result = [defaultBaseFoodVariant].filter(Boolean);

    nonDummy.forEach((v) => {
      result.push({
        idVariante: v.idVariante || v.id,
        idProducto: v.idProducto || producto?.id || producto?.idProducto,
        nombre: v.nombre,
        descripcion: v.descripcion || "",
        especificaciones: v.fichaTecnica?.especificaciones || v.especificaciones || "",
        precio: Number(v.precio || producto?.precio || 0),
        imagen: typeof v.imagen === "string" && v.imagen.trim() ? v.imagen.trim() : null,
        esOriginal: false,
        esVarianteBase: false,
        estado: 1,
        creadaPorEvento: isVariantFromEvent(v),
        idEvento: v.idEvento || v.eventoOrigen?.idEvento || null,
        eventoOrigen: v.eventoOrigen || null,
        fichaTecnica: v.fichaTecnica || null,
        insumosModificados: Array.isArray(v.insumosModificados) ? v.insumosModificados : []
      });
    });

    return result;
  }, [isDrink, producto, defaultBaseFoodVariant]);

  // Variantes de fórmula o sabor para bebidas (excluyendo tamaños como 1.5L, 2.5L que pertenecen al selector de tamaños)
  const drinkFormulaVariants = useMemo(() => {
    if (!isDrink) return [];

    const isSizeVariant = (v) => {
      const vn = (v.nombre || "").toLowerCase();
      return (
        (vn.includes("1.5") || vn.includes("1,5") || vn.includes("2.5") || vn.includes("2,5") || vn.includes("mega") || vn.includes("botella 1.") || vn.includes("botella 2.")) &&
        !vn.includes("sin azúcar") && !vn.includes("sin azucar") && !vn.includes("light") && !vn.includes("zero") && !vn.includes("black")
      );
    };

    const baseName = String(producto?.nombre || "").toLowerCase();
    const cleanBaseName = baseName.replace(/\s*400\s*ml/gi, "").trim();
    const isCoca = baseName.includes("coca");
    const isPepsi = baseName.includes("pepsi");

    // Filtrar las que son tamaños de botella
    const nonSizeVariants = realVariants.filter((v) => !isSizeVariant(v));

    // Filtrar variantes redundantes que simplemente repiten el nombre del producto base
    const distinctFlavorVariants = nonSizeVariants.filter((v) => {
      const vn = String(v.nombre || "").toLowerCase().replace(/\s*400\s*ml/gi, "").trim();
      if (vn === cleanBaseName || vn === baseName || vn === "estándar" || vn === "estandar") return false;
      return true;
    });

    if (distinctFlavorVariants.length > 0) {
      let origName = "Sabor Original";
      let origPid = producto?.id || producto?.idProducto;
      const isCocaDiet = isCoca && (baseName.includes("sin az") || baseName.includes("light") || baseName.includes("zero"));

      if (isCoca) {
        if (isCocaDiet) {
          origName = "Coca-Cola Sin Azúcar / Light";
          origPid = 16;
        } else {
          origName = "Coca-Cola Original";
          origPid = 8;
        }
      }
      else if (isPepsi) { origName = "Pepsi Regular"; origPid = 11; }
      else if (baseName.includes("uva")) { origName = "Gaseosa Uva Postobón"; origPid = 38; }
      else if (baseName.includes("naranja")) { origName = "Gaseosa Naranja Postobón"; origPid = 39; }
      else if (baseName.includes("colombiana")) { origName = "Gaseosa Colombiana Postobón"; origPid = 12; }
      else if (baseName.includes("manzana")) { origName = "Gaseosa Manzana Postobón"; origPid = 9; }
      else if (baseName.includes("sprite")) { origName = "Gaseosa Sprite"; origPid = 13; }
      else if (baseName.includes("cuatro") || baseName.includes("quatro")) { origName = "Gaseosa Quatro Toronja"; origPid = 14; }

      const originalOption = {
        idVariante: producto?.id || producto?.idProducto || origPid,
        idProducto: origPid,
        nombre: origName,
        esOriginal: true,
        precio: Number(producto?.precio || 0),
        imagen: getDrinkBottleImage("400ml", producto, origName, isCocaDiet) ||
                (isCocaDiet ? OFFICIAL_DRINK_IMAGES.coca_cola_light : null) ||
                (isCoca ? OFFICIAL_DRINK_IMAGES.coca_cola : null) ||
                (isPepsi ? "/images/drinks/pepsi_400ml-removebg-preview.png" : null) ||
                producto?.imagen || null
      };

      const customFlavorVars = distinctFlavorVariants.map((v) => {
        const vn = String(v.nombre || "").toLowerCase();
        let cleanDisplayName = v.nombre;
        let targetPid = v.idProducto || producto?.id || producto?.idProducto;

        if (isCoca) {
          if (vn.includes("light") || vn.includes("sin az") || vn.includes("zero")) {
            cleanDisplayName = "Coca-Cola Sin Azúcar / Light";
            targetPid = 16;
          } else if (vn.includes("con az") || vn.includes("azucar") || vn.includes("azúcar") || vn.includes("original") || vn.includes("regular")) {
            cleanDisplayName = "Coca-Cola Original (Con Azúcar)";
            targetPid = 8;
          }
        } else if (isPepsi && (vn.includes("light") || vn.includes("black") || vn.includes("zero"))) {
          cleanDisplayName = "Pepsi Light / Black";
          targetPid = 11;
        } else if (vn.includes("uva")) {
          cleanDisplayName = "Gaseosa Uva Postobón";
          targetPid = 38;
        } else if (vn.includes("naranja")) {
          cleanDisplayName = "Gaseosa Naranja Postobón";
          targetPid = 39;
        } else if (vn.includes("colombiana")) {
          cleanDisplayName = "Gaseosa Colombiana Postobón";
          targetPid = 12;
        } else if (vn.includes("manzana")) {
          cleanDisplayName = "Gaseosa Manzana Postobón";
          targetPid = 9;
        }

        const isDietFlag = cleanDisplayName.toLowerCase().includes("sin az") || cleanDisplayName.toLowerCase().includes("light") || cleanDisplayName.toLowerCase().includes("zero");
        const uploadedCustomImg = typeof v.imagen === "string" && v.imagen.trim() ? v.imagen.trim() : null;
        const fallbackImg = uploadedCustomImg || getDrinkBottleImage("400ml", producto, cleanDisplayName, isDietFlag);
        return {
          ...v,
          nombre: cleanDisplayName,
          idProducto: targetPid,
          imagen: fallbackImg,
          customImagen: uploadedCustomImg,
          esOriginal: false
        };
      });

      return [originalOption, ...customFlavorVars];
    }

    return distinctFlavorVariants;
  }, [isDrink, realVariants, producto]);

  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (isDrink && drinkFormulaVariants.length > 0) {
      return drinkFormulaVariants[0];
    }
    if (!isDrink) {
      return foodVariants[0] || defaultBaseFoodVariant;
    }
    return realVariants[0] || null;
  });

  useEffect(() => {
    if (isDrink) return;
    const currentProdId = String(producto?.id || producto?.idProducto || "");
    if (foodVariants.length > 0) {
      setSelectedVariant((prev) => {
        if (!prev) return foodVariants[0];
        const prevProdId = String(prev?.idProducto || "");
        if (prevProdId && currentProdId && prevProdId !== currentProdId) {
          return foodVariants[0];
        }
        const found = foodVariants.find((v) =>
          (prev?.esOriginal && v.esOriginal) ||
          (!v.esOriginal && !prev?.esOriginal && (v.idVariante || v.id) === (prev?.idVariante || prev?.id))
        );
        return found || foodVariants[0];
      });
    } else {
      setSelectedVariant(defaultBaseFoodVariant);
    }
  }, [isDrink, foodVariants, defaultBaseFoodVariant, producto?.id, producto?.idProducto]);

  const activeVariantSummary = useMemo(
    () =>
      buildVariantChangesSummary(
        selectedVariant && !selectedVariant.esOriginal && !selectedVariant.esVarianteBase
          ? selectedVariant
          : null,
        {
          ...producto,
          fichaTecnica: liveFicha || producto?.fichaTecnica
        },
        isDrink
      ),
    [selectedVariant, producto, liveFicha, isDrink]
  );

  const isPostobonDrink = useMemo(() => isDrink && isPostobonDrinkProduct(producto), [isDrink, producto]);
  const [selectedSizeId, setSelectedSizeId] = useState(() => detectDefaultDrinkSize(producto));

  // Detección si la fórmula seleccionada está restringida a tamaño personal de 400ml
  // (Ejemplo: Pepsi Light / Black únicamente existe en 400 ml; los tamaños 1.5L y 2.5L son de Pepsi Regular con azúcar)
  const isFormulaLimitedTo400ml = useMemo(() => {
    if (!isDrink) return false;
    if (!selectedVariant || selectedVariant.esOriginal) return false;

    const vName = String(selectedVariant.nombre || "").toLowerCase();
    const pName = String(producto?.nombre || "").toLowerCase();

    // Pepsi Light / Black únicamente existe en botella de 400 ml
    if (pName.includes("pepsi") && (vName.includes("light") || vName.includes("black") || vName.includes("zero"))) {
      return true;
    }

    // Cualquier otra bebida con variante que no tenga presentaciones 1.5L o 2.5L
    const isDietOrSpecific = vName.includes("light") || vName.includes("black") || vName.includes("zero") || vName.includes("sin az");
    if (isDietOrSpecific && !pName.includes("coca")) {
      const hasLargeDiet = realVariants.some((v) => {
        const vn = (v.nombre || "").toLowerCase();
        return (vn.includes("1.5") || vn.includes("2.5")) && (vn.includes("light") || vn.includes("black") || vn.includes("zero") || vn.includes("sin az"));
      });
      if (!hasLargeDiet) return true;
    }

    return false;
  }, [isDrink, selectedVariant, producto, realVariants]);

  const displayedDrinkSizes = useMemo(() => {
    if (isFormulaLimitedTo400ml) {
      return STANDARD_DRINK_SIZES.filter((s) => s.id === "400ml");
    }
    return STANDARD_DRINK_SIZES;
  }, [isFormulaLimitedTo400ml]);

  // Si la fórmula activa está limitada a 400ml y el tamaño actual es 1.5L o 2.5L, forzar a "400ml"
  useEffect(() => {
    if (isFormulaLimitedTo400ml && selectedSizeId !== "400ml") {
      setSelectedSizeId("400ml");
    }
  }, [isFormulaLimitedTo400ml, selectedSizeId]);

  const selectedSizeObj = useMemo(() => {
    return displayedDrinkSizes.find((s) => s.id === selectedSizeId) || displayedDrinkSizes[0] || STANDARD_DRINK_SIZES[0];
  }, [displayedDrinkSizes, selectedSizeId]);

  const handleSelectDrinkSize = useCallback((sizeId) => {
    setSelectedSizeId(sizeId);
    // Si selecciona un tamaño familiar (1.5L o 2.5L) y la fórmula seleccionada era Pepsi Light,
    // cambiar automáticamente a la versión regular con azúcar
    if (sizeId !== "400ml" && isFormulaLimitedTo400ml) {
      const origVar = drinkFormulaVariants.find((v) => v.esOriginal) || drinkFormulaVariants[0];
      if (origVar) {
        setSelectedVariant(origVar);
      }
    }
  }, [isFormulaLimitedTo400ml, drinkFormulaVariants]);

  const handleSelectDrinkFormula = useCallback((variant) => {
    setSelectedVariant(variant);
    const vn = String(variant.nombre || "").toLowerCase();
    const pn = String(producto?.nombre || "").toLowerCase();
    const isLimited = pn.includes("pepsi") && (vn.includes("light") || vn.includes("black") || vn.includes("zero"));
    if (isLimited && selectedSizeId !== "400ml") {
      setSelectedSizeId("400ml");
    }
  }, [producto, selectedSizeId]);

  // Sincronizar selectedVariant cuando cambia selectedSizeId o realVariants SOLO para bebidas
  useEffect(() => {
    if (!isDrink) return;
    if (!drinkHasSizes) {
      if (drinkFormulaVariants.length > 0) {
        setSelectedVariant((prev) => {
          const match = drinkFormulaVariants.find((v) => (v.idVariante || v.id) === (prev?.idVariante || prev?.id));
          return match || drinkFormulaVariants[0];
        });
      } else if (realVariants.length > 0) {
        setSelectedVariant(realVariants[0]);
      }
      return;
    }

    // Si la bebida tiene variantes de fórmula (ej: Original vs Sin Azúcar), preservar la fórmula seleccionada
    if (drinkFormulaVariants.length > 0) {
      setSelectedVariant((prev) => {
        if (!prev) return drinkFormulaVariants[0];
        const match = drinkFormulaVariants.find((v) => (v.idVariante || v.id) === (prev?.idVariante || prev?.id) || (prev.esOriginal && v.esOriginal));
        return match || drinkFormulaVariants[0];
      });
      return;
    }

    const sizeObj = STANDARD_DRINK_SIZES.find((s) => s.id === selectedSizeId) || STANDARD_DRINK_SIZES[0];
    const match = realVariants.find((v) => {
      const vn = (v.nombre || "").toLowerCase();
      if (selectedSizeId === "400ml") return vn.includes("400") && !vn.includes("1.5") && !vn.includes("2.5");
      if (selectedSizeId === "1.5L") return vn.includes("1.5") || vn.includes("1,5");
      if (selectedSizeId === "2.5L") return vn.includes("2.5") || vn.includes("2,5") || vn.includes("mega");
      return false;
    });

    if (match) {
      setSelectedVariant(match);
    } else {
      let defaultPrice;
      if (selectedSizeId === "400ml") {
        const pPrice = Number(producto?.precio || 0);
        if (pPrice > 0 && pPrice <= 6000) {
          defaultPrice = pPrice;
        } else {
          defaultPrice = isPostobonDrink ? sizeObj.defaultPostobonPrice : sizeObj.defaultPremiumPrice;
        }
      } else if (selectedSizeId === "1.5L") {
        const pPrice = Number(producto?.precio || 0);
        if (pPrice >= 7000 && pPrice <= 10500) {
          defaultPrice = pPrice;
        } else {
          defaultPrice = isPostobonDrink ? sizeObj.defaultPostobonPrice : sizeObj.defaultPremiumPrice;
        }
      } else {
        defaultPrice = isPostobonDrink ? sizeObj.defaultPostobonPrice : sizeObj.defaultPremiumPrice;
      }
      setSelectedVariant({
        idVariante: `${selectedSizeId}-${producto?.id || producto?.idProducto || 1}`,
        nombre: sizeObj.title,
        precio: defaultPrice
      });
    }
  }, [isDrink, selectedSizeId, drinkHasSizes, realVariants, drinkFormulaVariants, isPostobonDrink, producto]);

  // Detección si el producto es acompañamiento o plato de papas
  const isPapaOrAccompaniment = useMemo(() => {
    const prodName = String(producto?.nombre || "").toLowerCase();
    const catName = String(producto?.categoria || producto?.categoriaNombre || "").toLowerCase();
    const catId = Number(producto?.idCategoriaProducto || 0);
    return catId === 6 || catName.includes("acompa") || prodName.includes("papa");
  }, [producto]);

  // Filtrado de adiciones: si es papa o acompañamiento, NO ofrecer "Porción Papas a la Francesa" como adición a sí misma
  const filteredAdiciones = useMemo(() => {
    if (!allAdiciones || !Array.isArray(allAdiciones)) return [];
    return allAdiciones.filter((ad) => {
      const adName = (ad.nombre || "").toLowerCase();
      if (isPapaOrAccompaniment && (adName.includes("papas a la francesa") || adName.includes("porcion papas") || adName.includes("porción papas") || adName.includes("papas en casco"))) {
        return false;
      }
      return true;
    });
  }, [allAdiciones, isPapaOrAccompaniment]);

  // Insumos personalizables (Mise & place que considera los deltas de la variante activa)
  const personalizables = useMemo(
    () => extractPersonalizables(producto, liveFicha, selectedVariant),
    [producto, liveFicha, selectedVariant]
  );

  const baseIngredients = useMemo(
    () => personalizables.filter((i) => i.esencial),
    [personalizables]
  );

  const customizableIngredients = useMemo(
    () => personalizables.filter((i) => !i.esencial),
    [personalizables]
  );

  // Imagen específica de variantes conocidas como Coca-Cola Sin Azúcar / Light
  const getVariantImage = useCallback((varName) => {
    const vn = String(varName || "").toLowerCase();
    if (vn.includes("light") || vn.includes("sin azúcar") || vn.includes("sin azucar") || vn.includes("zero")) {
      return OFFICIAL_DRINK_IMAGES.coca_cola_light;
    }
    return null;
  }, []);

  const [selectedFlavor, setSelectedFlavor] = useState(() => isDrink ? detectDefaultFlavor(producto) : null);
  const [customObservation, setCustomObservation] = useState("");
  const [imageError, setImageError] = useState(false);
  const [heroFallbackToBase, setHeroFallbackToBase] = useState(false);

  // Reiniciar estado de error de imagen al cambiar presentación o variante
  useEffect(() => {
    setImageError(false);
    setHeroFallbackToBase(false);
  }, [selectedSizeId, selectedVariant, producto]);

  // Detección y resolución de configuración de Combo con bebidas incluidas
  const comboConfig = useMemo(() => {
    let raw = producto?.configuracionCombo;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = null;
      }
    }
    if (raw && typeof raw === "object" && raw.esCombo !== undefined) {
      return {
        esCombo: Boolean(raw.esCombo),
        cantidadBebidas: Math.max(1, Number(raw.cantidadBebidas) || 1),
        bebidasPermitidas: Array.isArray(raw.bebidasPermitidas) ? raw.bebidasPermitidas : []
      };
    }
    const pLower = String(producto?.nombre || "").toLowerCase();
    const cLower = String(producto?.categoria || producto?.categoriaNombre || "").toLowerCase();
    const dLower = String(producto?.descripcion || "").toLowerCase();

    const isCombo =
      cLower.includes("combo") ||
      pLower.includes("combo") ||
      pLower.includes("+ bebida") ||
      pLower.includes("+bebida") ||
      pLower.includes("con bebida") ||
      pLower.includes("+ gaseosa") ||
      pLower.includes("+gaseosa") ||
      pLower.includes("con gaseosa") ||
      dLower.includes("+ gaseosa") ||
      dLower.includes("+ bebida") ||
      dLower.includes("bebida a elección") ||
      dLower.includes("gaseosa a elección");

    if (isCombo) {
      let cant = 1;
      if (pLower.includes("familiar") || pLower.includes("4 personas") || pLower.includes("4 pers")) cant = 4;
      else if (pLower.includes("pareja") || pLower.includes("amigos") || pLower.includes("2 personas") || pLower.includes("duo") || pLower.includes("dúo")) cant = 2;
      return { esCombo: true, cantidadBebidas: cant, bebidasPermitidas: [] };
    }
    return { esCombo: false, cantidadBebidas: 0, bebidasPermitidas: [] };
  }, [producto]);

  const isComboWithDrinks = Boolean(comboConfig?.esCombo && (comboConfig?.cantidadBebidas || 0) > 0);
  const requiredDrinkCount = isComboWithDrinks ? (Number(comboConfig.cantidadBebidas) || 1) : 0;

  const availableBebidas = useMemo(() => {
    if (!allBebidas || !Array.isArray(allBebidas)) return [];
    if (isComboWithDrinks && Array.isArray(comboConfig.bebidasPermitidas) && comboConfig.bebidasPermitidas.length > 0) {
      return allBebidas.filter((b) => comboConfig.bebidasPermitidas.includes(b.id || b.idProducto));
    }
    return allBebidas;
  }, [allBebidas, isComboWithDrinks, comboConfig]);

  const totalSelectedDrinkQty = useMemo(() => {
    return selectedDrinks.reduce((sum, d) => sum + (Number(d.cantidad) || 1), 0);
  }, [selectedDrinks]);

  const isComboDrinkComplete = !isComboWithDrinks || totalSelectedDrinkQty >= requiredDrinkCount;

  // Cálculo de costo de bebidas considerando la cuota incluida en el combo
  const drinksTotal = useMemo(() => {
    if (!isComboWithDrinks) {
      return selectedDrinks.reduce((sum, d) => sum + Number(d.precio || 0) * Number(d.cantidad || 1), 0);
    }
    let remainingIncluded = requiredDrinkCount;
    let extraCost = 0;
    for (const d of selectedDrinks) {
      const qty = Number(d.cantidad || 1);
      const price = Number(d.precio || 0);
      const covered = Math.min(remainingIncluded, qty);
      const extras = qty - covered;
      remainingIncluded -= covered;
      extraCost += extras * price;
    }
    return extraCost;
  }, [selectedDrinks, isComboWithDrinks, requiredDrinkCount]);

  // Composición del combo, ingredientes de los productos incluidos y pasos de preparación
  const comboRecipeInfo = useMemo(() => {
    if (!producto) {
      return { parsedCfg: null, isComboProd: false, comboItems: [], steps: [], includedDrinksCount: 0 };
    }
    let parsedCfg = producto?.configuracionCombo || null;
    if (typeof parsedCfg === "string") {
      try { parsedCfg = JSON.parse(parsedCfg); } catch { parsedCfg = null; }
    }
    const prodLower = String(producto?.nombre || "").toLowerCase();
    const catLower = String(producto?.categoria || producto?.categoriaNombre || "").toLowerCase();
    const isComboProd = Boolean(
      producto?.esCombo || comboConfig?.esCombo || parsedCfg?.esCombo || catLower.includes("combo") || prodLower.includes("combo")
    );

    const normalizeText = (txt) =>
      String(txt || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\([^)]*\)/g, " ")
        .replace(/\b([a-z]{3,}[bcdfghjklmnñpqrstvwxyz])es\b/g, "$1")
        .replace(/\b([a-z]{3,}[aeiou])s\b/g, "$1")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const findChildIngredients = (itemId, rawName) => {
      const rawLower = String(rawName || "").toLowerCase();
      if (
        rawLower.includes("gaseosa") ||
        rawLower.includes("bebida") ||
        rawLower.includes("coca-cola") ||
        rawLower.includes("coca cola") ||
        rawLower.includes("postob") ||
        rawLower.includes("pepsi") ||
        rawLower.includes("sprite") ||
        rawLower.includes("quatro") ||
        rawLower.includes("agua")
      ) {
        return [];
      }

      const stripped = String(rawName || "")
        .replace(/^\s*\d+\s*x?\s+/i, "")
        .replace(/\b(a elecci[oó]n|en combo|promocional(?:es)?|individual(?:es)?|grandes?|pequeñ[oa]s?|median[oa]s?|dobles?|crujientes?)\b/gi, "")
        .trim();
      const normTarget = normalizeText(stripped);

      if (Array.isArray(productosList) && productosList.length > 0) {
        const child = productosList.find((p) => {
          const pid = p.id || p.idProducto;
          if (itemId && String(pid) === String(itemId)) return true;
          if (p.esCombo || p.configuracionCombo?.esCombo || String(p.nombre || "").toLowerCase().includes("+ bebida")) return false;
          const normProd = normalizeText(p.nombre);
          if (!normProd || !normTarget || normTarget.length < 4) return false;
          if (normProd === normTarget || normProd.includes(normTarget) || normTarget.includes(normProd)) return true;
          if (normTarget.includes("papa") && normTarget.includes("chili") && normProd.includes("papa") && normProd.includes("chili")) return true;
          if (normTarget.includes("papa") && normTarget.includes("tocineta") && normProd.includes("papa") && normProd.includes("tocineta")) return true;
          if (normTarget.includes("papa") && (normTarget.includes("francesa") || normTarget.includes("porcion")) && normProd.includes("papa") && normProd.includes("francesa")) return true;
          return false;
        });

        if (child) {
          const cid = child.id || child.idProducto;
          const childFicha = fichasMap?.[cid] || child.fichaTecnica || child.ficha || null;
          const extracted = extractPersonalizables(child, childFicha)
            .map((i) => i.nombre)
            .filter(Boolean)
            .slice(0, 6);
          if (extracted.length > 0) return extracted;
        }
      }

      // Respaldo garantizado para productos compuestos del menú estándar
      if (normTarget.includes("hamburguesa")) {
        return [
          "Pan Brioche Artesanal",
          "Carne de Res Molida 80/20",
          "Queso Cheddar en Lonchas",
          "Tocineta Ahumada en Tiras",
          "Lechuga Batavia Fresca",
          "Tomate Chonto Maduro"
        ];
      }
      if (normTarget.includes("perro")) {
        return [
          "Pan Perro Americano Suave",
          "Salchicha Americana Premium",
          "Tocineta Ahumada en Tiras",
          "Queso Mozzarella Rallado",
          "Papas Ripio Crocantes",
          "Salsa Tártara Casera Especial"
        ];
      }
      if (normTarget.includes("papa") && normTarget.includes("chili")) {
        return [
          "Papas a la Francesa Corte Delgado",
          "Chili con Carne de Res Artesanal",
          "Guacamole Fresco Artesanal",
          "Queso Cheddar Fundido"
        ];
      }
      if (normTarget.includes("papa") && normTarget.includes("tocineta")) {
        return [
          "Papas a la Francesa Corte Delgado",
          "Tocineta Ahumada en Tiras",
          "Suero Costeño Cremoso Artesanal",
          "Queso Cheddar Fundido"
        ];
      }
      if (normTarget.includes("papa")) {
        return ["Papas a la Francesa Corte Delgado"];
      }
      return [];
    };

    const rawItemsCombo = Array.isArray(producto?.itemsCombo) && producto.itemsCombo.length > 0
      ? producto.itemsCombo
      : Array.isArray(parsedCfg?.itemsCombo) && parsedCfg.itemsCombo.length > 0
      ? parsedCfg.itemsCombo
      : Array.isArray(parsedCfg?.productosAsociados) && parsedCfg.productosAsociados.length > 0
      ? parsedCfg.productosAsociados
      : Array.isArray(producto?.productosAsociados) && producto.productosAsociados.length > 0
      ? producto.productosAsociados
      : [];

    let comboItems = [];
    if (rawItemsCombo.length > 0) {
      comboItems = rawItemsCombo.map((it, idx) => {
        const baseName = it.producto?.nombre || it.nombre || "Producto incluido";
        const qty = Number(it.cantidad || 1);
        return {
          id: it.idDetalleCombo || it.idProducto || it.id || idx,
          nombre: `${qty > 1 ? `${qty}x ` : ""}${baseName}`,
          tag: it.esOpcional ? "Opcional" : "Incluido",
          ingredientes: findChildIngredients(it.idProducto || it.producto?.id || it.id, baseName)
        };
      });
    } else if (isComboProd) {
      const descSource = String(producto?.descripcion || "").includes("+")
        ? String(producto.descripcion)
        : "";
      if (descSource) {
        const afterColon = descSource.includes(":") && descSource.indexOf(":") < descSource.indexOf("+")
          ? descSource.slice(descSource.indexOf(":") + 1)
          : descSource;
        comboItems = afterColon
          .replace(/\s+(a\s+un\s+precio|por\s+solo|ahorras|con\s+descuento)\b.*$/i, "")
          .replace(/\s*\(ahorras\b.*$/i, "")
          .replace(/\.$/, "")
          .split("+")
          .map((part, idx) => {
            const rawPart = part.trim();
            const ingredientes = findChildIngredients(null, rawPart);
            let cleanTitle = rawPart;
            if (ingredientes.length > 0) {
              cleanTitle = cleanTitle
                .replace(/\s*\([^)]*,[^)]*\)/g, "")
                .replace(/\s+con\s+(?:queso|tocineta|chili)\b.*$/i, "")
                .trim();
            }
            cleanTitle = cleanTitle.replace(/^(\d+)\s+(?!x\b)/i, "$1x ");
            return {
              id: "desc-" + idx,
              nombre: cleanTitle,
              tag: "Incluido",
              ingredientes
            };
          })
          .filter((it) => Boolean(it.nombre));
      }
    }

    const steps = String(liveFicha?.procedimiento || producto?.fichaTecnica?.procedimiento || "")
      .split(/\r?\n/)
      .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);

    const includedDrinksCount = requiredDrinkCount || Number(parsedCfg?.cantidadBebidas || 0) ||
      (isComboProd ? (prodLower.includes("pareja") || prodLower.includes("amigos") || prodLower.includes("2 ") ? 2 : prodLower.includes("familiar") || prodLower.includes("4 ") ? 4 : 1) : 0);

    return { parsedCfg, isComboProd, comboItems, steps, includedDrinksCount };
  }, [producto, comboConfig, liveFicha, productosList, fichasMap, requiredDrinkCount]);

  const hasRecipeTabContent =
    personalizables.length > 0 ||
    foodVariants.length > 0 ||
    comboRecipeInfo.comboItems.length > 0 ||
    comboRecipeInfo.steps.length > 0;

  // Reseñas dinámicas del producto (100% persistidas en BD)
  const [reviewsData, setReviewsData] = useState({ promedio: 0, total: 0, resenas: [] });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [myReview, setMyReview] = useState(null); // null | { id, puntuacion, comentario }

  // Formulario interactivo para crear / editar reseña dentro del modal
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(null); // { type: 'success'|'error', message: string }
  const [reviewCommentTouched, setReviewCommentTouched] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const prodId = producto?.id || producto?.idProducto;

  // Cargar reseñas reales y reseña propia del usuario en paralelo
  const fetchReviews = useCallback(async () => {
    if (!prodId) return;
    setLoadingReviews(true);
    try {
      const canFetchOwn = Boolean(isAuthenticated && user && !isReadOnlyReviews);
      const [res, ownRes] = await Promise.all([
        apiClient.get(`/resenas/producto/${prodId}`),
        canFetchOwn ? apiClient.get(`/resenas/mia/${prodId}`).catch(() => null) : Promise.resolve(null)
      ]);
      if (res) {
        setReviewsData({
          promedio: Number(res.promedio || 0),
          total: Number(res.total || (res.resenas ? res.resenas.length : 0)),
          resenas: Array.isArray(res.resenas) ? res.resenas : []
        });
      }
      if (canFetchOwn) {
        if (ownRes && (ownRes.id || ownRes.idResena)) {
          const normalizedOwn = {
            id: ownRes.id || ownRes.idResena,
            puntuacion: Number(ownRes.puntuacion || 5),
            comentario: ownRes.comentario || ""
          };
          setMyReview(normalizedOwn);
          setNewRating(normalizedOwn.puntuacion);
          setNewComment(normalizedOwn.comentario);
        } else {
          setMyReview(null);
          setNewRating(5);
          setNewComment("");
        }
      } else {
        setMyReview(null);
      }
    } catch (e) {
      console.warn("No se pudieron cargar reseñas del producto:", e);
    } finally {
      setLoadingReviews(false);
    }
  }, [prodId, isAuthenticated, user, isReadOnlyReviews]);

  // Handler para crear o editar reseña real en BD
  const handleSubmitReview = async (e) => {
    e?.preventDefault();
    if (isReadOnlyReviews) {
      warning("Acción no permitida", "En el punto de venta rápida, los administradores y vendedores solo pueden consultar las opiniones de los clientes de la web.");
      return;
    }
    if (!isAuthenticated || !user) {
      setReviewFeedback({
        type: "error",
        message: "Inicia sesión con tu cuenta de cliente para publicar una reseña verificada."
      });
      return;
    }
    if (!prodId) return;
    setReviewCommentTouched(true);
    if (newRating < 1 || newRating > 5) {
      setReviewFeedback({ type: "error", message: "Por favor selecciona una calificación de 1 a 5 estrellas." });
      return;
    }
    if (!newComment.trim() || newComment.trim().length < 5) {
      setReviewFeedback({ type: "error", message: "Por favor escribe un comentario de al menos 5 caracteres sobre tu experiencia." });
      return;
    }

    setSubmittingReview(true);
    setReviewFeedback(null);

    try {
      if (myReview?.id) {
        await apiClient.put(`/resenas/${myReview.id}`, {
          puntuacion: newRating,
          comentario: newComment.trim()
        });
        setReviewFeedback({ type: "success", message: "¡Tu reseña fue actualizada correctamente!" });
      } else {
        await apiClient.post("/resenas", {
          idProducto: prodId,
          puntuacion: newRating,
          comentario: newComment.trim()
        });
        setReviewFeedback({ type: "success", message: "¡Tu reseña ha sido verificada y publicada con éxito!" });
      }

      setShowWriteReview(false);
      setReviewCommentTouched(false);
      await fetchReviews();
      if (typeof onReviewChanged === "function") onReviewChanged();
    } catch (err) {
      console.warn("Error enviando reseña:", err);
      const msg = err?.message || err?.response?.data?.message || "No se pudo guardar la reseña en este momento.";
      setReviewFeedback({ type: "error", message: msg });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handler para eliminar la reseña propia del cliente en BD
  const handleDeleteReview = async () => {
    if (!myReview?.id || !isAuthenticated || !user || isReadOnlyReviews) return;
    setDeletingReview(true);
    setReviewFeedback(null);
    try {
      await apiClient.delete(`/resenas/${myReview.id}`);
      setMyReview(null);
      setNewRating(5);
      setNewComment("");
      setShowWriteReview(false);
      setReviewCommentTouched(false);
      setReviewFeedback({ type: "success", message: "Tu reseña fue eliminada correctamente." });
      await fetchReviews();
      if (typeof onReviewChanged === "function") onReviewChanged();
    } catch (err) {
      console.warn("Error eliminando reseña:", err);
      const msg = err?.message || err?.response?.data?.message || "No se pudo eliminar la reseña en este momento.";
      setReviewFeedback({ type: "error", message: msg });
    } finally {
      setDeletingReview(false);
    }
  };

  const lastInitKeyRef = useRef(null);
  const fichaInitKeyRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !producto) {
      fichaInitKeyRef.current = null;
      return;
    }
    if (isDrink || (initialTab && initialTab !== "personalizar")) return;
    const key = `${producto.id || producto.idProducto}`;
    if (fichaInitKeyRef.current === key) return;
    if (hasRecipeTabContent) {
      fichaInitKeyRef.current = key;
      setActiveTab("personalizar");
    }
  }, [isOpen, producto, isDrink, initialTab, hasRecipeTabContent]);

  // Re-initialize state only once when a new product is opened or modal opens
  useEffect(() => {
    if (!isOpen || !producto) {
      lastInitKeyRef.current = null;
      return;
    }
    const currentKey = `${producto.id || producto.idProducto}_${isOpen}`;
    if (lastInitKeyRef.current !== currentKey) {
      lastInitKeyRef.current = currentKey;
      const drinkMode = isDrinkProduct(producto);
      const hasSizes = hasDrinkSizes(producto);
      if (drinkMode) {
        const defFlavor = detectDefaultFlavor(producto);
        setSelectedFlavor(defFlavor);
        if (drinkFormulaVariants.length > 0) {
          setSelectedVariant(drinkFormulaVariants[0]);
        }
        if (hasSizes) {
          const defSize = detectDefaultDrinkSize(producto);
          setSelectedSizeId(defSize);
          setActiveTab("presentacion");
        } else {
          setActiveTab("presentacion");
        }
      } else {
        setSelectedVariant(foodVariants[0] || defaultBaseFoodVariant);
        const canPersonalize = extractPersonalizables(producto, liveFicha).length > 0;
        const hasVarsOrIngs = canPersonalize || foodVariants.length > 0 || hasRecipeTabContent;
        const fallbackTab = isComboWithDrinks && availableBebidas.length > 0 ? "bebidas" : "adiciones";
        setActiveTab(initialTab && initialTab !== "personalizar" ? initialTab : (hasVarsOrIngs ? "personalizar" : fallbackTab));
      }
      setQuantity(1);
      setRemovedIngredients([]);
      setSelectedAdditions([]);
      setSelectedDrinks([]);
      setCustomObservation("");
      setImageError(false);
      setHeroFallbackToBase(false);
      setShowWriteReview(false);
      setReviewFeedback(null);
      setReviewCommentTouched(false);
      setMyReview(null);
      setShowFullDesc(false);
      fetchReviews();
    }
  }, [producto?.id, producto?.idProducto, isOpen, fetchReviews, initialTab]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const [eventTick, setEventTick] = useState(() => Date.now());
  const hasEventosEnModal = Boolean(isOpen && Array.isArray(producto?.eventos) && producto.eventos.length > 0);
  useEffect(() => {
    if (!hasEventosEnModal) return undefined;
    setEventTick(Date.now());
    const id = setInterval(() => setEventTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasEventosEnModal]);

  // Helper de Evento Activo para el Producto (horario Colombia -05:00)
  const eventInfo = (() => {
    if (!producto) return null;
    const eventos = Array.isArray(producto.eventos) ? producto.eventos : [];
    if (eventos.length === 0) return null;
    const validEvents = eventos.filter((e) => isEventActiveInColombia(e, eventTick));
    if (validEvents.length === 0) return null;
    const evt = validEvents[0];

    const rawPrice = selectedVariant?.precio !== undefined && Number(selectedVariant.precio) > 0
      ? Number(selectedVariant.precio)
      : Number(producto.precio || 0);

    let final = rawPrice;
    if (evt.nuevoPrecio && Number(evt.nuevoPrecio) > 0) {
      final = Number(evt.nuevoPrecio);
    } else if (evt.descuento && Number(evt.descuento) > 0) {
      final = rawPrice * (1 - Number(evt.descuento) / 100);
    }

    const savings = Math.max(0, rawPrice - final);
    const discountPercent = rawPrice > 0 && savings > 0
      ? Math.round((savings / rawPrice) * 100)
      : (evt.descuento ? Math.round(Number(evt.descuento)) : 0);

    const vig = evaluateEventVigencia(evt, eventTick);
    const formattedDate = vig?.formattedDate || "";

    return {
      ...evt,
      insumosAsociados: parseEventoInsumos(evt),
      nombre: stripEmojis(evt.nombreEvento || evt.nombre || "Edición Especial"),
      descripcion: stripEmojis(evt.descripcion) || "Receta conmemorativa de edición limitada con precio y presentación especial.",
      regularPrice: rawPrice,
      eventPrice: final,
      savings,
      discountPercent,
      formattedDate,
      tipo: evt.tipoEvento || "EDICION_LIMITADA",
      vigencia: evt.fechaFin
        ? {
            diasRestantes: vig?.diasRestantes ?? null,
            horasRestantes: vig?.horasRestantes ?? null,
            urgente: Boolean(vig?.urgente),
            label: vig?.label || (formattedDate ? `Hasta el ${formattedDate}` : "Edición Especial")
          }
        : {
            diasRestantes: null,
            horasRestantes: null,
            urgente: false,
            label: "Vigencia Permanente"
          }
    };
  })();

  const resolveFoodVariantPrice = useCallback((vObj) => {
    const prodBase = Number(producto?.precio || 0);
    const raw = vObj && Number(vObj.precio) > 0 ? Number(vObj.precio) : prodBase;
    const isCustomNonBase = Boolean(vObj && !vObj.esOriginal && !vObj.esVarianteBase && !isDummyOrBaseVariant(vObj.nombre, producto?.nombre));
    const isEvtCreatedVar = Boolean(isCustomNonBase && isVariantFromEvent(vObj));

    // Las variantes creadas desde eventos ya traen su precio definitivo guardado en BD
    if (isEvtCreatedVar && Number(vObj?.precio) > 0) {
      return {
        finalPrice: Number(vObj.precio),
        originalPrice: prodBase > Number(vObj.precio) ? prodBase : Number(vObj.precio),
        hasPromo: prodBase > Number(vObj.precio),
        label: vObj?.eventoOrigen?.nombreEvento || "Edición Especial"
      };
    }

    let finalP = raw;
    let label = "";
    let hasPromo = false;

    if (eventInfo && (eventInfo.savings > 0 || eventInfo.discountPercent > 0 || Number(eventInfo.nuevoPrecio) > 0 || Number(eventInfo.descuento) > 0)) {
      if (isCustomNonBase) {
        const pct = Number(eventInfo.descuento || eventInfo.discountPercent || 0);
        if (pct > 0 && !Number(eventInfo.nuevoPrecio)) {
          finalP = Math.round(raw * (1 - pct / 100));
          hasPromo = finalP < raw;
          label = `-${Math.round(pct)}% OFF`;
        } else if (Number(eventInfo.nuevoPrecio) > 0) {
          const fixedDiscount = Math.max(0, prodBase - Number(eventInfo.nuevoPrecio));
          finalP = Math.max(0, raw - fixedDiscount);
          hasPromo = finalP < raw;
          label = "Edición Especial";
        }
      } else if (eventInfo.savings > 0 || eventInfo.discountPercent > 0) {
        finalP = eventInfo.eventPrice;
        hasPromo = true;
        label = eventInfo.savings > 0
          ? `-${eventInfo.discountPercent}% OFF (Ahorro ${Number(eventInfo.savings || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })})`
          : "Edición Especial";
      }
    } else if (!isCustomNonBase && producto?.precioPromo !== undefined && Number(producto.precioPromo) < raw) {
      finalP = Number(producto.precioPromo);
      hasPromo = true;
      const pct = producto.descuentoPorcentaje || Math.round(((raw - finalP) / raw) * 100);
      label = `-${pct}% OFF`;
    } else if (!isCustomNonBase) {
      const eventos = Array.isArray(producto?.eventos) ? producto.eventos : [];
      const evtPrecio = eventos.find((e) => Number(e.nuevoPrecio) > 0);
      const evtDesc = eventos.find((e) => Number(e.descuento || e.descuentoPorcentaje || e.porcentajeDescuento) > 0);
      if (evtPrecio && Number(evtPrecio.nuevoPrecio) > 0) {
        finalP = Number(evtPrecio.nuevoPrecio);
        hasPromo = finalP < raw;
        label = "Precio Promocional";
      } else if (evtDesc) {
        const desc = Number(evtDesc.descuento || evtDesc.descuentoPorcentaje || evtDesc.porcentajeDescuento);
        if (desc > 0) {
          finalP = Math.round(raw * (1 - desc / 100));
          hasPromo = true;
          label = `-${Math.round(desc)}% OFF`;
        }
      }
    }

    return {
      finalPrice: finalP,
      originalPrice: raw,
      hasPromo,
      label
    };
  }, [producto, eventInfo]);

  // Calculo de precio base con posibles eventos o promociones
  const { basePrice, originalPrice, hasDiscount, discountLabel } = (() => {
    if (!producto) return { basePrice: 0, originalPrice: 0, hasDiscount: false, discountLabel: '' };
    if (drinkHasSizes) {
      const sizeMatchedVar = realVariants.find((v) => {
        const vn = (v.nombre || "").toLowerCase();
        if (selectedSizeId === "400ml") return vn.includes("400") && !vn.includes("1.5") && !vn.includes("2.5");
        if (selectedSizeId === "1.5L") return vn.includes("1.5") || vn.includes("1,5");
        if (selectedSizeId === "2.5L") return vn.includes("2.5") || vn.includes("2,5") || vn.includes("mega");
        return false;
      });
      let rawPrice = Number(producto.precio || 0);
      if (sizeMatchedVar && Number(sizeMatchedVar.precio) > 0) {
        rawPrice = Number(sizeMatchedVar.precio);
      } else if (selectedSizeId === "400ml" && Number(producto?.precio) > 0) {
        rawPrice = Number(producto.precio);
      } else {
        rawPrice = isPostobonDrink ? selectedSizeObj.defaultPostobonPrice : selectedSizeObj.defaultPremiumPrice;
      }
      let final = rawPrice;
      let discount = false;
      let label = "";
      if (eventInfo && (eventInfo.savings > 0 || eventInfo.discountPercent > 0)) {
        final = eventInfo.eventPrice;
        discount = true;
        label = eventInfo.savings > 0
          ? `-${eventInfo.discountPercent}% OFF (Ahorro ${Number(eventInfo.savings || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })})`
          : "Edición Especial";
      } else if (producto.precioPromo !== undefined && Number(producto.precioPromo) < rawPrice) {
        final = Number(producto.precioPromo);
        discount = true;
        const pct = producto.descuentoPorcentaje || Math.round(((rawPrice - final) / rawPrice) * 100);
        label = `-${pct}% OFF`;
      }
      return { basePrice: final, originalPrice: rawPrice, hasDiscount: discount, discountLabel: label };
    }

    const resolved = resolveFoodVariantPrice(selectedVariant);
    return {
      basePrice: resolved.finalPrice,
      originalPrice: resolved.originalPrice,
      hasDiscount: resolved.hasPromo,
      discountLabel: resolved.label
    };
  })();

  // Stock disponible
  const stockMax = Number(
    producto?.stock !== undefined
      ? producto.stock
      : producto?.stockActual !== undefined
      ? producto.stockActual
      : 0
  );

  // Toggle remover ingrediente (protegido por lógica humana de cocina)
  const toggleRemoveIngredient = (nombre) => {
    if (isEssentialIngredient(nombre, producto)) return;
    setRemovedIngredients((prev) =>
      prev.includes(nombre) ? prev.filter((i) => i !== nombre) : [...prev, nombre]
    );
  };

  // Toggle o cambiar adición
  const toggleAddition = (ad) => {
    const adId = ad.idAdicion || ad.id;
    setSelectedAdditions((prev) => {
      const exists = prev.find((a) => (a.idAdicion || a.id) === adId);
      if (exists) {
        return prev.filter((a) => (a.idAdicion || a.id) !== adId);
      } else {
        return [
          ...prev,
          {
            idAdicion: adId,
            id: adId,
            nombre: ad.nombre,
            precio: Number(ad.precio || 0),
            cantidad: 1,
            imagen: getAdicionDisplayImage(ad)
          }
        ];
      }
    });
  };

  const changeAdditionQty = (adId, delta, e) => {
    if (e) e.stopPropagation();
    setSelectedAdditions((prev) =>
      prev
        .map((a) => {
          if ((a.idAdicion || a.id) === adId) {
            const newQty = (a.cantidad || 1) + delta;
            return newQty > 0 ? { ...a, cantidad: newQty } : null;
          }
          return a;
        })
        .filter(Boolean)
    );
  };

  // Toggle o cambiar bebida/acompañante
  const toggleDrink = (drink) => {
    const dId = drink.id || drink.idProducto;
    setSelectedDrinks((prev) => {
      const exists = prev.find((d) => (d.id || d.idProducto) === dId);
      if (exists) {
        return prev.filter((d) => (d.id || d.idProducto) !== dId);
      } else {
        return [
          ...prev,
          {
            id: dId,
            idProducto: dId,
            nombre: drink.nombre,
            precio: Number(drink.precio || 0),
            cantidad: 1,
            imagen: resolveDrinkImage(drink),
            stock: Number(drink.stock !== undefined ? drink.stock : 0)
          }
        ];
      }
    });
  };

  const changeDrinkQty = (dId, delta, e) => {
    if (e) e.stopPropagation();
    setSelectedDrinks((prev) =>
      prev
        .map((d) => {
          if ((d.id || d.idProducto) === dId) {
            const newQty = (d.cantidad || 1) + delta;
            return newQty > 0 ? { ...d, cantidad: newQty } : null;
          }
          return d;
        })
        .filter(Boolean)
    );
  };

  // Quick tag toggle en observación
  const toggleQuickTag = (tag) => {
    setCustomObservation((prev) => {
      if (prev.includes(tag)) {
        return prev
          .replace(tag, "")
          .replace(/,\s*,/g, ",")
          .replace(/^\s*,\s*|\s*,\s*$/g, "")
          .trim();
      }
      const separator = prev.trim() ? ", " : "";
      return `${prev.trim()}${separator}${tag}`;
    });
  };

  // Totales en vivo
  const additionsUnitPrice = selectedAdditions.reduce(
    (sum, a) => sum + Number(a.precio || 0) * Number(a.cantidad || 1),
    0
  );

  const finalUnitPrice = basePrice + additionsUnitPrice;
  const grandTotal = finalUnitPrice * quantity + drinksTotal;

  const productImage =
    producto?.imagen ||
    producto?.imagenUrl ||
    producto?.urlImagen ||
    producto?.foto ||
    producto?.img;

  const isPepsi = String(producto?.nombre || "").toLowerCase().includes("pepsi");
  const isCoca = String(producto?.nombre || "").toLowerCase().includes("coca");

  const isDietSelected = Boolean(
    (() => {
      const pn = String(producto?.nombre || "").toLowerCase();
      const isDietProduct = pn.includes("sin az") || pn.includes("light") || pn.includes("zero") || pn.includes("cero");

      if (!selectedVariant) return isDietProduct;

      const vn = String(selectedVariant.nombre || "").toLowerCase();
      if (vn.includes("con az") || vn.includes("original") || vn.includes("regular")) return false;
      if (selectedVariant.idVariante === 78) return false;
      if (
        selectedVariant.idVariante === 20 ||
        selectedVariant.idVariante === 22 ||
        selectedVariant.idVariante === 58 ||
        selectedVariant.idVariante === 65 ||
        selectedVariant.idVariante === 76 ||
        selectedVariant.idVariante === 77 ||
        selectedVariant.idVariante === 79 ||
        selectedVariant.idVariante === 80 ||
        /sin azúcar|sin azucar|light|zero|black|cero/i.test(vn)
      ) return true;
      if (isDietProduct) return true;
      return false;
    })()
  );

  const matchedSizeVariant = drinkHasSizes
    ? (realVariants.find((v) => {
        const vn = (v.nombre || "").toLowerCase();
        if (selectedSizeId === "400ml") return vn.includes("400") && !vn.includes("1.5") && !vn.includes("2.5") && !vn.includes("light") && !vn.includes("zero") && !vn.includes("sin az");
        if (selectedSizeId === "1.5L") return vn.includes("1.5") || vn.includes("1,5");
        if (selectedSizeId === "2.5L") return vn.includes("2.5") || vn.includes("2,5") || vn.includes("mega");
        return false;
      }) || null)
    : null;

  // Determinar la imagen principal respetando la imagen propia de la variante seleccionada (o del producto padre si es la opción base)
  const isCustomVariantSelected = Boolean(
    selectedVariant && !selectedVariant.esOriginal && !selectedVariant.esVarianteBase
  );
  const variantExplicitImage =
    isCustomVariantSelected && typeof selectedVariant?.imagen === "string" && selectedVariant.imagen.trim()
      ? selectedVariant.imagen.trim()
      : null;

  const heroImage = (() => {
    if (isDrink && drinkHasSizes) {
      if (isCustomVariantSelected && selectedVariant?.customImagen) {
        return selectedVariant.customImagen;
      }
      if (typeof matchedSizeVariant?.imagen === "string" && matchedSizeVariant.imagen.trim()) {
        return matchedSizeVariant.imagen.trim();
      }
      return getDrinkBottleImage(selectedSizeId, producto, selectedVariant, isDietSelected) || productImage;
    } else if (isDrink) {
      return (
        (isCustomVariantSelected && (selectedVariant?.customImagen || variantExplicitImage)) ||
        getDrinkBottleImage("400ml", producto, selectedVariant, isDietSelected) ||
        variantExplicitImage ||
        productImage
      );
    } else {
      return variantExplicitImage || productImage;
    }
  })();

  const effectiveHeroImage =
    heroFallbackToBase && productImage && productImage !== heroImage
      ? productImage
      : heroImage;
  const optimizedHeroImage = effectiveHeroImage ? getOptimizedImageUrl(effectiveHeroImage, 720) : "";

  useEffect(() => {
    setImageError(false);
    setHeroFallbackToBase(false);
  }, [heroImage]);

  // Título dinámico para bebidas que refleja fielmente la fórmula/sabor activo y la presentación seleccionada
  const displayDrinkTitle = (() => {
    if (!isDrink) return producto?.nombre || "";

    const prodName = String(producto?.nombre || "").toLowerCase();
    const isCocaProd = prodName.includes("coca");
    const isPepsiProd = prodName.includes("pepsi");
    const isQuatroProd = prodName.includes("cuatro") || prodName.includes("quatro") || prodName.includes("toronja");

    let baseName = "";

    const vName = String(selectedVariant?.nombre || "").trim();
    const vNameLower = vName.toLowerCase();
    const isGenericSizeVariant =
      !vName ||
      /^(botella|presentaci[oó]n|tama[ñn]o|personal|familiar|mega)?\s*(400\s*ml|1\.?5\s*l|2\.?5\s*l)?$/i.test(vNameLower);

    if (selectedVariant && !selectedVariant.esOriginal && !isGenericSizeVariant) {
      if (isCocaProd && (vNameLower.includes("sin az") || vNameLower.includes("light") || vNameLower.includes("zero") || vNameLower.includes("cero"))) {
        baseName = "Coca-Cola Sin Azúcar / Light";
      } else if (isCocaProd && (vNameLower.includes("con az") || vNameLower.includes("original") || vNameLower.includes("regular"))) {
        baseName = "Coca-Cola Original";
      } else if (isPepsiProd && (vNameLower.includes("light") || vNameLower.includes("black") || vNameLower.includes("zero") || vNameLower.includes("cero"))) {
        baseName = "Pepsi Light / Black";
      } else if (isPepsiProd && (vNameLower.includes("con az") || vNameLower.includes("original") || vNameLower.includes("regular"))) {
        baseName = "Pepsi Regular";
      } else if (vNameLower.includes("uva")) {
        baseName = "Gaseosa Uva Postobón";
      } else if (vNameLower.includes("naranja")) {
        baseName = "Gaseosa Naranja Postobón";
      } else if (vNameLower.includes("colombiana")) {
        baseName = "Gaseosa Colombiana Postobón";
      } else if (vNameLower.includes("manzana")) {
        baseName = "Gaseosa Manzana Postobón";
      } else if (vNameLower.includes("sprite")) {
        baseName = "Gaseosa Sprite";
      } else if (vNameLower.includes("cuatro") || vNameLower.includes("quatro") || vNameLower.includes("toronja")) {
        baseName = "Gaseosa Quatro Toronja";
      } else {
        const cleaned = vName.replace(/\s*400\s*ml/gi, "").replace(/botella\s*/gi, "").trim();
        baseName = cleaned || (isQuatroProd ? "Gaseosa Quatro Toronja" : producto?.nombre || "Bebida");
      }
    } else {
      if (isCocaProd) {
        const isDietProd = isDietSelected || prodName.includes("sin az") || prodName.includes("light") || prodName.includes("zero") || prodName.includes("cero");
        baseName = isDietProd ? "Coca-Cola Sin Azúcar / Light" : "Coca-Cola Original";
      } else if (isPepsiProd) {
        const isDietProd = isDietSelected || prodName.includes("light") || prodName.includes("black") || prodName.includes("zero") || prodName.includes("cero");
        baseName = isDietProd ? "Pepsi Light / Black" : "Pepsi Regular";
      } else if (prodName.includes("uva")) {
        baseName = "Gaseosa Uva Postobón";
      } else if (prodName.includes("naranja")) {
        baseName = "Gaseosa Naranja Postobón";
      } else if (prodName.includes("colombiana")) {
        baseName = "Gaseosa Colombiana Postobón";
      } else if (prodName.includes("manzana")) {
        baseName = "Gaseosa Manzana Postobón";
      } else if (prodName.includes("sprite")) {
        baseName = "Gaseosa Sprite";
      } else if (isQuatroProd) {
        baseName = "Gaseosa Quatro Toronja";
      } else {
        const cleaned = (producto?.nombre || "").replace(/\s*400\s*ml/gi, "").trim();
        baseName = cleaned || (producto?.nombre || "Bebida");
      }
    }

    if (!baseName || baseName.trim() === "" || /^(\(?)400\s*ml(\)?)$/i.test(baseName.trim())) {
      baseName = isQuatroProd ? "Gaseosa Quatro Toronja" : (producto?.nombre ? producto.nombre.replace(/\s*400\s*ml/gi, "").trim() : "Bebida");
    }

    if (drinkHasSizes) {
      return `${baseName} (${selectedSizeObj.label})`;
    }
    return baseName;
  })()

  const brandMeta = getDrinkBrandMeta(
    isDietSelected 
      ? (isPepsi ? "Pepsi Light" : "Coca-Cola Sin Azúcar Light")
      : (selectedVariant?.nombre || producto?.nombre || "")
  );

  // Confirmar y agregar
  const handleConfirm = () => {
    if (stockMax <= 0 || producto?.agotado || producto?.estado === "Inactivo" || producto?.estado === 0) {
      warning(
        "Producto agotado por el momento",
        `Lo sentimos, "${producto?.nombre || "este producto"}" está agotado en este momento y no se encuentra disponible.`
      );
      return;
    }

    if (isComboWithDrinks && !isComboDrinkComplete) {
      setActiveTab("bebidas");
      warning("Bebidas requeridas", `Por favor selecciona las ${requiredDrinkCount} bebidas incluidas de tu combo antes de agregar.`);
      return;
    }

    let targetProdId = producto?.id || producto?.idProducto;
    let chosenVarId = selectedVariant?.idVariante || producto?.id || producto?.idProducto;
    let formulaTitle = "";

    if (isDrink) {
      const prodName = String(producto?.nombre || "").toLowerCase();
      const vName = String(selectedVariant?.nombre || "").toLowerCase();

      // Detect active flavor
      let flavor = "original";
      if (vName.includes("uva") || (!vName && prodName.includes("uva"))) flavor = "uva";
      else if (vName.includes("naranja") || (!vName && prodName.includes("naranja"))) flavor = "naranja";
      else if (vName.includes("colombiana") || (!vName && prodName.includes("colombiana"))) flavor = "colombiana";
      else if (vName.includes("manzana") || (!vName && prodName.includes("manzana"))) flavor = "manzana";
      else if (vName.includes("sprite") || (!vName && prodName.includes("sprite"))) flavor = "sprite";
      else if (vName.includes("cuatro") || vName.includes("quatro") || (!vName && (prodName.includes("cuatro") || prodName.includes("quatro")))) flavor = "quatro";
      else if (prodName.includes("coca") || vName.includes("coca")) flavor = "coca";
      else if (prodName.includes("pepsi") || vName.includes("pepsi")) flavor = "pepsi";
      else if (prodName.includes("agua") || prodName.includes("cristal")) flavor = "agua";

      const isDiet = vName.includes("sin az") || vName.includes("light") || vName.includes("zero") || vName.includes("black") ||
        (!vName && (prodName.includes("sin az") || prodName.includes("light") || prodName.includes("zero")));

      if (flavor === "coca") {
        if (isDiet) {
          targetProdId = 16;
          if (selectedSizeId === "1.5L") chosenVarId = 79;
          else if (selectedSizeId === "2.5L") chosenVarId = 80;
          else chosenVarId = 58;
          formulaTitle = "Coca-Cola Sin Azúcar / Light";
        } else {
          targetProdId = 8;
          if (selectedSizeId === "1.5L") chosenVarId = 61;
          else if (selectedSizeId === "2.5L") chosenVarId = 62;
          else chosenVarId = 8;
          formulaTitle = "Coca-Cola Original";
        }
      } else if (flavor === "pepsi") {
        targetProdId = 11;
        if (isDiet) {
          chosenVarId = 65;
          formulaTitle = "Pepsi Light / Black";
        } else {
          if (selectedSizeId === "1.5L") chosenVarId = 63;
          else if (selectedSizeId === "2.5L") chosenVarId = 64;
          else chosenVarId = 11;
          formulaTitle = "Pepsi Regular";
        }
      } else if (flavor === "manzana") {
        targetProdId = 9;
        if (selectedSizeId === "1.5L") chosenVarId = 59;
        else if (selectedSizeId === "2.5L") chosenVarId = 60;
        else chosenVarId = 9;
        formulaTitle = "Gaseosa Manzana Postobón";
      } else if (flavor === "colombiana") {
        targetProdId = 12;
        if (selectedSizeId === "1.5L") chosenVarId = 66;
        else if (selectedSizeId === "2.5L") chosenVarId = 67;
        else chosenVarId = 12;
        formulaTitle = "Gaseosa Colombiana Postobón";
      } else if (flavor === "uva") {
        targetProdId = 38;
        if (selectedSizeId === "1.5L") chosenVarId = 81;
        else if (selectedSizeId === "2.5L") chosenVarId = 82;
        else chosenVarId = 38;
        formulaTitle = "Gaseosa Uva Postobón";
      } else if (flavor === "naranja") {
        targetProdId = 39;
        if (selectedSizeId === "1.5L") chosenVarId = 83;
        else if (selectedSizeId === "2.5L") chosenVarId = 84;
        else chosenVarId = 39;
        formulaTitle = "Gaseosa Naranja Postobón";
      } else if (flavor === "sprite") {
        targetProdId = 13;
        if (selectedSizeId === "1.5L") chosenVarId = 74;
        else if (selectedSizeId === "2.5L") chosenVarId = 75;
        else chosenVarId = 13;
        formulaTitle = "Gaseosa Sprite";
      } else if (flavor === "quatro") {
        targetProdId = 14;
        if (selectedSizeId === "1.5L") chosenVarId = 76;
        else if (selectedSizeId === "2.5L") chosenVarId = 77;
        else chosenVarId = 14;
        formulaTitle = "Gaseosa Quatro Toronja";
      } else if (flavor === "agua") {
        targetProdId = 10;
        chosenVarId = 10;
        formulaTitle = "Agua Cristal sin Gas";
      } else {
        formulaTitle = selectedVariant?.nombre || producto?.nombre;
      }
    } else {
      const isBaseFood = Boolean(
        !selectedVariant ||
        selectedVariant.esOriginal ||
        selectedVariant.esVarianteBase ||
        isDummyOrBaseVariant(selectedVariant?.nombre, producto?.nombre)
      );
      if (selectedSizeId === "1.5L" || selectedSizeId === "2.5L") {
        const sizeMatchedVar = realVariants.find((v) => {
          const vn = (v.nombre || "").toLowerCase();
          if (selectedSizeId === "1.5L") return vn.includes("1.5") || vn.includes("1,5");
          if (selectedSizeId === "2.5L") return vn.includes("2.5") || vn.includes("2,5") || vn.includes("mega");
          return false;
        });
        chosenVarId = sizeMatchedVar?.idVariante || (selectedVariant?.idVariante !== "BASE" ? selectedVariant?.idVariante : null) || producto?.idVarianteBase || null;
        formulaTitle = selectedVariant && !isBaseFood ? selectedVariant.nombre : null;
      } else if (isBaseFood) {
        chosenVarId = (selectedVariant?.idVariante && selectedVariant.idVariante !== "BASE")
          ? selectedVariant.idVariante
          : (producto?.idVarianteBase || null);
        formulaTitle = null;
      } else {
        chosenVarId = selectedVariant?.idVariante || selectedVariant?.id || null;
        formulaTitle = selectedVariant.nombre;
      }
    }

    const esVarianteBaseFinal = Boolean(
      !isDrink && (
        !selectedVariant ||
        selectedVariant.esOriginal ||
        selectedVariant.esVarianteBase ||
        isDummyOrBaseVariant(selectedVariant?.nombre, producto?.nombre)
      )
    );
    const resolvedVarChanges = (!esVarianteBaseFinal && activeVariantSummary?.changes?.length > 0)
      ? activeVariantSummary.changes.map((c) => ({
          tipoAccion: c.kind === "quitado" ? "QUITAR" : c.kind === "reemplazo" ? "REEMPLAZAR" : c.kind === "extra_cantidad" ? "MODIFICAR_CANTIDAD" : "AGREGAR",
          idInsumo: c.idInsumo,
          insumoNombre: c.nombre,
          cantidad: c.diffQty || 1,
          unidadMedida: c.unit || "und",
          texto: c.texto
        }))
      : [];
    const resolvedVarName = !esVarianteBaseFinal
      ? (formulaTitle || (!isDummyOrBaseVariant(selectedVariant?.nombre, producto?.nombre) ? selectedVariant?.nombre : null) || null)
      : null;

    const cleanBaseName = drinkHasSizes ? producto.nombre.replace(/\s*400\s*ml/gi, "").trim() : producto.nombre;
    let customName = isDrink 
      ? displayDrinkTitle 
      : (formulaTitle && formulaTitle !== cleanBaseName ? `${cleanBaseName} (${formulaTitle})` : (drinkHasSizes ? `${cleanBaseName} (${selectedSizeObj.label})` : cleanBaseName));

    // Detección de promo 2x1 ("Paga 1 y lleva 2")
    const is2x1Promo = Boolean(
      eventInfo && (
        eventInfo.tipo === "PROMOCION_2X1" ||
        eventInfo.tipoEvento === "PROMOCION_2X1" ||
        String(eventInfo.nombre || "").toLowerCase().includes("2x1") ||
        String(eventInfo.descripcion || "").toLowerCase().includes("lleva 2") ||
        String(eventInfo.descripcion || "").toLowerCase().includes("paga 1")
      )
    );

    const kitchenPrepQty = is2x1Promo ? quantity * 2 : quantity;
    if (is2x1Promo && !customName.toLowerCase().includes("2x1") && !customName.toLowerCase().includes("lleva 2")) {
      customName = `${customName} (Promo 2x1 - Paga 1 Lleva 2)`;
    }

    const safeRemovedIngredients = isDrink
      ? []
      : removedIngredients.filter((r) => !isEssentialIngredient(r, producto));

    const personalizacionesFormatted = isDrink
      ? [
          formulaTitle ? `Sabor: ${formulaTitle}` : null,
          drinkHasSizes ? `Presentación: ${selectedSizeObj.label}` : null
        ].filter(Boolean)
      : safeRemovedIngredients.map((r) => `Sin ${r}`);

    let fullNotes = [];
    if (is2x1Promo) {
      fullNotes.push(`¡PROMO 2x1!: Preparar ${kitchenPrepQty} unidades (${quantity} pagada + ${kitchenPrepQty - quantity} gratis)`);
    }
    const eventToppingsForNote = eventInfo ? parseEventoInsumos(eventInfo) : [];
    if (eventToppingsForNote.length > 0) {
      fullNotes.push(`Topping Extra Evento (Gratis): ${formatEventoToppingsText(eventToppingsForNote)}`);
    }
    if (isComboWithDrinks && selectedDrinks.length > 0) {
      const drinksSummary = selectedDrinks
        .map((d) => `${d.cantidad || 1}x ${d.nombre}`)
        .join(", ");
      fullNotes.push(`Bebidas combo: ${drinksSummary}`);
    }
    if (personalizacionesFormatted.length > 0) {
      fullNotes.push(personalizacionesFormatted.join(", "));
    }
    if (customObservation.trim()) {
      fullNotes.push(customObservation.trim());
    }
    const finalObservationString = fullNotes.join(" • ");

    onConfirm({
      producto: {
        ...producto,
        idVariante: chosenVarId,
        idProducto: targetProdId,
        esVarianteBase: esVarianteBaseFinal,
        varianteNombre: resolvedVarName,
        varianteDescripcion: !esVarianteBaseFinal ? (selectedVariant?.descripcion || null) : null,
        varianteEspecificaciones: !esVarianteBaseFinal ? (activeVariantSummary?.especificacionesVariante || null) : null,
        varianteCambios: resolvedVarChanges,
        esVarianteDeEvento: Boolean(!esVarianteBaseFinal && selectedVariant && isVariantFromEvent(selectedVariant)),
        nombrePersonalizado: customName,
        saborSeleccionado: formulaTitle || cleanBaseName,
        configuracionCombo: comboConfig,
        precio: basePrice,
        imagen: effectiveHeroImage || heroImage,
        is2x1Promo,
        cantidadCocina: kitchenPrepQty
      },
      idVariante: chosenVarId,
      idProducto: targetProdId,
      esVarianteBase: esVarianteBaseFinal,
      varianteNombre: resolvedVarName,
      varianteDescripcion: !esVarianteBaseFinal ? (selectedVariant?.descripcion || null) : null,
      varianteEspecificaciones: !esVarianteBaseFinal ? (activeVariantSummary?.especificacionesVariante || null) : null,
      varianteCambios: resolvedVarChanges,
      esVarianteDeEvento: Boolean(!esVarianteBaseFinal && selectedVariant && isVariantFromEvent(selectedVariant)),
      cantidad: quantity,
      cantidadCocina: kitchenPrepQty,
      is2x1Promo,
      adiciones: isDrink ? [] : selectedAdditions,
      bebidas: isDrink ? [] : selectedDrinks,
      bebidasDelCombo: isComboWithDrinks ? selectedDrinks : [],
      isCombo: isComboWithDrinks,
      sabor: formulaTitle || cleanBaseName,
      personalizaciones: personalizacionesFormatted,
      ingredientesRemovidos: safeRemovedIngredients,
      observacion: finalObservationString,
      totalCalculado: grandTotal
    });

    onClose();
  };

  const ambientGlowColor = isDrink ? brandMeta.color : "#f05454";

  const hasRealRatings = reviewsData.total > 0;
  const effectiveRating = hasRealRatings ? reviewsData.promedio : Number(ratingsInfo?.promedio || 0);
  const effectiveReviewsTotal = hasRealRatings ? reviewsData.total : Number(ratingsInfo?.total || 0);

  // Early-return guard AFTER all hooks (React rules of hooks)
  if (!isOpen || !producto) return null;

  const innerCard = (
      <div
        className={
          asPage
            ? "bg-white dark:bg-gray-900 rounded-3xl w-full shadow-lg flex flex-col border border-gray-200/80 dark:border-gray-800 overflow-hidden relative transition-colors"
            : "bg-white dark:bg-gray-900 rounded-3xl sm:rounded-[32px] max-w-2xl sm:max-w-[700px] w-full shadow-2xl flex flex-col max-h-[92dvh] border border-gray-100 dark:border-gray-800 overflow-hidden relative transition-colors"
        }
      >
        {/* ── Close Floating Button (solo en modo modal; en vista página hay botón Volver en el encabezado) ── */}
        {!asPage && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95"
            title="Cerrar modal (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* ── Scrollable Body Area ── */}
        <div className={asPage ? "flex-1" : "overflow-y-auto overflow-x-hidden flex-1 no-scrollbar"}>
          {/* ═══ 1. LUXURY DUAL-STAGE HERO PHOTO (ENCUADRE PERFECTO & WOW EFFECT) ═══ */}
          <div className={`relative w-full ${asPage ? "h-64 sm:h-80" : "h-52 sm:h-64"} bg-slate-950 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-gray-800/80`}>
            {/* Background Ambient Layer (Glow difuminado suave) */}
            {optimizedHeroImage && !imageError ? (
              <>
                <img
                  src={optimizedHeroImage}
                  alt=""
                  aria-hidden="true"
                  width="640"
                  height="256"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 opacity-25 dark:opacity-35 saturate-110 pointer-events-none transition-all duration-500"
                />
                {/* Spotlight radial central gastronómico adaptativo */}
                <div
                  className="absolute inset-0 pointer-events-none transition-colors duration-500"
                  style={{
                    background: `radial-gradient(ellipse at center, ${ambientGlowColor}33 0%, rgba(240,84,84,0.1) 45%, transparent 70%)`
                  }}
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-red-950/40 to-gray-950" />
            )}

            {/* Foreground Crisp Centered Food Stage (Sin recortes, encuadre 100% perfecto) */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-3 sm:p-5">
              {optimizedHeroImage && !imageError ? (
                <img
                  key={optimizedHeroImage}
                  src={optimizedHeroImage}
                  alt={isCustomVariantSelected && selectedVariant?.nombre ? `${producto.nombre} - ${selectedVariant.nombre}` : producto.nombre}
                  width="320"
                  height="200"
                  decoding="async"
                  onError={(e) => {
                    if (isDrink) {
                      const fallback = isDietSelected ? OFFICIAL_DRINK_IMAGES.coca_cola_light : OFFICIAL_DRINK_IMAGES.coca_cola;
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                        return;
                      }
                    } else if (!heroFallbackToBase && productImage && effectiveHeroImage !== productImage) {
                      setHeroFallbackToBase(true);
                      return;
                    }
                    setImageError(true);
                  }}
                  className="max-h-[170px] sm:max-h-[200px] w-auto max-w-[90%] object-contain drop-shadow-[0_22px_28px_rgba(0,0,0,0.7)] select-none animate-in zoom-in-95 duration-300"
                />
              ) : (
                <div className="flex items-center justify-center w-36 h-36 rounded-full bg-white/10 backdrop-blur-md border border-white/20 drop-shadow-2xl">
                  <FoodIcon name={producto.nombre} category={producto.categoria} size={72} stroke={1.75} className="text-amber-400" />
                </div>
              )}
            </div>

            {/* Subtle bottom vignette to blend with info bar */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

            {/* Top-Left Unified Badges Row (Categoría + Evento + Vigencia sin superposición) */}
            <div className={`absolute top-3.5 left-3.5 ${asPage ? "right-4" : "right-14"} z-20 flex flex-wrap items-center gap-2`}>
              <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white border border-white/20 text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md whitespace-nowrap">
                <FoodIcon name={producto.nombre} category={producto.categoria} size={14} stroke={2} className="text-amber-400 shrink-0" />
                <span>{producto.categoria || "Plato Especial"}</span>
              </span>
              {eventInfo && (
                <span className="px-3 py-1 rounded-full bg-amber-100/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/70 font-bold text-[11px] shadow-md inline-flex items-center gap-1.5 backdrop-blur-xs whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    {eventInfo.nombre}
                    {eventInfo.tipo === "Descuento" && eventInfo.discountPercent
                      ? ` · -${eventInfo.discountPercent}% OFF`
                      : eventInfo.tipo === "Promoción Precio"
                      ? " · Precio Promo"
                      : (eventInfo.tipo === "Añadir Insumos" || String(eventInfo.tipo).toLowerCase().includes("topping") || String(eventInfo.tipo).toLowerCase().includes("insumo"))
                      ? " · + Topping Extra"
                      : eventInfo.tipo === "PROMOCION_2X1"
                      ? " · 2x1"
                      : ""}
                  </span>
                </span>
              )}
              {eventInfo && (eventInfo.vigencia?.label || eventInfo.formattedDate) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/65 text-white backdrop-blur-md border border-white/15 shadow-sm whitespace-nowrap">
                  <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>{eventInfo.vigencia?.label || `Hasta ${eventInfo.formattedDate}`}</span>
                </span>
              )}
            </div>

            {/* Bottom Overlay Info (Name & Price) */}
            <div className="absolute bottom-3 left-3.5 right-3.5 sm:left-4 sm:right-4 z-20 flex items-end justify-between gap-2.5 sm:gap-3 text-white">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-black leading-tight line-clamp-2 break-words drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-white tracking-tight">
                  {isDrink
                    ? displayDrinkTitle
                    : (drinkHasSizes
                        ? `${producto.nombre.replace(/\s*400\s*ml/gi, "").trim()} ${selectedSizeObj.label}`
                        : producto.nombre)}
                </h2>
                {isDrink && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${brandMeta.badgeColor} shadow-sm`}>
                      {brandMeta.badge}
                    </span>
                    {drinkHasSizes && (
                      <span className="text-xs text-amber-200 drop-shadow-md font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{selectedSizeObj.title}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Price Pill */}
              <div className="text-right shrink-0 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/25 shadow-xl">
                {hasDiscount && (
                  <span className="block text-[11px] text-gray-300 line-through font-bold">
                    ${originalPrice.toLocaleString("es-CO")}
                  </span>
                )}
                <span className="text-base sm:text-xl font-black text-amber-300 drop-shadow-md">
                  ${basePrice.toLocaleString("es-CO")}
                </span>
              </div>
            </div>
          </div>

          {/* Ratings & Quick Specs Sub-Bar (Clicking stars switches directly to Reseñas tab) */}
          <div className="px-4 sm:px-6 py-2.5 bg-gray-50/90 dark:bg-gray-850/80 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("resenas");
                setShowWriteReview(isReadOnlyReviews ? false : true);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition cursor-pointer border border-amber-200/80 dark:border-amber-800/60 shadow-2xs group shrink-0 whitespace-nowrap"
              title={isReadOnlyReviews ? "Ver calificaciones y opiniones de clientes en la web" : "Ver calificaciones y escribir una reseña"}
            >
              {hasRealRatings ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-amber-800 dark:text-amber-200">{effectiveRating.toFixed(1)}</span>
                  <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 font-medium">
                    ({effectiveReviewsTotal})
                  </span>
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                  <span className="text-amber-800 dark:text-amber-300 font-medium text-[11px]">Sin opiniones aún</span>
                </>
              )}
              <span className="h-3 w-px bg-amber-300/60 dark:bg-amber-700/60 mx-0.5" />
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold underline hover:text-amber-900 dark:hover:text-amber-100">
                {isReadOnlyReviews ? "Ver opiniones" : "Calificar"}
              </span>
            </button>

            {/* Chips de especificaciones con diseño armónico y alineación perfecta */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-2xs whitespace-nowrap" title="Tiempo de preparación artesanal en cocina">
                <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{isDrink ? "Servido frío inmediato" : ficha?.tiempoPreparacion ? `Prep: ${ficha.tiempoPreparacion}-${ficha.tiempoPreparacion + 3} min` : "Prep: 12-15 min"}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-2xs whitespace-nowrap" title="Rendimiento y porción">
                <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{isDrink ? selectedSizeObj.porciones : (ficha?.rendimiento || "1 unidad")}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-2xs whitespace-nowrap" title="Disponibilidad actual en cocina">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className={stockMax > 0 ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-rose-500 font-bold"}>
                  {stockMax > 0 ? `${stockMax} disp.` : "Agotado"}
                </span>
              </span>
            </div>
          </div>

          {/* ═══ DESCRIPCIÓN COMPLETA DEL PLATILLO (MÁXIMA LEGIBILIDAD Y ALTO CONTRASTE) ═══ */}
          {(producto.descripcion || activeVariantSummary?.especificaciones) && (
            <div className="mx-4 sm:mx-6 mt-3.5 mb-2.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-amber-50/30 to-transparent dark:from-amber-950/30 dark:via-amber-950/15 dark:to-transparent border border-amber-200/80 dark:border-amber-700/50 shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-extrabold text-xs text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                    Descripción & Especificaciones
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/60">
                    {selectedVariant && !selectedVariant.esOriginal && !selectedVariant.esVarianteBase
                      ? `Variante: ${selectedVariant.nombre}`
                      : "Receta de la Casa"}
                  </span>
                </div>
                {producto.descripcion && (
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                    {producto.descripcion}
                  </p>
                )}
                {activeVariantSummary?.especificaciones && activeVariantSummary.especificaciones !== producto.descripcion && (
                  <p className="text-xs font-semibold text-amber-900/90 dark:text-amber-200 mt-1.5 bg-white/70 dark:bg-gray-900/50 px-2.5 py-1.5 rounded-lg border border-amber-200/70 dark:border-amber-800/50">
                    Especificaciones técnicas: {activeVariantSummary.especificaciones}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ═══ BENEFICIOS EXCLUSIVOS DEL EVENTO (FESTIVAL DROP HIGHLIGHT) ═══ */}
          {eventInfo && (
            <div className="mx-4 sm:mx-6 mt-1 mb-3.5 p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-red-50/30 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-red-950/20 border border-amber-200/90 dark:border-amber-700/60 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-100" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                        {eventInfo.nombre}
                      </h4>
                      <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/60 shrink-0">
                        {eventInfo.tipo === "Descuento"
                          ? "DESCUENTO"
                          : eventInfo.tipo === "Promoción Precio"
                          ? "PRECIO ESPECIAL"
                          : (eventInfo.tipo === "Añadir Insumos" || String(eventInfo.tipo).toLowerCase().includes("topping") || String(eventInfo.tipo).toLowerCase().includes("insumo"))
                          ? "TOPPING EXTRA GRATIS"
                          : eventInfo.tipo === "COMBO_ESPECIAL"
                          ? "COMBO AHORRO"
                          : eventInfo.tipo === "PROMOCION_2X1"
                          ? "PROMO 2X1"
                          : "FESTIVAL DROP"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                      {eventInfo.descripcion && !/^(test|prueba|asdf)$/i.test(eventInfo.descripcion.trim())
                        ? eventInfo.descripcion
                        : "Receta conmemorativa de edición limitada con precio y presentación especial."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid simétrico y perfectamente balanceado en altura */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-amber-200/70 dark:border-amber-800/50">
                {(() => {
                  const eventToppings = parseEventoInsumos(eventInfo);
                  const isToppingType =
                    eventInfo.tipo === "Añadir Insumos" ||
                    String(eventInfo.tipo).toLowerCase().includes("topping") ||
                    String(eventInfo.tipo).toLowerCase().includes("insumo");

                  if (isToppingType) {
                    return (
                      <div className="p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 border border-purple-200/90 dark:border-purple-900/50 sm:col-span-2 flex flex-col justify-center text-center shadow-2xs">
                        <p className="text-[10px] sm:text-[11px] text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider mb-0.5">
                          Toppings Incluidos Sin Costo
                        </p>
                        <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 break-words">
                          {eventToppings.length > 0
                            ? formatEventoToppingsText(eventToppings)
                            : "Toppings seleccionados gratis"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 border border-amber-100/90 dark:border-amber-900/40 flex flex-col justify-center text-center shadow-2xs min-h-[66px]">
                        <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Ahorro Directo</p>
                        <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {eventInfo.savings > 0 ? `$${eventInfo.savings.toLocaleString('es-CO')} (-${eventInfo.discountPercent}%)` : `${eventInfo.discountPercent}% OFF`}
                        </p>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 border border-amber-100/90 dark:border-amber-900/40 flex flex-col justify-center text-center shadow-2xs min-h-[66px]">
                        <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-semibold mb-0.5">
                          {eventToppings.length > 0 ? "Topping Extra" : "Receta Exclusiva"}
                        </p>
                        <p className="text-xs sm:text-sm font-black text-purple-700 dark:text-purple-300 truncate">
                          {eventToppings.length > 0 ? formatEventoToppingsText(eventToppings) : "100% Gourmet"}
                        </p>
                      </div>
                    </>
                  );
                })()}
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-gray-800/90 border border-amber-100/90 dark:border-amber-900/40 flex flex-col justify-center text-center shadow-2xs min-h-[66px]">
                  <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-semibold mb-0.5">Disponibilidad</p>
                  <p className={`text-xs sm:text-sm font-black ${eventInfo.vigencia?.urgente ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-orange-700 dark:text-orange-300'}`}>
                    {eventInfo.vigencia?.label || (eventInfo.formattedDate || "Limitada")}
                  </p>
                  {eventInfo.formattedDate && eventInfo.vigencia?.diasRestantes > 0 && (
                    <p className="text-[9.5px] text-gray-400 font-medium mt-0.5">Hasta {eventInfo.formattedDate}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ 2. TABS NAVIGATION (CONDICIONADO: BEBIDAS TIENEN SABORES; COMIDA TIENE PERSONALIZAR Y ADICIONES) ═══ */}
          <div className="px-3 sm:px-4 pt-2.5 pb-2 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl w-full max-w-full overflow-x-auto no-scrollbar touch-scroll-x">
              {isDrink ? (
                <>
                  {(drinkHasSizes || drinkFormulaVariants.length > 1 || realVariants.length > 1) && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("presentacion")}
                      className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
                        activeTab === "presentacion"
                          ? "bg-white dark:bg-gray-900 text-[#f05454] dark:text-red-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{drinkHasSizes ? "Tamaño & Presentación" : "Variantes & Sabor"}</span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black leading-none whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                          activeTab === "presentacion"
                            ? "bg-[#f05454] text-white shadow-xs"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {drinkHasSizes ? (selectedSizeObj?.label || "400 ml") : (selectedVariant?.nombre || "Variantes")}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab("resenas")}
                    className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
                      activeTab === "resenas"
                        ? "bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    <span>Reseñas</span>
                    {effectiveReviewsTotal > 0 && (
                      <span className="shrink-0 min-w-[16px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black leading-none whitespace-nowrap">
                        {effectiveReviewsTotal}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {hasRecipeTabContent && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("personalizar")}
                      className={`flex-1 py-2 px-2 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer select-none whitespace-nowrap shrink-0 ${
                        activeTab === "personalizar"
                          ? "bg-white dark:bg-gray-900 text-[#f05454] dark:text-red-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <ChefHat className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {comboRecipeInfo.isComboProd && comboRecipeInfo.comboItems.length > 0
                          ? (eventInfo ? "Composición del Combo Promocional" : "Composición del Combo")
                          : customizableIngredients.length > 0
                            ? `Personalizar (${customizableIngredients.length})`
                            : "Mise & Place"}
                      </span>
                      {removedIngredients.length > 0 && (
                        <span className="shrink-0 min-w-[16px] px-1 py-0.5 rounded-full bg-[#f05454] text-white text-[9.5px] flex items-center justify-center font-black leading-none whitespace-nowrap">
                          -{removedIngredients.length}
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab("adiciones")}
                    className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer select-none whitespace-nowrap ${
                      activeTab === "adiciones"
                        ? "bg-white dark:bg-gray-900 text-[#f05454] dark:text-red-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Adiciones</span>
                    {selectedAdditions.length > 0 && (
                      <span className="shrink-0 min-w-[16px] px-1 py-0.5 rounded-full bg-[#f05454] text-white text-[9.5px] flex items-center justify-center font-black leading-none whitespace-nowrap">
                        {selectedAdditions.length}
                      </span>
                    )}
                  </button>

                  {availableBebidas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("bebidas")}
                      className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer select-none whitespace-nowrap ${
                        activeTab === "bebidas"
                          ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                          : isComboWithDrinks && !isComboDrinkComplete
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 animate-pulse"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <FoodIcon name="drink" size={13} className="shrink-0" />
                      <span className="truncate">{isComboWithDrinks ? "Bebidas Combo" : "Bebidas"}</span>
                      {isComboWithDrinks ? (
                        <span className={`shrink-0 min-w-[16px] px-1 py-0.5 rounded-full text-[9.5px] flex items-center justify-center font-black leading-none whitespace-nowrap ${
                          isComboDrinkComplete ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                        }`}>
                          {totalSelectedDrinkQty}/{requiredDrinkCount}
                        </span>
                      ) : selectedDrinks.length > 0 ? (
                        <span className="shrink-0 min-w-[16px] px-1 py-0.5 rounded-full bg-blue-600 text-white text-[9.5px] flex items-center justify-center font-black leading-none whitespace-nowrap">
                          {selectedDrinks.length}
                        </span>
                      ) : null}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab("resenas")}
                    className={`flex-1 min-w-0 py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer select-none whitespace-nowrap ${
                      activeTab === "resenas"
                        ? "bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    <span>Reseñas</span>
                    {effectiveReviewsTotal > 0 && (
                      <span className="shrink-0 min-w-[16px] px-1 py-0.5 rounded-full bg-amber-500 text-white text-[9.5px] flex items-center justify-center font-black leading-none whitespace-nowrap">
                        {effectiveReviewsTotal}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ═══ 3. TAB CONTENT PANELS ═══ */}
          <div className="p-4 sm:p-6 space-y-5">
            {/* ─── TAB 0: VARIANTES SIN TAMAÑO PARA BEBIDAS ─── */}
            {!drinkHasSizes && isDrink && activeTab === "presentacion" && (drinkFormulaVariants.length > 1 || realVariants.length > 1) && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <ProductVariantInspector
                  producto={{ ...producto, fichaTecnica: liveFicha || producto?.fichaTecnica }}
                  variants={drinkFormulaVariants.length > 0 ? drinkFormulaVariants : realVariants}
                  selectedKey={selectedVariant?.idVariante || selectedVariant?.id || "BASE"}
                  onSelect={(key, vObj) => {
                    if (vObj) handleSelectDrinkFormula(vObj);
                  }}
                  basePrice={Number(producto?.precio || 0)}
                  includeBaseOption={false}
                  isDrink={true}
                  title="Presentaciones y fórmulas disponibles"
                />
              </div>
            )}

            {/* ─── TAB 0: TAMAÑOS DE BEBIDA (ULTRA PREMIUM FAST FOOD SELECTOR) ─── */}
            {drinkHasSizes && activeTab === "presentacion" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* 1. SECCIÓN: TAMAÑO & PRESENTACIÓN (400 ml, 1.5 Litros, 2.5 Litros) */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5 uppercase tracking-wide">
                        <Layers className="w-4 h-4 text-[#f05454]" />
                        Tamaño & Presentación
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isFormulaLimitedTo400ml
                          ? "Presentación disponible para esta versión:"
                          : "Selecciona el tamaño ideal para refrescarte:"}
                      </p>
                    </div>
                    <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#f05454] dark:text-red-400 border border-red-200 dark:border-red-900/40 whitespace-nowrap shrink-0">
                      {selectedSizeObj.label}
                    </span>
                  </div>

                  <div className={`grid grid-cols-1 gap-3 ${displayedDrinkSizes.length === 1 ? "sm:grid-cols-1 max-w-xs" : "sm:grid-cols-3"}`}>
                    {displayedDrinkSizes.map((size) => {
                      const isSelected = selectedSizeId === size.id;
                      const matchedVar = realVariants.find((v) => {
                        const vn = (v.nombre || "").toLowerCase();
                        if (size.id === "400ml") return vn.includes("400") && !vn.includes("1.5") && !vn.includes("2.5") && !vn.includes("light") && !vn.includes("zero") && !vn.includes("sin az");
                        if (size.id === "1.5L") return vn.includes("1.5") || vn.includes("1,5");
                        if (size.id === "2.5L") return vn.includes("2.5") || vn.includes("2,5") || vn.includes("mega");
                        return false;
                      });
                      const displayPrice = matchedVar
                        ? Number(matchedVar.precio)
                        : (size.id === "400ml"
                            ? (selectedVariant?.precio !== undefined && Number(selectedVariant.precio) > 0 && Number(selectedVariant.precio) <= 6000
                                ? Number(selectedVariant.precio)
                                : (Number(producto?.precio || 0) > 0 && Number(producto?.precio || 0) <= 6000
                                    ? Number(producto.precio)
                                    : (isPostobonDrink ? size.defaultPostobonPrice : size.defaultPremiumPrice)))
                            : (size.id === "1.5L"
                                ? (selectedVariant?.precio !== undefined && Number(selectedVariant.precio) >= 7000 && Number(selectedVariant.precio) <= 10500
                                    ? Number(selectedVariant.precio)
                                    : (isPostobonDrink ? size.defaultPostobonPrice : size.defaultPremiumPrice))
                                : (isPostobonDrink ? size.defaultPostobonPrice : size.defaultPremiumPrice)));
                      const bottleImg = getOptimizedImageUrl(
                        (typeof matchedVar?.imagen === "string" && matchedVar.imagen.trim())
                          ? matchedVar.imagen.trim()
                          : getDrinkBottleImage(size.id, producto, selectedVariant, isDietSelected),
                        120
                      );

                      return (
                        <div
                          key={size.id}
                          onClick={() => handleSelectDrinkSize(size.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none relative flex flex-col justify-between group ${
                            isSelected
                              ? "border-[#f05454] bg-red-50/70 dark:bg-red-950/30 shadow-md ring-2 ring-red-400/30 scale-[1.01]"
                              : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                          }`}
                        >
                          {/* Top Row: Bottle Thumbnail + Tag + Radio Check */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-11 h-14 rounded-xl flex items-center justify-center p-1 border transition-all shrink-0 ${
                                isSelected
                                  ? "bg-white dark:bg-gray-900 border-red-300 dark:border-red-900 shadow-sm"
                                  : "bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-700"
                              }`}>
                                <img
                                  src={bottleImg}
                                  alt={size.label}
                                  width="44"
                                  height="56"
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    if (size.id === "400ml") {
                                      e.currentTarget.src = isDietSelected ? OFFICIAL_DRINK_IMAGES.coca_cola_light : OFFICIAL_DRINK_IMAGES.coca_cola;
                                    }
                                  }}
                                  className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-110"
                                />
                              </div>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isSelected
                                  ? "bg-[#f05454] text-white shadow-xs"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              }`}>
                                {size.tag}
                              </span>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                isSelected
                                  ? "border-[#f05454] bg-[#f05454] text-white"
                                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Middle: Title & Subtext */}
                          <div className="my-1">
                            <h4 className="font-black text-sm text-gray-900 dark:text-gray-100">
                              {size.label}
                            </h4>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {size.subtext}
                            </p>
                          </div>

                          {/* Bottom: Price */}
                          <div className="mt-2.5 pt-2 border-t border-gray-150 dark:border-gray-700/60 flex items-center justify-between">
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-bold">Precio</span>
                            <span className="text-sm font-black text-gray-900 dark:text-gray-100">
                              ${displayPrice.toLocaleString("es-CO")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Banner explicativo amigable cuando la fórmula está restringida a 400ml */}
                  {isFormulaLimitedTo400ml && (
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs mt-3 animate-in fade-in duration-200">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Presentación exclusiva de 400 ml</p>
                        <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                          La versión <strong>{selectedVariant?.nombre || "Light / Cero Azúcar"}</strong> únicamente está disponible en botella personal de 400 ml. Los tamaños 1.5 L y 2.5 L corresponden a la versión tradicional de <strong>{isPepsi ? "Pepsi Regular con azúcar" : "versión tradicional"}</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Variantes de Sabor (ej. Pepsi Regular vs Pepsi Light) */}
                {drinkFormulaVariants.length > 1 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5 uppercase tracking-wide">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Variante
                      </h3>
                      <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                        {selectedVariant?.nombre || "Selecciona tu variante preferida"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {drinkFormulaVariants.map((variant) => {
                        const isSelected = (selectedVariant?.idVariante || selectedVariant?.id) === (variant.idVariante || variant.id) ||
                          (variant.esOriginal && (!selectedVariant || selectedVariant.esOriginal || selectedVariant.idVariante === (producto?.id || producto?.idProducto)));
                        const meta = getDrinkBrandMeta(variant.nombre || producto.nombre);
                        const isDietVar = /sin azúcar|sin azucar|light|zero|black/i.test(variant.nombre || "");
                        const isRegularVar = /con azúcar|con azucar|original|regular/i.test(variant.nombre || "");
                        const isDietEffective = isRegularVar ? false : (isDietVar || (variant.esOriginal && (producto?.nombre || "").toLowerCase().includes("sin az")));
                        const isPepsiVariantLimited = isPepsi && isDietEffective;

                        const varImg = variant.imagen ||
                          getDrinkBottleImage("400ml", producto, variant, isDietEffective) ||
                          (isPepsi && isDietEffective ? "/images/drinks/pepsi_light-removebg-preview.png" : null) ||
                          (isCoca && isDietEffective ? OFFICIAL_DRINK_IMAGES.coca_cola_light : null) ||
                          (isCoca ? OFFICIAL_DRINK_IMAGES.coca_cola : null) ||
                          (isPepsi ? "/images/drinks/pepsi_400ml-removebg-preview.png" : null) ||
                          producto.imagen;

                        const subtitle = variant.esOriginal
                          ? (isPepsi ? "Variante clásica con azúcar • Tamaños 400 ml, 1.5 L y 2.5 L" : "Sabor clásico tradicional")
                          : (isPepsiVariantLimited
                              ? "Cero azúcar • Disponible exclusivamente en 400 ml"
                              : (isDietVar ? "Cero azúcar, sin calorías y con todo el sabor" : "Variante y sabor especial refrescante"));

                        return (
                          <div
                            key={variant.idVariante || variant.id || variant.nombre}
                            onClick={() => handleSelectDrinkFormula(variant)}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 transition-all cursor-pointer select-none active:scale-[0.99] ${
                              isSelected
                                ? "border-[#f05454] bg-red-50/70 dark:bg-red-950/30 shadow-xs ring-2 ring-red-400/40"
                                : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 flex items-center justify-center p-1">
                                <img
                                  src={getOptimizedImageUrl(varImg, 120)}
                                  alt={variant.nombre}
                                  width="40"
                                  height="40"
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    const fallback = productImage || OFFICIAL_DRINK_IMAGES.coca_cola;
                                    if (fallback && e.currentTarget.src !== fallback) {
                                      e.currentTarget.src = fallback;
                                    }
                                  }}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-900 dark:text-gray-100 font-black text-xs sm:text-sm truncate">
                                    {variant.nombre}
                                  </p>
                                  <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                                    isPepsiVariantLimited
                                      ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                                      : meta.badgeColor
                                  }`}>
                                    {isPepsiVariantLimited ? "Solo 400 ml" : (variant.esOriginal ? "Original" : (meta.badge || "Especial"))}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                  {subtitle}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "border-[#f05454] bg-[#f05454] text-white"
                                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 1: PERSONALIZAR INGREDIENTES (MISE EN PLACE CON LÓGICA HUMANA DE COCINA) ─── */}
            {!isDrink && activeTab === "personalizar" && eventInfo && <EventoToppingsCard event={eventInfo} />}
            {!isDrink && activeTab === "personalizar" && !(comboRecipeInfo.isComboProd && comboRecipeInfo.comboItems.length > 0) && (personalizables.length > 0 || foodVariants.length > 0) && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-red-500" />
                      Mise & Place & Personalización
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Variante e ingredientes personalizables:
                    </p>
                  </div>
                  {removedIngredients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRemovedIngredients([])}
                      className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Restablecer todo
                    </button>
                  )}
                </div>

                {/* ── SECCIÓN 0: SELECTOR E INSPECTOR DE VARIANTES (PRECIO, QUÉ CAMBIA Y ESPECIFICACIONES) ── */}
                {foodVariants.filter((fv) => !fv.esOriginal).length > 0 && (
                  <ProductVariantInspector
                    producto={{ ...producto, fichaTecnica: liveFicha || producto?.fichaTecnica }}
                    variants={foodVariants.filter((fv) => !fv.esOriginal)}
                    selectedKey={selectedVariant && !selectedVariant.esOriginal && !selectedVariant.esVarianteBase ? selectedVariant.idVariante : "BASE"}
                    onSelect={(key, vObj) => {
                      if (key === "BASE" || !vObj) {
                        setSelectedVariant(foodVariants.find((fv) => fv.esOriginal) || null);
                      } else {
                        setSelectedVariant(vObj);
                      }
                    }}
                    basePrice={Number(producto?.precio || 0)}
                    getPriceInfo={(vObj) => resolveFoodVariantPrice(vObj)}
                    includeBaseOption={true}
                    baseOptionLabel="Preparación Clásica / Estándar"
                    isDrink={false}
                    title="Variantes disponibles, precio y lo que cambia"
                  />
                )}

                {/* ── SECCIÓN 1: INGREDIENTES BASE OBLIGATORIOS (PROTEGIDOS POR LÓGICA HUMANA) ── */}
                {baseIngredients.length > 0 && (
                  <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Base Indispensable del Plato</span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> No removible
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {baseIngredients.map((baseIng) => (
                        <div
                          key={baseIng.id}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-2xs select-none border ${
                            baseIng.variantStatus?.kind === "reemplazo"
                              ? "bg-purple-50/60 dark:bg-purple-950/25 border-purple-300/80 dark:border-purple-800"
                              : baseIng.variantStatus?.isExtra
                                ? "bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-300/80 dark:border-emerald-800"
                                : "bg-white/90 dark:bg-gray-800/90 border-amber-200/60 dark:border-amber-900/40"
                          }`}
                          title={baseIng.variantStatus?.badgeText || "Ingrediente base indispensable del plato (no se puede retirar)"}
                        >
                          <span className="flex items-center gap-2 min-w-0 flex-1 text-xs font-bold text-gray-800 dark:text-gray-200">
                            <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
                              <FoodIcon name={baseIng.icono || baseIng.nombre} size={15} stroke={1.75} />
                            </span>
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block truncate">{baseIng.nombre}</span>
                              {baseIng.variantStatus?.isExtra && (
                                <span
                                  className={`inline-block max-w-full truncate mt-0.5 text-[9.5px] font-black px-1.5 py-0.5 rounded-md border ${
                                    baseIng.variantStatus.kind === "reemplazo"
                                      ? "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-700"
                                      : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700"
                                  }`}
                                >
                                  {baseIng.variantStatus.shortBadge}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Obligatorio
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── SECCIÓN 2: INGREDIENTES PERSONALIZABLES (EXCLUSIONES A PETICIÓN) ── */}
                {customizableIngredients.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <p className="text-xs font-extrabold text-gray-700 dark:text-gray-300">
                        ¿Deseas retirar algún ingrediente de tu pedido?
                      </p>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        Toca para alternar (Con / Sin)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {customizableIngredients.map((ing) => {
                        const isRemoved = removedIngredients.includes(ing.nombre);
                        return (
                          <button
                            key={ing.id}
                            type="button"
                            onClick={() => toggleRemoveIngredient(ing.nombre)}
                            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-98 select-none ${
                              isRemoved
                                ? "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 shadow-xs ring-2 ring-red-400/40"
                                : ing.variantStatus?.kind === "reemplazo"
                                  ? "border-purple-300 dark:border-purple-700 bg-purple-50/40 dark:bg-purple-950/20 text-purple-950 dark:text-purple-100 hover:bg-purple-50"
                                  : ing.variantStatus?.isExtra
                                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100 hover:bg-emerald-50"
                                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-750 flex items-center justify-center shrink-0 text-gray-700 dark:text-gray-200 shadow-2xs">
                                <FoodIcon name={ing.icono || ing.nombre} size={18} stroke={1.75} />
                              </span>
                              <span className="min-w-0 flex-1 text-left">
                                <span className={`block truncate ${isRemoved ? "line-through opacity-75" : ""}`}>
                                  {ing.nombre}
                                </span>
                                {ing.variantStatus?.isExtra && (
                                  <span
                                    className={`inline-block max-w-full truncate mt-0.5 text-[9.5px] font-black px-1.5 py-0.2 rounded ${
                                      ing.variantStatus.kind === "reemplazo"
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200"
                                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                                    }`}
                                  >
                                    {ing.variantStatus.shortBadge}
                                  </span>
                                )}
                              </span>
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0 transition-colors ${
                                isRemoved
                                  ? "bg-red-500 text-white"
                                  : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40"
                              }`}
                            >
                              {isRemoved ? "Sin" : "Con"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Este plato se prepara exclusivamente con sus ingredientes base indispensables.
                  </p>
                )}

                {/* Banner de orden personalizada para cocina */}
                {removedIngredients.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs">
                    <Info className="w-4 h-4 text-red-600 shrink-0" />
                    <p className="text-red-700 dark:text-red-300 font-bold">
                      Comanda a cocina:{" "}
                      <span className="underline">
                        Sin {removedIngredients.map((r) => r.toLowerCase()).join(", Sin ")}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 1B: COMPOSICIÓN DEL COMBO (ESTÁNDAR O PROMOCIONAL) ─── */}
            {!isDrink && activeTab === "personalizar" && (comboRecipeInfo.comboItems.length > 0 || (!personalizables.length && comboRecipeInfo.steps.length > 0)) && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {comboRecipeInfo.comboItems.length > 0 && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          <ChefHat className="w-4 h-4 text-red-500 shrink-0" />
                          <span>
                            {comboRecipeInfo.isComboProd
                              ? (eventInfo ? "Composición del Combo Promocional" : "Composición del Combo")
                              : (eventInfo ? "Componentes de la Promoción" : "Composición del Plato")}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {eventInfo
                            ? "Productos y acompañamientos incluidos en esta oferta:"
                            : "Productos y acompañamientos incluidos en este combo:"}
                        </p>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 shrink-0">
                        {comboRecipeInfo.comboItems.length} {comboRecipeInfo.comboItems.length === 1 ? "producto" : "productos"}
                      </span>
                    </div>

                    <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-3 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300">
                        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{eventInfo ? "Qué incluye esta promoción" : "Qué incluye este combo"}</span>
                      </div>
                      <div className="space-y-2">
                        {comboRecipeInfo.comboItems.map((item) => (
                          <div
                            key={item.id}
                            className="w-full p-3 rounded-xl bg-white/95 dark:bg-gray-800/90 border border-amber-200/70 dark:border-amber-900/50 shadow-2xs transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2.5 min-w-0 flex-1 text-xs sm:text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                                <span className="w-8 h-8 rounded-xl bg-amber-100/90 dark:bg-amber-950/70 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
                                  <FoodIcon name={item.nombre} size={16} stroke={1.75} />
                                </span>
                                <span>{item.nombre}</span>
                              </span>
                              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> {item.tag}
                              </span>
                            </div>
                            {Array.isArray(item.ingredientes) && item.ingredientes.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-amber-100/80 dark:border-gray-700/60 pl-10 flex flex-wrap gap-1.5">
                                {item.ingredientes.map((ing, iIdx) => (
                                  <span
                                    key={iIdx}
                                    className="inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-amber-50/70 dark:bg-gray-700/80 border border-amber-200/50 dark:border-gray-600/40 text-gray-700 dark:text-gray-200"
                                  >
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {comboRecipeInfo.comboItems.length === 0 && comboRecipeInfo.steps.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 space-y-2">
                    <p className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Preparación al momento en cocina
                    </p>
                    <ol className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 list-decimal list-inside">
                      {comboRecipeInfo.steps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {comboRecipeInfo.isComboProd && comboRecipeInfo.includedDrinksCount > 0 && availableBebidas.length > 0 && (
                  <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                        <FoodIcon name="drink" size={16} />
                      </span>
                      <p className="text-blue-900 dark:text-blue-200 font-semibold">
                        Elige tus bebidas ({comboRecipeInfo.includedDrinksCount} {comboRecipeInfo.includedDrinksCount === 1 ? "incluida" : "incluidas"}) en la pestaña <strong className="font-black">Bebidas</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("bebidas")}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] shrink-0 transition cursor-pointer"
                    >
                      Ir a Bebidas
                    </button>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <p>
                    Si necesitas retirar o ajustar algún ingrediente puntual (ej. <em>“sin cebolla”</em> o <em>“salsas aparte”</em>), indícalo en <strong>Instrucciones o Notas Especiales</strong> abajo o agrega complementos en <strong>Adiciones</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* ─── TAB 2: ADICIONES GOURMET (TOPPINGS & EXTRAS) ─── */}
            {!isDrink && activeTab === "adiciones" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      Toppings y Extras Gourmet
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Agrega ingredientes premium para enriquecer tu comida:
                    </p>
                  </div>
                  <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {filteredAdiciones.length} opciones
                  </span>
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto overflow-x-hidden pr-1">
                  {filteredAdiciones.map((ad) => {
                    const adId = ad.idAdicion || ad.id;
                    const selectedObj = selectedAdditions.find((a) => (a.idAdicion || a.id) === adId);
                    const isSelected = Boolean(selectedObj);
                    const itemQty = selectedObj?.cantidad || 1;
                    const adImg = getOptimizedImageUrl(getAdicionDisplayImage(ad), 120);

                    return (
                      <div
                        key={adId}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 transition-all ${
                          isSelected
                            ? "border-[#f05454] bg-red-50/60 dark:bg-red-950/30 shadow-xs ring-2 ring-red-400/30"
                            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-750"
                        }`}
                      >
                        {/* Avatar / Photo + Info */}
                        <div
                          onClick={() => toggleAddition(ad)}
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                        >
                          <img
                            src={adImg}
                            alt={ad.nombre}
                            className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs border border-gray-100 dark:border-gray-700"
                          />
                          <div className="min-w-0">
                            <p className="text-gray-900 dark:text-gray-100 font-black text-xs sm:text-sm truncate">
                              {ad.nombre}
                            </p>
                            <p className="text-[#f05454] dark:text-red-400 font-black text-xs mt-0.5">
                              +${Number(ad.precio).toLocaleString("es-CO")}
                            </p>
                          </div>
                        </div>

                        {/* Stepper or Add Button */}
                        {isSelected ? (
                          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-red-200 dark:border-red-900/60 shadow-xs shrink-0">
                            <button
                              type="button"
                              onClick={(e) => changeAdditionQty(adId, -1, e)}
                              className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                              title="Restar cantidad"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className="font-black text-gray-900 dark:text-gray-100 min-w-5 text-center text-xs">
                              {itemQty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => changeAdditionQty(adId, 1, e)}
                              className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                              title="Sumar cantidad"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleAddition(ad)}
                            className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-[#f05454] hover:text-white text-gray-700 dark:text-gray-200 text-xs font-black transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── TAB 3: BEBIDAS & ACOMPAÑANTES ─── */}
            {!isDrink && activeTab === "bebidas" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <FoodIcon name="drink" size={18} className="shrink-0" />
                      <span>{isComboWithDrinks ? "Bebidas Incluidas en tu Combo" : "Bebidas Frías & Acompañamientos"}</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isComboWithDrinks
                        ? `Selecciona ${requiredDrinkCount} bebida${requiredDrinkCount > 1 ? 's' : ''} incluida${requiredDrinkCount > 1 ? 's' : ''} en tu combo sin costo extra:`
                        : "El maridaje ideal para disfrutar tu pedido al máximo:"}
                    </p>
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    isComboWithDrinks
                      ? (isComboDrinkComplete ? "bg-emerald-500 text-white" : "bg-blue-600 text-white animate-pulse")
                      : "text-gray-400 dark:text-gray-500"
                  }`}>
                    {isComboWithDrinks ? `${totalSelectedDrinkQty} de ${requiredDrinkCount} seleccionadas` : `${availableBebidas.length} opciones`}
                  </span>
                </div>

                {/* Banner de estado del combo */}
                {isComboWithDrinks && (
                  <div className={`p-3 rounded-2xl border flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 ${
                    isComboDrinkComplete
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-850 text-emerald-800 dark:text-emerald-200"
                      : "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-850 text-blue-800 dark:text-blue-200"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <FoodIconBadge name="drink" size="md" />
                      <div>
                        <p className="text-xs font-black">
                          {isComboDrinkComplete
                            ? "¡Bebidas del combo seleccionadas!"
                            : `Selecciona ${requiredDrinkCount} bebida${requiredDrinkCount > 1 ? 's' : ''} para tu combo`}
                        </p>
                        <p className="text-[11px] opacity-80">
                          {isComboDrinkComplete
                            ? "Las bebidas seleccionadas están incluidas en el precio base ($0 COP)."
                            : `Faltan ${Math.max(0, requiredDrinkCount - totalSelectedDrinkQty)} bebida(s) por elegir.`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-xl shrink-0 ${
                      isComboDrinkComplete ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                    }`}>
                      {totalSelectedDrinkQty} / {requiredDrinkCount}
                    </span>
                  </div>
                )}

                <div className="space-y-2 max-h-[340px] overflow-y-auto overflow-x-hidden pr-1">
                  {availableBebidas.map((drink) => {
                    const dId = drink.id || drink.idProducto;
                    const selectedObj = selectedDrinks.find((d) => (d.id || d.idProducto) === dId);
                    const isSelected = Boolean(selectedObj);
                    const itemQty = selectedObj?.cantidad || 1;
                    const dStock = Number(drink.stock !== undefined ? drink.stock : 0);

                    return (
                      <div
                        key={dId}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-xs ring-2 ring-blue-400/40"
                            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-750"
                        }`}
                      >
                        <div
                          onClick={() => dStock > 0 && toggleDrink(drink)}
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                        >
                          {(() => {
                            const imgUrl = getOptimizedImageUrl(resolveDrinkImage(drink), 120);
                            return imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={drink.nombre}
                                className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-2xs border border-gray-100 dark:border-gray-700"
                              />
                            ) : (
                              <FoodIconBadge name={drink.nombre || "drink"} size="md" />
                            );
                          })()}
                          <div className="min-w-0">
                            <p className="text-gray-900 dark:text-gray-100 font-black text-xs sm:text-sm truncate">
                              {drink.nombre}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isComboWithDrinks ? (
                                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-extrabold text-[10.5px]">
                                  {isSelected ? `Incluida ($0 COP)` : `Elegir ($0 COP)`}
                                </span>
                              ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-black text-xs">
                                  ${Number(drink.precio).toLocaleString("es-CO")}
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-bold ${
                                  dStock <= 5 ? "text-amber-600" : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {dStock > 0 ? `${dStock} disp.` : "Agotado"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2 py-1 rounded-xl border border-blue-200 dark:border-blue-800/60 shadow-xs shrink-0">
                            <button
                              type="button"
                              onClick={(e) => changeDrinkQty(dId, -1, e)}
                              className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                              title="Restar cantidad"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className="font-black text-gray-900 dark:text-gray-100 min-w-5 text-center text-xs">
                              {itemQty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => changeDrinkQty(dId, 1, e)}
                              className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                              title="Sumar cantidad"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={dStock <= 0}
                            onClick={() => toggleDrink(drink)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 active:scale-95 shrink-0 ${
                              dStock > 0
                                ? "bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}



            {/* ─── TAB 5: RESEÑAS Y OPINIONES DE COMENSALES (ESPACIO DEDICADO) ─── */}
            {activeTab === "resenas" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      Opiniones de Clientes & Comensales
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isReadOnlyReviews
                        ? "Reseñas verificadas de comensales registradas en la web (Modo Consulta POS):"
                        : "Experiencias reales de quienes han degustado este plato:"}
                    </p>
                  </div>
                  {isReadOnlyReviews ? (
                    <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/70 dark:border-blue-800/60 shadow-2xs flex items-center gap-1.5 shrink-0">
                      <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Solo Lectura Web</span>
                    </div>
                  ) : isAuthenticated && user ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewFeedback(null);
                          setReviewCommentTouched(false);
                          if (myReview) {
                            setNewRating(myReview.puntuacion);
                            setNewComment(myReview.comentario || "");
                          }
                          setShowWriteReview((prev) => !prev);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 shrink-0"
                      >
                        {myReview ? <Pencil className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        <span>{showWriteReview ? "Cerrar" : myReview ? "Editar mi reseña" : "Calificar / Opinar"}</span>
                      </button>
                      {myReview && (
                        <button
                          type="button"
                          onClick={handleDeleteReview}
                          disabled={deletingReview}
                          title="Eliminar mi reseña"
                          className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Score Summary Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-white dark:from-amber-950/30 dark:via-gray-850 dark:to-gray-900 border border-amber-200/80 dark:border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-amber-500 text-white shadow-md shrink-0">
                      {effectiveReviewsTotal > 0 ? (
                        <>
                          <span className="text-2xl font-black leading-none">{effectiveRating.toFixed(1)}</span>
                          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">de 5</span>
                        </>
                      ) : (
                        <>
                          <Star className="w-6 h-6 fill-white text-white" />
                          <span className="text-[9px] font-black tracking-wider uppercase mt-0.5">Nuevo</span>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              effectiveReviewsTotal > 0 && s <= Math.round(effectiveRating) ? "fill-amber-500" : "opacity-25"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-black text-gray-800 dark:text-gray-200 mt-1">
                        {effectiveReviewsTotal > 0
                          ? `Basado en ${effectiveReviewsTotal} ${effectiveReviewsTotal === 1 ? "opinión verificada" : "opiniones verificadas"}`
                          : "Sin opiniones registradas aún"}
                      </p>
                      {effectiveReviewsTotal > 0 ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                          <ThumbsUp className="w-3 h-3" />
                          {Math.round(
                            (reviewsData.resenas.filter((r) => (r.puntuacion || 5) >= 4).length / (reviewsData.resenas.length || 1)) * 100
                          )}% de comensales recomiendan este plato
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                          {isReadOnlyReviews
                            ? "No hay reseñas de clientes en la web todavía."
                            : "Tu opinión ayudará a otros comensales a elegir"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/40 px-3 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Opiniones 100% Verificadas</span>
                  </div>
                </div>

                {/* Feedback persistente fuera del formulario */}
                {!showWriteReview && reviewFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      reviewFeedback.type === "success"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300"
                        : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-300"
                    }`}
                  >
                    {reviewFeedback.type === "success" ? (
                      <Check className="w-4 h-4 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 shrink-0" />
                    )}
                    <span>{reviewFeedback.message}</span>
                  </div>
                )}

                {/* ═══ FORMULARIO INTERACTIVO PARA CREAR / EDITAR RESEÑA (SOLO CLIENTES AUTENTICADOS) ═══ */}
                {!isReadOnlyReviews && isAuthenticated && user && showWriteReview && (
                  <form
                    onSubmit={handleSubmitReview}
                    className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-800/80 space-y-3.5 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-amber-200/60 dark:border-amber-800/40 pb-2">
                      <span className="text-xs font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <ChefHat className="w-4 h-4 text-amber-500" />
                        {myReview ? "Editar tu Calificación" : "Deja tu Calificación Gastronómica"}
                      </span>
                      <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400">
                        {newRating === 5 && "¡Excepcional! Lo amé"}
                        {newRating === 4 && "Muy bueno y sabroso"}
                        {newRating === 3 && "Bueno / Aceptable"}
                        {newRating === 2 && "Regular"}
                        {newRating === 1 && "No me gustó"}
                      </span>
                    </div>

                    {/* Interactive Star Picker */}
                    <div>
                      <span className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                        Puntuación general (haz clic para calificar):
                      </span>
                      <div className="flex items-center gap-2 py-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setNewRating(s)}
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95"
                            title={`Calificar con ${s} estrellas`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                s <= (hoverRating || newRating)
                                  ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment Textarea */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                        ¿Qué tal estuvo la cocción, temperatura y salsas? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={newComment}
                        onBlur={() => setReviewCommentTouched(true)}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Cuéntale a otros comensales qué fue lo que más disfrutaste de este plato..."
                        className={`w-full text-xs p-3 rounded-xl border transition-colors outline-none resize-none ${
                          reviewCommentTouched && (!newComment.trim() || newComment.trim().length < 5)
                            ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 focus:ring-2 focus:ring-red-400"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-amber-400"
                        }`}
                      />
                      {reviewCommentTouched && (!newComment.trim() || newComment.trim().length < 5) && (
                        <p className="flex items-center gap-1 text-[11px] text-red-600 mt-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                          <span>El comentario debe tener al menos 5 caracteres.</span>
                        </p>
                      )}
                    </div>

                    {reviewFeedback && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                          reviewFeedback.type === "success"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300"
                            : "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-300"
                        }`}
                      >
                        {reviewFeedback.type === "success" ? (
                          <Check className="w-4 h-4 shrink-0" />
                        ) : (
                          <Info className="w-4 h-4 shrink-0" />
                        )}
                        <span>{reviewFeedback.message}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowWriteReview(false);
                          setReviewCommentTouched(false);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {submittingReview ? (
                          <span>Guardando...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{myReview ? "Guardar Cambios" : "Publicar Reseña"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de Reseñas Reales */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1">
                  {loadingReviews ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      Cargando opiniones de clientes...
                    </div>
                  ) : reviewsData.resenas.length > 0 ? (
                    reviewsData.resenas.map((r, i) => {
                      const authorName =
                        r.nombre ||
                        (r.usuario ? `${r.usuario.nombre || ""} ${r.usuario.apellidos || ""}`.trim() : "") ||
                        "Cliente registrado";
                      const initials =
                        authorName
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase() || "CL";
                      const isOwn = Boolean(
                        user &&
                          (Number(r.idUsuario) === Number(user.idUsuario || user.id) ||
                            (myReview && Number(r.id || r.idResena) === Number(myReview.id)))
                      );

                      return (
                        <div
                          key={r.id || r.idResena || i}
                          className={`p-3 rounded-2xl border space-y-1.5 ${
                            isOwn
                              ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                              : "bg-gray-50 dark:bg-gray-800/70 border-gray-150 dark:border-gray-750"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#f05454] to-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
                                {initials}
                              </div>
                              <span className="text-xs font-black text-gray-900 dark:text-gray-100 truncate">
                                {authorName}
                              </span>
                              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5 shrink-0">
                                <Check className="w-2.5 h-2.5" /> Compra verificada
                              </span>
                              {isOwn && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 shrink-0">
                                  Tu reseña
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatFechaRelativa(r.fecha || r.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-amber-500 pl-9">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= (r.puntuacion || 5) ? "fill-amber-500" : "opacity-25"}`}
                              />
                            ))}
                          </div>

                          {r.comentario && (
                            <p className="text-xs text-gray-700 dark:text-gray-300 pl-9 leading-relaxed font-medium">
                              &ldquo;{r.comentario}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 px-4 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                      </div>
                      <p className="text-xs font-black text-gray-800 dark:text-gray-200">
                        Aún no hay opiniones registradas para este plato
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                        {isAuthenticated && user && !isReadOnlyReviews
                          ? "¡Sé el primero en compartir tu experiencia gastronómica y calificar este plato!"
                          : "Las opiniones de clientes que hayan comprado este plato aparecerán aquí."}
                      </p>
                      {!isReadOnlyReviews && isAuthenticated && user && (
                        <button
                          type="button"
                          onClick={() => setShowWriteReview(true)}
                          className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-white text-white" />
                          <span>Escribir Primera Reseña</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ 4. NOTAS ESPECIALES PARA COCINA (GLOBAL) ═══ */}
            <div className="pt-2 border-t border-gray-150 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                  Instrucciones o Notas Especiales
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Opcional
                </span>
              </div>

              {/* Quick Tags Chips */}
              <div className="flex flex-wrap gap-1.5">
                {(isDrink ? QUICK_DRINK_TAGS : QUICK_KITCHEN_TAGS).map((tag) => {
                  const active = customObservation.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleQuickTag(tag)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none active:scale-95 ${
                        active
                          ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                          : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200/70"
                      }`}
                    >
                      {active ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <div>
                <input
                  type="text"
                  maxLength={200}
                  placeholder={isDrink ? "Ej: Vaso con hielo adicional, sin pitillo..." : "Ej: Carne 3/4, servilletas extras, salsas en pote aparte..."}
                  value={customObservation}
                  onChange={(e) => setCustomObservation(e.target.value)}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none transition ${
                    customObservation.length > 180
                      ? "border-amber-400 focus:border-amber-500"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:border-[#f05454]"
                  }`}
                />
                {customObservation.length > 0 && (
                  <div className="flex justify-end mt-1">
                    <span className={`text-[10px] ${customObservation.length > 180 ? "text-amber-500 font-bold" : "text-gray-400"}`}>
                      {customObservation.length}/200 caracteres
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 5. STICKY ACTION BAR & TOTALIZER FOOTER ═══ */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 z-30">
          {/* Left: Product Quantity Stepper */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 flex items-center justify-center font-black hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-35 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Restar cantidad del producto"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>
              <span className="w-8 text-center text-sm font-black text-gray-900 dark:text-gray-100">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(stockMax, q + 1))}
                disabled={quantity >= stockMax}
                className="w-8 h-8 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 flex items-center justify-center font-black hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-35 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Aumentar cantidad del producto"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Breakdown summary on small screens */}
            <div className="sm:hidden text-right">
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">
                Total a pagar
              </span>
              <span className="text-lg font-black text-[#f05454] dark:text-red-400">
                ${grandTotal.toLocaleString("es-CO")}
              </span>
            </div>
          </div>

          {/* Center: Detailed Breakdown on Desktop */}
          <div className="hidden sm:flex flex-col text-right">
            {drinkHasSizes ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 justify-end">
                <span className="text-[#f05454] dark:text-red-400 font-black">
                  {isDrink ? displayDrinkTitle : `${producto.nombre.replace(/\s*400\s*ml/gi, "").trim()} • ${selectedSizeObj.label}`}
                </span>
              </div>
            ) : isDrink ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 justify-end">
                <span className="text-[#f05454] dark:text-red-400 font-black">
                  {displayDrinkTitle}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-gray-500 dark:text-gray-400 justify-end">
                <span>Base: ${basePrice.toLocaleString("es-CO")}</span>
                {additionsUnitPrice > 0 && <span>+ Extras: ${additionsUnitPrice.toLocaleString("es-CO")}</span>}
                {drinksTotal > 0 && <span>+ Bebidas: ${drinksTotal.toLocaleString("es-CO")}</span>}
              </div>
            )}
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total:</span>
              <span className="text-xl font-black text-[#f05454] dark:text-red-400 leading-none">
                ${grandTotal.toLocaleString("es-CO")}
              </span>
            </div>
          </div>

          {/* Right: Primary CTA Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] shrink-0 ${
              stockMax <= 0 || producto?.agotado
                ? "bg-gray-500 hover:bg-gray-600 dark:bg-gray-700"
                : "bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20"
            }`}
          >
            <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
            <span>
              {stockMax <= 0 || producto?.agotado
                ? "Agotado por el momento"
                : `${mode === "pos" ? "Agregar al Pedido" : "Agregar al Carrito"} • $${grandTotal.toLocaleString("es-CO")}`}
            </span>
          </button>
        </div>
      </div>
  );

  if (asPage) {
    return innerCard;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      {innerCard}
    </div>
  );
}

export default FastFoodProductModal;
