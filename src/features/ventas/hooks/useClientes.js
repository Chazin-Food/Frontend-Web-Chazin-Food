import { useState, useEffect, useCallback, useMemo } from "react";
import { clientesService } from "../servicios/clientesService";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { matchClienteMultiCriteria } from "@/shared/utils/searchUtils";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";

const CLIENTES_URL_DEFAULTS = {
  q: "",
  tipo: "Todos",
  estado: "Todos",
  comprasMin: "",
  min: "",
  max: "",
  page: 1,
  limit: 10
};

export function useClientes() {
  const notify = useNotifications();
  const { filters, setFilter, setFilters } = useUrlFilters(CLIENTES_URL_DEFAULTS);

  const [clientes, setClientes] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [serverPaginated, setServerPaginated] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // URL como única fuente de la verdad
  const searchTerm = filters.q;
  const filterTipo = filters.tipo;
  const filterEstado = filters.estado;
  const comprasMin = filters.comprasMin;
  const montoMin = filters.min;
  const montoMax = filters.max;
  const currentPage = filters.page;
  const pageSize = filters.limit;

  const setSearchTerm = useCallback((v) => setFilter("q", v), [setFilter]);
  const setFilterTipo = useCallback((v) => setFilter("tipo", v), [setFilter]);
  const setFilterEstado = useCallback((v) => setFilter("estado", v), [setFilter]);
  const setComprasMin = useCallback((v) => setFilter("comprasMin", v), [setFilter]);
  const setMontoMin = useCallback((v) => setFilter("min", v), [setFilter]);
  const setMontoMax = useCallback((v) => setFilter("max", v), [setFilter]);
  const setCurrentPage = useCallback((v) => setFilter("page", v, { resetPage: false }), [setFilter]);
  const setPageSize = useCallback((v) => setFilters({ limit: v, page: 1 }), [setFilters]);

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const hasClientOnlyFilters = Boolean(comprasMin !== "" || montoMin !== "" || montoMax !== "");

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const listParams = !hasClientOnlyFilters
        ? {
            page: currentPage,
            limit: pageSize,
            ...(debouncedSearch && debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
            ...(filterTipo && filterTipo !== "Todos" ? { tipo: filterTipo } : {}),
            ...(filterEstado && filterEstado !== "Todos" ? { estado: filterEstado } : {})
          }
        : {};
      const [resList, statsData] = await Promise.all([
        clientesService.getClientes(listParams),
        clientesService.getStats().catch(() => null)
      ]);
      if (resList && !Array.isArray(resList) && Array.isArray(resList.data)) {
        setClientes(resList.data);
        setPagination(resList.pagination || { total: resList.data.length, page: currentPage, limit: pageSize, totalPages: 1 });
        setServerPaginated(true);
      } else {
        const arr = Array.isArray(resList) ? resList : [];
        setClientes(arr);
        setPagination({ total: arr.length, page: currentPage, limit: pageSize, totalPages: Math.max(1, Math.ceil(arr.length / pageSize)) });
        setServerPaginated(false);
      }
      setStats(statsData);
    } catch (err) {
      console.error(err);
      notify.error("Error", err.message || "Error al cargar lista de clientes");
    } finally {
      setLoading(false);
    }
  }, [hasClientOnlyFilters, currentPage, pageSize, debouncedSearch, filterTipo, filterEstado]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Filtrado multicriterio exhaustivo (si ya vino paginado del servidor, usarlo directo)
  const filteredClientes = useMemo(() => {
    if (serverPaginated) return clientes;
    const criteria = {
      searchTerm,
      filterTipo,
      filterEstado,
      comprasMin,
      montoMin,
      montoMax
    };

    return clientes.filter((c) => matchClienteMultiCriteria(c, criteria));
  }, [serverPaginated, clientes, searchTerm, filterTipo, filterEstado, comprasMin, montoMin, montoMax]);

  const clearAllFilters = useCallback(() => {
    setFilters({
      q: "",
      tipo: "Todos",
      estado: "Todos",
      comprasMin: "",
      min: "",
      max: "",
      page: 1
    });
  }, [setFilters]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      filterTipo !== "Todos" ||
      filterEstado !== "Todos" ||
      comprasMin !== "" ||
      montoMin !== "" ||
      montoMax !== ""
    );
  }, [searchTerm, filterTipo, filterEstado, comprasMin, montoMin, montoMax]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim() !== "") count++;
    if (filterTipo !== "Todos") count++;
    if (filterEstado !== "Todos") count++;
    if (comprasMin !== "") count++;
    if (montoMin !== "" || montoMax !== "") count++;
    return count;
  }, [searchTerm, filterTipo, filterEstado, comprasMin, montoMin, montoMax]);

  const createCliente = async (data) => {
    try {
      await clientesService.createCliente(data);
      notify.success("Cliente registrado", "El cliente fue registrado exitosamente");
      await fetchClientes();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo registrar al cliente");
      return false;
    }
  };

  const updateCliente = async (id, data) => {
    try {
      await clientesService.updateCliente(id, data);
      notify.success("Cliente actualizado", "Los datos fueron actualizados correctamente");
      await fetchClientes();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo actualizar el cliente");
      return false;
    }
  };

  const deleteCliente = async (id, nombre, comprasCount = 0) => {
    // Si tiene ventas asociadas, se bloquea la eliminación totalmente para proteger los registros contables
    if (comprasCount > 0) {
      notify.warning(
        "No se puede eliminar",
        `El cliente "${nombre}" cuenta con ${comprasCount} ${comprasCount === 1 ? 'venta asociada' : 'ventas asociadas'}. Por integridad contable, solo puedes cambiar su estado a Inactivo.`
      );
      return false;
    }

    const confirmed = await notify.confirmDelete(
      "¿Eliminar cliente?",
      `¿Estás seguro de que deseas eliminar a "${nombre}"?`
    );
    if (!confirmed) return false;
    try {
      await clientesService.deleteCliente(id);
      notify.success("Cliente eliminado", "El cliente ha sido eliminado");
      await fetchClientes();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo eliminar al cliente");
      return false;
    }
  };

  return {
    clientes,
    filteredClientes,
    pagination,
    serverPaginated,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    stats,
    loading,
    searchTerm,
    setSearchTerm,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    comprasMin,
    setComprasMin,
    montoMin,
    setMontoMin,
    montoMax,
    setMontoMax,
    clearAllFilters,
    hasActiveFilters,
    activeFiltersCount,
    refetch: fetchClientes,
    createCliente,
    updateCliente,
    deleteCliente
  };
}
