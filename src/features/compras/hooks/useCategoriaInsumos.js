import { useState, useEffect, useCallback, useMemo } from "react";
import { categoriaInsumosService } from "../servicios/categoriaInsumosService";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { matchesSmartSearch, formatStatusTokens, formatIdTokens, rankSearchResults, normalizeSearchText } from "@/shared/utils/searchUtils";

export function useCategoriaInsumos() {
  const notify = useNotifications();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");

  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoriaInsumosService.getCategorias();
      setCategorias(data || []);
    } catch (err) {
      console.error(err);
      notify.error("Error", err.message || "Fallo de conexión al cargar categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const filteredCategorias = useMemo(() => {
    const hasSearch = Boolean(searchTerm && searchTerm.trim());

    const baseFiltered = categorias.filter((c) => {
      const isActivo = c.estado === "Activo" || c.estado === 1 || c.estado === "1";

      if (!hasSearch && filterEstado !== "Todos") {
        if (filterEstado === "Activo" && !isActivo) return false;
        if (filterEstado === "Inactivo" && isActivo) return false;
      }

      const count = Number(c.insumosCount ?? c.cantidad ?? (c.insumos?.length || 0));
      const insumosNames = Array.isArray(c.insumos)
        ? c.insumos.map((i) => (typeof i === "object" ? i.nombre : String(i))).join(" ")
        : "";

      const hasDesc = Boolean(c.descripcion && String(c.descripcion).trim());
      const descText = hasDesc ? `${c.descripcion} con_descripcion con descripcion` : "sin_descripcion sin descripcion";

      return matchesSmartSearch(
        [
          c.nombre,
          descText,
          formatStatusTokens(c.estado),
          count,
          String(count),
          `${count} insumos`,
          `${count} insumo`,
          ...formatIdTokens(c.id || c.idCategoriaInsumo),
          insumosNames
        ],
        searchTerm
      );
    });

    if (!hasSearch) {
      return baseFiltered;
    }

    return rankSearchResults(baseFiltered, searchTerm, (c, normQuery, tokens) => {
      let extra = 0;
      const desc = normalizeSearchText(c.descripcion || "");
      if (desc && desc.includes(normQuery)) extra += 250;

      // Coincidencia con nombre de insumos pertenecientes
      if (Array.isArray(c.insumos)) {
        c.insumos.forEach((i) => {
          const iNom = normalizeSearchText(typeof i === "object" ? i.nombre : String(i));
          if (iNom && tokens.some((t) => iNom.includes(t))) extra += 300;
        });
      }

      return extra;
    });
  }, [categorias, searchTerm, filterEstado]);

  const createCategoria = async (form) => {
    try {
      await categoriaInsumosService.createCategoria(form);
      notify.success("Categoría creada", "La categoría se creó exitosamente");
      await fetchCategorias();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo guardar la categoría");
      return false;
    }
  };

  const updateCategoria = async (id, form) => {
    try {
      await categoriaInsumosService.updateCategoria(id, form);
      notify.success("Categoría actualizada", "Los cambios fueron guardados exitosamente");
      await fetchCategorias();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo actualizar la categoría");
      return false;
    }
  };

  const toggleEstadoCategoria = async (cat) => {
    if (!cat) return false;
    const id = cat.id ?? cat.idCategoriaInsumo;
    const isActivo = cat.estado === "Activo" || cat.estado === 1 || cat.estado === "1" || cat.estado === true;
    const nuevoEstado = isActivo ? "Inactivo" : "Activo";

    if (nuevoEstado === "Inactivo") {
      const confirmed = await notify.confirmAction(
        "¿Inhabilitar categoría?",
        `¿Estás seguro de que deseas inhabilitar "${cat.nombre}"? No estará disponible al registrar nuevos insumos hasta que vuelva a habilitarse.`,
        "Sí, inhabilitar"
      );
      if (!confirmed) return false;
    }

    try {
      const updated = await categoriaInsumosService.updateCategoria(id, { estado: nuevoEstado });
      setCategorias((prev) =>
        prev.map((item) => {
          const itemId = item.id ?? item.idCategoriaInsumo;
          if (Number(itemId) !== Number(id)) return item;
          return {
            ...item,
            ...(updated && typeof updated === "object" ? updated : {}),
            estado: updated?.estado || nuevoEstado
          };
        })
      );
      notify.success(
        nuevoEstado === "Activo" ? "Categoría habilitada" : "Categoría inhabilitada",
        nuevoEstado === "Activo"
          ? `La categoría "${cat.nombre}" quedó habilitada nuevamente.`
          : `La categoría "${cat.nombre}" fue inhabilitada correctamente.`
      );
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo cambiar el estado de la categoría");
      return false;
    }
  };

  const deleteCategoria = async (id, nombre) => {
    const confirmed = await notify.confirmDelete(
      "¿Eliminar categoría?",
      `¿Estás seguro de que deseas eliminar la categoría "${nombre}"?`
    );
    if (!confirmed) return false;
    try {
      await categoriaInsumosService.deleteCategoria(id);
      notify.success("Categoría eliminada", "La categoría ha sido eliminada del sistema");
      await fetchCategorias();
      return true;
    } catch (err) {
      notify.error("Error", err.message || "No se pudo eliminar la categoría");
      return false;
    }
  };

  return {
    categorias,
    filteredCategorias,
    loading,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    refetch: fetchCategorias,
    createCategoria,
    updateCategoria,
    toggleEstadoCategoria,
    deleteCategoria
  };
}
