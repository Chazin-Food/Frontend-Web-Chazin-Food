import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import {
  validateDireccionMedellin,
  verifyDireccionMedellinRealtime
} from "@/shared/utils/validationUtils";

/**
 * Hook de validación híbrida para direcciones de Medellín / Valle de Aburrá:
 * 1) Validación síncrona instantánea de nomenclatura vial colombiana.
 * 2) Verificación asíncrona con ArcGIS REST + Nominatim (debounce 400 ms).
 */
export function useMedellinAddressValidation(direccion = "", { required = false } = {}) {
  const normalized = String(direccion || "").trim();
  const syncResult = validateDireccionMedellin(normalized, { required });

  const [asyncState, setAsyncState] = useState({
    status: "idle", // "idle" | "checking" | "verified" | "invalid" | "offline"
    info: null,
    apiError: ""
  });

  useEffect(() => {
    if (!normalized) {
      setAsyncState({ status: "idle", info: null, apiError: "" });
      return;
    }

    if (!syncResult.isValid) {
      setAsyncState({ status: "idle", info: null, apiError: "" });
      return;
    }

    const controller = new AbortController();
    setAsyncState((prev) => ({ ...prev, status: "checking", apiError: "" }));

    const timer = setTimeout(async () => {
      try {
        const res = await verifyDireccionMedellinRealtime(normalized, {
          signal: controller.signal
        });
        if (controller.signal.aborted) return;

        if (res.offlineFallback) {
          setAsyncState({ status: "offline", info: res, apiError: "" });
        } else if (res.isValid && res.verified) {
          setAsyncState({ status: "verified", info: res, apiError: "" });
        } else {
          setAsyncState({
            status: "invalid",
            info: null,
            apiError: res.error || "No pudimos ubicar esa dirección en Medellín."
          });
        }
      } catch (err) {
        if (controller.signal.aborted || err?.name === "AbortError") return;
        setAsyncState({
          status: "offline",
          info: { ciudad: "Medellín" },
          apiError: ""
        });
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [normalized, syncResult.isValid]);

  const error = syncResult.error || asyncState.apiError || "";
  const isValid = syncResult.isValid && asyncState.status !== "invalid";

  return {
    status: asyncState.status,
    isValid,
    error,
    verifiedInfo: asyncState.info
  };
}

/**
 * Indicador visual compacto del estado de verificación de dirección en Medellín.
 */
export function MedellinAddressStatus({
  status = "idle",
  error = "",
  verifiedInfo = null,
  showError = true
}) {
  if (showError && error) {
    return (
      <p className="mt-1.5 flex items-start gap-1 text-[11px] font-semibold text-red-500 dark:text-red-400">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>{error}</span>
      </p>
    );
  }

  if (status === "checking") {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        <span>Verificando dirección en Medellín en tiempo real...</span>
      </p>
    );
  }

  if (status === "verified" && verifiedInfo) {
    const ciudad = verifiedInfo.ciudad || "Medellín";
    const barrioText = verifiedInfo.barrio ? ` · Barrio ${verifiedInfo.barrio}` : "";
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>
          Dirección verificada en {ciudad}
          {barrioText}
        </span>
      </p>
    );
  }

  if (status === "offline") {
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600/90 dark:text-emerald-400/90">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        <span>Formato vial de Medellín válido</span>
      </p>
    );
  }

  return null;
}

export default MedellinAddressStatus;
