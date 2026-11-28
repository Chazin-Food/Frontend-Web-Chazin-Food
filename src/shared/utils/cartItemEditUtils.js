import { isEssentialIngredient } from "@/shared/utils/ingredientUtils";
import { isVariantActive } from "@/shared/utils/productVariantUtils";
import { isEventActiveInColombia } from "@/shared/utils/dateUtils";

/**
 * Utilidades ligeras (0 dependencias pesadas) para editar bebidas (tamaño y sabor)
 * y platos (variantes, ingredientes removibles, notas y cambio de plato)
 * directamente dentro de `CartDrawer` sin abrir ningún modal externo.
 */

export const OFFICIAL_CART_DRINK_IMAGES = {
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

export const CART_DRINK_SIZES = [
  {
    id: "400ml",
    shortLabel: "400 ml",
    label: "400 ml",
    tag: "Personal",
    defaultPostobonPrice: 4000,
    defaultPremiumPrice: 4500
  },
  {
    id: "1.5L",
    shortLabel: "1.5 L",
    label: "1.5 Litros",
    tag: "Familiar",
    defaultPostobonPrice: 8500,
    defaultPremiumPrice: 9500
  },
  {
    id: "2.5L",
    shortLabel: "2.5 L",
    label: "2.5 Litros",
    tag: "Mega",
    defaultPostobonPrice: 12000,
    defaultPremiumPrice: 13500
  }
];

const VARIANT_IDS_1_5L = new Set([59, 61, 63, 66, 74, 76, 79, 81, 83]);
const VARIANT_IDS_2_5L = new Set([60, 62, 64, 67, 75, 77, 80, 82, 84]);

export function detectDrinkFlavorProfile(item) {
  const name = `${item?.nombre || ""} ${item?.varianteNombre || ""} ${item?.sabor || ""}`
    .toLowerCase()
    .trim();
  const prodId = Number(item?.idProducto || item?.id || 0);
  const varId = Number(item?.idVariante || 0);

  const isExplicitRegular =
    name.includes("con az") || name.includes("original") || name.includes("regular");
  const isDiet = isExplicitRegular
    ? false
    : prodId === 16 ||
      [58, 79, 80, 65].includes(varId) ||
      name.includes("sin az") ||
      name.includes("light") ||
      name.includes("zero") ||
      name.includes("cero") ||
      name.includes("black");

  let flavor = "other";
  if (prodId === 10 || name.includes("agua") || name.includes("cristal")) flavor = "agua";
  else if (prodId === 38 || [81, 82].includes(varId) || name.includes("uva")) flavor = "uva";
  else if (prodId === 39 || [83, 84].includes(varId) || name.includes("naranja")) flavor = "naranja";
  else if (prodId === 12 || [66, 67].includes(varId) || name.includes("colombiana")) flavor = "colombiana";
  else if (prodId === 9 || [59, 60].includes(varId) || name.includes("manzana")) flavor = "manzana";
  else if (prodId === 13 || [74, 75].includes(varId) || name.includes("sprite")) flavor = "sprite";
  else if (
    prodId === 14 ||
    [76, 77].includes(varId) ||
    name.includes("quatro") ||
    name.includes("cuatro") ||
    name.includes("toronja")
  ) {
    flavor = "quatro";
  } else if (prodId === 8 || prodId === 16 || [8, 58, 61, 62, 79, 80].includes(varId) || name.includes("coca")) {
    flavor = "coca";
  } else if (prodId === 11 || [11, 63, 64, 65].includes(varId) || name.includes("pepsi")) {
    flavor = "pepsi";
  }

  const isPostobon =
    flavor === "manzana" ||
    flavor === "colombiana" ||
    flavor === "uva" ||
    flavor === "naranja" ||
    name.includes("postobon") ||
    name.includes("postobón");

  const isWater = flavor === "agua";
  const isOnly400ml = isWater || (flavor === "pepsi" && isDiet);

  let baseTitle = "";
  if (flavor === "coca") {
    baseTitle = isDiet ? "Coca-Cola Sin Azúcar / Light" : "Coca-Cola Original";
  } else if (flavor === "pepsi") {
    baseTitle = isDiet ? "Pepsi Light / Black" : "Pepsi Regular";
  } else if (flavor === "manzana") {
    baseTitle = "Gaseosa Manzana Postobón";
  } else if (flavor === "colombiana") {
    baseTitle = "Gaseosa Colombiana Postobón";
  } else if (flavor === "uva") {
    baseTitle = "Gaseosa Uva Postobón";
  } else if (flavor === "naranja") {
    baseTitle = "Gaseosa Naranja Postobón";
  } else if (flavor === "sprite") {
    baseTitle = "Gaseosa Sprite";
  } else if (flavor === "quatro") {
    baseTitle = "Gaseosa Quatro Toronja";
  } else if (flavor === "agua") {
    baseTitle = "Agua Cristal sin Gas";
  } else {
    baseTitle =
      String(item?.nombre || "Bebida")
        .replace(/\s*\((400\s*ml|1\.?5\s*litros?|2\.?5\s*litros?|personal|familiar|mega[^)]*)\)\s*/gi, "")
        .replace(/\s*(400\s*ml|1\.?5\s*litros?|2\.?5\s*litros?|1\.?5\s*l|2\.?5\s*l)\s*$/gi, "")
        .trim() || "Bebida";
  }

  return {
    flavor,
    isDiet,
    isPostobon,
    isWater,
    isOnly400ml,
    baseTitle
  };
}

