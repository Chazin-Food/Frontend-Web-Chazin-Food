import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Hook que convierte la URL (query params) en la única fuente de la verdad
 * para los filtros, pestañas, búsquedas y paginación de cada módulo.
 *
 * - Omite de la URL los valores que coinciden con su valor por defecto (URLs limpias).
 * - Reinicia `page` a 1 automáticamente al modificar cualquier filtro/búsqueda.
 * - Usa `replace: true` para no ensuciar el historial del navegador al escribir.
 */
export function useUrlFilters(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
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
  }, [searchParams, defaults]);

  const setFilter = useCallback(
    (key, valueOrUpdater, options = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const defVal = defaults[key];
          const rawPrev = prev.get(key);
          const currentVal =
            rawPrev === null
              ? defVal
              : typeof defVal === "number"
              ? (Number.isFinite(Number(rawPrev)) && Number(rawPrev) > 0 ? Number(rawPrev) : defVal)
              : typeof defVal === "boolean"
              ? (rawPrev === "true" || rawPrev === "1")
              : rawPrev;

          const value = typeof valueOrUpdater === "function" ? valueOrUpdater(currentVal) : valueOrUpdater;
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

          // Al cambiar un filtro distinto de `page`, reiniciar paginación a 1
          if (key !== "page" && options.resetPage !== false && Object.prototype.hasOwnProperty.call(defaults, "page")) {
            next.delete("page");
          }

          return next;
        },
        { replace: options.replace !== false }
      );
    },
    [setSearchParams, defaults]
  );

  const setFilters = useCallback(
    (patch = {}, options = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          let changedNonPage = false;
          for (const [key, value] of Object.entries(patch)) {
            if (key !== "page") changedNonPage = true;
            const defVal = defaults[key];
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
          if (
            changedNonPage &&
            !Object.prototype.hasOwnProperty.call(patch, "page") &&
            options.resetPage !== false &&
            Object.prototype.hasOwnProperty.call(defaults, "page")
          ) {
            next.delete("page");
          }
          return next;
        },
        { replace: options.replace !== false }
      );
    },
    [setSearchParams, defaults]
  );

  const resetFilters = useCallback(
    (keysToKeep = []) => {
      const keepSet = new Set(keysToKeep);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams();
          for (const k of keepSet) {
            const v = prev.get(k);
            if (v !== null) next.set(k, v);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { filters, setFilter, setFilters, resetFilters, searchParams };
}
