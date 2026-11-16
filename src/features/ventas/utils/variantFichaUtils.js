import { normalizeUnidadMedida } from "../../fichas-tecnicas/utils/costoUtils.js";

export const isSizeVariantName = (name = "") => {
  const vn = String(name || "").toLowerCase();
  return (
    (vn.includes("1.5") ||
      vn.includes("1,5") ||
      vn.includes("2.5") ||
      vn.includes("2,5") ||
      vn.includes("mega") ||
      vn.includes("botella 1.") ||
      vn.includes("botella 2.") ||
      vn.includes("familiar") ||
      vn.includes("litro") ||
      vn.includes("personal") ||
      vn.includes("grande") ||
      vn.includes("mediana") ||
      vn.includes("mediano") ||
      vn.includes("pequeña") ||
      vn.includes("doble") ||
      vn.includes("triple") ||
      vn.includes("jumbo") ||
      /\btama[ñn]o\b|\bxl\b|\bxxl\b|\bcompartir\b|\d+\s*person/.test(vn)) &&
    !vn.includes("sin azúcar") &&
    !vn.includes("sin azucar") &&
    !vn.includes("light") &&
    !vn.includes("zero") &&
    !vn.includes("black")
  );
};

/**
 * Detecta si una variante representa un tamaño/porción y determina su factor multiplicador de insumos.
 */
export const detectVariantSizeInfo = (variantName = "", explicitTipo = "") => {
  const n = String(variantName || "").toLowerCase().trim();
  const isDietOnly =
    n.includes("sin azúcar") ||
    n.includes("sin azucar") ||
    n.includes("light") ||
    n.includes("zero") ||
    n.includes("black");

  const personasMatch = n.match(/(\d+)\s*person/);
  if (personasMatch) {
    const num = Math.max(1.5, Number(personasMatch[1]) || 2);
    return { isSize: true, factor: num, label: `${num}x (${personasMatch[1]} personas)` };
  }

  if (/\btriple\b|\b3x\b/.test(n)) return { isSize: true, factor: 3, label: "3x (Triple)" };
  if (/\bdoble\b|\b2x\b/.test(n)) return { isSize: true, factor: 2, label: "2x (Doble)" };
  if (/\bfamiliar\b|\bcompartir\b|\bjumbo\b|\bmega\b|\bxxl\b/.test(n)) {
    if (n.includes("2.5") || n.includes("2,5")) return { isSize: true, factor: 2.5, label: "2.5x (Mega / 2.5L)" };
    return { isSize: true, factor: 2, label: "2x (Familiar / Mega)" };
  }
  if (n.includes("2.5") || n.includes("2,5")) return { isSize: true, factor: 2.5, label: "2.5x (2.5L)" };
  if (n.includes("1.5") || n.includes("1,5")) return { isSize: true, factor: 1.5, label: "1.5x (1.5L)" };
  if (/\bgrande\b|\bxl\b|\bsuper\b|\bsúper\b|\bextra\s*grande\b|\blarge\b|\btama[ñn]o\b/.test(n)) {
    return { isSize: true, factor: 1.5, label: "1.5x (Grande)" };
  }
  if (/\bmediana\b|\bmediano\b|\bmedium\b/.test(n)) {
    return { isSize: true, factor: 1.25, label: "1.25x (Mediana)" };
  }
  if (/\blitro\b|\blitros\b/.test(n) && !isDietOnly) {
    return { isSize: true, factor: 2, label: "2x (Litro)" };
  }
  if (/\bpersonal\b|\bpequeñ|\bpequen|\bchica\b/.test(n) && !isDietOnly) {
    return { isSize: true, factor: 1, label: "1x (Base)" };
  }
  if (explicitTipo === "tamano") {
    return { isSize: true, factor: 1.5, label: "1.5x (Tamaño)" };
  }
  return { isSize: false, factor: 1, label: "1x (Estándar)" };
};

/**
 * Escala una cantidad base por el factor de tamaño redondeando a 2 decimales (compatible con decimal(10,2)).
 */
