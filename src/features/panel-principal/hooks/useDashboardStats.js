import { useState, useEffect, useCallback, useRef } from "react";
import { dashboardService } from "../servicios/dashboardService";

export function useDashboardStats() {
  const [periodo, setPeriodo] = useState("este_mes");
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({
    totalVentasGlobal: 0,
    ventasTotal: 0,
    ventasMesActual: 0,
    ventasVariacion: 0,
    pedidosTotal: 0,
    pedidosVariacion: 0,
    frecuenciaVentas: 0,
    clientesTotal: 0,
    clientesActivos: 0,
    usuariosTotal: 0,
    usuariosActivos: 0,
    clientesVariacion: 0,
    productosTotal: 0,
    insumosBajoStock: 0,
    divisa: "COP"
  });
  const [ventasChart, setVentasChart] = useState([]);
  const [productosPopulares, setProductosPopulares] = useState([]);
  const [alertasStock, setAlertasStock] = useState([]);
  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [devolucionesPendientes, setDevolucionesPendientes] = useState([]);
  const [comentariosObservaciones, setComentariosObservaciones] = useState({
    promedioGlobal: 0,
    totalResenas: 0,
    resenas: [],
    observaciones: []
  });
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (isSilent && (isFetchingRef.current || (typeof document !== "undefined" && document.hidden))) {
      return;
    }
    isFetchingRef.current = true;
    try {
      if (!isSilent) setLoading(true);
      const params = { periodo, year };
      const [statsRes, chartRes, popRes, alertasRes, recientesRes, feedbackRes, devPendRes] = await Promise.all([
        dashboardService.getStats(params).catch(() => null),
        dashboardService.getVentasChart(params).catch(() => []),
        dashboardService.getProductosPopulares(params).catch(() => []),
        dashboardService.getAlertasStock(params).catch(() => []),
        dashboardService.getVentasRecientes(params).catch(() => []),
        dashboardService.getComentariosObservaciones(params).catch(() => null),
        dashboardService.getDevolucionesPendientes().catch(() => [])
      ]);

      if (statsRes) setStats(statsRes);
      if (Array.isArray(chartRes)) setVentasChart(chartRes);
      if (Array.isArray(popRes)) setProductosPopulares(popRes);
      if (Array.isArray(alertasRes)) setAlertasStock(alertasRes);
      if (Array.isArray(recientesRes)) setVentasRecientes(recientesRes);
      if (Array.isArray(devPendRes)) setDevolucionesPendientes(devPendRes);
      if (feedbackRes && typeof feedbackRes === "object") {
        setComentariosObservaciones({
          promedioGlobal: Number(feedbackRes.promedioGlobal || 0),
          totalResenas: Number(feedbackRes.totalResenas || 0),
          resenas: Array.isArray(feedbackRes.resenas) ? feedbackRes.resenas : [],
          observaciones: Array.isArray(feedbackRes.observaciones) ? feedbackRes.observaciones : []
        });
      }
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      isFetchingRef.current = false;
      if (!isSilent) setLoading(false);
    }
  }, [periodo, year]);

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 20000);

    const handleVisibilityOrFocus = () => {
      if (typeof document === "undefined" || !document.hidden) {
        fetchDashboardData(true);
      }
    };
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [fetchDashboardData]);

  return {
    stats,
    ventasChart,
    productosPopulares,
    alertasStock,
    ventasRecientes,
    devolucionesPendientes,
    comentariosObservaciones,
    loading,
    periodo,
    setPeriodo,
    year,
    setYear,
    refetch: fetchDashboardData
  };
}