export function detectCartDrinkSizeId(item) {
  if (!item) return "400ml";
  const varId = Number(item.idVariante || 0);
  if (VARIANT_IDS_2_5L.has(varId)) return "2.5L";
  if (VARIANT_IDS_1_5L.has(varId)) return "1.5L";

  const combined = `${item.nombre || ""} ${item.varianteNombre || ""} ${item.sabor || ""} ${(
    item.personalizaciones || []
  ).join(" ")} ${item.observaciones || ""}`.toLowerCase();

  if (combined.includes("2.5") || combined.includes("2,5") || combined.includes("mega")) {
    return "2.5L";
  }
  if (combined.includes("1.5") || combined.includes("1,5")) {
    return "1.5L";
  }
  return "400ml";
}

export function canChangeCartDrinkSize(item) {
  if (!item) return false;
  const profile = detectDrinkFlavorProfile(item);
  return !profile.isWater && !profile.isOnly400ml;
}

export function getCartDrinkBottleImage(sizeId, profile, fallbackImg = "") {
  const { flavor, isDiet } = profile;

  if (sizeId === "400ml") {
    if (flavor === "uva") return "/images/drinks/uva_postobon-removebg-preview.png";
    if (flavor === "naranja") return OFFICIAL_CART_DRINK_IMAGES.naranja;
    if (flavor === "colombiana") return OFFICIAL_CART_DRINK_IMAGES.colombiana;
    if (flavor === "manzana") return "/images/drinks/manzana_400ml-removebg-preview.png";
    if (flavor === "coca") {
      return isDiet ? OFFICIAL_CART_DRINK_IMAGES.coca_cola_light : OFFICIAL_CART_DRINK_IMAGES.coca_cola;
    }
    if (flavor === "pepsi") {
      return isDiet
        ? "/images/drinks/pepsi_light-removebg-preview.png"
        : "/images/drinks/pepsi_400ml-removebg-preview.png";
    }
    if (flavor === "sprite") return "/images/drinks/sprite-removebg-preview.png";
    if (flavor === "quatro") return OFFICIAL_CART_DRINK_IMAGES.quatro;
    if (flavor === "agua") return OFFICIAL_CART_DRINK_IMAGES.agua;
    return fallbackImg || OFFICIAL_CART_DRINK_IMAGES.coca_cola;
  }

  if (sizeId === "1.5L") {
    if (flavor === "uva") return "/images/drinks/bebida-uva-1500ml_00-600x600-removebg-preview.png";
    if (flavor === "naranja") return "/images/drinks/naranga_1.5-removebg-preview.png";
    if (flavor === "colombiana") return "/images/drinks/colombiana_1.5_L-removebg-preview.png";
    if (flavor === "manzana") return "/images/drinks/manzana_1.5_L-removebg-preview.png";
    if (flavor === "coca") {
      return isDiet
        ? "/images/drinks/coca_cola_zero_1.5L.jpg"
        : "/images/drinks/coca_cola_1.5-LITROS-removebg-preview.png";
    }
    if (flavor === "pepsi") return "/images/drinks/pepsi_1.5-removebg-preview.png";
    if (flavor === "sprite") return "/images/drinks/komx_mx_sprite_15.webp";
    if (flavor === "quatro") return "/images/drinks/gaseosa-quatro-15-lt-removebg-preview.png";
    return fallbackImg || "/images/drinks/manzana_1.5_L-removebg-preview.png";
  }

  if (sizeId === "2.5L") {
    if (flavor === "uva") return "/images/drinks/Uva_mega-removebg-preview.png";
    if (flavor === "naranja") return "/images/drinks/postob_n_naranja_2.5l_1_-removebg-preview.png";
    if (flavor === "colombiana") return "/images/drinks/colombiana_pet_2.5l-removebg-preview.png";
    if (flavor === "manzana") {
      return "/images/drinks/Manzana-Super-Gigante-25-Litros-223182_a-removebg-preview.png";
    }
    if (flavor === "coca") {
      return isDiet
        ? "/images/drinks/coca_cola_zero_2.5L.jpg"
        : "/images/drinks/mega_coca_cola-removebg-preview.png";
    }
    if (flavor === "pepsi") return "/images/drinks/mega_pepsi-removebg-preview.png";
    if (flavor === "sprite") return "/images/drinks/spr-limalimo-nor-pet-2.5l-removebg-preview.png";
    if (flavor === "quatro") return "/images/drinks/quatro_mega-removebg-preview.png";
    return fallbackImg || "/images/drinks/Manzana-Super-Gigante-25-Litros-223182_a-removebg-preview.png";
  }

  return fallbackImg || OFFICIAL_CART_DRINK_IMAGES.coca_cola;
}