export const scaleQuantityByFactor = (baseQty, factor = 1) => {
  const q = Number(baseQty || 0);
  const f = Number(factor || 1);
  if (q <= 0) return 0;
  const raw = q * f;
  // Tolerancia 1e-9 para evitar sub-redondeo por coma flotante binaria (ej. 0.15 * 1.5 = 0.22499999999999998)
  const rounded = Math.round(raw * 100 + 1e-9) / 100;
  return rounded > 0 ? rounded : Number(raw.toFixed(3));
};

/**
 * Construye una lista editable de insumos para la ficha técnica de la variante a partir de la receta base.
 */
export const buildVariantDetallesFromBase = (baseList = [], factor = 1, catalog = []) => {
  return (baseList || []).map((b) => {
    const idInsumo = Number(b.idInsumo || b.insumo?.idInsumo || b.id);
    const cat = (catalog || []).find((c) => Number(c.idInsumo || c.id) === idInsumo);
    const baseQty = Number(b.cantidad || 0);
    const scaledQty = scaleQuantityByFactor(baseQty, factor);
    const unit = normalizeUnidadMedida(b.unidadMedida || b.insumo?.unidadMedida || cat?.unidadMedida || "und");
    return {
      idInsumo,
      nombre: b.nombre || b.nombreInsumo || b.insumo?.nombre || cat?.nombre || `Insumo #${idInsumo}`,
      cantidad: scaledQty,
      baseCantidad: baseQty,
      unidadMedida: unit,
      precioUnitario: Number(b.precioUnitario || b.insumo?.precioUnitario || cat?.precioUnitario || 0),
      insumo:
        b.insumo ||
        (cat
          ? {
              idInsumo: cat.idInsumo || cat.id,
              nombre: cat.nombre,
              unidadMedida: cat.unidadMedida,
              precioUnitario: Number(cat.precioUnitario || 0),
              stock: cat.stock,
              fechaVencimiento: cat.fechaVencimiento
            }
          : null),
      esBase: true,
      esNuevo: false,
      _manualEdit: false
    };
  });
};

/**
 * Reconstruye la receta efectiva de una variante existente a partir de insumos base y deltas previos.
 */
export const reconstructVariantDetallesFromDeltas = (baseList = [], varDeltas = [], catalog = []) => {
  let result = buildVariantDetallesFromBase(baseList, 1, catalog);
  const baseById = new Map(result.map((r) => [Number(r.idInsumo), r]));

  for (const delta of varDeltas || []) {
    const accion = String(delta.tipoAccion || "AGREGAR").toUpperCase();
    const idIns = Number(delta.idInsumo);
    const cat = (catalog || []).find((c) => Number(c.idInsumo || c.id) === idIns);
    const unit = normalizeUnidadMedida(delta.unidadMedida || delta.insumo?.unidadMedida || cat?.unidadMedida || "und");
    const nombre = delta.insumo?.nombre || cat?.nombre || `Insumo #${idIns}`;

    if (accion === "AGREGAR") {
      const existingIdx = result.findIndex((d) => Number(d.idInsumo) === idIns);
      if (existingIdx >= 0) {
        result[existingIdx] = {
          ...result[existingIdx],
          cantidad: Number(delta.cantidad || result[existingIdx].cantidad),
          unidadMedida: unit,
          _manualEdit: true
        };
      } else {
        result.push({
          idInsumo: idIns,
          nombre,
          cantidad: Number(delta.cantidad || 1),
          baseCantidad: null,
          unidadMedida: unit,
          precioUnitario: Number(delta.insumo?.precioUnitario || cat?.precioUnitario || 0),
          insumo: delta.insumo || cat || null,
          esBase: false,
          esNuevo: true,
          _manualEdit: true
        });
      }
    } else if (accion === "REEMPLAZAR") {
      let replacedInfo = null;
      if (delta.idInsumoReemplazado) {
        const repId = Number(delta.idInsumoReemplazado);
        const existingRep = result.find((d) => Number(d.idInsumo) === repId);
        const repCat = catalog.find((c) => Number(c.idInsumo || c.id) === repId);
        replacedInfo = {
          idInsumo: repId,
          nombre:
            delta.insumoReemplazado?.nombre ||
            existingRep?.nombre ||
            repCat?.nombre ||
            `Insumo #${repId}`
        };
        result = result.filter((d) => Number(d.idInsumo) !== repId);
      }
      result.push({
        idInsumo: idIns,
        nombre,
        cantidad: Number(delta.cantidad || 1),
        baseCantidad: null,
        unidadMedida: unit,
        precioUnitario: Number(delta.insumo?.precioUnitario || cat?.precioUnitario || 0),
        insumo: delta.insumo || cat || null,
        esBase: false,
        esNuevo: true,
        reemplazaA: replacedInfo,
        _manualEdit: true
      });
    } else if (accion === "MODIFICAR_CANTIDAD") {
      const idx = result.findIndex((d) => Number(d.idInsumo) === idIns);
      if (idx >= 0) {
        result[idx] = {
          ...result[idx],
          cantidad: Number(delta.cantidad || 0),
          unidadMedida: unit,
          _manualEdit: true
        };
      } else {
        result.push({
          idInsumo: idIns,
          nombre,
          cantidad: Number(delta.cantidad || 1),
          baseCantidad: baseById.get(idIns)?.baseCantidad ?? null,
          unidadMedida: unit,
          precioUnitario: Number(delta.insumo?.precioUnitario || cat?.precioUnitario || 0),
          insumo: delta.insumo || cat || null,
          esBase: Boolean(baseById.get(idIns)),
          esNuevo: !baseById.get(idIns),
          _manualEdit: true
        });
      }
    } else if (accion === "QUITAR") {
      result = result.filter((d) => Number(d.idInsumo) !== idIns);
    }
  }
  return result;
};

