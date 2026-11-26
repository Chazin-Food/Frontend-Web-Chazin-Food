import { getColombiaDateISO, getColombiaDateParts, extractDateOnlyISO } from "../../../shared/utils/dateUtils.js";

const VARIANT_TO_PRODUCT_MAP = {
  "clásica 150g": "Hamburguesa Clásica Chazin",
  "doble carne 300g": "Hamburguesa Doble Carne & Tocineta",
  "pollo crispy 180g": "Hamburguesa Pollo Crispy Gourmet",
  "individual bbq bacon 150g": "Hamburguesa BBQ Bacon Chazin",
  "doble carne bbq bacon 300g": "Hamburguesa BBQ Bacon Chazin",
  "mexicana clásica": "Hamburguesa Mexicana Chazin",
  "extra picante con doble jalapeño": "Hamburguesa Mexicana Chazin",
  "individual campesina": "Hamburguesa Campesina Chazin",
  "perro especial": "Perro Caliente Especial Americano",
  "perro suizo gourmet": "Perro Suizo Chazin",
  "salchipapa personal grande": "Salchipapa Salvaje Gourmet",
  "combo pareja completo": "Combo Pareja Chazin",
  "perro mexicano clásico": "Perro Caliente Mexicano",
  "perro criollo gourmet": "Perro Criollo Especial Chazin",
  "porción personal grande": "Salchipapa Criolla Chazin",
  "familiar para compartir (2 personas)": "Salchipapa Criolla Chazin",
  "porción costeña grande": "Salchipapa Costeña Chazin",
  "porción individual 150g": "Porción Papas a la Francesa (150g)",
  "porción individual": "Papas Corral Grandes",
  "sin azúcar / light 400ml": "Gaseosa Coca-Cola 400ml",
  "botella 1.5 litros": "Gaseosa Manzana Postobón 400ml"
};

