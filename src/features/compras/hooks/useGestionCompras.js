import { useState, useEffect, useCallback, useMemo } from "react";
import { comprasService } from "../servicios/comprasService";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { matchesSmartSearch, formatStatusTokens, formatIdTokens, formatCurrencyTokens, rankSearchResults, normalizeSearchText } from "@/shared/utils/searchUtils";
import { COLOMBIA_TZ, parseDateOnlySafe } from "@/shared/utils/dateUtils";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const COMPRAS_URL_DEFAULTS = {
  q: "",
  estado: "Todos",
  page: 1,
  limit: 5
};

export function useGestionCompras() {
  const notify = useNotifications();
  const { filters, setFilter, setFilters } = useUrlFilters(COMPRAS_URL_DEFAULTS);

  const [compras, setCompras] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 5, totalPages: 1 });
  const [summary, setSummary] = useState(null);
  const [serverPaginated, setServerPaginated] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchTerm = filters.q;
  const filterEstado = filters.estado;
  const currentPage = filters.page;
  const pageSize = filters.limit;

  const setSearchTerm = useCallback((v) => setFilter("q", v), [setFilter]);
  const setFilterEstado = useCallback((v) => setFilter("estado", v), [setFilter]);
  const setCurrentPage = useCallback((v) => setFilter("page", v, { resetPage: false }), [setFilter]);
  const setPageSize = useCallback((v) => setFilters({ limit: v, page: 1 }), [setFilters]);

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const hasClientSearch = Boolean(debouncedSearch && debouncedSearch.trim());
  const serverPage = hasClientSearch ? 1 : currentPage;
  const serverLimit = hasClientSearch ? 0 : pageSize;
  const serverEstado = hasClientSearch ? "Todos" : filterEstado;

  const fetchCompras = useCallback(async () => {
    try {
      setLoading(true);
      // Cuando el usuario busca texto, traer el conjunto completo una sola vez para filtrar al instante en cliente con searchUtils
      const requestParams = hasClientSearch
        ? {}
        : {
            page: serverPage,
            limit: serverLimit,
            estado: serverEstado
          };
      const res = await comprasService.getCompras(requestParams);
      if (!hasClientSearch && res && !Array.isArray(res) && Array.isArray(res.data)) {
        setCompras(res.data);
        setPagination(res.pagination || { total: res.data.length, page: serverPage, limit: serverLimit, totalPages: 1 });
        setSummary(res.summary || null);
        setServerPaginated(true);
      } else {
        const arr = res && !Array.isArray(res) && Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res) ? res : []);
        setCompras(arr);
        setPagination({ total: arr.length, page: 1, limit: pageSize, totalPages: Math.max(1, Math.ceil(arr.length / pageSize)) });
        setSummary((res && !Array.isArray(res) && res.summary) ? res.summary : null);
        setServerPaginated(false);
      }
    } catch (err) {
      console.error(err);
      notify.error("Error", err.message || "Error al cargar las compras");
    } finally {
      setLoading(false);
    }
  }, [hasClientSearch, serverPage, serverLimit, serverEstado]);

  useEffect(() => {
    fetchCompras();
  }, [fetchCompras]);

  const filteredCompras = useMemo(() => {
    if (serverPaginated) return compras;
    const hasSearch = Boolean(searchTerm && searchTerm.trim());

    const list = compras.filter((c) => {
      // 1. Filtro por estado (anulado si el usuario escribe en el buscador)
      const matchEstado =
        filterEstado === "Todos" ||
        c.estado === filterEstado ||
        (filterEstado === "RECIBIDA" && (c.estado === "COMPLETADA" || c.estado === "RECIBIDA")) ||
        (filterEstado === "CANCELADA" && (c.estado === "CANCELADA" || c.estado === "ANULADA"));

      if (!hasSearch && !matchEstado) return false;

      // 2. Filtro de búsqueda exhaustiva
      if (!hasSearch) return true;

      // Recopilar todos los textos de la compra de manera segura
      const searchTokens = [];

      // IDs y códigos (con #, -, /, OC-XXXX)
      const compraId = c.id || c.idCompra;
      if (compraId !== undefined && compraId !== null) {
        searchTokens.push(...formatIdTokens(compraId));
        searchTokens.push(`OC-${String(compraId).padStart(4, "0")}`);
      }
      if (c.numeroFactura) {
        searchTokens.push(String(c.numeroFactura));
      } else {
        searchTokens.push("sin_factura sin factura");
      }

      // Proveedor y tipo de proveedor
      const provNombre = c.proveedorNombre || (typeof c.proveedor === "string" ? c.proveedor : c.proveedor?.nombre) || "";
      if (provNombre && !["Proveedor Genérico", "Proveedor Desconocido", "Sin proveedor"].includes(provNombre)) {
        searchTokens.push(provNombre);
      } else {
        searchTokens.push("Sin proveedor", "sin_proveedor sin proveedor compra_directa sin_prov directa");
      }
      if (c.proveedor && typeof c.proveedor === "object") {
        if (c.proveedor.tipoProveedor) searchTokens.push(String(c.proveedor.tipoProveedor));
        if (c.proveedor.tipoPersona) searchTokens.push(String(c.proveedor.tipoPersona));
        if (c.proveedor.nombreContacto) searchTokens.push(String(c.proveedor.nombreContacto));
        if (c.proveedor.telefono) searchTokens.push(String(c.proveedor.telefono));
        if (c.proveedor.correo) searchTokens.push(String(c.proveedor.correo));
        if (c.proveedor.nit) searchTokens.push(String(c.proveedor.nit));
      }

      // Estado y etiqueta visible renderizada en tabla (Confirmada, Devuelta Parcial, Cancelada, Anulada)
      if (c.estado !== undefined && c.estado !== null) {
        const estUp = String(c.estado).toUpperCase();
        const renderedLabel =
          estUp === "RECIBIDA" || estUp === "COMPLETADA"
            ? "Confirmada"
            : estUp === "DEVUELTA_PARCIAL"
            ? "Devuelta Parcial"
            : estUp === "CANCELADA"
            ? "Cancelada"
            : estUp === "ANULADA"
            ? "Anulada"
            : String(c.estado);
        searchTokens.push(renderedLabel, formatStatusTokens(c.estado));
      }

      // Totales y montos numéricos flexibles ($ / sin $ / con puntos / sin puntos)
      if (c.total !== undefined && c.total !== null) {
        searchTokens.push(...formatCurrencyTokens(c.total));
      }
      if (c.subtotal) searchTokens.push(...formatCurrencyTokens(c.subtotal));
      if (c.iva) searchTokens.push(...formatCurrencyTokens(c.iva));

      // Cantidad de ítems y lista de insumos incluidos
      const detallesList = Array.isArray(c.detalles) ? c.detalles : (Array.isArray(c.items) ? c.items : []);
      const numItems = detallesList.length;
      if (numItems > 0) {
        searchTokens.push(String(numItems), `${numItems} ${numItems === 1 ? "ítem" : "ítems"}`, `${numItems} item`, `${numItems} items`);
      }

      // Fechas (compra, factura, cancelación)
      const procesarFecha = (f) => {
        if (!f) return;
        searchTokens.push(String(f));
        const d = parseDateOnlySafe(f);
        if (d && !isNaN(d.getTime())) {
          searchTokens.push(
            d.toLocaleDateString("es-CO", { timeZone: COLOMBIA_TZ }),
            d.toLocaleDateString("es-CO", { timeZone: COLOMBIA_TZ, day: "2-digit", month: "2-digit", year: "numeric" }),
            d.toLocaleDateString("es-CO", { timeZone: COLOMBIA_TZ, day: "2-digit", month: "short", year: "numeric" }),
            d.toLocaleDateString("es-CO", { timeZone: COLOMBIA_TZ, month: "long" })
          );
        }
      };
      procesarFecha(c.fechaCompra || c.fecha);
      procesarFecha(c.fechaFactura);
      procesarFecha(c.fechaCancelacion);

      // Insumos y lotes incluidos en la compra
      if (detallesList.length > 0) {
        detallesList.forEach((d) => {
          if (d.insumo?.nombre) searchTokens.push(d.insumo.nombre);
          if (d.insumoNombre) searchTokens.push(d.insumoNombre);
          if (d.nombre) searchTokens.push(d.nombre);
          if (d.insumo?.unidadMedida) searchTokens.push(d.insumo.unidadMedida);
          if (d.numeroLote) searchTokens.push(String(d.numeroLote));
          if (d.cantidad) searchTokens.push(String(d.cantidad));
          if (d.precioUnitario) searchTokens.push(...formatCurrencyTokens(d.precioUnitario));
          if (Array.isArray(d.lotes)) {
            d.lotes.forEach((l) => {
              if (l.numeroLote) searchTokens.push(String(l.numeroLote));
            });
          }
        });
      }

      if (Array.isArray(c.lotes)) {
        c.lotes.forEach((l) => {
          if (l.numeroLote) searchTokens.push(String(l.numeroLote));
        });
      }

      // Motivo de cancelación y usuario responsable
      if (c.motivoCancelacion) searchTokens.push(String(c.motivoCancelacion));
      if (c.usuarioCancelacionNombre) searchTokens.push(String(c.usuarioCancelacionNombre));
      if (c.detallesCancelacion) {
        if (typeof c.detallesCancelacion === "string") {
          searchTokens.push(c.detallesCancelacion);
        } else if (typeof c.detallesCancelacion === "object") {
          if (c.detallesCancelacion.motivoGeneral) searchTokens.push(String(c.detallesCancelacion.motivoGeneral));
          if (c.detallesCancelacion.observaciones) searchTokens.push(String(c.detallesCancelacion.observaciones));
          if (c.detallesCancelacion.tipoOperacion) searchTokens.push(String(c.detallesCancelacion.tipoOperacion));
        }
      }

      // Comparar término(s) de búsqueda con normalización y multi-token inteligente
      return matchesSmartSearch(searchTokens, searchTerm);
    });

    if (!hasSearch) {
      return list;
    }

    return rankSearchResults(list, searchTerm, (c, normQuery) => {
      let extra = 0;
      const numFac = normalizeSearchText(c.numeroFactura || "");
      if (numFac) {
        if (numFac === normQuery) extra += 2500;
        else if (numFac.startsWith(normQuery)) extra += 1500;
        else if (numFac.includes(normQuery)) extra += 800;
      }

      const idComp = String(c.id || c.idCompra || "");
      if (idComp === normQuery || `#${idComp}` === normQuery) extra += 2000;

      const provNombre = normalizeSearchText(c.proveedorNombre || (typeof c.proveedor === "string" ? c.proveedor : c.proveedor?.nombre) || "");
      if (provNombre) {
        if (provNombre === normQuery) extra += 1800;
        else if (provNombre.startsWith(normQuery)) extra += 1000;
        else if (provNombre.includes(normQuery)) extra += 500;
      }

      return extra;
    });
  }, [serverPaginated, compras, filterEstado, searchTerm]);

  const createCompra = async (data) => {
    try {
      await comprasService.createCompra(data);
      notify.success("Compra registrada", "La compra se registró exitosamente");
      await fetchCompras();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo registrar la compra");
      return false;
    }
  };

  const updateCompra = async (id, data) => {
    try {
      await comprasService.updateCompra(id, data);
      notify.success("Compra actualizada", "La compra se editó correctamente");
      await fetchCompras();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo actualizar la compra");
      return false;
    }
  };

  const updateEstado = async (id, nuevoEstado) => {
    try {
      await comprasService.updateEstadoCompra(id, nuevoEstado);
      notify.success("Estado actualizado", `La compra ahora está ${nuevoEstado}`);
      await fetchCompras();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo actualizar el estado");
      return false;
    }
  };

  const cancelarCompra = async (id, cancelData = null) => {
    if (!cancelData) {
      const confirmed = await notify.confirmAction(
        "¿Anular compra?",
        "¿Estás seguro de que deseas anular esta compra?",
        "Sí, anular"
      );
      if (!confirmed) return false;
    }
    try {
      await comprasService.cancelarCompra(id, cancelData || {});
      notify.success("Compra anulada", "La compra fue anulada correctamente");
      await fetchCompras();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo anular la compra");
      return false;
    }
  };

  return {
    compras,
    filteredCompras,
    pagination,
    summary,
    serverPaginated,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    loading,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    refetch: fetchCompras,
    createCompra,
    updateCompra,
    updateEstado,
    cancelarCompra
  };
}