function resolveDrinkDbMapping(profile, sizeId, fallbackProdId) {
  const { flavor, isDiet } = profile;
  let idProducto = Number(fallbackProdId || 0);
  let idVariante = idProducto;

  if (flavor === "coca") {
    if (isDiet) {
      idProducto = 16;
      idVariante = sizeId === "1.5L" ? 79 : sizeId === "2.5L" ? 80 : 58;
    } else {
      idProducto = 8;
      idVariante = sizeId === "1.5L" ? 61 : sizeId === "2.5L" ? 62 : 8;
    }
  } else if (flavor === "pepsi") {
    idProducto = 11;
    if (isDiet) {
      idVariante = 65;
    } else {
      idVariante = sizeId === "1.5L" ? 63 : sizeId === "2.5L" ? 64 : 11;
    }
  } else if (flavor === "manzana") {
    idProducto = 9;
    idVariante = sizeId === "1.5L" ? 59 : sizeId === "2.5L" ? 60 : 9;
  } else if (flavor === "colombiana") {
    idProducto = 12;
    idVariante = sizeId === "1.5L" ? 66 : sizeId === "2.5L" ? 67 : 12;
  } else if (flavor === "uva") {
    idProducto = 38;
    idVariante = sizeId === "1.5L" ? 81 : sizeId === "2.5L" ? 82 : 38;
  } else if (flavor === "naranja") {
    idProducto = 39;
    idVariante = sizeId === "1.5L" ? 83 : sizeId === "2.5L" ? 84 : 39;
  } else if (flavor === "sprite") {
    idProducto = 13;
    idVariante = sizeId === "1.5L" ? 74 : sizeId === "2.5L" ? 75 : 13;
  } else if (flavor === "quatro") {
    idProducto = 14;
    idVariante = sizeId === "1.5L" ? 76 : sizeId === "2.5L" ? 77 : 14;
  } else if (flavor === "agua") {
    idProducto = 10;
    idVariante = 10;
  }

  return { idProducto, idVariante };
}