export function normalizeTextKey(val = "") {
  return String(val || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanProductName(rawName) {
  if (!rawName) return null;
  const trimmed = String(rawName).trim();
  const low = trimmed.toLowerCase();
  if (
    !trimmed ||
    trimmed === "Producto" ||
    trimmed === "Pedido de Venta" ||
    trimmed === "Producto General" ||
    trimmed.startsWith("Producto #") ||
    low.startsWith("sin ") ||
    low === "tester" ||
    low.startsWith("test") ||
    low.startsWith("prueba") ||
    low.startsWith("dummy")
  ) {
    return null;
  }

  let nombreLimpio = trimmed
    .replace(/\s*\(.*?\)/g, "")
    .replace(/\s*-\s*base/i, "")
    .trim();

  if (
    !nombreLimpio ||
    nombreLimpio === "Producto" ||
    nombreLimpio === "Pedido de Venta" ||
    nombreLimpio === "Producto General"
  ) {
    return null;
  }

  const cleanLow = nombreLimpio.toLowerCase();
  if (VARIANT_TO_PRODUCT_MAP[cleanLow]) {
    nombreLimpio = VARIANT_TO_PRODUCT_MAP[cleanLow];
  }
  return nombreLimpio;
}

export function isValidSaleForReport(v) {
  if (!v || v.esDevolucion) return false;
  const entrega = String(v.estadoEntrega || v.estado || "").toUpperCase().trim();
  if (entrega === "CANCELADO" || entrega === "RECHAZADO" || entrega === "ANULADA") return false;
  const aprob = String(v.estadoAprobacion || "").toUpperCase().trim();
  if (aprob === "PENDIENTE" || aprob === "RECHAZADO") return false;
  return true;
}

export function getSaleId(v) {
  const id = Number(v?.idVenta ?? v?.id ?? 0);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function normalizeSaleOrigin(v) {
  const raw = String(v?.origen || "").toUpperCase().trim();
  if (raw === "ONLINE") return "ONLINE";
  if (raw === "PUNTO_FISICO" || raw === "POS" || raw === "PUNTO_DE_VENTA") return "PUNTO_FISICO";
  if (
    String(v?.tipoVenta || "").toUpperCase() === "DOMICILIO" ||
    String(v?.origenNombre || "").toLowerCase().includes("online") ||
    String(v?.tipoEntrega || "").toLowerCase().includes("domicilio")
  ) {
    return "ONLINE";
  }
  return "PUNTO_FISICO";
}

export function normalizeSalePaymentMethod(v) {
  const isOnline = normalizeSaleOrigin(v) === "ONLINE" && !v?.esDevolucion;
  const metodo = String(v?.metodoPago || v?.metodo_pago || "").toLowerCase().trim();
  if (metodo.includes("wompi") || metodo.includes("online") || (isOnline && (!metodo || metodo === "efectivo"))) {
    return "Wompi (En Línea)";
  }
  if (metodo.includes("tarjeta")) return "Tarjeta";
  if (metodo.includes("transfer") || metodo.includes("nequi") || metodo.includes("davi") || metodo.includes("pse")) {
    return "Transferencia";
  }
  return "Efectivo (Punto Físico)";
}

export function normalizeSaleEntrega(v) {
  const raw = String(v?.tipoEntrega || v?.tipoVenta || "").toLowerCase().trim();
  if (raw.includes("domicilio") || raw.includes("delivery")) return "Domicilio";
  return "En Mesa";
}

export function normalizeSaleFidelidad(v) {
  const raw = String(v?.clienteFidelidad?.tipo || v?.tipoFidelidad || "").trim();
  if (raw) return raw;
  const pct = Number(v?.descuentoPorcentaje || 0);
  if (pct >= 15) return "VIP";
  if (pct >= 10) return "Frecuente";
  if (pct >= 5) return "Regular";
  return "Nuevo";
}

export function extractSaleItems(v) {
  if (Array.isArray(v?.detalles) && v.detalles.length > 0) {
    return v.detalles.map((d) => {
      const qty = Math.max(0, Number(d.cantidad) || 0);
      const unitPrice = Number(d.precioUnitario || d.variante?.precio || d.variante?.producto?.precio || 0);
      const sub = Number(d.subtotal || unitPrice * qty || 0);
      const rawName = d.variante?.producto?.nombre || d.nombreProducto || d.nombre || d.variante?.nombre || null;
      return {
        idDetalleVenta: d.idDetalleVenta ? Number(d.idDetalleVenta) : null,
        idVariante: d.idVariante ? Number(d.idVariante) : null,
        idProducto: d.variante?.producto?.idProducto ? Number(d.variante.producto.idProducto) : null,
        nombreRaw: rawName,
        nombreLimpio: cleanProductName(rawName),
        cantidad: qty,
        precioUnitario: unitPrice,
        subtotal: sub
      };
    });
  }
  if (Array.isArray(v?.productos) && v.productos.length > 0) {
    return v.productos.map((p) => {
      const qty = Math.max(0, Number(p.cantidad) || 0);
      const unitPrice = Number(p.precioUnitario || p.precio || p.costo || 0);
      const sub = Number(p.subtotal || p.total || unitPrice * qty || 0);
      const rawName = p.nombreProducto || p.variante?.producto?.nombre || p.nombre || p.variante?.nombre || null;
      return {
        idDetalleVenta: p.idDetalleVenta ? Number(p.idDetalleVenta) : null,
        idVariante: p.idVariante ? Number(p.idVariante) : null,
        idProducto: p.idProducto ? Number(p.idProducto) : null,
        nombreRaw: rawName,
        nombreLimpio: cleanProductName(rawName),
        cantidad: qty,
        precioUnitario: unitPrice,
        subtotal: sub
      };
    });
  }
  return [];
}

function parseJsonSafe(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function isConfirmedDevolucion(d) {
  const est = String(d?.estado || "").toUpperCase().trim();
  return est === "APROBADA" || est === "COMPLETADA";
}

export function isPendingDevolucion(d) {
  return String(d?.estado || "").toUpperCase().trim() === "PENDIENTE";
}

export function isDineroResolution(tipoResolucion) {
  return String(tipoResolucion || "").toLowerCase().includes("dinero");
}

/**
 * Extrae las opciones únicas de productos presentes en las ventas para el selector de filtro.
 */
export function extractAvailableReportProducts(ventas = []) {
  const map = new Map();
  (Array.isArray(ventas) ? ventas : []).filter(isValidSaleForReport).forEach((v) => {
    extractSaleItems(v).forEach((it) => {
      if (!it.nombreLimpio) return;
      const key = normalizeTextKey(it.nombreLimpio);
      if (!map.has(key)) map.set(key, it.nombreLimpio);
    });
  });
  return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Motor puro de cálculo y cuadre financiero/unidades entre Ventas Brutas y Devoluciones/Reembolsos.
 * Garantiza:
 *   - unidadesNetas = max(0, unidadesBrutas - unidadesDevueltas)
 *   - ingresosNetos = max(0, ingresosBrutos - totalReembolsos)
 *   - Cada producto cuadra: cantidadNeta = cantidadBruta - cantidadDevuelta y ingresosNetos = ingresosBrutos - montoReembolsado
 */
export function computeSalesReportMetrics({
  ventas = [],
  devoluciones = [],
  filters = {}
} = {}) {
  const {
    fechaInicio = "",
    fechaFin = "",
    origen = "Todos",
    metodoPago = "Todos",
    tipoEntrega = "Todos",
    fidelidad = "Todos",
    producto = "Todos",
    estadoDevolucion = "Todos", // "Todos" | "con_devolucion" | "sin_devolucion"
    busqueda = "",
    montoMin = "",
    montoMax = ""
  } = filters || {};

  const validAllVentas = (Array.isArray(ventas) ? ventas : []).filter(isValidSaleForReport);
  const allDevs = Array.isArray(devoluciones) ? devoluciones : [];

  // Indexar devoluciones confirmadas y pendientes por idVenta
  const confirmedDevsByVenta = new Map();
  const pendingDevsByVenta = new Map();
  allDevs.forEach((d) => {
    const vid = Number(d?.idVenta ?? d?.venta?.idVenta ?? 0);
    if (!vid) return;
    if (isConfirmedDevolucion(d)) {
      if (!confirmedDevsByVenta.has(vid)) confirmedDevsByVenta.set(vid, []);
      confirmedDevsByVenta.get(vid).push(d);
    } else if (isPendingDevolucion(d)) {
      if (!pendingDevsByVenta.has(vid)) pendingDevsByVenta.set(vid, []);
      pendingDevsByVenta.get(vid).push(d);
    }
  });

  const prodFilterKey = producto && producto !== "Todos" ? normalizeTextKey(producto) : "";
  const searchNorm = normalizeTextKey(busqueda);
  const minVal = montoMin !== "" && montoMin !== null && montoMin !== undefined ? Number(montoMin) : null;
  const maxVal = montoMax !== "" && montoMax !== null && montoMax !== undefined ? Number(montoMax) : null;

  // 1. Filtrar ventas con todos los criterios específicos del reporte
  const filteredVentas = validAllVentas.filter((v) => {
    const rawFecha = v.fecha || v.fechaVenta || v.fechaRegistro || v.createdAt;
    const saleDateISO = rawFecha ? getColombiaDateISO(rawFecha) : extractDateOnlyISO(rawFecha);

    if (fechaInicio && saleDateISO && saleDateISO < fechaInicio) return false;
    if (fechaFin && saleDateISO && saleDateISO > fechaFin) return false;

    if (origen && origen !== "Todos" && normalizeSaleOrigin(v) !== origen) return false;

    if (metodoPago && metodoPago !== "Todos") {
      const saleMethod = normalizeSalePaymentMethod(v);
      const filterLower = metodoPago.toLowerCase();
      if (!saleMethod.toLowerCase().includes(filterLower)) return false;
    }

    if (tipoEntrega && tipoEntrega !== "Todos" && normalizeSaleEntrega(v) !== tipoEntrega) return false;

    if (fidelidad && fidelidad !== "Todos") {
      if (normalizeSaleFidelidad(v).toLowerCase() !== fidelidad.toLowerCase()) return false;
    }

    const totalNum = Number(v.total || 0);
    if (minVal !== null && Number.isFinite(minVal) && totalNum < minVal) return false;
    if (maxVal !== null && Number.isFinite(maxVal) && totalNum > maxVal) return false;

    const vid = getSaleId(v);
    const hasConfirmedDev = Boolean(vid && confirmedDevsByVenta.has(vid));
    if (estadoDevolucion === "con_devolucion" && !hasConfirmedDev) return false;
    if (estadoDevolucion === "sin_devolucion" && hasConfirmedDev) return false;

    const items = extractSaleItems(v);
    if (prodFilterKey) {
      const hasProd = items.some((it) => it.nombreLimpio && normalizeTextKey(it.nombreLimpio) === prodFilterKey);
      if (!hasProd) return false;
    }

    if (searchNorm) {
      const codigo = v.numeroVenta || v.codigoPedido || `VEN-${String(vid || "").padStart(4, "0")}`;
      const cliente = typeof v.cliente === "string" ? v.cliente : (v.clienteNombre || v.cliente?.nombre || "");
      const doc = v.clienteDocumento || v.documento || "";
      const prodNames = items.map((i) => i.nombreLimpio || i.nombreRaw || "").join(" ");
      const haystack = normalizeTextKey(`${codigo} ${cliente} ${doc} ${prodNames}`);
      if (!haystack.includes(searchNorm)) return false;
    }

    return true;
  });

  // Estructuras de agregación
  const daysMap = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 0: "Dom" };
  const diasOrder = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const dailyStats = {};
  diasOrder.forEach((dia) => {
    dailyStats[dia] = {
      dia,
      ventasBrutas: 0,
      reembolsos: 0,
      ventas: 0,
      cantidadVentas: 0,
      pedidos: 0,
      unidadesBrutas: 0,
      unidadesDevueltas: 0,
      unidadesNetas: 0,
      devolucionesCount: 0
    };
  });

  const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mesesCompletos = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const monthlyStats = mesesNombres.map((mes, idx) => ({
    mes,
    mesCompleto: mesesCompletos[idx],
    ventasBrutas: 0,
    reembolsos: 0,
    ventas: 0,
    cantidadVentas: 0,
    unidadesBrutas: 0,
    unidadesDevueltas: 0,
    unidadesNetas: 0,
    devolucionesCount: 0
  }));

  const fechasMap = {};
  const productCounts = {};
  const paymentCounts = {
    "Efectivo (Punto Físico)": 0,
    "Wompi (En Línea)": 0,
    Tarjeta: 0,
    Transferencia: 0
  };
  const devolucionesAplicadas = [];
  let devolucionesPendientesCount = 0;

  let ingresosBrutosTotal = 0;
  let totalReembolsos = 0;
  let reembolsosRealizados = 0;
  let reembolsosPendientes = 0;
  let unidadesBrutasTotal = 0;
  let unidadesDevueltasTotal = 0;
  let unidadesDevueltasReembolso = 0;
  let unidadesCambiadas = 0;

  const ensureProductBucket = (nombreLimpio, unitPrice = 0) => {
    const key = normalizeTextKey(nombreLimpio);
    if (!productCounts[key]) {
      productCounts[key] = {
        nombre: nombreLimpio,
        nombreLimpio,
        cantidadBruta: 0,
        cantidadDevuelta: 0,
        cantidadNeta: 0,
        ingresosBrutos: 0,
        montoReembolsado: 0,
        ingresosNetos: 0,
        precioUnitario: unitPrice || 0
      };
    }
    if (!productCounts[key].precioUnitario && unitPrice > 0) {
      productCounts[key].precioUnitario = unitPrice;
    }
    return productCounts[key];
  };

  // 2. Recorrer cada venta filtrada y cruzar sus devoluciones/reembolsos confirmados
  filteredVentas.forEach((v) => {
    const vid = getSaleId(v);
    const items = extractSaleItems(v);
    const rawFechaV = v.fecha || v.fechaVenta || v.fechaRegistro || v.createdAt;
    const parts = rawFechaV ? getColombiaDateParts(rawFechaV) : null;
    const dateKey = rawFechaV ? getColombiaDateISO(rawFechaV) : null;

    if (vid && pendingDevsByVenta.has(vid)) {
      devolucionesPendientesCount += pendingDevsByVenta.get(vid).length;
    }

    // Si hay filtro de producto específico, calcular el aporte bruto de esa venta restringido a ese producto
    const relevantItems = prodFilterKey
      ? items.filter((it) => it.nombreLimpio && normalizeTextKey(it.nombreLimpio) === prodFilterKey)
      : items;

    const saleGrossMoney = prodFilterKey
      ? relevantItems.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0)
      : Number(v.total || 0);
    const saleGrossUnits = relevantItems.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);

    ingresosBrutosTotal += saleGrossMoney;
    unidadesBrutasTotal += saleGrossUnits;

    // Acumular productos vendidos brutos
    relevantItems.forEach((it) => {
      if (!it.nombreLimpio) return;
      const bucket = ensureProductBucket(it.nombreLimpio, it.precioUnitario);
      bucket.cantidadBruta += it.cantidad;
      bucket.ingresosBrutos += it.subtotal;
    });

    // Cruzar devoluciones confirmadas (APROBADA / COMPLETADA) de esta venta
    const saleConfirmedDevs = (vid && confirmedDevsByVenta.get(vid)) || [];
    let saleRefundMoney = 0;
    let saleReturnedUnits = 0;

    saleConfirmedDevs.forEach((dev) => {
      const devItemsRaw = parseJsonSafe(dev.productosDevueltos, []);
      const devItemsList = Array.isArray(devItemsRaw) ? devItemsRaw : [];
      const devIsMoney = isDineroResolution(dev.tipoResolucion);
      const rawValorDevuelto = devIsMoney ? Math.max(0, Number(dev.valorDevuelto || 0)) : 0;

      // Resolver cada ítem devuelto contra los ítems de la venta para empatar nombre exacto y subtotal base
      const resolvedDevItems = devItemsList.map((di) => {
        const matchedSaleItem = items.find(
          (si) =>
            (di.idDetalleVenta && si.idDetalleVenta && Number(di.idDetalleVenta) === si.idDetalleVenta) ||
            (di.idVariante && si.idVariante && Number(di.idVariante) === si.idVariante) ||
            (di.nombre && si.nombreLimpio && normalizeTextKey(cleanProductName(di.nombre)) === normalizeTextKey(si.nombreLimpio))
        );
        const resolvedName =
          matchedSaleItem?.nombreLimpio ||
          cleanProductName(di.nombre || di.nombreProducto || "") ||
          "Producto";
        const qty = Math.max(0, Number(di.cantidad || 0));
        const unitPrice = Number(di.precioUnitario || matchedSaleItem?.precioUnitario || 0);
        const rawSub = Number(di.subtotal || qty * unitPrice || 0);
        return {
          nombreLimpio: resolvedName,
          cantidad: qty,
          precioUnitario: unitPrice,
          rawSubtotal: rawSub
        };
      });

      // Prorratear valorDevuelto real de la devolución proporcionalmente a los ítems para cuadrar exacto al peso
      const totalRawDevSub = resolvedDevItems.reduce((s, x) => s + x.rawSubtotal, 0);
      const totalRawDevQty = resolvedDevItems.reduce((s, x) => s + x.cantidad, 0);

      let remainingRefund = rawValorDevuelto;
      const attributedItems = resolvedDevItems.map((ri, idx) => {
        let allocatedMoney = 0;
        if (rawValorDevuelto > 0) {
          if (idx === resolvedDevItems.length - 1) {
            allocatedMoney = Math.max(0, remainingRefund);
          } else if (totalRawDevSub > 0) {
            allocatedMoney = Math.round((ri.rawSubtotal / totalRawDevSub) * rawValorDevuelto);
          } else if (totalRawDevQty > 0) {
            allocatedMoney = Math.round((ri.cantidad / totalRawDevQty) * rawValorDevuelto);
          }
          remainingRefund = Math.max(0, remainingRefund - allocatedMoney);
        }
        return { ...ri, allocatedMoney };
      });

      const scopedDevItems = prodFilterKey
        ? attributedItems.filter((ai) => normalizeTextKey(ai.nombreLimpio) === prodFilterKey)
        : attributedItems;

      if (prodFilterKey && scopedDevItems.length === 0) return;

      const devUnitsForScope = scopedDevItems.reduce((s, ai) => s + ai.cantidad, 0);
      const devMoneyForScope = prodFilterKey
        ? scopedDevItems.reduce((s, ai) => s + ai.allocatedMoney, 0)
        : Math.min(saleGrossMoney, rawValorDevuelto);

      saleReturnedUnits += devUnitsForScope;
      saleRefundMoney += devMoneyForScope;

      unidadesDevueltasTotal += devUnitsForScope;
      if (devIsMoney) {
        unidadesDevueltasReembolso += devUnitsForScope;
      } else {
        unidadesCambiadas += devUnitsForScope;
      }

      const estReemb = String(dev.estadoReembolso || (devIsMoney ? "PENDIENTE" : "")).toUpperCase().trim();
      if (devMoneyForScope > 0) {
        if (estReemb === "REALIZADO" || String(dev.estado || "").toUpperCase() === "COMPLETADA") {
          reembolsosRealizados += devMoneyForScope;
        } else {
          reembolsosPendientes += devMoneyForScope;
        }
      }

      // Descontar por producto
      scopedDevItems.forEach((ai) => {
        const bucket = ensureProductBucket(ai.nombreLimpio, ai.precioUnitario);
        bucket.cantidadDevuelta += ai.cantidad;
        bucket.montoReembolsado += ai.allocatedMoney;
      });

      const datosReemb = parseJsonSafe(dev.datosReembolso, null);
      const clienteNom =
        dev.cliente?.nombre ||
        (typeof v.cliente === "string" ? v.cliente : v.clienteNombre || v.cliente?.nombre) ||
        "Cliente General";

      devolucionesAplicadas.push({
        idDevolucion: dev.idDevolucion || dev.id,
        codigoDevolucion: dev.codigoDevolucion || `DEV-${String(dev.idDevolucion || dev.id || 0).padStart(4, "0")}`,
        idVenta: vid,
        codigoVenta: dev.codigoVenta || v.numeroVenta || `VEN-${String(vid || 0).padStart(4, "0")}`,
        fecha: dev.fecha || rawFechaV,
        clienteNombre: clienteNom,
        motivo: dev.motivo || "Devolución",
        tipoResolucion: dev.tipoResolucion || "Devolución",
        estado: String(dev.estado || "APROBADA").toUpperCase(),
        estadoReembolso: devIsMoney ? (estReemb || "PENDIENTE") : "NO_APLICA",
        referenciaReembolso: dev.referenciaReembolso || null,
        metodoReembolso: datosReemb?.banco || (devIsMoney ? "Reembolso registrado" : "Reposición de producto"),
        unidadesDevueltas: devUnitsForScope,
        valorDevuelto: Math.round(devMoneyForScope),
        productosResumen: scopedDevItems.map((ai) => `${ai.cantidad}x ${ai.nombreLimpio}`).join(", ")
      });
    });

    // Asegurar que el reembolso atribuido a una venta no exceda su valor bruto
    saleRefundMoney = Math.min(saleGrossMoney, saleRefundMoney);
    totalReembolsos += saleRefundMoney;
    const saleNetMoney = Math.max(0, saleGrossMoney - saleRefundMoney);
    const saleNetUnits = Math.max(0, saleGrossUnits - saleReturnedUnits);

    // Acumular series temporales (Bruto, Reembolso y Neto)
    if (parts) {
      const dayName = daysMap[parts.dayOfWeek];
      if (dailyStats[dayName]) {
        dailyStats[dayName].ventasBrutas += saleGrossMoney;
        dailyStats[dayName].reembolsos += saleRefundMoney;
        dailyStats[dayName].ventas += saleNetMoney;
        dailyStats[dayName].cantidadVentas += 1;
        dailyStats[dayName].pedidos += 1;
        dailyStats[dayName].unidadesBrutas += saleGrossUnits;
        dailyStats[dayName].unidadesDevueltas += saleReturnedUnits;
        dailyStats[dayName].unidadesNetas += saleNetUnits;
        dailyStats[dayName].devolucionesCount += saleConfirmedDevs.length;
      }

      const monthIdx = parts.month - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyStats[monthIdx].ventasBrutas += saleGrossMoney;
        monthlyStats[monthIdx].reembolsos += saleRefundMoney;
        monthlyStats[monthIdx].ventas += saleNetMoney;
        monthlyStats[monthIdx].cantidadVentas += 1;
        monthlyStats[monthIdx].unidadesBrutas += saleGrossUnits;
        monthlyStats[monthIdx].unidadesDevueltas += saleReturnedUnits;
        monthlyStats[monthIdx].unidadesNetas += saleNetUnits;
        monthlyStats[monthIdx].devolucionesCount += saleConfirmedDevs.length;
      }

      if (dateKey) {
        if (!fechasMap[dateKey]) {
          const displayDate = `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}`;
          fechasMap[dateKey] = {
            fechaKey: dateKey,
            fecha: displayDate,
            fechaCompleta: `${displayDate}/${parts.year}`,
            ventasBrutas: 0,
            reembolsos: 0,
            ventas: 0,
            cantidadVentas: 0,
            unidadesBrutas: 0,
            unidadesDevueltas: 0,
            unidadesNetas: 0,
            devolucionesCount: 0
          };
        }
        fechasMap[dateKey].ventasBrutas += saleGrossMoney;
        fechasMap[dateKey].reembolsos += saleRefundMoney;
        fechasMap[dateKey].ventas += saleNetMoney;
        fechasMap[dateKey].cantidadVentas += 1;
        fechasMap[dateKey].unidadesBrutas += saleGrossUnits;
        fechasMap[dateKey].unidadesDevueltas += saleReturnedUnits;
        fechasMap[dateKey].unidadesNetas += saleNetUnits;
        fechasMap[dateKey].devolucionesCount += saleConfirmedDevs.length;
      }
    }

    const metodoNorm = normalizeSalePaymentMethod(v);
    if (paymentCounts[metodoNorm] !== undefined) {
      paymentCounts[metodoNorm] += 1;
    } else {
      paymentCounts["Efectivo (Punto Físico)"] += 1;
    }
  });

  // 3. Finalizar redondeos y totales netos por producto
  const ingresosBrutosRounded = Math.round(ingresosBrutosTotal);
  const totalReembolsosRounded = Math.min(ingresosBrutosRounded, Math.round(totalReembolsos));
  const ingresosNetosRounded = Math.max(0, ingresosBrutosRounded - totalReembolsosRounded);
  const unidadesNetasTotal = Math.max(0, unidadesBrutasTotal - unidadesDevueltasTotal);

  const productosDetalleRaw = Object.values(productCounts).map((p) => {
    const cantidadNeta = Math.max(0, p.cantidadBruta - p.cantidadDevuelta);
    const ingresosBrutos = Math.round(p.ingresosBrutos);
    const montoReembolsado = Math.min(ingresosBrutos, Math.round(p.montoReembolsado));
    const ingresosNetos = Math.max(0, ingresosBrutos - montoReembolsado);
    const avgPrice = p.cantidadBruta > 0 && ingresosBrutos > 0
      ? Math.round(ingresosBrutos / p.cantidadBruta)
      : (p.precioUnitario || 0);
    return {
      ...p,
      cantidad: cantidadNeta, // compatibilidad con tooltips/barras
      cantidadNeta,
      ingresosBrutos,
      montoReembolsado,
      ingresosNetos,
      ingresos: ingresosNetos,
      precioUnitario: avgPrice
    };
  });

  const sumNetProductMoney = productosDetalleRaw.reduce((acc, p) => acc + p.ingresosNetos, 0);
  const sumNetProductUnits = productosDetalleRaw.reduce((acc, p) => acc + p.cantidadNeta, 0);

  const productosDetalle = productosDetalleRaw
    .map((p) => ({
      ...p,
      porcentaje: sumNetProductMoney > 0
        ? Math.round((p.ingresosNetos / sumNetProductMoney) * 1000) / 10
        : (sumNetProductUnits > 0 ? Math.round((p.cantidadNeta / sumNetProductUnits) * 1000) / 10 : 0)
    }))
    .sort((a, b) => b.cantidadNeta - a.cantidadNeta || b.ingresosNetos - a.ingresosNetos);

  const productosMasVendidos = productosDetalle.slice(0, 6);

  const ingresosDiarios = diasOrder.map((dia) => ({
    ...dailyStats[dia],
    ventasBrutas: Math.round(dailyStats[dia].ventasBrutas),
    reembolsos: Math.round(dailyStats[dia].reembolsos),
    ventas: Math.round(dailyStats[dia].ventas)
  }));

  const historicoMensual = monthlyStats.map((m) => ({
    ...m,
    ventasBrutas: Math.round(m.ventasBrutas),
    reembolsos: Math.round(m.reembolsos),
    ventas: Math.round(m.ventas)
  }));

  const historicoFechas = Object.keys(fechasMap)
    .sort()
    .map((key) => ({
      ...fechasMap[key],
      ventasBrutas: Math.round(fechasMap[key].ventasBrutas),
      reembolsos: Math.round(fechasMap[key].reembolsos),
      ventas: Math.round(fechasMap[key].ventas)
    }));

  // Métodos de pago con suma exacta 100%
  const totalMetodosCount = Object.values(paymentCounts).reduce((a, b) => a + b, 0);
  let metodosPago = [];
  if (filteredVentas.length > 0 && totalMetodosCount > 0) {
    const rawMethods = Object.entries(paymentCounts)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({ name, count }));

    let allocatedSum = 0;
    metodosPago = rawMethods.map((m) => {
      const exactPct = (m.count / totalMetodosCount) * 100;
      const floorPct = Math.floor(exactPct);
      allocatedSum += floorPct;
      return {
        name: m.name,
        count: m.count,
        value: floorPct,
        decimal: exactPct - floorPct
      };
    });

    const remainder = 100 - allocatedSum;
    const sortedByDecimal = [...metodosPago].sort((a, b) => b.decimal - a.decimal);
    for (let i = 0; i < remainder; i++) {
      const item = metodosPago.find((m) => m.name === sortedByDecimal[i]?.name);
      if (item) item.value += 1;
    }
    metodosPago.sort((a, b) => b.count - a.count);
  }

  const totalVentasCount = filteredVentas.length;
  const ticketPromedioBruto = totalVentasCount > 0 ? Math.round(ingresosBrutosRounded / totalVentasCount) : 0;
  const ticketPromedioNeto = totalVentasCount > 0 ? Math.round(ingresosNetosRounded / totalVentasCount) : 0;
  const tasaDevolucionUnidades = unidadesBrutasTotal > 0
    ? Math.round((unidadesDevueltasTotal / unidadesBrutasTotal) * 1000) / 10
    : 0;
  const tasaReembolsoDinero = ingresosBrutosRounded > 0
    ? Math.round((totalReembolsosRounded / ingresosBrutosRounded) * 1000) / 10
    : 0;

  const topMonth = [...historicoMensual].sort((a, b) => b.ventas - a.ventas)[0];
  const topMonthStr = topMonth && topMonth.ventas > 0
    ? `${topMonth.mesCompleto} — $${topMonth.ventas.toLocaleString("es-CO")} COP neto (${topMonth.cantidadVentas} ventas)`
    : "N/A";
  const topDay = [...ingresosDiarios].sort((a, b) => b.ventas - a.ventas)[0];
  const topDayStr = topDay && topDay.ventas > 0
    ? `${topDay.dia} — $${topDay.ventas.toLocaleString("es-CO")} COP neto`
    : "N/A";
  const topProdStr = productosMasVendidos.length > 0
    ? `${productosMasVendidos[0].nombreLimpio} (${productosMasVendidos[0].cantidadNeta} und. netas${productosMasVendidos[0].cantidadDevuelta > 0 ? ` · ${productosMasVendidos[0].cantidadDevuelta} dev.` : ""})`
    : "N/A";
  const prefMetodoStr = metodosPago.length > 0
    ? `${metodosPago[0].name} (${metodosPago[0].value}% · ${metodosPago[0].count} vnt.)`
    : "N/A";

  const kpis = {
    ingresosBrutos: ingresosBrutosRounded,
    totalReembolsos: totalReembolsosRounded,
    ingresosNetos: ingresosNetosRounded,
    reembolsosRealizados: Math.round(reembolsosRealizados),
    reembolsosPendientes: Math.round(reembolsosPendientes),
    totalVentasCount,
    unidadesBrutas: unidadesBrutasTotal,
    unidadesDevueltas: unidadesDevueltasTotal,
    unidadesDevueltasReembolso,
    unidadesCambiadas,
    unidadesNetas: unidadesNetasTotal,
    devolucionesAprobadasCount: devolucionesAplicadas.length,
    devolucionesPendientesCount,
    tasaDevolucionUnidades,
    tasaReembolsoDinero,
    ticketPromedioBruto,
    ticketPromedioNeto
  };

  return {
    filteredVentas,
    kpis,
    ingresosDiarios,
    historicoMensual,
    historicoFechas,
    productosDetalle,
    productosMasVendidos,
    devolucionesAplicadas,
    metodosPago,
    totalMetodosCount,
    resumen: [
      { label: "Ventas brutas del período", value: `$${ingresosBrutosRounded.toLocaleString("es-CO")} COP (${unidadesBrutasTotal} und.)` },
      { label: "Devoluciones y reembolsos aplicados", value: `-$${totalReembolsosRounded.toLocaleString("es-CO")} COP (${devolucionesAplicadas.length} dev. · ${unidadesDevueltasTotal} und.)`, tone: "negative" },
      { label: "Ingresos netos reales (Bruto - Reembolsos)", value: `$${ingresosNetosRounded.toLocaleString("es-CO")} COP (${unidadesNetasTotal} und. netas)`, tone: "positive" },
      { label: "Total de ventas procesadas", value: `${totalVentasCount} ventas` },
      { label: "Ticket promedio neto por venta", value: `$${ticketPromedioNeto.toLocaleString("es-CO")} COP (Bruto: $${ticketPromedioBruto.toLocaleString("es-CO")})` },
      { label: "Tasa de devolución (unidades / ingresos)", value: `${tasaDevolucionUnidades}% unidades · ${tasaReembolsoDinero}% ingresos` },
      { label: "Mejor mes por ingreso neto", value: topMonthStr },
      { label: "Día de mayor facturación neta semanal", value: topDayStr },
      { label: "Producto estrella (unidades netas)", value: topProdStr },
      { label: "Método de pago preferido", value: prefMetodoStr }
    ]
  };
}