/**
 * Calcula automáticamente los deltas variante_insumo comparando la ficha de la variante contra la receta base.
 */
export const computeInsumosModificadosDeltas = (variantDetalles = [], baseList = []) => {
  const baseMap = new Map((baseList || []).map((b) => [Number(b.idInsumo || b.id), b]));
  const varMap = new Map((variantDetalles || []).map((d) => [Number(d.idInsumo), d]));
  const replacedBaseIds = new Set();
  const handledVarIds = new Set();
  const deltas = [];

  for (const [varId, varItem] of varMap.entries()) {
    const replacedId = Number(varItem?.reemplazaA?.idInsumo || 0);
    if (
      replacedId > 0 &&
      replacedId !== varId &&
      baseMap.has(replacedId) &&
      !varMap.has(replacedId) &&
      !replacedBaseIds.has(replacedId)
    ) {
      replacedBaseIds.add(replacedId);
      handledVarIds.add(varId);
      deltas.push({
        idVarianteInsumo: null,
        tipoAccion: "REEMPLAZAR",
        idInsumo: varId,
        idInsumoReemplazado: replacedId,
        cantidad: Number(varItem.cantidad || 0),
        unidadMedida: normalizeUnidadMedida(varItem.unidadMedida || "und")
      });
    }
  }

  for (const [baseId, baseItem] of baseMap.entries()) {
    if (replacedBaseIds.has(baseId)) continue;
    const varItem = varMap.get(baseId);
    if (!varItem) {
      deltas.push({
        idVarianteInsumo: null,
        tipoAccion: "QUITAR",
        idInsumo: baseId,
        idInsumoReemplazado: null,
        cantidad: 0,
        unidadMedida: normalizeUnidadMedida(baseItem.unidadMedida || "und")
      });
    } else {
      const baseQty = Number(baseItem.cantidad || 0);
      const varQty = Number(varItem.cantidad || 0);
      const baseUnit = normalizeUnidadMedida(baseItem.unidadMedida || "und");
      const varUnit = normalizeUnidadMedida(varItem.unidadMedida || baseUnit);
      if (Math.abs(baseQty - varQty) > 0.001 || baseUnit !== varUnit) {
        deltas.push({
          idVarianteInsumo: null,
          tipoAccion: "MODIFICAR_CANTIDAD",
          idInsumo: baseId,
          idInsumoReemplazado: null,
          cantidad: varQty,
          unidadMedida: varUnit
        });
      }
    }
  }

  for (const [varId, varItem] of varMap.entries()) {
    if (!baseMap.has(varId) && !handledVarIds.has(varId)) {
      deltas.push({
        idVarianteInsumo: null,
        tipoAccion: "AGREGAR",
        idInsumo: varId,
        idInsumoReemplazado: null,
        cantidad: Number(varItem.cantidad || 0),
        unidadMedida: normalizeUnidadMedida(varItem.unidadMedida || "und")
      });
    }
  }

  return deltas;
};

