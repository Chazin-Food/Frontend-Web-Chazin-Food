import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

function resolveFiltersFromParams(searchParams, defaults) {
  const resolved = {};
  for (const [key, defVal] of Object.entries(defaults)) {
    const raw = searchParams.get(key);
    if (raw === null) {
      resolved[key] = defVal;
    } else if (typeof defVal === "number") {
      const parsed = Number(raw);
      resolved[key] = Number.isFinite(parsed) && parsed > 0 ? parsed : defVal;
    } else if (typeof defVal === "boolean") {
      resolved[key] = raw === "true" || raw === "1";
    } else {
      resolved[key] = raw;
    }
  }
  return resolved;
}

function buildParamsFromFilters(prevParams, nextFilters, defaults) {
  const next = new URLSearchParams(prevParams);
  for (const [key, defVal] of Object.entries(defaults)) {
    const value = nextFilters[key];
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      String(value) === String(defVal);
    if (isEmpty) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }
  return next;
}

function areFiltersEqual(a, b, defaults) {
  for (const key of Object.keys(defaults)) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/**
 * Hook que mantiene la URL (query params) sincronizada con el estado de filtros,
 * pestañas, búsquedas y paginación de cada módulo.
 *
 * - Mantiene estado local síncrono para que los `<input>` controlados nunca
 *   pierdan la posición del cursor al escribir en medio o al inicio del texto
 *   (evitando el clásico salto del cursor al final por updates asíncronos de React Router).
 * - Omite de la URL los valores que coinciden con su valor por defecto (URLs limpias).
 * - Reinicia `page` a 1 automáticamente al modificar cualquier filtro/búsqueda.
 * - Usa `replace: true` para no ensuciar el historial del navegador al escribir.
 */
export function useUrlFilters(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;

  const [filters, setLocalFilters] = useState(() =>
    resolveFiltersFromParams(searchParams, defaults)
  );

  // Refs para evitar condiciones de carrera entre tecleo rápido y transiciones de React Router
  const latestFiltersRef = useRef(filters);
  latestFiltersRef.current = filters;
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const syncTimerRef = useRef(null);
  const expectedQueryRef = useRef(null);
  const dispatchedQueriesRef = useRef(new Set());

  const scheduleUrlSync = useCallback(
    (nextFilters, { replace = true, immediate = false } = {}) => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }

      const commit = () => {
        syncTimerRef.current = null;
        const nextParams = buildParamsFromFilters(
          searchParamsRef.current,
          nextFilters,
          defaultsRef.current
        );
        const nextStr = nextParams.toString();
        const currStr = searchParamsRef.current.toString();
        if (nextStr === currStr) {
          expectedQueryRef.current = null;
          dispatchedQueriesRef.current.clear();
          return;
        }
        expectedQueryRef.current = nextStr;
        dispatchedQueriesRef.current.add(nextStr);
        setSearchParams(nextParams, { replace });
      };

      if (immediate) {
        commit();
      } else {
        // Pequeño agrupamiento al escribir texto para evitar saturar history.replaceState y transiciones
        syncTimerRef.current = setTimeout(commit, 120);
      }
    },
    [setSearchParams]
  );

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // Sincronizar cambios EXTERNOS de URL (ej: navegación por <Link>, botón Atrás/Adelante del navegador)
  const currentQueryString = searchParams.toString();
  useEffect(() => {
    // Si hay una escritura pendiente desde tecleo local, no sobrescribir el estado local
    if (syncTimerRef.current) return;

    // Si el cambio de URL corresponde al que acabamos de despachar nosotros, limpiar marca y no sobrescribir
    if (expectedQueryRef.current !== null && currentQueryString === expectedQueryRef.current) {
      expectedQueryRef.current = null;
      dispatchedQueriesRef.current.clear();
      return;
    }

    // Si llega una transición intermedia anterior nuestra mientras esperamos otra más reciente, ignorarla
    if (dispatchedQueriesRef.current.has(currentQueryString)) {
      dispatchedQueriesRef.current.delete(currentQueryString);
      return;
    }

    expectedQueryRef.current = null;
    dispatchedQueriesRef.current.clear();
    const fromUrl = resolveFiltersFromParams(searchParams, defaultsRef.current);
    setLocalFilters((prev) =>
      areFiltersEqual(prev, fromUrl, defaultsRef.current) ? prev : fromUrl
    );
  }, [currentQueryString, searchParams]);

  const setFilter = useCallback(
    (key, valueOrUpdater, options = {}) => {
      const defs = defaultsRef.current;
      const prev = latestFiltersRef.current;
      const rawValue =
        typeof valueOrUpdater === "function" ? valueOrUpdater(prev[key]) : valueOrUpdater;

      const defVal = defs[key];
      let normalizedVal = rawValue;
      if (rawValue === undefined || rawValue === null) {
        normalizedVal = defVal;
      } else if (typeof defVal === "number") {
        const parsed = Number(rawValue);
        normalizedVal = Number.isFinite(parsed) && parsed > 0 ? parsed : defVal;
      } else if (typeof defVal === "boolean") {
        normalizedVal = Boolean(rawValue);
      } else {
        normalizedVal = String(rawValue);
      }

      const nextFilters = { ...prev, [key]: normalizedVal };

      // Al cambiar un filtro distinto de `page`, reiniciar paginación a 1
      if (
        key !== "page" &&
        options.resetPage !== false &&
        Object.prototype.hasOwnProperty.call(defs, "page")
      ) {
        nextFilters.page = defs.page;
      }

      latestFiltersRef.current = nextFilters;
      setLocalFilters(nextFilters);

      const isTextSearchKey = key === "q" || key === "search";
      scheduleUrlSync(nextFilters, {
        replace: options.replace !== false,
        immediate: !isTextSearchKey
      });
    },
    [scheduleUrlSync]
  );

  const setFilters = useCallback(
    (patch = {}, options = {}) => {
      const defs = defaultsRef.current;
      const prev = latestFiltersRef.current;
      const nextFilters = { ...prev };
      let changedNonPage = false;

      for (const [key, rawValue] of Object.entries(patch)) {
        if (key !== "page") changedNonPage = true;
        const defVal = defs[key];
        if (rawValue === undefined || rawValue === null) {
          nextFilters[key] = defVal;
        } else if (typeof defVal === "number") {
          const parsed = Number(rawValue);
          nextFilters[key] = Number.isFinite(parsed) && parsed > 0 ? parsed : defVal;
        } else if (typeof defVal === "boolean") {
          nextFilters[key] = Boolean(rawValue);
        } else {
          nextFilters[key] = String(rawValue);
        }
      }

      if (
        changedNonPage &&
        !Object.prototype.hasOwnProperty.call(patch, "page") &&
        options.resetPage !== false &&
        Object.prototype.hasOwnProperty.call(defs, "page")
      ) {
        nextFilters.page = defs.page;
      }

      latestFiltersRef.current = nextFilters;
      setLocalFilters(nextFilters);

      scheduleUrlSync(nextFilters, {
        replace: options.replace !== false,
        immediate: true
      });
    },
    [scheduleUrlSync]
  );

  const resetFilters = useCallback(
    (keysToKeep = []) => {
      const defs = defaultsRef.current;
      const prev = latestFiltersRef.current;
      const keepSet = new Set(keysToKeep);
      const nextFilters = { ...defs };
      for (const k of keepSet) {
        if (k in prev) nextFilters[k] = prev[k];
      }

      latestFiltersRef.current = nextFilters;
      setLocalFilters(nextFilters);

      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }

      const next = new URLSearchParams();
      for (const k of keepSet) {
        const v = searchParamsRef.current.get(k);
        if (v !== null) next.set(k, v);
      }
      const nextStr = next.toString();
      expectedQueryRef.current = nextStr;
      dispatchedQueriesRef.current.add(nextStr);
      setSearchParams(next, { replace: true });
    },
    [setSearchParams]
  );

  return { filters, setFilter, setFilters, resetFilters, searchParams };
}
