/**
 * Utilidades gastronómicas inteligentes para adiciones, toppings y bebidas en Chazin Food.
 * - Resuelve la unidad culinaria real de cada adición (porción, unidad, loncha, porción en tiras, copa de salsa, etc.).
 * - Calcula las porciones disponibles exactas y su descuento en vivo frente al carrito y la selección actual.
 * - Sanea imágenes de adiciones evitando URLs externas rotas.
 */

const BROKEN_IMAGE_SUBSTRINGS = [
  "photo-1472476443507-c7a5948772fc",
  "photo-1550547660-d9450f859349",
  "ensumesa.com",
  "img.magnific.com",
  "pasionthermomix.co"
];

const VERIFIED_ADICION_FALLBACKS = {
  tocineta: "https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=300&auto=format&fit=crop&q=80",
  queso_loncha: "https://res.cloudinary.com/dckwtknmq/image/upload/v1788966113/ugcycexl6ja8xriso4ni.webp",
  papa: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&auto=format&fit=crop&q=80",
  cebolla: "https://res.cloudinary.com/dckwtknmq/image/upload/v1788959741/dsogrxmfoohur2tscbgq.jpg",
  jalapeno: "https://res.cloudinary.com/dckwtknmq/image/upload/v1788959869/sejgbjeuranc6quitnug.jpg"
};