const convertExactMetricUnit = (qty, fromUnitRaw, toUnitRaw) => {
  const n = Number(qty || 0);
  const fromU = normalizeUnidadMedida(fromUnitRaw || "und");
  const toU = normalizeUnidadMedida(toUnitRaw || fromU);
  if (fromU === toU) return n;
  if (fromU === "kg" && toU === "gr") return n * 1000;
  if (fromU === "gr" && toU === "kg") return n / 1000;
  if (fromU === "gr" && toU === "mg") return n * 1000;
  if (fromU === "mg" && toU === "gr") return n / 1000;
  if (fromU === "lt" && toU === "ml") return n * 1000;
  if (fromU === "ml" && toU === "lt") return n / 1000;
  if (fromU === "lt" && toU === "cc") return n * 1000;
  if (fromU === "cc" && toU === "lt") return n / 1000;
  return n;
};

const formatCleanQty = (val) => {
  const num = Math.round(Number(val || 0) * 100) / 100;
  return Number.isInteger(num) ? String(num) : String(num);
};

/**
 * Clasifica cada ingrediente de una variante respecto a la receta base y a sus deltas:
 * - "reemplazo" (isExtra: true): reemplaza a otro insumo de la base
 * - "extra_nuevo" (isExtra: true): insumo adicional no incluido en la base
 * - "extra_cantidad" (isExtra: true): insumo presente en la base con cantidad superior en la variante
 * - "reducido" (isExtra: false): cantidad menor a la receta base
 * - "base" (isExtra: false): coincide con la receta base
 */