export function getCartDrinkSizeOptions(item, catalogProductos = []) {
  const profile = detectDrinkFlavorProfile(item);
  if (profile.isWater || profile.isOnly400ml) return [];

  return CART_DRINK_SIZES.map((size) => {
    const fallbackProdId = item?.idProducto || item?.id;
    const mapped = resolveDrinkDbMapping(profile, size.id, fallbackProdId);
    const liveProd = (Array.isArray(catalogProductos) ? catalogProductos : []).find(
      (p) => String(p?.id || p?.idProducto) === String(mapped.idProducto)
    );

    const activeVariants = Array.isArray(liveProd?.variantes)
      ? liveProd.variantes.filter((v) => isVariantActive(v))
      : [];

    const matchedVar =
      activeVariants.find((v) => Number(v.idVariante || v.id) === Number(mapped.idVariante)) ||
      activeVariants.find((v) => {
        const vn = String(v.nombre || "").toLowerCase();
        if (size.id === "400ml") return vn.includes("400") || vn.includes("personal");
        if (size.id === "1.5L") return vn.includes("1.5") || vn.includes("1,5");
        if (size.id === "2.5L") return vn.includes("2.5") || vn.includes("2,5") || vn.includes("mega");
        return false;
      });

    const defaultPrice = profile.isPostobon ? size.defaultPostobonPrice : size.defaultPremiumPrice;
    let resolvedPrice = defaultPrice;

    if (matchedVar && Number(matchedVar.precio) > 0) {
      resolvedPrice = Number(matchedVar.precio);
    } else if (size.id === "400ml" && liveProd && Number(liveProd.precio) > 0 && Number(liveProd.precio) <= 7500) {
      resolvedPrice = Number(liveProd.precio);
    }

    const finalVarId = matchedVar?.idVariante || mapped.idVariante;
    const stock = Number(
      liveProd?.stock !== undefined
        ? liveProd.stock
        : liveProd?.stockActual !== undefined
          ? liveProd.stockActual
          : item?.stock ?? 99
    );
    const imagen =
      (typeof matchedVar?.imagen === "string" && matchedVar.imagen.trim()) ||
      getCartDrinkBottleImage(size.id, profile, liveProd?.imagen || item?.imagen);

    return {
      id: size.id,
      shortLabel: size.shortLabel,
      label: size.label,
      tag: size.tag,
      price: Math.round(resolvedPrice),
      idProducto: liveProd?.id || liveProd?.idProducto || mapped.idProducto,
      idVariante: finalVarId,
      stock,
      imagen,
      formattedName: `${profile.baseTitle} (${size.label})`
    };
  });
}

export function buildUpdatedDrinkCartItem(currentItem, targetSource, targetSizeId, catalogProductos = []) {
  const options = getCartDrinkSizeOptions(targetSource || currentItem, catalogProductos);
  const chosen = options.find((o) => o.id === targetSizeId) || options[0];

  if (!chosen) {
    // Caso bebida de tamaño único (ej. Agua Cristal o Pepsi Light 400ml)
    const profile = detectDrinkFlavorProfile(targetSource || currentItem);
    const prodId = targetSource?.id || targetSource?.idProducto || currentItem?.idProducto || currentItem?.id;
    const mapped = resolveDrinkDbMapping(profile, "400ml", prodId);
    const liveProd = (Array.isArray(catalogProductos) ? catalogProductos : []).find(
      (p) => String(p?.id || p?.idProducto) === String(mapped.idProducto)
    );
    const price = Number(liveProd?.precio || targetSource?.precio || currentItem?.precio || 4000);
    const stock = Number(liveProd?.stock ?? targetSource?.stock ?? currentItem?.stock ?? 99);
    const img = getCartDrinkBottleImage("400ml", profile, liveProd?.imagen || targetSource?.imagen);
    const formattedName = profile.isWater ? profile.baseTitle : `${profile.baseTitle} (400 ml)`;

    return {
      ...currentItem,
      id: mapped.idProducto,
      idProducto: mapped.idProducto,
      idVariante: mapped.idVariante,
      esVarianteBase: false,
      varianteNombre: null,
      sabor: null,
      nombre: formattedName,
      precio: Math.round(price),
      stock,
      imagen: img,
      esBebida: true,
      categoria: "Bebidas",
      adiciones: [],
      ingredientesRemovidos: [],
      personalizaciones: profile.isWater ? [] : ["Presentación: 400 ml"],
      observaciones: profile.isWater ? "" : "Presentación: 400 ml",
      observacion: profile.isWater ? "" : "Presentación: 400 ml"
    };
  }

  return {
    ...currentItem,
    id: chosen.idProducto,
    idProducto: chosen.idProducto,
    idVariante: chosen.idVariante,
    esVarianteBase: false,
    varianteNombre: null,
    varianteDescripcion: null,
    varianteEspecificaciones: null,
    varianteCambios: [],
    sabor: null,
    nombre: chosen.formattedName,
    precio: chosen.price,
    precioOriginal: undefined,
    stock: chosen.stock,
    imagen: chosen.imagen,
    esBebida: true,
    categoria: "Bebidas",
    adiciones: [],
    ingredientesRemovidos: [],
    personalizaciones: [`Presentación: ${chosen.label}`],
    observaciones: `Presentación: ${chosen.label}`,
    observacion: `Presentación: ${chosen.label}`
  };
}

/**
 * Calcula el precio efectivo de un plato o variante respetando eventos activos en Colombia.
 */
