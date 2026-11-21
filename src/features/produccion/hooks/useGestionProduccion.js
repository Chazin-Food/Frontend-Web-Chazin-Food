import { useState, useEffect, useCallback, useRef } from "react";
import { produccionService } from "../servicios/produccionService";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import {
  recordLocalOrderTransition,
  getLocalOrderTransition
} from "../utils/tiempoProduccionUtils";
import { matchesSmartSearch, formatStatusTokens } from "@/shared/utils/searchUtils";

const PRODUCCION_URL_DEFAULTS = {
  q: "",
  estado: "Todos",
  page: 1,
  limit: 5
};

export function useGestionProduccion() {
  const { user } = useAuth();
  const notify = useNotifications();
  const { filters, setFilter, setFilters } = useUrlFilters(PRODUCCION_URL_DEFAULTS);

  const [ordenes, setOrdenes] = useState([]);
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

  const isFetchingRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);

  const fetchOrdenes = useCallback(async (isSilent = false) => {
    if (isSilent && (isFetchingRef.current || (typeof document !== "undefined" && document.hidden))) {
      return;
    }
    isFetchingRef.current = true;
    try {
      if (!isSilent) setLoading(true);
      const res = await produccionService.getOrdenes({
        page: currentPage,
        limit: pageSize,
        estado: filterEstado,
        search: debouncedSearch
      });

      const rawList = res && !Array.isArray(res) && Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res) ? res : []);

      const merged = rawList.map((o) => {
        const local = getLocalOrderTransition(o.id || o.idVenta);
        if (!local) return o;

        const mergedTiempos = {
          ...(o.tiemposEstados || {}),
          ...(local.tiemposEstados || {})
        };

        let resolvedEstado = o.estado;
        if (
          local.estadoActual === "Despachado" &&
          !local.tiemposEstados?.entregado &&
          (o.estado === "Entregado" || o.estado === "Listo")
        ) {
          resolvedEstado = "Despachado";
        }

        return {
          ...o,
          estado: resolvedEstado,
          tiemposEstados: mergedTiempos,
          fechaCambioEstado: local.updatedAt || o.fechaCambioEstado
        };
      });

      setOrdenes(merged);
      if (res && !Array.isArray(res) && res.pagination) {
        setPagination(res.pagination);
        setSummary(res.summary || null);
        setServerPaginated(true);
      } else {
        setPagination({ total: merged.length, page: currentPage, limit: pageSize, totalPages: Math.max(1, Math.ceil(merged.length / pageSize)) });
        setSummary(null);
        setServerPaginated(false);
      }
      consecutiveFailuresRef.current = 0;
    } catch (err) {
      consecutiveFailuresRef.current = Math.min(consecutiveFailuresRef.current + 1, 3);
      if (!isSilent) {
        console.error(err);
        notify.error("Error", err.message || "Error al cargar órdenes de producción");
      }
    } finally {
      isFetchingRef.current = false;
      if (!isSilent) setLoading(false);
    }
  }, [currentPage, pageSize, filterEstado, debouncedSearch]);

  useEffect(() => {
    let active = true;
    let timerId = null;

    const scheduleNext = () => {
      if (!active) return;
      const delayMs = 20000 * Math.min(3, 1 + consecutiveFailuresRef.current);
      timerId = setTimeout(async () => {
        if (!active) return;
        await fetchOrdenes(true);
        scheduleNext();
      }, delayMs);
    };

    fetchOrdenes().finally(() => {
      scheduleNext();
    });

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [fetchOrdenes]);

  // Si el servidor ya filtró y paginó el slice, devolverlo directamente
  const filteredOrdenes = serverPaginated
    ? ordenes
    : ordenes.filter((o) => {
    const hasSearch = Boolean(searchTerm && searchTerm.trim());

    const prodsString = Array.isArray(o.productos)
      ? o.productos
          .map(
            (p) =>
              `${p.nombre || ""} ${p.observaciones || ""} ${(p.adiciones || [])
                .map((a) => (typeof a === "object" ? a.nombre : a))
                .join(" ")}`
          )
          .join(" ")
      : "";

    const hasObs = Boolean(o.observaciones && String(o.observaciones).trim());
    const obsText = hasObs ? o.observaciones : "sin_observaciones sin observaciones";
    const hasMesa = Boolean(o.mesa && String(o.mesa).trim());
    const mesaText = hasMesa ? `mesa ${o.mesa} #${o.mesa}` : "sin_mesa sin mesa para llevar llevar recoger domicilio";
    const hasCook = Boolean((o.cocinero || o.responsable) && String(o.cocinero || o.responsable).trim());
    const cookText = hasCook ? `${o.cocinero || ""} ${o.responsable || ""}` : "sin_cocinero sin cocinero sin_responsable sin responsable";

    const matchSearch = matchesSmartSearch(
      [
        o.codigo,
        o.id,
        String(o.id ?? ""),
        `#${o.id}`,
        o.platilloNombre,
        o.cliente,
        o.responsable,
        o.cocinero,
        cookText,
        formatStatusTokens(o.estado),
        o.horaInicio,
        o.horaEstado,
        o.fecha,
        o.tiempo,
        o.mesa,
        mesaText,
        o.tipo,
        o.cantidad,
        String(o.cantidad ?? ""),
        `${o.cantidad ?? 0} unidades`,
        o.prioridad ? `turno #${o.prioridad}` : "",
        o.observaciones,
        obsText,
        prodsString
      ],
      searchTerm
    );

    const matchEstado = !hasSearch ? (filterEstado === "Todos" || o.estado === filterEstado) : true;
    return matchSearch && matchEstado;
  });

  const createOrden = async (data) => {
    try {
      await produccionService.createOrden(data);
      notify.success("Orden Creada", "Orden de producción registrada con éxito");
      await fetchOrdenes();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "Error al registrar la orden");
      return false;
    }
  };

  const updateEstado = async (id, nuevoEstado, extraData = {}) => {
    try {
      const cookName = user?.nombre
        ? `${user.nombre} ${user.apellidos || ""}`.trim()
        : "Chef en Turno";

      const payload = {
        ...extraData,
        cocinero: extraData?.cocinero || cookName,
        responsableCocina: extraData?.cocinero || cookName
      };

      const targetOrder = ordenes.find((o) => String(o.id || o.idVenta) === String(id)) || null;
      const recordedLocal = recordLocalOrderTransition(id, nuevoEstado, targetOrder);

      // Actualización optimista inmediata con el registro exacto de hora del nuevo estado
      setOrdenes((prev) =>
        prev.map((o) => {
          if (String(o.id || o.idVenta) !== String(id)) return o;
          return {
            ...o,
            estado: nuevoEstado,
            cocinero: payload.cocinero,
            responsableCocina: payload.responsableCocina,
            fechaCambioEstado: recordedLocal?.updatedAt || new Date().toISOString(),
            tiemposEstados: {
              ...(o.tiemposEstados || {}),
              ...(recordedLocal?.tiemposEstados || {})
            }
          };
        })
      );

      await produccionService.updateEstadoOrden(id, nuevoEstado, payload);
      if (extraData?.checklistPreparacion) {
        if (extraData.pedidoCompleto) {
          notify.success(
            "Pedido Completo (✅)",
            `La orden pasó a "${nuevoEstado}" con todos los productos verificados.`
          );
        } else {
          notify.warning(
            "Pedido Incompleto Registrado",
            `La orden pasó a "${nuevoEstado}" registrando las novedades del checklist.`
          );
        }
      } else {
        notify.success("Estado Actualizado", `La orden pasó a estado "${nuevoEstado}"`);
      }
      await fetchOrdenes(true);
      return true;
    } catch (err) {
      notify.error("Error", err.message || "Error al actualizar estado");
      return false;
    }
  };

  const deleteOrden = async (id) => {
    try {
      await produccionService.deleteOrden(id);
      notify.success("Orden Eliminada", "La orden fue eliminada de producción");
      await fetchOrdenes();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "Error al eliminar orden");
      return false;
    }
  };

  return {
    ordenes,
    filteredOrdenes,
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
    refetch: fetchOrdenes,
    createOrden,
    updateEstado,
    deleteOrden
  };
}