export const classifyVariantIngredientStatus = (
  det,
  baseDetalles = [],
  deltas = [],
  isDrink = false
) => {
  if (!det || typeof det !== "object") {
    return {
      kind: "base",
      isExtra: false,
      shortBadge: "Base",
      badgeText: "Base",
      diffQty: 0,
      baseQty: null,
      unit: "und"
    };
  }

  const idIns = Number(det.idInsumo || det.insumo?.idInsumo || det.id || 0);
  const varUnit = normalizeUnidadMedida(det.unidadMedida || det.insumo?.unidadMedida || "und");
  const varQty = Number(det.cantidad || 0);

  const baseList = Array.isArray(baseDetalles) ? baseDetalles : [];
  const baseMap = new Map(
    baseList
      .filter((b) => b && (b.idInsumo || b.insumo?.idInsumo || b.id))
      .map((b) => [Number(b.idInsumo || b.insumo?.idInsumo || b.id), b])
  );
  const deltaList = Array.isArray(deltas) ? deltas : [];

  const repDelta = deltaList.find(
    (dl) =>
      String(dl?.tipoAccion || "").toUpperCase() === "REEMPLAZAR" &&
      Number(dl?.idInsumo) === idIns
  );

  if (det.reemplazaA || repDelta) {
    const repId = Number(det.reemplazaA?.idInsumo || repDelta?.idInsumoReemplazado || 0);
    const repBaseMatch = repId ? baseMap.get(repId) : null;
    const replacedName =
      det.reemplazaA?.nombre ||
      repDelta?.insumoReemplazado?.nombre ||
      repBaseMatch?.insumo?.nombre ||
      repBaseMatch?.nombreInsumo ||
      repBaseMatch?.nombre ||
      (repId ? `Insumo #${repId}` : "Insumo base");

    return {
      kind: "reemplazo",
      isExtra: true,
      replacedName,
      shortBadge: `⇄ Reemplaza: ${replacedName}`,
      badgeText: `⇄ Reemplaza: ${replacedName}`,
      diffQty: varQty,
      baseQty: null,
      unit: varUnit
    };
  }

  const baseItem = baseMap.get(idIns) || null;
  const matchingDelta = deltaList.find(
    (dl) => Number(dl?.idInsumo) === idIns && String(dl?.tipoAccion || "").toUpperCase() !== "QUITAR"
  );
  const deltaAction = String(matchingDelta?.tipoAccion || "").toUpperCase();

  if (baseItem) {
    const rawBaseQty = Number(baseItem.cantidad || 0);
    const baseUnit = normalizeUnidadMedida(baseItem.unidadMedida || baseItem.insumo?.unidadMedida || varUnit);
    const baseInVarUnit = convertExactMetricUnit(rawBaseQty, baseUnit, varUnit);
    const diff = Math.round((varQty - baseInVarUnit) * 100) / 100;
    const baseClean = formatCleanQty(baseInVarUnit);

    if (diff > 0.001) {
      const diffClean = formatCleanQty(diff);
      return {
        kind: "extra_cantidad",
        isExtra: true,
        diffQty: diff,
        baseQty: Number(baseClean),
        unit: varUnit,
        shortBadge: `+ Extra (+${diffClean} ${varUnit})`,
        badgeText: `+ Extra (+${diffClean} ${varUnit} · Base: ${baseClean} ${varUnit})`
      };
    }

    if (diff < -0.001) {
      return {
        kind: "reducido",
        isExtra: false,
        diffQty: diff,
        baseQty: Number(baseClean),
        unit: varUnit,
        shortBadge: "Reducido",
        badgeText: `Reducido (${formatCleanQty(varQty)} ${varUnit} · Base: ${baseClean} ${varUnit})`
      };
    }

    return {
      kind: "base",
      isExtra: false,
      diffQty: 0,
      baseQty: Number(baseClean),
      unit: varUnit,
      shortBadge: "Base",
      badgeText: "Base"
    };
  }

  // Fallback cuando no hay baseDetalles o el insumo no está en la receta base
  if (baseMap.size > 0) {
    return {
      kind: "extra_nuevo",
      isExtra: true,
      diffQty: varQty,
      baseQty: 0,
      unit: varUnit,
      shortBadge: "+ Extra Nuevo",
      badgeText: varQty > 0 ? `+ Extra Nuevo (${formatCleanQty(varQty)} ${varUnit})` : "+ Extra Nuevo"
    };
  }

  if (det.esBase && det.baseCantidad !== null && det.baseCantidad !== undefined) {
    const baseNum = Number(det.baseCantidad);
    const diff = Math.round((varQty - baseNum) * 100) / 100;
    if (diff > 0.001) {
      const diffClean = formatCleanQty(diff);
      return {
        kind: "extra_cantidad",
        isExtra: true,
        diffQty: diff,
        baseQty: baseNum,
        unit: varUnit,
        shortBadge: `+ Extra (+${diffClean} ${varUnit})`,
        badgeText: `+ Extra (+${diffClean} ${varUnit} · Base: ${formatCleanQty(baseNum)} ${varUnit})`
      };
    }
    if (diff < -0.001) {
      return {
        kind: "reducido",
        isExtra: false,
        diffQty: diff,
        baseQty: baseNum,
        unit: varUnit,
        shortBadge: "Reducido",
        badgeText: `Reducido (Base: ${formatCleanQty(baseNum)} ${varUnit})`
      };
    }
    return {
      kind: "base",
      isExtra: false,
      diffQty: 0,
      baseQty: baseNum,
      unit: varUnit,
      shortBadge: "Base",
      badgeText: "Base"
    };
  }

  if (!isDrink && (deltaAction === "AGREGAR" || det.esNuevo === true || det.esBase === false)) {
    return {
      kind: "extra_nuevo",
      isExtra: true,
      diffQty: varQty,
      baseQty: 0,
      unit: varUnit,
      shortBadge: "+ Extra Nuevo",
      badgeText: varQty > 0 ? `+ Extra Nuevo (${formatCleanQty(varQty)} ${varUnit})` : "+ Extra Nuevo"
    };
  }

  if (!isDrink && deltaAction === "MODIFICAR_CANTIDAD") {
    return {
      kind: "extra_cantidad",
      isExtra: true,
      diffQty: varQty,
      baseQty: null,
      unit: varUnit,
      shortBadge: `+ Extra (${formatCleanQty(varQty)} ${varUnit})`,
      badgeText: `+ Extra (${formatCleanQty(varQty)} ${varUnit})`
    };
  }

  return {
    kind: "base",
    isExtra: false,
    diffQty: 0,
    baseQty: null,
    unit: varUnit,
    shortBadge: "Base",
    badgeText: "Base"
  };
};

