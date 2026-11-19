import { apiClient } from "@/shared/api/apiClient";

const isTrivialObservation = (raw) => {
  const clean = String(raw || "").trim();
  if (!clean || clean.length < 3) return true;
  if (clean.startsWith("{") || clean.startsWith("[")) return true;
  const lower = clean.toLowerCase();
  return (
    lower === "n/a" ||
    lower === "na" ||
    lower === "ninguna" ||
    lower === "ninguno" ||
    lower === "sin observaciones" ||
    lower === "sin notas" ||
    lower === "ninguna observacion" ||
    lower === "ninguna observación" ||
    lower === "prueba" ||
    lower === "test" ||
    lower.startsWith("qa_") ||
    lower.includes("prueba automatizada")
  );
};

const extractLiveObservacionesFromVentas = (ventasList = []) => {
  const observaciones = [];
  for (const v of ventasList) {
    if (!v || String(v.estadoEntrega || "").toUpperCase() === "CANCELADO" || String(v.estado || "").toLowerCase() === "anulada") {
      continue;
    }
    const parts = [];
    const seen = new Set();
    const pushPart = (val) => {
      const clean = String(val || "").trim();
      if (isTrivialObservation(clean)) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      parts.push(clean);
    };

    pushPart(v.especificaciones);
    pushPart(v.observacionCocina);

    if (Array.isArray(v.productos)) {
      for (const item of v.productos) {
        const itemNote = String(item?.observaciones || item?.observacion || item?.nota || "").trim();
        const itemNameLower = String(item?.nombre || item?.nombreProducto || "").trim().toLowerCase();
        if (itemNote && itemNote.toLowerCase() !== itemNameLower) {
          pushPart(itemNote);
        }
      }
    }

    if (parts.length > 0) {
      observaciones.push({
        id: v.id || v.idVenta || v.codigoPedido,
        codigo: v.codigoPedido || v.numeroVenta || `#${String(v.id || "").padStart(4, "0")}`,
        cliente: v.clienteNombre || v.cliente || "Cliente General",
        origen: v.origenNombre || (v.tipoEntrega === "Domicilio" ? "Venta Online" : "Punto Físico"),
        nota: parts.join(" · "),
        fecha: v.fechaFormatted || (v.fecha ? String(v.fecha).slice(0, 10) : ""),
        estado: v.estado || ""
      });
      if (observaciones.length >= 15) break;
    }
  }
  return observaciones;
};

export const dashboardService = {
  getStats: async (params = {}) => {
    return await apiClient.get("/dashboard/stats", { params });
  },

  getVentasChart: async (params = {}) => {
    return await apiClient.get("/dashboard/ventas-chart", { params });
  },

  getProductosPopulares: async (params = {}) => {
    return await apiClient.get("/dashboard/productos-populares", { params });
  },

  getAlertasStock: async (params = {}) => {
    return await apiClient.get("/dashboard/alertas-stock", { params });
  },

  getVentasRecientes: async (params = {}) => {
    return await apiClient.get("/dashboard/ventas-recientes", { params });
  },

  getComentariosObservaciones: async (params = {}) => {
    try {
      const res = await apiClient.get("/dashboard/comentarios-observaciones", { params });
      if (res && typeof res === "object") {
        return {
          promedioGlobal: Number(res.promedioGlobal || 0),
          totalResenas: Number(res.totalResenas || 0),
          resenas: Array.isArray(res.resenas) ? res.resenas : [],
          observaciones: Array.isArray(res.observaciones) ? res.observaciones : []
        };
      }
    } catch (err) {
      // Si el backend en la nube aún no despliega /dashboard/comentarios-observaciones (404),
      // consultar únicamente endpoints reales en vivo (sin ningún dato falso ni estático).
      if (err?.status !== 404) {
        return { promedioGlobal: 0, totalResenas: 0, resenas: [], observaciones: [] };
      }
    }

    const [productosRaw, ventasRaw] = await Promise.all([
      apiClient.get("/productos").catch(() => []),
      apiClient.get("/ventas", { params }).catch(() => [])
    ]);

    const productos = Array.isArray(productosRaw) ? productosRaw : (productosRaw?.productos || productosRaw?.data || []);
    const ventas = Array.isArray(ventasRaw) ? ventasRaw : (ventasRaw?.ventas || ventasRaw?.data || []);

    const prodMap = new Map();
    productos.forEach((p) => {
      const id = Number(p?.id || p?.idProducto);
      if (id > 0) prodMap.set(id, p.nombre || `Producto #${id}`);
    });

    const prodIds = Array.from(prodMap.keys());
    let resenas = [];
    let totalResenas = 0;
    let promedioGlobal = 0;

    if (prodIds.length > 0) {
      const ratingsRes = await apiClient.get(`/resenas/ratings?ids=${prodIds.join(",")}`).catch(() => ({}));
      const ratedIds = Object.entries(ratingsRes || {})
        .filter(([, info]) => Number(info?.total || 0) > 0)
        .map(([id]) => Number(id));

      if (ratedIds.length > 0) {
        const detailResults = await Promise.allSettled(
          ratedIds.map((id) =>
            apiClient.get(`/resenas/producto/${id}`).then((data) => ({
              idProducto: id,
              productoNombre: prodMap.get(id) || `Producto #${id}`,
              resenas: Array.isArray(data?.resenas) ? data.resenas : []
            }))
          )
        );

        const merged = [];
        detailResults.forEach((r) => {
          if (r.status === "fulfilled" && Array.isArray(r.value.resenas)) {
            r.value.resenas.forEach((rev) => {
              merged.push({
                ...rev,
                idProducto: r.value.idProducto,
                productoNombre: rev.productoNombre || r.value.productoNombre
              });
            });
          }
        });

        merged.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
        resenas = merged;
        totalResenas = merged.length;
        promedioGlobal = totalResenas > 0
          ? Math.round((merged.reduce((acc, r) => acc + Number(r.puntuacion || 0), 0) / totalResenas) * 10) / 10
          : 0;
      }
    }

    const observaciones = extractLiveObservacionesFromVentas(ventas);
    return { promedioGlobal, totalResenas, resenas, observaciones };
  }
};
