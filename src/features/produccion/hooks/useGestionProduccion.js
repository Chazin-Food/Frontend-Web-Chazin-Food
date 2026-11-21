import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { produccionService } from "../servicios/produccionService";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { useAuth } from "@/features/autenticacion/hooks/useAuth";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import {
  recordLocalOrderTransition,
  getLocalOrderTransition,
  resolveOrderTimings
} from "../utils/tiempoProduccionUtils";
import { matchesSmartSearch, formatStatusTokens, formatIdTokens, extractKitchenSearchTokens } from "@/shared/utils/searchUtils";

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

  const hasClientSearch = Boolean(debouncedSearch && debouncedSearch.trim());
  const serverPage = hasClientSearch ? 1 : currentPage;
  const serverLimit = hasClientSearch ? 0 : pageSize;
  const serverEstado = hasClientSearch ? "Todos" : filterEstado;

  const fetchOrdenes = useCallback(async (isSilent = false) => {
    if (isSilent && (isFetchingRef.current || (typeof document !== "undefined" && document.hidden))) {
      return;
    }
    isFetchingRef.current = true;
    try {
      if (!isSilent) setLoading(true);
      // Cuando hay búsqueda activa, cargar conjunto completo una vez para aplicar searchUtils al instante sin parpadeos
      const requestParams = hasClientSearch
        ? {}
        : {
            page: serverPage,
            limit: serverLimit,
            estado: serverEstado
          };
      const res = await produccionService.getOrdenes(requestParams);

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
      if (!hasClientSearch && res && !Array.isArray(res) && res.pagination) {
        setPagination(res.pagination);
        setSummary(res.summary || null);
        setServerPaginated(true);
      } else {
        setPagination({ total: merged.length, page: 1, limit: pageSize, totalPages: Math.max(1, Math.ceil(merged.length / pageSize)) });
        setSummary((res && !Array.isArray(res) && res.summary) ? res.summary : null);
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
  }, [hasClientSearch, serverPage, serverLimit, serverEstado]);

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

  // Si el servidor ya filtró y paginó el slice (sin búsqueda activa), devolverlo directamente
  const filteredOrdenes = useMemo(() => {
    if (serverPaginated) return ordenes;
    const hasSearch = Boolean(searchTerm && searchTerm.trim());
    const nowMs = Date.now();

    return ordenes.filter((o) => {
      const matchEstado = !hasSearch ? (filterEstado === "Todos" || o.estado === filterEstado) : true;
      if (!matchEstado) return false;
      if (!hasSearch) return true;

      const timings = resolveOrderTimings(o, nowMs);
      const rawModalidad = `${o.tipoEntrega || ""} ${o.tipoVenta || ""} ${o.mesa || ""}`.toLowerCase();
      const isDomicilio = rawModalidad.includes("domicilio") || String(o.origen || "").toUpperCase() === "ONLINE";

      const modalidadTokens = isDomicilio
        ? "Domicilio Delivery Online"
        : "En el local En Local En Mesa Local Presencial";

      // Acción / botón de avance visible en cada fila (espejo exacto de ProduccionTable.getNextStatusConfig)
      let nextActionTokens = "";
      switch (o.estado) {
        case "En Cola":
          nextActionTokens = "En Preparación En preparacion";
          break;
        case "En Preparación":
          nextActionTokens = "Listo Verificar y Listo";
          break;
        case "Listo":
        case "Listos":
          nextActionTokens = isDomicilio
            ? "Despachar Despachar Domicilio"
            : "Marcar Entregado Marcar como entregado Entregado";
          break;
        case "Despachado":
          nextActionTokens = "Entregado Marcar Entregado Marcar como entregado";
          break;
        default:
          nextActionTokens = "Completado Listo";
          break;
      }

      const prodsString = Array.isArray(o.productos)
        ? o.productos
            .map(
              (p) =>
                `${p.nombre || ""} x${p.cantidad || 1} (x${p.cantidad || 1}) ${p.cantidad || 1}x ${p.observaciones || ""} ${(p.adiciones || [])
                  .map((a) => (typeof a === "object" ? a.nombre : a))
                  .join(" ")}`
            )
            .join(" ")
        : "";

      // Tiempos estimados exactos ("Est. 15-20 Min", "Est.: 15-20 min", "15-20", "Min", minutos)
      const timingTokens = [];
      if (timings) {
        if (timings.tiempoPreparacion) {
          timingTokens.push(timings.tiempoPreparacion, String(timings.tiempoPreparacion).replace(/\bmin\b/gi, "minutos"));
        }
        if (timings.horaPedido) timingTokens.push(timings.horaPedido, `Pedido: ${timings.horaPedido}`);
        if (timings.fechaColombia) timingTokens.push(timings.fechaColombia);
        if (timings.elapsedInfo?.text) timingTokens.push(timings.elapsedInfo.text);
        if (timings.etiquetaHoraEstado) timingTokens.push(timings.etiquetaHoraEstado);
        if (timings.tiempoEstimadoEntrega) {
          const estVal = String(timings.tiempoEstimadoEntrega).trim();
          timingTokens.push(
            estVal,
            `Est. ${estVal}`,
            `Est.: ${estVal}`,
            estVal.replace(/\bmin\b/gi, "minutos"),
            "Est.",
            "Min",
            "minutos"
          );
          const rangeMatch = estVal.match(/(\d+\s*[-–]\s*\d+)/);
          if (rangeMatch) {
            const compact = rangeMatch[1].replace(/\s+/g, "");
            timingTokens.push(compact, `${compact} min`, `Est. ${compact} Min`);
          }
        }
        if (Array.isArray(timings.estadosAlcanzados)) {
          timings.estadosAlcanzados.forEach((st) => {
            if (st?.label) timingTokens.push(st.label);
            if (st?.hora) timingTokens.push(st.hora);
            if (st?.label && st?.hora) timingTokens.push(`${st.label}: ${st.hora}`);
          });
        }
      }

      const hasObs = Boolean(o.observaciones && String(o.observaciones).trim());
      const obsText = hasObs ? o.observaciones : "sin_observaciones sin observaciones";
      const hasMesa = Boolean(o.mesa && String(o.mesa).trim());
      const mesaText = hasMesa ? `${o.mesa} mesa ${o.mesa} #${o.mesa}` : "sin_mesa sin mesa para llevar llevar recoger domicilio";
      const responsableLabel = o.cocinero || o.responsableCocina || o.responsable || "Chef de Turno";
      const hasCook = Boolean((o.cocinero || o.responsableCocina || o.responsable) && String(o.cocinero || o.responsableCocina || o.responsable).trim());
      const cookText = hasCook ? responsableLabel : `${responsableLabel} sin_cocinero sin cocinero sin_responsable sin responsable`;

      return matchesSmartSearch(
        [
          o.codigo || `OP-00${o.id}`,
          ...formatIdTokens(o.id || o.idVenta),
          ...extractKitchenSearchTokens(o),
          o.platilloNombre,
          o.cliente || "Cliente Mostrador",
          responsableLabel,
          cookText,
          formatStatusTokens(o.estado),
          o.estado,
          modalidadTokens,
          nextActionTokens,
          ...timingTokens,
          o.horaInicio,
          o.horaEstado,
          o.fecha,
          o.tiempo,
          o.mesa,
          mesaText,
          o.tipo,
          o.cantidad || 1,
          `x${o.cantidad || 1}`,
          `${o.cantidad || 1} unidades`,
          o.prioridad ? `#${o.prioridad} Turno #${o.prioridad} Turno ${o.prioridad}` : "-",
          o.observaciones,
          obsText,
          prodsString
        ],
        searchTerm
      );
    });
  }, [serverPaginated, ordenes, searchTerm, filterEstado]);

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