/**
 * Resume todos los insumos extra, aumentados en cantidad o reemplazados de una variante.
 */
export const summarizeVariantExtras = (
  varDetalles = [],
  baseDetalles = [],
  deltas = [],
  isDrink = false
) => {
  const extraItems = [];
  for (const det of (varDetalles || [])) {
    const status = classifyVariantIngredientStatus(det, baseDetalles, deltas, isDrink);
    if (!status.isExtra) continue;
    const nombre =
      det.insumo?.nombre ||
      det.nombreInsumo ||
      det.nombre ||
      `Insumo #${det.idInsumo || det.id}`;
    extraItems.push({
      idInsumo: Number(det.idInsumo || det.insumo?.idInsumo || det.id || 0),
      nombre,
      ...status
    });
  }
  return {
    extrasCount: extraItems.length,
    extraItems
  };
};

/**
 * Resuelve el idInsumo por defecto de una variante o presentación de bebida comercial.
 */
export const resolveDrinkInsumoId = (variantName = "", productName = "", productId = 0) => {
  const vn = String(variantName || "").toLowerCase();
  const pn = String(productName || "").toLowerCase();
  const combined = `${vn} ${pn}`;
  const pid = Number(productId || 0);

  if (vn.includes("coca") || pid === 8 || pid === 16 || pn.includes("coca")) {
    if (/con az[uú]car|\boriginal\b|\bcl[aá]sic/.test(vn)) return 29;
    if (/sin az[uú]car|\blight\b|\bzero\b/.test(vn)) return 32;
    if (pid === 16 || /sin az[uú]car|\blight\b|\bzero\b/.test(pn)) return 32;
    return 29;
  }

  if (vn.includes("pepsi") || pid === 11 || pn.includes("pepsi")) {
    if (/sin az[uú]car|\blight\b|\bzero\b|\bblack\b/.test(vn)) return 34;
    if (/regular|\boriginal\b/.test(vn)) return 33;
    return /sin az[uú]car|\blight\b|\bzero\b|\bblack\b/.test(pn) ? 34 : 33;
  }

  if (vn.includes("uva")) return 47;
  if (vn.includes("naranja")) return 48;
  if (vn.includes("manzana")) return 30;
  if (vn.includes("colombiana")) return 35;
  if (vn.includes("sprite")) return 36;
  if (vn.includes("quatro") || vn.includes("cuatro") || vn.includes("toronja")) return 37;
  if (vn.includes("agua")) return 31;

  if (pid === 38 || pn.includes("uva")) return 47;
  if (pid === 39 || pn.includes("naranja")) return 48;
  if (pid === 9 || pn.includes("manzana")) return 30;
  if (pid === 12 || pn.includes("colombiana")) return 35;
  if (pid === 13 || pn.includes("sprite")) return 36;
  if (pid === 14 || pn.includes("quatro") || pn.includes("cuatro") || pn.includes("toronja")) return 37;
  if (pid === 10 || pn.includes("agua") || combined.includes("cristal")) return 31;

  return null;
};

/**
 * Construye el detalle inicial (1 unidad del insumo comercial) para variantes de bebidas.
 */
export const buildDefaultDrinkVariantDetalles = (
  variantName = "",
  productName = "",
  productId = 0,
  catalog = []
) => {
  const idInsumo = resolveDrinkInsumoId(variantName, productName, productId);
  if (!idInsumo) return [];

  const cat = (catalog || []).find((c) => Number(c.idInsumo || c.id) === Number(idInsumo)) || null;
  return [
    {
      idInsumo: Number(idInsumo),
      nombre: cat?.nombre || `Insumo #${idInsumo}`,
      cantidad: 1,
      baseCantidad: 1,
      unidadMedida: "und",
      precioUnitario: Number(cat?.precioUnitario || 0),
      insumo: cat
        ? {
            idInsumo: cat.idInsumo || cat.id,
            nombre: cat.nombre,
            unidadMedida: cat.unidadMedida || "und",
            precioUnitario: Number(cat.precioUnitario || 0),
            stock: cat.stock,
            fechaVencimiento: cat.fechaVencimiento
          }
        : null,
      esBase: true,
      esNuevo: false,
      _manualEdit: false
    }
  ];
};