export function resolveCatalogDishPrice(prod, customVariantPrice = null) {
  if (!prod) return 0;
  const catalogBase = Number(prod.precio || 0);
  const rawBase = customVariantPrice !== null && Number(customVariantPrice) > 0
    ? Number(customVariantPrice)
    : catalogBase;

  const evts = Array.isArray(prod.eventos) ? prod.eventos.filter((e) => isEventActiveInColombia(e)) : [];
  if (evts.length === 0) return Math.round(rawBase);

  const isCustomVariant = customVariantPrice !== null && Math.abs(rawBase - catalogBase) > 0.01;
  const evtPrecio = evts.find(
    (e) =>
      (e.tipoEvento === "Promoción Precio" || e.tipo === "Promoción Precio") &&
      Number(e.nuevoPrecio) > 0
  );
  const evtDesc = evts.find((e) => Number(e.descuento) > 0 && Number(e.descuento) < 100);

  if (!isCustomVariant && evtPrecio) {
    return Math.round(Number(evtPrecio.nuevoPrecio));
  }
  if (evtDesc) {
    return Math.max(0, Math.round(rawBase * (1 - Number(evtDesc.descuento) / 100)));
  }
  if (isCustomVariant && evtPrecio && catalogBase > Number(evtPrecio.nuevoPrecio)) {
    return Math.max(0, Math.round(rawBase - (catalogBase - Number(evtPrecio.nuevoPrecio))));
  }
  return Math.round(rawBase);
}

/**
 * Obtiene las opciones de variante seleccionables para un plato de comida dentro del carrito.
 */
export function getCartDishVariantOptions(prod) {
  if (!prod) return [];
  const basePrice = resolveCatalogDishPrice(prod, null);
  const prodNameLower = String(prod.nombre || "").toLowerCase().trim();

  const activeVars = (Array.isArray(prod.variantes) ? prod.variantes : []).filter((v) => {
    if (!isVariantActive(v)) return false;
    const vn = String(v.nombre || "").toLowerCase().trim();
    if (!vn) return false;
    if (vn === "original" || vn === "clasica" || vn === "clásica" || vn === "base" || vn === prodNameLower) {
      return false;
    }
    return true;
  });

  if (activeVars.length === 0) return [];

  const options = [
    {
      key: "BASE",
      idVariante: prod.idVarianteBase || null,
      esVarianteBase: true,
      nombre: "Clásica Original",
      precio: basePrice,
      imagen: prod.imagen || ""
    },
    ...activeVars.map((v) => ({
      key: String(v.idVariante || v.id || v.nombre),
      idVariante: v.idVariante || v.id,
      esVarianteBase: false,
      nombre: v.nombre,
      descripcion: v.descripcion || "",
      especificaciones: v.especificaciones || "",
      precio: resolveCatalogDishPrice(prod, Number(v.precio || prod.precio || 0)),
      imagen: (typeof v.imagen === "string" && v.imagen.trim()) || prod.imagen || ""
    }))
  ];

  return options;
}

/**
 * Extrae la lista limpia de ingredientes opcionales (removibles) de la ficha técnica o descripción del plato.
 */
export function getCartDishRemovableIngredients(prod, ficha = null) {
  if (!prod) return [];
  let rawNames = [];

  const detalles =
    ficha?.detallesFichaTecnica ||
    ficha?.detalles ||
    ficha?.insumos ||
    prod?.fichaTecnica?.detallesFichaTecnica ||
    prod?.fichaTecnica?.insumos ||
    [];

  if (Array.isArray(detalles) && detalles.length > 0) {
    rawNames = detalles
      .map((d) => d?.insumo?.nombre || d?.nombreInsumo || d?.nombre || (typeof d === "string" ? d : ""))
      .map((s) => String(s || "").trim())
      .filter(Boolean);
  } else if (Array.isArray(ficha?.ingredientes) && ficha.ingredientes.length > 0) {
    rawNames = ficha.ingredientes.map((s) => String(s || "").trim()).filter(Boolean);
  } else if (typeof prod.descripcion === "string" && prod.descripcion.trim()) {
    // Separar por comas y conjunciones comunes limpiando gramajes/encabezados
    const cleanedDesc = prod.descripcion
      .replace(/^[^:]+:\s*/, "")
      .replace(/\.$/, "");
    rawNames = cleanedDesc
      .split(/,|(?:\s+y\s+)/i)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3 && s.length <= 42);
  }

  const seen = new Set();
  const result = [];
  for (const name of rawNames) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    if (isEssentialIngredient(name, prod)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}
