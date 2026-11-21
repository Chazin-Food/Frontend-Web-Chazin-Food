import { useState, useEffect, useCallback, useMemo } from "react";
import { ventasService } from "../servicios/ventasService";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { matchVentaMultiCriteria } from "@/shared/utils/searchUtils";
import { recordLocalDeliveryTimeMode } from "@/features/produccion/utils/tiempoProduccionUtils";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const VENTAS_URL_DEFAULTS = {
  tab: "pedidos_pagados",
  vista: "table",
  q: "",
  estado: "Todos",
  periodo: "personalizado",
  fecha: "",
  desde: "",
  hasta: "",
  pago: "Todos",
  origen: "Todos",
  entrega: "Todos",
  fidelidad: "Todos",
  min: "",
  max: "",
  page: 1,
  limit: 10
};

export function useGestionVentas() {
  const notify = useNotifications();
  const { filters, setFilter, setFilters } = useUrlFilters(VENTAS_URL_DEFAULTS);

  const [ventas, setVentas] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [serverPaginated, setServerPaginated] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // URL como única fuente de la verdad para filtros, pestañas y paginación
  const activeTab = filters.tab;
  const historialViewMode = filters.vista;
  const searchTerm = filters.q;
  const filterEstado = filters.estado;
  const selectedPeriod = filters.periodo;
  const filterFecha = filters.fecha;
  const filterFechaInicio = filters.desde;
  const filterFechaFin = filters.hasta;
  const filterMetodoPago = filters.pago;
  const filterOrigen = filters.origen;
  const filterTipoEntrega = filters.entrega;
  const filterFidelidad = filters.fidelidad;
  const montoMin = filters.min;
  const montoMax = filters.max;
  const currentPage = filters.page;
  const pageSize = filters.limit;

  const setActiveTab = useCallback((v) => setFilters({ tab: v, page: 1 }), [setFilters]);
  const setHistorialViewMode = useCallback((v) => setFilter("vista", v, { resetPage: false }), [setFilter]);
  const setSearchTerm = useCallback((v) => setFilter("q", v), [setFilter]);
  const setFilterEstado = useCallback((v) => setFilter("estado", v), [setFilter]);
  const setSelectedPeriod = useCallback((v) => setFilter("periodo", v), [setFilter]);
  const setFilterFecha = useCallback((v) => setFilter("fecha", v), [setFilter]);
  const setFilterFechaInicio = useCallback((v) => setFilter("desde", v), [setFilter]);
  const setFilterFechaFin = useCallback((v) => setFilter("hasta", v), [setFilter]);
  const setFilterMetodoPago = useCallback((v) => setFilter("pago", v), [setFilter]);
  const setFilterOrigen = useCallback((v) => setFilter("origen", v), [setFilter]);
  const setFilterTipoEntrega = useCallback((v) => setFilter("entrega", v), [setFilter]);
  const setFilterFidelidad = useCallback((v) => setFilter("fidelidad", v), [setFilter]);
  const setMontoMin = useCallback((v) => setFilter("min", v), [setFilter]);
  const setMontoMax = useCallback((v) => setFilter("max", v), [setFilter]);
  const setCurrentPage = useCallback((v) => setFilter("page", v, { resetPage: false }), [setFilter]);
  const setPageSize = useCallback((v) => setFilters({ limit: v, page: 1 }), [setFilters]);

  // Debounce ligero del texto de búsqueda para consultas SQL paginadas
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const hasClientOnlyFilters = Boolean(
    filterFecha ||
    filterFidelidad !== "Todos" ||
    montoMin !== "" ||
    montoMax !== ""
  );

  // Paginación real en servidor cuando estamos en la tabla principal o historial sin filtros exclusivos de cliente
  const shouldUseServerPagination =
    (activeTab === "pedidos_pagados" || activeTab === "historial") &&
    !hasClientOnlyFilters;

  const fetchVentas = useCallback(async () => {
    try {
      setLoading(true);
      const validInicio = /^\d{4}-\d{2}-\d{2}$/.test(filterFechaInicio) ? filterFechaInicio : undefined;
      const validFin = /^\d{4}-\d{2}-\d{2}$/.test(filterFechaFin) ? filterFechaFin : undefined;
      const useCustomDates = selectedPeriod === "personalizado" && (validInicio || validFin);
      const effectiveEstado =
        activeTab === "historial" && filterEstado === "Todos"
          ? "Completada"
          : filterEstado;

      const baseQueryParams = {
        periodo: selectedPeriod,
        ...(useCustomDates && validInicio ? { fechaInicio: validInicio } : {}),
        ...(useCustomDates && validFin ? { fechaFin: validFin } : {})
      };

      const listParams = shouldUseServerPagination
        ? {
            ...baseQueryParams,
            ...(effectiveEstado && effectiveEstado !== "Todos" ? { estado: effectiveEstado } : {}),
            ...(filterOrigen && filterOrigen !== "Todos" ? { origen: filterOrigen } : {}),
            ...(filterTipoEntrega && filterTipoEntrega !== "Todos" ? { tipoEntrega: filterTipoEntrega } : {}),
            ...(filterMetodoPago && filterMetodoPago !== "Todos" ? { metodoPago: filterMetodoPago } : {}),
            ...(debouncedSearch && debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            page: currentPage,
            limit: pageSize
          }
        : baseQueryParams;

      const [resList, statsData] = await Promise.all([
        ventasService.getVentas(listParams),
        ventasService.getStats(baseQueryParams).catch(() => null)
      ]);

      if (resList && !Array.isArray(resList) && Array.isArray(resList.data)) {
        setVentas(resList.data);
        setPagination(resList.pagination || { total: resList.data.length, page: currentPage, limit: pageSize, totalPages: 1 });
        setServerPaginated(true);
      } else {
        const arr = Array.isArray(resList) ? resList : [];
        setVentas(arr);
        setPagination({ total: arr.length, page: currentPage, limit: pageSize, totalPages: Math.max(1, Math.ceil(arr.length / pageSize)) });
        setServerPaginated(false);
      }
      setStats(statsData);
    } catch (err) {
      console.error(err);
      notify.error("Error", err.message || "Error al cargar historial de ventas");
    } finally {
      setLoading(false);
    }
  }, [
    selectedPeriod,
    filterFechaInicio,
    filterFechaFin,
    activeTab,
    filterEstado,
    filterOrigen,
    filterTipoEntrega,
    filterMetodoPago,
    debouncedSearch,
    currentPage,
    pageSize,
    shouldUseServerPagination
  ]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  // Filtrado multicriterio (si ya vino paginado desde SQL, devolvemos el slice servidor tal cual)
  const filteredVentas = useMemo(() => {
    if (serverPaginated) return ventas;
    const criteria = {
      searchTerm,
      filterEstado,
      filterFecha,
      filterFechaInicio,
      filterFechaFin,
      filterMetodoPago,
      filterOrigen,
      filterTipoEntrega,
      filterFidelidad,
      montoMin,
      montoMax
    };

    return ventas.filter((v) => matchVentaMultiCriteria(v, criteria));
  }, [
    serverPaginated,
    ventas,
    searchTerm,
    filterEstado,
    filterFecha,
    filterFechaInicio,
    filterFechaFin,
    filterMetodoPago,
    filterOrigen,
    filterTipoEntrega,
    filterFidelidad,
    montoMin,
    montoMax
  ]);

  const clearAllFilters = useCallback(() => {
    setFilters({
      q: "",
      estado: "Todos",
      fecha: "",
      desde: "",
      hasta: "",
      pago: "Todos",
      origen: "Todos",
      entrega: "Todos",
      fidelidad: "Todos",
      min: "",
      max: "",
      page: 1
    });
  }, [setFilters]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      filterEstado !== "Todos" ||
      filterFecha !== "" ||
      filterFechaInicio !== "" ||
      filterFechaFin !== "" ||
      filterMetodoPago !== "Todos" ||
      filterOrigen !== "Todos" ||
      filterTipoEntrega !== "Todos" ||
      filterFidelidad !== "Todos" ||
      montoMin !== "" ||
      montoMax !== ""
    );
  }, [
    searchTerm,
    filterEstado,
    filterFecha,
    filterFechaInicio,
    filterFechaFin,
    filterMetodoPago,
    filterOrigen,
    filterTipoEntrega,
    filterFidelidad,
    montoMin,
    montoMax
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim() !== "") count++;
    if (filterEstado !== "Todos") count++;
    if (filterFecha !== "") count++;
    if (filterFechaInicio !== "" || filterFechaFin !== "") count++;
    if (filterMetodoPago !== "Todos") count++;
    if (filterOrigen !== "Todos") count++;
    if (filterTipoEntrega !== "Todos") count++;
    if (filterFidelidad !== "Todos") count++;
    if (montoMin !== "" || montoMax !== "") count++;
    return count;
  }, [
    searchTerm,
    filterEstado,
    filterFecha,
    filterFechaInicio,
    filterFechaFin,
    filterMetodoPago,
    filterOrigen,
    filterTipoEntrega,
    filterFidelidad,
    montoMin,
    montoMax
  ]);

  const createVenta = async (data) => {
    try {
      await ventasService.createVenta(data);
      notify.success("Venta registrada", "La venta fue procesada exitosamente");
      await fetchVentas();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "Error al registrar la venta");
      return false;
    }
  };

  const updateEstado = async (id, nuevoEstado) => {
    try {
      await ventasService.updateEstadoVenta(id, nuevoEstado);
      notify.success("Estado actualizado", `La venta pasó a estado ${nuevoEstado}`);
      await fetchVentas();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "Error al actualizar estado");
      return false;
    }
  };

  const cancelarVenta = async (id) => {
    const confirmed = await notify.confirmAction(
      "¿Anular venta?",
      "¿Estás seguro de que deseas anular esta factura de venta?",
      "Sí, anular"
    );
    if (!confirmed) return false;
    try {
      await ventasService.cancelarVenta(id);
      notify.success("Venta anulada", "La venta ha sido anulada");
      await fetchVentas();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "Error al anular la venta");
      return false;
    }
  };

  const updateTiempoEntrega = async (id, tiempoEstimado, modo = "MANUAL") => {
    try {
      const modoNormalizado = String(modo || "MANUAL").toUpperCase() === "AUTO" ? "AUTO" : "MANUAL";
      recordLocalDeliveryTimeMode(id, modoNormalizado, tiempoEstimado);
      setVentas((prev) =>
        prev.map((v) =>
          (v.id || v.idVenta) === id
            ? { ...v, tiempoEstimadoEntrega: tiempoEstimado, modoTiempoEntrega: modoNormalizado }
            : v
        )
      );
      await ventasService.updateTiempoEntrega(id, tiempoEstimado, modoNormalizado);
      if (modoNormalizado === "AUTO") {
        notify.success(
          "Modo Automático activado",
          `El tiempo estimado se sincronizó automáticamente en ${tiempoEstimado} según receta y cocina.`
        );
      } else {
        notify.success(
          "Tiempo manual guardado",
          `El tiempo de entrega/despacho se fijó manualmente en ${tiempoEstimado}.`
        );
      }
      await fetchVentas();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "Error al actualizar tiempo estimado");
      return false;
    }
  };

  const aprobarPago = async (id) => {
    try {
      await ventasService.aprobarPago(id);
      notify.success("Pago Aprobado", "El pago ha sido aprobado y la comanda avanzó automáticamente a cocina.");
      await fetchVentas();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "Error al aprobar el pago");
      return false;
    }
  };

  return {
    ventas,
    filteredVentas,
    pagination,
    serverPaginated,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    activeTab,
    setActiveTab,
    historialViewMode,
    setHistorialViewMode,
    stats,
    loading,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    selectedPeriod,
    setSelectedPeriod,
    filterFecha,
    setFilterFecha,
    filterFechaInicio,
    setFilterFechaInicio,
    filterFechaFin,
    setFilterFechaFin,
    filterMetodoPago,
    setFilterMetodoPago,
    filterOrigen,
    setFilterOrigen,
    filterTipoEntrega,
    setFilterTipoEntrega,
    filterFidelidad,
    setFilterFidelidad,
    montoMin,
    setMontoMin,
    montoMax,
    setMontoMax,
    clearAllFilters,
    hasActiveFilters,
    activeFiltersCount,
    refetch: fetchVentas,
    createVenta,
    updateEstado,
    updateTiempoEntrega,
    cancelarVenta,
    aprobarPago
  };
}