function normalizeStr(raw) {
  return String(raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function resolveValidAdicionImage(ad) {
  if (!ad) return "";
  const candidate =
    (typeof ad.imagen === "string" && (ad.imagen.startsWith("http") || ad.imagen.startsWith("/")) ? ad.imagen.trim() : "") ||
    (typeof ad.foto === "string" && (ad.foto.startsWith("http") || ad.foto.startsWith("/")) ? ad.foto.trim() : "");

  if (candidate && !BROKEN_IMAGE_SUBSTRINGS.some((bad) => candidate.includes(bad))) {
    return candidate;
  }

  const name = normalizeStr(ad.nombre);
  if (name.includes("tocineta") || name.includes("bacon")) return VERIFIED_ADICION_FALLBACKS.tocineta;
  if ((name.includes("queso") || name.includes("cheddar")) && !name.includes("salsa")) return VERIFIED_ADICION_FALLBACKS.queso_loncha;
  if (name.includes("papa") || name.includes("francesa")) return VERIFIED_ADICION_FALLBACKS.papa;
  if (name.includes("cebolla")) return VERIFIED_ADICION_FALLBACKS.cebolla;
  if (name.includes("jalapeno")) return VERIFIED_ADICION_FALLBACKS.jalapeno;

  // Para salsas, embutidos u otros sin foto verificada, retornar "" para que AdicionAvatar dibuje un FoodIcon nítido
  return "";
}

function parsePaqueteSize(tamanioPaquete) {
  if (!tamanioPaquete) return 1;
  const str = String(tamanioPaquete).trim();
  const matchX = str.match(/^\d+\s*[xX×]\s*(\d+(?:[.,]\d+)?)$/);
  if (matchX) {
    const val = parseFloat(matchX[1].replace(",", "."));
    return val > 0 ? val : 1;
  }
  const matchNum = str.match(/(\d+(?:[.,]\d+)?)/);
  if (matchNum) {
    const val = parseFloat(matchNum[1].replace(",", "."));
    return val > 0 ? val : 1;
  }
  return 1;
}

function convertUnitsLocal(amount, fromUnit, toUnit, adObj = null) {
  if (!amount || Number.isNaN(Number(amount))) return 0;
  if (!fromUnit || !toUnit) return Number(amount);

  const from = normalizeStr(fromUnit);
  const to = normalizeStr(toUnit);
  if (from === to) return Number(amount);

  const isKg = (u) => u.includes("kg") || u.includes("kilo");
  const isGr = (u) => u.includes("gr") || u.includes("gram");
  const isMg = (u) => u.includes("mg") || u.includes("miligram");
  const isLb = (u) => u === "lb" || u.includes("libra") || u.includes("(lb)");
  const isLt = (u) => u.includes("lt") || u.includes("litro");
  const isMl = (u) => u.includes("ml") || u.includes("mililitro") || u.includes("cc");
  const isPaq = (u) => u.includes("paq");
  const isUnd = (u) => u.includes("und") || u === "ud" || u.includes("unidad") || u.includes("porc");

  if (isPaq(to) && isUnd(from)) {
    return Number(amount) / parsePaqueteSize(adObj?.tamanioPaquete);
  }

  const weightToGr = (u) => {
    if (isKg(u)) return 1000;
    if (isGr(u)) return 1;
    if (isMg(u)) return 0.001;
    if (isLb(u)) return 453.592;
    return null;
  };
  const fromW = weightToGr(from);
  const toW = weightToGr(to);
  if (fromW && toW) return (Number(amount) * fromW) / toW;

  if (isLt(from) && isMl(to)) return Number(amount) * 1000;
  if (isMl(from) && isLt(to)) return Number(amount) / 1000;

  return Number(amount);
}

/**
 * Calcula las porciones enteras máximas disponibles en inventario para una adición,
 * respetando exactamente la lógica de descuento de `ventaService.js`.
 */
export function resolveAdicionMaxPortions(ad) {
  if (!ad) return 0;
  if (ad.agotado || ad.estado === 0 || ad.estado === "Inactivo" || ad.estado === false) return 0;

  const noControl =
    ad.controlarStock === false ||
    String(ad.descripcion || "").includes("[SIN_CONTROL_STOCK]");
  if (noControl) return 99;

  if (ad.stockEnPorciones === true && ad.stock !== undefined && ad.stock !== null) {
    return Math.max(0, Math.floor(Number(ad.stock) || 0));
  }

  const rawStock = Number(
    ad.stockInsumo !== undefined
      ? ad.stockInsumo
      : ad.stock !== undefined
        ? ad.stock
        : ad.stockActual !== undefined
          ? ad.stockActual
          : 0
  );
  if (!(rawStock > 0)) return 0;

  const insumoUnit = ad.unidadMedida || "und";
  const porcionCant = Number(ad.porcionMinimaCantidad || 0);
  const porcionUnit = ad.porcionMinimaUnidad || insumoUnit;

  let cantPorAdicion = 1;
  if (porcionCant > 0) {
    cantPorAdicion = convertUnitsLocal(porcionCant, porcionUnit, insumoUnit, ad);
  }
  if (!(cantPorAdicion > 0)) cantPorAdicion = 1;

  return Math.max(0, Math.floor((rawStock + 1e-6) / cantPorAdicion));
}

/**
 * Cuenta cuántas porciones de una adición ya están comprometidas en el carrito.
 */
export function getAdicionQuantityInCart(cart = [], adId, excludeCartItemId = null) {
  if (!Array.isArray(cart) || !adId) return 0;
  const targetId = Number(adId);
  return cart.reduce((total, item) => {
    if (!item || (excludeCartItemId && item.cartItemId === excludeCartItemId)) return total;
    const itemMult = Math.max(1, Number(item.cantidad || 1));
    const adds = Array.isArray(item.adiciones) ? item.adiciones : [];
    const inThisItem = adds.reduce((sub, a) => {
      return Number(a?.idAdicion || a?.id) === targetId
        ? sub + Math.max(1, Number(a?.cantidad || 1))
        : sub;
    }, 0);
    return total + inThisItem * itemMult;
  }, 0);
}

/**
 * Resuelve el límite máximo gastronómico permitido por plato para una adición individual
 * (funciona tanto para las adiciones actuales como para cualquier adición futura creada en administración).
 */
export function resolveAdicionCulinaryLimit(ad, producto = null) {
  const explicit = Number(ad?.maxPorPlato ?? ad?.maximoPorPlato ?? ad?.limitePorPlato ?? 0);
  if (Number.isFinite(explicit) && explicit >= 1 && explicit <= 10) {
    return Math.floor(explicit);
  }

  const prodName = normalizeStr(
    `${producto?.nombre || ""} ${producto?.categoriaNombre || ""} ${producto?.categoria?.nombre || producto?.categoria || ""}`
  );
  const isSharedDish =
    Boolean(producto?.esCombo || producto?.configuracionCombo?.esCombo) ||
    /\b(combo|pareja|familiar|compartir)\b/.test(prodName);
  const sharedBonus = isSharedDish ? 1 : 0;

  const name = normalizeStr(ad?.nombre);
  const desc = normalizeStr(ad?.descripcion);
  const isLiquidSauce =
    /\b(salsa|mostaza|mayonesa|mayo|suero|guacamole|tartara|bbq|barbecue|heinz|rosada|aderezo|chimichurri|vinagreta|miel|chipotle|ajo|showy)\b/.test(
      name
    ) ||
    (name.includes("queso") && name.includes("fundido")) ||
    desc.includes("salsa");

  // 1. Quesos en loncha/tajada/rallado y tocineta/jamón: hasta 4 por plato individual (5 en combos)
  if (
    !isLiquidSauce &&
    /\b(loncha|tajada|queso|cheddar|mozzarella|parmesano|provolone|sabana|suizo|tocineta|bacon|tocino|jamon)\b/.test(
      name
    )
  ) {
    return 4 + sharedBonus;
  }

  // 2. Proteínas enteras, carnes, aves, embutidos (salchicha, chorizo, carne, pollo, huevo),
  //    acompañamientos, salsas, vegetales y cualquier nueva adición futura creada en el catálogo:
  //    máximo 3 por plato individual (4 en combos para compartir).
  return 3 + sharedBonus;
}

/**
 * Tope máximo combinado de porciones extra (suma de todas las adiciones) en un mismo plato,
 * evitando combinaciones desproporcionadas que impidan empacar o preparar el producto.
 */
export function resolveDishTotalAdicionesCap(producto = null) {
  const prodName = normalizeStr(
    `${producto?.nombre || ""} ${producto?.categoriaNombre || ""} ${producto?.categoria?.nombre || producto?.categoria || ""}`
  );
  const isSharedDish =
    Boolean(producto?.esCombo || producto?.configuracionCombo?.esCombo) ||
    /\b(combo|pareja|familiar|compartir)\b/.test(prodName);
  return isSharedDish ? 12 : 8;
}

/**
 * Calcula el máximo efectivo seleccionable para una adición en un plato combinando:
 * 1) Disponibilidad real de inventario (`stockMaxPerDish`),
 * 2) Límite gastronómico individual de esa adición (`culinaryMax`), y
 * 3) Cupo restante de adiciones totales del plato (`remainingDishSlots`).
 */
export function computeEffectiveAdicionMaxPerDish({
  adicion,
  producto = null,
  stockMaxPerDish = 99,
  currentAdditions = []
}) {
  const culinaryMax = resolveAdicionCulinaryLimit(adicion, producto);
  const dishTotalCap = resolveDishTotalAdicionesCap(producto);
  const adId = Number(adicion?.idAdicion || adicion?.id || adicion?.idInsumo || 0);

  const otherAdditionsSum = (Array.isArray(currentAdditions) ? currentAdditions : []).reduce(
    (sum, item) => {
      const itemId = Number(item?.idAdicion || item?.id || 0);
      if (adId && itemId === adId) return sum;
      return sum + Math.max(1, Math.floor(Number(item?.cantidad) || 1));
    },
    0
  );

  const remainingDishSlots = Math.max(0, dishTotalCap - otherAdditionsSum);
  const cleanStockMax = Math.max(0, Math.floor(Number(stockMaxPerDish ?? 99)));
  const maxPerDish = Math.max(0, Math.min(cleanStockMax, culinaryMax, remainingDishSlots));

  let limitReason = "culinary";
  if (cleanStockMax <= 0 || (cleanStockMax < culinaryMax && cleanStockMax <= remainingDishSlots)) {
    limitReason = "stock";
  } else if (remainingDishSlots < culinaryMax && remainingDishSlots <= cleanStockMax) {
    limitReason = "dish_total";
  }

  return {
    maxPerDish,
    culinaryMax,
    dishTotalCap,
    remainingDishSlots,
    otherAdditionsSum,
    limitReason
  };
}

/**
 * Sanea una lista de adiciones de un plato garantizando que ninguna supere su límite
 * gastronómico individual ni el tope combinado de adiciones por plato.
 */
export function sanitizeDishAdicionesList(adiciones = [], producto = null) {
  if (!Array.isArray(adiciones) || adiciones.length === 0) return [];
  const dishCap = resolveDishTotalAdicionesCap(producto);
  let remaining = dishCap;
  const result = [];

  for (const rawAd of adiciones) {
    if (!rawAd || remaining <= 0) continue;
    const rawQty = Math.floor(Number(rawAd.cantidad) || 0);
    if (rawQty <= 0) continue;
    const perAdMax = resolveAdicionCulinaryLimit(rawAd, producto);
    const clampedQty = Math.min(rawQty, perAdMax, remaining);
    if (clampedQty <= 0) continue;
    remaining -= clampedQty;
    result.push({
      ...rawAd,
      cantidad: clampedQty
    });
  }

  return result;
}

/**
 * Resuelve de forma inteligente y humana la unidad gastronómica que corresponde a cada adición
 * del catálogo de Chazin Food (y de nuevas adiciones creadas en administración).
 */
export function resolveAdicionUnitMeta(ad, qty = 1, producto = null) {
  const maxPorPlato = resolveAdicionCulinaryLimit(ad, producto);
  const safeQty = Math.max(1, Math.floor(Number(qty) || 1));
  const name = normalizeStr(ad?.nombre);
  const desc = normalizeStr(ad?.descripcion);
  const dbUnit = normalizeStr(ad?.unidadMedida);
  const porcionCant = Number(ad?.porcionMinimaCantidad || 0);
  const porcionUnit = normalizeStr(ad?.porcionMinimaUnidad);

  // Detectar si el administrador configuró un gramaje/volumen explícito (ej. 50 gr, 30 ml)
  const hasExplicitMeasure =
    porcionCant > 0 &&
    (porcionUnit === "gr" || porcionUnit === "g" || porcionUnit === "ml" || porcionUnit === "lt" || porcionUnit === "kg") &&
    !(porcionCant === 1 && porcionUnit === "und");

  const measureSuffix = hasExplicitMeasure
    ? ` (${porcionCant}${porcionUnit === "gr" ? "g" : porcionUnit})`
    : "";

  // 1. Salsas, dips, cremas, guacamole, suero costeño y queso fundido líquido
  if (
    /\b(salsa|mostaza|mayonesa|mayo|suero|guacamole|tartara|bbq|barbecue|heinz|rosada|aderezo|chimichurri|vinagreta|miel|chipotle|ajo|showy)\b/.test(
      name
    ) ||
    (name.includes("queso") && name.includes("fundido")) ||
    desc.includes("salsa")
  ) {
    const detail = measureSuffix || " · copa";
    return {
      kind: "copa_porcion",
      badge: `Porción${detail}`,
      shortUnit: "porción",
      singular: "porción (copa)",
      plural: "porciones (copa)",
      formattedQty: safeQty === 1 ? "1 porción" : `${safeQty} porciones`,
      maxPorPlato
    };
  }

  // 2. Queso en lonchas / tajadas
  if (
    name.includes("loncha") ||
    name.includes("tajada") ||
    ((name.includes("queso") || name.includes("cheddar") || name.includes("mozzarella")) &&
      !name.includes("rallado") &&
      !name.includes("gratinado") &&
      (dbUnit === "und" || dbUnit.includes("unidad")))
  ) {
    return {
      kind: "loncha",
      badge: "1 loncha",
      shortUnit: "loncha",
      singular: "loncha",
      plural: "lonchas",
      formattedQty: safeQty === 1 ? "1 loncha" : `${safeQty} lonchas`,
      maxPorPlato
    };
  }

  // 3. Tocineta / Bacon en tiras
  if (name.includes("tocineta") || name.includes("bacon") || name.includes("tocino")) {
    return {
      kind: "porcion_tiras",
      badge: `Porción · tiras${measureSuffix}`,
      shortUnit: "porción",
      singular: "porción en tiras",
      plural: "porciones en tiras",
      formattedQty: safeQty === 1 ? "1 porción" : `${safeQty} porciones`,
      maxPorPlato
    };
  }

  // 4. Embutidos, proteínas unitarias, huevos o panes (Salchicha Suiza, Chorizo, Carne extra, Huevo)
  if (
    /\b(salchicha|chorizo|butifarra|morcilla|huevo|medallon|croqueta|nugget|alita|arepa|pan)\b/.test(name) ||
    ((name.includes("carne") || name.includes("pollo")) && (dbUnit === "und" || dbUnit.includes("unidad")))
  ) {
    return {
      kind: "unidad",
      badge: `1 unidad${measureSuffix}`,
      shortUnit: "unidad",
      singular: "unidad",
      plural: "unidades",
      formattedQty: safeQty === 1 ? "1 unidad" : `${safeQty} unidades`,
      maxPorPlato
    };
  }

  // 5. Papas a la francesa, cascos, espirales, aros de cebolla, ripio y acompañamientos
  if (/\b(papa|papas|francesa|casco|rustica|espiral|aros|ripio|yuca|patacon)\b/.test(name)) {
    const papaMeasure = measureSuffix || (name.includes("francesa") ? " · 150g" : "");
    return {
      kind: "porcion_acompanamiento",
      badge: `Porción${papaMeasure}`,
      shortUnit: "porción",
      singular: "porción",
      plural: "porciones",
      formattedQty: safeQty === 1 ? "1 porción" : `${safeQty} porciones`,
      maxPorPlato
    };
  }

  // 6. Vegetales, encurtidos, rodajas y quesos rallados (Cebolla, Jalapeños en Rodajas, Maíz, Pepinillos, Queso Rallado)
  if (name.includes("rodaja")) {
    return {
      kind: "porcion_rodajas",
      badge: `Porción · rodajas${measureSuffix}`,
      shortUnit: "porción",
      singular: "porción",
      plural: "porciones",
      formattedQty: safeQty === 1 ? "1 porción" : `${safeQty} porciones`,
      maxPorPlato
    };
  }

  if (
    /\b(jalapeno|cebolla|pepinillo|champinon|maiz|tomate|lechuga|aguacate|queso|mozzarella|costeno|parmesano)\b/.test(
      name
    )
  ) {
    return {
      kind: "porcion",
      badge: `1 porción${measureSuffix}`,
      shortUnit: "porción",
      singular: "porción",
      plural: "porciones",
      formattedQty: safeQty === 1 ? "1 porción" : `${safeQty} porciones`,
      maxPorPlato
    };
  }

  // 7. Respaldo inteligente según la unidad base configurada en BD
  if (dbUnit === "und" || dbUnit.includes("unidad")) {
    return {
      kind: "unidad",
      badge: `1 unidad${measureSuffix}`,
      shortUnit: "unidad",
      singular: "unidad",
      plural: "unidades",
      formattedQty: safeQty === 1 ? "1 unidad" : `${safeQty} unidades`,
      maxPorPlato
    };
  }

  return {
    kind: "porcion",
    badge: `1 porción${measureSuffix}`,
    shortUnit: "porción",
    singular: "porción",
    plural: "porciones",
    formattedQty: safeQty === 1 ? "1 porción" : `${safeQty} porciones`,
    maxPorPlato
  };
}

/**
 * Resuelve la etiqueta de unidad/envase para bebidas acompañantes.
 */
export function resolveDrinkUnitBadge(drink) {
  const n = normalizeStr(drink?.nombre);
  const matchVol = String(drink?.nombre || "").match(/(\d+(?:[.,]\d+)?\s*(?:ml|l|lt|oz))/i);
  if (matchVol) {
    const cleanVol = matchVol[1].replace(/\s+/g, " ").trim();
    return `Botella · ${cleanVol}`;
  }
  if (n.includes("agua") || n.includes("cristal")) return "Botella · 600 ml";
  return "Botella · 400 ml";
}
